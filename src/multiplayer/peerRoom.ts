import Peer, { type DataConnection } from 'peerjs';
import { makeRoomCode, type Role } from '../game/rules';
import type { Controls } from '../game/combat/encounter';

export interface ChatLine { id: string; role: Role; text: string }
export interface RoomView { code: string; isHost: boolean; connected: boolean; localReady: boolean; remoteReady: boolean; started: boolean; notice: string; ping: number; chat: ChatLine[] }
type Listener = () => void;
export interface GamePacket { type: 'input' | 'snapshot'; seq: number; payload: unknown }
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export function parseControls(v: unknown): Controls | null {
  if (!record(v) || typeof v.x !== 'number' || typeof v.z !== 'number' || !Number.isFinite(v.x) || !Number.isFinite(v.z)) return null;
  const keys = ['sprint', 'jump', 'attack', 'skill', 'dodge', 'interact', 'guard'] as const;
  if (keys.some(k => typeof v[k] !== 'boolean')) return null;
  const length = Math.max(1, Math.hypot(v.x, v.z));
  return { x: v.x / length, z: v.z / length, sprint: v.sprint as boolean, jump: v.jump as boolean, attack: v.attack as boolean, skill: v.skill as boolean, dodge: v.dodge as boolean, interact: v.interact as boolean, guard: v.guard as boolean };
}

/** Two-person WebRTC room; signaling only uses PeerJS Cloud. No credentials. */
export class PeerRoom {
  private peer?: Peer;
  private connection?: DataConnection;
  private guestId = '';
  private listeners = new Set<Listener>();
  private gameListeners = new Set<(packet: GamePacket) => void>();
  private timer?: ReturnType<typeof setTimeout>;
  private heartbeat?: ReturnType<typeof setInterval>;
  private lastChat = 0;
  private lastReceivedChat = 0;
  private lastSeq = -1;
  private lastSeen = 0;
  private heartbeatGraceUntil = 0;
  private disposed = false;
  private state: RoomView;
  constructor(isHost: boolean, code = makeRoomCode()) {
    this.state = { code: code.toUpperCase().trim(), isHost, connected: false, localReady: false, remoteReady: false, started: false, notice: 'Đang kết nối máy chủ tạo phòng…', ping: 0, chat: [] };
  }
  get role(): Role { return this.state.isHost ? 'hung' : 'mei'; }
  get view() { return this.state; }
  subscribe = (fn: Listener) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  getSnapshot = () => this.state;
  private update(patch: Partial<RoomView>) { this.state = { ...this.state, ...patch }; for (const fn of this.listeners) fn(); }
  onGame(fn: (packet: GamePacket) => void) { this.gameListeners.add(fn); return () => { this.gameListeners.delete(fn); }; }
  connect() {
    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(this.state.code)) { this.update({ notice: 'Mã phòng cần 6 ký tự hợp lệ.' }); return; }
    const options = { debug: 0, secure: true };
    this.peer = this.state.isHost ? new Peer('echoes-v2-' + this.state.code, options) : new Peer(options);
    this.timer = setTimeout(() => { if (!this.state.connected) this.update({ notice: this.state.isHost ? 'Phòng đã mở. Chia sẻ mã với người thứ hai; nếu kết nối bị chặn, hãy thử mạng khác.' : 'Không kết nối được trong 20 giây. Kiểm tra mã, chủ phòng còn mở tab và mạng cho phép WebRTC.' }); }, 20000);
    this.peer.on('open', () => {
      if (this.state.isHost) this.update({ notice: 'Phòng đã mở · chờ Mei.100. Gửi link mời cho người chơi còn lại.' });
      else this.attach(this.peer!.connect('echoes-v2-' + this.state.code, { reliable: true, serialization: 'json' }));
    });
    this.peer.on('connection', connection => {
      if (!this.state.isHost || (this.guestId && this.guestId !== connection.peer)) {
        connection.on('open', () => { connection.send({ type: 'full' }); setTimeout(() => connection.close(), 300); }); return;
      }
      this.guestId = connection.peer; this.attach(connection);
    });
    this.peer.on('error', error => {
      const message = error.type === 'peer-unavailable' ? 'Không tìm thấy phòng. Kiểm tra mã và yêu cầu chủ phòng giữ tab mở.' : error.type === 'unavailable-id' ? 'Mã phòng đang được dùng. Hãy tạo phòng mới.' : 'Mạng không thể kết nối WebRTC. Thử lại hoặc chuyển Wi-Fi / 4G.';
      this.update({ notice: message });
    });
    this.peer.on('disconnected', () => { this.update({ notice: 'Mất máy chủ báo hiệu. Đang kết nối lại…' }); if (!this.disposed && !this.peer?.destroyed) this.peer?.reconnect(); });
    this.heartbeat = setInterval(() => {
      if (this.state.connected && Date.now() > this.heartbeatGraceUntil && Date.now() - this.lastSeen > 20000) {
        this.update({ connected: false, remoteReady: false, notice: 'Đồng đội không phản hồi. Trận đấu đã tạm dừng; hãy kết nối lại.' });
        this.connection?.close();
      } else this.send({ type: 'ping', at: Date.now() });
    }, 2000);
  }
  private attach(connection: DataConnection) {
    this.connection = connection;
    connection.on('open', () => { clearTimeout(this.timer); this.lastSeq = -1; this.lastSeen = Date.now(); this.heartbeatGraceUntil = Date.now()+60000; this.update({ connected: true, notice: 'Hai người đã kết nối trực tiếp.' }); this.sendLobby(); });
    connection.on('close', () => { if (this.connection !== connection || this.disposed || this.state.notice.includes('ROOM_FULL')) return; this.update({ connected: false, remoteReady: false, notice: 'Đồng đội mất kết nối. Trận đấu được tạm dừng; có thể kết nối lại hoặc về trang chính.' }); });
    connection.on('error', () => this.update({ connected: false, notice: 'Kết nối bị gián đoạn. Hãy thử kết nối lại.' }));
    connection.on('data', data => { if (this.connection !== connection) return; this.lastSeen=Date.now();this.receive(data); });
  }
  private send(data: unknown) { if (this.connection?.open && this.connection.dataChannel.bufferedAmount < 65536) this.connection.send(data); }
  private sendLobby() { this.send({ type: 'lobby', ready: this.state.localReady, started: this.state.started }); }
  ready() { this.update({ localReady: !this.state.localReady }); this.sendLobby(); }
  start() { if (!this.state.isHost || !this.state.connected || !this.state.localReady || !this.state.remoteReady) return; this.update({ started: true }); this.send({ type: 'start' }); }
  sendGame(packet: GamePacket) { this.send(packet); }
  chat(text: string) {
    text = text.trim().slice(0, 160); const now = Date.now();
    if (!text || now - this.lastChat < 500 || !this.state.connected) return;
    this.lastChat = now; const line: ChatLine = { id: crypto.randomUUID(), role: this.role, text };
    this.update({ chat: [...this.state.chat, line].slice(-50) }); this.send({ type: 'chat', text, id: line.id });
  }
  reconnect() {
    if (this.state.isHost) { this.guestId = ''; this.update({ notice: 'Đã mở lại vị trí khách. Đồng đội hãy kết nối lại cùng mã phòng.' }); }
    else if (this.peer && !this.peer.destroyed) { this.connection?.close(); this.attach(this.peer.connect('echoes-v2-' + this.state.code, { reliable: true, serialization: 'json' })); }
  }
  private receive(data: unknown) {
    if (!record(data) || typeof data.type !== 'string') return;
    if (data.type === 'full') { this.update({ connected: false, notice: 'ROOM_FULL · Phòng đã đủ hai người.' }); return; }
    if (data.type === 'ping' && typeof data.at === 'number') { this.send({ type: 'pong', at: data.at }); return; }
    if (data.type === 'pong' && typeof data.at === 'number') { this.update({ ping: Math.max(0, Math.min(9999, Date.now() - data.at)) }); return; }
    if (data.type === 'lobby' && typeof data.ready === 'boolean') { this.update({ remoteReady: data.ready, started: this.state.started || (!this.state.isHost && data.started === true) }); return; }
    if (data.type === 'start' && !this.state.isHost) { this.update({ started: true }); return; }
    if (data.type === 'chat' && typeof data.text === 'string' && typeof data.id === 'string' && data.id.length < 80 && Date.now() - this.lastReceivedChat >= 500) {
      this.lastReceivedChat = Date.now(); if (this.state.chat.some(c => c.id === data.id)) return;
      this.update({ chat: [...this.state.chat, { id: data.id, text: data.text.trim().slice(0, 160), role: this.role === 'hung' ? 'mei' as const : 'hung' as const }].slice(-50) }); return;
    }
    const allowed = this.state.isHost ? 'input' : 'snapshot';
    if (data.type === allowed && typeof data.seq === 'number' && Number.isSafeInteger(data.seq) && data.seq > this.lastSeq && this.state.started) {
      if (allowed === 'input' && !parseControls(data.payload)) return;
      this.lastSeq = data.seq;
      for (const fn of this.gameListeners) fn({ type: allowed, seq: data.seq, payload: data.payload });
    }
  }
  close() { this.disposed = true; clearTimeout(this.timer); clearInterval(this.heartbeat); this.connection?.close(); this.peer?.destroy(); this.listeners.clear(); this.gameListeners.clear(); }
}
