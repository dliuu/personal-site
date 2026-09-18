export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function progressToSection(progress: number, count: number): number {
  if (count <= 1) return 0;
  return Math.round(clamp01(progress) * (count - 1));
}

export function scrollToProgress(
  scrollY: number,
  scrollHeight: number,
  innerHeight: number,
): number {
  const range = scrollHeight - innerHeight;
  if (range <= 0) return 0;
  return clamp01(scrollY / range);
}
