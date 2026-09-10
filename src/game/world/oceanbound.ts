import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import type { BuildingRecord, CropPlot, NearbyResource, Weather } from '../oceanbound/session';
import { CROPS } from '../oceanbound/catalog';
import { terrainHeight } from './terrain';
import { mat } from './temple';

interface ResourceNode extends NearbyResource { mesh: Mesh; phase: number; respawnAt: number }

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
  const cloth = mat(scene, 'oceanbound sail', '#e8d9b8', 0, 0.88); cloth.backFaceCulling = false;
  const metal = mat(scene, 'oceanbound metal', '#657581', 0.55, 0.34);
  const leaf = mat(scene, 'oceanbound fiber', '#5f9345', 0, 0.92);
  const plastic = mat(scene, 'oceanbound recycled plastic', '#df8b55', 0, 0.66);
  const stone = mat(scene, 'oceanbound stone', '#686d68', 0, 0.96);
  const water = mat(scene, 'oceanbound water container', '#52d5da', 0.1, 0.22); water.alpha = 0.8;
  const dark = mat(scene, 'oceanbound shark', '#274b59', 0, 0.72);
  const coral = mat(scene, 'oceanbound coral', '#e98775', 0, 0.78);

  const raft = new TransformNode('starter raft', scene); raft.position.set(0, -1.55, 81);
  for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) {
    const plank = addBox(raft, scene, 'raft plank', new Vector3(0.9, 0.18, 0.9), new Vector3(x * 0.92, 0, z * 0.92), (x + z) % 2 ? wood : woodLight);
    shadows.addShadowCaster(plank);
  }
  const mast = MeshBuilder.CreateCylinder('raft mast', { height: 5.4, diameter: 0.18, tessellation: 8 }, scene); mast.parent = raft; mast.position.y = 2.6; mast.material = wood;
  const sail = MeshBuilder.CreatePlane('raft sail', { width: 3.4, height: 2.7, sideOrientation: Mesh.DOUBLESIDE }, scene); sail.parent = raft; sail.position.set(0, 3.1, 0.08); sail.rotation.y = Math.PI / 2; sail.material = cloth;
  const stripe = addBox(raft, scene, 'sail emblem', new Vector3(0.05, 0.22, 2.1), new Vector3(0.03, 3.1, 0), metal); stripe.rotation.x = Math.PI / 2;

  const resourceMaterials = { driftwood: woodLight, fiber: leaf, plastic, stone, scrap: metal, coconut: wood, fish: water, bamboo: leaf, herb: leaf, clay: coral, shell: cloth, seaweed: leaf };
  const nodes: ResourceNode[] = RESOURCE_LAYOUT.map(([item, x, z], index) => {
    const y = z > 76 ? -1.82 : terrainHeight(x, z) + 0.45;
    const mesh = item === 'stone'
      ? MeshBuilder.CreateIcoSphere(`resource ${item}`, { radius: 0.48, subdivisions: 1 }, scene)
      : item === 'scrap'
        ? MeshBuilder.CreateTorus(`resource ${item}`, { diameter: 0.85, thickness: 0.18, tessellation: 12 }, scene)
        : item === 'coconut'
          ? MeshBuilder.CreateSphere(`resource ${item}`, { diameter: 0.68, segments: 10 }, scene)
          : item === 'fish'
            ? MeshBuilder.CreateCylinder(`resource ${item}`, { height: 1.1, diameterTop: 0.18, diameterBottom: 0.42, tessellation: 8 }, scene)
            : MeshBuilder.CreateBox(`resource ${item}`, { width: item === 'fiber' ? 0.55 : 1.15, height: 0.22, depth: item === 'fiber' ? 0.55 : 0.38 }, scene);
    mesh.position.set(x, y, z); mesh.material = resourceMaterials[item]; mesh.rotation.set(index * 0.3, index * 0.8, index * 0.13);
    const halo = MeshBuilder.CreateTorus('resource glint', { diameter: 1.25, thickness: 0.035, tessellation: 24 }, scene); halo.parent = mesh; halo.rotation.x = Math.PI / 2; halo.material = water;
    return { nodeId: `node-${index}`, item, amount: item === 'scrap' ? 1 : 2, mesh, phase: index * 0.77, respawnAt: 0 };
  });

  const shark = new TransformNode('reef shark threat', scene);
  const body = MeshBuilder.CreateCapsule('shark body', { height: 3.4, radius: 0.55, tessellation: 10 }, scene); body.parent = shark; body.rotation.z = Math.PI / 2; body.material = dark;
  const fin = MeshBuilder.CreateCylinder('shark fin', { height: 1.2, diameterTop: 0, diameterBottom: 0.9, tessellation: 3 }, scene); fin.parent = shark; fin.position.y = 0.48; fin.rotation.z = Math.PI; fin.material = dark;
  shark.position.y = -1.95;

  const plane = new TransformNode('Ha Long rescue plane', scene); plane.setEnabled(false);
  const fuselage = MeshBuilder.CreateCapsule('rescue plane fuselage', { height: 4.8, radius: 0.42, tessellation: 12 }, scene); fuselage.parent = plane; fuselage.rotation.z = Math.PI / 2; fuselage.material = cloth;
  const wings = addBox(plane, scene, 'rescue plane wings', new Vector3(1.15, 0.12, 6.8), new Vector3(0, 0, 0), metal); wings.rotation.y = Math.PI / 2;
  const tail = addBox(plane, scene, 'rescue plane tail', new Vector3(0.8, 1.2, 0.12), new Vector3(-1.8, 0.45, 0), coral); tail.rotation.y = Math.PI / 2;
  const rainDrops = Array.from({ length: 46 }, (_, i) => { const drop = MeshBuilder.CreateBox('volumetric rain streak', { width: 0.025, height: 0.65, depth: 0.025 }, scene); drop.material = water; drop.position.set((i * 7 % 17) - 8, 3 + (i * 11 % 12), (i * 13 % 19) - 9); drop.setEnabled(false); return drop; });
  const snowFlakes = Array.from({ length: 32 }, (_, i) => { const flake = MeshBuilder.CreateSphere('rare snow flake', { diameter: 0.085, segments: 4 }, scene); flake.material = cloth; flake.position.set((i * 5 % 15) - 7, 3 + (i * 9 % 11), (i * 11 % 17) - 8); flake.setEnabled(false); return flake; });

  const built = new Map<string, TransformNode>();
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
      const canvas = MeshBuilder.CreatePlane('built coral sail', { width: 3.2, height: 2.8, sideOrientation: Mesh.DOUBLESIDE }, scene); canvas.parent = root; canvas.position.set(0.08, 3, 0); canvas.rotation.y = Math.PI / 2; canvas.material = coral;
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
    built.set(record.id, root);
  }

  function syncBuildings(records: BuildingRecord[]) {
    const ids = new Set(records.map(record => record.id));
    for (const [id, root] of built) if (!ids.has(id)) { root.dispose(); built.delete(id); }
    for (const record of records) if (!built.has(record.id)) createBuilding(record);
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
        for (const child of root.getChildMeshes()) { child.receiveShadows = true; shadows.addShadowCaster(child); }
        planted.set(record.id, root);
      }
      const scale = 0.12 + Math.max(0.02, record.growth) * 0.88; root.scaling.setAll(scale);
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
    update(time: number, weather: Weather, reduced: boolean, ending = false) {
      const motion = reduced ? 0 : time;
      raft.position.y = -1.62 + Math.sin(motion * 0.9) * (weather === 'Bão nhiệt đới' ? 0.28 : 0.08);
      raft.rotation.z = Math.sin(motion * 0.55) * (weather === 'Bão nhiệt đới' ? 0.08 : 0.02);
      sail.rotation.z = Math.sin(motion * 1.1) * 0.035;
      stripe.visibility = weather === 'Bão nhiệt đới' ? 0.45 : 0.8;
      nodes.forEach(node => { if (node.mesh.isEnabled()) { node.mesh.position.y = (node.mesh.position.z > 76 ? -1.82 : terrainHeight(node.mesh.position.x, node.mesh.position.z) + 0.45) + Math.sin(motion * 1.5 + node.phase) * 0.08; node.mesh.rotation.y += reduced ? 0 : 0.004; } });
      const angle = motion * 0.11;
      shark.position.x = Math.sin(angle) * 62; shark.position.z = 20 + Math.cos(angle) * 58; shark.rotation.y = angle + Math.PI / 2;
      plane.setEnabled(ending);
      if (ending) { plane.position.set(Math.sin(motion * 0.18) * 52, 22 + Math.sin(motion * 0.5), 22 + Math.cos(motion * 0.18) * 42); plane.rotation.y = -motion * 0.18; }
      const raining = weather === 'Mưa rào' || weather === 'Giông sét' || weather === 'Bão nhiệt đới'; const snowing = weather === 'Mưa tuyết dị thường';
      const focus = scene.activeCamera?.globalPosition ?? Vector3.Zero();
      rainDrops.forEach((drop, i) => { drop.setEnabled(raining); if (!raining) return; drop.position.y -= reduced ? 0 : 0.28 + i % 3 * 0.03; if (drop.position.y < focus.y - 2) drop.position.set(focus.x + (i * 7 % 17) - 8, focus.y + 8 + (i % 6), focus.z + (i * 13 % 19) - 9); });
      snowFlakes.forEach((flake, i) => { flake.setEnabled(snowing); if (!snowing) return; flake.position.y -= reduced ? 0 : 0.035 + i % 4 * 0.006; flake.position.x += Math.sin(motion + i) * 0.006; if (flake.position.y < focus.y - 2) flake.position.set(focus.x + (i * 5 % 15) - 7, focus.y + 8 + (i % 5), focus.z + (i * 11 % 17) - 8); });
      scene.imageProcessingConfiguration.exposure = weather === 'Giông sét' && Math.sin(motion * 3.1) > 0.965 ? 1.85 : 1;
      const storm = weather === 'Bão nhiệt đới' || weather === 'Giông sét';
      scene.fogDensity = storm ? 0.012 : weather === 'Gió mạnh' || weather === 'Mưa rào' || snowing ? 0.004 : 0.0015;
      scene.fogColor = storm ? new Color3(0.3, 0.42, 0.48) : snowing ? new Color3(0.78, 0.84, 0.88) : new Color3(0.72, 0.85, 0.88);
    },
  };
}
