import type { BuildingRecord } from '../oceanbound/session';

/** Conservative body-vs-structure blocker. Floors and roofs remain walkable/non-solid. */
export function isBlockedByBuildings(x: number, z: number, buildings: BuildingRecord[]) {
  return buildings.some(building => {
    if (building.type === 'foundation' || building.type === 'roof') return false;
    const dx = x - building.x, dz = z - building.z;
    const localX = Math.cos(-building.rotation) * dx - Math.sin(-building.rotation) * dz;
    const localZ = Math.sin(-building.rotation) * dx + Math.cos(-building.rotation) * dz;
    if (building.type === 'wall') return Math.abs(localX) < 2.05 && Math.abs(localZ) < .43;
    if (building.type === 'door') return Math.abs(localX) > .64 && Math.abs(localX) < 2.05 && Math.abs(localZ) < .43;
    const radius = building.type === 'watchtower' ? 1.6 : building.type === 'tree_planter' ? 1.05 : .72;
    return Math.hypot(localX, localZ) < radius;
  });
}
