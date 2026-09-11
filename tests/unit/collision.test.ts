import { describe, expect, it } from 'vitest';
import { isBlockedByBuildings } from '../../src/game/world/collision';
import type { BuildingRecord } from '../../src/game/oceanbound/session';

const at = (type: string, rotation = 0): BuildingRecord => ({ id: type, type, x: 2, z: 3, rotation, health: 100 });

describe('building collision', () => {
  it('blocks walls and solid devices but permits floors, roofs and door openings', () => {
    expect(isBlockedByBuildings(2, 3, [at('wall')])).toBe(true);
    expect(isBlockedByBuildings(2, 3, [at('storage')])).toBe(true);
    expect(isBlockedByBuildings(2, 3, [at('foundation')])).toBe(false);
    expect(isBlockedByBuildings(2, 3, [at('roof')])).toBe(false);
    expect(isBlockedByBuildings(2, 3, [at('door')])).toBe(false);
    expect(isBlockedByBuildings(3.2, 3, [at('door')])).toBe(true);
  });

  it('respects structure rotation and never blocks distant positions', () => {
    expect(isBlockedByBuildings(2, 4.7, [at('wall', Math.PI / 2)])).toBe(true);
    expect(isBlockedByBuildings(20, 30, [at('watchtower')])).toBe(false);
  });
});
