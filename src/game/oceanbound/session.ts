import { BUILDABLES, CROPS, ITEMS, RECIPES, itemName } from './catalog';

export type Weather = 'Trong xanh' | 'Gió mạnh' | 'Mưa rào' | 'Giông sét' | 'Bão nhiệt đới' | 'Mắt bão' | 'Mưa tuyết dị thường';
export type CampaignPhase = 'raft' | 'island' | 'challenge' | 'ending';
export type MarkerType = 'custom' | 'island' | 'danger' | 'resource' | 'base' | 'wreck';
export interface BuildingRecord { id: string; type: string; x: number; z: number; rotation: number; health: number }
export interface MapMarker { id: string; type: MarkerType; title: string; note: string; x: number; z: number; createdAt: number }
export interface NearbyResource { nodeId: string; item: string; amount: number }
export interface CropPlot { id: string; cropId: string; x: number; z: number; growth: number; water: number; harvestsLeft: number; }
export type OceanAction =
  | { type: 'gather'; nodeId: string; item: string; amount: number }
  | { type: 'craft'; recipeId: string }
  | { type: 'consume'; item: string }
  | { type: 'build'; building: string; x: number; z: number; rotation: number }
  | { type: 'transfer'; item: string; direction: 'store' | 'take'; amount: number }
  | { type: 'plant'; cropId: string; x: number; z: number }
  | { type: 'water'; plotId: string }
  | { type: 'harvest'; plotId: string }
  | { type: 'travel' }
  | { type: 'marker'; markerType: MarkerType; title: string; note: string; x: number; z: number };

export interface OceanState {
  version: 3;
  day: number;
  minute: number;
  weather: Weather;
  forecast: string;
  health: number;
  hunger: number;
  thirst: number;
  stamina: number;
  inventory: Record<string, number>;
  storageInventory: Record<string, number>;
  crops: CropPlot[];
  buildings: BuildingRecord[];
  markers: MapMarker[];
  waypointId: string;
  selectedBuild: string;
  nearby?: NearbyResource;
  playerX: number;
  playerZ: number;
  islandLevel: number;
  islandName: string;
  currentIsland: number;
  completedIslands: number[];
  keys: number;
  phase: CampaignPhase;
  objective: string;
  objectiveProgress: string;
  bossDefeated: boolean;
  challengeRemaining: number;
  travelReady: boolean;
  transitionId: number;
  spawnX: number;
  spawnZ: number;
  warning: string;
  temperature: number;
  wetness: number;
  ending: boolean;
  threat: string;
  message: string;
  revision: number;
  onlineRole: 'offline' | 'host' | 'guest';
}

const SAVE_KEY = 'echoes.oceanbound.save.v3';
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const startState = (): OceanState => ({
  version: 3,
  day: 1,
  minute: 8 * 60,
  weather: 'Trong xanh',
  forecast: 'Biển êm trong khoảng 2 phút tới',
  health: 100,
  hunger: 82,
  thirst: 76,
  stamina: 100,
  inventory: { driftwood: 8, plastic: 6, fiber: 14, stone: 5, scrap: 4, bamboo: 3, clay: 2, coconut: 2, fish: 1, hook: 1, rescue_kit: 1, seed_tomato: 1, seed_coconut_tree: 1 },
  storageInventory: {},
  crops: [],
  buildings: [],
  markers: [
    { id: 'island-home', type: 'island', title: 'Đảo Vịnh Ngọc', note: 'Đảo khởi đầu · nước ngọt và rừng cọ', x: 0, z: 15, createdAt: 0 },
    { id: 'trong-mai', type: 'custom', title: 'Hòn Trống Mái', note: 'Biểu tượng đá vôi ngoài vịnh', x: 92, z: 118, createdAt: 0 },
    { id: 'wreck', type: 'wreck', title: 'Xác tàu nông', note: 'Có tín hiệu sắt phế liệu', x: -48, z: 72, createdAt: 0 },
    { id: 'island-rain', type: 'island', title: 'Đảo Rừng Mưa', note: 'Chìa khóa I · thú đá canh giữ', x: -44, z: 28, createdAt: 0 },
    { id: 'island-cave', type: 'island', title: 'Đảo Hang Ngọc', note: 'Chìa khóa II · rạn san hô cổ', x: 43, z: 16, createdAt: 0 },
    { id: 'island-storm', type: 'danger', title: 'Đảo Mắt Bão', note: 'Chìa khóa III · vùng sét cực mạnh', x: -28, z: -22, createdAt: 0 },
  ],
  waypointId: 'island-home',
  selectedBuild: 'foundation',
  playerX: 0,
  playerZ: 81,
  islandLevel: 0,
  islandName: 'Bè Khởi Hành',
  currentIsland: 0,
  completedIslands: [],
  keys: 0,
  phase: 'raft',
  objective: 'Mở rộng bè và chế tạo Buồm định hướng',
  objectiveProgress: 'Sàn móng 0/2 · Máy lọc 0/1 · Buồm 0/1',
  bossDefeated: false,
  challengeRemaining: 0,
  travelReady: false,
  transitionId: 0,
  spawnX: 0,
  spawnZ: 81,
  warning: '',
  temperature: 29,
  wetness: 0,
  ending: false,
  threat: 'THẤP · cá mập rạn san hô',
  message: 'Từ chiếc bè nhỏ: F nhặt vật trôi · C chế tạo · B đặt công trình · M mở bản đồ.',
  revision: 0,
  onlineRole: 'offline',
});

const ISLANDS = [
  { name: 'Bè Khởi Hành', x: 0, z: 81, objective: 'Mở rộng bè và chế tạo Buồm định hướng', requires: { foundation: 2, purifier: 1, sail: 1 } },
  { name: 'Đảo Rừng Mưa', x: -36, z: 35, objective: 'Dựng nhà trú ẩn và hạ Thú Đá canh rừng', requires: { foundation: 1, wall: 1, roof: 1, storage: 1 } },
  { name: 'Đảo Hang Ngọc', x: 36, z: 22, objective: 'Lập trạm nghiên cứu, thả neo rồi hạ Vệ Binh San Hô', requires: { beacon: 1, anchor: 1, research_table: 1 } },
  { name: 'Đảo Mắt Bão', x: -30, z: -18, objective: 'Dựng thu lôi và tháp canh, đánh bại Warden cuối', requires: { lightning_rod: 1, watchtower: 1 } },
] as const;

function countBuildings(buildings: BuildingRecord[], type: string) { return buildings.filter(building => building.type === type).length; }
function campaignProgress(state: OceanState) {
  const island = ISLANDS[Math.max(0, Math.min(3, state.currentIsland))];
  const parts = Object.entries(island.requires).map(([id, amount]) => `${itemName(id)} ${Math.min(countBuildings(state.buildings, id), amount)}/${amount}`);
  const structuresReady = Object.entries(island.requires).every(([id, amount]) => countBuildings(state.buildings, id) >= amount);
  if (state.currentIsland > 0) parts.push(`Quái vật ${state.bossDefeated ? '1/1' : '0/1'}`);
  return { text: parts.join(' · '), ready: structuresReady && (state.currentIsland === 0 || state.bossDefeated) };
}

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
    const weather: Weather = this.state.phase === 'challenge' ? (this.state.currentIsland >= 3 ? 'Giông sét' : 'Bão nhiệt đới') : cycle <= 1 ? 'Trong xanh' : cycle === 2 ? 'Gió mạnh' : cycle === 3 ? 'Mưa rào' : cycle === 4 ? 'Bão nhiệt đới' : cycle === 5 ? 'Mắt bão' : cycle === 6 && day % 3 === 0 ? 'Mưa tuyết dị thường' : 'Giông sét';
    const forecast = weather === 'Trong xanh' ? 'Trời quang · gió Đông Nam nhẹ' : weather === 'Gió mạnh' ? 'Cảnh báo: bão đang tiến gần' : weather === 'Mưa rào' ? 'Mưa tưới cây · hứng nước sạch' : weather === 'Mắt bão' ? 'Mắt bão · tranh thủ sửa chữa' : weather === 'Mưa tuyết dị thường' ? 'Không khí lạnh bất thường · tìm mái trú' : weather === 'Giông sét' ? 'Sét mạnh · tránh cột cao chưa tiếp địa' : 'Bão nhiệt đới · tìm nơi trú và thả neo';
    let hunger = clamp(this.state.hunger - elapsed * 0.018);
    let thirst = clamp(this.state.thirst - elapsed * 0.03);
    let stamina = clamp(this.state.stamina + elapsed * (moving ? -1.7 : 4.2));
    let health = this.state.health;
    if (hunger <= 0 || thirst <= 0) health = clamp(health - elapsed * 0.7);
    const defended = this.hasBuilding('anchor');
    if ((weather === 'Bão nhiệt đới' || weather === 'Giông sét') && !defended) health = clamp(health - elapsed * 0.08);
    const raining = weather === 'Mưa rào' || weather === 'Giông sét' || weather === 'Bão nhiệt đới';
    const crops = this.state.crops.map(plot => {
      const crop = CROPS.find(entry => entry.id === plot.cropId);
      const water = clamp(plot.water + (raining && this.hasBuilding('rain_collector') ? elapsed * 2.2 : -elapsed * 0.18));
      const growth = crop && water > 5 ? Math.min(1, plot.growth + elapsed / crop.growSeconds * (water > 35 ? 1 : 0.45)) : plot.growth;
      return { ...plot, water, growth };
    });
    const daylight = Math.max(0, Math.sin((clock - 360) / 720 * Math.PI));
    const temperature = Math.round((weather === 'Mưa tuyết dị thường' ? 3 : 19 + daylight * 13) * 10) / 10;
    const wetness = clamp(this.state.wetness + (raining ? elapsed * 2.4 : -elapsed * 1.2));
    let challengeRemaining = this.state.challengeRemaining;
    let travelReady = this.state.travelReady;
    if (this.state.phase === 'challenge' && challengeRemaining > 0) {
      challengeRemaining = Math.max(0, challengeRemaining - elapsed);
      travelReady = challengeRemaining <= 0;
    }
    if (health <= 0) { this.handlePartyDefeat(); return; }
    const warning = thirst <= 22 ? 'KHÁT NƯỚC NGHIÊM TRỌNG · lọc hoặc uống nước ngay' : hunger <= 20 ? 'ĐÓI NGHIÊM TRỌNG · nướng cá hoặc ăn dừa' : temperature < 8 && wetness > 35 ? 'HẠ THÂN NHIỆT · vào mái trú và hong khô' : (weather === 'Bão nhiệt đới' || weather === 'Giông sét') && !defended ? 'BÃO ĐANG PHÁ BÈ · chế tạo Neo và Cột thu lôi' : stamina <= 12 ? 'KIỆT SỨC · dừng chạy để hồi phục' : '';
    this.publish({ day, minute: clock, weather, forecast, health, hunger, thirst, stamina, crops, temperature, wetness, challengeRemaining, travelReady, warning, objectiveProgress: this.state.phase === 'challenge' ? (travelReady ? 'Đã vượt bão · hải trình tới đảo kế tiếp đã mở' : `Còn ${Math.ceil(challengeRemaining)} giây · neo, nước và thức ăn quyết định sống còn`) : this.state.objectiveProgress, threat: weather === 'Bão nhiệt đới' || weather === 'Giông sét' ? (defended ? 'VỪA · căn cứ đã thả neo' : `CAO · thiên tai cấp ${Math.min(5, this.state.currentIsland + 2)}`) : weather === 'Mưa tuyết dị thường' ? 'CAO · lạnh sâu và mặt bè trơn' : 'THẤP · cá mập rạn san hô' });
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
  transfer(item: string, direction: 'store' | 'take', amount = 1) { return this.dispatch({ type: 'transfer', item, direction, amount }); }
  plant(cropId: string, x = this.state.playerX, z = this.state.playerZ) { return this.dispatch({ type: 'plant', cropId, x, z }); }
  waterCrop(plotId: string) { return this.dispatch({ type: 'water', plotId }); }
  harvest(plotId: string) { return this.dispatch({ type: 'harvest', plotId }); }
  travel() { return this.dispatch({ type: 'travel' }); }
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
      else if (action.item === 'medicine') this.publish({ inventory, health: clamp(this.state.health + 45) });
      else if (action.item.startsWith('produce_')) this.publish({ inventory, hunger: clamp(this.state.hunger + 18), thirst: clamp(this.state.thirst + 8) });
      else return false;
      this.tell(`Đã dùng ${ITEMS[action.item]?.icon ?? ''} ${itemName(action.item)}.`); return true;
    }
    if (action.type === 'transfer') {
      if (!ITEMS[action.item] || !Number.isInteger(action.amount) || action.amount < 1 || action.amount > 20) return false;
      if (!this.hasBuilding('storage')) { this.tell('Hãy dựng Rương chứa đồ trước để mở kho chung.'); return false; }
      const source = action.direction === 'store' ? this.state.inventory : this.state.storageInventory;
      const target = action.direction === 'store' ? this.state.storageInventory : this.state.inventory;
      const amount = Math.min(action.amount, source[action.item] ?? 0);
      if (!amount || action.item === 'island_key') return false;
      const nextSource = { ...source, [action.item]: source[action.item] - amount };
      const nextTarget = { ...target, [action.item]: (target[action.item] ?? 0) + amount };
      this.publish(action.direction === 'store' ? { inventory: nextSource, storageInventory: nextTarget } : { storageInventory: nextSource, inventory: nextTarget });
      this.tell(`${action.direction === 'store' ? 'Đã cất' : 'Đã lấy'} ${itemName(action.item)} x${amount} ${action.direction === 'store' ? 'vào kho chung' : 'ra khỏi kho'}.`); return true;
    }
    if (action.type === 'plant') {
      const crop = CROPS.find(entry => entry.id === action.cropId);
      if (!crop || !finite(action.x) || !finite(action.z) || Math.abs(action.x) > 100 || Math.abs(action.z) > 100) return false;
      if (!this.hasBuilding(crop.size === 'small' ? 'small_planter' : 'tree_planter')) { this.tell(`Cần xây ${crop.size === 'small' ? 'Luống cây nhỏ' : 'Bồn cây lớn'} trước.`); return false; }
      const seed = `seed_${crop.id}`;
      if ((this.state.inventory[seed] ?? 0) < 1) { this.tell(`Chưa có hạt ${crop.name}. Hãy khám phá đảo và thùng hàng.`); return false; }
      const inventory = { ...this.state.inventory, [seed]: this.state.inventory[seed] - 1 };
      const plot: CropPlot = { id: crypto.randomUUID(), cropId: crop.id, x: action.x, z: action.z, growth: 0.02, water: 55, harvestsLeft: crop.harvests };
      this.publish({ inventory, crops: [...this.state.crops, plot].slice(-30) }); this.tell(`Đã gieo ${crop.icon} ${crop.name}. Giữ nước trên 35% để cây lớn nhanh.`); return true;
    }
    if (action.type === 'water') {
      const plot = this.state.crops.find(entry => entry.id === action.plotId); if (!plot) return false;
      if ((this.state.inventory.fresh_water ?? 0) < 1) { this.tell('Cần Nước sạch để tưới. Mưa và Máy hứng nước mưa có thể tưới tự động.'); return false; }
      this.publish({ inventory: { ...this.state.inventory, fresh_water: this.state.inventory.fresh_water - 1 }, crops: this.state.crops.map(entry => entry.id === plot.id ? { ...entry, water: 100 } : entry) }); this.tell('Đã tưới cây bằng nước sạch.'); return true;
    }
    if (action.type === 'harvest') {
      const plot = this.state.crops.find(entry => entry.id === action.plotId); const crop = plot && CROPS.find(entry => entry.id === plot.cropId);
      if (!plot || !crop || plot.growth < 1) { this.tell('Cây chưa sẵn sàng thu hoạch.'); return false; }
      const produce = `produce_${crop.id}`; const inventory = { ...this.state.inventory, [produce]: (this.state.inventory[produce] ?? 0) + (crop.size === 'small' ? 3 : 2) };
      const crops = plot.harvestsLeft > 1 ? this.state.crops.map(entry => entry.id === plot.id ? { ...entry, growth: 0.42, harvestsLeft: entry.harvestsLeft - 1 } : entry) : this.state.crops.filter(entry => entry.id !== plot.id);
      this.publish({ inventory, crops }); this.tell(`Thu hoạch ${crop.icon} ${crop.produceName}.`); return true;
    }
    if (action.type === 'travel') return this.applyTravel();
    if (action.type === 'build') {
      if (!BUILDABLES.includes(action.building) || !finite(action.x) || !finite(action.z) || Math.abs(action.x) > 100 || Math.abs(action.z) > 100) return false;
      if ((this.state.inventory[action.building] ?? 0) < 1) { this.tell(`Hãy chế tạo ${itemName(action.building)} trước.`); return false; }
      if (this.state.buildings.some(piece => Math.hypot(piece.x - action.x, piece.z - action.z) < 1.3)) { this.tell('Vị trí này đang bị một công trình khác chiếm chỗ.'); return false; }
      const inventory = { ...this.state.inventory, [action.building]: this.state.inventory[action.building] - 1 };
      const record: BuildingRecord = { id: crypto.randomUUID(), type: action.building, x: Math.round(action.x * 2) / 2, z: Math.round(action.z * 2) / 2, rotation: action.rotation, health: 100 };
      const buildings = [...this.state.buildings, record].slice(-120);
      const islandLevel = this.developmentLevel(buildings);
      const markers = action.building === 'beacon' ? [...this.state.markers, { id: crypto.randomUUID(), type: 'base' as const, title: `${this.state.islandName} · Tiền đồn`, note: 'Cột mốc do Hưng và Mei.100 xây dựng', x: record.x, z: record.z, createdAt: Date.now() }] : this.state.markers;
      const preview = { ...this.state, inventory, buildings, islandLevel, markers };
      const progress = campaignProgress(preview);
      const newlyComplete = progress.ready && this.state.currentIsland > 0 && !this.state.completedIslands.includes(this.state.currentIsland);
      this.publish({ inventory: newlyComplete ? { ...inventory, island_key: (inventory.island_key ?? 0) + 1 } : inventory, buildings, islandLevel, markers, objectiveProgress: progress.text, travelReady: progress.ready, keys: this.state.keys + (newlyComplete ? 1 : 0), completedIslands: newlyComplete ? [...this.state.completedIslands, this.state.currentIsland] : this.state.completedIslands });
      this.tell(progress.ready ? `Mục tiêu xây dựng hoàn tất${this.state.currentIsland ? ' và quái vật đã bị hạ' : ''} · đã mở hành trình tiếp theo!` : `Đã xây ${ITEMS[action.building].icon} ${itemName(action.building)} · đảo đạt cấp ${islandLevel}.`); return true;
    }
    const title = action.title.trim().slice(0, 32);
    if (!title || !finite(action.x) || !finite(action.z) || Math.abs(action.x) > 500 || Math.abs(action.z) > 500) return false;
    const marker: MapMarker = { id: crypto.randomUUID(), type: action.markerType, title, note: action.note.trim().slice(0, 100), x: Math.round(action.x), z: Math.round(action.z), createdAt: Date.now() };
    this.publish({ markers: [...this.state.markers, marker].slice(-40), waypointId: marker.id }); this.tell(`Đã đánh dấu “${title}” trên hải đồ.`); return true;
  }

  private applyTravel() {
    if (!this.state.travelReady || this.state.ending) { this.tell('Hành trình tiếp theo chưa mở. Hoàn thành mục tiêu đang hiển thị trước.'); return false; }
    if (this.state.phase === 'raft') {
      const next = this.state.currentIsland === 0 ? 1 : this.state.currentIsland;
      const island = ISLANDS[next];
      const progress = campaignProgress({ ...this.state, currentIsland: next, bossDefeated: false });
      this.publish({ currentIsland: next, phase: 'island', islandName: island.name, objective: island.objective, objectiveProgress: progress.text, bossDefeated: false, travelReady: false, transitionId: this.state.transitionId + 1, spawnX: island.x, spawnZ: island.z });
      this.tell(`Thuyền đã cập ${island.name}. Khám phá, xây công trình phối hợp rồi nhấn K để vào hang quái vật.`); return true;
    }
    if (this.state.phase === 'island') {
      if (this.state.currentIsland >= 3) {
        this.publish({ phase: 'ending', ending: true, islandName: 'Đất liền Hạ Long', objective: 'Hành trình hoàn tất', objectiveProgress: '3/3 chìa khóa · tín hiệu cứu hộ đã khóa', transitionId: this.state.transitionId + 1, spawnX: 0, spawnZ: 52, travelReady: false });
        this.tell('Máy bay cứu hộ đã thấy Tháp canh. Hưng và Mei.100 trở về đất liền Hạ Long!'); return true;
      }
      const seconds = 18 + this.state.currentIsland * 8;
      this.publish({ phase: 'challenge', islandName: `Bè giữa bão · chặng ${this.state.currentIsland}`, objective: `Giữ bè qua thiên tai cấp ${this.state.currentIsland + 1}`, objectiveProgress: `Còn ${seconds} giây · neo, nước và thức ăn quyết định sống còn`, challengeRemaining: seconds, travelReady: false, transitionId: this.state.transitionId + 1, spawnX: 0, spawnZ: 81 });
      this.tell('Đã trở lại bè. Sóng cao đang tới — ở gần nhau và giữ chỉ số sinh tồn.'); return true;
    }
    if (this.state.phase === 'challenge') {
      const next = Math.min(3, this.state.currentIsland + 1);
      const island = ISLANDS[next];
      const progress = campaignProgress({ ...this.state, currentIsland: next, bossDefeated: false });
      this.publish({ currentIsland: next, phase: 'island', islandName: island.name, objective: island.objective, objectiveProgress: progress.text, bossDefeated: false, challengeRemaining: 0, travelReady: false, transitionId: this.state.transitionId + 1, spawnX: island.x, spawnZ: island.z });
      this.tell(`Bão đã qua. Động cơ đưa cả hai tới ${island.name}.`); return true;
    }
    return false;
  }

  recordBossVictory() {
    if (!this.authority || this.state.phase !== 'island' || this.state.bossDefeated) return false;
    const preview = { ...this.state, bossDefeated: true };
    const progress = campaignProgress(preview);
    const newlyComplete = progress.ready && !this.state.completedIslands.includes(this.state.currentIsland);
    const inventory = newlyComplete ? { ...this.state.inventory, island_key: (this.state.inventory.island_key ?? 0) + 1 } : this.state.inventory;
    this.publish({ bossDefeated: true, objectiveProgress: progress.text, travelReady: progress.ready, inventory, keys: this.state.keys + (newlyComplete ? 1 : 0), completedIslands: newlyComplete ? [...this.state.completedIslands, this.state.currentIsland] : this.state.completedIslands });
    this.tell(newlyComplete ? `Nhận 🗝️ Chìa khóa ${this.state.currentIsland}/3 · thuyền về bè đã mở.` : 'Quái vật đảo đã bị đánh bại. Hoàn thiện công trình để nhận chìa khóa.'); return true;
  }

  useRescueKit() {
    if (!this.authority || (this.state.inventory.rescue_kit ?? 0) < 1) return false;
    this.publish({ inventory: { ...this.state.inventory, rescue_kit: this.state.inventory.rescue_kit - 1 } });
    this.tell('Bộ cứu hộ đã được dùng · đồng đội hồi sinh với 40% sinh lực.'); return true;
  }

  handlePartyDefeat() {
    if (!this.authority) return false;
    const lose = (items: Record<string, number>) => Object.fromEntries(Object.entries(items).map(([id, amount]) => [id, id === 'island_key' ? amount : Math.floor(amount * 0.75)]));
    const progress = campaignProgress(this.state);
    this.publish({ inventory: lose(this.state.inventory), storageInventory: lose(this.state.storageInventory), health: 55, hunger: 45, thirst: 45, phase: 'raft', islandName: 'Bè hồi sinh', objective: this.state.currentIsland ? `Chuẩn bị quay lại ${ISLANDS[this.state.currentIsland].name}` : ISLANDS[0].objective, objectiveProgress: 'Mất 25% vật phẩm thường trong túi và kho · chìa khóa được bảo toàn', travelReady: this.state.currentIsland > 0 || progress.ready, transitionId: this.state.transitionId + 1, spawnX: 0, spawnZ: 81 });
    this.tell('Cả hai đã gục. Hồi sinh trên bè; 25% vật phẩm thường trong túi và kho đã trôi mất.'); return true;
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
      const parsed = JSON.parse(raw) as Omit<Partial<OceanState>, 'version'> & { version?: number };
      if (![1, 2, 3].includes(parsed.version ?? 0) || !parsed.inventory || !Array.isArray(parsed.buildings) || !Array.isArray(parsed.markers)) return;
      this.state = { ...startState(), ...parsed, version: 3, storageInventory: parsed.storageInventory ?? {}, crops: parsed.crops ?? [], nearby: undefined, onlineRole: 'offline', revision: 0 };
    } catch { /* Corrupt saves fall back to a safe new world. */ }
  }

  exportNetwork() {
    const { nearby: _nearby, onlineRole: _role, ...shared } = this.state;
    return shared;
  }
  importNetwork(value: unknown) {
    if (this.authority || typeof value !== 'object' || value === null) return false;
    const incoming = value as Partial<OceanState>;
    if (incoming.version !== 3 || !incoming.inventory || !incoming.storageInventory || !Array.isArray(incoming.crops) || !Array.isArray(incoming.buildings) || !Array.isArray(incoming.markers) || !finite(incoming.health) || !finite(incoming.minute)) return false;
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
    if (action.type === 'transfer') return typeof action.item === 'string' && ['store', 'take'].includes(String(action.direction)) && Number.isInteger(action.amount) && (action.amount as number) > 0 && (action.amount as number) <= 20;
    if (action.type === 'plant') return typeof action.cropId === 'string' && finite(action.x) && finite(action.z);
    if (action.type === 'water' || action.type === 'harvest') return typeof action.plotId === 'string' && action.plotId.length < 80;
    if (action.type === 'travel') return true;
    return action.type === 'marker' && ['custom', 'island', 'danger', 'resource', 'base', 'wreck'].includes(String(action.markerType)) && typeof action.title === 'string' && typeof action.note === 'string' && finite(action.x) && finite(action.z);
  }
}
