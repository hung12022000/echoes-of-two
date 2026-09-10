// Natural heightfield plus a collision-only raft deck outside the coastline.
export function naturalTerrainHeight(x: number, z: number) {
  const radius = Math.hypot(x / 1.08, z - 15);
  const coast = 2.8 * Math.max(0, Math.min(1, (67 - radius) / 15));
  const hills = Math.sin(x * 0.08) * Math.cos(z * 0.065) * 2.2 + Math.sin(z * 0.12 + x * 0.04) * 1.2;
  const arenaBlend = Math.max(0, Math.min(1, (Math.hypot(x, z) - 14) / 13));
  return coast - 2.8 + Math.max(-0.65, hills) * arenaBlend * Math.max(0, Math.min(1, (60 - radius) / 20));
}

export function terrainHeight(x: number, z: number) {
  if (Math.hypot(x, z - 81) < 4.5) return -1.45;
  return naturalTerrainHeight(x, z);
}
