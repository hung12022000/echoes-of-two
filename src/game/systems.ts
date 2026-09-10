import { activateRune, type DualSwitchState, updateDualSwitch } from "./rules";

export type BridgeState = "offline" | "charging" | "online";
export const bridgeState = (matterHeld: boolean, energyNodes: number, unlocked: boolean): BridgeState => unlocked ? "online" : matterHeld && energyNodes >= 3 ? "charging" : "offline";
export const bridgeSolved = (matterHeldMs: number, energyHeldMs: number): boolean => matterHeldMs >= 1000 && energyHeldMs >= 1000;
export const solveRuneRelay = (sequence: string[], inputs: string[]) => inputs.reduce((state, input) => activateRune(state, input), { sequence, progress: 0, solved: false });
export const solveDualSwitch = (timeline: Array<{ left: boolean; right: boolean; now: number }>, initial: DualSwitchState = { left: false, right: false, solved: false }) => timeline.reduce((state, tick) => updateDualSwitch(state, tick.left, tick.right, tick.now), initial);

export type CombatIntent = { kind: "matter-strike" | "pulse-break" | "energy-bolt" | "slow-field"; sessionId: string; targetId?: string };
export type CombatResult = { accepted: boolean; damage: number; stagger: number; reason?: string };
export const resolveCombatIntent = (intent: CombatIntent, hostSessionId: string, targetExists: boolean): CombatResult => {
  if (!targetExists) return { accepted: false, damage: 0, stagger: 0, reason: "target-not-found" };
  if (intent.kind === "matter-strike") return { accepted: true, damage: 18, stagger: 10 };
  if (intent.kind === "pulse-break") return { accepted: true, damage: 12, stagger: 45 };
  if (intent.kind === "energy-bolt") return { accepted: true, damage: 12, stagger: 4 };
  if (intent.kind === "slow-field") return { accepted: true, damage: 0, stagger: 20 };
  return { accepted: intent.sessionId === hostSessionId, damage: 0, stagger: 0, reason: "host-only-invalid-intent" };
};

export type BossState = { hp: number; maxHp: number; phase: 1 | 2 | 3; defeated: boolean; version: number };
export const damageBoss = (boss: BossState, damage: number): BossState => { const hp = Math.max(0, boss.hp - damage); return { ...boss, hp, phase: hp > boss.maxHp * .66 ? 1 : hp > boss.maxHp * .33 ? 2 : 3, defeated: hp === 0, version: boss.version + 1 }; };
export const canAdvanceBossPhase = (boss: BossState, mirrorNodes: number, realCoreRevealed: boolean): boolean => boss.phase === 1 || (boss.phase === 2 && mirrorNodes >= 2) || (boss.phase === 3 && realCoreRevealed);

export type CheckpointSnapshot = { checkpointId: string; shardIds: string[]; puzzleVersions: Record<string, number>; boss: BossState };
export const serializeCheckpoint = (snapshot: CheckpointSnapshot): string => JSON.stringify(snapshot);
export const restoreCheckpoint = (serialized: string): CheckpointSnapshot => { const value: unknown = JSON.parse(serialized); if (!value || typeof value !== "object" || !("checkpointId" in value)) throw new Error("invalid-checkpoint"); return value as CheckpointSnapshot; };
