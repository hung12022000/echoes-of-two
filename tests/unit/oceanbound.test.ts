import { beforeEach, describe, expect, it } from 'vitest';
import { OceanSession, type OceanAction } from '../../src/game/oceanbound/session';

describe('Oceanbound survival and crafting', () => {
  beforeEach(() => localStorage.clear());

  it('resolves the raw-resource crafting chain and refuses missing materials', () => {
    const game = new OceanSession();
    expect(game.craft('rope')).toBe(true);
    expect(game.view.inventory.rope).toBe(1);
    expect(game.view.inventory.fiber).toBe(3);
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
});
