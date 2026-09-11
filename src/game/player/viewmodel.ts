import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';
import type { Role } from '../rules';

const TAU = Math.PI * 2;
const DEFAULT_USE_DURATION = .82;

export type FirstPersonToolId = 'hook' | 'hammer' | 'spear' | 'shovel' | 'watering_can';

const TOOL_IDS = new Set<FirstPersonToolId>(['hook', 'hammer', 'spear', 'shovel', 'watering_can']);
const TOOL_USE_DURATION: Record<FirstPersonToolId, number> = {
  hook: .82,
  hammer: .64,
  spear: .48,
  shovel: .9,
  watering_can: 1.15,
};

function damp(current: number, target: number, sharpness: number, delta: number) {
  return current + (target - current) * (1 - Math.exp(-sharpness * delta));
}

function smoothstep(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function shortestAngleDelta(current: number, previous: number) {
  let delta = current - previous;
  while (delta > Math.PI) delta -= TAU;
  while (delta < -Math.PI) delta += TAU;
  return delta;
}

function makeMaterial(
  scene: Scene,
  name: string,
  albedo: Color3,
  metallic = 0,
  roughness = .62,
) {
  const material = new PBRMaterial(name, scene);
  material.albedoColor = albedo.toLinearSpace();
  material.metallic = metallic;
  material.roughness = roughness;
  material.environmentIntensity = .88;
  return material;
}

function addJoint(scene: Scene, parent: TransformNode, name: string, position: Vector3, skin: Material, scale = 1) {
  const joint = MeshBuilder.CreateSphere(name, { diameter: .032 * scale, segments: 8 }, scene);
  joint.parent = parent;
  joint.position.copyFrom(position);
  joint.scaling.z = .84;
  joint.material = skin;
  return joint;
}

function addPhalanx(
  scene: Scene,
  parent: TransformNode,
  name: string,
  position: Vector3,
  rotation: Vector3,
  length: number,
  radius: number,
  skin: Material,
) {
  const segment = MeshBuilder.CreateCapsule(name, {
    height: length,
    radius,
    tessellation: 10,
    subdivisions: 2,
  }, scene);
  segment.parent = parent;
  segment.position.copyFrom(position);
  segment.rotation.copyFrom(rotation);
  segment.scaling.z = .82;
  segment.material = skin;
  return segment;
}

function addPalm(
  scene: Scene,
  parent: TransformNode,
  name: string,
  side: number,
  skin: Material,
  nail: Material,
  gripping: boolean,
) {
  const palm = MeshBuilder.CreateSphere(`${name} anatomical palm`, { diameter: .145, segments: 12 }, scene);
  palm.parent = parent;
  palm.position.set(side * .004, -.055, .022);
  palm.rotation.set(gripping ? -.1 : -.34, 0, side * .045);
  palm.scaling.set(.92, 1.18, .55);
  palm.material = skin;

  const thenar = MeshBuilder.CreateSphere(`${name} thumb pad`, { diameter: .083, segments: 10 }, scene);
  thenar.parent = parent;
  thenar.position.set(side * .045, -.064, .052);
  thenar.scaling.set(.72, 1.05, .58);
  thenar.rotation.z = side * -.28;
  thenar.material = skin;

  const fingerX = [-.047, -.017, .016, .046];
  fingerX.forEach((offset, index) => {
    const lengthBias = 1 - Math.abs(index - 1.45) * .055;
    const knuckleY = -.114 - Math.abs(index - 1.5) * .004;
    addJoint(scene, parent, `${name} knuckle ${index + 1}`, new Vector3(offset, knuckleY, .055), skin, 1.04);
    if (gripping) {
      // Three articulated segments curl around the same grip axis used by every tool.
      addPhalanx(scene, parent, `${name} proximal finger ${index + 1}`, new Vector3(offset, -.126, .071), new Vector3(1.04, 0, 0), .057 * lengthBias, .0147, skin);
      addJoint(scene, parent, `${name} middle joint ${index + 1}`, new Vector3(offset, -.135, .096), skin, .9);
      addPhalanx(scene, parent, `${name} middle finger ${index + 1}`, new Vector3(offset, -.144, .11), new Vector3(.38, 0, 0), .047 * lengthBias, .0142, skin);
      addJoint(scene, parent, `${name} distal joint ${index + 1}`, new Vector3(offset, -.164, .118), skin, .82);
      addPhalanx(scene, parent, `${name} distal finger ${index + 1}`, new Vector3(offset, -.178, .108), new Vector3(-.72, 0, 0), .041 * lengthBias, .0134, skin);
    } else {
      addPhalanx(scene, parent, `${name} relaxed proximal ${index + 1}`, new Vector3(offset, -.142, .061), new Vector3(.4 + index * .025, 0, side * offset * .8), .065 * lengthBias, .0147, skin);
      addJoint(scene, parent, `${name} relaxed joint ${index + 1}`, new Vector3(offset, -.17, .072), skin, .88);
      addPhalanx(scene, parent, `${name} relaxed distal ${index + 1}`, new Vector3(offset, -.19, .087), new Vector3(.74 + index * .025, 0, side * offset), .052 * lengthBias, .0135, skin);
    }

    const fingernail = MeshBuilder.CreateSphere(`${name} fingernail ${index + 1}`, { diameter: .024, segments: 5 }, scene);
    fingernail.parent = parent;
    if (gripping) {
      fingernail.position.set(offset, -.184, .098);
      fingernail.scaling.set(.7, 1, .16);
      fingernail.rotation.x = -.72;
    } else {
      fingernail.position.set(offset, -.208, .101);
      fingernail.scaling.set(.72, 1, .17);
      fingernail.rotation.x = .74 + index * .025;
    }
    fingernail.material = nail;
  });

  addJoint(scene, parent, `${name} thumb base joint`, new Vector3(side * .061, -.076, .06), skin, 1.18);
  addPhalanx(scene, parent, `${name} thumb proximal`, new Vector3(side * .071, -.095, .078), new Vector3(gripping ? .72 : .46, 0, side * -.62), .061, .017, skin);
  addJoint(scene, parent, `${name} thumb joint`, new Vector3(side * .063, -.116, .098), skin, 1.02);
  addPhalanx(scene, parent, `${name} thumb distal`, new Vector3(side * .046, -.13, gripping ? .112 : .105), new Vector3(gripping ? .24 : .62, 0, side * .82), .049, .0155, skin);

  const thumbnail = MeshBuilder.CreateSphere(`${name} thumbnail`, { diameter: .027, segments: 6 }, scene);
  thumbnail.parent = parent;
  thumbnail.position.set(side * .033, -.139, gripping ? .121 : .115);
  thumbnail.scaling.set(.78, 1, .15);
  thumbnail.rotation.set(gripping ? .2 : .62, 0, side * .78);
  thumbnail.material = nail;

  const gripAnchor = new TransformNode(`${name} shared grip anchor`, scene);
  gripAnchor.parent = parent;
  gripAnchor.position.set(0, -.144, .109);
  return gripAnchor;
}

function addArm(
  scene: Scene,
  root: TransformNode,
  name: string,
  side: number,
  skin: Material,
  sleeve: Material,
  cuff: Material,
  nail: Material,
  gripping = false,
) {
  const pivot = new TransformNode(`${name} arm pivot`, scene);
  pivot.parent = root;
  pivot.position.set(side * (gripping ? .285 : .34), gripping ? -.005 : -.075, gripping ? -.01 : .015);

  const sleeveMesh = MeshBuilder.CreateCapsule(`${name} coral sleeve`, {
    height: .34,
    radius: .064,
    tessellation: 12,
    subdivisions: 2,
  }, scene);
  sleeveMesh.parent = pivot;
  sleeveMesh.position.set(0, -.16, .065);
  sleeveMesh.rotation.set(-.68, 0, side * .12);
  sleeveMesh.scaling.set(1, 1, .84);
  sleeveMesh.material = sleeve;

  const cuffMesh = MeshBuilder.CreateCylinder(`${name} Hung and Mei cuff`, {
    height: .032,
    diameter: .127,
    tessellation: 14,
  }, scene);
  cuffMesh.parent = pivot;
  cuffMesh.position.set(side * .011, -.035, .215);
  cuffMesh.rotation.set(-.72, 0, side * .12);
  cuffMesh.material = cuff;

  const forearm = MeshBuilder.CreateCapsule(`${name} forearm`, {
    height: .3,
    radius: .055,
    tessellation: 12,
    subdivisions: 2,
  }, scene);
  forearm.parent = pivot;
  forearm.position.set(side * .022, .03, .32);
  forearm.rotation.set(-.72, 0, side * .1);
  forearm.scaling.set(1, 1, .9);
  forearm.material = skin;

  const wrist = new TransformNode(`${name} wrist`, scene);
  wrist.parent = pivot;
  wrist.position.set(side * .038, .13, .46);
  wrist.rotation.set(gripping ? -.05 : .03, gripping ? side * .08 : 0, side * .035);
  const wristJoint = MeshBuilder.CreateSphere(`${name} wrist joint`, { diameter: .105, segments: 10 }, scene);
  wristJoint.parent = wrist;
  wristJoint.position.set(0, .008, .002);
  wristJoint.scaling.set(.92, .78, .82);
  wristJoint.material = skin;
  const gripAnchor = addPalm(scene, wrist, name, side, skin, nail, gripping);
  return { pivot, wrist, gripAnchor };
}

type ToolMaterials = {
  wood: PBRMaterial;
  rope: PBRMaterial;
  metal: PBRMaterial;
  darkMetal: PBRMaterial;
  paint: PBRMaterial;
  soil: PBRMaterial;
};

function toolRoot(scene: Scene, parent: TransformNode, id: FirstPersonToolId) {
  const root = new TransformNode(`${id} first person tool`, scene);
  root.parent = parent;
  // Origin is the physical contact point inside the closed fingers. Keeping every
  // tool on this socket prevents animation from making the handle float away.
  root.position.set(0, 0, 0);
  root.rotation.set(.08, -.025, -.04);
  return root;
}

function addGrip(scene: Scene, root: TransformNode, name: string, material: Material, length = .39, width = .058) {
  const grip = MeshBuilder.CreateCylinder(`${name} hand aligned grip`, {
    height: length,
    diameterTop: width * .88,
    diameterBottom: width,
    tessellation: 8,
  }, scene);
  grip.parent = root;
  grip.position.set(0, .035, 0);
  grip.material = material;
  return grip;
}

function createHook(scene: Scene, parent: TransformNode, material: ToolMaterials) {
  const root = toolRoot(scene, parent, 'hook');
  addGrip(scene, root, 'hook carved wood', material.wood, .4, .055);
  [-.11, -.045, .025, .095].forEach((height, index) => {
    const wrap = MeshBuilder.CreateTorus(`hook grip wrap ${index + 1}`, {
      diameter: .061,
      thickness: .008,
      tessellation: 7,
    }, scene);
    wrap.parent = root;
    wrap.position.set(0, height, 0);
    wrap.rotation.x = Math.PI / 2;
    wrap.material = index % 2 ? material.darkMetal : material.rope;
  });
  const collar = MeshBuilder.CreateCylinder('hook reinforced collar', {
    height: .075,
    diameterTop: .068,
    diameterBottom: .058,
    tessellation: 9,
  }, scene);
  collar.parent = root;
  collar.position.set(0, .255, 0);
  collar.material = material.darkMetal;
  const path = Array.from({ length: 18 }, (_, index) => {
    const angle = -1.42 + index / 17 * Math.PI * 1.28;
    return new Vector3(Math.cos(angle) * .112, .39 + Math.sin(angle) * .15, 0);
  });
  const hook = MeshBuilder.CreateTube('forged open starter hook', { path, radius: .0175, tessellation: 10, cap: 3 }, scene);
  hook.parent = root;
  hook.material = material.metal;
  const tip = MeshBuilder.CreateCylinder('hook tapered point', {
    height: .13,
    diameterTop: 0,
    diameterBottom: .043,
    tessellation: 7,
  }, scene);
  tip.parent = root;
  tip.position.set(-.105, .445, 0);
  tip.rotation.z = .58;
  tip.material = material.metal;
  const tail = MeshBuilder.CreateTube('hook rope tail', {
    path: [new Vector3(0, -.17, 0), new Vector3(.018, -.235, .006), new Vector3(-.01, -.3, -.01)],
    radius: .009,
    tessellation: 6,
    cap: 3,
  }, scene);
  tail.parent = root;
  tail.material = material.rope;
  return root;
}

function createHammer(scene: Scene, parent: TransformNode, material: ToolMaterials) {
  const root = toolRoot(scene, parent, 'hammer');
  addGrip(scene, root, 'hammer ash wood', material.wood, .48, .055);
  const head = MeshBuilder.CreateBox('hammer forged head', { width: .25, height: .092, depth: .095 }, scene);
  head.parent = root;
  head.position.set(0, .31, 0);
  head.material = material.darkMetal;
  const cheek = MeshBuilder.CreateCylinder('hammer rounded cheek', { height: .115, diameter: .112, tessellation: 12 }, scene);
  cheek.parent = root;
  cheek.position.set(-.092, .31, 0);
  cheek.rotation.z = Math.PI / 2;
  cheek.material = material.darkMetal;
  const face = MeshBuilder.CreateCylinder('hammer striking face', { height: .06, diameter: .126, tessellation: 14 }, scene);
  face.parent = root;
  face.position.set(-.175, .31, 0);
  face.rotation.z = Math.PI / 2;
  face.material = material.metal;
  [-1, 1].forEach((side) => {
    const claw = MeshBuilder.CreateBox(`hammer claw ${side}`, { width: .12, height: .027, depth: .035 }, scene);
    claw.parent = root;
    claw.position.set(.17, .31 + side * .032, 0);
    claw.rotation.z = side * -.25;
    claw.material = material.metal;
  });
  [.04, .075].forEach((height, index) => {
    const wrap = MeshBuilder.CreateTorus(`hammer leather grip ring ${index + 1}`, { diameter: .058, thickness: .006, tessellation: 9 }, scene);
    wrap.parent = root;
    wrap.position.set(0, height, 0);
    wrap.rotation.x = Math.PI / 2;
    wrap.material = material.rope;
  });
  return root;
}

function createSpear(scene: Scene, parent: TransformNode, material: ToolMaterials) {
  const root = toolRoot(scene, parent, 'spear');
  addGrip(scene, root, 'spear bamboo shaft', material.wood, 1.08, .038);
  const binding = MeshBuilder.CreateCylinder('spear head binding', { height: .09, diameter: .052, tessellation: 8 }, scene);
  binding.parent = root;
  binding.position.set(0, .61, 0);
  binding.material = material.rope;
  const blade = MeshBuilder.CreateCylinder('spear leaf blade', {
    height: .25,
    diameterTop: 0,
    diameterBottom: .105,
    tessellation: 4,
  }, scene);
  blade.parent = root;
  blade.position.set(0, .76, 0);
  blade.scaling.z = .42;
  blade.material = material.metal;
  return root;
}

function createShovel(scene: Scene, parent: TransformNode, material: ToolMaterials) {
  const root = toolRoot(scene, parent, 'shovel');
  addGrip(scene, root, 'shovel hardwood shaft', material.wood, .86, .045);
  const socket = MeshBuilder.CreateCylinder('shovel blade socket', { height: .12, diameter: .065, tessellation: 8 }, scene);
  socket.parent = root;
  socket.position.set(0, .49, 0);
  socket.material = material.darkMetal;
  const blade = MeshBuilder.CreateCylinder('shovel spade blade', {
    height: .27,
    diameterTop: .21,
    diameterBottom: .075,
    tessellation: 6,
  }, scene);
  blade.parent = root;
  blade.position.set(0, .675, 0);
  blade.scaling.z = .22;
  blade.material = material.metal;
  const step = MeshBuilder.CreateBox('shovel boot step', { width: .25, height: .035, depth: .055 }, scene);
  step.parent = root;
  step.position.set(0, .55, 0);
  step.material = material.darkMetal;
  return root;
}

function createWateringCan(scene: Scene, parent: TransformNode, material: ToolMaterials) {
  const root = toolRoot(scene, parent, 'watering_can');
  addGrip(scene, root, 'watering can top handle', material.darkMetal, .25, .045);
  const body = MeshBuilder.CreateCylinder('watering can body', {
    height: .25,
    diameterTop: .24,
    diameterBottom: .27,
    tessellation: 10,
  }, scene);
  body.parent = root;
  body.position.set(.02, .27, .02);
  body.material = material.paint;
  const top = MeshBuilder.CreateCylinder('watering can fill rim', { height: .035, diameter: .15, tessellation: 9 }, scene);
  top.parent = root;
  top.position.set(.02, .412, .02);
  top.material = material.darkMetal;
  const handle = MeshBuilder.CreateTorus('watering can carry handle', {
    diameter: .31,
    thickness: .035,
    tessellation: 12,
  }, scene);
  handle.parent = root;
  handle.position.set(.02, .36, .02);
  handle.scaling.z = .48;
  handle.material = material.darkMetal;
  const spout = MeshBuilder.CreateTube('watering can long spout', {
    path: [new Vector3(-.1, .27, .02), new Vector3(-.26, .37, .02), new Vector3(-.39, .48, .02)],
    radius: .035,
    tessellation: 7,
    cap: 3,
  }, scene);
  spout.parent = root;
  spout.material = material.paint;
  const rose = MeshBuilder.CreateCylinder('watering can sprinkler rose', { height: .055, diameterTop: .13, diameterBottom: .075, tessellation: 9 }, scene);
  rose.parent = root;
  rose.position.set(-.41, .5, .02);
  rose.rotation.z = -.78;
  rose.material = material.metal;
  return root;
}

function normalizedToolId(id: string): FirstPersonToolId | null {
  const normalized = id.trim().toLowerCase().replace(/[\s-]+/g, '_') as FirstPersonToolId;
  return TOOL_IDS.has(normalized) ? normalized : null;
}

/** Browser-friendly procedural first-person rig and five equipped tools; no downloaded assets. */
export function createFirstPersonViewModel(scene: Scene, role: Role) {
  const root = new TransformNode(`${role} first person viewmodel`, scene);
  // Keep the rig below the sight line and far enough from the near plane to read
  // as forearms entering from the lower corners instead of two oversized columns.
  root.scaling.setAll(.49);

  const hungSkin = new Color3(.73, .48, .34);
  const meiSkin = new Color3(.84, .62, .48);
  const skin = makeMaterial(scene, `${role} warm skin`, role === 'hung' ? hungSkin : meiSkin, 0, .5);
  const sleeve = makeMaterial(scene, `${role} Hung and Mei coral fabric`, new Color3(.72, .18, .3), 0, .91);
  const cuff = makeMaterial(scene, `${role} Hung and Mei cuff accent`, role === 'hung' ? new Color3(.12, .48, .55) : new Color3(1, .78, .38), .04, .57);
  const nail = makeMaterial(scene, `${role} natural fingernails`, role === 'hung' ? new Color3(.78, .57, .47) : new Color3(.9, .7, .62), 0, .3);
  const metal = makeMaterial(scene, 'starter hook brushed metal', new Color3(.31, .37, .39), .91, .24);
  const rope = makeMaterial(scene, 'weathered rope', new Color3(.47, .3, .15), 0, .94);
  const wood = makeMaterial(scene, 'sealed tool wood', new Color3(.38, .2, .09), 0, .63);
  const darkMetal = makeMaterial(scene, 'dark forged metal', new Color3(.09, .115, .12), .82, .35);
  const paint = makeMaterial(scene, 'sea green tool paint', new Color3(.08, .44, .46), .22, .34);
  const soil = makeMaterial(scene, 'damp soil residue', new Color3(.2, .105, .045), 0, .98);
  const materials = [skin, sleeve, cuff, nail, metal, rope, wood, darkMetal, paint, soil];

  const left = addArm(scene, root, `${role} left`, -1, skin, sleeve, cuff, nail);
  const right = addArm(scene, root, `${role} right`, 1, skin, sleeve, cuff, nail, true);

  const toolMaterial = { wood, rope, metal, darkMetal, paint, soil };
  const tools: Record<FirstPersonToolId, TransformNode> = {
    hook: createHook(scene, right.gripAnchor, toolMaterial),
    hammer: createHammer(scene, right.gripAnchor, toolMaterial),
    spear: createSpear(scene, right.gripAnchor, toolMaterial),
    shovel: createShovel(scene, right.gripAnchor, toolMaterial),
    watering_can: createWateringCan(scene, right.gripAnchor, toolMaterial),
  };

  const toolRestRotation: Record<FirstPersonToolId, Vector3> = {
    hook: new Vector3(.08, -.025, -.13),
    hammer: new Vector3(.06, -.03, -.2),
    spear: new Vector3(.025, -.02, -.095),
    shovel: new Vector3(.065, -.025, -.14),
    watering_can: new Vector3(.015, .025, -.18),
  };

  let activeTool: FirstPersonToolId | null = 'hook';
  const setEquippedTool = (id: string) => {
    const next = normalizedToolId(id);
    if (next === activeTool) return;
    activeTool = next;
    castTime = 0;
    (Object.keys(tools) as FirstPersonToolId[]).forEach((toolId) => tools[toolId].setEnabled(toolId === activeTool));
  };
  (Object.keys(tools) as FirstPersonToolId[]).forEach((toolId) => tools[toolId].setEnabled(toolId === activeTool));

  let castTime = 0;
  let useDuration = DEFAULT_USE_DURATION;
  let previousElapsed = 0;
  let previousAlpha = 0;
  let previousBeta = 0;
  let swayX = 0;
  let swayY = 0;
  let castYaw = 0;
  let castPitch = 0;

  return {
    equip(id: string) {
      setEquippedTool(id);
    },
    cast() {
      useDuration = activeTool ? TOOL_USE_DURATION[activeTool] : DEFAULT_USE_DURATION;
      castTime = useDuration;
    },
    update(
      camera: ArcRotateCamera,
      elapsed: number,
      moving: boolean,
      firstPerson: boolean,
      reduced: boolean,
      equippedTool?: string,
    ) {
      if (equippedTool !== undefined) setEquippedTool(equippedTool);
      root.setEnabled(firstPerson);
      if (!firstPerson) {
        previousElapsed = elapsed;
        previousAlpha = camera.alpha;
        previousBeta = camera.beta;
        return;
      }

      const delta = previousElapsed > 0 ? Math.min(.05, Math.max(1 / 240, elapsed - previousElapsed)) : 1 / 60;
      const alphaDelta = shortestAngleDelta(camera.alpha, previousAlpha);
      const betaDelta = camera.beta - previousBeta;
      previousElapsed = elapsed;
      previousAlpha = camera.alpha;
      previousBeta = camera.beta;
      castTime = Math.max(0, castTime - delta);

      const swayScale = reduced ? 0 : 1;
      swayX = damp(swayX, Math.max(-.045, Math.min(.045, -alphaDelta * .55)) * swayScale, 11, delta);
      swayY = damp(swayY, Math.max(-.032, Math.min(.032, betaDelta * .5)) * swayScale, 11, delta);

      const stride = reduced || !moving ? 0 : elapsed * 7.2;
      const bobX = moving && !reduced ? Math.cos(stride * .5) * .009 : 0;
      const bobY = moving && !reduced ? Math.abs(Math.sin(stride)) * .012 : 0;
      const breathing = reduced ? 0 : Math.sin(elapsed * 1.65) * .0035;

      const castProgress = castTime > 0 ? 1 - castTime / useDuration : 1;
      let reach = 0;
      let pitchTarget = 0;
      let yawTarget = 0;
      let rollTarget = 0;
      let toolPitchTarget = .3;
      if (castTime > 0) {
        const windup = smoothstep(castProgress / .24);
        const action = smoothstep((castProgress - .2) / .34);
        const recover = smoothstep((castProgress - .62) / .38);
        if (activeTool === 'hammer') {
          pitchTarget = windup * .72 - action * 1.42 + recover * .7;
          yawTarget = windup * -.12 + action * .18 - recover * .06;
          reach = action * .12 - recover * .12;
          toolPitchTarget = .3 + pitchTarget * .45;
        } else if (activeTool === 'spear') {
          reach = action * .52 - recover * .52;
          pitchTarget = windup * .16 - action * .34 + recover * .18;
          yawTarget = windup * -.08;
          toolPitchTarget = .18;
        } else if (activeTool === 'shovel') {
          pitchTarget = windup * -.34 + action * .9 - recover * .56;
          yawTarget = windup * -.32 + action * .5 - recover * .18;
          rollTarget = action * -.28 + recover * .28;
          reach = action * .2 - recover * .2;
          toolPitchTarget = .42 + action * .34 - recover * .34;
        } else if (activeTool === 'watering_can') {
          pitchTarget = action * .22 - recover * .22;
          yawTarget = action * -.14 + recover * .14;
          rollTarget = action * 1.08 - recover * 1.08;
          toolPitchTarget = .3 + action * .35 - recover * .35;
        } else {
          reach = (action * .58 - recover * .58) - windup * .08;
          pitchTarget = windup * .34 - action * .92 + recover * .58;
          yawTarget = windup * -.24 + action * .36 - recover * .12;
        }
      }
      castPitch = damp(castPitch, pitchTarget, castTime > 0 ? 24 : 14, delta);
      castYaw = damp(castYaw, yawTarget, castTime > 0 ? 22 : 13, delta);

      const forward = camera.target.subtract(camera.globalPosition).normalize();
      const rightVector = Vector3.Cross(Vector3.Up(), forward).normalize();
      const base = camera.globalPosition
        .add(forward.scale(.56 + reach))
        .add(rightVector.scale(.008 + bobX + swayX))
        .add(new Vector3(0, -.22 - bobY + breathing + swayY, 0));
      root.position.copyFrom(base);
      root.rotation.y = Math.atan2(forward.x, forward.z);
      root.rotation.x = -Math.asin(Math.max(-.85, Math.min(.85, forward.y))) * .14;
      root.rotation.z = (moving && !reduced ? Math.sin(stride * .5) * .009 : 0) + swayX * .18;

      left.pivot.rotation.x = damp(left.pivot.rotation.x, moving && !reduced ? Math.sin(stride) * .025 : 0, 12, delta);
      left.wrist.rotation.z = damp(left.wrist.rotation.z, -.035 + castYaw * -.18, 17, delta);
      right.pivot.rotation.x = damp(right.pivot.rotation.x, castPitch * .52 - (moving && !reduced ? Math.sin(stride) * .018 : 0), 18, delta);
      right.pivot.rotation.y = damp(right.pivot.rotation.y, castYaw * .3, 18, delta);
      right.wrist.rotation.x = damp(right.wrist.rotation.x, -.05 + castPitch * .42, 20, delta);
      right.wrist.rotation.y = damp(right.wrist.rotation.y, .08 + castYaw * .3, 20, delta);
      right.wrist.rotation.z = damp(right.wrist.rotation.z, .035 + rollTarget * .55, 20, delta);
      (Object.keys(tools) as FirstPersonToolId[]).forEach((toolId) => {
        const model = tools[toolId];
        const rest = toolRestRotation[toolId];
        // The grip socket is the pivot: action rotation cannot separate hand and handle.
        model.rotation.x = damp(model.rotation.x, rest.x + (toolPitchTarget - .3) * .32, 22, delta);
        model.rotation.y = damp(model.rotation.y, rest.y + castYaw * .08, 22, delta);
        model.rotation.z = damp(model.rotation.z, rest.z + rollTarget * .42 - castYaw * .12, 22, delta);
      });
    },
    dispose() {
      root.dispose(false, true);
      materials.forEach((material) => material.dispose());
    },
  };
}
