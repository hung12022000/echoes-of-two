import { useEffect, useRef } from "react";
import {
  ArcRotateCamera, Color3, Color4, DirectionalLight, Engine, GlowLayer, HemisphericLight, KeyboardEventTypes,
  MeshBuilder, PBRMaterial, ParticleSystem, Scene, Texture, TransformNode, Vector3,
} from "@babylonjs/core";
import type { Role } from "./rules";

const material = (scene: Scene, name: string, color: Color3, metallic = 0.1, roughness = 0.55, emission?: Color3) => {
  const value = new PBRMaterial(name, scene); value.albedoColor = color; value.metallic = metallic; value.roughness = roughness; if (emission) value.emissiveColor = emission; return value;
};

const createCharacter = (scene: Scene, name: string, role: Role, position: Vector3): TransformNode => {
  const root = new TransformNode(`${name}-root`, scene); root.position = position;
  const primary = role === "hung" ? new Color3(0.95, 0.28, 0.06) : new Color3(0.03, 0.72, 0.95);
  const accent = role === "hung" ? new Color3(1, 0.67, 0.2) : new Color3(0.92, 0.12, 0.75);
  const bodyMat = material(scene, `${name}-body`, primary, 0.55, 0.32); const accentMat = material(scene, `${name}-accent`, accent, 0.7, 0.25, accent.scale(0.32));
  const skinMat = material(scene, `${name}-skin`, new Color3(0.78, 0.47, 0.32), 0, 0.7); const darkMat = material(scene, `${name}-dark`, new Color3(0.035, 0.05, 0.09), 0.8, 0.24);
  const torso = MeshBuilder.CreateCapsule(`${name}-torso`, { height: 1.45, radius: 0.38 }, scene); torso.parent = root; torso.position.y = 1.05; torso.material = bodyMat;
  const head = MeshBuilder.CreateSphere(`${name}-head`, { diameter: 0.62, segments: 20 }, scene); head.parent = root; head.position.y = 2.05; head.material = skinMat;
  const visor = MeshBuilder.CreateTorus(`${name}-visor`, { diameter: 0.45, thickness: 0.055, tessellation: 24 }, scene); visor.parent = root; visor.rotation.x = Math.PI / 2; visor.position.set(0, 2.08, 0.27); visor.material = accentMat;
  for (const side of [-1, 1]) { const arm = MeshBuilder.CreateCapsule(`${name}-arm-${side}`, { height: 1.05, radius: 0.13 }, scene); arm.parent = root; arm.position.set(side * 0.48, 1.1, 0); arm.rotation.z = side * 0.13; arm.material = bodyMat; const boot = MeshBuilder.CreateBox(`${name}-boot-${side}`, { width: 0.28, height: 0.22, depth: 0.55 }, scene); boot.parent = root; boot.position.set(side * 0.2, 0.18, 0.08); boot.material = darkMat; }
  const core = MeshBuilder.CreateSphere(`${name}-core`, { diameter: 0.18, segments: 12 }, scene); core.parent = root; core.position.set(0, 1.2, -0.36); core.material = accentMat;
  return root;
};

const createEnergyTrail = (scene: Scene, parent: TransformNode, color: Color3) => {
  const trail = MeshBuilder.CreateTorus("combat-trail", { diameter: 1.3, thickness: 0.035, tessellation: 32 }, scene); trail.parent = parent; trail.position.y = 1.15; trail.rotation.x = Math.PI / 2; trail.material = material(scene, "trail-material", color, 0.1, 0.2, color.scale(0.8)); return trail;
};

export function GameCanvas({ role }: { role: Role }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }); const scene = new Scene(engine);
    scene.clearColor = new Color4(0.015, 0.025, 0.075, 1); scene.fogMode = Scene.FOGMODE_EXP2; scene.fogDensity = 0.018; scene.fogColor = new Color3(0.06, 0.11, 0.22);
    const camera = new ArcRotateCamera("camera", -Math.PI / 2.4, 1.02, 11, new Vector3(0, 1.2, 0), scene); camera.attachControl(canvas, true); camera.lowerRadiusLimit = 6; camera.upperRadiusLimit = 18; camera.wheelPrecision = 65; camera.fov = 0.95;
    const sky = new HemisphericLight("sky-light", new Vector3(0, 1, 0), scene); sky.intensity = 0.55; const sun = new DirectionalLight("sun-light", new Vector3(-0.45, -1, 0.25), scene); sun.intensity = 1.4; sun.diffuse = new Color3(1, 0.78, 0.58);
    const glow = new GlowLayer("cinematic-glow", scene); glow.intensity = 0.72;
    const stone = material(scene, "cloud-stone", new Color3(0.16, 0.2, 0.3), 0.35, 0.72); const gold = material(scene, "old-gold", new Color3(0.4, 0.24, 0.09), 0.8, 0.3); const cyan = material(scene, "resonance-cyan", new Color3(0.05, 0.22, 0.3), 0.25, 0.2, new Color3(0.02, 0.8, 1)); const magenta = material(scene, "resonance-magenta", new Color3(0.3, 0.03, 0.22), 0.25, 0.2, new Color3(0.95, 0.05, 0.6));
    const island = MeshBuilder.CreateBox("central-island", { width: 24, height: 0.8, depth: 15 }, scene); island.position.y = -0.8; island.material = stone;
    const bridge = MeshBuilder.CreateBox("energy-bridge", { width: 8, height: 0.12, depth: 1.25 }, scene); bridge.position.set(0, -0.17, 0); bridge.material = cyan;
    for (let i = -5; i <= 5; i += 2) { const tower = MeshBuilder.CreateBox(`sky-tower-${i}`, { width: 1.5, height: 4 + Math.abs(i) * 0.17, depth: 1.5 }, scene); tower.position.set(i * 1.55, 1.25, 4.7); tower.material = i % 2 === 0 ? stone : gold; const rune = MeshBuilder.CreateTorus(`tower-rune-${i}`, { diameter: 0.8, thickness: 0.06 }, scene); rune.position.set(tower.position.x, tower.position.y + 1.3, 3.92); rune.rotation.x = Math.PI / 2; rune.material = i % 2 === 0 ? cyan : magenta; }
    for (const x of [-3.2, 3.2]) { const node = MeshBuilder.CreateCylinder(`mirror-node-${x}`, { height: 0.28, diameter: 0.7, tessellation: 16 }, scene); node.position.set(x, 0.12, -2.8); node.material = x < 0 ? gold : cyan; const ring = MeshBuilder.CreateTorus(`mirror-ring-${x}`, { diameter: 1.25, thickness: 0.05 }, scene); ring.position.copyFrom(node.position); ring.rotation.x = Math.PI / 2; ring.material = x < 0 ? gold : cyan; }
    const boss = MeshBuilder.CreateIcoSphere("fractured-warden", { radius: 1.2, subdivisions: 2 }, scene); boss.position.set(0, 1.7, -4.2); boss.material = magenta; const shield = MeshBuilder.CreateTorus("boss-shield", { diameter: 3.1, thickness: 0.08, tessellation: 48 }, scene); shield.position.copyFrom(boss.position); shield.rotation.x = Math.PI / 2; shield.material = cyan;
    const local = createCharacter(scene, "local", role, new Vector3(role === "hung" ? -2 : 2, 0, 1)); const remote = createCharacter(scene, "partner", role === "hung" ? "mei" : "hung", new Vector3(role === "hung" ? 2 : -2, 0, 1)); createEnergyTrail(scene, local, role === "hung" ? new Color3(1, 0.35, 0.05) : new Color3(0.05, 0.8, 1)); createEnergyTrail(scene, remote, role === "hung" ? new Color3(0.92, 0.12, 0.75) : new Color3(1, 0.55, 0.1));
    const sparks = new ParticleSystem("resonance-particles", 420, scene); sparks.particleTexture = new Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", scene); sparks.emitter = new Vector3(0, 0.2, 0); sparks.minEmitBox = new Vector3(-10, 0, -6); sparks.maxEmitBox = new Vector3(10, 4, 6); sparks.color1 = new Color4(0.1, 0.8, 1, 0.9); sparks.color2 = new Color4(1, 0.15, 0.7, 0.8); sparks.minSize = 0.02; sparks.maxSize = 0.08; sparks.minLifeTime = 1; sparks.maxLifeTime = 3; sparks.emitRate = 80; sparks.blendMode = ParticleSystem.BLENDMODE_ADD; sparks.start();
    const pressed = new Set<string>(); let jumpVelocity = 0; let onGround = true;
    const keyboard = scene.onKeyboardObservable.add((info) => { if (info.type === KeyboardEventTypes.KEYDOWN) pressed.add(info.event.key.toLowerCase()); else pressed.delete(info.event.key.toLowerCase()); });
    const before = scene.onBeforeRenderObservable.add(() => { const dt = Math.min(engine.getDeltaTime() / 1000, 0.05); const speed = pressed.has("shift") ? 6.5 : 4.4; const direction = new Vector3((pressed.has("d") ? 1 : 0) - (pressed.has("a") ? 1 : 0), 0, (pressed.has("s") ? 1 : 0) - (pressed.has("w") ? 1 : 0)); if (direction.lengthSquared() > 0) { direction.normalize(); local.position.addInPlace(direction.scale(speed * dt)); local.rotation.y = Math.atan2(direction.x, direction.z); } if (pressed.has(" ") && onGround) { jumpVelocity = 6; onGround = false; } jumpVelocity -= 16 * dt; local.position.y += jumpVelocity * dt; if (local.position.y <= 0) { local.position.y = 0; jumpVelocity = 0; onGround = true; } local.position.x = Math.max(-9, Math.min(9, local.position.x)); local.position.z = Math.max(-5, Math.min(5, local.position.z)); camera.target = Vector3.Lerp(camera.target, local.position.add(new Vector3(0, 1.1, 0)), Math.min(1, dt * 8)); boss.rotation.y += dt * 0.4; shield.rotation.z += dt * 0.7; bridge.scaling.y = 1 + Math.sin(performance.now() * 0.003) * 0.04; });
    const onResize = () => engine.resize(); window.addEventListener("resize", onResize); engine.runRenderLoop(() => scene.render()); return () => { scene.onKeyboardObservable.remove(keyboard); scene.onBeforeRenderObservable.remove(before); window.removeEventListener("resize", onResize); engine.dispose(); };
  }, [role]);
  return <canvas ref={ref} className="game-canvas" aria-label="Thành phố Trên Mây — scene cinematic" />;
}

