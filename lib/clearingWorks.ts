import { smooth } from "./beats";
import { hash01 } from "./network";
import { lerp } from "./progress";

/**
 * Pure logic for the Eisen hero: the Clearing Works, a clearing-house machine
 * whose working is the platform. A dispatch turret seats container agents into
 * workcells (least-loaded first, the rest wait in a visible queue), every
 * finished job rides the rail through a dual-key assay press that stamps it
 * (one in REJECT_EVERY diverts to the review siding, reworks and re-enters),
 * and stamped work drops through chutes into client vaults. One deterministic
 * schedule drives every part and every readout; the whole cycle conserves:
 * dispatched = queued + running + in flight + in review + settled at any
 * instant, and the books close to settled = JOBS before the cycle wraps.
 */

export const CELLS = 12;
/** Cells 0..5 are the engineering bay; 6..11 the company bay. */
export const ENG_CELLS = 6;
export const JOBS = 26;
export const VAULTS = 5;
/** Every REJECT_EVERY-th job fails first assay and reworks. */
export const REJECT_EVERY = 5;

/** Seconds of machine time. */
const ARRIVAL = 0.85;
const RUN_MIN = 2.4;
const RUN_VAR = 2.4;
const CELL_GAP = 0.35;
export const RAIL = 1.3;
export const STAMP = 0.55;
const PRESS_GAP = 0.18;
export const REVIEW = 2.2;
export const RETURN_RAIL = 0.9;
export const CHUTE = 1.1;
/** The quiet tail after the last job settles: the books are balanced. */
const DRAIN = 1.6;

export type JobSpec = {
  spawn: number;
  seat: number;
  done: number;
  cell: number;
  vault: number;
  rejected: boolean;
  /** Press passes [start, end]; rejected jobs get a second. */
  passes: [number, number][];
  /** Review siding dwell [start, end], rejected jobs only. */
  review?: [number, number];
  /** Chute entry (the final stamp's end) and the settle into the vault. */
  chute: number;
  settle: number;
};

/**
 * The deterministic schedule, computed once: arrivals spread by ARRIVAL,
 * each job seated in the least-loaded cell (waiting in the queue when every
 * cell is busy), the press a strict capacity-one resource, rejects re-entering
 * behind whoever else arrived meanwhile.
 */
export function buildSchedule(): JobSpec[] {
  const cellFree = Array<number>(CELLS).fill(0);
  let pressFree = 0;
  const out: JobSpec[] = [];
  for (let j = 0; j < JOBS; j++) {
    const spawn = j * ARRIVAL + hash01(j * 7 + 1) * 0.5;
    let cell = 0;
    for (let c = 1; c < CELLS; c++) if (cellFree[c] < cellFree[cell]) cell = c;
    const seat = Math.max(spawn, cellFree[cell]);
    const done = seat + RUN_MIN + hash01(j * 7 + 2) * RUN_VAR;
    cellFree[cell] = done + CELL_GAP;
    const rejected = j % REJECT_EVERY === 2;
    const arrive = done + RAIL;
    const p1 = Math.max(arrive, pressFree);
    const passes: [number, number][] = [[p1, p1 + STAMP]];
    pressFree = p1 + STAMP + PRESS_GAP;
    let review: [number, number] | undefined;
    if (rejected) {
      review = [p1 + STAMP, p1 + STAMP + REVIEW];
      const back = review[1] + RETURN_RAIL;
      const p2 = Math.max(back, pressFree);
      passes.push([p2, p2 + STAMP]);
      pressFree = p2 + STAMP + PRESS_GAP;
    }
    const chute = passes[passes.length - 1][1];
    const settle = chute + CHUTE + hash01(j * 7 + 3) * 0.25;
    out.push({
      spawn,
      seat,
      done,
      cell,
      vault: j % VAULTS,
      rejected,
      passes,
      review,
      chute,
      settle,
    });
  }
  return out;
}

export const SCHEDULE = buildSchedule();
/** One full cycle: every job settled, then the drain, then it runs again. */
export const CYCLE = Math.max(...SCHEDULE.map((j) => j.settle)) + DRAIN;
/** Where the machine sits under reduced motion: mid-flow, every layer busy. */
export const STILL_U = CYCLE * 0.42;

export type Phase =
  | "idle"
  | "queued"
  | "running"
  | "rail"
  | "pressQueue"
  | "stamping"
  | "review"
  | "returning"
  | "chute"
  | "settled";

export type JobState = {
  phase: Phase;
  /** Progress 0..1 within the phase. */
  s: number;
  cell: number;
  vault: number;
  rejected: boolean;
  /** Which press pass a pressQueue/stamping phase belongs to (0 or 1). */
  pass: number;
  /** Position in the dispatch or press queue (0 = head), else 0. */
  qi: number;
};

const over = (u: number, a: number, b: number) =>
  b > a ? (u - a) / (b - a) : 1;

function phaseOf(j: JobSpec, u: number): Omit<JobState, "qi"> {
  const base = {
    cell: j.cell,
    vault: j.vault,
    rejected: j.rejected,
    pass: 0,
  };
  if (u < j.spawn) return { ...base, phase: "idle", s: 0 };
  if (u < j.seat)
    return { ...base, phase: "queued", s: over(u, j.spawn, j.seat) };
  if (u < j.done)
    return { ...base, phase: "running", s: over(u, j.seat, j.done) };
  if (u < j.done + RAIL)
    return { ...base, phase: "rail", s: over(u, j.done, j.done + RAIL) };
  const [p1, e1] = j.passes[0];
  if (u < p1)
    return { ...base, phase: "pressQueue", s: over(u, j.done + RAIL, p1) };
  if (u < e1) return { ...base, phase: "stamping", s: over(u, p1, e1) };
  if (j.rejected && j.review) {
    const [r0, r1] = j.review;
    if (u < r1) return { ...base, phase: "review", s: over(u, r0, r1) };
    const back = r1 + RETURN_RAIL;
    if (u < back)
      return { ...base, phase: "returning", s: over(u, r1, back), pass: 1 };
    const [p2, e2] = j.passes[1];
    if (u < p2)
      return { ...base, phase: "pressQueue", s: over(u, back, p2), pass: 1 };
    if (u < e2)
      return { ...base, phase: "stamping", s: over(u, p2, e2), pass: 1 };
  }
  if (u < j.settle)
    return { ...base, phase: "chute", s: over(u, j.chute, j.settle) };
  return { ...base, phase: "settled", s: 1 };
}

/** Every job's state at machine time `u` (wraps at CYCLE). */
export function jobsAt(u: number): JobState[] {
  const w = ((u % CYCLE) + CYCLE) % CYCLE;
  const states = SCHEDULE.map((j) => ({ ...phaseOf(j, w), qi: 0 }));
  for (const queue of ["queued", "pressQueue"] as const) {
    const waiting = states
      .map((s, i) => ({ s, i }))
      .filter((x) => x.s.phase === queue)
      .sort((a, b) => SCHEDULE[a.i].spawn - SCHEDULE[b.i].spawn);
    waiting.forEach((x, rank) => {
      x.s.qi = rank;
    });
  }
  return states;
}

export type WorksMetrics = {
  dispatched: number;
  queued: number;
  live: number;
  inFlight: number;
  review: number;
  settled: number;
  /** Press strikes so far, for the counter wheel. */
  strikes: number;
  /** Jobs cleared (final stamp done). */
  stamped: number;
  /** First-pass clears over first-pass strikes, 1 when none yet. */
  passRate: number;
};

/** The readout, derived from the same schedule that moves the parts. */
export function metricsAt(u: number): WorksMetrics {
  const w = ((u % CYCLE) + CYCLE) % CYCLE;
  const states = jobsAt(w);
  const count = (p: Phase) => states.filter((s) => s.phase === p).length;
  let strikes = 0;
  let firsts = 0;
  let stamped = 0;
  SCHEDULE.forEach((j) => {
    j.passes.forEach(([, end], k) => {
      if (end <= w) {
        strikes++;
        if (k === 0) firsts++;
      }
    });
    if (j.passes[j.passes.length - 1][1] <= w) stamped++;
  });
  const rejectedFirsts = SCHEDULE.filter(
    (j) => j.rejected && j.passes[0][1] <= w,
  ).length;
  return {
    dispatched: SCHEDULE.filter((j) => j.spawn <= w).length,
    queued: count("queued"),
    live: count("running"),
    inFlight:
      count("rail") + count("pressQueue") + count("stamping") + count("chute"),
    review: count("review") + count("returning"),
    settled: count("settled"),
    strikes,
    stamped,
    passRate: firsts === 0 ? 1 : (firsts - rejectedFirsts) / firsts,
  };
}

/**
 * The plate's camera over the figure: a look-at offset (fractions of the
 * drawing's width/height) and a zoom. One key per beat; travel eases over the
 * first WORKS_TRAVEL of the beat from the previous key, as plateCamera does.
 */
export type WorksFrame = { x: number; y: number; k: number };
export const WORKS_ENTRY: WorksFrame = { x: 0, y: 0, k: 1 };
export const WORKS_FRAMES: WorksFrame[] = [
  { x: -0.14, y: 0.05, k: 1.5 },
  { x: 0.13, y: 0.1, k: 1.75 },
  { x: 0.02, y: -0.04, k: 1.02 },
];
export const WORKS_TRAVEL = 0.3;

export function worksFrame(beat: number, t: number): WorksFrame {
  if (WORKS_FRAMES.length === 0) return WORKS_ENTRY;
  const i = Math.min(Math.max(0, beat), WORKS_FRAMES.length - 1);
  const prev = i === 0 ? WORKS_ENTRY : WORKS_FRAMES[i - 1];
  const cur = WORKS_FRAMES[i];
  const s = smooth(0, WORKS_TRAVEL, t);
  return {
    x: lerp(prev.x, cur.x, s),
    y: lerp(prev.y, cur.y, s),
    k: lerp(prev.k, cur.k, s),
  };
}

/** How lit each layer is: at rest the dispatch floor leads; each beat lifts its own. */
export type WorksEmphasis = { dispatch: number; gate: number; vaults: number };
export function worksEmphasis(active: boolean, beat: number): WorksEmphasis {
  if (!active) return { dispatch: 0.85, gate: 0.6, vaults: 0.6 };
  if (beat <= 0) return { dispatch: 1, gate: 0.5, vaults: 0.45 };
  if (beat === 1) return { dispatch: 0.5, gate: 1, vaults: 0.5 };
  return { dispatch: 0.55, gate: 0.65, vaults: 1 };
}

/** Isometric projection (30° elevation): world x right, z toward the viewer's left, y up. */
const COS30 = Math.cos(Math.PI / 6);
export function iso(x: number, y: number, z: number): [number, number] {
  return [(x - z) * COS30, (x + z) * 0.5 - y];
}
