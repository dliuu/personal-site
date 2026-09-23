import { smooth, stagger } from "./beats";

/**
 * Pure logic for the Eisen network hero: an orchestrator that spins up a
 * container agent per task. Layout, lifecycles and per-beat emphasis live
 * here so they can be tested without a canvas.
 */

export type Layer = "agents" | "compliance" | "substrate";
export type Emphasis = Record<Layer, number>;

/** Agent tiers, inner to outer: developer tasks, test runs, client features. */
export const TIERS = [
  { id: "dev", count: 10, radius: 0.5, y: 0.14 },
  { id: "test", count: 16, radius: 0.78, y: -0.04 },
  { id: "feature", count: 22, radius: 1.02, y: 0.06 },
] as const;

export type NodeSpec = {
  tier: number;
  x: number;
  y: number;
  z: number;
  /** 0..1, offsets the node's lifecycle so containers come and go out of step. */
  phase: number;
  /** Spawn order for the beat-0 wave, inner tier first. */
  rank: number;
};

/** Deterministic 0..1 hash, for jitter and phases. */
export function hash01(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Every agent node on its tier ring, jittered so the rings read as a swarm, not a chart. */
export function layoutNodes(): NodeSpec[] {
  const out: NodeSpec[] = [];
  let rank = 0;
  TIERS.forEach((tier, ti) => {
    for (let i = 0; i < tier.count; i++) {
      const seed = ti * 100 + i;
      const a =
        (i / tier.count) * Math.PI * 2 + ti * 0.7 + (hash01(seed) - 0.5) * 0.35;
      const r = tier.radius * (1 + (hash01(seed + 1) - 0.5) * 0.12);
      out.push({
        tier: ti,
        x: Math.cos(a) * r,
        y: tier.y + (hash01(seed + 2) - 0.5) * 0.22,
        z: Math.sin(a) * r,
        phase: hash01(seed + 3),
        rank: rank++,
      });
    }
  });
  return out;
}

/** A container's life over one cycle u (wraps): spin up, run, retire, a gap, then again. Scale 0..1. */
export function lifecycle(u: number): number {
  const f = u - Math.floor(u);
  return smooth(0, 0.1, f) * (1 - smooth(0.82, 0.94, f));
}

/** Node scale at `time` seconds for a node with lifecycle `phase`, cycling every `period` seconds. */
export function nodeLife(time: number, phase: number, period = 9): number {
  return lifecycle(time / period + phase);
}

/** How lit each layer is: at rest the agents lead; each beat lifts its own layer to 1. */
export function layerEmphasis(active: boolean, beat: number): Emphasis {
  if (!active) return { agents: 0.6, compliance: 0.3, substrate: 0.3 };
  if (beat <= 0) return { agents: 1, compliance: 0.3, substrate: 0.3 };
  if (beat === 1) return { agents: 0.5, compliance: 1, substrate: 0.3 };
  return { agents: 0.5, compliance: 0.5, substrate: 1 };
}

/** Fraction of an edge drawn: the wave out from the core over beat 0; whole otherwise. */
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
  return PILLAR_REST + (1 - PILLAR_REST) * stagger(t, i, count, 0.5);
}

/** Where a packet is along its edge (0..1) at `time`, wrapping. */
export function packetU(time: number, phase: number, speed: number): number {
  const x = time * speed + phase;
  return x - Math.floor(x);
}

/** Compliance gate i (of count) stamps in turn round the ring, one every `step` seconds; each flash decays over 2.4 steps. */
export function gatePulse(
  time: number,
  i: number,
  count: number,
  step = 0.22,
): number {
  const x = time / step - i;
  const f = ((x % count) + count) % count;
  return 1 - smooth(0, 2.4, f);
}
