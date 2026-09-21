import { clamp01 } from "./progress";

export type Rect = { top: number; height: number };

/**
 * Sections taller than the viewport ramp 0→0.5 over the first half-viewport,
 * hold 0.5 through the middle, and ramp 0.5→1 over the last half-viewport,
 * so the hero crossfade always spans one viewport at each boundary.
 */
export function sectionProgress(
  rects: Rect[],
  viewportHeight: number,
): { active: number; progress: number; continuous: number; depth: number } {
  if (rects.length === 0)
    return { active: 0, progress: 0, continuous: 0, depth: 0 };
  const centre = viewportHeight / 2;
  let active = 0;
  for (let i = 0; i < rects.length; i++) {
    if (centre >= rects[i].top) active = i;
  }
  const r = rects[active];
  let progress = 0;
  if (r.height > 0) {
    const d = centre - r.top;
    const vh = viewportHeight;
    if (r.height <= vh) {
      progress = clamp01(d / r.height);
    } else if (d < vh / 2) {
      progress = clamp01(d / vh);
    } else if (d > r.height - vh / 2) {
      progress = clamp01(1 - (r.height - d) / vh);
    } else {
      progress = 0.5;
    }
  }
  const depth = r.height > 0 ? (centre - r.top) / viewportHeight : 0;
  return { active, progress, continuous: active + progress, depth };
}

export function heroWeight(index: number, continuous: number): number {
  return Math.max(0, 1 - Math.abs(continuous - (index + 0.5)));
}
