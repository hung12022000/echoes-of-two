import { useEffect, useRef, useState } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { loadCharacter } from './player/character';
import { cameraRelative } from './player/motion';
import { Encounter, noInput } from './combat/encounter';
import { buildTemple } from './world/temple';
import { createWarden } from './boss/warden';
import { createEffects } from './vfx/effects';
import { GameSound } from './audio/sound';
import type { Role } from './rules';
import { buildVietnam } from './world/vietnam';
import { terrainHeight } from './world/terrain';
import { type PeerRoom, parseControls } from '../multiplayer/peerRoom';
import { applySnapshot, snapshot } from '../multiplayer/gameSnapshot';
import type { CombatEffect } from './combat/encounter';

export type Quality = 'low' | 'medium' | 'high';
export interface HudState { role: Role; hp: number; partnerHp: number; motion: string; bossHp: number; phase: number; status: string; marks: number; exposed: number; resonance: number; skill: number; prompt: string; progress: number; message: string; fps: number; x: number; z: number; y: number; partnerX: number; partnerZ: number }
export function GameCanvas({ role, quality, reducedMotion, muted, paused, onHud, room }: { role: Role; quality: Quality; reducedMotion: boolean; muted: boolean; paused: boolean; onHud: (state: HudState) => void; room?: PeerRoom }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const options = useRef({ reducedMotion, muted, paused, onHud }); options.current = { reducedMotion, muted, paused, onHud };
  const [loading, setLoading] = useState('Đang dựng Vịnh Ngọc…');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let disposed = false;
    let engine: Engine | undefined;
    let stopNetwork: (() => void) | undefined;
    const sound = new GameSound();
    const pressed = new Set<string>(); const edges = new Set<string>();
    const clear = () => { pressed.clear(); edges.clear(); };
    const down = (e: KeyboardEvent) => { if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return; if (['Space', 'Tab', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); if (!e.repeat) edges.add(e.code); pressed.add(e.code); sound.resume(); };
    const up = (e: KeyboardEvent) => pressed.delete(e.code);
    const pointerDown = (e: PointerEvent) => { if (e.button === 0) pressed.add('Attack'); if (e.button === 2) pressed.add('Guard'); canvas.focus(); sound.resume(); };
    const pointerUp = () => { pressed.delete('Attack'); pressed.delete('Guard'); };
    const context = (e: Event) => e.preventDefault();
    const resize = () => engine?.resize();
    async function boot() {
      try {
        setError(''); setLoading('Đang nạp model Hưng & Mei.100 và hoạt ảnh…');
        engine = new Engine(canvas!, true, { stencil: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
        engine.setHardwareScalingLevel(quality === 'low' ? 1.65 : quality === 'medium' ? 1.2 : 1);
        const scene = new Scene(engine);
        const camera = new ArcRotateCamera('cooperative camera', -Math.PI / 2, 1.36, 6.8, new Vector3(0, 1.2 + terrainHeight(0,55), 55), scene);
        camera.attachControl(canvas!, true); camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');
        const pointerInput = camera.inputs.attached.pointers;
        if (pointerInput && 'buttons' in pointerInput) (pointerInput as { buttons: number[] }).buttons = [1, 2];
        camera.lowerRadiusLimit = 2.5; camera.upperRadiusLimit = 15; camera.lowerBetaLimit = 0.35; camera.upperBetaLimit = 1.52; camera.wheelPrecision = 65; camera.fov = 0.78; camera.minZ = 0.1;
        const { shadows } = buildTemple(scene, quality);
        const nature = buildVietnam(scene, shadows);
        const boss = createWarden(scene, shadows), effects = createEffects(scene);
        const [hung, mei] = await Promise.all([loadCharacter(scene, 'hung', shadows), loadCharacter(scene, 'mei', shadows)]);
        if (disposed) { scene.dispose(); return; }
        const characters = { hung, mei };
        let state = new Encounter(role, Boolean(room)), hudTimer = 0, stepTimer = 0, portrait = false;
        let networkTimer = 0, seq = 0, remoteInput = noInput(), lastRemoteInput = 0;
        let pendingEffects: CombatEffect[] = [];
        stopNetwork = room?.onGame(packet => {
          if (packet.type === 'input') { const parsed = parseControls(packet.payload); if (parsed) { remoteInput = parsed; lastRemoteInput = performance.now(); } }
          else { const oldZ=state.local.z; if (applySnapshot(state, packet.payload)) { if(Math.abs(oldZ-state.local.z)>20) camera.alpha=state.local.z<20?Math.PI/2:-Math.PI/2; for (const e of state.effects) { effects.emit(e); sound.play(e.kind); } } }
        });
        setLoading('');
        window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear);
        canvas!.addEventListener('pointerdown', pointerDown); window.addEventListener('pointerup', pointerUp); canvas!.addEventListener('contextmenu', context); window.addEventListener('resize', resize);
        canvas!.focus();
        scene.onAfterAnimationsObservable.add(() => {
          if (options.current.paused || (room && !room.view.connected)) return;
          characters.hung.pose(state.actors.hung); characters.mei.pose(state.actors.mei);
        });
        engine!.runRenderLoop(() => {
          if (disposed) return;
          const dt = Math.min(engine!.getDeltaTime() / 1000, 0.05);
          sound.enabled = !options.current.muted;
          if (!options.current.paused && (!room || room.view.connected)) {
            if (edges.has('Tab') && !room) state.swap();
            if (edges.has('KeyR') && (!room || room.view.isHost)) state = new Encounter(state.activeRole, Boolean(room));
            if (edges.has('KeyB') && (!room || room.view.isHost)) { state.travelToArena(); camera.alpha=Math.PI/2; camera.radius=7.5;camera.beta=1.24; }
            if (edges.has('KeyV')) { portrait = !portrait; camera.alpha = state.local.yaw + (portrait ? Math.PI/2 : -Math.PI/2); camera.radius = portrait ? 3.4 : 7.5; camera.beta = portrait ? 1.4 : 1.24; }
            const movement = cameraRelative(Number(pressed.has('KeyD')) - Number(pressed.has('KeyA')), Number(pressed.has('KeyW')) - Number(pressed.has('KeyS')), camera.alpha);
            const input = { ...noInput(), ...movement, sprint: pressed.has('ShiftLeft') || pressed.has('ShiftRight'), jump: edges.has('Space'), dodge: edges.has('KeyX'), attack: pressed.has('Attack') || pressed.has('KeyJ'), skill: edges.has('KeyQ'), interact: pressed.has('KeyE'), guard: pressed.has('Guard') || pressed.has('ControlLeft') };
            if (!room || room.view.isHost) {
              if (performance.now() - lastRemoteInput > 1500) remoteInput = noInput();
              state.step(dt, input, remoteInput);
              remoteInput = { ...remoteInput, jump: false, skill: false, dodge: false };
              for (const effect of state.effects) { effects.emit(effect); sound.play(effect.kind); }
              pendingEffects.push(...state.effects); pendingEffects = pendingEffects.slice(-64);
            }
            const now = performance.now();
            if (room && (now - networkTimer >= 1000 / 12 || input.jump || input.skill || input.dodge)) {
              networkTimer = now;
              room.sendGame({ type: room.view.isHost ? 'snapshot' : 'input', seq: seq++, payload: room.view.isHost ? snapshot(state, pendingEffects) : input }); pendingEffects = [];
            }
            characters.hung.update(state.actors.hung, dt); characters.mei.update(state.actors.mei, dt);
            effects.update(dt); boss.update(state, options.current.reducedMotion); nature.update(state.elapsed, options.current.reducedMotion);
            const a = state.local; const target = new Vector3(a.x, (portrait ? 1.35 : 1.2) + terrainHeight(a.x, a.z), a.z);
            Vector3.LerpToRef(camera.target, target, 1 - Math.exp(-6 * dt), camera.target);
            stepTimer += dt;
            if ((a.motion === 'walk' || a.motion === 'run') && stepTimer > (a.motion === 'run' ? 0.27 : 0.38)) { sound.play('step'); stepTimer = 0; }
          } else clear();
          edges.clear();
          scene.animationsEnabled = !options.current.paused && (!room || room.view.connected);
          scene.render(); hudTimer += dt;
          if (hudTimer > 0.1) {
            hudTimer = 0; const a = state.local, p = state.partner;
            options.current.onHud({ role: a.role, hp: a.hp, partnerHp: p.hp, motion: a.motion, bossHp: state.bossHp, phase: state.phase, status: state.status, marks: state.marks, exposed: state.exposed, resonance: state.resonance, skill: a.skillCooldown, prompt: state.partnerDistance < 2.6 ? p.hp <= 0 ? 'Giữ E · Kéo đồng đội đứng dậy' : 'Giữ E · Cộng hưởng cùng đồng đội' : 'Đến gần đồng đội để cộng hưởng', progress: p.hp <= 0 ? state.reviveProgress / 3 : state.linkProgress / 1.8, message: state.message, fps: Math.round(engine!.getFps()), x: a.x, z: a.z, y: a.y, partnerX: p.x, partnerZ: p.z });
          }
        });
      } catch (cause) { if (!disposed) { setLoading(''); setError(`Không thể tải cảnh 3D. Kiểm tra WebGL/kết nối rồi thử lại. ${cause instanceof Error ? cause.message : 'ASSET_LOAD_FAILED'}`); } }
    }
    void boot();
    return () => { disposed = true; clear(); stopNetwork?.(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); window.removeEventListener('pointerup', pointerUp); window.removeEventListener('resize', resize); canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('contextmenu', context); sound.dispose(); engine?.dispose(); };
  }, [role, quality, retry, room]);
  return <><canvas ref={ref} className="game-canvas" tabIndex={0} aria-label="Vịnh Ngọc — điều khiển nhân vật 3D" />{loading && <div className="loading-panel" role="status"><span className="spinner" /><h2>{loading}</h2><p>Hai nhân vật có rig · 12 animation từ Blender · tài nguyên cảnh khoảng 20 MB</p></div>}{error && <div className="loading-panel" role="alert"><h2>Không thể vào game</h2><p>{error}</p><button onClick={() => setRetry(r => r + 1)}>Thử tải lại</button></div>}</>;
}
