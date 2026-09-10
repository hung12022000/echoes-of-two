export type Motion = 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'land' | 'attack' | 'skill' | 'dodge' | 'link' | 'hit' | 'downed' | 'revive' | 'victory';
export type V2 = { x: number; z: number };
export const damp = (from: number, to: number, speed: number, dt: number) => from + (to - from) * (1 - Math.exp(-speed * dt));
export function turnTowards(from: number, to: number, dt: number) {
  return from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * (1 - Math.exp(-12 * dt));
}
export function cameraRelative(x: number, z: number, alpha: number): V2 {
  const length = Math.hypot(x, z);
  if (!length) return { x: 0, z: 0 };
  return { x: (-Math.sin(alpha) * x - Math.cos(alpha) * z) / length, z: (Math.cos(alpha) * x - Math.sin(alpha) * z) / length };
}
