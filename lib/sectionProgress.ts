import { clamp01 } from "./progress";

export type Rect = { top: number; height: number };

export function sectionProgress(
  rects: Rect[],
  viewportHeight: number,
): { active: number; progress: number; continuous: number } {
  if (rects.length === 0) return { active: 0, progress: 0, continuous: 0 };
  const centre = viewportHeight / 2;
  let active = 0;
  for (let i = 0; i < rects.length; i++) {
    if (centre >= rects[i].top) active = i;
  }
  const r = rects[active];
  const progress = r.height > 0 ? clamp01((centre - r.top) / r.height) : 0;
  return { active, progress, continuous: active + progress };
}

export function heroWeight(index: number, continuous: number): number {
  return Math.max(0, 1 - Math.abs(continuous - (index + 0.5)));
}
