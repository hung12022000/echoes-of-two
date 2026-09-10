import { useEffect, useRef } from "react";
import { Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, MeshBuilder, StandardMaterial, Color3, Vector3, GlowLayer } from "@babylonjs/core";
import type { Role } from "./rules";

export function GameCanvas({ role }: { role: Role }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }); const scene = new Scene(engine); scene.clearColor = new Color3(0.025, 0.04, 0.1).toColor4();
    const camera = new ArcRotateCamera("camera", -Math.PI / 2, 1.08, 16, new Vector3(0, 1, 0), scene); camera.attachControl(canvas, true); camera.lowerRadiusLimit = 7; camera.upperRadiusLimit = 22;
    new HemisphericLight("sky", new Vector3(0, 1, 0), scene).intensity = 0.7; const sun = new DirectionalLight("sun", new Vector3(-0.5, -1, 0.3), scene); sun.intensity = 1.1;
    const glow = new GlowLayer("resonance", scene); glow.intensity = 0.65;
    const ground = MeshBuilder.CreateBox("island", { width: 22, height: 0.8, depth: 14 }, scene); ground.position.y = -0.8; const groundMat = new StandardMaterial("stone", scene); groundMat.diffuseColor = new Color3(0.16, 0.2, 0.3); ground.material = groundMat;
    for (let i = -4; i <= 4; i += 2) { const tower = MeshBuilder.CreateBox(`tower-${i}`, { width: 1.5, height: 4 + Math.abs(i) * 0.2, depth: 1.5 }, scene); tower.position.set(i * 1.6, 1.4, 3.5); const mat = new StandardMaterial(`towerMat-${i}`, scene); mat.diffuseColor = new Color3(0.25, 0.3, 0.4); tower.material = mat; }
    const player = MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.42 }, scene); player.position = new Vector3(role === "hung" ? -2 : 2, 0.4, 0); const playerMat = new StandardMaterial("playerMat", scene); playerMat.diffuseColor = role === "hung" ? new Color3(1, 0.38, 0.08) : new Color3(0.05, 0.8, 1); player.material = playerMat;
    const core = MeshBuilder.CreateTorus("core", { diameter: 2.2, thickness: 0.14 }, scene); core.position.set(0, 1.5, -2); const coreMat = new StandardMaterial("coreMat", scene); coreMat.emissiveColor = new Color3(0.2, 0.9, 1); core.material = coreMat;
    const onResize = () => engine.resize(); window.addEventListener("resize", onResize); engine.runRenderLoop(() => scene.render()); return () => { window.removeEventListener("resize", onResize); engine.dispose(); };
  }, [role]);
  return <canvas ref={ref} className="game-canvas" aria-label="Thành phố Trên Mây" />;
}
