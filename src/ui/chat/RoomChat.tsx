import { useState, useSyncExternalStore } from 'react';
import type { PeerRoom } from '../../multiplayer/peerRoom';
export function RoomChat({ room }: { room: PeerRoom }) {
  const state = useSyncExternalStore(room.subscribe, room.getSnapshot);
  const [text, setText] = useState('');
  return <aside className={`room-chat${state.connected ? '' : ' disconnected'}`}><div className="chat-lines" aria-live="polite">{state.chat.slice(-5).map(line => <p key={line.id}><b>{line.role === 'hung' ? 'Hưng' : 'Mei.100'}:</b> {line.text}</p>)}</div><form onSubmit={e => { e.preventDefault(); room.chat(text); setText(''); }}><input aria-label="Tin nhắn đồng đội" placeholder="Nhắn cho đồng đội…" maxLength={160} value={text} onChange={e => setText(e.target.value)} /><button type="submit" disabled={!state.connected}>Gửi</button></form><small>{state.connected ? 'Đã kết nối · ' + state.ping + ' ms' : state.notice}</small>{!state.connected && <button onClick={() => room.reconnect()}>Kết nối lại</button>}</aside>;
}
