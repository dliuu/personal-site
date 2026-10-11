import { smooth, stagger } from "./beats";
import { hash01 } from "./network";
import { lerp } from "./progress";

/**
 * The construction site (Washington Capital Partners): a city block where
 * steel-frame towers rise floor by floor as the loans fund them, under a
 * lattice tower crane that sets the last piece. Pure layout and timing; the
 * instrument in instruments/Site.tsx draws it.
 */

export const FLOOR_PITCH = 0.14;

export type Tower = {
  x: number;
  z: number;
  floors: number;
  w: number;
  d: number;
};

/** The block: five towers, the second the tallest, where the crane sets its cap. */
export const TOWERS: Tower[] = [
  { x: -1.15, z: 0.35, floors: 9, w: 0.5, d: 0.5 },
  { x: -0.4, z: -0.35, floors: 14, w: 0.6, d: 0.6 },
  { x: 0.3, z: 0.45, floors: 7, w: 0.5, d: 0.45 },
  { x: 1.05, z: -0.25, floors: 11, w: 0.5, d: 0.5 },
  { x: 1.2, z: 0.6, floors: 5, w: 0.4, d: 0.4 },
];
export const CAP_TOWER = 1;
/** The tower wearing a scaffold on its street face, and the one with a hoist. */
export const SCAFFOLD_TOWER = 0;
export const HOIST_TOWER = 3;

export const LAYOUT = {
  groundY: -1.0,
  plotW: 3.4,
  plotD: 2.1,
  crane: { x: 0.32, z: -0.05, mastH: 2.35, jib: 1.5, counter: 0.5 },
  silo: { x: -1.35, z: -0.75 },
  office: { x: 1.3, z: -0.8 },
  mixer: { x: -0.95, z: -0.85 },
  excavator: { x: -0.85, z: 0.05 },
  laydown: { x: 0.7, z: 0.15, w: 0.5, d: 0.4 },
  /** The gate: an x range on the front edge of the plot. */
  gate: [0.55, 1.05] as [number, number],
  fence: { h: 0.16, panel: 0.2 },
} as const;

export function towerHeight(t: Tower): number {
  return t.floors * FLOOR_PITCH;
}

/** Order the towers rise through the plate: the smaller ones first, the capped one last. */
export const RISE_ORDER = [4, 2, 0, 3, 1];

/** Floors standing (fractional) on tower i at plate progress p; the band shows the block finished. */
export function floorsRaised(active: boolean, p: number, i: number): number {
  if (!active) return TOWERS[i].floors;
  const rank = RISE_ORDER.indexOf(i);
  const u = stagger(smooth(0.02, 0.8, p), rank, TOWERS.length, 0.55);
  return TOWERS[i].floors * u;
}
/** 0..1 presence of floor f given the raised count. */
export function floorAmount(raised: number, f: number): number {
  return Math.min(1, Math.max(0, raised - f));
}
/** Floors below this one are finished and glazed: the frame runs a few floors ahead of the cladding. */
export const CLAD_LAG = 3;
export function cladAmount(raised: number, f: number): number {
  return Math.min(1, Math.max(0, raised - f - CLAD_LAG));
}
/** Safety nets wrap the two floors under the working deck while the frame is still going up. */
export function netAmount(raised: number, f: number, floors: number): number {
  if (raised >= floors) return 0;
  const top = Math.floor(raised);
  if (f > top || f < top - 1) return 0;
  return Math.min(1, Math.max(0, raised - f));
}

/** Angle (about y) from the crane mast to the capped tower's centre. */
export function capYaw(): number {
  const c = LAYOUT.crane;
  const t = TOWERS[CAP_TOWER];
  return Math.atan2(-(t.z - c.z), t.x - c.x);
}

export type CraneState = {
  /** Jib yaw about the mast. */
  yaw: number;
  /** 0 the cap hangs from the hook, 1 it sits on the tower. */
  seat: number;
  /** 0 the hook is up at the jib, 1 it is down at the tower top. */
  hook: number;
};

/** The crane turns slowly over the site; on the last beat it swings to the capped tower, lowers the cap, and raises the hook again. In the band the cap is set. */
export function craneState(
  active: boolean,
  beat: number,
  t: number,
  beats: number,
  time: number,
): CraneState {
  const idle = capYaw() + 0.5 + 0.35 * Math.sin(time * 0.25);
  if (!active) return { yaw: capYaw(), seat: 1, hook: 0 };
  if (beat < beats - 1) return { yaw: idle, seat: 0, hook: 0 };
  const swing = smooth(0, 0.35, t);
  const down = smooth(0.35, 0.7, t);
  return {
    yaw: lerp(idle, capYaw(), swing),
    seat: down,
    hook: down * (1 - smooth(0.78, 0.98, t)),
  };
}

export type Seg = [[number, number, number], [number, number, number]];

/** Lattice members of the crane mast, crane-local: a square tower of chords, horizontals and alternating diagonals. */
export function craneMast(): Seg[] {
  const { mastH } = LAYOUT.crane;
  const half = 0.06;
  const section = 0.15;
  const n = Math.round(mastH / section);
  const corners: [number, number][] = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ];
  const segs: Seg[] = corners.map(([x, z]) => [
    [x, 0, z],
    [x, mastH, z],
  ]);
  for (let s = 0; s < n; s++) {
    const y0 = s * section;
    const y1 = y0 + section;
    for (let k = 0; k < 4; k++) {
      const a = corners[k];
      const b = corners[(k + 1) % 4];
      segs.push([
        [a[0], y1, a[1]],
        [b[0], y1, b[1]],
      ]);
      const flip = (s + k) % 2 === 0;
      segs.push([
        [a[0], flip ? y0 : y1, a[1]],
        [b[0], flip ? y1 : y0, b[1]],
      ]);
    }
  }
  return segs;
}

/** Lattice members of the jib and counter-jib, jib-local (origin at the slewing point, +x out along the jib): a triangular truss, a box counter-jib, and the apex with its pendants. */
export function craneJib(): { truss: Seg[]; pendants: Seg[] } {
  const { jib, counter } = LAYOUT.crane;
  const section = 0.15;
  const half = 0.06;
  const top = 0.1;
  const truss: Seg[] = [
    [
      [0, top, 0],
      [jib, top, 0],
    ],
    [
      [0, 0, -half],
      [jib, 0, -half],
    ],
    [
      [0, 0, half],
      [jib, 0, half],
    ],
  ];
  const n = Math.round(jib / section);
  for (let s = 0; s < n; s++) {
    const x0 = s * section;
    const x1 = x0 + section;
    truss.push([
      [x1, 0, -half],
      [x1, 0, half],
    ]);
    const flip = s % 2 === 0;
    for (const z of [-half, half]) {
      truss.push([
        [flip ? x0 : x1, 0, z],
        [flip ? x1 : x0, top, 0],
      ]);
    }
  }
  // Counter-jib: a box truss out the back.
  const cn = Math.round(counter / section);
  for (const y of [0, top])
    for (const z of [-half, half])
      truss.push([
        [0, y, z],
        [-counter, y, z],
      ]);
  for (let s = 1; s <= cn; s++) {
    const x = -s * section;
    for (const z of [-half, half])
      truss.push([
        [x, 0, z],
        [x, top, z],
      ]);
    truss.push([
      [x, top, -half],
      [x, top, half],
    ]);
  }
  // The apex above the slewing ring and the pendants that hold the jib.
  const apexH = 0.42;
  for (const [x, z] of [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ])
    truss.push([
      [x, top, z],
      [0, top + apexH, 0],
    ]);
  const pendants: Seg[] = [
    [
      [0, top + apexH, 0],
      [jib * 0.62, top, 0],
    ],
    [
      [0, top + apexH, 0],
      [jib * 0.98, top, 0],
    ],
    [
      [0, top + apexH, 0],
      [-counter, top, 0],
    ],
  ];
  return { truss, pendants };
}

export type Placed = { x: number; z: number; ry: number };

/** Hoarding panels around the plot, leaving the gate open on the front edge. */
export function fencePanels(): Placed[] {
  const { plotW, plotD, gate, fence } = LAYOUT;
  const hw = plotW / 2;
  const hd = plotD / 2;
  const out: Placed[] = [];
  const along = (
    from: [number, number],
    to: [number, number],
    ry: number,
    skip?: (x: number, z: number) => boolean,
  ) => {
    const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const n = Math.round(len / fence.panel);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const x = lerp(from[0], to[0], u);
      const z = lerp(from[1], to[1], u);
      if (skip && skip(x, z)) continue;
      out.push({ x, z, ry });
    }
  };
  along([-hw, hd], [hw, hd], 0, (x) => x > gate[0] && x < gate[1]);
  along([-hw, -hd], [hw, -hd], 0);
  along([-hw, -hd], [-hw, hd], Math.PI / 2);
  along([hw, -hd], [hw, hd], Math.PI / 2);
  return out;
}

/** Scaffold on the street face of a tower: standards, ledgers and diagonals over the first lifts. */
export function scaffoldSegments(t: Tower, lifts = 4): Seg[] {
  const z = t.z + t.d / 2 + 0.05;
  const x0 = t.x - t.w / 2 - 0.04;
  const x1 = t.x + t.w / 2 + 0.04;
  const bays = Math.max(2, Math.round((x1 - x0) / 0.18));
  const lift = FLOOR_PITCH;
  const h = lifts * lift;
  const segs: Seg[] = [];
  for (let i = 0; i <= bays; i++) {
    const x = lerp(x0, x1, i / bays);
    for (const dz of [0, 0.05])
      segs.push([
        [x, 0, z + dz],
        [x, h, z + dz],
      ]);
  }
  for (let l = 1; l <= lifts; l++) {
    const y = l * lift;
    for (const dz of [0, 0.05])
      segs.push([
        [x0, y, z + dz],
        [x1, y, z + dz],
      ]);
    for (let i = 0; i <= bays; i++) {
      const x = lerp(x0, x1, i / bays);
      segs.push([
        [x, y, z],
        [x, y, z + 0.05],
      ]);
    }
  }
  for (let i = 0; i < bays; i++) {
    const xa = lerp(x0, x1, i / bays);
    const xb = lerp(x0, x1, (i + 1) / bays);
    const flip = i % 2 === 0;
    segs.push([
      [xa, flip ? 0 : h, z + 0.05],
      [xb, flip ? h : 0, z + 0.05],
    ]);
  }
  return segs;
}

/** Where the hoist cage is, 0..top: it climbs, waits, and comes back down. */
export function hoistY(time: number, top: number): number {
  const cycle = 14;
  const u = (((time / cycle) % 1) + 1) % 1;
  const up = smooth(0.0, 0.4, u);
  const down = smooth(0.55, 0.95, u);
  return top * (up - down);
}

export type Worker = {
  /** Tower index, or −1 for the yard. */
  tower: number;
  u: number;
  v: number;
  phase: number;
};

export const WORKERS: Worker[] = Array.from({ length: 26 }, (_, i) => ({
  tower: i < 20 ? i % TOWERS.length : -1,
  u: hash01(1200 + i),
  v: hash01(1300 + i),
  phase: hash01(1400 + i),
}));

/** A worker's place: on the working deck of their tower (hidden until it has one), or in the laydown yard. */
export function workerPose(
  w: Worker,
  raised: number[],
): { x: number; y: number; z: number; visible: boolean } {
  const { groundY, laydown } = LAYOUT;
  if (w.tower < 0) {
    return {
      x: laydown.x + (w.u - 0.5) * laydown.w * 1.6,
      y: groundY,
      z: laydown.z + (w.v - 0.5) * laydown.d * 1.6,
      visible: true,
    };
  }
  const t = TOWERS[w.tower];
  const deck = Math.floor(raised[w.tower]);
  return {
    x: t.x + (w.u - 0.5) * t.w * 0.75,
    y: groundY + deck * FLOOR_PITCH + (deck > 0 ? 0.015 : 0),
    z: t.z + (w.v - 0.5) * t.d * 0.75,
    visible: deck >= 1,
  };
}

/** Foundation piles under the capped tower, on a grid inside its footprint. */
export function pilePositions(): [number, number][] {
  const t = TOWERS[CAP_TOWER];
  const n = 4;
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      out.push([
        t.x + ((i + 0.5) / n - 0.5) * t.w * 0.9,
        t.z + ((j + 0.5) / n - 0.5) * t.d * 0.9,
      ]);
  return out;
}
