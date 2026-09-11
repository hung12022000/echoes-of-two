import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import type { Scene } from '@babylonjs/core/scene';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { cropOverallProgress, SHARK_WARNING_SECONDS, type BuildingRecord, type CraftJob, type CropPlot, type NearbyResource, type SharkRaidState, type Weather } from '../oceanbound/session';
import { CROPS } from '../oceanbound/catalog';
import { isOnStarterRaft, starterRaftFrame, terrainHeight } from './terrain';
import { mat } from './temple';
import { createDetailedItemModel } from './itemModels';

interface ResourceNode extends NearbyResource { mesh: TransformNode; phase: number; respawnAt: number }

const RESOURCE_LAYOUT = [
  ['driftwood', -8, 51], ['fiber', 7, 52], ['plastic', 13, 58], ['stone', -14, 45],
  ['scrap', -23, 58], ['coconut', 19, 40], ['driftwood', 27, 52], ['fiber', -30, 38],
  ['plastic', 33, 29], ['stone', -35, 19], ['scrap', 38, 9], ['fish', -45, 63],
  ['bamboo', -39, 34], ['herb', -31, 31], ['clay', 31, 22], ['shell', 43, 18],
  ['seaweed', 38, 11], ['driftwood', 2, 81], ['plastic', -3, 82], ['fiber', 3, 79],
] as const;

function addBox(parent: TransformNode, scene: Scene, name: string, size: Vector3, position: Vector3, material: ReturnType<typeof mat>) {
  const mesh = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, scene);
  mesh.parent = parent; mesh.position.copyFrom(position); mesh.material = material; return mesh;
}

export function createOceanboundWorld(scene: Scene, shadows: ShadowGenerator) {
  const wood = mat(scene, 'oceanbound weathered wood', '#79543a', 0, 0.82);
  const woodLight = mat(scene, 'oceanbound sunlit wood', '#ad7a49', 0, 0.78);
  const rope = mat(scene, 'oceanbound rope', '#c5a86f', 0, 0.9);
  const cloth = mat(scene, 'oceanbound plain canvas', '#e8d9b8', 0, 0.88); cloth.backFaceCulling = false;
  const sailCloth = mat(scene, 'crafted Hung Mei sail', '#f7ecd0', 0, 0.84); sailCloth.backFaceCulling = false;
  const sailTexture = new DynamicTexture('stitched Hung Mei sail canvas', { width: 1024, height: 1024 }, scene, true);
  const sailPaint = sailTexture.getContext();
  const sailGradient = sailPaint.createLinearGradient(0, 0, 1024, 1024);
  sailGradient.addColorStop(0, '#f4e9cc'); sailGradient.addColorStop(.52, '#dfc996'); sailGradient.addColorStop(1, '#b99363');
  sailPaint.fillStyle = sailGradient; sailPaint.fillRect(0, 0, 1024, 1024);
  sailPaint.globalAlpha = .24;
  for (let y = 18; y < 1024; y += 24) { sailPaint.strokeStyle = y % 48 ? '#fff7dd' : '#76563c'; sailPaint.lineWidth = 2; sailPaint.beginPath(); sailPaint.moveTo(0, y); for (let x = 64; x <= 1024; x += 64) sailPaint.lineTo(x, y + Math.sin(x * .018) * 5); sailPaint.stroke(); }
  sailPaint.globalAlpha = 1; sailPaint.strokeStyle = '#6d4732'; sailPaint.lineWidth = 16; sailPaint.strokeRect(20, 20, 984, 984);
  sailPaint.strokeStyle = '#e36f79'; sailPaint.lineWidth = 10; sailPaint.strokeRect(42, 42, 940, 940);
  sailPaint.fillStyle = '#7e2f3f'; sailPaint.font = '900 106px Georgia'; sailPaint.fillText('HƯNG  ♥  MEI.100', 92, 474);
  sailPaint.fillStyle = '#234f59'; sailPaint.font = '700 47px sans-serif'; sailPaint.fillText('O C E A N B O U N D', 208, 560);
  sailPaint.fillStyle = '#e36f79'; sailPaint.beginPath(); sailPaint.arc(512, 330, 72, 0, Math.PI * 2); sailPaint.fill();
  sailPaint.fillStyle = '#ffe5a6'; sailPaint.beginPath(); sailPaint.arc(512, 330, 43, 0, Math.PI * 2); sailPaint.fill();
  sailTexture.update(); sailCloth.albedoTexture = sailTexture;
  const metal = mat(scene, 'oceanbound metal', '#657581', 0.55, 0.34);
  const leaf = mat(scene, 'oceanbound fiber', '#5f9345', 0, 0.92);
  const plastic = mat(scene, 'oceanbound recycled plastic', '#df8b55', 0, 0.66);
  const stone = mat(scene, 'oceanbound stone', '#686d68', 0, 0.96);
  const water = mat(scene, 'oceanbound water container', '#52d5da', 0.1, 0.22); water.alpha = 0.8;
  const dark = mat(scene, 'oceanbound shark', '#274b59', 0, 0.72);
  const coral = mat(scene, 'oceanbound coral', '#e98775', 0, 0.78);
  // Shared PBR surfaces keep the creature readable in sun, storm and moonlight
  // without turning every anatomical detail into a separate material/draw call.
  const sharkSkin = mat(scene, 'shark wet dorsal skin', '#315968', 0.03, 0.42);
  const sharkBelly = mat(scene, 'shark pale ventral skin', '#9eb9b7', 0.01, 0.58);
  const sharkEye = mat(scene, 'shark glass eye', '#05090b', 0.18, 0.08);
  const sharkGum = mat(scene, 'shark gum', '#7d3040', 0, 0.62);
  const sharkTooth = mat(scene, 'shark tooth enamel', '#f1ead2', 0, 0.3);

  const raft = new TransformNode('starter raft', scene); raft.position.set(0, -1.55, 81);
  // A compact, handmade starter raft: uneven planks, floating logs and visible lashings.
  for (let index = 0; index < 10; index++) {
    const plank = addBox(raft, scene, 'hand-hewn raft plank', new Vector3(4.55 - (index % 3) * .11, 0.14 + (index % 2) * .025, .43), new Vector3((index % 2) * .035 - .02, Math.sin(index * 2.1) * .025, -2.03 + index * .45), index % 3 ? woodLight : wood);
    plank.rotation.y = Math.sin(index * 1.7) * .018; shadows.addShadowCaster(plank);
  }
  for (const x of [-1.68, 0, 1.68]) {
    const log = MeshBuilder.CreateCylinder('buoyant raft log', { height: 4.75, diameter: .34, tessellation: 10 }, scene); log.parent = raft; log.position.set(x, -.26, 0); log.rotation.x = Math.PI / 2; log.material = wood; shadows.addShadowCaster(log);
  }
  for (const z of [-1.55, 0, 1.55]) for (const x of [-1.68, 0, 1.68]) {
    const lashing = MeshBuilder.CreateTorus('rope lashing', { diameter: .43, thickness: .035, tessellation: 12 }, scene); lashing.parent = raft; lashing.position.set(x, -.11, z); lashing.rotation.x = Math.PI / 2; lashing.material = rope;
  }
  for (const x of [-2.15, 2.15]) for (const z of [-2.08, 2.08]) {
    const post = MeshBuilder.CreateCylinder('raft corner post', { height: .9, diameter: .12, tessellation: 8 }, scene); post.parent = raft; post.position.set(x, .42, z); post.material = wood;
  }
  for (const z of [-2.08, 2.08]) {
    const rail = MeshBuilder.CreateCylinder('raft rope rail', { height: 4.25, diameter: .045, tessellation: 8 }, scene); rail.parent = raft; rail.position.set(0, .72, z); rail.rotation.z = Math.PI / 2; rail.material = rope;
  }
  const nodes: ResourceNode[] = RESOURCE_LAYOUT.map(([item, x, z], index) => {
    const y = z > 76 ? -1.82 : terrainHeight(x, z) + 0.45;
    const mesh = createDetailedItemModel(scene, shadows, item, { wood, woodLight, rope, metal, rust: metal, dark, leaf, leafLight: leaf, plastic, stone, clay: coral, shell: cloth, fish: water, coral, water, cloth });
    mesh.scaling.setAll(item === 'fish' || item === 'driftwood' || item === 'bamboo' ? .78 : .92);
    mesh.position.set(x, y, z); mesh.rotation.set(index * 0.3, index * 0.8, index * 0.13);
    const halo = MeshBuilder.CreateTorus('resource glint', { diameter: 1.25, thickness: 0.035, tessellation: 24 }, scene); halo.parent = mesh; halo.rotation.x = Math.PI / 2; halo.material = water;
    return { nodeId: `node-${index}`, item, amount: item === 'scrap' ? 1 : 2, mesh, phase: index * 0.77, respawnAt: 0 };
  });

  const shark = new TransformNode('reef shark threat', scene);
  const mergeCreatureSurface = (name: string, meshes: Mesh[], parent: TransformNode, material: ReturnType<typeof mat>) => {
    for (const mesh of meshes) { mesh.parent = null; mesh.computeWorldMatrix(true); }
    const merged = meshes.length === 1 ? meshes[0] : Mesh.MergeMeshes(meshes, true, true);
    if (!merged) throw new Error(`Unable to merge creature surface: ${name}`);
    merged.name = name; merged.parent = parent; merged.material = material; merged.isPickable = false;
    return merged;
  };
  const sharkSkinParts: Mesh[] = [];
  const sharkTorso = MeshBuilder.CreateCapsule('shark tapered torso', { height: 3.85, radius: 0.62, tessellation: 14, subdivisions: 2 }, scene);
  sharkTorso.position.z = -.18; sharkTorso.rotation.x = Math.PI / 2; sharkTorso.scaling.set(1, .86, 1); sharkSkinParts.push(sharkTorso);
  const sharkBellyPatch = MeshBuilder.CreateSphere('shark pale belly', { diameterX: 1.14, diameterY: .42, diameterZ: 3.05, segments: 12 }, scene);
  sharkBellyPatch.parent = shark; sharkBellyPatch.position.set(0, -.38, .13); sharkBellyPatch.material = sharkBelly;
  const sharkSnout = MeshBuilder.CreateSphere('shark blunt snout', { diameterX: 1.05, diameterY: .72, diameterZ: 1.12, segments: 12 }, scene);
  sharkSnout.position.set(0, -.01, 1.72); sharkSnout.scaling.z = 1.08; sharkSkinParts.push(sharkSnout);
  const dorsalFin = MeshBuilder.CreateCylinder('shark dorsal fin', { height: 1.22, diameterTop: 0, diameterBottom: .9, tessellation: 3 }, scene);
  dorsalFin.position.set(0, .71, -.3); dorsalFin.rotation.y = Math.PI / 2; sharkSkinParts.push(dorsalFin);
  const sharkEyes: Mesh[] = [], sharkEyeGlints: Mesh[] = [], sharkGills: Mesh[] = [];
  for (const side of [-1, 1]) {
    const pectoral = MeshBuilder.CreateCylinder('shark swept pectoral fin', { height: 1.35, diameterTop: 0, diameterBottom: .72, tessellation: 3 }, scene);
    pectoral.position.set(side * .68, -.12, .2); pectoral.rotation.z = side * Math.PI / 2; pectoral.rotation.y = side * -.38; pectoral.scaling.z = .42; sharkSkinParts.push(pectoral);
    const eye = MeshBuilder.CreateSphere('shark eye', { diameter: .115, segments: 10 }, scene);
    eye.position.set(side * .49, .19, 1.43); eye.scaling.z = .46; sharkEyes.push(eye);
    const eyeGlint = MeshBuilder.CreateSphere('shark eye glint', { diameter: .025, segments: 6 }, scene);
    eyeGlint.position.set(side * .532, .21, 1.461); sharkEyeGlints.push(eyeGlint);
    for (let gillIndex = 0; gillIndex < 3; gillIndex++) {
      const gill = MeshBuilder.CreateCapsule('shark gill slit', { height: .31 - gillIndex * .025, radius: .018, tessellation: 6 }, scene);
      gill.position.set(side * .535, .02, .89 - gillIndex * .16); gill.rotation.z = side * .14; sharkGills.push(gill);
    }
  }
  const tailStem = MeshBuilder.CreateCylinder('shark tail peduncle', { height: 1.28, diameterTop: .24, diameterBottom: .4, tessellation: 10 }, scene);
  tailStem.position.set(0, 0, -2.12); tailStem.rotation.x = Math.PI / 2; sharkSkinParts.push(tailStem);
  const tailJoint = new TransformNode('shark articulated tail', scene); tailJoint.parent = shark; tailJoint.position.z = -2.78;
  const tailLobes: Mesh[] = [];
  for (const vertical of [-1, 1]) {
    const tailLobe = MeshBuilder.CreateCylinder('shark crescent tail lobe', { height: vertical > 0 ? 1.35 : 1.05, diameterTop: 0, diameterBottom: .68, tessellation: 3 }, scene);
    tailLobe.position.y = vertical * (vertical > 0 ? .55 : .42); tailLobe.rotation.z = vertical > 0 ? Math.PI : 0; tailLobe.rotation.y = Math.PI / 2; tailLobe.scaling.z = .38; tailLobes.push(tailLobe);
  }
  const jaw = new TransformNode('shark articulated lower jaw', scene); jaw.parent = shark; jaw.position.set(0, -.28, 1.9);
  const mouth = MeshBuilder.CreateSphere('shark mouth cavity', { diameterX: .7, diameterY: .22, diameterZ: .43, segments: 10 }, scene);
  mouth.parent = jaw; mouth.position.set(0, 0, .03); mouth.material = sharkGum;
  const lowerJaw = MeshBuilder.CreateCapsule('shark lower jaw', { height: .76, radius: .14, tessellation: 10 }, scene);
  lowerJaw.parent = jaw; lowerJaw.position.set(0, -.1, .02); lowerJaw.rotation.z = Math.PI / 2; lowerJaw.material = sharkBelly;
  const sharkTeeth: Mesh[] = [];
  for (let toothIndex = 0; toothIndex < 10; toothIndex++) {
    const side = toothIndex % 2 ? 1 : -1;
    const row = Math.floor(toothIndex / 2);
    const tooth = MeshBuilder.CreateCylinder('shark triangular tooth', { height: .105, diameterTop: 0, diameterBottom: .065, tessellation: 5 }, scene);
    tooth.position.set(side * (.08 + row * .055), .015, .16 - row * .035); tooth.rotation.z = Math.PI; sharkTeeth.push(tooth);
  }
  mergeCreatureSurface('shark dorsal surface batch', sharkSkinParts, shark, sharkSkin);
  mergeCreatureSurface('shark eyes batch', sharkEyes, shark, sharkEye);
  mergeCreatureSurface('shark eye highlights batch', sharkEyeGlints, shark, sharkTooth);
  mergeCreatureSurface('shark gill slits batch', sharkGills, shark, sharkGum);
  mergeCreatureSurface('shark tail silhouette batch', tailLobes, tailJoint, sharkSkin);
  mergeCreatureSurface('shark teeth batch', sharkTeeth, jaw, sharkTooth);
  shark.position.y = -1.95;
  const sharkWake = new TransformNode('shark attack wake', scene); sharkWake.setEnabled(false);
  const wakeFoam = Array.from({ length: 9 }, (_, index) => { const foam = MeshBuilder.CreateIcoSphere('shark wake foam', { radius: .06 + index % 3 * .025, subdivisions: 1 }, scene); foam.parent = sharkWake; foam.material = cloth; return foam; });
  const wakeRings = Array.from({ length: 2 }, (_, index) => { const ring = MeshBuilder.CreateTorus('shark pressure wake', { diameter: 1.4 + index * .7, thickness: .035, tessellation: 20 }, scene); ring.parent = sharkWake; ring.rotation.x = Math.PI / 2; ring.position.z = -.8 - index * .75; ring.scaling.x = 1.7; ring.material = cloth; return ring; });
  const biteDebris = Array.from({ length: 12 }, (_, index) => { const chip = MeshBuilder.CreateBox('shark bite wood chip', { width: .08 + index % 3 * .04, height: .035, depth: .2 + index % 4 * .05 }, scene); chip.material = index % 3 ? woodLight : rope; chip.setEnabled(false); return chip; });
  let lastSharkPulse = -1, sharkImpactTime = -10;

  const gulls = Array.from({ length: 7 }, (_, index) => {
    const gull = new TransformNode(`living seagull ${index}`, scene);
    const gullBody = MeshBuilder.CreateCapsule('seagull body', { height: .46, radius: .105, tessellation: 8 }, scene); gullBody.parent = gull; gullBody.rotation.z = Math.PI / 2; gullBody.material = cloth;
    const head = MeshBuilder.CreateSphere('seagull head', { diameter: .17, segments: 8 }, scene); head.parent = gull; head.position.set(.24, .07, 0); head.material = cloth;
    const beak = MeshBuilder.CreateCylinder('seagull beak', { height: .14, diameterTop: 0, diameterBottom: .07, tessellation: 6 }, scene); beak.parent = gull; beak.position.set(.36, .07, 0); beak.rotation.z = -Math.PI / 2; beak.material = plastic;
    const leftWing = MeshBuilder.CreatePlane('seagull left wing', { width: .58, height: .19, sideOrientation: Mesh.DOUBLESIDE }, scene); leftWing.parent = gull; leftWing.position.z = .27; leftWing.rotation.x = Math.PI / 2; leftWing.material = cloth;
    const rightWing = leftWing.clone('seagull right wing'); rightWing.parent = gull; rightWing.position.z = -.27;
    gull.scaling.setAll(.82 + index % 3 * .08);
    return { root: gull, leftWing, rightWing, phase: index * 1.73 };
  });

  const plane = new TransformNode('Ha Long rescue plane', scene); plane.setEnabled(false);
  const fuselage = MeshBuilder.CreateCapsule('rescue plane fuselage', { height: 4.8, radius: 0.42, tessellation: 12 }, scene); fuselage.parent = plane; fuselage.rotation.z = Math.PI / 2; fuselage.material = cloth;
  const wings = addBox(plane, scene, 'rescue plane wings', new Vector3(1.15, 0.12, 6.8), new Vector3(0, 0, 0), metal); wings.rotation.y = Math.PI / 2;
  const tail = addBox(plane, scene, 'rescue plane tail', new Vector3(0.8, 1.2, 0.12), new Vector3(-1.8, 0.45, 0), coral); tail.rotation.y = Math.PI / 2;
  const rainDrops = Array.from({ length: 34 }, (_, i) => { const drop = MeshBuilder.CreateBox('volumetric rain streak', { width: 0.025, height: 0.75, depth: 0.025 }, scene); drop.material = water; drop.rotation.z = -0.16; drop.position.set((i * 7 % 17) - 8, 3 + (i * 11 % 12), (i * 13 % 19) - 9); drop.setEnabled(false); return drop; });
  const snowFlakes = Array.from({ length: 20 }, (_, i) => { const flake = MeshBuilder.CreateSphere('rare snow flake', { diameter: 0.085, segments: 4 }, scene); flake.material = cloth; flake.position.set((i * 5 % 15) - 7, 3 + (i * 9 % 11), (i * 11 % 17) - 8); flake.setEnabled(false); return flake; });
  const seaSpray = Array.from({ length: 14 }, (_, i) => { const spray = MeshBuilder.CreateIcoSphere('storm sea spray', { radius: 0.045 + i % 3 * 0.018, subdivisions: 1 }, scene); spray.material = cloth; spray.setEnabled(false); return spray; });
  const lightningMaterial = mat(scene, 'lightning plasma', '#d9f6ff', 0, 0.2, 3);
  const lightning = new TransformNode('branching lightning', scene); lightning.setEnabled(false);
  for (let index = 0; index < 6; index++) { const segment = addBox(lightning, scene, 'lightning branch', new Vector3(0.055, 1.9, 0.055), new Vector3(Math.sin(index * 2.3) * 0.22, 6.2 - index * 1.65, 0), lightningMaterial); segment.rotation.z = Math.sin(index * 3.7) * 0.18; }

  const craftFx = new TransformNode('crafting vfx', scene); craftFx.setEnabled(false);
  const craftRing = MeshBuilder.CreateTorus('crafting energy ring', { diameter: 2.1, thickness: 0.045, tessellation: 32 }, scene); craftRing.parent = craftFx; craftRing.rotation.x = Math.PI / 2; craftRing.material = water;
  const craftSparks = Array.from({ length: 10 }, (_, index) => { const spark = MeshBuilder.CreateIcoSphere('crafting spark', { radius: 0.055, subdivisions: 1 }, scene); spark.parent = craftFx; spark.material = index % 2 ? coral : cloth; return spark; });
  let lastCraftPulse = -1, craftEventTime = -10;

  const built = new Map<string, TransformNode>();
  const builtRecords = new Map<string, BuildingRecord>();
  const planted = new Map<string, TransformNode>();
  function createBuilding(record: BuildingRecord) {
    const root = new TransformNode(`built ${record.type} ${record.id}`, scene); root.position.set(record.x, terrainHeight(record.x, record.z), record.z); root.rotation.y = record.rotation;
    if (record.type === 'foundation') addBox(root, scene, 'foundation deck', new Vector3(3.8, 0.3, 3.8), new Vector3(0, 0.15, 0), woodLight);
    else if (record.type === 'wall') addBox(root, scene, 'timber wall', new Vector3(3.8, 2.7, 0.22), new Vector3(0, 1.35, 0), wood);
    else if (record.type === 'door') {
      addBox(root, scene, 'door left', new Vector3(1.2, 2.7, 0.24), new Vector3(-1.3, 1.35, 0), wood);
      addBox(root, scene, 'door right', new Vector3(1.2, 2.7, 0.24), new Vector3(1.3, 1.35, 0), wood);
      addBox(root, scene, 'door lintel', new Vector3(1.4, 0.5, 0.24), new Vector3(0, 2.45, 0), woodLight);
    } else if (record.type === 'roof') {
      const roof = addBox(root, scene, 'palm roof', new Vector3(4.4, 0.2, 4.4), new Vector3(0, 2.9, 0), leaf); roof.rotation.z = 0.14;
    } else if (record.type === 'storage') {
      addBox(root, scene, 'storage chest', new Vector3(1.5, 0.9, 0.8), new Vector3(0, 0.45, 0), woodLight);
      addBox(root, scene, 'storage band', new Vector3(0.13, 0.94, 0.84), new Vector3(0, 0.46, 0), metal);
    } else if (record.type === 'purifier') {
      const tank = MeshBuilder.CreateCylinder('water purifier', { height: 1.4, diameter: 1.05, tessellation: 16 }, scene); tank.parent = root; tank.position.y = 0.7; tank.material = water;
      addBox(root, scene, 'purifier frame', new Vector3(1.4, 0.12, 1.4), new Vector3(0, 0.08, 0), metal);
    } else if (record.type === 'grill') {
      addBox(root, scene, 'stone grill', new Vector3(1.5, 0.8, 1.1), new Vector3(0, 0.4, 0), stone);
      const grate = addBox(root, scene, 'grill grate', new Vector3(1.35, 0.08, 0.95), new Vector3(0, 0.86, 0), metal); grate.rotation.y = 0.1;
    } else if (record.type === 'beacon') {
      const pole = MeshBuilder.CreateCylinder('claim beacon', { height: 5.4, diameter: 0.18, tessellation: 8 }, scene); pole.parent = root; pole.position.y = 2.7; pole.material = metal;
      const signal = MeshBuilder.CreateTorus('beacon signal', { diameter: 1.15, thickness: 0.09, tessellation: 20 }, scene); signal.parent = root; signal.position.y = 5.1; signal.material = water;
    } else if (record.type === 'anchor') {
      const ring = MeshBuilder.CreateTorus('storm anchor ring', { diameter: 1.4, thickness: 0.22, tessellation: 18 }, scene); ring.parent = root; ring.position.y = 0.75; ring.material = metal;
      const shaft = addBox(root, scene, 'storm anchor shaft', new Vector3(0.22, 1.8, 0.22), new Vector3(0, 0.8, 0), metal); shaft.rotation.z = 0.1;
    } else if (record.type === 'lightning_rod') {
      const pole = MeshBuilder.CreateCylinder('lightning rod', { height: 6, diameterTop: 0.05, diameterBottom: 0.25, tessellation: 8 }, scene); pole.parent = root; pole.position.y = 3; pole.material = metal;
      const ring = MeshBuilder.CreateTorus('grounding ring', { diameter: 1.8, thickness: 0.08, tessellation: 20 }, scene); ring.parent = root; ring.position.y = 0.08; ring.material = rope;
    } else if (record.type === 'sail') {
      const mast = MeshBuilder.CreateCylinder('built sail mast', { height: 5, diameter: 0.16, tessellation: 8 }, scene); mast.parent = root; mast.position.y = 2.5; mast.material = wood;
      const canvas = MeshBuilder.CreatePlane('built stitched Hung Mei sail', { width: 3.2, height: 2.8, sideOrientation: Mesh.DOUBLESIDE }, scene); canvas.parent = root; canvas.position.set(0.08, 3, 0); canvas.rotation.y = Math.PI / 2; canvas.material = sailCloth;
      for (const z of [-1.62, 1.62]) { const edge = MeshBuilder.CreateCylinder('built sail rope edge', { height: 2.9, diameter: .045, tessellation: 8 }, scene); edge.parent = root; edge.position.set(.08, 3, z); edge.material = rope; }
    } else if (record.type === 'research_table') {
      addBox(root, scene, 'research table top', new Vector3(2.2, 0.18, 1.1), new Vector3(0, 1.05, 0), woodLight);
      addBox(root, scene, 'research table legs', new Vector3(1.8, 1, 0.12), new Vector3(0, 0.52, 0), wood);
      const lens = MeshBuilder.CreateSphere('research compass lens', { diameter: 0.55, segments: 12 }, scene); lens.parent = root; lens.position.set(0.45, 1.22, 0); lens.scaling.y = 0.12; lens.material = water;
    } else if (record.type === 'watchtower') {
      for (const x of [-1.2, 1.2]) for (const z of [-1.2, 1.2]) addBox(root, scene, 'watchtower bamboo pillar', new Vector3(0.18, 5, 0.18), new Vector3(x, 2.5, z), wood);
      addBox(root, scene, 'watchtower platform', new Vector3(3.5, 0.25, 3.5), new Vector3(0, 4.4, 0), woodLight);
      const roof = MeshBuilder.CreateCylinder('watchtower roof', { height: 0.8, diameterTop: 0, diameterBottom: 4.6, tessellation: 4 }, scene); roof.parent = root; roof.position.y = 5.4; roof.rotation.y = Math.PI / 4; roof.material = leaf;
    } else if (record.type === 'raft_engine') {
      addBox(root, scene, 'raft engine block', new Vector3(1.5, 1.15, 1.25), new Vector3(0, 0.58, 0), metal);
      const rotor = MeshBuilder.CreateTorus('raft engine rotor', { diameter: 0.78, thickness: 0.09, tessellation: 18 }, scene); rotor.parent = root; rotor.position.set(0, 0.62, 0.67); rotor.material = coral;
    } else if (record.type === 'small_planter' || record.type === 'tree_planter') {
      const size = record.type === 'tree_planter' ? 2.1 : 1.25;
      addBox(root, scene, 'planter timber rim', new Vector3(size, 0.42, size), new Vector3(0, 0.21, 0), woodLight);
      addBox(root, scene, 'planter dark soil', new Vector3(size - 0.22, 0.12, size - 0.22), new Vector3(0, 0.46, 0), stone);
    } else if (record.type === 'rain_collector') {
      const dish = MeshBuilder.CreateCylinder('rain collector dish', { height: 0.24, diameterTop: 2.5, diameterBottom: 0.8, tessellation: 18 }, scene); dish.parent = root; dish.position.y = 2.4; dish.material = cloth;
      const pipe = MeshBuilder.CreateCylinder('rain collector pipe', { height: 2.2, diameter: 0.13, tessellation: 8 }, scene); pipe.parent = root; pipe.position.y = 1.2; pipe.material = metal;
      const tank = MeshBuilder.CreateCylinder('rain collector tank', { height: 0.8, diameter: 0.9, tessellation: 14 }, scene); tank.parent = root; tank.position.y = 0.4; tank.material = water;
    } else {
      addBox(root, scene, 'modular survival structure', new Vector3(2.3, 1.2, 1.8), new Vector3(0, 0.6, 0), woodLight);
    }
    for (const child of root.getChildMeshes()) { child.receiveShadows = true; shadows.addShadowCaster(child); }
    built.set(record.id, root); builtRecords.set(record.id, record);
  }

  function syncBuildings(records: BuildingRecord[]) {
    const ids = new Set(records.map(record => record.id));
    for (const [id, root] of built) if (!ids.has(id)) { root.dispose(); built.delete(id); builtRecords.delete(id); }
    for (const record of records) { builtRecords.set(record.id, record); if (!built.has(record.id)) createBuilding(record); }
  }

  function syncCrops(records: CropPlot[]) {
    const ids = new Set(records.map(record => record.id));
    for (const [id, root] of planted) if (!ids.has(id)) { root.dispose(); planted.delete(id); }
    for (const record of records) {
      let root = planted.get(record.id);
      if (!root) {
        const crop = CROPS.find(entry => entry.id === record.cropId); if (!crop) continue;
        root = new TransformNode(`crop ${crop.name} ${record.id}`, scene); root.position.set(record.x, terrainHeight(record.x, record.z), record.z);
        const soil = MeshBuilder.CreateCylinder('crop planter soil', { height: 0.22, diameter: crop.size === 'large' ? 1.5 : 0.86, tessellation: 16 }, scene); soil.parent = root; soil.position.y = 0.12; soil.material = stone;
        const stem = MeshBuilder.CreateCylinder('crop stem', { height: crop.size === 'large' ? 2.8 : 0.75, diameterTop: 0.06, diameterBottom: crop.size === 'large' ? 0.23 : 0.1, tessellation: 8 }, scene); stem.parent = root; stem.position.y = crop.size === 'large' ? 1.5 : 0.5; stem.material = wood;
        const crown = MeshBuilder.CreateIcoSphere(`crop crown ${crop.id}`, { radius: crop.size === 'large' ? 1.15 : 0.48, subdivisions: 2 }, scene); crown.parent = root; crown.position.y = crop.size === 'large' ? 3 : 0.88; crown.material = crop.id === 'chili' || crop.id === 'tomato' ? coral : leaf;
        const harvestCount = crop.size === 'large' ? 4 : crop.id === 'rose' || crop.id === 'lotus' ? 5 : 3;
        for (let index = 0; index < harvestCount; index++) {
          const fruit = MeshBuilder.CreateIcoSphere(`crop harvest ${crop.id}`, { radius: crop.size === 'large' ? 0.18 : 0.11, subdivisions: 1 }, scene);
          fruit.parent = root; const angle = index / harvestCount * Math.PI * 2;
          fruit.position.set(Math.sin(angle) * (crop.size === 'large' ? 0.72 : 0.3), crop.size === 'large' ? 2.85 + (index % 2) * 0.35 : 0.9, Math.cos(angle) * (crop.size === 'large' ? 0.72 : 0.3));
          fruit.material = crop.id === 'lotus' ? cloth : crop.id === 'rose' || crop.id === 'tomato' ? coral : plastic; fruit.setEnabled(false);
        }
        for (const child of root.getChildMeshes()) { child.receiveShadows = true; shadows.addShadowCaster(child); }
        planted.set(record.id, root);
      }
      const overall = cropOverallProgress(record); const scale = 0.14 + Math.max(0.01, overall) * 0.86; root.scaling.setAll(scale);
      const harvestVisible = record.stage === 2 && record.stageProgress > 0.15;
      for (const child of root.getChildMeshes()) if (child.name.startsWith('crop harvest')) child.setEnabled(harvestVisible);
    }
  }

  return {
    nearestResource(x: number, z: number): NearbyResource | undefined {
      const now = performance.now();
      let nearest: ResourceNode | undefined; let best = 3.2;
      for (const node of nodes) {
        if (!node.mesh.isEnabled() && node.respawnAt <= now) node.mesh.setEnabled(true);
        if (!node.mesh.isEnabled()) continue;
        const distance = Math.hypot(node.mesh.position.x - x, node.mesh.position.z - z);
        if (distance < best) { nearest = node; best = distance; }
      }
      return nearest && { nodeId: nearest.nodeId, item: nearest.item, amount: nearest.amount };
    },
    collect(nodeId: string) {
      const node = nodes.find(candidate => candidate.nodeId === nodeId && candidate.mesh.isEnabled());
      if (!node) return;
      node.mesh.setEnabled(false); node.respawnAt = performance.now() + 30000;
    },
    syncBuildings,
    syncCrops,
    update(time: number, weather: Weather, reduced: boolean, ending = false, crafting?: CraftJob, craftPulse = 0, playerX = 0, playerZ = 0, sharkRaid?: SharkRaidState) {
      const motion = reduced ? 0 : time;
      const severeSea = weather === 'Bão nhiệt đới' || weather === 'Giông sét';
      const raftFrame = starterRaftFrame(time, severeSea, reduced);
      raft.position.y = raftFrame.rootY; raft.rotation.z = raftFrame.roll; raft.rotation.x = raftFrame.pitch;
      for (const [id, root] of built) if (builtRecords.get(id)?.zone === 'raft') { root.position.y = raftFrame.deckY; root.rotation.x = raftFrame.pitch; root.rotation.z = raftFrame.roll; }
      for (const root of planted.values()) if (isOnStarterRaft(root.position.x, root.position.z)) { root.position.y = raftFrame.deckY; root.rotation.x = raftFrame.pitch; root.rotation.z = raftFrame.roll; }
      nodes.forEach(node => { if (node.mesh.isEnabled()) { node.mesh.position.y = (node.mesh.position.z > 76 ? -1.82 : terrainHeight(node.mesh.position.x, node.mesh.position.z) + 0.45) + Math.sin(motion * 1.5 + node.phase) * 0.08; node.mesh.rotation.y += reduced ? 0 : 0.004; } });
      const angle = motion * 0.11;
      const targetRoot = sharkRaid?.targetBuildingId ? built.get(sharkRaid.targetBuildingId) : undefined;
      const targetX = targetRoot?.position.x ?? 0, targetZ = targetRoot?.position.z ?? 81;
      if (sharkRaid?.phase === 'warning') {
        const approach = 1 - Math.max(0, Math.min(1, sharkRaid.countdown / SHARK_WARNING_SECONDS));
        const radius = 17 - approach * 13.5, orbit = angle * 4 + sharkRaid.raidIndex * 1.7;
        shark.position.set(targetX + Math.sin(orbit) * radius, -1.88 + Math.sin(motion * 2.4) * .1, targetZ + Math.cos(orbit) * radius);
        shark.rotation.y = Math.atan2(targetX - shark.position.x, targetZ - shark.position.z) - Math.PI / 2;
      } else if (sharkRaid?.phase === 'biting') {
        const retreat = 1 - Math.max(0, Math.min(1, sharkRaid.countdown / 3));
        // Keep the snout at the raft edge while the body remains in the sea.
        shark.position.set(targetX + 3.9 + retreat * 10, -1.72 + Math.sin(motion * 5) * .14, targetZ + Math.sin(motion * 2) * .8);
        shark.rotation.y = -Math.PI / 2;
      } else if (sharkRaid?.phase === 'repelled') {
        const retreat = 1 - Math.max(0, Math.min(1, sharkRaid.countdown / 4));
        shark.position.set(targetX + 3 + retreat * 18, -1.9 - retreat * 1.2, targetZ + retreat * 6); shark.rotation.y = -Math.PI / 2;
      } else {
        shark.position.x = Math.sin(angle) * 62; shark.position.z = 20 + Math.cos(angle) * 58; shark.position.y = -1.95; shark.rotation.y = angle + Math.PI / 2;
      }
      const sharkActive = sharkRaid?.phase === 'warning' || sharkRaid?.phase === 'biting' || sharkRaid?.phase === 'repelled';
      const sharkUrgency = sharkRaid?.phase === 'biting' ? 1 : sharkRaid?.phase === 'warning' ? .68 : sharkRaid?.phase === 'repelled' ? .82 : .28;
      tailJoint.rotation.y = reduced ? 0 : Math.sin(motion * (4.2 + sharkUrgency * 4.5)) * (.18 + sharkUrgency * .22);
      tailJoint.rotation.z = sharkRaid?.phase === 'repelled' ? Math.sin(motion * 7) * .12 : 0;
      jaw.rotation.x = sharkRaid?.phase === 'biting'
        ? .12 + Math.abs(Math.sin(motion * 9.5)) * .42
        : sharkRaid?.phase === 'repelled' ? .24 : .035 + Math.sin(motion * 1.8) * .018;
      shark.rotation.z = sharkRaid?.phase === 'repelled' ? -.18 : Math.sin(motion * 1.7) * .025;
      sharkWake.setEnabled(Boolean(sharkActive)); sharkWake.position.copyFrom(shark.position); sharkWake.position.y = -1.74;
      wakeFoam.forEach((foam, index) => { const wakeAngle = motion * 1.8 + index * 2.399; foam.position.set(Math.sin(wakeAngle) * (.45 + index * .08), Math.sin(wakeAngle * 2) * .08, Math.cos(wakeAngle) * (.7 + index * .12)); foam.scaling.setAll(.8 + Math.sin(motion * 4 + index) * .18); });
      wakeRings.forEach((ring, index) => { const pulse = (motion * (.55 + index * .08) + index * .4) % 1; ring.position.z = -.45 - pulse * 2.4; ring.scaling.set(1.2 + pulse * 1.4, 1, .72 + pulse * .4); ring.visibility = .72 * (1 - pulse); });
      if (sharkRaid && sharkRaid.pulse !== lastSharkPulse) { lastSharkPulse = sharkRaid.pulse; if (sharkRaid.phase === 'biting') sharkImpactTime = time; }
      biteDebris.forEach((chip, index) => { const active = time - sharkImpactTime < 1.35; chip.setEnabled(active); if (!active) return; const age = time - sharkImpactTime, debrisAngle = index / biteDebris.length * Math.PI * 2; chip.position.set(targetX + Math.sin(debrisAngle) * age * 2.2, raftFrame.deckY + .2 + age * (1.5 + index % 3 * .25) - age * age * 2.8, targetZ + Math.cos(debrisAngle) * age * 2.2); chip.rotation.set(age * (2 + index % 4), debrisAngle, age * 3); });
      gulls.forEach((gull, index) => {
        const cycle = (motion * .035 + index * .137) % 1;
        const perched = index === 0 && cycle > .72 && cycle < .9 && !severeSea;
        if (perched) {
          gull.root.position.set(1.72, raft.position.y + .92, 80.95); gull.root.rotation.y = Math.PI * .72;
          gull.leftWing.rotation.y = gull.rightWing.rotation.y = 0;
        } else {
          const orbit = motion * (.11 + index * .006) + gull.phase;
          const radius = 13 + index * 2.7;
          gull.root.position.set(Math.sin(orbit) * radius, 6.5 + index * .48 + Math.sin(orbit * 2.3) * 1.2, 69 + Math.cos(orbit) * radius);
          gull.root.rotation.y = orbit + Math.PI / 2;
          const flap = reduced ? 0 : Math.sin(motion * (5.2 + index * .15)) * .55;
          gull.leftWing.rotation.y = flap; gull.rightWing.rotation.y = -flap;
        }
      });
      plane.setEnabled(ending);
      if (ending) { plane.position.set(Math.sin(motion * 0.18) * 52, 22 + Math.sin(motion * 0.5), 22 + Math.cos(motion * 0.18) * 42); plane.rotation.y = -motion * 0.18; }
      const raining = weather === 'Mưa rào' || weather === 'Giông sét' || weather === 'Bão nhiệt đới'; const snowing = weather === 'Mưa tuyết dị thường';
      const focus = scene.activeCamera?.globalPosition ?? Vector3.Zero();
      rainDrops.forEach((drop, i) => { drop.setEnabled(raining); if (!raining) return; drop.position.y -= reduced ? 0 : 0.28 + i % 3 * 0.03; if (drop.position.y < focus.y - 2) drop.position.set(focus.x + (i * 7 % 17) - 8, focus.y + 8 + (i % 6), focus.z + (i * 13 % 19) - 9); });
      snowFlakes.forEach((flake, i) => { flake.setEnabled(snowing); if (!snowing) return; flake.position.y -= reduced ? 0 : 0.035 + i % 4 * 0.006; flake.position.x += Math.sin(motion + i) * 0.006; if (flake.position.y < focus.y - 2) flake.position.set(focus.x + (i * 5 % 15) - 7, focus.y + 8 + (i % 5), focus.z + (i * 11 % 17) - 8); });
      const lightningFlash = weather === 'Giông sét' && Math.sin(motion * 2.13) + Math.sin(motion * 5.71) > 1.72;
      scene.imageProcessingConfiguration.exposure = lightningFlash ? 1.9 : 1;
      lightning.setEnabled(lightningFlash); if (lightningFlash) lightning.position.set(focus.x + 5, focus.y + 1, focus.z - 9);
      seaSpray.forEach((spray, index) => { spray.setEnabled(severeSea); if (!severeSea) return; const angle = motion * 1.7 + index * 2.399; spray.position.set(focus.x + Math.sin(angle) * (2.5 + index % 4), -1.2 + Math.abs(Math.sin(angle * 1.7)) * 1.8, focus.z + Math.cos(angle) * (2.5 + index % 4)); });
      const storm = weather === 'Bão nhiệt đới' || weather === 'Giông sét';
      scene.fogDensity = storm ? 0.012 : weather === 'Gió mạnh' || weather === 'Mưa rào' || snowing ? 0.004 : 0.0015;
      scene.fogColor = storm ? new Color3(0.3, 0.42, 0.48) : snowing ? new Color3(0.78, 0.84, 0.88) : new Color3(0.72, 0.85, 0.88);
      if (craftPulse !== lastCraftPulse) { lastCraftPulse = craftPulse; craftEventTime = time; }
      const craftingVisible = Boolean(crafting) || time - craftEventTime < 0.8;
      craftFx.setEnabled(craftingVisible);
      if (craftingVisible) {
        craftFx.position.set(playerX, (isOnStarterRaft(playerX, playerZ) ? raftFrame.deckY : terrainHeight(playerX, playerZ)) + 0.12, playerZ); craftRing.rotation.z = motion * 1.8; craftRing.scaling.setAll(1 + Math.sin(motion * 5) * 0.08);
        craftSparks.forEach((spark, index) => { const angle = motion * (1.6 + index % 3 * 0.2) + index / craftSparks.length * Math.PI * 2; const radius = 0.55 + (index % 3) * 0.18; spark.position.set(Math.sin(angle) * radius, 0.25 + (index % 4) * 0.16 + Math.sin(angle * 2) * 0.09, Math.cos(angle) * radius); });
      }
    },
  };
}
