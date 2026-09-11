import { describe, expect, it } from 'vitest';
import { animatedTerrainHeight, constrainWalkableMotion, isWalkableSurface, SEA_LEVEL, starterRaftFrame } from '../../src/game/world/terrain';
import type { BuildingRecord } from '../../src/game/oceanbound/session';

const foundation = (x: number, z: number, rotation = 0, zone: BuildingRecord['zone'] = 'raft'): BuildingRecord => ({
  id: `foundation-${x}-${z}`,
  type: 'foundation',
  x,
  z,
  rotation,
  health: 100,
  zone,
});

describe('starter raft buoyancy frame', () => {
  it('uses one deck height for raft grounding and camera', () => {
    for (const severe of [false, true]) for (const time of [0, 1.25, 9.8, 31]) {
      const frame = starterRaftFrame(time, severe);
      expect(animatedTerrainHeight(0, 81, time, severe)).toBeCloseTo(frame.deckY, 8);
      expect(frame.deckY - frame.rootY).toBeCloseTo(.17, 8);
    }
  });

  it('keeps reduced-motion raft stable and leaves island terrain independent', () => {
    expect(starterRaftFrame(30, true, true)).toEqual(starterRaftFrame(0, true, true));
    expect(animatedTerrainHeight(12, 24, 2, false)).toBe(animatedTerrainHeight(12, 24, 90, true));
  });

  it('allows only the starter deck and living raft foundations at sea', () => {
    const buildings = [foundation(3.5, 81), foundation(8, 81, 0, 1), { ...foundation(0, 86), health: 0 }];
    expect(isWalkableSurface(0, 81, 'raft', buildings)).toBe(true);
    expect(isWalkableSurface(3.5, 81, 'raft', buildings)).toBe(true);
    expect(isWalkableSurface(8, 81, 'raft', buildings)).toBe(false);
    expect(isWalkableSurface(0, 86, 'raft', buildings)).toBe(false);
    expect(isWalkableSurface(0, 77, 'raft', buildings)).toBe(false);
  });

  it('respects rotated foundation bounds and shares raft buoyancy on extensions', () => {
    const buildings = [foundation(3, 81, Math.PI / 4)];
    expect(isWalkableSurface(3, 81, 'raft', buildings)).toBe(true);
    expect(isWalkableSurface(5.3, 83.3, 'raft', buildings)).toBe(false);
    expect(animatedTerrainHeight(3, 81, 4.2, true, false, 'raft', buildings))
      .toBeCloseTo(starterRaftFrame(4.2, true).deckY, 8);
  });

  it('keeps island movement above sea level and preserves the QA arena', () => {
    expect(isWalkableSurface(-36, 35, 'island')).toBe(true);
    expect(isWalkableSurface(0, 81, 'island')).toBe(false);
    expect(isWalkableSurface(0, 3, 'arena')).toBe(true);
    expect(isWalkableSurface(20, 3, 'arena')).toBe(false);
    expect(animatedTerrainHeight(-36, 35, 2, false)).toBeGreaterThanOrEqual(SEA_LEVEL);
  });

  it('slides along a deck edge and bisects diagonal movement at the boundary', () => {
    const slide = constrainWalkableMotion({ x: 1.9, z: 81 }, { x: 2.3, z: 81.5 }, 'raft');
    expect(slide.x).toBeCloseTo(1.9);
    expect(slide.z).toBeCloseTo(81.5);
    expect(slide.blockedX).toBe(true);
    expect(slide.blockedZ).toBe(false);

    const diagonal = constrainWalkableMotion({ x: 1.8, z: 82.6 }, { x: 2.5, z: 83.3 }, 'raft');
    expect(isWalkableSurface(diagonal.x, diagonal.z, 'raft')).toBe(true);
    expect(diagonal.x).toBeGreaterThan(1.8);
    expect(diagonal.x).toBeLessThan(2.5);
    expect(diagonal.blockedX).toBe(true);
    expect(diagonal.blockedZ).toBe(true);
  });
});
