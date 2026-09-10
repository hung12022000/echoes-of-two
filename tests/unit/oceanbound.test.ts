import { beforeEach, describe, expect, it } from 'vitest';
import { OceanSession, type OceanAction } from '../../src/game/oceanbound/session';

describe('Oceanbound survival and crafting', () => {
  beforeEach(() => localStorage.clear());

  it('resolves the raw-resource crafting chain and refuses missing materials', () => {
    const game = new OceanSession();
    const startingFiber = game.view.inventory.fiber;
    expect(game.craft('rope')).toBe(true);
    expect(game.view.inventory.rope).toBe(1);
    expect(game.view.inventory.fiber).toBe(startingFiber - 3);
    expect(game.craft('plank')).toBe(true);
    expect(game.view.inventory.plank).toBe(1);
    expect(game.craft('hook')).toBe(false);
    expect(game.view.message).toContain('Còn thiếu');
  });

  it('gives a collection bonus after crafting a hook', () => {
    const game = new OceanSession();
    game.gather('scrap-1', 'scrap', 2);
    game.gather('fiber-1', 'fiber', 3);
    game.craft('rope');
    game.craft('rope');
    game.craft('plank');
    expect(game.craft('hook')).toBe(true);
    const before = game.view.inventory.driftwood;
    game.gather('wood-1', 'driftwood', 2);
    expect(game.view.inventory.driftwood - before).toBe(3);
  });

  it('places persistent buildings on a grid and develops the island', () => {
    const game = new OceanSession();
    game.gather('wood', 'driftwood', 5);
    game.gather('fiber', 'fiber', 5);
    game.craft('plank'); game.craft('plank'); game.craft('rope');
    game.craft('foundation');
    game.selectBuild('foundation');
    expect(game.placeSelected(3.24, 4.26, 0)).toBe(true);
    expect(game.view.buildings[0]).toMatchObject({ type: 'foundation', x: 3, z: 4.5, health: 100 });
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
    for (let i = 0; i < 4; i++) game.craft('plank');
    game.craft('rope'); game.craft('rope'); game.craft('storage'); game.selectBuild('storage');
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
    for (let i = 0; i < 4; i++) game.craft('plank');
    game.craft('charcoal');
    for (let i = 0; i < 4; i++) game.craft('rope');
    game.craft('sailcloth'); game.craft('foundation'); game.craft('foundation'); game.craft('purifier'); game.craft('sail');
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
    const game = new OceanSession();
    game.craft('plank'); game.craft('plank'); game.craft('plank'); game.craft('small_planter');
    game.selectBuild('small_planter'); expect(game.placeSelected(6, 48)).toBe(true);
    expect(game.plant('tomato', 6, 48)).toBe(true);
    expect(game.view.crops[0].growth).toBeGreaterThan(0);
    game.tick(100, false);
    expect(game.view.crops[0].growth).toBe(1);
    expect(game.harvest(game.view.crops[0].id)).toBe(true);
    expect(game.view.inventory.produce_tomato).toBe(3);
  });
});
