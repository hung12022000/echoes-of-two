import { describe, expect, it } from "vitest";
import { activateRune, applyDamage, bossPhase, makeRoomCode, reviveProgress, updateDualSwitch } from "../../src/game/rules";
describe("game rules", () => {
  it("creates six-character room codes without ambiguous characters", () => expect(makeRoomCode(() => 0)).toBe("AAAAAA"));
  it("handles guarded damage, revive and boss phases", () => { expect(applyDamage(100, 20, true)).toBe(94); expect(reviveProgress(1500)).toBe(.5); expect(bossPhase(50, 100)).toBe(2); });
  it("requires the rune sequence", () => { const start = { sequence: ["a", "b"], progress: 0, solved: false }; expect(activateRune(activateRune(start, "a"), "b").solved).toBe(true); expect(activateRune(start, "b").progress).toBe(0); });
  it("requires two seconds of dual switch overlap", () => { let s = { left: false, right: false, solved: false }; s = updateDualSwitch(s, true, true, 100); s = updateDualSwitch(s, true, true, 2099); expect(s.solved).toBe(false); expect(updateDualSwitch(s, true, true, 2100).solved).toBe(true); });
});
