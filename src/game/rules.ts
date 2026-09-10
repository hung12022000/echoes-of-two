export type Role = "hung" | "mei";
export type PlayerStats = { hp: number; maxHp: number; energy: number; maxEnergy: number };
export const statsFor = (role: Role): PlayerStats => role === "hung" ? { hp: 120, maxHp: 120, energy: 100, maxEnergy: 100 } : { hp: 90, maxHp: 90, energy: 120, maxEnergy: 120 };
export const applyDamage = (hp: number, damage: number, guarded: boolean): number => Math.max(0, hp - Math.round(damage * (guarded ? 0.3 : 1)));
export const reviveProgress = (elapsedMs: number): number => Math.min(1, Math.max(0, elapsedMs / 3000));
export const bossPhase = (hp: number, maxHp: number): 1 | 2 | 3 => { const ratio = hp / maxHp; return ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3; };
export const makeRoomCode = (random = Math.random): string => { const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({ length: 6 }, () => alphabet[Math.floor(random() * alphabet.length)]).join(""); };

export type RuneState = { sequence: string[]; progress: number; solved: boolean };
export const activateRune = (state: RuneState, rune: string): RuneState => {
  if (state.solved) return state;
  if (state.sequence[state.progress] === rune) { const progress = state.progress + 1; return { ...state, progress, solved: progress === state.sequence.length }; }
  return { ...state, progress: 0 };
};
export type DualSwitchState = { left: boolean; right: boolean; heldAt?: number; solved: boolean };
export const updateDualSwitch = (state: DualSwitchState, left: boolean, right: boolean, now: number): DualSwitchState => {
  const together = left && right;
  const heldAt = together ? (state.heldAt ?? now) : undefined;
  return { left, right, heldAt, solved: state.solved || (heldAt !== undefined && now - heldAt >= 2000) };
};
