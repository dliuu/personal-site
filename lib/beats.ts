export function smooth(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
export function beatAt(p: number, count: number): { index: number; t: number } {
  if (count <= 0) return { index: 0, t: 0 };
  const q = Math.min(1, Math.max(0, p));
  if (q >= 1) return { index: count - 1, t: 1 };
  const x = q * count;
  const index = Math.floor(x);
  return { index, t: x - index };
}
/** 0..1 for item i of count as p runs 0..1; windows overlap by `overlap` of their length. */
export function stagger(
  p: number,
  i: number,
  count: number,
  overlap = 0.5,
): number {
  if (count <= 0) return 0;
  const win = 1 / (count - (count - 1) * overlap); // window length so the last window ends at 1
  const start = i * win * (1 - overlap);
  return smooth(start, start + win, p);
}
/** Where a plate starts shrinking back to the band (fraction of its progress). */
export const PLATE_EXIT = 0.94;
/** A dive plate never shrinks back: it ends inside one of its screens. */
export function expandAmount(p: number, dive = false): number {
  const open = smooth(0, 0.12, p);
  return dive ? open : open * (1 - smooth(PLATE_EXIT, 1, p));
}
/** Wash strength of the hand-tint for a plate expansion 0..1. */
export function washAmount(expand: number): number {
  return 0.85 * expand;
}
/** Gauge tick i (of 24) visible? Four cardinal ticks survive; the rest die in index order over beat 2. */
export function tickAlive(i: number, beat: number, t: number): boolean {
  if (beat < 2) return false;
  if (i % 6 === 0) return true;
  if (beat > 2) return false;
  const j = i - Math.floor(i / 6) - 1; // rank among the 20 doomed ticks
  return t <= (j + 1) / 20;
}
/** How far the engraving has dissolved into the real render, for a plate expansion 0..1: the wash leads, then the hatching goes. */
export function revealAmount(expand: number): number {
  return smooth(0.35, 1, expand);
}
