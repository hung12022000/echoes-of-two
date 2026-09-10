import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import { mat } from '../world/temple';
import type { CombatEffect } from '../combat/encounter';

export function createEffects(scene: Scene) {
  const amber = mat(scene, 'amber particles', '#ffb460', 0, 0.3, 2.5);
  const cyan = mat(scene, 'cyan particles', '#76e8ff', 0, 0.3, 2.5);
  const violet = mat(scene, 'shockwave particles', '#dc82ec', 0, 0.3, 1.4);
  const sparks = Array.from({ length: 80 }, (_, i) => {
    const mesh = MeshBuilder.CreateSphere(`spark ${i}`, { diameter: 0.05, segments: 4 }, scene); mesh.isPickable = false; mesh.setEnabled(false);
    return { mesh, life: 0, max: 1, velocity: Vector3.Zero() };
  });
  const rings = Array.from({ length: 12 }, (_, i) => {
    const mesh = MeshBuilder.CreateTorus(`impact ring ${i}`, { diameter: 1, thickness: 0.025, tessellation: 64 }, scene); mesh.isPickable = false; mesh.setEnabled(false);
    return { mesh, life: 0, max: 1, radius: 1 };
  });
  const bolts = Array.from({ length: 12 }, (_, i) => {
    const mesh = MeshBuilder.CreateSphere(`energy projectile ${i}`, { diameter: 0.15, segments: 8 }, scene); mesh.setEnabled(false); mesh.material = cyan; mesh.isPickable = false;
    return { mesh, life: 0, origin: Vector3.Zero(), target: Vector3.Zero() };
  });
  let cursor = 0, ringCursor = 0, boltCursor = 0;
  function emit(e: CombatEffect) {
    const material = e.role === 'hung' ? amber : cyan;
    if (e.kind === 'bolt') {
      const bolt = bolts[boltCursor++ % bolts.length]; bolt.life = 0.32; bolt.origin.set(e.x, 1.3, e.z); bolt.target.set(e.targetX, 2.5, e.targetZ); bolt.mesh.position.copyFrom(bolt.origin); bolt.mesh.setEnabled(true);
    }
    const ring = rings[ringCursor++ % rings.length]; ring.life = ring.max = e.kind === 'slam' ? 1.25 : 0.65;
    ring.radius = e.kind === 'slam' ? 20 : e.kind === 'link' ? 7 : e.kind === 'phase' ? 9 : 2.2;
    ring.mesh.material = e.kind === 'slam' ? violet : material; ring.mesh.position.set(e.x, e.kind === 'impact' ? 2.4 : 0.1, e.z);
    ring.mesh.rotation.set(e.kind === 'impact' || e.kind === 'strike' ? Math.PI / 2 : 0, 0, e.kind === 'strike' ? 0.8 : 0); ring.mesh.scaling.setAll(0.2); ring.mesh.setEnabled(true);
    for (let i = 0; i < (e.kind === 'impact' ? 7 : 16); i++) {
      const spark = sparks[cursor++ % sparks.length]; spark.life = spark.max = 0.4 + i % 5 * 0.08; spark.mesh.position.set(e.x, e.kind === 'impact' ? 2.6 : 1.1, e.z); spark.mesh.material = material;
      const a = i * 2.399 + cursor; spark.velocity.set(Math.sin(a) * 2.2, 0.7 + i % 4, Math.cos(a) * 2.2); spark.mesh.setEnabled(true);
    }
  }
  return { emit, update(dt: number) {
    for (const p of sparks) if (p.life > 0) { p.life -= dt; p.velocity.y -= dt * 5; p.mesh.position.addInPlace(p.velocity.scale(dt)); p.mesh.scaling.setAll(Math.max(0.01, p.life / p.max)); if (p.life <= 0) p.mesh.setEnabled(false); }
    for (const p of rings) if (p.life > 0) { p.life -= dt; p.mesh.scaling.setAll(Math.max(0.01, (1 - p.life / p.max) * p.radius)); p.mesh.visibility = Math.max(0, p.life / p.max); if (p.life <= 0) p.mesh.setEnabled(false); }
    for (const p of bolts) if (p.life > 0) { p.life -= dt; Vector3.LerpToRef(p.origin, p.target, 1 - Math.max(0, p.life) / 0.32, p.mesh.position); if (p.life <= 0) p.mesh.setEnabled(false); }
  } };
}
