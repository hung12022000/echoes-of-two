import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { BUILDABLES, ITEMS, RECIPES, formatCost } from '../../game/oceanbound/catalog';
import type { MarkerType } from '../../game/oceanbound/session';
import { OceanSession } from '../../game/oceanbound/session';

type Panel = 'inventory' | 'craft' | 'build' | 'map' | null;
const markerIcon: Record<MarkerType, string> = { custom: '📍', island: '🏝️', danger: '⚠️', resource: '⛏️', base: '🏠', wreck: '🚢' };
const islandRank = ['Hoang sơ', 'Trại nhỏ', 'Tiền đồn', 'Khu định cư', 'Cứ điểm'];

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="survival-meter"><span>{label}</span><div><i className={tone} style={{ width: `${value}%` }} /></div><b>{Math.ceil(value)}</b></div>;
}

export function OceanHud({ session }: { session: OceanSession }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [panel, setPanel] = useState<Panel>(null);
  const [markerName, setMarkerName] = useState('Điểm khám phá');
  const [markerNote, setMarkerNote] = useState('');
  const [markerType, setMarkerType] = useState<MarkerType>('custom');
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      const next = event.code === 'KeyI' ? 'inventory' : event.code === 'KeyC' ? 'craft' : event.code === 'KeyN' ? 'build' : event.code === 'KeyM' ? 'map' : undefined;
      if (next) { event.preventDefault(); setPanel(current => current === next ? null : next); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);
  const waypoint = state.markers.find(marker => marker.id === state.waypointId);
  const distance = waypoint ? Math.hypot(waypoint.x - state.playerX, waypoint.z - state.playerZ) : 0;
  const inventory = useMemo(() => Object.entries(state.inventory).filter(([, amount]) => amount > 0).sort(([a], [b]) => (ITEMS[a]?.tier ?? 9) - (ITEMS[b]?.tier ?? 9)), [state.inventory]);
  const clock = `${String(Math.floor(state.minute / 60)).padStart(2, '0')}:${String(Math.floor(state.minute % 60)).padStart(2, '0')}`;
  return <>
    <aside className="ocean-vitals" aria-label="Chỉ số sinh tồn">
      <div className="ocean-day"><span>NGÀY {state.day} · {clock}</span><b>{state.weather}</b><small>{state.forecast}</small></div>
      <Meter label="SINH LỰC" value={state.health} tone="life" />
      <Meter label="NO" value={state.hunger} tone="hunger" />
      <Meter label="KHÁT" value={state.thirst} tone="thirst" />
      <Meter label="THỂ LỰC" value={state.stamina} tone="stamina" />
      <div className="threat-line"><span>MỨC ĐE DỌA</span><b>{state.threat}</b></div>
    </aside>
    <aside className="ocean-objective">
      <span className="eyebrow">OCEANBOUND · SINH TỒN</span>
      <strong>{state.islandName}</strong>
      <small>{islandRank[state.islandLevel]} · cấp {state.islandLevel}/4</small>
      <div className="development"><i style={{ width: `${state.islandLevel / 4 * 100}%` }} /></div>
      {waypoint && <p>🧭 {waypoint.title} · {Math.round(distance)} m</p>}
      <p>{state.message}</p>
    </aside>
    <nav className="ocean-toolbar" aria-label="Công cụ sinh tồn">
      <button onClick={() => setPanel(panel === 'inventory' ? null : 'inventory')}><kbd>I</kbd><span>Túi đồ</span></button>
      <button onClick={() => setPanel(panel === 'craft' ? null : 'craft')}><kbd>C</kbd><span>Chế tạo</span></button>
      <button onClick={() => setPanel(panel === 'build' ? null : 'build')}><kbd>N</kbd><span>Xây dựng</span></button>
      <button onClick={() => setPanel(panel === 'map' ? null : 'map')}><kbd>M</kbd><span>Hải đồ</span></button>
      <button onClick={() => session.save()}><kbd>↥</kbd><span>Lưu</span></button>
    </nav>
    {state.nearby && <div className="resource-prompt"><kbd>F</kbd><div><strong>Thu gom {ITEMS[state.nearby.item]?.icon} {ITEMS[state.nearby.item]?.name}</strong><small>x{state.nearby.amount}{state.inventory.hook ? ' · móc +1' : ''}</small></div></div>}
    {panel && <section className="ocean-panel" role="dialog" aria-label="Sổ tay sinh tồn">
      <header><div><span className="eyebrow">SỔ TAY OCEANBOUND</span><h2>{panel === 'inventory' ? 'Túi sinh tồn' : panel === 'craft' ? 'Bàn chế tạo' : panel === 'build' ? 'Xây nhà & căn cứ' : 'Hải đồ Vịnh Ngọc'}</h2></div><button aria-label="Đóng sổ tay" onClick={() => setPanel(null)}>×</button></header>
      {panel === 'inventory' && <div className="inventory-grid">{inventory.map(([id, amount]) => <article key={id}><span>{ITEMS[id]?.icon ?? '•'}</span><div><b>{ITEMS[id]?.name ?? id}</b><small>{ITEMS[id]?.description}</small></div><strong>x{amount}</strong>{['fresh_water', 'cooked_fish', 'coconut'].includes(id) && <button onClick={() => session.consume(id)}>Dùng</button>}</article>)}</div>}
      {panel === 'craft' && <div className="recipe-grid">{RECIPES.map(recipe => {
        const available = Object.entries(recipe.inputs).every(([id, amount]) => (state.inventory[id] ?? 0) >= amount);
        return <article className={available ? 'craftable' : ''} key={recipe.id}><span>{recipe.icon}</span><div><b>{recipe.name}</b><small>{recipe.description}</small><em>{formatCost(recipe.inputs, state.inventory)}</em></div><button disabled={!available && state.onlineRole !== 'guest'} onClick={() => session.craft(recipe.id)}>Chế tạo</button></article>;
      })}</div>}
      {panel === 'build' && <div className="build-layout"><div className="build-list">{BUILDABLES.map(id => <button className={state.selectedBuild === id ? 'selected' : ''} onClick={() => session.selectBuild(id)} key={id}><span>{ITEMS[id]?.icon}</span><b>{ITEMS[id]?.name}</b><small>Trong túi: {state.inventory[id] ?? 0}</small></button>)}</div><div className="build-help"><div className="build-ghost">{ITEMS[state.selectedBuild]?.icon}</div><h3>{ITEMS[state.selectedBuild]?.name}</h3><p>{ITEMS[state.selectedBuild]?.description}</p><button className="primary" onClick={() => { session.placeSelected(); setPanel(null); }}>Đặt tại vị trí hiện tại</button><small>Hoặc đóng sổ tay rồi nhấn B. Công trình tự bắt vào lưới 0,5 m.</small></div></div>}
      {panel === 'map' && <div className="map-layout"><div className="sea-map">
        <span className="map-grid-label north">BẮC</span><span className="map-grid-label east">ĐÔNG</span>
        <i className="map-island main" /><i className="map-island tiny one" /><i className="map-island tiny two" />
        {state.markers.map(marker => <button key={marker.id} className={`map-pin ${marker.type} ${state.waypointId === marker.id ? 'active' : ''}`} style={{ left: `${50 + marker.x / 2.5}%`, top: `${58 - marker.z / 2.5}%` }} title={`${marker.title}: ${marker.note}`} onClick={() => session.setWaypoint(marker.id)}>{markerIcon[marker.type]}</button>)}
        <span className="player-dot" style={{ left: `${50 + state.playerX / 2.5}%`, top: `${58 - state.playerZ / 2.5}%` }}>▲</span>
      </div><div className="marker-form"><h3>Đánh dấu điểm hiện tại</h3><label>Tên<input maxLength={32} value={markerName} onChange={event => setMarkerName(event.target.value)} /></label><label>Loại<select value={markerType} onChange={event => setMarkerType(event.target.value as MarkerType)}><option value="custom">Điểm tùy chọn</option><option value="base">Căn cứ</option><option value="resource">Tài nguyên</option><option value="danger">Nguy hiểm</option><option value="wreck">Xác tàu</option><option value="island">Đảo</option></select></label><label>Ghi chú<textarea maxLength={100} value={markerNote} onChange={event => setMarkerNote(event.target.value)} /></label><button className="primary" onClick={() => { if (session.addMarker(markerType, markerName, markerNote)) { setMarkerNote(''); } }}>Thêm marker</button><div className="marker-list">{state.markers.map(marker => <button key={marker.id} onClick={() => session.setWaypoint(marker.id)}><span>{markerIcon[marker.type]}</span><div><b>{marker.title}</b><small>{marker.note || `${marker.x}, ${marker.z}`}</small></div></button>)}</div></div></div>}
    </section>}
  </>;
}
