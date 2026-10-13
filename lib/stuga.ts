import { smooth, stagger } from "./beats";

/**
 * Stuga (vacation home co-ownership): a house in the middle of the year, a
 * ring of 52 week-tiles. One owner lights two weeks; eight co-owners fill
 * the ring with no two weeks overlapping, and the house splits into their
 * shares. Pure layout and timing; instruments/projects/Stuga.tsx draws it.
 */

export const WEEKS = 52;
export const OWNERS = 8;
export const SLICES = OWNERS;
/** Weeks per owner per turn: the plans are monthly blocks, in rotation. */
const BLOCK = 4;

/** Which co-owner holds week k (0..51) once the ring is shared. */
export function weekOwner(k: number): number {
  return Math.floor(k / BLOCK) % OWNERS;
}

/** The lone owner's weeks before sharing: two in high summer. */
export const LONE_WEEKS = [28, 29];

/** 0..1 lit amount of week k. Beat 0 lights only the lone weeks; beat 1 fills the ring in order; later beats and the band are full. */
export function weekLit(
  active: boolean,
  beat: number,
  t: number,
  k: number,
): number {
  if (!active || beat >= 2) return 1;
  if (beat === 0) return LONE_WEEKS.includes(k) ? 1 : 0;
  return Math.max(LONE_WEEKS.includes(k) ? 1 : 0, stagger(t, k, WEEKS, 0.9));
}

/** How far the house's slices stand apart, 0 seated .. 1 fully spread: apart through the build, seated again for the result. */
export function sliceGap(active: boolean, beat: number, t: number): number {
  if (!active) return 0;
  if (beat === 0) return 0;
  if (beat === 1) return smooth(0, 0.35, t);
  return 1 - smooth(0, 0.3, t);
}

/** 0..1 presence of the two neighbouring homes: they rise through the result beat and stand in the band. */
export function neighboursUp(active: boolean, beat: number, t: number): number {
  if (!active) return 1;
  if (beat < 2) return 0;
  return smooth(0.2, 0.7, t);
}

/** Position of week tile k on the ring: angle from the front (week 0 at the front, clockwise seen from above). */
export function weekAngle(k: number): number {
  return Math.PI / 2 - (k / WEEKS) * Math.PI * 2;
}

/** How far slice i (of n) has spread for a gap 0..1: the outer shares lead, the middle follow. */
export function sliceSpread(gap: number, i: number, n: number): number {
  const rank = Math.abs(i - (n - 1) / 2) / ((n - 1) / 2);
  return smooth(0, 1, Math.min(1, Math.max(0, gap * 1.6 - (1 - rank) * 0.6)));
}

/** The roof lifts clear while the shares stand apart: up with the gap, with a little overshoot. */
export function roofLift(gap: number): number {
  return 0.22 * smooth(0, 0.7, gap) + 0.04 * Math.sin(Math.PI * gap);
}

/** A lit tile rises with a bounce as it lights: height 1..2 over lit 0..1. */
export function tileRise(lit: number): number {
  return 1 + 1.2 * lit + 0.35 * Math.sin(Math.PI * lit);
}

export type Puff = { y: number; r: number; alpha: number; drift: number };

/** Chimney smoke: puff i of n at time, rising, growing and fading on its own phase. */
export function puff(time: number, i: number, n: number): Puff {
  const u = (((time / 5 + i / n) % 1) + 1) % 1;
  return {
    y: u * 0.5,
    r: 0.025 + 0.06 * u,
    alpha: 0.45 * (1 - u) * smooth(0, 0.12, u),
    drift: 0.08 * Math.sin(u * 4 + i),
  };
}

/** Angles of the twelve month posts between the tiles. */
export function monthAngles(): number[] {
  return Array.from(
    { length: 12 },
    (_, m) => weekAngle((m * WEEKS) / 12) + Math.PI / WEEKS,
  );
}
