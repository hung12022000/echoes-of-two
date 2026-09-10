import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { Scene } from '@babylonjs/core/scene';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import type { Quality } from '../GameCanvas';

export const amber = Color3.FromHexString('#ffb66b');
export const cyan = Color3.FromHexString('#66e5ec');
export function mat(scene: Scene, name: string, hex: string, metallic = 0.1, roughness = 0.65, glow = 0) {
  const m = new PBRMaterial(name, scene); m.albedoColor = Color3.FromHexString(hex).toLinearSpace(); m.metallic = metallic; m.roughness = roughness;
  m.emissiveColor = m.albedoColor.scale(glow); return m;
}
export function buildTemple(scene: Scene, quality: Quality) {
  scene.clearColor = new Color4(0.37, 0.49, 0.59, 1);
  scene.fogMode = Scene.FOGMODE_EXP2; scene.fogDensity = 0.009; scene.fogColor = new Color3(0.46, 0.56, 0.64);
  scene.imageProcessingConfiguration.toneMappingEnabled = true;
  scene.imageProcessingConfiguration.toneMappingType = 1;
  scene.imageProcessingConfiguration.exposure = 1.05;
  scene.imageProcessingConfiguration.contrast = 1.08;
  const sky = new HemisphericLight('soft sky', new Vector3(0, 1, 0), scene); sky.intensity = 1.1;
  sky.diffuse = new Color3(0.78, 0.86, 1); sky.groundColor = new Color3(0.24, 0.23, 0.2);
  const sun = new DirectionalLight('golden hour', new Vector3(-0.65, -1, -0.35), scene);
  sun.position.set(65, 90, 65); sun.diffuse = new Color3(1, 0.94, 0.84); sun.intensity = 2.1;
  const shadows = new ShadowGenerator(quality === 'high' ? 2048 : 1024, sun);
  shadows.usePercentageCloserFiltering = true; shadows.filteringQuality = quality === 'high' ? 2 : 1;
  shadows.bias = 0.0003; shadows.normalBias = 0.015; shadows.darkness = 0.2;
  sun.shadowMinZ = 1; sun.shadowMaxZ = 230; sun.autoCalcShadowZBounds = true;
  const glow = new GlowLayer('selective energy bloom', scene, { mainTextureRatio: 0.5 }); glow.intensity = quality === 'low' ? 0.2 : 0.45;
  const stone = mat(scene, 'travertine', '#b4afa0', 0.05, 0.85);
  const dark = mat(scene, 'basalt', '#333f46', 0.2, 0.65);
  const gold = mat(scene, 'aged brass', '#ac8345', 0.65, 0.38);
  const energy = mat(scene, 'cyan inlay', '#68cbd5', 0.3, 0.3, 1.2);
  // Deterministic engraved stone texture: no remote runtime texture dependency.
  const texture = new DynamicTexture('engraved paving', 1024, scene, true);
  const ctx = texture.getContext(); ctx.fillStyle = '#aaa99e'; ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 6500; i++) { const x = (i * 127.73) % 1024, y = (i * 79.31) % 1024; ctx.fillStyle = i % 2 ? '#a3a399' : '#b0aea2'; ctx.fillRect(x, y, 2, 2); }
  ctx.strokeStyle = '#6e7778'; ctx.lineWidth = 3;
  for (let i = 0; i <= 1024; i += 128) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1024); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1024, i); ctx.stroke(); }
  texture.update(); texture.uScale = texture.vScale = 3;
  const floorMat = mat(scene, 'stone paving', '#e5e1d6', 0.1, 0.8); floorMat.albedoTexture = texture;
  const floor = MeshBuilder.CreateCylinder('Astra arena', { height: 1.3, diameter: 27, tessellation: 96 }, scene);
  floor.position.y = -0.65; floor.material = floorMat; floor.receiveShadows = true;
  const underside = MeshBuilder.CreateCylinder('floating foundation', { height: 5, diameterTop: 25, diameterBottom: 10, tessellation: 12 }, scene); underside.position.y = -3.8; underside.material = dark;
  for (const diameter of [25.5, 23.8, 15]) {
    const ring = MeshBuilder.CreateTorus('engraved brass circle', { diameter, thickness: 0.035, tessellation: 128 }, scene); ring.position.y = 0.025; ring.material = gold;
  }
  for (let i = 0; i < 6; i++) {
    const t = i / 6 * Math.PI * 2;
    const x = Math.sin(t) * 12.9, z = Math.cos(t) * 12.9;
    const plinth = MeshBuilder.CreateBox('outer plinth', { width: 1.25, depth: 1.25, height: 0.45 }, scene); plinth.position.set(x, 0.22, z); plinth.material = dark; plinth.receiveShadows = true;
    const column = MeshBuilder.CreateCylinder('weathered ruin column', { diameter: 0.72, height: 1.7, tessellation: 12 }, scene); column.position.set(x, 1.25, z); column.material = stone; column.receiveShadows = true; shadows.addShadowCaster(column);
    for (const y of [0.55, 2.1]) { const cap = MeshBuilder.CreateBox('column capital', { width: 1.05, depth: 1.05, height: 0.26 }, scene); cap.position.set(x, y, z); cap.material = gold; }
    if (i % 2 === 0) { const lamp = MeshBuilder.CreateSphere('floating lantern', { diameter: 0.18, segments: 12 }, scene); lamp.position.set(x * 0.95, 2.8, z * 0.95); lamp.material = energy; }
  }
  // Monumental broken portal behind the Warden.
  for (const x of [-5.2, 5.2]) {
    const tower = MeshBuilder.CreateBox('portal buttress', { width: 1.6, depth: 2, height: 5 }, scene); tower.position.set(x, 2.5, -11.3); tower.material = stone; tower.receiveShadows = true; shadows.addShadowCaster(tower);
    const inset = MeshBuilder.CreateBox('portal inlay', { width: 0.06, height: 3.5, depth: 0.04 }, scene); inset.position.set(x, 2.2, -10.28); inset.material = energy;
  }
  const arch = MeshBuilder.CreateTorus('ancient portal', { diameter: 10.4, thickness: 0.45, tessellation: 48 }, scene); arch.position.set(0, 5, -11.3); arch.rotation.x = Math.PI / 2; arch.material = gold;
  const sunMat = new StandardMaterial('sun disc material', scene); sunMat.disableLighting = true; sunMat.emissiveColor = new Color3(1, 0.82, 0.48);
  const disc = MeshBuilder.CreateSphere('distant sun', { diameter: 12, segments: 24 }, scene); disc.position.set(90, 40, -130); disc.material = sunMat;
  return { shadows, glow, sun };
}
