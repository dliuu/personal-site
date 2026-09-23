/** Small periodic motions for the room; every function is pure in (t, seed). */

/** Per-bulb twinkle 0.85..1 with its own phase and a slightly different rate. */
export function twinkle(t: number, phase: number): number {
  const f = 0.6 + 0.4 * ((phase * 7.31) % 1);
  return 0.85 + 0.15 * (0.5 + 0.5 * Math.sin(t * f * 2 * Math.PI + phase));
}
/** Chest scale for a sleeping animal, 1 ± 0.02 at 0.3 Hz. */
export function breathe(t: number): number {
  return 1 + 0.02 * Math.sin(t * 0.3 * 2 * Math.PI);
}
/** Tail flick: 0 at rest, a short swing every 4–9 s (seeded). Returns radians. */
export function tailFlick(t: number, seed: number): number {
  const period = 4 + 5 * ((seed * 0.618) % 1);
  const u = (t % period) / period;
  if (u > 0.12) return 0;
  return 0.5 * Math.sin((u / 0.12) * Math.PI);
}
/** Phone screen pulse: 0..1, on for 1.5 s every 20–40 s (seeded). */
export function phonePulse(t: number, seed: number): number {
  const period = 20 + 20 * ((seed * 0.377) % 1);
  const u = t % period;
  if (u > 1.5) return 0;
  return Math.min(1, u / 0.15, (1.5 - u) / 0.4);
}
/** Key i (of n) depression 0..1 while typing: a few keys at a time, 3 mm at most. */
export function keyPress(t: number, i: number, typing: boolean): number {
  if (!typing) return 0;
  const k = (i * 0.7548776662) % 1;
  const u = (t * 5 + k * 13) % 1;
  return k < 0.08 ? Math.max(0, Math.sin(u * Math.PI)) : 0;
}
/** Camera parallax toward the pointer (−1..1): 3 cm on mouse, half on touch. */
export function parallax(
  px: number,
  py: number,
  touch: boolean,
): [number, number] {
  const k = touch ? 0.015 : 0.03;
  return [px * k, py * k];
}
/** Lamp filament flicker: ±1.5 % from two incommensurate sines. */
export function flicker(t: number): number {
  return 1 + 0.015 * (Math.sin(t * 50) * 0.6 + Math.sin(t * 37.3) * 0.4);
}
