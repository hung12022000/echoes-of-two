import Peer, { type DataConnection } from 'peerjs';
import { makeRoomCode, type Role } from '../game/rules';
import type { Controls } from '../game/combat/encounter';

export interface ChatLine { id: string; role: Role; text: string }
export interface RoomView { code: string; isHost: boolean; connected: boolean; localReady: boolean; remoteReady: boolean; started: boolean; notice: string; ping: number; chat: ChatLine[]; route: 'đang dò' | 'trực tiếp' | 'relay' }
type Listener = () => void;
const CONNECT_TIMEOUT_MS = 25000;
const HEARTBEAT_TIMEOUT_MS = 45000;
const MAX_CONNECT_ATTEMPTS = 4;
export interface GamePacket { type: 'input' | 'snapshot' | 'command'; seq: number; payload: unknown }
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export function parseControls(v: unknown): Controls | null {
  if (!record(v) || typeof v.x !== 'number' || typeof v.z !== 'number' || !Number.isFinite(v.x) || !Number.isFinite(v.z)) return null;
  const keys = ['sprint', 'jump', 'attack', 'skill', 'dodge', 'interact', 'guard'] as const;
  if (keys.some(k => typeof v[k] !== 'boolean')) return null;
  const length = Math.max(1, Math.hypot(v.x, v.z));
  return { x: v.x / length, z: v.z / length, sprint: v.sprint as boolean, jump: v.jump as boolean, attack: v.attack as boolean, skill: v.skill as boolean, dodge: v.dodge as boolean, interact: v.interact as boolean, guard: v.guard as boolean };
}

/** Two-person WebRTC room; signaling only uses PeerJS Cloud. World saves live in the browser and the host may continue solo. */
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
  private lastSeq: Record<GamePacket['type'], number> = { input: -1, snapshot: -1, command: -1 };
  private commandSeq = 0;
  private connectAttempts = 0;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private lastSeen = 0;
  private heartbeatGraceUntil = 0;
  private signalTimer?: ReturnType<typeof setTimeout>;
  private signalAttempts = 0;
  private signalBlocked = false;
  private roomFull = false;
  private lastHeartbeat = 0;
  private disposed = false;
  private state: RoomView;
  constructor(isHost: boolean, code = makeRoomCode()) {
    this.state = { code: code.toUpperCase().trim(), isHost, connected: false, localReady: false, remoteReady: false, started: false, notice: 'Đang kết nối máy chủ tạo phòng…', ping: 0, chat: [], route: 'đang dò' };
  }
  get role(): Role { return this.state.isHost ? 'hung' : 'mei'; }
  get view() { return this.state; }
  subscribe = (fn: Listener) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  getSnapshot = () => this.state;
  private update(patch: Partial<RoomView>) { this.state = { ...this.state, ...patch }; for (const fn of this.listeners) fn(); }
  onGame(fn: (packet: GamePacket) => void) { this.gameListeners.add(fn); return () => { this.gameListeners.delete(fn); }; }
  connect() {
    if (this.disposed || this.peer) return;
    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(this.state.code)) { this.update({ notice: 'Mã phòng cần 6 ký tự hợp lệ.' }); return; }
    this.createPeer();
    this.lastHeartbeat = Date.now();
    this.heartbeat = setInterval(() => {
      const now = Date.now();
      // Background tabs / a sleeping machine can delay both render and network timers.
      if (now - this.lastHeartbeat > 10000) this.heartbeatGraceUntil = now + HEARTBEAT_TIMEOUT_MS;
      this.lastHeartbeat = now;
      if (this.state.connected && now > this.heartbeatGraceUntil && now - this.lastSeen > HEARTBEAT_TIMEOUT_MS) {
        if (this.connection) this.dropConnection(this.connection, 'HEARTBEAT_TIMEOUT · Đồng đội không phản hồi. Đang chờ kết nối lại.');
      } else this.send({ type: 'ping', at: now });
    }, 2000);
  }
  /** Keep diagnostics categorical: never log SDP, candidate IPs or TURN credentials. */
  private diagnostic(event: string, connection = this.connection) {
    console.info('[Oceanbound network]', { event, role: this.role, attempt: this.connectAttempts,
      signaling: this.peer?.open ? 'open' : this.peer?.destroyed ? 'destroyed' : 'waiting',
      ice: connection?.peerConnection?.iceConnectionState ?? 'none',
      data: connection?.dataChannel?.readyState ?? 'none', turnConfigured: Boolean(import.meta.env.VITE_TURN_URL?.trim()) });
  }
  private createPeer() {
    if (this.disposed) return;
    clearTimeout(this.signalTimer);
    const previous = this.peer;
    this.peer = undefined;
    previous?.destroy();
    const turnUrl = import.meta.env.VITE_TURN_URL?.trim();
    const iceServers: RTCIceServer[] = [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ];
    if (turnUrl) iceServers.push({ urls: turnUrl.split(',').map(url => url.trim()).filter(Boolean), username: import.meta.env.VITE_TURN_USERNAME ?? '', credential: import.meta.env.VITE_TURN_CREDENTIAL ?? '' });
    const options = { debug: 0, secure: true, config: { iceServers, iceCandidatePoolSize: 4 } satisfies RTCConfiguration };
    const peer = this.state.isHost ? new Peer('echoes-v3-' + this.state.code, options) : new Peer(options);
    this.peer = peer;
    const current = () => !this.disposed && this.peer === peer;
    this.watchSignaling(peer);
    peer.on('open', () => {
      if (!current()) return;
      clearTimeout(this.signalTimer); this.signalTimer = undefined; this.signalAttempts = 0;
      this.diagnostic('SIGNAL_OPEN');
      if (this.state.connected) { this.sendLobby(); return; }
      if (this.state.isHost) this.update({ notice: 'Phòng đã mở · chờ Mei.100. Gửi link mời cho người chơi còn lại.' });
      else if (!this.connection && !this.retryTimer) this.connectGuest();
    });
    peer.on('connection', connection => {
      if (!current()) { connection.close(); return; }
      if (!this.state.isHost || (this.connection && this.guestId !== connection.peer)) {
        const timeout = setTimeout(() => connection.close(), CONNECT_TIMEOUT_MS);
        connection.on('close', () => clearTimeout(timeout));
        connection.on('error', () => { clearTimeout(timeout); connection.close(); });
        connection.on('open', () => { connection.send({ type: 'full' }); clearTimeout(timeout); setTimeout(() => connection.close(), 300); }); return;
      }
      this.guestId = connection.peer; this.attach(connection);
    });
    peer.on('error', error => {
      if (!current()) return;
      this.diagnostic('PEER_' + error.type);
      if (error.type === 'peer-unavailable') {
        // Rejected third-party offers must not disturb an already active game.
        if (!this.state.connected && this.connection) this.dropConnection(this.connection, 'PEER_UNAVAILABLE · Chưa tìm thấy chủ phòng; đang thử lại.');
        return;
      }
      if (['unavailable-id', 'invalid-id', 'invalid-key', 'browser-incompatible', 'ssl-unavailable'].includes(error.type)) {
        this.signalBlocked = true; clearTimeout(this.signalTimer);
        this.update({ notice: error.type === 'unavailable-id' ? 'UNAVAILABLE_ID · Mã phòng đang được dùng; đóng tab chủ phòng cũ hoặc tạo mã mới.' : `SIGNAL_${error.type} · Không tạo được phòng. Kiểm tra hỗ trợ WebRTC và cấu hình máy chủ.` }); return;
      }
      if (error.type === 'webrtc') {
        if (!this.state.connected && this.connection) this.dropConnection(this.connection, 'WEBRTC_ERROR · Không mở được kênh dữ liệu; đang thử lại.');
        return;
      }
      this.update({ notice: 'SIGNAL_LOST · Mất máy chủ báo hiệu; đang thử lại. Kênh chơi hiện có vẫn được giữ.' });
      this.scheduleSignaling();
    });
    peer.on('disconnected', () => { if (current()) this.scheduleSignaling(); });
    peer.on('close', () => {
      if (!current()) return;
      if (this.connection) this.dropConnection(this.connection, 'PEER_CLOSED · Đang khôi phục kết nối phòng.');
      this.scheduleSignaling();
    });
  }
  private watchSignaling(peer: Peer) {
    clearTimeout(this.signalTimer);
    this.signalTimer = setTimeout(() => {
      this.signalTimer = undefined;
      if (this.disposed || this.peer !== peer || peer.open) return;
      this.diagnostic('SIGNAL_TIMEOUT');
      this.update({ notice: 'SIGNAL_TIMEOUT · Chưa kết nối được máy chủ tạo phòng. Kiểm tra Internet; đang thử lại.' });
      if (!this.state.connected) { this.peer = undefined; peer.destroy(); }
      this.scheduleSignaling();
    }, 20000);
  }
  private scheduleSignaling() {
    if (this.disposed || this.signalBlocked || this.signalTimer) return;
    if (this.signalAttempts >= 6) { this.update({ notice: 'SIGNAL_TIMEOUT · Máy chủ báo hiệu chưa khả dụng. Bấm thử kết nối lại khi mạng ổn định.' }); return; }
    const delay = Math.min(15000, 1000 * 2 ** this.signalAttempts++);
    this.signalTimer = setTimeout(() => {
      this.signalTimer = undefined;
      if (this.disposed) return;
      const peer = this.peer;
      if (peer?.open) { if (!this.state.isHost && !this.connection && !this.retryTimer) this.connectGuest(); return; }
      if (peer && !peer.destroyed) {
        if (peer.disconnected) { try { peer.reconnect(); } catch { /* watchdog handles failure */ } }
        this.watchSignaling(peer);
      } else this.createPeer();
    }, delay);
  }
  private attach(connection: DataConnection) {
    const previous = this.connection;
    this.connection = connection;
    previous?.close();
    clearTimeout(this.timer);
    const current = () => this.connection === connection && !this.disposed;
    this.timer = setTimeout(() => {
      if (current() && !connection.open) this.dropConnection(connection, 'ICE_TIMEOUT · Chưa mở được tuyến WebRTC. Mạng NAT nghiêm ngặt có thể cần TURN relay.');
    }, CONNECT_TIMEOUT_MS);
    connection.on('open', () => {
      if (!current()) { connection.close(); return; }
      clearTimeout(this.timer); clearTimeout(this.retryTimer); this.retryTimer = undefined;
      this.connectAttempts = 0; this.roomFull = false;
      this.lastSeq = { input: -1, snapshot: -1, command: -1 }; this.lastSeen = Date.now(); this.heartbeatGraceUntil = Date.now() + 60000;
      this.update({ connected: true, remoteReady: false, notice: 'Hai người đã kết nối. Đang kiểm tra tuyến truyền…' });
      this.diagnostic('DATA_OPEN'); void this.inspectRoute(connection); this.sendLobby();
    });
    connection.on('close', () => { if (current()) this.dropConnection(connection, 'DATA_CLOSED · Đồng đội mất kết nối. Đang chờ vào lại cùng mã phòng.'); });
    connection.on('error', () => { if (current()) this.dropConnection(connection, 'DATA_ERROR · Kênh dữ liệu bị gián đoạn. Đang thử kết nối lại.'); });
    connection.on('data', data => { if (!current() || this.roomFull) return; this.lastSeen = Date.now(); this.receive(data); });
  }
  private dropConnection(connection: DataConnection, notice: string) {
    if (this.connection !== connection || this.disposed) return;
    this.diagnostic(notice.split(' · ')[0], connection);
    this.connection = undefined; this.guestId = '';
    clearTimeout(this.timer);
    connection.close();
    this.update({ connected: false, remoteReady: false, ping: 0, route: 'đang dò', notice });
    this.scheduleGuestRetry();
  }
  private scheduleGuestRetry() {
    if (this.disposed || this.state.isHost || this.roomFull || this.retryTimer) return;
    if (this.connectAttempts >= MAX_CONNECT_ATTEMPTS) {
      this.update({ notice: `${this.state.notice} Đã thử ${MAX_CONNECT_ATTEMPTS} lần; bấm thử lại. Giữ tab chủ phòng mở; NAT nghiêm ngặt cần TURN.` }); return;
    }
    this.retryTimer = setTimeout(() => { this.retryTimer = undefined; this.connectGuest(); }, Math.min(6000, 1000 * 2 ** this.connectAttempts));
  }
  private send(data: unknown) {
    const connection = this.connection;
    if (!connection?.open || !connection.dataChannel || connection.dataChannel.bufferedAmount >= 65536) return;
    try { connection.send(data); } catch { this.dropConnection(connection, 'SEND_FAILED · Kênh dữ liệu vừa đóng. Đang kết nối lại.'); }
  }
  private sendLobby() { this.send({ type: 'lobby', ready: this.state.localReady, started: this.state.started }); }
  ready() { this.update({ localReady: !this.state.localReady }); this.sendLobby(); }
  start() { if (!this.state.isHost || !this.state.connected || !this.state.localReady || !this.state.remoteReady) return; this.update({ started: true }); this.send({ type: 'start' }); }
  startSolo() { if (!this.state.isHost) return; this.update({ started: true, localReady: true, notice: 'Phòng đang chạy một người · tiến trình vẫn lưu; đồng đội có thể vào lại bằng cùng mã.' }); this.sendLobby(); }
  sendGame(packet: GamePacket) { this.send(packet); }
  sendAction(payload: unknown) { this.send({ type: 'command', seq: this.commandSeq++, payload }); }
  chat(text: string) {
    text = text.trim().slice(0, 160); const now = Date.now();
    if (!text || now - this.lastChat < 500 || !this.state.connected) return;
    this.lastChat = now; const line: ChatLine = { id: crypto.randomUUID(), role: this.role, text };
    this.update({ chat: [...this.state.chat, line].slice(-50) }); this.send({ type: 'chat', text, id: line.id });
  }
  reconnect() {
    if (this.disposed) return;
    if (this.state.connected) { this.sendLobby(); return; }
    this.roomFull = false; this.signalBlocked = false; this.signalAttempts = 0; this.connectAttempts = 0;
    clearTimeout(this.retryTimer); this.retryTimer = undefined;
    if (this.connection) { const old = this.connection; this.connection = undefined; this.guestId = ''; clearTimeout(this.timer); old.close(); }
    if (!this.peer?.open) { clearTimeout(this.signalTimer); this.signalTimer = undefined; this.scheduleSignaling(); }
    else if (this.state.isHost) this.update({ notice: 'Phòng đã mở · đồng đội có thể vào lại cùng mã phòng.' });
    else this.connectGuest();
  }
  private connectGuest() {
    if (this.disposed || this.state.isHost || this.roomFull || this.state.connected || this.connection) return;
    if (!this.peer?.open || this.peer.destroyed || this.peer.disconnected) { this.scheduleSignaling(); return; }
    if (this.connectAttempts >= MAX_CONNECT_ATTEMPTS) return;
    clearTimeout(this.retryTimer); this.retryTimer = undefined;
    this.connectAttempts += 1;
    this.update({ notice: `Đang kết nối tới chủ phòng · lần ${this.connectAttempts}/4…`, route: 'đang dò' });
    this.attach(this.peer.connect('echoes-v3-' + this.state.code, { reliable: true, serialization: 'json', metadata: { version: 4, attempt: this.connectAttempts } }));
  }
  private receive(data: unknown) {
    if (!record(data) || typeof data.type !== 'string') return;
    if (data.type === 'full' && !this.state.isHost) {
      this.roomFull = true; clearTimeout(this.retryTimer); this.retryTimer = undefined;
      if (this.connection) this.dropConnection(this.connection, 'ROOM_FULL · Phòng đã đủ hai người. Chờ một người rời rồi thử lại.');
      return;
    }
    if (data.type === 'ping' && typeof data.at === 'number') { this.send({ type: 'pong', at: data.at }); return; }
    if (data.type === 'pong' && typeof data.at === 'number') { this.update({ ping: Math.max(0, Math.min(9999, Date.now() - data.at)) }); return; }
    if (data.type === 'lobby' && typeof data.ready === 'boolean') { this.update({ remoteReady: data.ready, started: this.state.started || (!this.state.isHost && data.started === true) }); return; }
    if (data.type === 'start' && !this.state.isHost) { this.update({ started: true }); return; }
    if (data.type === 'chat' && typeof data.text === 'string' && typeof data.id === 'string' && data.id.length < 80 && Date.now() - this.lastReceivedChat >= 500) {
      this.lastReceivedChat = Date.now(); if (this.state.chat.some(c => c.id === data.id)) return;
      this.update({ chat: [...this.state.chat, { id: data.id, text: data.text.trim().slice(0, 160), role: this.role === 'hung' ? 'mei' as const : 'hung' as const }].slice(-50) }); return;
    }
    const allowed = this.state.isHost ? ['input', 'command'] : ['snapshot'];
    if (allowed.includes(data.type) && typeof data.seq === 'number' && Number.isSafeInteger(data.seq) && data.seq > this.lastSeq[data.type as GamePacket['type']] && this.state.started) {
      if (data.type === 'input' && !parseControls(data.payload)) return;
      const type = data.type as GamePacket['type'];
      this.lastSeq[type] = data.seq;
      for (const fn of this.gameListeners) fn({ type, seq: data.seq, payload: data.payload });
    }
  }
  private async inspectRoute(connection: DataConnection) {
    try {
      const stats = await connection.peerConnection.getStats();
      if (this.connection !== connection || !this.state.connected || this.disposed) return;
      let selected: RTCStats | undefined;
      stats.forEach(report => { if (report.type === 'transport' && report.selectedCandidatePairId) selected = stats.get(report.selectedCandidatePairId); });
      if (!selected) stats.forEach(report => { if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.nominated) selected = report; });
      const pair = selected as (RTCStats & { localCandidateId: string; remoteCandidateId: string }) | undefined;
      if (!pair) { this.update({ notice: 'Hai người đã kết nối; trình duyệt chưa cung cấp thông tin tuyến truyền.' }); return; }
      const relay = stats.get(pair.localCandidateId)?.candidateType === 'relay' || stats.get(pair.remoteCandidateId)?.candidateType === 'relay';
      this.update({ route: relay ? 'relay' : 'trực tiếp', notice: relay ? 'Đã kết nối qua TURN relay.' : 'Đã kết nối trực tiếp bằng WebRTC.' });
      this.diagnostic(relay ? 'ROUTE_RELAY' : 'ROUTE_DIRECT');
    } catch { if (this.connection === connection && this.state.connected && !this.disposed) this.update({ notice: 'Hai người đã kết nối; không đọc được thông tin tuyến truyền.' }); }
  }
  close() { this.disposed = true; clearTimeout(this.timer); clearTimeout(this.retryTimer); clearTimeout(this.signalTimer); clearInterval(this.heartbeat); this.connection?.close(); this.peer?.destroy(); this.listeners.clear(); this.gameListeners.clear(); }
}
