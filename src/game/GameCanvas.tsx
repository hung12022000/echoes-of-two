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
import { animatedTerrainHeight, constrainWalkableMotion, terrainHeight, type WalkableArea } from './world/terrain';
import { type PeerRoom, parseControls } from '../multiplayer/peerRoom';
import { applySnapshot, snapshot } from '../multiplayer/gameSnapshot';
import type { CombatEffect } from './combat/encounter';
import { createOceanboundWorld } from './world/oceanbound';
import type { OceanSession } from './oceanbound/session';
import { createFirstPersonViewModel } from './player/viewmodel';
import { isBlockedByBuildings } from './world/collision';

export type Quality = 'low' | 'medium' | 'high';
export interface HudState { role: Role; hp: number; partnerHp: number; motion: string; bossHp: number; phase: number; status: string; marks: number; exposed: number; resonance: number; skill: number; prompt: string; progress: number; message: string; fps: number; x: number; z: number; y: number; partnerX: number; partnerZ: number }
export function GameCanvas({ role, quality, reducedMotion, muted, paused, onHud, room, ocean }: { role: Role; quality: Quality; reducedMotion: boolean; muted: boolean; paused: boolean; onHud: (state: HudState) => void; room?: PeerRoom; ocean: OceanSession }) {
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
    const down = (e: KeyboardEvent) => { if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return; if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); if (!e.repeat) edges.add(e.code); pressed.add(e.code); sound.resume(); };
    const up = (e: KeyboardEvent) => pressed.delete(e.code);
    const pointerDown = (e: PointerEvent) => { if (e.button === 0) pressed.add('Attack'); if (e.button === 2) pressed.add('Guard'); canvas.focus(); sound.resume(); };
    const pointerUp = () => { pressed.delete('Attack'); pressed.delete('Guard'); };
    const context = (e: Event) => e.preventDefault();
    const resize = () => engine?.resize();
    async function boot() {
      try {
        setError(''); setLoading('Đang nạp model Hưng & Mei.100 và hoạt ảnh…');
        engine = new Engine(canvas!, true, { stencil: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
        const baseScaling = quality === 'low' ? 1.65 : quality === 'medium' ? 1.2 : 1;
        let adaptiveScaling = baseScaling, performanceTimer = 0;
        engine.setHardwareScalingLevel(adaptiveScaling);
        const scene = new Scene(engine);
        scene.skipPointerMovePicking = true;
        const camera = new ArcRotateCamera('cooperative camera', -Math.PI / 2, 1.36, 6.8, new Vector3(0, 1.2 + terrainHeight(0,81), 81), scene);
        camera.attachControl(canvas!, true); camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');
        const pointerInput = camera.inputs.attached.pointers;
        if (pointerInput && 'buttons' in pointerInput) {
          const pointer = pointerInput as { buttons: number[]; angularSensibilityX?: number; angularSensibilityY?: number };
          pointer.buttons = [0, 1, 2]; pointer.angularSensibilityX = 6500; pointer.angularSensibilityY = 7200;
        }
        camera.lowerAlphaLimit = null; camera.upperAlphaLimit = null; camera.inertia = .76;
        camera.lowerRadiusLimit = 0.12; camera.upperRadiusLimit = 15; camera.lowerBetaLimit = 0.35; camera.upperBetaLimit = 1.56; camera.wheelPrecision = 65; camera.fov = 0.88; camera.minZ = 0.03;
        const { shadows } = buildTemple(scene, quality);
        const nature = buildVietnam(scene, shadows);
        const oceanWorld = createOceanboundWorld(scene, shadows);
        const boss = createWarden(scene, shadows), effects = createEffects(scene);
        const [hung, mei] = await Promise.all([loadCharacter(scene, 'hung', shadows), loadCharacter(scene, 'mei', shadows)]);
        if (disposed) { scene.dispose(); return; }
        const characters = { hung, mei };
        const viewModel = createFirstPersonViewModel(scene, role);
        let state = new Encounter(role, Boolean(room)), hudTimer = 0, stepTimer = 0, firstPerson = true;
        const campaignArea = (): WalkableArea => ocean.view.phase === 'raft' || ocean.view.phase === 'challenge' ? 'raft' : 'island';
        let movementArea: WalkableArea = campaignArea();
        const updateCharacterVisibility = () => { characters.hung.root.setEnabled(!firstPerson || state.activeRole !== 'hung'); characters.mei.root.setEnabled(!firstPerson || state.activeRole !== 'mei'); };
        updateCharacterVisibility(); camera.radius = 0.16; camera.beta = 1.48;
        const moveParty = (x: number, z: number) => { for (const actor of Object.values(state.actors)) { actor.x = x + (actor.role === 'hung' ? -1 : 1); actor.z = z; actor.y = 0; actor.vx = actor.vz = actor.vy = 0; actor.grounded = true; actor.yaw = Math.PI; } };
        moveParty(ocean.view.spawnX, ocean.view.spawnZ);
        let lastTransition = ocean.view.transitionId, lastStatus = state.status;
        let networkTimer = 0, seq = 0, remoteInput = noInput(), lastRemoteInput = 0;
        let pendingEffects: CombatEffect[] = [];
        let lastCraftJob = '', lastCraftPulse = ocean.view.craftPulse, lastBuildingCount = ocean.view.buildings.length, lastCropCount = ocean.view.crops.length, lastWeather = ocean.view.weather, lastSharkPulse = ocean.view.sharkRaid.pulse;
        ocean.configureNetwork(room ? room.view.isHost ? 'host' : 'guest' : 'offline', room && !room.view.isHost ? action => room.sendAction(action) : undefined);
        stopNetwork = room?.onGame(packet => {
          if (packet.type === 'input') { const parsed = parseControls(packet.payload); if (parsed) { remoteInput = parsed; lastRemoteInput = performance.now(); } }
          else if (packet.type === 'command') ocean.applyRemoteAction(packet.payload);
          else { const oldZ=state.local.z; if (applySnapshot(state, packet.payload, true)) { ocean.importNetwork((packet.payload as { ocean?: unknown }).ocean); if(Math.abs(oldZ-state.local.z)>20) camera.alpha=state.local.z<20?Math.PI/2:-Math.PI/2; for (const e of state.effects) { effects.emit(e); sound.play(e.kind); } } }
        });
        setLoading('');
        window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear);
        canvas!.addEventListener('pointerdown', pointerDown); window.addEventListener('pointerup', pointerUp); canvas!.addEventListener('contextmenu', context); window.addEventListener('resize', resize);
        canvas!.focus();
        scene.onAfterAnimationsObservable.add(() => {
          const canSimulate = !room || room.view.connected || (room.view.isHost && room.view.started);
          if (options.current.paused || !canSimulate) return;
          characters.hung.pose(state.actors.hung); characters.mei.pose(state.actors.mei);
        });
        engine!.runRenderLoop(() => {
          if (disposed) return;
          const dt = Math.min(engine!.getDeltaTime() / 1000, 0.05);
          sound.enabled = !options.current.muted;
          const canSimulate = !room || room.view.connected || (room.view.isHost && room.view.started);
          if (!options.current.paused && canSimulate) {
            state.skillTier = Math.min(3, ocean.view.completedIslands.length + (ocean.view.phase === 'island' ? 1 : 0));
            if (ocean.view.transitionId !== lastTransition) { lastTransition = ocean.view.transitionId; state = new Encounter(state.activeRole, Boolean(room)); movementArea = campaignArea(); moveParty(ocean.view.spawnX, ocean.view.spawnZ); camera.alpha = -Math.PI / 2; camera.radius = 7.5; }
            if (edges.has('Tab') && !room) { state.swap(); updateCharacterVisibility(); }
            if (edges.has('KeyR') && (!room || room.view.isHost)) { state = new Encounter(state.activeRole, Boolean(room)); movementArea = campaignArea(); }
            if (edges.has('KeyK') && sessionStorage.getItem('echoes.qa.shortcuts') === '1' && (!room || room.view.isHost)) { state.travelToArena(); movementArea = 'arena'; camera.alpha=Math.PI/2; camera.radius=7.5;camera.beta=1.24; }
            if (edges.has('KeyV')) { firstPerson = !firstPerson; updateCharacterVisibility(); camera.alpha = firstPerson ? state.local.yaw + Math.PI : -Math.PI / 2; camera.radius = firstPerson ? 0.16 : 7.5; camera.beta = firstPerson ? 1.48 : 1.24; camera.fov = firstPerson ? 0.88 : 0.78; }
            const movement = cameraRelative(Number(pressed.has('KeyD') || pressed.has('ArrowRight')) - Number(pressed.has('KeyA') || pressed.has('ArrowLeft')), Number(pressed.has('KeyW') || pressed.has('ArrowUp')) - Number(pressed.has('KeyS') || pressed.has('ArrowDown')), camera.alpha);
            const input = { ...noInput(), ...movement, sprint: pressed.has('ShiftLeft') || pressed.has('ShiftRight'), jump: edges.has('Space'), dodge: edges.has('KeyX'), attack: pressed.has('Attack') || pressed.has('KeyJ'), skill: edges.has('KeyQ'), interact: pressed.has('KeyE'), guard: pressed.has('Guard') || pressed.has('ControlLeft') };
            const actor = state.local;
            const nearby = oceanWorld.nearestResource(actor.x, actor.z);
            ocean.setNearby(nearby);
            ocean.setPosition(actor.x, actor.z);
            if (edges.has('KeyF')) {
              const tool = ocean.view.selectedTool; viewModel.cast();
              if (tool === 'hook') { sound.play('hook'); if (nearby && ocean.gather(nearby.nodeId, nearby.item, nearby.amount)) { oceanWorld.collect(nearby.nodeId); sound.play(nearby.item === 'fish' ? 'fish' : 'gather'); } }
              else if (tool === 'spear') { sound.play('spear'); ocean.defendShark(); }
              else if (tool === 'hammer') sound.play('hammer');
              else if (tool === 'shovel') sound.play('shovel');
              else if (tool === 'watering_can') sound.play('water');
            }
            if (edges.has('KeyB') && ocean.placeSelected(actor.x + Math.sin(actor.yaw) * 2.4, actor.z + Math.cos(actor.yaw) * 2.4, actor.yaw)) { viewModel.cast(); sound.play('build'); }
            if (!room || room.view.isHost) {
              if (performance.now() - lastRemoteInput > 1500) remoteInput = noInput();
              const partnerDown = state.partner.hp <= 0, localDown = state.local.hp <= 0;
              const hasRescueKit = (ocean.view.inventory.rescue_kit ?? 0) > 0;
              const safeInput = partnerDown && !hasRescueKit ? { ...input, interact: false } : input;
              const safeRemote = localDown && !hasRescueKit ? { ...remoteInput, interact: false } : remoteInput;
              const before = Object.fromEntries(Object.entries(state.actors).map(([key, value]) => [key, { x: value.x, z: value.z }]));
              state.step(dt, safeInput, safeRemote);
              for (const [key, player] of Object.entries(state.actors)) {
                const constrained = constrainWalkableMotion(before[key], player, movementArea, ocean.view.buildings);
                player.x = constrained.x; player.z = constrained.z;
                if (constrained.blockedX) player.vx *= .16;
                if (constrained.blockedZ) player.vz *= .16;
                if (isBlockedByBuildings(player.x, player.z, ocean.view.buildings)) { player.x = before[key].x; player.z = before[key].z; player.vx = player.vz = 0; }
              }
              if ((partnerDown && state.partner.hp > 0) || (localDown && state.local.hp > 0)) ocean.useRescueKit();
              if (state.status !== lastStatus) {
                if (state.status === 'victory') ocean.recordBossVictory();
                if (state.status === 'defeat') ocean.handlePartyDefeat();
                lastStatus = state.status;
              }
              remoteInput = { ...remoteInput, jump: false, skill: false, dodge: false };
              for (const effect of state.effects) { effects.emit(effect); sound.play(effect.kind); }
              pendingEffects.push(...state.effects); pendingEffects = pendingEffects.slice(-64);
            } else {
              const before = { x: state.local.x, z: state.local.z };
              state.predictLocalMovement(dt, input);
              const constrained = constrainWalkableMotion(before, state.local, movementArea, ocean.view.buildings);
              state.local.x = constrained.x; state.local.z = constrained.z;
              if (constrained.blockedX) state.local.vx *= .16;
              if (constrained.blockedZ) state.local.vz *= .16;
              if (isBlockedByBuildings(state.local.x, state.local.z, ocean.view.buildings)) { state.local.x = before.x; state.local.z = before.z; state.local.vx = state.local.vz = 0; }
            }
            const now = performance.now();
            if (room && (now - networkTimer >= 1000 / 12 || input.jump || input.skill || input.dodge)) {
              networkTimer = now;
              room.sendGame({ type: room.view.isHost ? 'snapshot' : 'input', seq: seq++, payload: room.view.isHost ? { ...snapshot(state, pendingEffects), ocean: ocean.exportNetwork() } : input }); pendingEffects = [];
            }
            ocean.tick(dt, Math.hypot(actor.vx, actor.vz) > 0.3);
            const currentCraft = ocean.view.crafting?.id ?? '';
            if (currentCraft && currentCraft !== lastCraftJob) sound.play('craft');
            if (ocean.view.craftPulse !== lastCraftPulse) { sound.play('craft'); lastCraftPulse = ocean.view.craftPulse; }
            if (ocean.view.buildings.length > lastBuildingCount) sound.play('build');
            if (ocean.view.crops.length > lastCropCount) sound.play('plant');
            if (ocean.view.crops.length < lastCropCount) sound.play('harvest');
            if (ocean.view.weather !== lastWeather && (ocean.view.weather === 'Giông sét' || ocean.view.weather === 'Bão nhiệt đới')) sound.play('thunder');
            if (ocean.view.sharkRaid.pulse !== lastSharkPulse) { sound.play(ocean.view.sharkRaid.phase === 'biting' ? 'bite' : ocean.view.sharkRaid.phase === 'repelled' ? 'spear' : 'shark'); lastSharkPulse = ocean.view.sharkRaid.pulse; }
            lastCraftJob = currentCraft; lastBuildingCount = ocean.view.buildings.length; lastCropCount = ocean.view.crops.length; lastWeather = ocean.view.weather;
            oceanWorld.syncBuildings(ocean.view.buildings);
            oceanWorld.syncCrops(ocean.view.crops);
            const severeSea = ocean.view.weather === 'Bão nhiệt đới' || ocean.view.weather === 'Giông sét';
            characters.hung.update(state.actors.hung, dt, animatedTerrainHeight(state.actors.hung.x, state.actors.hung.z, state.elapsed, severeSea, options.current.reducedMotion, movementArea, ocean.view.buildings));
            characters.mei.update(state.actors.mei, dt, animatedTerrainHeight(state.actors.mei.x, state.actors.mei.z, state.elapsed, severeSea, options.current.reducedMotion, movementArea, ocean.view.buildings));
            effects.update(dt); boss.update(state, options.current.reducedMotion); nature.update(state.elapsed, options.current.reducedMotion, ocean.view.weather, ocean.view.minute);
            oceanWorld.update(state.elapsed, ocean.view.weather, options.current.reducedMotion, ocean.view.ending, ocean.view.crafting, ocean.view.craftPulse, actor.x, actor.z, ocean.view.sharkRaid);
            viewModel.update(camera, state.elapsed, Math.hypot(actor.vx, actor.vz) > .3, firstPerson, options.current.reducedMotion, ocean.view.selectedTool);
            sound.update(dt, ocean.view.weather);
            const a = state.local; if (firstPerson) camera.radius = 0.16; const target = new Vector3(a.x, (firstPerson ? 1.57 : 1.2) + animatedTerrainHeight(a.x, a.z, state.elapsed, severeSea, options.current.reducedMotion, movementArea, ocean.view.buildings), a.z);
            Vector3.LerpToRef(camera.target, target, 1 - Math.exp(-6 * dt), camera.target);
            performanceTimer += dt;
            if (performanceTimer >= 3) {
              performanceTimer = 0;
              const fps = engine!.getFps(); const maximum = quality === 'low' ? 2 : quality === 'medium' ? 1.65 : 1.45;
              const next = fps < 42 ? Math.min(maximum, adaptiveScaling + 0.12) : fps > 57 ? Math.max(baseScaling, adaptiveScaling - 0.08) : adaptiveScaling;
              if (Math.abs(next - adaptiveScaling) > 0.01) { adaptiveScaling = next; engine!.setHardwareScalingLevel(adaptiveScaling); }
            }
            stepTimer += dt;
            if ((a.motion === 'walk' || a.motion === 'run') && stepTimer > (a.motion === 'run' ? 0.27 : 0.38)) { sound.play('step'); stepTimer = 0; }
          } else clear();
          edges.clear();
          scene.animationsEnabled = !options.current.paused && canSimulate;
          scene.render(); hudTimer += dt;
          if (hudTimer > 0.1) {
            hudTimer = 0; const a = state.local, p = state.partner;
            options.current.onHud({ role: a.role, hp: a.hp, partnerHp: p.hp, motion: a.motion, bossHp: state.bossHp, phase: state.phase, status: state.status, marks: state.marks, exposed: state.exposed, resonance: state.resonance, skill: a.skillCooldown, prompt: state.partnerDistance < 2.6 ? p.hp <= 0 ? (ocean.view.inventory.rescue_kit ?? 0) > 0 ? 'Giữ E · Dùng Bộ cứu hộ hồi sinh đồng đội' : 'Cần chế tạo 🛟 Bộ cứu hộ để hồi sinh' : 'Giữ E · Cộng hưởng cùng đồng đội' : 'Đến gần đồng đội để cộng hưởng', progress: p.hp <= 0 ? state.reviveProgress / 3 : state.linkProgress / 1.8, message: state.message, fps: Math.round(engine!.getFps()), x: a.x, z: a.z, y: a.y, partnerX: p.x, partnerZ: p.z });
          }
        });
      } catch (cause) { if (!disposed) { setLoading(''); setError(`Không thể tải cảnh 3D. Kiểm tra WebGL/kết nối rồi thử lại. ${cause instanceof Error ? cause.message : 'ASSET_LOAD_FAILED'}`); } }
    }
    void boot();
    return () => { disposed = true; clear(); stopNetwork?.(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); window.removeEventListener('pointerup', pointerUp); window.removeEventListener('resize', resize); canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('contextmenu', context); sound.dispose(); engine?.dispose(); };
  }, [role, quality, retry, room, ocean]);
  return <><canvas ref={ref} className="game-canvas" tabIndex={0} aria-label="Vịnh Ngọc — điều khiển nhân vật 3D" />{loading && <div className="loading-panel" role="status"><span className="spinner" /><h2>{loading}</h2><p>Hai nhân vật có rig · 12 animation từ Blender · tài nguyên cảnh khoảng 20 MB</p></div>}{error && <div className="loading-panel" role="alert"><h2>Không thể vào game</h2><p>{error}</p><button onClick={() => setRetry(r => r + 1)}>Thử tải lại</button></div>}</>;
}
