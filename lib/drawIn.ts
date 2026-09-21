/** Scale of the construction-line layer for hero weight w (0..1): complete by w = 0.625. */
export function lineScale(w: number): number {
  return Math.min(1, 1.6 * w);
}
/** Scale of the hatched solid layer: starts at w = 0.35, complete at w = 1. */
export function solidScale(w: number): number {
  return Math.max(0, (w - 0.35) / 0.65);
}
/** Opacity of the ink contour: 1 while drawing, settling to 0.5 so contours survive the engraving pass. */
export function lineOpacity(w: number): number {
  return 0.5 + 0.5 * (1 - w);
}
/** Frame-rate independent lerp factor for a per-frame factor k specified at 60 Hz. */
export function frameLerp(k: number, delta: number): number {
  return 1 - Math.pow(1 - k, delta * 60);
}
