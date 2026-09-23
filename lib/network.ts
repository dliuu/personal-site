import { smooth, stagger } from "./beats";

/**
 * Pure logic for the Eisen hero: a software factory. A group of orchestrator
 * agents each spin up their own worker containers; every worker runs against
 * deterministic success/failure criteria and returns its result for the
 * orchestrator to iterate on. Layout, lifecycles, verdicts and per-beat
 * emphasis live here so they can be tested without a canvas.
 */

export type Layer = "orchestrators" | "verdicts" | "substrate";
export type Emphasis = Record<Layer, number>;

export const ORCHESTRATORS = 5;
export const WORKERS_PER = 7;
/** Orchestrators sit on a small raised circle; their workers fan out below. */
export const ORCH_R = 0.55;
export const ORCH_Y = 0.32;
const WORKER_R = [0.95, 1.25];
const WORKER_Y = -0.12;
/** Angular width of one orchestrator's sector of workers. */
const SECTOR = 0.9;

export type OrchSpec = { x: number; y: number; z: number; angle: number };
export type WorkerSpec = {
  orch: number;
  slot: number;
  x: number;
  y: number;
  z: number;
  /** 0..1, offsets the container's lifecycle so the floor never moves in step. */
  phase: number;
  /** Spawn order for the beat-0 wave, orchestrator by orchestrator. */
  rank: number;
  seed: number;
};

/** Deterministic 0..1 hash, for jitter, phases and verdicts. */
export function hash01(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Orchestrator k at angle 90° + k·72°, so orchestrator 0 faces the camera at lon −90. */
export function orchAngle(k: number): number {
  return Math.PI / 2 + (k / ORCHESTRATORS) * Math.PI * 2;
}

export function layoutOrchestrators(): OrchSpec[] {
  return Array.from({ length: ORCHESTRATORS }, (_, k) => {
    const a = orchAngle(k);
    return {
      x: Math.cos(a) * ORCH_R,
      y: ORCH_Y,
      z: Math.sin(a) * ORCH_R,
      angle: a,
    };
  });
}

/** Slot j of an orchestrator's sector, as an angle offset from its centre. */
export function slotOffset(j: number): number {
  return (j / (WORKERS_PER - 1) - 0.5) * SECTOR;
}

/** Every worker container in its orchestrator's sector, two staggered rows, jittered. */
export function layoutWorkers(): WorkerSpec[] {
  const out: WorkerSpec[] = [];
  let rank = 0;
  for (let k = 0; k < ORCHESTRATORS; k++) {
    for (let j = 0; j < WORKERS_PER; j++) {
      const seed = k * 100 + j;
      const a = orchAngle(k) + slotOffset(j) + (hash01(seed) - 0.5) * 0.08;
      const r = WORKER_R[j % 2] * (1 + (hash01(seed + 1) - 0.5) * 0.08);
      out.push({
        orch: k,
        slot: j,
        x: Math.cos(a) * r,
        y: WORKER_Y + (hash01(seed + 2) - 0.5) * 0.16,
        z: Math.sin(a) * r,
        phase: hash01(seed + 3),
        rank: rank++,
        seed,
      });
    }
  }
  return out;
}

/**
 * A container's life over one cycle (fractions of the cycle):
 * spin up → run (the task travels down) → verdict → the result travels back
 * up → tear down → a gap, then the orchestrator spins up the next one.
 */
export const PHASE = {
  up: 0.08,
  task: 0.3,
  verdict: 0.62,
  back: 0.78,
  down: 0.88,
  gap: 0.96,
} as const;

/** Which cycle a worker is in at `time`, and how far through it (0..1). */
export function cycleAt(
  time: number,
  phase: number,
  period = 9,
): { generation: number; f: number } {
  const u = time / period + phase;
  const generation = Math.floor(u);
  return { generation, f: u - generation };
}

/** Container scale 0..1 through its cycle. */
export function workerScale(f: number): number {
  return smooth(0, PHASE.up, f) * (1 - smooth(PHASE.down, PHASE.gap, f));
}

/** Deterministic success/failure criteria: the verdict for a slot's generation. */
export function passes(
  seed: number,
  generation: number,
  passRate = 0.72,
): boolean {
  return hash01(seed * 31 + generation * 7 + 1) < passRate;
}

/** How far the task packet is down the edge (orchestrator → worker), or null when not in flight. */
export function taskU(f: number): number | null {
  if (f < PHASE.up || f >= PHASE.task) return null;
  return (f - PHASE.up) / (PHASE.task - PHASE.up);
}

/** How far the result packet is back up the edge (worker → orchestrator), or null when not in flight. */
export function resultU(f: number): number | null {
  if (f < PHASE.verdict || f >= PHASE.back) return null;
  return (f - PHASE.verdict) / (PHASE.back - PHASE.verdict);
}

/** How brightly the worker shows its verdict: flashes at the verdict, holds until teardown. */
export function verdictGlow(f: number): number {
  return (
    smooth(PHASE.verdict - 0.03, PHASE.verdict, f) *
    (1 - smooth(PHASE.down, PHASE.gap, f))
  );
}

/** The orchestrator's iterate flash when a failed result lands, decaying over the teardown. */
export function iterateFlash(f: number, failed: boolean): number {
  if (!failed) return 0;
  return (
    smooth(PHASE.back - 0.02, PHASE.back, f) *
    (1 - smooth(PHASE.back, PHASE.gap, f))
  );
}

/** How lit each layer is: at rest the orchestrators lead; each beat lifts its own layer to 1. */
export function layerEmphasis(active: boolean, beat: number): Emphasis {
  if (!active) return { orchestrators: 0.6, verdicts: 0.4, substrate: 0.3 };
  if (beat <= 0) return { orchestrators: 1, verdicts: 0.4, substrate: 0.3 };
  if (beat === 1) return { orchestrators: 0.5, verdicts: 1, substrate: 0.3 };
  return { orchestrators: 0.5, verdicts: 0.5, substrate: 1 };
}

/** Fraction of an edge drawn: the wave out from the orchestrators over beat 0; whole otherwise. */
export function edgeDraw(
  active: boolean,
  beat: number,
  t: number,
  rank: number,
  count: number,
): number {
  if (active && beat === 0) return stagger(t, rank, count, 0.7);
  return 1;
}

/** Substrate pillar height 0..1: a stub at rest, rising in order through beat 2. */
export const PILLAR_REST = 0.3;
export function pillarRise(
  active: boolean,
  beat: number,
  t: number,
  i: number,
  count: number,
): number {
  if (!active || beat < 2) return PILLAR_REST;
  if (beat > 2) return 1;
  return PILLAR_REST + (1 - PILLAR_REST) * stagger(t, i, count, 0.5);
}
