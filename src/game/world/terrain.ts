import type { BuildingRecord } from '../oceanbound/session';

// Natural heightfield plus a collision-only raft deck outside the coastline.
export const STARTER_RAFT_Z = 81;
export const SEA_LEVEL = -2.1;
export type WalkableArea = 'raft' | 'island' | 'arena';
export interface PlanarPoint { x: number; z: number }
export interface ConstrainedMotion extends PlanarPoint { blockedX: boolean; blockedZ: boolean }

const ACTOR_EDGE_INSET = .18;
const STARTER_RAFT_HALF_WIDTH = 2.275;
const STARTER_RAFT_HALF_DEPTH = 2.25;
const FOUNDATION_HALF_SIZE = 1.9;

export function isOnStarterRaft(x: number, z: number) {
  return Math.abs(x) <= STARTER_RAFT_HALF_WIDTH && Math.abs(z - STARTER_RAFT_Z) <= STARTER_RAFT_HALF_DEPTH;
}

function isOnRaftFoundation(x: number, z: number, building: BuildingRecord) {
  if (building.type !== 'foundation' || building.zone !== 'raft' || building.health <= 0) return false;
  const dx = x - building.x, dz = z - building.z;
  const cosine = Math.cos(-building.rotation), sine = Math.sin(-building.rotation);
  const localX = cosine * dx - sine * dz;
  const localZ = sine * dx + cosine * dz;
  const extent = FOUNDATION_HALF_SIZE - ACTOR_EDGE_INSET;
  return Math.abs(localX) <= extent && Math.abs(localZ) <= extent;
}

/** True only where an actor's centre has solid, campaign-valid ground beneath it. */
export function isWalkableSurface(x: number, z: number, area: WalkableArea, buildings: readonly BuildingRecord[] = []) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  if (area === 'raft') {
    const onStarter = Math.abs(x) <= STARTER_RAFT_HALF_WIDTH - ACTOR_EDGE_INSET
      && Math.abs(z - STARTER_RAFT_Z) <= STARTER_RAFT_HALF_DEPTH - ACTOR_EDGE_INSET;
    return onStarter || buildings.some(building => isOnRaftFoundation(x, z, building));
  }
  if (area === 'arena') return Math.hypot(x, z - 3) <= 15;
  return naturalTerrainHeight(x, z) >= SEA_LEVEL + .08;
}

/**
 * Constrains one planar movement step and preserves legal tangential movement.
 * Axis candidates provide a natural slide; bisection finds a stable shoreline/deck edge.
 */
export function constrainWalkableMotion(from: PlanarPoint, desired: PlanarPoint, area: WalkableArea, buildings: readonly BuildingRecord[] = []): ConstrainedMotion {
  const walkable = (point: PlanarPoint) => isWalkableSurface(point.x, point.z, area, buildings);
  if (walkable(desired)) return { ...desired, blockedX: false, blockedZ: false };
  if (!walkable(from)) {
    return walkable(desired)
      ? { ...desired, blockedX: false, blockedZ: false }
      : { ...from, blockedX: true, blockedZ: true };
  }

  const xOnly = { x: desired.x, z: from.z };
  const zOnly = { x: from.x, z: desired.z };
  const xLegal = walkable(xOnly), zLegal = walkable(zOnly);
  if (xLegal || zLegal) {
    const candidate = xLegal && zLegal
      ? (Math.abs(desired.x - from.x) >= Math.abs(desired.z - from.z) ? xOnly : zOnly)
      : xLegal ? xOnly : zOnly;
    return {
      ...candidate,
      blockedX: Math.abs(candidate.x - desired.x) > 1e-5,
      blockedZ: Math.abs(candidate.z - desired.z) > 1e-5,
    };
  }

  let low = 0, high = 1;
  for (let iteration = 0; iteration < 12; iteration++) {
    const middle = (low + high) * .5;
    const point = { x: from.x + (desired.x - from.x) * middle, z: from.z + (desired.z - from.z) * middle };
    if (walkable(point)) low = middle; else high = middle;
  }
  const x = from.x + (desired.x - from.x) * low;
  const z = from.z + (desired.z - from.z) * low;
  return { x, z, blockedX: Math.abs(x - desired.x) > 1e-5, blockedZ: Math.abs(z - desired.z) > 1e-5 };
}

export function starterRaftFrame(time: number, severeSea: boolean, reducedMotion = false) {
  const motion = reducedMotion ? 0 : time;
  const rootY = -1.62 + Math.sin(motion * (severeSea ? 1.2 : .9)) * (severeSea ? .34 : .08);
  return {
    rootY,
    deckY: rootY + .17,
    roll: Math.sin(motion * .55) * (severeSea ? .1 : .02),
    pitch: Math.sin(motion * .42 + 1.3) * (severeSea ? .065 : .012),
  };
}

export function naturalTerrainHeight(x: number, z: number) {
  const radius = Math.hypot(x / 1.08, z - 15);
  const coast = 2.8 * Math.max(0, Math.min(1, (67 - radius) / 15));
  const hills = Math.sin(x * 0.08) * Math.cos(z * 0.065) * 2.2 + Math.sin(z * 0.12 + x * 0.04) * 1.2;
  const arenaBlend = Math.max(0, Math.min(1, (Math.hypot(x, z) - 14) / 13));
  return coast - 2.8 + Math.max(-0.65, hills) * arenaBlend * Math.max(0, Math.min(1, (60 - radius) / 20));
}

export function terrainHeight(x: number, z: number) {
  if (isOnStarterRaft(x, z)) return -1.45;
  return naturalTerrainHeight(x, z);
}

/** Rendering/grounding height that shares the exact buoyancy frame used by the raft mesh. */
export function animatedTerrainHeight(x: number, z: number, time: number, severeSea: boolean, reducedMotion = false, area?: WalkableArea, buildings: readonly BuildingRecord[] = []) {
  const onRaftDeck = area === 'raft'
    ? isWalkableSurface(x, z, 'raft', buildings)
    : isOnStarterRaft(x, z);
  return onRaftDeck ? starterRaftFrame(time, severeSea, reducedMotion).deckY : naturalTerrainHeight(x, z);
}
