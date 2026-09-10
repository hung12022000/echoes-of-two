import { lazy, Suspense, useEffect, useState } from 'react';
import type { HudState, Quality } from '../game/GameCanvas';
import type { Role } from '../game/rules';
import '../styles.css';
import '../styles/cinematic.css';
import '../styles/nature.css';
import { PeerRoom } from '../multiplayer/peerRoom';
import { OnlineLobby } from '../ui/lobby/OnlineLobby';
import { RoomChat } from '../ui/chat/RoomChat';
const GameCanvas = lazy(() => import('../game/GameCanvas').then(m => ({ default: m.GameCanvas })));
const saved = (key: string, fallback: string) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
export function App() {
  const [screen, setScreen] = useState<'menu' | 'lobby' | 'game'>('menu');
  const [role, setRole] = useState<Role>('hung');
  const [quality, setQuality] = useState<Quality>(() => { const q = saved('echoes.quality', 'medium'); return q === 'low' || q === 'high' ? q : 'medium'; });
  const [reduced, setReduced] = useState(saved('echoes.reduced', 'false') === 'true');
  const [muted, setMuted] = useState(saved('echoes.muted', 'false') === 'true');
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [hud, setHud] = useState<HudState>();
  const [room, setRoom] = useState<PeerRoom>();
  const [joinCode, setJoinCode] = useState(new URLSearchParams(location.search).get('room') ?? '');
  const [roomError, setRoomError] = useState('');
  const [connected, setConnected] = useState(false);
  const leaveRoom = () => { room?.close(); setRoom(undefined); setScreen('menu'); setPaused(false); };
  const openRoom = (host: boolean) => {
    if (!host && !/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(joinCode.toUpperCase().trim())) { setRoomError('Nhập mã phòng gồm 6 ký tự.'); return; }
    setRoomError(''); setRoom(new PeerRoom(host, host ? undefined : joinCode));
  };
  useEffect(() => {
    if (!room) return;
    const off = room.subscribe(() => { setConnected(room.view.connected); if (room.view.started) { setRole(room.role); setScreen('game'); } });
    room.connect(); return () => { off(); room.close(); };
  }, [room]);
  useEffect(() => { try { localStorage.setItem('echoes.quality', quality); localStorage.setItem('echoes.reduced', String(reduced)); localStorage.setItem('echoes.muted', String(muted)); } catch { /* Storage disabled: settings remain valid for this session. */ } }, [quality, reduced, muted]);
  useEffect(() => { const key = (e: KeyboardEvent) => { if (e.code === 'Escape') setPaused(p => !p); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);
  const controls = <div className="control-grid"><span><kbd>W A S D</kbd> Di chuyển</span><span><kbd>Shift</kbd> Chạy</span><span><kbd>Space</kbd> Nhảy</span><span><kbd>X</kbd> Né</span><span><kbd>J / Chuột trái</kbd> Tấn công</span><span><kbd>Q</kbd> Kỹ năng</span><span><kbd>E giữ</kbd> Cộng hưởng / hồi sinh</span><span><kbd>Tab</kbd> Đổi nhân vật</span><span><kbd>V</kbd> Góc nhìn nhân vật</span><span><kbd>R</kbd> Chơi lại</span><span><kbd>Chuột phải + kéo</kbd> Xoay / đỡ</span><span><kbd>Esc</kbd> Tạm dừng</span></div>;
  const settings = <div className="settings"><label>Chất lượng đồ họa<select value={quality} onChange={e => setQuality(e.target.value as Quality)}><option value="low">Low · máy yếu</option><option value="medium">Medium · cân bằng</option><option value="high">High · bóng sắc nét</option></select></label><label><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)} /> Giảm chuyển động môi trường</label><label><input type="checkbox" checked={muted} onChange={e => setMuted(e.target.checked)} /> Tắt âm thanh</label></div>;
  if (screen === 'game') return <main className="game-shell">
    <Suspense fallback={<div className="loading-panel">Đang khởi động engine 3D…</div>}><GameCanvas role={role} quality={quality} reducedMotion={reduced} muted={muted} paused={paused} onHud={setHud} room={room} /></Suspense>
    <div className="game-top"><div><span className="eyebrow">VIETNAM INSPIRED / THE EMERALD COAST</span><h1>Vịnh Ngọc · Astra</h1><p className="mode-badge">{room ? 'PHÒNG ' + room.view.code + (connected ? ' · HAI NGƯỜI ONLINE' : ' · MẤT KẾT NỐI') : 'CHƠI THỬ · ĐỒNG ĐỘI AI'} · {hud?.fps ?? '—'} FPS</p></div><button onClick={() => setPaused(true)}>Tạm dừng · Esc</button></div>
    {hud && <><div className="party"><div className={'player-card ' + hud.role}><small>ĐANG ĐIỀU KHIỂN</small><strong>{hud.role === 'hung' ? 'Hưng' : 'Mei.100'}</strong><div className="health"><i style={{ width: (hud.hp / (hud.role === 'hung' ? 120 : 90) * 100) + '%' }} /></div><span>HP {Math.ceil(hud.hp)} · Q {hud.skill > 0 ? Math.ceil(hud.skill) + 's' : 'sẵn sàng'}</span></div><div className="partner-card"><small>{room ? 'ĐỒNG ĐỘI ONLINE' : 'ĐỒNG ĐỘI AI'}</small><strong>{hud.role === 'hung' ? 'Mei.100' : 'Hưng'}</strong><span>HP {Math.ceil(hud.partnerHp)} · {room ? 'Cùng nhau khám phá' : 'Tab chuyển vai'}</span></div></div>
    {hud.status === 'battle' && <div className="boss-health"><small>THE FRACTURED WARDEN · PHASE {hud.phase}</small><div className="health"><i style={{ width: (hud.bossHp / 9) + '%' }} /></div><span>{Math.ceil(hud.bossHp)} / 900 · {hud.exposed > 0 ? 'PHÁ GIÁP ' + hud.exposed.toFixed(1) + 's' : 'DẤU NĂNG LƯỢNG ' + hud.marks + '/5'}</span></div>}
    <div className="subtitle" aria-live="polite">{hud.message}</div>
    <div className="interaction"><span className="link-icon">◇</span><div><strong>{hud.prompt}</strong><div className="link-meter"><i style={{ width: (hud.progress * 100) + '%' }} /></div><small>CỘNG HƯỞNG {hud.resonance}% · đủ 100% tạo Echo Burst</small></div></div>
    <output className="diagnostics" data-testid="game-state" data-motion={hud.motion} data-role={hud.role} data-x={hud.x.toFixed(2)} data-z={hud.z.toFixed(2)} data-y={hud.y.toFixed(2)} data-partner-x={hud.partnerX.toFixed(2)} data-partner-z={hud.partnerZ.toFixed(2)} data-status={hud.status} data-boss-hp={hud.bossHp.toFixed(0)}>{hud.motion}</output>
    {(hud.status === 'victory' || hud.status === 'defeat') && <section className="end-card"><span className="eyebrow">ECHOES OF TWO</span><h2>{hud.status === 'victory' ? 'Astra đã thức tỉnh.' : 'Liên kết chưa kết thúc.'}</h2><p>{hud.message}</p><p>R · Bắt đầu lại cuộc phiêu lưu</p><button onClick={leaveRoom}>Về trang chính</button></section>}</>}
    {room && <RoomChat room={room} />}
    <div className="bottom-controls">WASD di chuyển <b>·</b> Space nhảy <b>·</b> J đánh <b>·</b> Q kỹ năng <b>·</b> X né <b>·</b> Giữ E phối hợp <b>·</b> V xem nhân vật <b>·</b> B đến boss (chủ phòng)</div>
    {paused && <section className="pause-overlay"><div className="pause-card"><span className="eyebrow">TẠM DỪNG</span><h2>Đi cùng nhau.</h2>{controls}<p>{room ? 'Online: không đổi vai trong trận. Chủ phòng giữ tab mở; R để cả hai chơi lại.' : 'Thay chất lượng sẽ tải lại đấu trường.'}</p>{!room && settings}<div className="actions"><button className="primary" onClick={() => setPaused(false)}>Tiếp tục</button><button onClick={leaveRoom}>Về trang chính</button></div></div></section>}
  </main>;
  return <main className="app-shell nature-shell"><nav className="site-nav"><a className="brand" href={import.meta.env.BASE_URL}>E / II <span>ECHOES OF TWO</span></a><span>Một chuyến đi. Hai người bạn.</span><a href="https://github.com/hung12022000/echoes-of-two" target="_blank" rel="noreferrer">Dự án ↗</a></nav><section className="hero"><div className="hero-photo" /><div className="hero-content"><span className="eyebrow">HƯNG & MEI.100 / MỘT THẾ GIỚI CỦA HAI NGƯỜI</span><h1>Đi cùng nhau.<br /><em>Xa hơn một giấc mơ.</em></h1><p className="lead">Qua rừng xanh, núi biếc và những bờ cát đầy nắng.<br />Khám phá Vịnh Ngọc, kết nối sức mạnh<br />và viết câu chuyện chỉ hai bạn mới có.</p>
    {room ? <OnlineLobby room={room} onLeave={leaveRoom} /> : screen === 'menu' ? <>
      <div className="actions"><button className="primary" onClick={() => openRoom(true)}>Tạo phòng hai người <span>↗</span></button><button className="light-button" onClick={() => setScreen('lobby')}>Bắt đầu hành trình</button></div>
      <form className="join-form" onSubmit={e => { e.preventDefault(); openRoom(false); }}><label htmlFor="join-code">Đã có lời mời?</label><input id="join-code" aria-label="Mã phòng" placeholder="MÃ PHÒNG" maxLength={6} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} /><button type="submit">Vào phòng →</button></form>{roomError && <p role="alert">{roomError}</p>}
      <button className="text-button" onClick={() => setHelp(h => !h)}>Điều khiển & cách chơi {help ? '−' : '+'}</button>{help && controls}
      <p className="menu-note">Chơi online 2 người · hoặc luyện tập với AI · Không cần cài đặt</p>
    </> : <div className="lobby-card"><span className="eyebrow">CHƠI MỘT NGƯỜI / ĐỒNG ĐỘI AI</span><h3>Chọn người dẫn đường</h3><p>Tab đổi vai trong bản luyện tập. Để chơi cùng người thật, quay lại và chọn Tạo phòng hai người hoặc Vào phòng.</p><label>Vai của bạn<select value={role} onChange={e => setRole(e.target.value as Role)}><option value="hung">Hưng · Matter Vanguard</option><option value="mei">Mei.100 · Energy Weaver</option></select></label>{settings}<div className="lobby-actions"><button className="primary" onClick={() => { setHud(undefined); setScreen('game'); }}>Ready · Vào game demo</button><button onClick={() => setScreen('menu')}>Quay lại</button></div></div>}
    </div><div className="location-note"><span>01 / VỊNH NGỌC</span><p>Lấy cảm hứng từ vẻ đẹp Việt Nam</p></div></section><section className="journey-strip"><div><small>01 / KHÁM PHÁ</small><p>Biển ngọc, rừng xanh.</p></div><div><small>02 / KẾT NỐI</small><p>Hai vai, một sức mạnh.</p></div><div><small>03 / ĐỐI ĐẦU</small><p>Cùng nhau đánh thức Astra.</p></div><a href={import.meta.env.BASE_URL + 'credits.html'} target="_blank" rel="noreferrer">Art credits · MIT / CC0 ↗</a></section></main>;
}
