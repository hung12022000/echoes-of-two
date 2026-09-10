import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { makeRoomCode } from "../game/rules";
import type { GameEvent, RoomState } from "./protocol";

export type RoomTransport = { state: RoomState; send: (event: GameEvent) => void; close: () => void };
const sessionKey = "echoes.sessionId";
export const getSessionId = (): string => { const old = localStorage.getItem(sessionKey); if (old) return old; const id = crypto.randomUUID(); localStorage.setItem(sessionKey, id); return id; };
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
export const multiplayerConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = multiplayerConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
export const createLocalRoom = (): RoomState => ({ code: makeRoomCode(), hostSessionId: getSessionId(), players: [], puzzleVersion: 0, bossVersion: 0 });
export const createSupabaseRoom = (client: SupabaseClient, state: RoomState): RoomTransport => {
  const channel = client.channel(`room:${state.code}`, { config: { presence: { key: getSessionId() } } });
  channel.subscribe();
  return { state, send: (event) => { void channel.send({ type: "broadcast", event: event.type, payload: event }); }, close: () => { void client.removeChannel(channel); } };
};
