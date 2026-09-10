import { BUILDABLES, ITEMS, RECIPES, itemName } from './catalog';

export type Weather = 'Trong xanh' | 'Gió mạnh' | 'Bão nhiệt đới' | 'Mắt bão';
export type MarkerType = 'custom' | 'island' | 'danger' | 'resource' | 'base' | 'wreck';
export interface BuildingRecord { id: string; type: string; x: number; z: number; rotation: number; health: number }
export interface MapMarker { id: string; type: MarkerType; title: string; note: string; x: number; z: number; createdAt: number }
export interface NearbyResource { nodeId: string; item: string; amount: number }
export type OceanAction =
  | { type: 'gather'; nodeId: string; item: string; amount: number }
  | { type: 'craft'; recipeId: string }
  | { type: 'consume'; item: string }
  | { type: 'build'; building: string; x: number; z: number; rotation: number }
  | { type: 'marker'; markerType: MarkerType; title: string; note: string; x: number; z: number };

export interface OceanState {
  version: 1;
  day: number;
  minute: number;
  weather: Weather;
  forecast: string;
  health: number;
  hunger: number;
  thirst: number;
  stamina: number;
  inventory: Record<string, number>;
  buildings: BuildingRecord[];
  markers: MapMarker[];
  waypointId: string;
  selectedBuild: string;
  nearby?: NearbyResource;
  playerX: number;
  playerZ: number;
  islandLevel: number;
  islandName: string;
  threat: string;
  message: string;
  revision: number;
  onlineRole: 'offline' | 'host' | 'guest';
}

const SAVE_KEY = 'echoes.oceanbound.save.v1';
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const startState = (): OceanState => ({
  version: 1,
  day: 1,
  minute: 8 * 60,
  weather: 'Trong xanh',
  forecast: 'Biển êm trong khoảng 2 phút tới',
  health: 100,
  hunger: 82,
  thirst: 76,
  stamina: 100,
  inventory: { driftwood: 4, plastic: 3, fiber: 6, stone: 3, scrap: 1, coconut: 1, fish: 1 },
  buildings: [],
  markers: [
    { id: 'island-home', type: 'island', title: 'Đảo Vịnh Ngọc', note: 'Đảo khởi đầu · nước ngọt và rừng cọ', x: 0, z: 15, createdAt: 0 },
    { id: 'trong-mai', type: 'custom', title: 'Hòn Trống Mái', note: 'Biểu tượng đá vôi ngoài vịnh', x: 92, z: 118, createdAt: 0 },
    { id: 'wreck', type: 'wreck', title: 'Xác tàu nông', note: 'Có tín hiệu sắt phế liệu', x: -48, z: 72, createdAt: 0 },
  ],
  waypointId: 'island-home',
  selectedBuild: 'foundation',
  playerX: 0,
  playerZ: 55,
  islandLevel: 0,
  islandName: 'Đảo Vịnh Ngọc',
  threat: 'THẤP · cá mập rạn san hô',
  message: 'F nhặt tài nguyên · C chế tạo · B đặt công trình · M mở bản đồ.',
  revision: 0,
  onlineRole: 'offline',
});

type Listener = () => void;

export class OceanSession {
  private state: OceanState = startState();
  private listeners = new Set<Listener>();
  private accumulator = 0;
  private autosave = 0;
  private messageAge = 0;
  private authority = true;
  private sendAction?: (action: OceanAction) => void;

  constructor() { this.load(); }
  get view() { return this.state; }
  getSnapshot = () => this.state;
  subscribe = (listener: Listener) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  private publish(patch: Partial<OceanState>) {
    this.state = { ...this.state, ...patch, revision: this.state.revision + 1 };
    for (const listener of this.listeners) listener();
  }
  private tell(message: string) { this.messageAge = 0; this.publish({ message }); }

  configureNetwork(role: 'offline' | 'host' | 'guest', sendAction?: (action: OceanAction) => void) {
    this.authority = role !== 'guest';
    this.sendAction = sendAction;
    if (this.state.onlineRole !== role) this.publish({ onlineRole: role });
  }

  setNearby(nearby?: NearbyResource) {
    const old = this.state.nearby;
    if (old?.nodeId === nearby?.nodeId && old?.amount === nearby?.amount) return;
    this.publish({ nearby });
  }

  setPosition(x: number, z: number) {
    if (Math.abs(x - this.state.playerX) < 0.2 && Math.abs(z - this.state.playerZ) < 0.2) return;
    this.publish({ playerX: x, playerZ: z });
  }

  tick(dt: number, moving: boolean) {
    this.accumulator += dt;
    this.autosave += dt;
    this.messageAge += dt;
    if (this.accumulator < 0.25) return;
    const elapsed = this.accumulator;
    this.accumulator = 0;
    const minute = this.state.minute + elapsed * 2.4;
    const day = this.state.day + Math.floor(minute / 1440);
    const clock = minute % 1440;
    const cycle = ((Math.floor(((day - 1) * 1440 + clock - 480) / 180) % 8) + 8) % 8;
    const weather: Weather = cycle === 2 || cycle === 6 ? 'Gió mạnh' : cycle === 3 || cycle === 7 ? 'Bão nhiệt đới' : cycle === 4 ? 'Mắt bão' : 'Trong xanh';
    const forecast = weather === 'Trong xanh' ? 'Trời quang · gió Đông Nam nhẹ' : weather === 'Gió mạnh' ? 'Cảnh báo: bão đang tiến gần' : weather === 'Mắt bão' ? 'Mắt bão · tranh thủ sửa chữa' : 'Bão nhiệt đới · tìm nơi trú và thả neo';
    let hunger = clamp(this.state.hunger - elapsed * 0.018);
    let thirst = clamp(this.state.thirst - elapsed * 0.03);
    let stamina = clamp(this.state.stamina + elapsed * (moving ? -1.7 : 4.2));
    let health = this.state.health;
    if (hunger <= 0 || thirst <= 0) health = clamp(health - elapsed * 0.7);
    const defended = this.hasBuilding('anchor');
    if (weather === 'Bão nhiệt đới' && !defended) health = clamp(health - elapsed * 0.08);
    if (health <= 0) {
      health = 45; hunger = 35; thirst = 35;
      this.tell('Hưng và Mei.100 đã cứu nhau về trại. Một phần thời gian trong ngày đã trôi qua.');
    }
    this.publish({ day, minute: clock, weather, forecast, health, hunger, thirst, stamina, threat: weather === 'Bão nhiệt đới' ? (defended ? 'VỪA · căn cứ đã thả neo' : 'CAO · bão và sóng lớn') : 'THẤP · cá mập rạn san hô' });
    if (this.autosave >= 15 && this.authority) { this.autosave = 0; this.save(false); }
  }

  gather(nodeId: string, itemId: string, amount: number) {
    return this.dispatch({ type: 'gather', nodeId, item: itemId, amount });
  }

  private applyGather(nodeId: string, itemId: string, amount: number) {
    if (!ITEMS[itemId] || !Number.isInteger(amount) || amount < 1 || amount > 5 || nodeId.length > 40) return false;
    const bonus = (this.state.inventory.hook ?? 0) > 0 ? 1 : 0;
    const inventory = { ...this.state.inventory, [itemId]: (this.state.inventory[itemId] ?? 0) + amount + bonus };
    this.publish({ inventory, nearby: this.state.nearby?.nodeId === nodeId ? undefined : this.state.nearby });
    this.tell(`Đã thu gom ${ITEMS[itemId].icon} ${itemName(itemId)} x${amount + bonus}${bonus ? ' · móc thu gom +1' : ''}.`);
    return true;
  }

  craft(recipeId: string) { return this.dispatch({ type: 'craft', recipeId }); }
  consume(item: string) { return this.dispatch({ type: 'consume', item }); }
  placeSelected(x = this.state.playerX, z = this.state.playerZ, rotation = 0) { return this.dispatch({ type: 'build', building: this.state.selectedBuild, x, z, rotation }); }
  addMarker(markerType: MarkerType, title: string, note = '', x = this.state.playerX, z = this.state.playerZ) { return this.dispatch({ type: 'marker', markerType, title, note, x, z }); }
  applyRemoteAction(action: unknown) { if (this.authority && this.isAction(action)) this.apply(action); }

  private dispatch(action: OceanAction) {
    if (!this.authority && this.sendAction) {
      this.sendAction(action);
      this.tell('Đã gửi yêu cầu tới chủ phòng…');
      return true;
    }
    return this.apply(action);
  }

  private apply(action: OceanAction) {
    if (action.type === 'gather') return this.applyGather(action.nodeId, action.item, action.amount);
    if (action.type === 'craft') {
      const recipe = RECIPES.find(candidate => candidate.id === action.recipeId);
      if (!recipe) return false;
      const missing = Object.entries(recipe.inputs).filter(([id, amount]) => (this.state.inventory[id] ?? 0) < amount);
      if (missing.length) { this.tell(`Còn thiếu: ${missing.map(([id, amount]) => `${itemName(id)} x${amount - (this.state.inventory[id] ?? 0)}`).join(', ')}.`); return false; }
      const inventory = { ...this.state.inventory };
      for (const [id, amount] of Object.entries(recipe.inputs)) inventory[id] -= amount;
      inventory[recipe.output.item] = (inventory[recipe.output.item] ?? 0) + recipe.output.amount;
      this.publish({ inventory }); this.tell(`Đã chế tạo ${recipe.icon} ${recipe.name}.`); return true;
    }
    if (action.type === 'consume') {
      if ((this.state.inventory[action.item] ?? 0) < 1) { this.tell(`Không có ${itemName(action.item)} trong túi.`); return false; }
      const inventory = { ...this.state.inventory, [action.item]: this.state.inventory[action.item] - 1 };
      if (action.item === 'fresh_water') this.publish({ inventory, thirst: clamp(this.state.thirst + 42) });
      else if (action.item === 'cooked_fish') this.publish({ inventory, hunger: clamp(this.state.hunger + 38), health: clamp(this.state.health + 8) });
      else if (action.item === 'coconut') this.publish({ inventory, hunger: clamp(this.state.hunger + 12), thirst: clamp(this.state.thirst + 18) });
      else return false;
      this.tell(`Đã dùng ${ITEMS[action.item]?.icon ?? ''} ${itemName(action.item)}.`); return true;
    }
    if (action.type === 'build') {
      if (!BUILDABLES.includes(action.building) || !finite(action.x) || !finite(action.z) || Math.abs(action.x) > 100 || Math.abs(action.z) > 100) return false;
      if ((this.state.inventory[action.building] ?? 0) < 1) { this.tell(`Hãy chế tạo ${itemName(action.building)} trước.`); return false; }
      if (this.state.buildings.some(piece => Math.hypot(piece.x - action.x, piece.z - action.z) < 1.3)) { this.tell('Vị trí này đang bị một công trình khác chiếm chỗ.'); return false; }
      const inventory = { ...this.state.inventory, [action.building]: this.state.inventory[action.building] - 1 };
      const record: BuildingRecord = { id: crypto.randomUUID(), type: action.building, x: Math.round(action.x * 2) / 2, z: Math.round(action.z * 2) / 2, rotation: action.rotation, health: 100 };
      const buildings = [...this.state.buildings, record].slice(-120);
      const islandLevel = this.developmentLevel(buildings);
      const markers = action.building === 'beacon' ? [...this.state.markers, { id: crypto.randomUUID(), type: 'base' as const, title: `${this.state.islandName} · Tiền đồn`, note: 'Cột mốc do Hưng và Mei.100 xây dựng', x: record.x, z: record.z, createdAt: Date.now() }] : this.state.markers;
      this.publish({ inventory, buildings, islandLevel, markers });
      this.tell(`Đã xây ${ITEMS[action.building].icon} ${itemName(action.building)} · đảo đạt cấp ${islandLevel}.`); return true;
    }
    const title = action.title.trim().slice(0, 32);
    if (!title || !finite(action.x) || !finite(action.z) || Math.abs(action.x) > 500 || Math.abs(action.z) > 500) return false;
    const marker: MapMarker = { id: crypto.randomUUID(), type: action.markerType, title, note: action.note.trim().slice(0, 100), x: Math.round(action.x), z: Math.round(action.z), createdAt: Date.now() };
    this.publish({ markers: [...this.state.markers, marker].slice(-40), waypointId: marker.id }); this.tell(`Đã đánh dấu “${title}” trên hải đồ.`); return true;
  }

  selectBuild(id: string) { if (BUILDABLES.includes(id)) this.publish({ selectedBuild: id }); }
  setWaypoint(id: string) { if (this.state.markers.some(marker => marker.id === id)) this.publish({ waypointId: id }); }
  hasBuilding(type: string) { return this.state.buildings.some(building => building.type === type); }
  private developmentLevel(buildings: BuildingRecord[]) {
    const score = buildings.reduce((total, building) => total + ({ foundation: 1, wall: 1, door: 1, roof: 2, storage: 2, purifier: 3, grill: 2, beacon: 5, anchor: 4, lightning_rod: 4 }[building.type] ?? 1), 0);
    return score >= 28 ? 4 : score >= 18 ? 3 : score >= 10 ? 2 : score >= 4 ? 1 : 0;
  }

  save(notify = true) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...this.state, nearby: undefined, onlineRole: 'offline' })); if (notify) this.tell('Đã lưu hành trình và mọi thay đổi trên đảo.'); return true; }
    catch { if (notify) this.tell('Trình duyệt đang chặn lưu cục bộ.'); return false; }
  }
  private load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY); if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<OceanState>;
      if (parsed.version !== 1 || !parsed.inventory || !Array.isArray(parsed.buildings) || !Array.isArray(parsed.markers)) return;
      this.state = { ...startState(), ...parsed, nearby: undefined, onlineRole: 'offline', revision: 0 };
    } catch { /* Corrupt saves fall back to a safe new world. */ }
  }

  exportNetwork() {
    const { nearby: _nearby, onlineRole: _role, ...shared } = this.state;
    return shared;
  }
  importNetwork(value: unknown) {
    if (this.authority || typeof value !== 'object' || value === null) return false;
    const incoming = value as Partial<OceanState>;
    if (incoming.version !== 1 || !incoming.inventory || !Array.isArray(incoming.buildings) || !Array.isArray(incoming.markers) || !finite(incoming.health) || !finite(incoming.minute)) return false;
    this.state = { ...this.state, ...incoming, onlineRole: 'guest', nearby: this.state.nearby, revision: this.state.revision + 1 };
    for (const listener of this.listeners) listener();
    return true;
  }

  private isAction(value: unknown): value is OceanAction {
    if (typeof value !== 'object' || value === null || typeof (value as { type?: unknown }).type !== 'string') return false;
    const action = value as Record<string, unknown>;
    if (action.type === 'gather') return typeof action.nodeId === 'string' && typeof action.item === 'string' && Number.isInteger(action.amount) && (action.amount as number) > 0 && (action.amount as number) <= 5;
    if (action.type === 'craft') return typeof action.recipeId === 'string' && action.recipeId.length < 50;
    if (action.type === 'consume') return typeof action.item === 'string' && action.item.length < 50;
    if (action.type === 'build') return typeof action.building === 'string' && finite(action.x) && finite(action.z) && finite(action.rotation);
    return action.type === 'marker' && ['custom', 'island', 'danger', 'resource', 'base', 'wreck'].includes(String(action.markerType)) && typeof action.title === 'string' && typeof action.note === 'string' && finite(action.x) && finite(action.z);
  }
}
