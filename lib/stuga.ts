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
