/**
 * The folio (projects): a stack of engraved plates in the band, and the
 * scrub that reads a project's beats once one is open.
 */

export type FanPose = { x: number; y: number; rz: number };

/** Plate i of n in the stack, fanned out by t (0 squared up, 1 fully spread). */
export function fanPose(i: number, n: number, t: number): FanPose {
  const c = i - (n - 1) / 2;
  return { x: c * 0.14 * t, y: i * 0.028, rz: c * 0.09 * t };
}

/** Progress after a wheel or drag of `dy` pixels; `span` pixels read the whole project. */
export function scrub(p: number, dy: number, span = 2400): number {
  return Math.min(1, Math.max(0, p + dy / span));
}
