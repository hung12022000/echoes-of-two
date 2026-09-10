import type { Encounter, Actor, CombatEffect } from '../game/combat/encounter';
const obj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const finite = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const numeric = ['x','y','z','vx','vz','vy','yaw','hp','maxHp','action','cooldown','skillCooldown','invulnerable','land'] as const;
const motions = ['idle','walk','run','jump','fall','land','attack','skill','dodge','link','hit','downed','revive','victory'];
function actor(v: unknown): v is Actor { return obj(v) && (v.role === 'hung' || v.role === 'mei') && numeric.every(k => finite(v[k])) && typeof v.grounded === 'boolean' && typeof v.motion === 'string' && motions.includes(v.motion) && Math.abs(v.x as number) <= 100 && Math.abs(v.z as number) <= 100; }
export function snapshot(state: Encounter, effects: CombatEffect[]) {
  return { actors: state.actors, bossHp: state.bossHp, phase: state.phase, status: state.status, exposed: state.exposed, marks: state.marks, resonance: state.resonance, linkProgress: state.linkProgress, reviveProgress: state.reviveProgress, telegraph: state.telegraph, elapsed: state.elapsed, message: state.message, effects };
}
export function applySnapshot(state: Encounter, data: unknown): boolean {
  if (!obj(data) || !obj(data.actors) || !actor(data.actors.hung) || !actor(data.actors.mei)) return false;
  const keys = ['bossHp','exposed','marks','resonance','linkProgress','reviveProgress','telegraph','elapsed'] as const;
  if (!keys.every(k => finite(data[k])) || ![1,2,3].includes(data.phase as number) || !['explore','battle','victory','defeat'].includes(data.status as string) || typeof data.message !== 'string' || data.message.length > 500) return false;
  state.actors.hung = { ...data.actors.hung }; state.actors.mei = { ...data.actors.mei };
  for (const key of keys) state[key] = data[key] as number;
  state.phase = data.phase as 1 | 2 | 3; state.status = data.status as Encounter['status']; state.message = data.message;
  state.effects = Array.isArray(data.effects) ? data.effects.slice(0,64).filter((e): e is CombatEffect => obj(e) && ['bolt','strike','pulse','impact','slam','link','phase'].includes(e.kind as string) && ['x','z','targetX','targetZ'].every(k => finite(e[k])) && (e.role === 'hung' || e.role === 'mei')) : [];
  return true;
}
