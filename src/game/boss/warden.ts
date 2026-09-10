import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { mat } from '../world/temple';
import type { Encounter } from '../combat/encounter';

export function createWarden(scene: Scene, shadows: ShadowGenerator) {
  const root = new TransformNode('The Fractured Warden', scene); root.position.z = -4;
  const armor = mat(scene, 'Warden obsidian', '#273446', 0.7, 0.3);
  const brass = mat(scene, 'Warden brass', '#bd9654', 0.7, 0.3);
  const coreMat = mat(scene, 'fractured core', '#b491ef', 0.3, 0.25, 2);
  const body = MeshBuilder.CreateIcoSphere('Warden cuirass', { radius: 1.1, subdivisions: 1 }, scene); body.parent = root; body.position.y = 2.8; body.scaling.set(1, 1.2, 0.6); body.material = armor; shadows.addShadowCaster(body);
  const core = MeshBuilder.CreatePolyhedron('Warden heart', { type: 1, size: 0.42 }, scene); core.parent = root; core.position.set(0, 3, 0.7); core.material = coreMat;
  const head = MeshBuilder.CreateCylinder('Warden mask', { height: 0.95, diameterTop: 0.8, diameterBottom: 0.45, tessellation: 5 }, scene); head.parent = root; head.position.y = 4.45; head.material = brass; shadows.addShadowCaster(head);
  const eye = MeshBuilder.CreateBox('single luminous eye', { width: 0.45, height: 0.05, depth: 0.12 }, scene); eye.parent = head; eye.position.set(0, 0.07, 0.36); eye.material = coreMat;
  const shoulders = [-1, 1].map(side => {
    const pivot = new TransformNode('arm pivot', scene); pivot.parent = root; pivot.position.set(side * 1.1, 3.4, 0);
    const pauldron = MeshBuilder.CreatePolyhedron('floating shoulder armor', { type: 0, size: 0.65 }, scene); pauldron.parent = pivot; pauldron.material = brass;
    const arm = MeshBuilder.CreateCylinder('Warden forearm', { height: 1.9, diameterTop: 0.5, diameterBottom: 0.8, tessellation: 6 }, scene); arm.parent = pivot; arm.position.set(side * 0.22, -1.15, 0); arm.rotation.z = side * 0.15; arm.material = armor; shadows.addShadowCaster(arm);
    const fist = MeshBuilder.CreateIcoSphere('Warden fist', { radius: 0.55, subdivisions: 1 }, scene); fist.parent = pivot; fist.position.set(side * 0.36, -2.15, 0); fist.material = brass;
    return pivot;
  });
  const pieces = Array.from({ length: 7 }, (_, i) => {
    const shard = MeshBuilder.CreatePolyhedron('orbiting armor fragment', { type: 1, size: 0.25 + i % 3 * 0.12 }, scene); shard.parent = root; shard.material = i % 2 ? brass : armor; return shard;
  });
  const shield = MeshBuilder.CreateSphere('Warden energy shield', { diameter: 5.8, segments: 24 }, scene); shield.parent = root; shield.position.y = 2.7;
  const shieldMat = mat(scene, 'shield glass', '#b49ce3', 0.1, 0.15, 0.2); shieldMat.alpha = 0.08; shieldMat.backFaceCulling = false; shield.material = shieldMat;
  const warning = MeshBuilder.CreateTorus('shockwave telegraph', { diameter: 20, thickness: 0.075, tessellation: 96 }, scene); warning.position.set(0, 0.045, -4); warning.material = coreMat; warning.setEnabled(false);
  return { update(state: Encounter, reducedMotion: boolean) {
    const t = reducedMotion ? 0 : state.elapsed;
    root.position.y = Math.sin(t * 1.4) * 0.12; core.rotation.y = t * 0.8;
    shield.setEnabled(state.exposed <= 0 && state.status !== 'victory');
    shield.scaling.setAll(1 + Math.sin(t * 2) * 0.015);
    warning.setEnabled(state.telegraph > 0); warning.scaling.setAll(0.3 + state.telegraph * 0.7); warning.visibility = 0.4 + state.telegraph * 0.6;
    shoulders.forEach((arm, i) => { arm.rotation.x = -state.telegraph * 2.1; arm.rotation.z = (i ? 1 : -1) * (0.14 + Math.sin(t * 1.3) * 0.07); });
    pieces.forEach((piece, i) => { const angle = t * 0.35 + i / 7 * Math.PI * 2; piece.position.set(Math.sin(angle) * 1.8, 1.1 + Math.sin(angle * 2) * 0.3, Math.cos(angle) * 1.8); piece.rotation.set(t * 0.2, angle, 0.3); });
    if (state.status === 'victory') { root.scaling.scaleInPlace(0.96); if (root.scaling.x < 0.01) root.setEnabled(false); }
    else { root.setEnabled(true); root.scaling.setAll(1); }
  } };
}
