import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cropOverallProgress, OceanSession, SHARK_FIRST_RAID_SECONDS, SHARK_WARNING_SECONDS, type OceanAction, type OceanState } from '../../src/game/oceanbound/session';
import { CROPS, ITEMS, RECIPES } from '../../src/game/oceanbound/catalog';

let now = 1_700_000_000_000;
function craftAndFinish(game: OceanSession, recipeId: string) {
  expect(game.craft(recipeId)).toBe(true);
  now = game.view.crafting!.endsAt;
  game.tick(.3, false);
}

function savedSession(mutator: (saved: OceanState) => void) {
  const initial = new OceanSession();
  initial.save(false);
  const key = 'echoes.oceanbound.save.v4.solo';
  const saved = JSON.parse(localStorage.getItem(key)!) as OceanState;
  mutator(saved);
  localStorage.setItem(key, JSON.stringify(saved));
  return new OceanSession();
}

describe('Oceanbound survival and crafting', () => {
  beforeEach(() => { localStorage.clear(); now = 1_700_000_000_000; vi.spyOn(Date, 'now').mockImplementation(() => now); });
  afterEach(() => vi.restoreAllMocks());

  it('resolves the raw-resource crafting chain and refuses missing materials', () => {
    const game = new OceanSession();
    const startingFiber = game.view.inventory.fiber;
    craftAndFinish(game, 'rope');
    expect(game.view.inventory.rope).toBe(1);
    expect(game.view.inventory.fiber).toBe(startingFiber - 3);
    craftAndFinish(game, 'plank');
    expect(game.view.inventory.plank).toBe(1);
    expect(game.craft('hook')).toBe(false);
    expect(game.view.message).toContain('Còn thiếu');
  });

  it('gives a collection bonus after crafting a hook', () => {
    const game = new OceanSession();
    game.gather('scrap-1', 'scrap', 2);
    game.gather('fiber-1', 'fiber', 3);
    craftAndFinish(game, 'rope');
    craftAndFinish(game, 'rope');
    craftAndFinish(game, 'plank');
    craftAndFinish(game, 'hook');
    const before = game.view.inventory.driftwood;
    game.gather('wood-1', 'driftwood', 2);
    expect(game.view.inventory.driftwood - before).toBe(3);
  });

  it('places persistent buildings on a grid and develops the island', () => {
    const game = new OceanSession();
    game.gather('wood', 'driftwood', 5);
    game.gather('fiber', 'fiber', 5);
    craftAndFinish(game, 'plank'); craftAndFinish(game, 'plank'); craftAndFinish(game, 'rope');
    craftAndFinish(game, 'foundation');
    game.selectBuild('foundation');
    expect(game.placeSelected(3.24, 4.26, 0)).toBe(true);
    expect(game.view.buildings[0]).toMatchObject({ type: 'foundation', x: 3, z: 4.5, health: 100, zone: 'raft' });
    game.save(false);
    const loaded = new OceanSession();
    expect(loaded.view.buildings).toHaveLength(1);
    expect(loaded.view.buildings[0].type).toBe('foundation');
  });

  it('routes guest mutations to the host instead of changing shared state locally', () => {
    const sent: OceanAction[] = [];
    const guest = new OceanSession();
    guest.configureNetwork('guest', action => sent.push(action));
    const before = guest.view.inventory.fiber;
    expect(guest.craft('rope')).toBe(true);
    expect(guest.view.inventory.fiber).toBe(before);
    expect(sent).toEqual([{ type: 'craft', recipeId: 'rope' }]);
  });

  it('opens shared storage only after building a chest and transfers items safely', () => {
    const game = new OceanSession();
    expect(game.transfer('plastic', 'store')).toBe(false);
    for (let i = 0; i < 4; i++) craftAndFinish(game, 'plank');
    craftAndFinish(game, 'rope'); craftAndFinish(game, 'rope'); craftAndFinish(game, 'storage'); game.selectBuild('storage');
    expect(game.placeSelected(8, 50)).toBe(true);
    const before = game.view.inventory.plastic;
    expect(game.transfer('plastic', 'store', 2)).toBe(true);
    expect(game.view.inventory.plastic).toBe(before - 2);
    expect(game.view.storageInventory.plastic).toBe(2);
    expect(game.transfer('plastic', 'take')).toBe(true);
    expect(game.view.storageInventory.plastic).toBe(1);
  });

  it('turns starter-raft crafting into a playable voyage to island one', () => {
    const game = new OceanSession();
    game.gather('raft-wood', 'driftwood', 2); game.gather('raft-fiber', 'fiber', 2);
    for (let i = 0; i < 4; i++) craftAndFinish(game, 'plank');
    craftAndFinish(game, 'charcoal');
    for (let i = 0; i < 4; i++) craftAndFinish(game, 'rope');
    craftAndFinish(game, 'sailcloth'); craftAndFinish(game, 'foundation'); craftAndFinish(game, 'foundation'); craftAndFinish(game, 'purifier'); craftAndFinish(game, 'sail');
    for (const [id, x] of [['foundation', 0], ['foundation', 4], ['purifier', 8], ['sail', 12]] as const) { game.selectBuild(id); expect(game.placeSelected(x, 50)).toBe(true); }
    expect(game.view.travelReady).toBe(true);
    expect(game.travel()).toBe(true);
    expect(game.view).toMatchObject({ currentIsland: 1, phase: 'island', islandName: 'Đảo Rừng Mưa' });
  });

  it('consumes a rescue kit and applies the co-op wipe penalty while preserving progress', () => {
    const game = new OceanSession();
    expect(game.useRescueKit()).toBe(true);
    expect(game.view.inventory.rescue_kit).toBe(0);
    const plastic = game.view.inventory.plastic;
    expect(game.handlePartyDefeat()).toBe(true);
    expect(game.view.inventory.plastic).toBe(Math.floor(plastic * 0.75));
    expect(game.view.phase).toBe('raft');
    expect(game.view.transitionId).toBe(1);
  });

  it('grows and harvests one of the fifteen crops through a built planter', () => {
    const game = savedSession(saved => { saved.inventory.shovel = 1; saved.inventory.watering_can = 1; });
    craftAndFinish(game, 'plank'); craftAndFinish(game, 'plank'); craftAndFinish(game, 'plank'); craftAndFinish(game, 'small_planter');
    game.selectBuild('small_planter'); expect(game.placeSelected(6, 48)).toBe(true);
    expect(game.equipTool('shovel')).toBe(true);
    expect(game.plant('tomato', 6, 48)).toBe(true);
    expect(game.view.crops[0]).toMatchObject({ stage: 0, stageProgress: 0 });
    game.gather('test-water', 'fresh_water', 5);
    expect(game.equipTool('watering_can')).toBe(true);
    for (let stage = 0; stage < 3; stage++) { game.waterCrop(game.view.crops[0].id); game.tick(30, false); }
    expect(game.view.crops[0]).toMatchObject({ stage: 2, stageProgress: 1 });
    expect(cropOverallProgress(game.view.crops[0])).toBe(1);
    expect(game.harvest(game.view.crops[0].id)).toBe(true);
    expect(game.view.inventory.produce_tomato).toBe(3);
    expect(game.view.inventory.seed_tomato).toBe(1);
  });

  it('keeps crafting timed, resumable and completes into inventory', () => {
    const game = new OceanSession();
    const before = game.view.inventory.rope ?? 0;
    expect(game.craft('rope')).toBe(true);
    expect(game.view.inventory.rope ?? 0).toBe(before);
    expect(game.view.crafting?.duration).toBeGreaterThanOrEqual(5);
    game.save(false);
    const resumed = new OceanSession();
    expect(resumed.view.crafting?.recipeId).toBe('rope');
    now = resumed.view.crafting!.endsAt;
    resumed.tick(.3, false);
    expect(resumed.view.inventory.rope).toBe(before + 1);
  });

  it('clears a completed craft job when the host snapshot omits undefined JSON fields', () => {
    const host = new OceanSession();
    const guest = new OceanSession(); guest.configureNetwork('guest');
    expect(host.craft('rope')).toBe(true);
    expect(guest.importNetwork(host.exportNetwork())).toBe(true);
    expect(guest.view.crafting?.recipeId).toBe('rope');
    now = host.view.crafting!.endsAt; host.tick(.3, false);
    const transported = JSON.parse(JSON.stringify(host.exportNetwork()));
    expect('crafting' in transported).toBe(false);
    expect(guest.importNetwork(transported)).toBe(true);
    expect(guest.view.crafting).toBeUndefined();
  });

  it('uses an isolated persistent save slot for a room code', () => {
    const game = new OceanSession();
    game.useSaveSlot('ABC234');
    game.gather('room-wood', 'driftwood', 2);
    game.save(false);
    const restored = new OceanSession();
    restored.useSaveSlot('ABC234');
    expect(restored.view.inventory.driftwood).toBe(game.view.inventory.driftwood);
    expect(restored.activeSaveSlot).toBe('ABC234');
  });

  it('keeps every recipe connected, timed and all crops on three 30-second stages', () => {
    expect(CROPS).toHaveLength(15);
    expect(CROPS.filter(crop => crop.size === 'small')).toHaveLength(5);
    expect(CROPS.filter(crop => crop.size === 'large')).toHaveLength(10);
    expect(CROPS.every(crop => crop.stageSeconds === 30 && ITEMS[`seed_${crop.id}`] && ITEMS[`produce_${crop.id}`])).toBe(true);
    expect(RECIPES.every(recipe => recipe.craftSeconds >= 5 && recipe.craftSeconds <= 10 && ITEMS[recipe.output.item] && Object.keys(recipe.inputs).every(id => ITEMS[id]))).toBe(true);
    expect(RECIPES.find(recipe => recipe.id === 'navigation_compass')?.inputs).toMatchObject({ produce_rose: 10, produce_lotus: 5, produce_coconut_tree: 3 });
  });

  it('starts with hook and hammer, equips tools authoritatively, and requires farming tools', () => {
    const game = new OceanSession();
    expect(game.view.inventory).toMatchObject({ hook: 1, hammer: 1 });
    expect(game.view.inventory.shovel ?? 0).toBe(0);
    expect(game.view.inventory.watering_can ?? 0).toBe(0);
    expect(game.view.selectedTool).toBe('hook');
    expect(game.equipTool('hammer')).toBe(true);
    expect(game.view.selectedTool).toBe('hammer');
    expect(game.equipTool('shovel')).toBe(false);
    const sent: OceanAction[] = [];
    const guest = new OceanSession(); guest.configureNetwork('guest', action => sent.push(action));
    const guestToolBeforeRequest = guest.view.selectedTool;
    expect(guest.equipTool('hammer')).toBe(true);
    expect(guest.view.selectedTool).toBe(guestToolBeforeRequest);
    expect(sent).toEqual([{ type: 'equip', item: 'hammer' }]);

    const equipped = savedSession(saved => {
      saved.inventory.shovel = 1;
      saved.inventory.watering_can = 1;
      saved.buildings = [{ id: 'planter', type: 'small_planter', x: 0, z: 0, rotation: 0, health: 100 }];
    });
    expect(equipped.plant('tomato', 0, 0)).toBe(false);
    expect(equipped.equipTool('shovel')).toBe(true);
    expect(equipped.plant('tomato', 0, 0)).toBe(true);
    expect(equipped.waterCrop(equipped.view.crops[0].id)).toBe(false);
    expect(equipped.equipTool('watering_can')).toBe(true);
    expect(equipped.waterCrop(equipped.view.crops[0].id)).toBe(false);
    equipped.gather('water', 'fresh_water', 1);
    expect(equipped.waterCrop(equipped.view.crops[0].id)).toBe(true);
  });

  it('raises a deterministic shark warning before any raft damage', () => {
    const game = savedSession(saved => {
      saved.buildings = [{ id: 'raft-foundation', type: 'foundation', x: 0, z: 81, rotation: 0, health: 100 }];
    });
    game.tick(SHARK_FIRST_RAID_SECONDS, false);
    expect(game.view.sharkRaid).toMatchObject({ phase: 'warning', countdown: SHARK_WARNING_SECONDS, raidIndex: 0, pulse: 1, targetBuildingId: 'raft-foundation' });
    expect(game.view.buildings).toHaveLength(1);
    expect(game.view.warning).toContain('CÁ MẬP SẮP CẮN');
  });

  it('removes one deterministic raft module and a safe fraction of attached storage on bite', () => {
    const game = savedSession(saved => {
      saved.buildings = [
        { id: 'a-storage', type: 'storage', x: 0, z: 81, rotation: 0, health: 100 },
        { id: 'b-foundation', type: 'foundation', x: 3, z: 81, rotation: 0, health: 100 },
      ];
      saved.storageInventory = { plastic: 10, island_key: 2 };
    });
    game.tick(SHARK_FIRST_RAID_SECONDS, false);
    game.tick(SHARK_WARNING_SECONDS, false);
    expect(game.view.sharkRaid).toMatchObject({ phase: 'biting', raidIndex: 1, pulse: 2 });
    expect(game.view.buildings.map(building => building.id)).toEqual(['b-foundation']);
    expect(game.view.storageInventory).toMatchObject({ plastic: 8, island_key: 2 });
    expect(game.view.sharkRaid.lastLoss).toContain('Rương');
  });

  it('cancels shark damage with an equipped spear and persists/synchronizes raid and tool state', () => {
    const host = savedSession(saved => {
      saved.inventory.spear = 1;
      saved.buildings = [{ id: 'safe-foundation', type: 'foundation', x: 0, z: 81, rotation: 0, health: 100 }];
    });
    expect(host.equipTool('spear')).toBe(true);
    host.tick(SHARK_FIRST_RAID_SECONDS, false);
    expect(host.defendShark()).toBe(true);
    expect(host.view.sharkRaid.phase).toBe('repelled');
    expect(host.view.buildings).toHaveLength(1);
    host.save(false);

    const restored = new OceanSession();
    expect(restored.view.selectedTool).toBe('spear');
    expect(restored.view.sharkRaid).toEqual(host.view.sharkRaid);
    const guest = new OceanSession(); guest.configureNetwork('guest');
    expect(guest.importNetwork(JSON.parse(JSON.stringify(host.exportNetwork())))).toBe(true);
    expect(guest.view.selectedTool).toBe('spear');
    expect(guest.view.sharkRaid).toEqual(host.view.sharkRaid);
    expect(guest.view.buildings).toHaveLength(1);
  });

  it('migrates an older v4 save to safe tool and shark defaults', () => {
    const game = new OceanSession(); game.save(false);
    const key = 'echoes.oceanbound.save.v4.solo';
    const saved = JSON.parse(localStorage.getItem(key)!);
    delete saved.selectedTool;
    delete saved.sharkRaid;
    localStorage.setItem(key, JSON.stringify(saved));
    const migrated = new OceanSession();
    expect(migrated.view.selectedTool).toBe('hook');
    expect(migrated.view.sharkRaid).toMatchObject({ phase: 'idle', countdown: SHARK_FIRST_RAID_SECONDS, raidIndex: 0, pulse: 0 });
  });

  it('migrates building zones from coordinates and never reuses a previous island for current progression', () => {
    const migrated = savedSession(saved => {
      saved.currentIsland = 2;
      saved.phase = 'island';
      saved.buildings = [
        { id: 'old-raft', type: 'foundation', x: 0, z: 81, rotation: 0, health: 100 },
        { id: 'old-island-one', type: 'storage', x: -36, z: 35, rotation: 0, health: 100 },
        { id: 'old-island-two', type: 'beacon', x: 36, z: 22, rotation: 0, health: 100 },
      ];
    });
    expect(migrated.view.buildings.map(building => building.zone)).toEqual(['raft', 1, 2]);

    const wrongIsland = savedSession(saved => {
      saved.currentIsland = 2;
      saved.phase = 'island';
      saved.bossDefeated = false;
      saved.travelReady = false;
      saved.completedIslands = [];
      saved.buildings = ['beacon', 'anchor', 'research_table'].map((type, index) => ({ id: `island-one-${type}`, type, x: -36 + index * 2, z: 35, rotation: 0, health: 100, zone: 1 }));
    });
    expect(wrongIsland.recordBossVictory()).toBe(true);
    expect(wrongIsland.view.travelReady).toBe(false);
    expect(wrongIsland.view.objectiveProgress).toContain('0/1');

    const currentIsland = savedSession(saved => {
      saved.currentIsland = 2;
      saved.phase = 'island';
      saved.bossDefeated = false;
      saved.travelReady = false;
      saved.completedIslands = [];
      saved.buildings = ['beacon', 'anchor', 'research_table'].map((type, index) => ({ id: `island-two-${type}`, type, x: 36 + index * 2, z: 22, rotation: 0, health: 100, zone: 2 }));
    });
    expect(currentIsland.recordBossVictory()).toBe(true);
    expect(currentIsland.view.travelReady).toBe(true);
  });
});
