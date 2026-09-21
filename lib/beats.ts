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
export function expandAmount(p: number): number {
  return smooth(0, 0.12, p) * (1 - smooth(0.88, 1, p));
}
