import { smooth, stagger } from "./beats";

/**
 * Pure logic for the Washington Capital hero: a construction drawing that
 * builds itself. Hard-money construction lending disburses in draws released
 * as a build hits milestones, so the building is the instrument and a draw is
 * literal. Every animated scalar is derived here from (beat, t) alone, so the
 * staging can be tested without a canvas.
 */

export const FLOORS = 6;
/** Institutions clad the frame; the slots cycle through them. */
export const TENANTS = 12;
export const BAYS = 5;
const WALLS = 4;

export type Stage = {
  /** Wall hinge angles, 0..π/2, one per wall of the plan. */
  hinge: number[];
  /** Floors inked so far, 0..FLOORS. */
  floors: number;
  /** Cladding coverage, 0..1. */
  clad: number;
  /** Institutions counted, 0..TENANTS. */
  tenants: number;
  /** Structural bays, 1..BAYS. */
  bays: number;
  /** Dimension-arrow closure, 0..1. */
  dim: number;
  /** Draw-line phase, 0..1, wrapping. */
  draw: number;
  /** Topping-out beam height above its seat, in world units. */
  beam: number;
};

/** Which institution clads slot `i`; twelve cycle over the twenty-four slots. */
export function tenantAt(slot: number): number {
  return slot % TENANTS;
}

/**
 * Bays follow the traffic curve rather than the beat: the fleet scaled on
 * traffic data, so the count steps rather than eases.
 */
export function bayCount(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return 1 + Math.floor(u * (BAYS - 1) + 1e-9);
}

/** How high the topping-out beam floats before it is seated. */
const BEAM_LIFT = 0.5;

export function stage(beat: number, t: number): Stage {
  const u = Math.min(1, Math.max(0, t));
  // The plan hinges up during beat i and stays up for the rest of the plate.
  const hinge =
    beat === 0
      ? Array.from(
          { length: WALLS },
          (_, i) =>
            // The walls lead one another so the plan unfolds rather than pops.
            stagger(u, i, WALLS, 0.6) * (Math.PI / 2),
        )
      : Array.from({ length: WALLS }, () => Math.PI / 2);

  const inked = beat < 1 ? 0 : beat > 1 ? 1 : smooth(0, 0.55, u);
  const clad = beat < 1 ? 0 : beat > 1 ? 1 : smooth(0.35, 1, u);
  const dim = beat < 2 ? 0 : beat > 2 ? 1 : smooth(0, 1, u);
  const seat = beat < 3 ? 1 : 1 - smooth(0.55, 0.95, u);

  return {
    hinge,
    floors: Math.round(inked * FLOORS),
    clad,
    tenants: Math.round(clad * TENANTS),
    bays: beat === 2 ? bayCount(u) : beat > 2 ? BAYS : 1,
    dim,
    // The phase drives a repeating dash pattern down the columns; the reset at
    // each pass boundary is invisible in the render.
    draw: beat === 3 ? (u * 3) % 1 : 0,
    beam: seat * BEAM_LIFT,
  };
}
