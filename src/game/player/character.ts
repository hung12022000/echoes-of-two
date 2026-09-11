import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import type { Scene } from '@babylonjs/core/scene';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import '@babylonjs/loaders/glTF';
import type { Actor } from '../combat/encounter';
import type { Role } from '../rules';
import { damp, turnTowards } from './motion';
import { terrainHeight } from '../world/terrain';

function addOceanboundOutfit(scene: Scene, root: TransformNode, role: Role) {
  const badgeTexture = new DynamicTexture(`${role} Hưng&Mei badge texture`, { width: 768, height: 256 }, scene, true);
  badgeTexture.hasAlpha = true;
  const context = badgeTexture.getContext(); context.clearRect(0, 0, 768, 256);
  badgeTexture.drawText('Hưng&Mei', null, 168, 'bold italic 112px Arial', '#fff5df', 'transparent', true, true);
  const badgeMaterial = new StandardMaterial(`${role} Hưng&Mei badge`, scene); badgeMaterial.diffuseTexture = badgeTexture; badgeMaterial.opacityTexture = badgeTexture; badgeMaterial.emissiveColor = new Color3(0.16, 0.02, 0.03); badgeMaterial.backFaceCulling = false;
  const badge = MeshBuilder.CreatePlane(`${role} Hưng&Mei chest print`, { width: 0.27, height: 0.085, sideOrientation: Mesh.DOUBLESIDE }, scene);
  badge.parent = root; badge.position.set(0, role === 'hung' ? 1.29 : 1.25, -0.112); badge.material = badgeMaterial;
}

export async function loadCharacter(scene: Scene, role: Role, shadows: ShadowGenerator) {
  const result = await SceneLoader.ImportMeshAsync('', `${import.meta.env.BASE_URL}models/`, `${role}.glb`, scene);
  const root = new TransformNode(role, scene);
  for (const mesh of result.meshes) {
    if (!mesh.parent) mesh.parent = root;
    mesh.isPickable = false;
    if (mesh.getTotalVertices()) { shadows.addShadowCaster(mesh); mesh.receiveShadows = true; }
  }
  addOceanboundOutfit(scene, root, role);
  const clips = new Map<string, AnimationGroup>();
  for (const clip of result.animationGroups) {
    const name = ['idle', 'walk', 'run', 'wave', 'victory', 'kneel'].find(n => clip.name.includes(n));
    if (name) clips.set(name, clip);
    clip.stop(); clip.enableBlending = true; clip.blendingSpeed = 0.12;
  }
  if (!clips.has('idle') || !clips.has('walk') || !clips.has('run')) throw new Error(`ANIMATION_MISSING:${role}`);
  // All loops run on the same clock; explicit normalized weights cross-fade them.
  for (const clip of clips.values()) { clip.start(true); clip.setWeightForAllAnimatables(0); }
  clips.get('idle')!.setWeightForAllAnimatables(1);
  const weights = new Map([...clips.keys()].map(k => [k, k === 'idle' ? 1 : 0]));
  const boneNodes = result.transformNodes.filter(n => /Bip01 (R UpperArm|L UpperArm|Spine2|R Forearm|L Forearm|Head)$/.test(n.name));
  const offsets = new Map<TransformNode, Quaternion>();
  let lastMotion = 'idle';
  let actionTime = 0;
  return {
    root,
    update(a: Actor, dt: number, surfaceY = terrainHeight(a.x, a.z)) {
      const targetY = a.y + surfaceY;
      root.position.x = damp(root.position.x, a.x, 14, dt); root.position.z = damp(root.position.z, a.z, 14, dt);
      root.position.y = damp(root.position.y, targetY, 18, dt); root.rotation.y = turnTowards(root.rotation.y, a.yaw, dt);
      // Undo our previous additive pose before Babylon advances the base clips.
      for (const [node, offset] of offsets) if (node.rotationQuaternion) node.rotationQuaternion = node.rotationQuaternion.multiply(offset.conjugate());
      offsets.clear();
      if (lastMotion !== a.motion) { actionTime = 0; lastMotion = a.motion; }
      actionTime += dt;
      const target = a.motion === 'run' || a.motion === 'dodge' ? 'run' : a.motion === 'walk' ? 'walk' : a.motion === 'victory' ? 'victory' : a.motion === 'downed' || a.motion === 'revive' ? 'kneel' : a.motion === 'link' ? 'wave' : 'idle';
      let sum = 0;
      for (const key of weights.keys()) { const w = damp(weights.get(key)!, key === target ? 1 : 0, 12, dt); weights.set(key, w); sum += w; }
      for (const [key, w] of weights) {
        const clip = clips.get(key)!; clip.setWeightForAllAnimatables(w / sum);
        // Match the captured gait cadence to actual travel speed.
        const speed = Math.hypot(a.vx, a.vz);
        clip.speedRatio = key === 'walk' ? Math.max(0.65, speed / 2.4) : key === 'run' ? Math.max(0.7, speed / 5.6) : 1;
        if (key === 'kneel' && target === 'kneel' && actionTime > 1.1) clip.goToFrame(clip.to * 0.7);
      }
      root.rotation.z = a.motion === 'hit' ? Math.sin(actionTime * 18) * 0.07 : 0;
    },
    pose(a: Actor) {
      // Additive action poses on top of imported human motion, not rigid meshes.
      const impact = Math.sin(Math.min(1, actionTime / 0.5) * Math.PI);
      const casting = a.motion === 'attack' || a.motion === 'skill';
      for (const node of boneNodes) {
        let angle = 0;
        if (casting && node.name.includes('R UpperArm')) angle = -1.2 * impact;
        if (casting && node.name.includes('R Forearm')) angle = -0.55 * impact;
        if (a.motion === 'skill' && node.name.includes('L UpperArm')) angle = -1.1 * impact;
        if ((a.motion === 'jump' || a.motion === 'fall') && node.name.includes('UpperArm')) angle = -0.4;
        if (node.name.includes('Spine2')) angle = casting ? 0.15 * impact : a.motion === 'dodge' ? 0.22 : 0;
        if (angle && node.rotationQuaternion) {
          const q = Quaternion.RotationAxis(Vector3.Right(), angle);
          node.rotationQuaternion = node.rotationQuaternion.multiply(q); offsets.set(node, q);
        }
      }
    },
  };
}
