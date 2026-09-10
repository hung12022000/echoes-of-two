import type { Role } from '../rules';
import { damp, turnTowards, type Motion, type V2 } from '../player/motion';

export interface Actor extends V2 {
  role: Role; y: number; vx: number; vz: number; vy: number; yaw: number;
  hp: number; maxHp: number; motion: Motion; action: number; cooldown: number;
  skillCooldown: number; invulnerable: number; grounded: boolean; land: number;
}
export type EffectKind = 'bolt' | 'strike' | 'pulse' | 'impact' | 'slam' | 'link' | 'phase';
export interface CombatEffect { kind: EffectKind; x: number; z: number; targetX: number; targetZ: number; role: Role }
export interface Controls { x: number; z: number; sprint: boolean; jump: boolean; attack: boolean; skill: boolean; dodge: boolean; interact: boolean; guard: boolean }
export const noInput = (): Controls => ({ x: 0, z: 0, sprint: false, jump: false, attack: false, skill: false, dodge: false, interact: false, guard: false });
export const bossPosition = { x: 0, z: -4 };
const distance = (a: V2, b: V2) => Math.hypot(a.x - b.x, a.z - b.z);
function actor(role: Role): Actor {
  const maxHp = role === 'hung' ? 120 : 90;
  return { role, x: role === 'hung' ? -1 : 1, z: 55, y: 0, vx: 0, vz: 0, vy: 0, yaw: 0, hp: maxHp, maxHp, motion: 'idle', action: 0, cooldown: 0, skillCooldown: 0, invulnerable: 0, grounded: true, land: 0 };
}

/** Deterministic encounter, simulated by the host online or locally with an AI. */
export class Encounter {
  actors: Record<Role, Actor> = { hung: actor('hung'), mei: actor('mei') };
  activeRole: Role;
  bossHp = 900;
  phase: 1 | 2 | 3 = 1;
  status: 'explore' | 'battle' | 'victory' | 'defeat' = 'explore';
  exposed = 0;
  marks = 0;
  resonance = 0;
  linkProgress = 0;
  reviveProgress = 0;
  telegraph = 0;
  attackTimer = 3;
  elapsed = 0;
  message = 'Hòn Trống Mái phía trước · Khám phá bờ biển cùng nhau. K: đến đấu trường. Giữ E gần đồng đội để cộng hưởng.';
  effects: CombatEffect[] = [];
  private aiCooldown = 0;
  private jumpBuffer = 0;
  constructor(role: Role, public online = false) { this.activeRole = role; }
  get local() { return this.actors[this.activeRole]; }
  get partner() { return this.actors[this.activeRole === 'hung' ? 'mei' : 'hung']; }
  get partnerDistance() { return distance(this.local, this.partner); }
  swap() { this.activeRole = this.activeRole === 'hung' ? 'mei' : 'hung'; }
  travelToArena() {
    if(this.status !== 'explore') return;
    for(const p of Object.values(this.actors)) { p.x=p.role==='hung'?-1:1;p.z=5;p.y=0;p.vx=p.vz=p.vy=0;p.grounded=true;p.yaw=Math.PI; }
    this.message='Cổ môn Astra · Tiến gần Warden rồi J tấn công. Mei tích 5 dấu, Hưng Q phá giáp; cùng giữ E để cộng hưởng.';
  }
  emit(kind: EffectKind, source: V2, role: Role, target = bossPosition) { this.effects.push({ kind, ...source, targetX: target.x, targetZ: target.z, role }); }
  startBattle() { if (this.status !== 'explore') return; this.status = 'battle'; this.message = 'Warden thức tỉnh! Mei tích dấu năng lượng; Hưng Q phá giáp. Hoặc cùng giữ E để cộng hưởng.'; this.emit('phase', bossPosition, 'mei'); }
  hitBoss(amount: number, source: Actor) {
    if (this.status !== 'battle') return;
    this.bossHp = Math.max(0, this.bossHp - amount * (this.exposed > 0 ? 1 : 0.2));
    this.resonance = Math.min(100, this.resonance + 5);
    this.emit('impact', bossPosition, source.role);
    const phase = this.bossHp <= 300 ? 3 : this.bossHp <= 600 ? 2 : 1;
    if (phase !== this.phase) { this.phase = phase; this.emit('phase', bossPosition, 'mei'); this.message = phase === 2 ? 'Phase II · Sóng chấn động nhanh hơn — nhảy hoặc né đúng nhịp!' : 'Phase III · Lõi vỡ — phối hợp kết thúc Warden!'; }
    if (!this.bossHp) { this.status = 'victory'; this.message = 'Hai nhịp tim. Một bầu trời. Astra đã thức tỉnh.'; this.telegraph = 0; this.emit('link', bossPosition, 'hung'); }
  }
  attack(a: Actor, skill = false) {
    if (a.hp <= 0 || a.action > 0 || a.cooldown > 0 || (skill && a.skillCooldown > 0)) return;
    const range = distance(a, bossPosition);
    if (range > (a.role === 'hung' ? skill ? 5 : 3.5 : 22)) { this.message = 'Tiến gần Warden hơn để đòn đánh chạm mục tiêu.'; return; }
    this.startBattle();
    a.yaw = Math.atan2(bossPosition.x - a.x, bossPosition.z - a.z);
    a.motion = skill ? 'skill' : 'attack'; a.action = skill ? 0.85 : 0.5; a.cooldown = skill ? 0.9 : 0.5;
    if (skill) a.skillCooldown = 7;
    this.emit(a.role === 'mei' ? 'bolt' : skill ? 'pulse' : 'strike', a, a.role);
    if (a.role === 'mei') { this.marks = Math.min(5, this.marks + (skill ? 3 : 1)); this.hitBoss(skill ? 30 : 12, a); }
    else {
      if (skill && this.marks >= 5) { this.exposed = 6; this.marks = 0; this.message = 'PHÁ GIÁP! Sáu giây để cả hai dồn sát thương.'; this.emit('phase', bossPosition, 'hung'); }
      this.hitBoss(skill ? 65 : 24, a);
    }
  }
  step(dt: number, input: Controls, remote = noInput()) {
    dt = Math.min(0.05, Math.max(0, dt)); this.elapsed += dt;
    this.effects = [];
    this.exposed = Math.max(0, this.exposed - dt);
    const a = this.local, p = this.partner;
    for (const player of Object.values(this.actors)) {
      player.cooldown = Math.max(0, player.cooldown - dt);
      player.skillCooldown = Math.max(0, player.skillCooldown - dt);
      player.invulnerable = Math.max(0, player.invulnerable - dt);
      player.action = Math.max(0, player.action - dt);
      player.land = Math.max(0, player.land - dt);
    }
    if (this.status === 'victory' || this.status === 'defeat') { for (const player of Object.values(this.actors)) { player.motion = this.status === 'victory' ? 'victory' : 'downed'; player.vx = 0; player.vz = 0; } return; }
    // A held jump never retriggers. The input layer supplies a press edge.
    this.jumpBuffer = input.jump ? 0.15 : Math.max(0, this.jumpBuffer - dt);
    if (this.jumpBuffer && a.grounded && a.hp > 0 && a.action === 0) { a.vy = 6; a.grounded = false; this.jumpBuffer = 0; }
    if (input.dodge && a.hp > 0 && a.action === 0) { a.motion = 'dodge'; a.action = 0.42; a.invulnerable = 0.48; }
    const linking = input.interact && (!this.online || remote.interact || p.hp <= 0) && this.partnerDistance < 2.6 && a.grounded && p.grounded && a.hp > 0;
    if (this.online && remote.interact && a.hp <= 0 && p.hp > 0 && this.partnerDistance < 2.6) {
      this.reviveProgress += dt; p.motion = 'revive';
      if (this.reviveProgress >= 3) { a.hp = a.maxHp * 0.4; a.invulnerable = 2; this.reviveProgress = 0; }
    }
    if (linking && p.hp <= 0) {
      this.reviveProgress += dt; a.motion = 'revive';
      if (this.reviveProgress >= 3) { p.hp = p.maxHp * 0.4; p.invulnerable = 2; p.motion = 'idle'; this.reviveProgress = 0; this.message = 'Đã kéo đồng đội đứng dậy. Tiếp tục cùng nhau!'; }
    } else if (!(this.online && remote.interact && a.hp <= 0 && p.hp > 0)) { this.reviveProgress = 0; }
    if (linking && p.hp > 0) {
      a.motion = p.motion = 'link'; this.linkProgress += dt;
      a.yaw = turnTowards(a.yaw, Math.atan2(p.x - a.x, p.z - a.z), dt);
      p.yaw = turnTowards(p.yaw, Math.atan2(a.x - p.x, a.z - p.z), dt);
      if (this.linkProgress >= 1.8) {
        this.linkProgress = 0; this.resonance = Math.min(100, this.resonance + 35);
        a.hp = Math.min(a.maxHp, a.hp + 8); p.hp = Math.min(p.maxHp, p.hp + 8);
        this.emit('link', a, a.role, p); a.action = p.action = 1;
        if (this.status === 'battle' && this.resonance >= 100) { this.exposed = 7; this.hitBoss(140, a); this.resonance = 0; this.message = 'ECHO BURST · Hai người cùng phá giáp và hồi phục!'; }
        else this.message = 'Cộng hưởng thành công · hồi phục cả hai và tích năng lượng Echo Burst.';
      }
    } else this.linkProgress = 0;
    if (!linking) { if (input.attack) this.attack(a); if (input.skill) this.attack(a, true); }
    const moving = !linking && a.hp > 0 && (a.action <= 0 || a.motion === 'dodge');
    const speed = a.motion === 'dodge' && a.action > 0 ? 10 : input.sprint ? (a.role === 'hung' ? 6.5 : 6.7) : (a.role === 'hung' ? 4.2 : 4.4);
    let mx = input.x, mz = input.z;
    if (a.motion === 'dodge' && a.action > 0 && Math.hypot(mx, mz) < 0.1) { mx = Math.sin(a.yaw); mz = Math.cos(a.yaw); }
    a.vx = damp(a.vx, moving ? mx * speed : 0, 14, dt); a.vz = damp(a.vz, moving ? mz * speed : 0, 14, dt);
    this.move(a, dt);
    if (Math.hypot(a.vx, a.vz) > 0.3 && a.action <= 0 && !linking) a.yaw = turnTowards(a.yaw, Math.atan2(a.vx, a.vz), dt);
    if (!a.grounded) a.motion = a.vy > 0 ? 'jump' : 'fall';
    else if (a.hp <= 0) a.motion = 'downed';
    else if (a.action <= 0 && !linking) a.motion = a.land > 0 ? 'land' : Math.hypot(a.vx, a.vz) > 0.2 ? input.sprint ? 'run' : 'walk' : 'idle';
    // Companion follows a shoulder offset; battles require the player's action.
    const tx = a.x + Math.cos(a.yaw) * 1.7 - Math.sin(a.yaw) * 0.4;
    const tz = a.z - Math.sin(a.yaw) * 1.7 - Math.cos(a.yaw) * 0.4;
    const pd = Math.hypot(tx - p.x, tz - p.z);
    const follow = !this.online && pd > 0.45 && !linking && p.action <= 0 && p.hp > 0;
    const ps = Math.min(6.8, pd * 2.4);
    if (!this.online) { p.vx = damp(p.vx, follow ? (tx - p.x) / pd * ps : 0, 8, dt); p.vz = damp(p.vz, follow ? (tz - p.z) / pd * ps : 0, 8, dt); }
    if (this.online) {
      if (!linking) { if (remote.attack) this.attack(p); if (remote.skill) this.attack(p, true); }
      if (remote.jump && p.grounded && p.hp > 0 && p.action <= 0) { p.grounded = false; p.vy = 6; }
      if (remote.dodge && p.hp > 0 && p.action <= 0) { p.motion = 'dodge'; p.action = 0.42; p.invulnerable = 0.48; }
      const pmoving = p.hp > 0 && !linking && (p.action <= 0 || p.motion === 'dodge');
      const speed = p.motion === 'dodge' && p.action > 0 ? 10 : remote.sprint ? 6.7 : 4.4;
      p.vx = damp(p.vx, pmoving ? remote.x * speed : 0, 14, dt); p.vz = damp(p.vz, pmoving ? remote.z * speed : 0, 14, dt);
      if (pmoving && Math.hypot(p.vx, p.vz) > 0.3) p.yaw = turnTowards(p.yaw, Math.atan2(p.vx, p.vz), dt);
    }
    this.move(p, dt);
    if (follow) { p.yaw = turnTowards(p.yaw, Math.atan2(p.vx, p.vz), dt); p.motion = ps > 4.5 ? 'run' : 'walk'; }
    else if (p.action <= 0 && !linking) p.motion = p.hp <= 0 ? 'downed' : !p.grounded ? p.vy > 0 ? 'jump' : 'fall' : this.online && Math.hypot(p.vx, p.vz) > 0.2 ? remote.sprint ? 'run' : 'walk' : 'idle';
    this.aiCooldown -= dt;
    if (!this.online && this.status === 'battle' && !linking && this.aiCooldown <= 0 && p.hp > 0 && distance(p, bossPosition) < (p.role === 'hung' ? 5 : 22)) {
      this.attack(p, p.role === 'hung' && this.marks >= 5); this.aiCooldown = 0.95;
    }
    if (this.status === 'battle') {
      this.attackTimer -= dt;
      this.telegraph = this.attackTimer < 1.15 ? 1 - Math.max(0, this.attackTimer) / 1.15 : 0;
      if (this.attackTimer <= 0) {
        this.emit('slam', bossPosition, 'mei'); this.attackTimer = this.phase === 3 ? 2.7 : this.phase === 2 ? 3.5 : 4.5; this.telegraph = 0;
        for (const player of Object.values(this.actors)) {
          if (distance(player, bossPosition) < 10 && player.y < 0.65 && player.invulnerable <= 0 && player.hp > 0) {
            player.hp = Math.max(0, player.hp - ((player === a ? input.guard : this.online && remote.guard) ? 5 : 17)); player.motion = player.hp <= 0 ? 'downed' : 'hit'; player.action = 0.4; player.invulnerable = 0.7;
          }
        }
      }
    }
    if (a.hp <= 0 && p.hp <= 0) { this.status = 'defeat'; this.message = 'Liên kết bị đứt. Thử lại và né sóng chấn động!'; }
    else if (a.hp <= 0) { this.message = this.online ? 'Hưng đã gục · Mei đến gần và giữ E để hồi sinh.' : 'Bạn đã gục · Tab điều khiển đồng đội, đến gần và giữ E để hồi sinh.'; }
  }
  private move(a: Actor, dt: number) {
    if (a.hp <= 0) return;
    a.x += a.vx * dt; a.z += a.vz * dt;
    const r = Math.hypot(a.x / 1.08, a.z - 15); if (r > 62) { a.x *= 62 / r; a.z = 15 + (a.z - 15) * 62 / r; }
    // The Warden's core is solid, avoiding bodies intersecting its pedestal.
    const d = distance(a, bossPosition);
    if (d < 1.6 && d > 0.001) { a.x = bossPosition.x + (a.x - bossPosition.x) * 1.6 / d; a.z = bossPosition.z + (a.z - bossPosition.z) * 1.6 / d; }
    if (!a.grounded) { a.vy -= 16 * dt; a.y += a.vy * dt; if (a.y <= 0) { a.y = 0; a.vy = 0; a.grounded = true; a.land = 0.18; } }
  }
}
