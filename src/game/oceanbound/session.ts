import { BUILDABLES, CROPS, ITEMS, RECIPES, itemName } from './catalog';

export type Weather = 'Trong xanh' | 'Gió mạnh' | 'Mưa rào' | 'Giông sét' | 'Bão nhiệt đới' | 'Mắt bão' | 'Mưa tuyết dị thường';
export type CampaignPhase = 'raft' | 'island' | 'challenge' | 'ending';
export type MarkerType = 'custom' | 'island' | 'danger' | 'resource' | 'base' | 'wreck';
export type BuildingZone = 'raft' | number;
// Optional at the type boundary so v1-v4 saves and older peers remain readable; loaded/live records are normalized immediately.
export interface BuildingRecord { id: string; type: string; x: number; z: number; rotation: number; health: number; zone?: BuildingZone }
export interface MapMarker { id: string; type: MarkerType; title: string; note: string; x: number; z: number; createdAt: number }
export interface NearbyResource { nodeId: string; item: string; amount: number }
export interface CropPlot { id: string; cropId: string; x: number; z: number; stage: 0 | 1 | 2; stageProgress: number; water: number; harvestsLeft: number; }
export interface CraftJob { id: string; recipeId: string; startedAt: number; endsAt: number; duration: number; }
export type SharkRaidPhase = 'idle' | 'warning' | 'biting' | 'repelled';
export interface SharkRaidState {
  phase: SharkRaidPhase;
  countdown: number;
  raidIndex: number;
  pulse: number;
  targetBuildingId?: string;
  lastLoss: string;
}
export const SHARK_FIRST_RAID_SECONDS = 120;
export const SHARK_WARNING_SECONDS = 12;
export const cropStageName = (plot: CropPlot) => plot.stage === 0 ? 'Hạt giống' : plot.stage === 1 ? 'Cây vừa' : plot.stageProgress >= 1 ? 'Trưởng thành · có thể thu hoạch' : 'Trưởng thành';
export const cropOverallProgress = (plot: CropPlot) => Math.min(1, (plot.stage + plot.stageProgress) / 3);
export type OceanAction =
  | { type: 'gather'; nodeId: string; item: string; amount: number }
  | { type: 'craft'; recipeId: string }
  | { type: 'consume'; item: string }
  | { type: 'build'; building: string; x: number; z: number; rotation: number }
  | { type: 'transfer'; item: string; direction: 'store' | 'take'; amount: number }
  | { type: 'plant'; cropId: string; x: number; z: number }
  | { type: 'water'; plotId: string }
  | { type: 'harvest'; plotId: string }
  | { type: 'equip'; item: string }
  | { type: 'defendShark' }
  | { type: 'travel' }
  | { type: 'marker'; markerType: MarkerType; title: string; note: string; x: number; z: number };

export interface OceanState {
  version: 4;
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
  crafting?: CraftJob;
  craftPulse: number;
  crops: CropPlot[];
  buildings: BuildingRecord[];
  markers: MapMarker[];
  waypointId: string;
  selectedBuild: string;
  selectedTool: string;
  sharkRaid: SharkRaidState;
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

const SAVE_PREFIX = 'echoes.oceanbound.save.v4';
const SHARK_TARGET_TYPES = new Set(['foundation', 'storage', 'purifier', 'grill', 'small_planter', 'tree_planter', 'sail', 'anchor', 'rain_collector', 'raft_engine', 'research_table']);
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const nextSharkRaidSeconds = (raidIndex: number) => 150 + (raidIndex % 3) * 25;
const freshSharkRaid = (): SharkRaidState => ({ phase: 'idle', countdown: SHARK_FIRST_RAID_SECONDS, raidIndex: 0, pulse: 0, lastLoss: '' });
const normalizeSharkRaid = (value: unknown, fallback = freshSharkRaid()): SharkRaidState => {
  if (!value || typeof value !== 'object') return fallback;
  const raid = value as Partial<SharkRaidState>;
  if (!['idle', 'warning', 'biting', 'repelled'].includes(String(raid.phase)) || !finite(raid.countdown) || !finite(raid.raidIndex) || !finite(raid.pulse)) return fallback;
  return {
    phase: raid.phase as SharkRaidPhase,
    countdown: Math.max(0, raid.countdown),
    raidIndex: Math.max(0, Math.floor(raid.raidIndex)),
    pulse: Math.max(0, Math.floor(raid.pulse)),
    ...(typeof raid.targetBuildingId === 'string' && raid.targetBuildingId.length <= 80 ? { targetBuildingId: raid.targetBuildingId } : {}),
    lastLoss: typeof raid.lastLoss === 'string' ? raid.lastLoss.slice(0, 120) : '',
  };
};
const migratedSelectedTool = (inventory: Record<string, number>, selected?: unknown) => {
  if (typeof selected === 'string' && selected.length <= 50 && (inventory[selected] ?? 0) > 0) return selected;
  return (inventory.hook ?? 0) > 0 ? 'hook' : (inventory.hammer ?? 0) > 0 ? 'hammer' : '';
};
const startState = (): OceanState => ({
  version: 4,
  day: 1,
  minute: 8 * 60,
  weather: 'Trong xanh',
  forecast: 'Biển êm trong khoảng 2 phút tới',
  health: 100,
  hunger: 82,
  thirst: 76,
  stamina: 100,
  inventory: { driftwood: 8, plastic: 6, fiber: 14, stone: 5, scrap: 4, bamboo: 3, clay: 2, coconut: 2, fish: 1, hook: 1, hammer: 1, rescue_kit: 1, ...Object.fromEntries(CROPS.map(crop => [`seed_${crop.id}`, 1])) },
  storageInventory: {},
  crafting: undefined,
  craftPulse: 0,
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
  selectedTool: 'hook',
  sharkRaid: freshSharkRaid(),
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

const zoneForProgress = (state: Pick<OceanState, 'currentIsland'>): BuildingZone => state.currentIsland > 0 ? state.currentIsland : 'raft';
const zoneAtPlacement = (state: Pick<OceanState, 'phase' | 'currentIsland'>): BuildingZone => state.phase === 'island' && state.currentIsland > 0 ? state.currentIsland : 'raft';
function inferBuildingZone(building: BuildingRecord, currentIsland: number, phase: CampaignPhase): BuildingZone {
  if (building.zone === 'raft' || (typeof building.zone === 'number' && Number.isInteger(building.zone) && building.zone >= 1 && building.zone <= 3)) return building.zone;
  if (!finite(building.x) || !finite(building.z)) return phase === 'island' && currentIsland > 0 ? currentIsland : 'raft';
  let closest: BuildingZone = 'raft';
  let closestDistance = Number.POSITIVE_INFINITY;
  ISLANDS.forEach((island, index) => {
    const distance = Math.hypot(building.x - island.x, building.z - island.z);
    if (distance < closestDistance) { closestDistance = distance; closest = index === 0 ? 'raft' : index; }
  });
  return closest;
}
function countBuildings(buildings: BuildingRecord[], type: string, zone: BuildingZone) { return buildings.filter(building => building.type === type && building.zone === zone).length; }
function campaignProgress(state: OceanState) {
  const island = ISLANDS[Math.max(0, Math.min(3, state.currentIsland))];
  const zone = zoneForProgress(state);
  const parts = Object.entries(island.requires).map(([id, amount]) => `${itemName(id)} ${Math.min(countBuildings(state.buildings, id, zone), amount)}/${amount}`);
  const structuresReady = Object.entries(island.requires).every(([id, amount]) => countBuildings(state.buildings, id, zone) >= amount);
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
  private saveSlot = 'solo';

  constructor() { this.load(); }
  get view() { return this.state; }
  getSnapshot = () => this.state;
  subscribe = (listener: Listener) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  private publish(patch: Partial<OceanState>) {
    this.state = { ...this.state, ...patch, revision: this.state.revision + 1 };
    for (const listener of this.listeners) listener();
  }
  private tell(message: string) { this.messageAge = 0; this.publish({ message }); }

  useSaveSlot(roomCode?: string) {
    this.save(false);
    this.saveSlot = roomCode?.toUpperCase().trim().replace(/[^A-Z2-9]/g, '').slice(0, 6) || 'solo';
    this.state = startState();
    this.load();
    this.publish({ onlineRole: 'offline' });
  }

  hasRoomSave(roomCode: string) {
    try { return Boolean(localStorage.getItem(`${SAVE_PREFIX}.room.${roomCode.toUpperCase().trim()}`)); } catch { return false; }
  }

  get activeSaveSlot() { return this.saveSlot; }

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
    if (!this.authority) {
      if (this.autosave >= 5) { this.autosave = 0; this.save(false); }
      return;
    }
    let inventory = this.state.inventory;
    let crafting = this.state.crafting;
    let craftPulse = this.state.craftPulse;
    let craftedMessage = '';
    if (crafting && Date.now() >= crafting.endsAt) {
      const recipe = RECIPES.find(candidate => candidate.id === crafting?.recipeId);
      if (recipe) {
        inventory = { ...inventory, [recipe.output.item]: (inventory[recipe.output.item] ?? 0) + recipe.output.amount };
        craftedMessage = `Hoàn tất ${recipe.icon} ${recipe.name} · vật phẩm đã vào túi.`;
      }
      crafting = undefined;
      craftPulse += 1;
      this.messageAge = 0;
    }
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
    let crops = this.state.crops.map(plot => {
      const crop = CROPS.find(entry => entry.id === plot.cropId);
      const water = clamp(plot.water + (raining && this.hasBuilding('rain_collector') ? elapsed * 2.2 : -elapsed * 0.42));
      if (!crop || water <= 0 || (plot.stage === 2 && plot.stageProgress >= 1)) return { ...plot, water };
      let stage = plot.stage;
      let stageProgress = plot.stageProgress + elapsed / crop.stageSeconds;
      while (stageProgress >= 1 && stage < 2) { stage = (stage + 1) as 1 | 2; stageProgress -= 1; }
      return { ...plot, water, stage, stageProgress: Math.min(1, stageProgress) };
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
    let buildings = this.state.buildings;
    let storageInventory = this.state.storageInventory;
    let sharkRaid = { ...this.state.sharkRaid };
    let sharkMessage = '';
    if (this.state.phase === 'raft' || this.state.phase === 'challenge') {
      sharkRaid = { ...sharkRaid, countdown: Math.max(0, sharkRaid.countdown - elapsed) };
    }
    if ((this.state.phase === 'raft' || this.state.phase === 'challenge') && sharkRaid.countdown <= 0) {
      if (sharkRaid.phase === 'idle') {
        const candidates = buildings.filter(building => building.zone === 'raft' && SHARK_TARGET_TYPES.has(building.type)).sort((a, b) => a.id.localeCompare(b.id));
        const target = candidates.length ? candidates[sharkRaid.raidIndex % candidates.length] : undefined;
        sharkRaid = { ...sharkRaid, phase: 'warning', countdown: SHARK_WARNING_SECONDS, pulse: sharkRaid.pulse + 1, targetBuildingId: target?.id, lastLoss: '' };
        sharkMessage = 'CẢNH BÁO CÁ MẬP · còn 12 giây trước cú cắn! Trang bị Lao sinh tồn và phản công.';
      } else if (sharkRaid.phase === 'warning') {
        const candidates = buildings.filter(building => building.zone === 'raft' && SHARK_TARGET_TYPES.has(building.type)).sort((a, b) => a.id.localeCompare(b.id));
        const target = buildings.find(building => building.id === sharkRaid.targetBuildingId) ?? (candidates.length ? candidates[sharkRaid.raidIndex % candidates.length] : undefined);
        let lastLoss = 'Mép bè khởi đầu bị hư hại';
        if (target) {
          buildings = buildings.filter(building => building.id !== target.id);
          lastLoss = itemName(target.type);
          if (target.type === 'small_planter' || target.type === 'tree_planter') {
            const before = crops.length;
            crops = crops.filter(plot => Math.hypot(plot.x - target.x, plot.z - target.z) >= 3);
            if (crops.length < before) lastLoss += ' cùng cây trồng gắn trên đó';
          } else if (target.type === 'storage') {
            const storedId = Object.keys(storageInventory).filter(id => id !== 'island_key' && (storageInventory[id] ?? 0) > 0).sort()[0];
            if (storedId) {
              const amount = Math.max(1, Math.ceil(storageInventory[storedId] * 0.2));
              storageInventory = { ...storageInventory, [storedId]: Math.max(0, storageInventory[storedId] - amount) };
              lastLoss += ` và ${itemName(storedId)} x${amount}`;
            }
          }
        }
        sharkRaid = { phase: 'biting', countdown: 3, raidIndex: sharkRaid.raidIndex + 1, pulse: sharkRaid.pulse + 1, lastLoss };
        sharkMessage = `Cá mập đã cắn phá · mất ${lastLoss}.`;
      } else {
        sharkRaid = { phase: 'idle', countdown: nextSharkRaidSeconds(sharkRaid.raidIndex), raidIndex: sharkRaid.raidIndex, pulse: sharkRaid.pulse, lastLoss: sharkRaid.lastLoss };
      }
    }
    if (health <= 0) { this.handlePartyDefeat(); return; }
    const warning = sharkRaid.phase === 'warning' ? `CÁ MẬP SẮP CẮN · ${Math.ceil(sharkRaid.countdown)} GIÂY · trang bị Lao sinh tồn` : sharkRaid.phase === 'biting' ? `CÁ MẬP VỪA PHÁ BÈ · mất ${sharkRaid.lastLoss}` : thirst <= 22 ? 'KHÁT NƯỚC NGHIÊM TRỌNG · lọc hoặc uống nước ngay' : hunger <= 20 ? 'ĐÓI NGHIÊM TRỌNG · nướng cá hoặc ăn dừa' : temperature < 8 && wetness > 35 ? 'HẠ THÂN NHIỆT · vào mái trú và hong khô' : (weather === 'Bão nhiệt đới' || weather === 'Giông sét') && !defended ? 'BÃO ĐANG PHÁ BÈ · chế tạo Neo và Cột thu lôi' : stamina <= 12 ? 'KIỆT SỨC · dừng chạy để hồi phục' : '';
    this.publish({ day, minute: clock, weather, forecast, health, hunger, thirst, stamina, inventory, storageInventory, crafting, craftPulse, crops, buildings, sharkRaid, temperature, wetness, challengeRemaining, travelReady, warning, ...(sharkMessage ? { message: sharkMessage } : craftedMessage ? { message: craftedMessage } : {}), objectiveProgress: this.state.phase === 'challenge' ? (travelReady ? 'Đã vượt bão · hải trình tới đảo kế tiếp đã mở' : `Còn ${Math.ceil(challengeRemaining)} giây · neo, nước và thức ăn quyết định sống còn`) : this.state.objectiveProgress, threat: sharkRaid.phase === 'warning' || sharkRaid.phase === 'biting' ? 'CỰC CAO · cá mập đang áp sát bè' : weather === 'Bão nhiệt đới' || weather === 'Giông sét' ? (defended ? 'VỪA · căn cứ đã thả neo' : `CAO · thiên tai cấp ${Math.min(5, this.state.currentIsland + 2)}`) : weather === 'Mưa tuyết dị thường' ? 'CAO · lạnh sâu và mặt bè trơn' : 'THẤP · cá mập rạn san hô' });
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
  equipTool(item: string) { return this.dispatch({ type: 'equip', item }); }
  defendShark() { return this.dispatch({ type: 'defendShark' }); }
  travel() { return this.dispatch({ type: 'travel' }); }
  placeSelected(x = this.state.playerX, z = this.state.playerZ, rotation = 0) { return this.dispatch({ type: 'build', building: this.state.selectedBuild, x, z, rotation }); }
  addMarker(markerType: MarkerType, title: string, note = '', x = this.state.playerX, z = this.state.playerZ) { return this.dispatch({ type: 'marker', markerType, title, note, x, z }); }
  applyRemoteAction(action: unknown) { if (this.authority && this.isAction(action)) { const changed = this.apply(action); if (changed) this.save(false); return changed; } return false; }

  private dispatch(action: OceanAction) {
    if (!this.authority && this.sendAction) {
      this.sendAction(action);
      this.tell('Đã gửi yêu cầu tới chủ phòng…');
      return true;
    }
    const changed = this.apply(action);
    if (changed) this.save(false);
    return changed;
  }

  private apply(action: OceanAction) {
    if (action.type === 'gather') return this.applyGather(action.nodeId, action.item, action.amount);
    if (action.type === 'equip') {
      if (action.item.length > 50 || (this.state.inventory[action.item] ?? 0) < 1) { this.tell(`Không có ${itemName(action.item)} trong túi để trang bị.`); return false; }
      this.publish({ selectedTool: action.item });
      this.tell(`Đã trang bị ${ITEMS[action.item]?.icon ?? '🧰'} ${itemName(action.item)}.`);
      return true;
    }
    if (action.type === 'defendShark') {
      if (this.state.sharkRaid.phase !== 'warning') { this.tell('Chưa có cá mập trong tầm phản công.'); return false; }
      if (this.state.selectedTool !== 'spear' || (this.state.inventory.spear ?? 0) < 1) { this.tell('Phải trang bị Lao sinh tồn để đẩy lùi cá mập.'); return false; }
      this.publish({
        sharkRaid: { phase: 'repelled', countdown: 4, raidIndex: this.state.sharkRaid.raidIndex + 1, pulse: this.state.sharkRaid.pulse + 1, lastLoss: '' },
        warning: '',
        threat: 'VỪA · cá mập đã bị đẩy lùi',
      });
      this.tell('Phản công chính xác! Cá mập đã bị đẩy lùi trước khi cắn bè.');
      return true;
    }
    if (action.type === 'craft') {
      const recipe = RECIPES.find(candidate => candidate.id === action.recipeId);
      if (!recipe) return false;
      if (this.state.crafting) { this.tell('Bàn chế tạo đang bận. Hãy chờ món hiện tại hoàn tất.'); return false; }
      const missing = Object.entries(recipe.inputs).filter(([id, amount]) => (this.state.inventory[id] ?? 0) < amount);
      if (missing.length) { this.tell(`Còn thiếu: ${missing.map(([id, amount]) => `${itemName(id)} x${amount - (this.state.inventory[id] ?? 0)}`).join(', ')}.`); return false; }
      const inventory = { ...this.state.inventory };
      for (const [id, amount] of Object.entries(recipe.inputs)) inventory[id] -= amount;
      const startedAt = Date.now();
      const crafting: CraftJob = { id: crypto.randomUUID(), recipeId: recipe.id, startedAt, endsAt: startedAt + recipe.craftSeconds * 1000, duration: recipe.craftSeconds };
      this.publish({ inventory, crafting, craftPulse: this.state.craftPulse + 1 }); this.tell(`Đang chế tạo ${recipe.icon} ${recipe.name} · ${recipe.craftSeconds} giây.`); return true;
    }
    if (action.type === 'consume') {
      if ((this.state.inventory[action.item] ?? 0) < 1) { this.tell(`Không có ${itemName(action.item)} trong túi.`); return false; }
      const inventory = { ...this.state.inventory, [action.item]: this.state.inventory[action.item] - 1 };
      if (action.item === 'fresh_water') this.publish({ inventory, thirst: clamp(this.state.thirst + 42) });
      else if (action.item === 'cooked_fish') this.publish({ inventory, hunger: clamp(this.state.hunger + 38), health: clamp(this.state.health + 8) });
      else if (action.item === 'coconut') this.publish({ inventory, hunger: clamp(this.state.hunger + 12), thirst: clamp(this.state.thirst + 18) });
      else if (action.item === 'medicine') this.publish({ inventory, health: clamp(this.state.health + 45) });
      else if (action.item.startsWith('produce_') && ITEMS[action.item]?.category === 'food') this.publish({ inventory, hunger: clamp(this.state.hunger + 18), thirst: clamp(this.state.thirst + 8) });
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
      if ((this.state.inventory.shovel ?? 0) < 1 || this.state.selectedTool !== 'shovel') { this.tell('Cần có và trang bị Xẻng để gieo hạt.'); return false; }
      if (!this.hasBuilding(crop.size === 'small' ? 'small_planter' : 'tree_planter')) { this.tell(`Cần xây ${crop.size === 'small' ? 'Luống cây nhỏ' : 'Bồn cây lớn'} trước.`); return false; }
      const seed = `seed_${crop.id}`;
      if ((this.state.inventory[seed] ?? 0) < 1) { this.tell(`Chưa có hạt ${crop.name}. Hãy khám phá đảo và thùng hàng.`); return false; }
      const inventory = { ...this.state.inventory, [seed]: this.state.inventory[seed] - 1 };
      const plot: CropPlot = { id: crypto.randomUUID(), cropId: crop.id, x: action.x, z: action.z, stage: 0, stageProgress: 0, water: 35, harvestsLeft: crop.harvests };
      this.publish({ inventory, crops: [...this.state.crops, plot].slice(-30) }); this.tell(`Đã gieo ${crop.icon} ${crop.name}. Mỗi giai đoạn cần 30 giây và cây chỉ lớn khi còn nước.`); return true;
    }
    if (action.type === 'water') {
      const plot = this.state.crops.find(entry => entry.id === action.plotId); if (!plot) return false;
      if ((this.state.inventory.watering_can ?? 0) < 1 || this.state.selectedTool !== 'watering_can') { this.tell('Cần có và trang bị Xô tưới nước để tưới cây.'); return false; }
      if ((this.state.inventory.fresh_water ?? 0) < 1) { this.tell('Cần Nước sạch để tưới. Mưa và Máy hứng nước mưa có thể tưới tự động.'); return false; }
      this.publish({ inventory: { ...this.state.inventory, fresh_water: this.state.inventory.fresh_water - 1 }, crops: this.state.crops.map(entry => entry.id === plot.id ? { ...entry, water: 100 } : entry) }); this.tell('Đã tưới cây bằng nước sạch.'); return true;
    }
    if (action.type === 'harvest') {
      const plot = this.state.crops.find(entry => entry.id === action.plotId); const crop = plot && CROPS.find(entry => entry.id === plot.cropId);
      if (!plot || !crop || plot.stage < 2 || plot.stageProgress < 1) { this.tell('Cây chưa sẵn sàng thu hoạch. Cần hoàn tất cả ba giai đoạn.'); return false; }
      const produce = `produce_${crop.id}`; const inventory = { ...this.state.inventory, [produce]: (this.state.inventory[produce] ?? 0) + (crop.size === 'small' ? 3 : 2) };
      const seed = `seed_${crop.id}`; inventory[seed] = (inventory[seed] ?? 0) + 1;
      const crops = plot.harvestsLeft > 1 ? this.state.crops.map(entry => entry.id === plot.id ? { ...entry, stage: 1 as const, stageProgress: 0, water: Math.max(20, entry.water), harvestsLeft: entry.harvestsLeft - 1 } : entry) : this.state.crops.filter(entry => entry.id !== plot.id);
      this.publish({ inventory, crops }); this.tell(`Thu hoạch ${crop.icon} ${crop.produceName} và giữ lại 1 hạt giống.`); return true;
    }
    if (action.type === 'travel') return this.applyTravel();
    if (action.type === 'build') {
      if (!BUILDABLES.includes(action.building) || !finite(action.x) || !finite(action.z) || Math.abs(action.x) > 100 || Math.abs(action.z) > 100) return false;
      if ((this.state.inventory.hammer ?? 0) < 1 || this.state.selectedTool !== 'hammer') { this.tell('Cần trang bị Búa kiến trúc để đóng và lắp công trình.'); return false; }
      if ((this.state.inventory[action.building] ?? 0) < 1) { this.tell(`Hãy chế tạo ${itemName(action.building)} trước.`); return false; }
      if (this.state.buildings.some(piece => Math.hypot(piece.x - action.x, piece.z - action.z) < 1.3)) { this.tell('Vị trí này đang bị một công trình khác chiếm chỗ.'); return false; }
      const inventory = { ...this.state.inventory, [action.building]: this.state.inventory[action.building] - 1 };
      const record: BuildingRecord = { id: crypto.randomUUID(), type: action.building, x: Math.round(action.x * 2) / 2, z: Math.round(action.z * 2) / 2, rotation: action.rotation, health: 100, zone: zoneAtPlacement(this.state) };
      const buildings = [...this.state.buildings, record].slice(-120);
      const islandLevel = this.developmentLevel(buildings.filter(building => building.zone === record.zone));
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
      this.tell(`Thuyền đã cập ${island.name}. Mở hải đồ, theo dấu nguy hiểm tới đấu trường và chuẩn bị kỹ năng Q để đối đầu quái vật.`); return true;
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
    const inventory = lose(this.state.inventory);
    this.publish({ inventory, selectedTool: migratedSelectedTool(inventory, this.state.selectedTool), storageInventory: lose(this.state.storageInventory), health: 55, hunger: 45, thirst: 45, phase: 'raft', islandName: 'Bè hồi sinh', objective: this.state.currentIsland ? `Chuẩn bị quay lại ${ISLANDS[this.state.currentIsland].name}` : ISLANDS[0].objective, objectiveProgress: 'Mất 25% vật phẩm thường trong túi và kho · chìa khóa được bảo toàn', travelReady: this.state.currentIsland > 0 || progress.ready, transitionId: this.state.transitionId + 1, spawnX: 0, spawnZ: 81 });
    this.tell('Cả hai đã gục. Hồi sinh trên bè; 25% vật phẩm thường trong túi và kho đã trôi mất.'); return true;
  }

  selectBuild(id: string) { if (BUILDABLES.includes(id)) this.publish({ selectedBuild: id, ...((this.state.inventory.hammer ?? 0) > 0 ? { selectedTool: 'hammer' } : {}) }); }
  setWaypoint(id: string) { if (this.state.markers.some(marker => marker.id === id)) this.publish({ waypointId: id }); }
  hasBuilding(type: string) { return this.state.buildings.some(building => building.type === type); }
  private developmentLevel(buildings: BuildingRecord[]) {
    const score = buildings.reduce((total, building) => total + ({ foundation: 1, wall: 1, door: 1, roof: 2, storage: 2, purifier: 3, grill: 2, beacon: 5, anchor: 4, lightning_rod: 4 }[building.type] ?? 1), 0);
    return score >= 28 ? 4 : score >= 18 ? 3 : score >= 10 ? 2 : score >= 4 ? 1 : 0;
  }

  save(notify = true) {
    const key = this.saveSlot === 'solo' ? `${SAVE_PREFIX}.solo` : `${SAVE_PREFIX}.room.${this.saveSlot}`;
    try { localStorage.setItem(key, JSON.stringify({ ...this.state, nearby: undefined, onlineRole: 'offline', savedAt: Date.now() })); if (notify) this.tell(`Đã lưu hành trình${this.saveSlot === 'solo' ? '' : ` phòng ${this.saveSlot}`} và mọi vật phẩm.`); return true; }
    catch { if (notify) this.tell('Trình duyệt đang chặn lưu cục bộ.'); return false; }
  }
  private load() {
    try {
      const key = this.saveSlot === 'solo' ? `${SAVE_PREFIX}.solo` : `${SAVE_PREFIX}.room.${this.saveSlot}`;
      const legacy = this.saveSlot === 'solo' ? localStorage.getItem('echoes.oceanbound.save.v3') : null;
      const raw = localStorage.getItem(key) ?? legacy; if (!raw) return;
      const parsed = JSON.parse(raw) as Omit<Partial<OceanState>, 'version'> & { version?: number };
      if (![1, 2, 3, 4].includes(parsed.version ?? 0) || !parsed.inventory || !Array.isArray(parsed.buildings) || !Array.isArray(parsed.markers)) return;
      const crops = (parsed.crops ?? []).map(value => {
        const old = value as CropPlot & { growth?: number };
        if (typeof old.stage === 'number' && typeof old.stageProgress === 'number') return old;
        const total = Math.max(0, Math.min(0.999, old.growth ?? 0)) * 3;
        const stage = Math.min(2, Math.floor(total)) as 0 | 1 | 2;
        return { id: old.id, cropId: old.cropId, x: old.x, z: old.z, stage, stageProgress: stage === 2 ? Math.min(1, total - 2) : total - stage, water: old.water, harvestsLeft: old.harvestsLeft };
      });
      const phase = parsed.phase ?? 'raft';
      const currentIsland = finite(parsed.currentIsland) ? Math.max(0, Math.min(3, Math.floor(parsed.currentIsland))) : 0;
      const buildings = parsed.buildings.map(building => ({ ...building, zone: inferBuildingZone(building, currentIsland, phase) }));
      this.state = { ...startState(), ...parsed, version: 4, currentIsland, storageInventory: parsed.storageInventory ?? {}, crafting: parsed.crafting, craftPulse: parsed.craftPulse ?? 0, crops, buildings, selectedTool: migratedSelectedTool(parsed.inventory, parsed.selectedTool), sharkRaid: normalizeSharkRaid(parsed.sharkRaid), nearby: undefined, onlineRole: 'offline', revision: 0 };
    } catch { /* Corrupt saves fall back to a safe new world. */ }
  }

  exportNetwork() {
    const { nearby: _nearby, onlineRole: _role, ...shared } = this.state;
    return shared;
  }
  importNetwork(value: unknown) {
    if (this.authority || typeof value !== 'object' || value === null) return false;
    const incoming = value as Partial<OceanState>;
    if (incoming.version !== 4 || !incoming.inventory || !incoming.storageInventory || !Array.isArray(incoming.crops) || !Array.isArray(incoming.buildings) || !Array.isArray(incoming.markers) || !finite(incoming.health) || !finite(incoming.minute)) return false;
    const incomingIsland = finite(incoming.currentIsland) ? Math.max(0, Math.min(3, Math.floor(incoming.currentIsland))) : this.state.currentIsland;
    const incomingPhase = incoming.phase ?? this.state.phase;
    const buildings = incoming.buildings.map(building => ({ ...building, zone: inferBuildingZone(building, incomingIsland, incomingPhase) }));
    // JSON transports omit undefined keys, so explicitly clear a finished craft job.
    this.state = { ...this.state, ...incoming, currentIsland: incomingIsland, buildings, crafting: incoming.crafting, selectedTool: migratedSelectedTool(incoming.inventory, incoming.selectedTool), sharkRaid: normalizeSharkRaid(incoming.sharkRaid, this.state.sharkRaid), onlineRole: 'guest', nearby: this.state.nearby, revision: this.state.revision + 1 };
    for (const listener of this.listeners) listener();
    return true;
  }

  private isAction(value: unknown): value is OceanAction {
    if (typeof value !== 'object' || value === null || typeof (value as { type?: unknown }).type !== 'string') return false;
    const action = value as Record<string, unknown>;
    if (action.type === 'gather') return typeof action.nodeId === 'string' && typeof action.item === 'string' && Number.isInteger(action.amount) && (action.amount as number) > 0 && (action.amount as number) <= 5;
    if (action.type === 'craft') return typeof action.recipeId === 'string' && action.recipeId.length < 50;
    if (action.type === 'consume') return typeof action.item === 'string' && action.item.length < 50;
    if (action.type === 'equip') return typeof action.item === 'string' && action.item.length < 50;
    if (action.type === 'defendShark') return true;
    if (action.type === 'build') return typeof action.building === 'string' && finite(action.x) && finite(action.z) && finite(action.rotation);
    if (action.type === 'transfer') return typeof action.item === 'string' && ['store', 'take'].includes(String(action.direction)) && Number.isInteger(action.amount) && (action.amount as number) > 0 && (action.amount as number) <= 20;
    if (action.type === 'plant') return typeof action.cropId === 'string' && finite(action.x) && finite(action.z);
    if (action.type === 'water' || action.type === 'harvest') return typeof action.plotId === 'string' && action.plotId.length < 80;
    if (action.type === 'travel') return true;
    return action.type === 'marker' && ['custom', 'island', 'danger', 'resource', 'base', 'wreck'].includes(String(action.markerType)) && typeof action.title === 'string' && typeof action.note === 'string' && finite(action.x) && finite(action.z);
  }
}
