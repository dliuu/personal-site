export const HERO_RADIUS = 1.75; // world units, at scale 1
export const COLUMN_PX = 540;
export const NARROW_PX = 720;

export type Placement = { x: number; y: number; scale: number };

/** Where the hero sits so it never overlaps the text column. vpWidth/vpHeight are world units at z = 0. */
export function heroPlacement(v: {
  width: number;
  height: number;
  vpWidth: number;
  vpHeight: number;
}): Placement {
  if (v.width <= NARROW_PX) {
    const scale = Math.min(0.5, (0.36 * v.vpHeight) / HERO_RADIUS);
    return { x: 0, y: 0.5 * v.vpHeight * 0.55, scale };
  }
  const colStart = (v.width - COLUMN_PX) / 3;
  const f = (colStart + COLUMN_PX) / v.width;
  const right = 0.97;
  const centre = (f + right) / 2;
  const halfWidth = ((right - f) / 2) * v.vpWidth;
  const scale = Math.min(
    0.95,
    halfWidth / HERO_RADIUS,
    (0.42 * v.vpHeight) / HERO_RADIUS,
  );
  return { x: (centre - 0.5) * v.vpWidth, y: 0, scale };
}
