import type { Role } from "../game/rules";
export type PlayerSnapshot = { sessionId: string; name: string; role: Role; x: number; y: number; z: number; hp: number; ready: boolean };
export type RoomState = { code: string; hostSessionId: string; players: PlayerSnapshot[]; puzzleVersion: number; bossVersion: number };
export type GameEvent = { actionId: string; type: "chat" | "ping" | "intent"; sessionId: string; payload: string };
export const isRoomState = (value: unknown): value is RoomState => {
  if (!value || typeof value !== "object") return false;
  const room = value as Partial<RoomState>;
  return typeof room.code === "string" && room.code.length === 6 && typeof room.hostSessionId === "string" && Array.isArray(room.players);
};
export class ActionDedupe { private readonly seen = new Set<string>(); accept(id: string): boolean { if (this.seen.has(id)) return false; this.seen.add(id); return true; } }
