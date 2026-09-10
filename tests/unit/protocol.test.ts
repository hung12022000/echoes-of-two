import { describe, expect, it } from "vitest";
import { ActionDedupe, isRoomState } from "../../src/multiplayer/protocol";
describe("room protocol", () => { it("validates snapshots and suppresses duplicate actions", () => { expect(isRoomState({ code:"ABC234",hostSessionId:"x",players:[],puzzleVersion:0,bossVersion:0 })).toBe(true); const d = new ActionDedupe(); expect(d.accept("1")).toBe(true); expect(d.accept("1")).toBe(false); }); });
