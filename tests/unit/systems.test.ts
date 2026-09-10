import { describe, expect, it } from "vitest";
import { bridgeState, canAdvanceBossPhase, damageBoss, resolveCombatIntent, serializeCheckpoint, restoreCheckpoint, solveDualSwitch, solveRuneRelay } from "../../src/game/systems";
describe("co-op systems", () => {
  it("requires both roles to charge the bridge and solve relay", () => { expect(bridgeState(true, 3, false)).toBe("charging"); expect(solveRuneRelay(["a", "b"], ["a", "b"]).solved).toBe(true); });
  it("requires two seconds of simultaneous switch hold", () => { const state = solveDualSwitch([{ left: true, right: true, now: 0 }, { left: true, right: true, now: 2000 }]); expect(state.solved).toBe(true); });
  it("keeps damage host-resolved and advances boss phases", () => { expect(resolveCombatIntent({ kind: "matter-strike", sessionId: "guest" }, "host", true).damage).toBe(18); const boss = damageBoss({ hp: 100, maxHp: 100, phase: 1, defeated: false, version: 0 }, 40); expect(boss.phase).toBe(2); expect(canAdvanceBossPhase(boss, 2, false)).toBe(true); });
  it("round trips checkpoint state", () => { const snapshot = { checkpointId: "tower_start", shardIds: ["A"], puzzleVersions: { bridge: 2 }, boss: { hp: 100, maxHp: 100, phase: 1 as const, defeated: false, version: 0 } }; expect(restoreCheckpoint(serializeCheckpoint(snapshot))).toEqual(snapshot); });
});
