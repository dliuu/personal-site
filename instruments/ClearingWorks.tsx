"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { beatAt } from "@/lib/beats";
import {
  CELLS,
  CYCLE,
  ENG_CELLS,
  iso,
  JOBS,
  jobsAt,
  metricsAt,
  SCHEDULE,
  STILL_U,
  VAULTS,
  worksEmphasis,
  worksFrame,
} from "@/lib/clearingWorks";
import { frameLerp } from "@/lib/drawIn";
import { lerp } from "@/lib/progress";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useSectionsStore } from "@/store/useSectionsStore";
import { chapters, eisenBeats, sections } from "./chapters";
import { plateState } from "./plateState";

/**
 * The Eisen hero: the Clearing Works, drawn as an Anatomy-style isometric
 * figure on the chapter's dark screen. Every moving part and every readout is
 * a pure function of lib/clearingWorks's deterministic schedule, painted
 * imperatively through refs (transform and opacity only, no per-frame React
 * work and no SVG filters). The loop runs only while an Eisen section is
 * active, clamps dt, and freezes mid-flow under reduced motion.
 */

const EISEN = chapters.findIndex((c) => c.id === "eisen");
const PAL = chapters[EISEN].palette;
const BEATS = eisenBeats.length;

/* ---- projection: world units to viewBox pixels ---- */
const S = 64;
const CX = 500;
const CY = 300;
const px = (x: number, y: number, z: number): [number, number] => {
  const [a, b] = iso(x, y, z);
  return [CX + a * S, CY + b * S];
};
/** Projection relative to a moving origin, for parts positioned per frame. */
const rel = (x: number, y: number, z: number): [number, number] => {
  const [a, b] = iso(x, y, z);
  return [a * S, b * S];
};
const pts = (
  list: [number, number, number][],
  p: (x: number, y: number, z: number) => [number, number] = px,
) =>
  list
    .map((q) =>
      p(...q)
        .map((n) => +n.toFixed(1))
        .join(","),
    )
    .join(" ");

/* ---- four-tone shading on the Eisen screen ---- */
type Tone = { top: string; left: string; right: string; line: string };
const LO: Tone = {
  top: "#262c37",
  left: "#1d222b",
  right: "#161a21",
  line: "#0b0d12",
};
const MID: Tone = {
  top: "#39414f",
  left: "#2b313d",
  right: "#21262f",
  line: "#0d1015",
};
const HI: Tone = {
  top: "#4b5467",
  left: "#394152",
  right: "#2c3240",
  line: "#0f1118",
};
const INK = PAL.ink;
const BLUE = PAL.accent;
const SEAL = "#8ef0a0";
const AMBER = "#ffc46b";
const LINE_W = 0.9;

function boxFaces(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  p: (x: number, y: number, z: number) => [number, number] = px,
) {
  return {
    top: pts(
      [
        [x0, y1, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x0, y1, z1],
      ],
      p,
    ),
    left: pts(
      [
        [x0, y0, z1],
        [x1, y0, z1],
        [x1, y1, z1],
        [x0, y1, z1],
      ],
      p,
    ),
    right: pts(
      [
        [x1, y0, z0],
        [x1, y0, z1],
        [x1, y1, z1],
        [x1, y1, z0],
      ],
      p,
    ),
  };
}

function Box({
  x0,
  x1,
  y0,
  y1,
  z0,
  z1,
  t,
  p,
}: {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  t: Tone;
  p?: (x: number, y: number, z: number) => [number, number];
}) {
  const f = boxFaces(x0, x1, y0, y1, z0, z1, p);
  const s = {
    stroke: t.line,
    strokeWidth: LINE_W,
    strokeLinejoin: "round" as const,
  };
  return (
    <>
      <polygon points={f.left} fill={t.left} {...s} />
      <polygon points={f.right} fill={t.right} {...s} />
      <polygon points={f.top} fill={t.top} {...s} />
    </>
  );
}

/** Vertical cylinder: body between the extreme generators, then the top ellipse. */
function Cyl({
  x,
  z,
  y0,
  y1,
  r,
  t,
}: {
  x: number;
  z: number;
  y0: number;
  y1: number;
  r: number;
  t: Tone;
}) {
  const rx = r * Math.SQRT2 * Math.cos(Math.PI / 6) * S;
  const ry = r * Math.SQRT2 * 0.5 * S;
  const [cx, cyT] = px(x, y1, z);
  const cyB = px(x, y0, z)[1];
  const d = `M ${cx - rx} ${cyT} L ${cx - rx} ${cyB} A ${rx} ${ry} 0 0 0 ${
    cx + rx
  } ${cyB} L ${cx + rx} ${cyT} Z`;
  return (
    <>
      <path d={d} fill={t.right} stroke={t.line} strokeWidth={LINE_W} />
      <ellipse
        cx={cx}
        cy={cyT}
        rx={rx}
        ry={ry}
        fill={t.top}
        stroke={t.line}
        strokeWidth={LINE_W}
      />
    </>
  );
}

/** A circle on a vault's front (+z) face, as a projected polygon. */
function faceCircle(
  cx: number,
  cy: number,
  zf: number,
  r: number,
  segs = 24,
): string {
  const out: [number, number, number][] = [];
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a), zf]);
  }
  return pts(out);
}

function Label({
  text,
  at,
  lx,
  ly,
  anchor = "start",
}: {
  text: string;
  at: [number, number, number];
  lx: number;
  ly: number;
  anchor?: "start" | "end";
}) {
  const [ax, ay] = px(...at);
  return (
    <g className="works-label">
      <path d={`M ${lx} ${ly + 4} L ${ax} ${ay}`} />
      <circle cx={ax} cy={ay} r={1.8} />
      <text x={lx} y={ly} textAnchor={anchor}>
        {text}
      </text>
    </g>
  );
}

/* ---- the static layout, world units (y up, floor top at y = 0) ---- */
const FLOOR = { x0: -4.6, x1: 4.6, z0: -2.6, z1: 2.6, y0: -0.2 };
const PILLARS: [number, number][] = [
  [-3.9, -1.9],
  [-3.9, 1.9],
  [0, -1.9],
  [0, 1.9],
  [3.9, -1.9],
  [3.9, 1.9],
];
const TUR = { x: -2.5, z: 0 };
const ARM_LEN = 1.05;
const ARM_Y = 0.98;
const cellPos = (c: number): [number, number] => {
  const bay = c < ENG_CELLS ? 1 : -1;
  const i = c % ENG_CELLS;
  return [-3.45 + (i % 3) * 0.8, bay * (1.1 + Math.floor(i / 3) * 0.8)];
};
const MAG = { x: -3.45, z: -1.45 };
const QUEUE = { x: -4.35, z: 0.35 };
const QUEUE_MAX = 8;
const RAIL = { z: 0.3, x0: -1.15, x1: 2.3, top: 0.3 };
const CARRY = 0.34;
const PRESS = { x: 1.8, z: 0.3 };
const AUDIT = { x: 1.15, z: -1.35 };
const SIDING = { x: 2.35, z: 1.45 };
const HATCH_X = 3.78;
const VZ = [-1.95, -0.75, 0.55, 1.35, 2.15];
const SAFE = { x0: 3.95, x1: 4.75 };
const SAFE_H = [1.4, 1.25, 0.8, 0.8, 0.8];
const SAFE_D = [0.8, 0.8, 0.6, 0.6, 0.6];

/** A pallet, drawn about its own origin so one transform carries it. */
function Pallet() {
  return (
    <>
      <Box
        x0={-0.17}
        x1={0.17}
        y0={-0.045}
        y1={0.045}
        z0={-0.17}
        z1={0.17}
        t={MID}
        p={rel}
      />
      <Box
        x0={-0.1}
        x1={0.1}
        y0={0.045}
        y1={0.225}
        z0={-0.1}
        z1={0.1}
        t={HI}
        p={rel}
      />
    </>
  );
}

/** A container cartridge on its cell, drawn about the cell's screen point. */
function Cartridge({ bay }: { bay: "eng" | "co" }) {
  return (
    <>
      <Box
        x0={-0.17}
        x1={0.17}
        y0={0.07}
        y1={0.41}
        z0={-0.17}
        z1={0.17}
        t={HI}
        p={rel}
      />
      <ellipse
        className="works-cart-lamp"
        cx={0}
        cy={rel(0, 0.41, 0)[1]}
        rx={5}
        ry={2.9}
        fill={bay === "eng" ? BLUE : AMBER}
        opacity={0}
      />
    </>
  );
}

const GRID_STEP = 0.75;
function gridPath(): string {
  const seg: string[] = [];
  for (
    let x = Math.ceil(FLOOR.x0 / GRID_STEP) * GRID_STEP;
    x < FLOOR.x1;
    x += GRID_STEP
  ) {
    const [ax, ay] = px(x, 0, FLOOR.z0);
    const [bx, by] = px(x, 0, FLOOR.z1);
    seg.push(
      `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`,
    );
  }
  for (
    let z = Math.ceil(FLOOR.z0 / GRID_STEP) * GRID_STEP;
    z < FLOOR.z1;
    z += GRID_STEP
  ) {
    const [ax, ay] = px(FLOOR.x0, 0, z);
    const [bx, by] = px(FLOOR.x1, 0, z);
    seg.push(
      `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`,
    );
  }
  return seg.join(" ");
}

function rulerPath(): string {
  const seg: string[] = [];
  for (let x = RAIL.x0; x <= RAIL.x1 + 1e-6; x += 0.25) {
    const major = Math.round(x * 4) % 4 === 0;
    const [ax, ay] = px(x, RAIL.top, RAIL.z + 0.2);
    const [bx, by] = px(x, RAIL.top - (major ? 0.09 : 0.05), RAIL.z + 0.2);
    seg.push(
      `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`,
    );
  }
  return seg.join(" ");
}

function chutePath(v: number): string {
  const [ax, ay] = px(2.45, RAIL.top, RAIL.z);
  const [mx, my] = px(3.1, 0.18, lerp(RAIL.z, VZ[v], 0.6));
  const [bx, by] = px(HATCH_X, 0.03, VZ[v]);
  return `M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
}

/** The vault fronts: a coin medallion, a columned portico, three branch doors. */
function SafeFront({ v }: { v: number }) {
  const zf = VZ[v] + SAFE_D[v] / 2;
  const cx = (SAFE.x0 + SAFE.x1) / 2;
  const h = SAFE_H[v];
  const door: ReactNode =
    v === 0 ? (
      <>
        <polygon
          points={faceCircle(cx, h * 0.52, zf, 0.3)}
          fill={LO.left}
          stroke={MID.top}
          strokeWidth={LINE_W}
        />
        <polygon
          points={faceCircle(cx, h * 0.52, zf, 0.21)}
          fill="none"
          stroke={AMBER}
          strokeWidth={LINE_W}
          opacity={0.8}
        />
        <polygon
          points={faceCircle(cx, h * 0.52, zf, 0.07)}
          fill={AMBER}
          stroke="none"
          opacity={0.65}
        />
      </>
    ) : v === 1 ? (
      <>
        {[-0.22, 0, 0.22].map((dx) => {
          const f = boxFaces(
            cx + dx - 0.045,
            cx + dx + 0.045,
            0.08,
            h * 0.62,
            zf,
            zf,
          );
          return (
            <polygon
              key={dx}
              points={f.right}
              fill={MID.top}
              stroke={LO.line}
              strokeWidth={LINE_W}
            />
          );
        })}
        <polygon
          points={pts([
            [cx - 0.34, h * 0.62, zf],
            [cx + 0.34, h * 0.62, zf],
            [cx, h * 0.82, zf],
          ])}
          fill={MID.left}
          stroke={LO.line}
          strokeWidth={LINE_W}
        />
      </>
    ) : (
      <>
        <polygon
          points={pts([
            [cx - 0.2, 0.1, zf],
            [cx + 0.2, 0.1, zf],
            [cx + 0.2, h * 0.68, zf],
            [cx - 0.2, h * 0.68, zf],
          ])}
          fill={LO.left}
          stroke={MID.top}
          strokeWidth={LINE_W}
        />
        <polygon
          points={faceCircle(cx + 0.09, h * 0.38, zf, 0.035, 10)}
          fill={AMBER}
          opacity={0.6}
        />
      </>
    );
  // Per-client config plaque: the same dial, set differently for every vault.
  const plaqueA = -0.5 + v * 0.55;
  const pc: [number, number, number] = [SAFE.x1 - 0.14, h * 0.86, zf];
  return (
    <g>
      {door}
      <polygon
        points={faceCircle(pc[0], pc[1], zf, 0.07, 12)}
        fill={MID.right}
        stroke={LO.line}
        strokeWidth={LINE_W}
      />
      <path
        d={`M ${px(...pc)
          .map((n) => n.toFixed(1))
          .join(" ")} L ${px(
          pc[0] + 0.06 * Math.cos(plaqueA),
          pc[1] + 0.06 * Math.sin(plaqueA),
          zf,
        )
          .map((n) => n.toFixed(1))
          .join(" ")}`}
        stroke={AMBER}
        strokeWidth={LINE_W}
      />
    </g>
  );
}

type Rigs = {
  layer: HTMLDivElement | null;
  cam: SVGGElement | null;
  dispatch: SVGGElement | null;
  /** The gate and vault layers are split by painter's order; opacity goes to both halves. */
  gate: (SVGGElement | null)[];
  vaults: (SVGGElement | null)[];
  arm: SVGPolygonElement | null;
  beacon: SVGEllipseElement | null;
  carts: (SVGGElement | null)[];
  chips: (SVGGElement | null)[];
  pallets: (SVGGElement | null)[];
  head: SVGGElement | null;
  keyA: SVGGElement | null;
  keyB: SVGGElement | null;
  seal: SVGEllipseElement | null;
  gateLamp: SVGEllipseElement | null;
  spool: SVGLineElement | null;
  counter: SVGTextElement | null;
  reviewLamp: SVGEllipseElement | null;
  vaultLamps: (SVGEllipseElement | null)[];
  readout: (SVGTextElement | null)[];
};

export function ClearingWorks() {
  const R = useRef<Rigs>({
    layer: null,
    cam: null,
    dispatch: null,
    gate: [],
    vaults: [],
    arm: null,
    beacon: null,
    carts: [],
    chips: [],
    pallets: [],
    head: null,
    keyA: null,
    keyB: null,
    seal: null,
    gateLamp: null,
    spool: null,
    counter: null,
    reviewLamp: null,
    vaultLamps: [],
    readout: [],
  });
  const sim = useRef({
    // Start mid-flow, so the first look lands on a busy floor.
    u: STILL_U,
    last: 0,
    raf: 0,
    running: false,
    hover: 1,
    armA: -2.2,
    mode: "",
    lines: ["", "", ""],
    counter: "",
    pals: SCHEDULE.map(() => ({ x: 0, y: 0, on: false })),
  });

  // Anatomy pattern: one tick writes transforms and opacities through refs;
  // nothing re-renders after mount.
  useEffect(() => {
    const r = R.current;
    const v = sim.current;
    const setO = (el: Element | null, o: number) => {
      el?.setAttribute("opacity", o.toFixed(3));
    };
    const smoothc = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    const paint = (dt: number) => {
      const st = useSectionsStore.getState();
      const { reducedMotion } = useDeviceStore.getState();
      const sec = sections[st.active];
      const plate = sec?.chapter === EISEN && sec.kind === "plate";
      if (reducedMotion) v.u = STILL_U;
      else v.u = (v.u + dt * v.hover) % CYCLE;
      const u = v.u;
      const b = plate ? beatAt(st.progress, BEATS) : { index: 0, t: 0 };
      const expand = plate ? plateState.expand : 0;

      // Camera: the band holds the whole card; each beat travels to its place.
      const f = worksFrame(b.index, b.t);
      const k = lerp(1, f.k, expand);
      const fx = lerp(0, f.x, expand) * 1000;
      const fy = lerp(0, f.y, expand) * 620;
      r.cam?.setAttribute(
        "transform",
        `translate(${CX} ${CY}) scale(${k.toFixed(4)}) translate(${(-CX - fx).toFixed(1)} ${(-CY - fy).toFixed(1)})`,
      );

      // Layer emphasis: rest in the band, one layer lifted per beat.
      const rest = worksEmphasis(false, 0);
      const em = worksEmphasis(true, b.index);
      const mix = (a: number, c: number) => 0.35 + 0.65 * lerp(a, c, expand);
      setO(r.dispatch, mix(rest.dispatch, em.dispatch));
      for (const g of r.gate) setO(g, mix(rest.gate, em.gate));
      for (const g of r.vaults) setO(g, mix(rest.vaults, em.vaults));

      const states = jobsAt(u);
      const m = metricsAt(u);

      // The turret points at the cell it is filling, easing between seats.
      let seatAt = -Infinity;
      let target = v.armA;
      SCHEDULE.forEach((j, i) => {
        if (j.seat <= u + 0.25 && j.seat > seatAt) {
          seatAt = j.seat;
          const [cx, cz] = cellPos(states[i].cell);
          target = Math.atan2(cz - TUR.z, cx - TUR.x);
        }
      });
      let d = target - v.armA;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      v.armA += reducedMotion ? d : d * frameLerp(0.14, dt);
      const a = v.armA;
      const tip: [number, number] = [
        TUR.x + Math.cos(a) * ARM_LEN,
        TUR.z + Math.sin(a) * ARM_LEN,
      ];
      const n: [number, number] = [-Math.sin(a), Math.cos(a)];
      r.arm?.setAttribute(
        "points",
        pts([
          [TUR.x + n[0] * 0.09, ARM_Y, TUR.z + n[1] * 0.09],
          [tip[0] + n[0] * 0.05, ARM_Y, tip[1] + n[1] * 0.05],
          [tip[0] - n[0] * 0.05, ARM_Y, tip[1] - n[1] * 0.05],
          [TUR.x - n[0] * 0.09, ARM_Y, TUR.z - n[1] * 0.09],
        ]),
      );
      setO(r.beacon, 0.45 + 0.4 * Math.sin(u * 3));

      // Cartridges live on their cells: spin up, run (lamp breathing), retire.
      const byCell = Array<number>(CELLS).fill(-1);
      states.forEach((s, i) => {
        if (s.phase === "running") byCell[s.cell] = i;
      });
      for (let c = 0; c < CELLS; c++) {
        const g = r.carts[c];
        if (!g) continue;
        const i = byCell[c];
        const s = i < 0 ? 0 : states[i].s;
        const sc = i < 0 ? 0 : smoothc(0, 0.06, s) * (1 - smoothc(0.93, 1, s));
        const [gx, gy] = px(cellPos(c)[0], 0.07, cellPos(c)[1]);
        g.setAttribute(
          "transform",
          `translate(${gx.toFixed(1)} ${gy.toFixed(1)}) scale(${Math.max(0.001, sc).toFixed(3)})`,
        );
        g.setAttribute("opacity", sc <= 0.001 ? "0" : "1");
        const lamp = g.querySelector(".works-cart-lamp");
        if (lamp)
          lamp.setAttribute(
            "opacity",
            (sc * (0.55 + 0.45 * Math.sin(u * 5 + c * 1.7))).toFixed(3),
          );
      }

      // The queue: a chip per waiting job, the head chip glowing to go next.
      for (let i = 0; i < QUEUE_MAX; i++) {
        const chip = r.chips[i];
        if (!chip) continue;
        const show = i < Math.min(m.queued, QUEUE_MAX);
        chip.setAttribute(
          "opacity",
          show
            ? i === 0
              ? (0.8 + 0.2 * Math.sin(u * 4)).toFixed(3)
              : "1"
            : "0",
        );
      }

      // Pallets: rail, press queue, stamp, review loop, chute. Screen position
      // eases toward its target so the queue advances without popping.
      let stampS = -1;
      states.forEach((s, i) => {
        const g = r.pallets[i];
        if (!g) return;
        const p = v.pals[i];
        let w: [number, number, number] | null = null;
        let scale = 1;
        switch (s.phase) {
          case "rail":
            w = [lerp(RAIL.x0, PRESS.x - 0.38, s.s), CARRY, RAIL.z];
            break;
          case "pressQueue":
            w = [PRESS.x - 0.38 - s.qi * 0.42, CARRY, RAIL.z];
            break;
          case "stamping":
            w = [PRESS.x, CARRY, RAIL.z];
            stampS = Math.max(stampS, s.s);
            break;
          case "review": {
            const out = smoothc(0, 0.3, s.s);
            w = [
              lerp(PRESS.x, SIDING.x, out),
              CARRY,
              lerp(RAIL.z, SIDING.z, out),
            ];
            break;
          }
          case "returning":
            w = [
              lerp(SIDING.x, PRESS.x - 0.9, s.s),
              CARRY,
              lerp(SIDING.z, RAIL.z, s.s),
            ];
            break;
          case "chute": {
            const vz = VZ[s.vault];
            w = [
              lerp(2.45, HATCH_X, s.s),
              lerp(CARRY, 0.08, smoothc(0.1, 0.9, s.s)),
              lerp(RAIL.z, vz, smoothc(0, 0.7, s.s)),
            ];
            scale = 1 - smoothc(0.82, 1, s.s);
            break;
          }
          default:
            break;
        }
        if (!w) {
          if (p.on) {
            g.setAttribute("opacity", "0");
            p.on = false;
          }
          return;
        }
        const [tx, ty] = px(...w);
        if (!p.on || reducedMotion) {
          p.x = tx;
          p.y = ty;
        } else {
          const e = frameLerp(0.25, dt);
          p.x = lerp(p.x, tx, e);
          p.y = lerp(p.y, ty, e);
        }
        p.on = true;
        g.setAttribute(
          "transform",
          `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${Math.max(0.001, scale).toFixed(3)})`,
        );
        g.setAttribute("opacity", "1");
      });

      // The assay press: both keys seat, the head strikes, the seal flares.
      const sS = stampS;
      const drop =
        sS < 0 ? 0 : smoothc(0.05, 0.35, sS) * (1 - smoothc(0.6, 0.95, sS));
      const slide =
        sS < 0 ? 0 : smoothc(0, 0.22, sS) * (1 - smoothc(0.85, 1, sS));
      r.head?.setAttribute(
        "transform",
        `translate(0 ${(0.42 * drop * S).toFixed(1)})`,
      );
      const kd = rel(0, 0, 0.3 * slide);
      r.keyA?.setAttribute(
        "transform",
        `translate(${kd[0].toFixed(1)} ${kd[1].toFixed(1)})`,
      );
      r.keyB?.setAttribute(
        "transform",
        `translate(${(-kd[0]).toFixed(1)} ${kd[1].toFixed(1)})`,
      );
      const flare =
        sS < 0 ? 0 : smoothc(0.32, 0.45, sS) * (1 - smoothc(0.55, 0.85, sS));
      setO(r.seal, 0.85 * flare);
      r.seal?.setAttribute(
        "transform",
        `translate(${px(PRESS.x, CARRY + 0.26, RAIL.z)
          .map((q) => q.toFixed(1))
          .join(" ")}) scale(${(0.5 + 0.9 * (sS < 0 ? 0 : sS)).toFixed(3)})`,
      );
      setO(r.gateLamp, 0.25 + 0.75 * (sS < 0 ? 0 : 1 - smoothc(0.7, 1, sS)));

      // The audit ledger: a strike counter and a spool that winds per stamp.
      const counter = String(m.strikes).padStart(3, "0");
      if (counter !== v.counter && r.counter) {
        v.counter = counter;
        r.counter.textContent = counter;
      }
      const spoolA = m.strikes * 0.9 + (sS > 0 ? sS * 0.9 : 0);
      const [sx, sy] = px(AUDIT.x, 0.32, AUDIT.z);
      const se = rel(0.16 * Math.cos(spoolA), 0, 0.16 * Math.sin(spoolA));
      r.spool?.setAttribute("x1", sx.toFixed(1));
      r.spool?.setAttribute("y1", sy.toFixed(1));
      r.spool?.setAttribute("x2", (sx + se[0]).toFixed(1));
      r.spool?.setAttribute("y2", (sy + se[1]).toFixed(1));

      // The review siding's lamp burns while a reject is being reworked.
      const reviewing = states.some((s) => s.phase === "review" && s.s > 0.25);
      setO(r.reviewLamp, reviewing ? 0.6 + 0.4 * Math.sin(u * 7) : 0.12);

      // A vault door blips as its pallet settles; the books balance on screen.
      for (let vt = 0; vt < VAULTS; vt++) {
        let glow = 0;
        SCHEDULE.forEach((j) => {
          if (j.vault !== vt) return;
          if (j.settle <= u && u - j.settle < 0.6)
            glow = Math.max(glow, 1 - (u - j.settle) / 0.6);
        });
        setO(r.vaultLamps[vt], 0.1 + 0.9 * glow);
      }

      // The readout, from the same schedule that moves the parts.
      const lines = [
        `agents ${m.live} live · ${m.queued} queued`,
        `stamped ${m.strikes} · pass ${Math.round(m.passRate * 100)}%`,
        `settled ${m.settled}/${JOBS} · in flight ${m.inFlight + m.review}`,
      ];
      lines.forEach((text, i) => {
        if (text !== v.lines[i] && r.readout[i]) {
          v.lines[i] = text;
          r.readout[i].textContent = text;
        }
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(1 / 30, (now - v.last) / 1000 || 0);
      v.last = now;
      paint(dt);
      v.raf = requestAnimationFrame(tick);
    };

    // The loop runs only while an Eisen section is on screen.
    const apply = (active: number) => {
      const sec = sections[active];
      const mode =
        sec?.chapter === EISEN
          ? sec.kind === "plate"
            ? "plate"
            : "band"
          : "off";
      if (mode !== v.mode) {
        v.mode = mode;
        r.layer?.setAttribute("data-mode", mode);
      }
      const run = mode !== "off";
      if (run && !v.running) {
        v.running = true;
        v.last = performance.now();
        v.raf = requestAnimationFrame(tick);
      } else if (!run && v.running) {
        v.running = false;
        cancelAnimationFrame(v.raf);
      }
    };
    apply(useSectionsStore.getState().active);
    const unsub = useSectionsStore.subscribe((s) => apply(s.active));
    return () => {
      unsub();
      if (v.running) cancelAnimationFrame(v.raf);
      v.running = false;
    };
  }, []);
  const r = R.current;
  return (
    <div
      ref={(el) => {
        r.layer = el;
      }}
      className="instruments-works"
      data-mode="off"
      aria-hidden
    >
      <div
        className="instruments-works-card"
        onPointerEnter={() => {
          sim.current.hover = 1.6;
        }}
        onPointerLeave={() => {
          sim.current.hover = 1;
        }}
      >
        <svg
          viewBox="0 0 1000 620"
          role="img"
          aria-label="The Eisen Clearing Works: a dispatch turret seats container agents into workcells, a dual-key assay press stamps every job, and chutes settle the work into client vaults."
        >
          {/* the card frame and title block */}
          <rect
            x={10}
            y={10}
            width={980}
            height={600}
            rx={6}
            fill="none"
            stroke={INK}
            strokeOpacity={0.22}
          />
          <rect
            x={16}
            y={16}
            width={968}
            height={588}
            rx={4}
            fill="none"
            stroke={INK}
            strokeOpacity={0.08}
          />
          <text className="works-fig" x={30} y={44}>
            Fig. II
          </text>
          <text className="works-title" x={88} y={44}>
            THE EISEN CLEARING WORKS
          </text>
          {[0, 1, 2].map((i) => (
            <text
              key={i}
              ref={(el) => {
                r.readout[i] = el;
              }}
              className="works-readout"
              x={970}
              y={36 + i * 17}
              textAnchor="end"
            />
          ))}
          <text className="works-hint" x={30} y={596}>
            every job is seated, assayed, stamped and settled — the books
            balance each cycle
          </text>

          <g
            ref={(el) => {
              r.cam = el;
            }}
          >
            {/* substrate: pillars, the floor slab and its ledger grid */}
            <g
              ref={(el) => {
                r.vaults[0] = el;
              }}
            >
              {PILLARS.map(([x, z]) => (
                <g key={`${x}:${z}`}>
                  <Cyl x={x} z={z} y0={-1.0} y1={-0.2} r={0.17} t={LO} />
                  <Cyl x={x} z={z} y0={-1.08} y1={-1.0} r={0.26} t={LO} />
                </g>
              ))}
            </g>
            <Box
              x0={FLOOR.x0}
              x1={FLOOR.x1}
              y0={FLOOR.y0}
              y1={0}
              z0={FLOOR.z0}
              z1={FLOOR.z1}
              t={LO}
            />
            <g
              ref={(el) => {
                r.vaults[1] = el;
              }}
            >
              <path
                d={gridPath()}
                fill="none"
                stroke={MID.top}
                strokeWidth={0.6}
                opacity={0.35}
              />
            </g>

            {/* the dispatch floor: turret, magazine, queue and workcells */}
            <g
              ref={(el) => {
                r.dispatch = el;
              }}
            >
              {Array.from({ length: 4 }, (_, i) => (
                <Box
                  key={i}
                  x0={MAG.x - 0.16}
                  x1={MAG.x + 0.16}
                  y0={i * 0.3}
                  y1={i * 0.3 + 0.28}
                  z0={MAG.z - 0.16}
                  z1={MAG.z + 0.16}
                  t={MID}
                />
              ))}
              {Array.from({ length: QUEUE_MAX }, (_, i) => (
                <g
                  key={i}
                  ref={(el) => {
                    r.chips[i] = el;
                  }}
                  opacity={0}
                >
                  <Box
                    x0={QUEUE.x - 0.19}
                    x1={QUEUE.x + 0.19}
                    y0={0.06 + i * 0.17}
                    y1={0.06 + i * 0.17 + 0.09}
                    z0={QUEUE.z - 0.14}
                    z1={QUEUE.z + 0.14}
                    t={i === 0 ? HI : MID}
                  />
                </g>
              ))}
              {Array.from({ length: CELLS }, (_, c) => {
                const [x, z] = cellPos(c);
                return (
                  <g key={c}>
                    <Box
                      x0={x - 0.28}
                      x1={x + 0.28}
                      y0={0}
                      y1={0.07}
                      z0={z - 0.28}
                      z1={z + 0.28}
                      t={MID}
                    />
                    <polygon
                      points={pts([
                        [x - 0.19, 0.071, z - 0.19],
                        [x + 0.19, 0.071, z - 0.19],
                        [x + 0.19, 0.071, z + 0.19],
                        [x - 0.19, 0.071, z + 0.19],
                      ])}
                      fill={LO.right}
                    />
                  </g>
                );
              })}
              {Array.from({ length: CELLS }, (_, c) => (
                <g
                  key={c}
                  ref={(el) => {
                    r.carts[c] = el;
                  }}
                  opacity={0}
                >
                  <Cartridge bay={c < ENG_CELLS ? "eng" : "co"} />
                </g>
              ))}
              <Cyl x={TUR.x} z={TUR.z} y0={0} y1={0.16} r={0.5} t={LO} />
              <Cyl x={TUR.x} z={TUR.z} y0={0.16} y1={0.98} r={0.16} t={HI} />
              <polygon
                ref={(el) => {
                  r.arm = el;
                }}
                points=""
                fill={HI.top}
                stroke={HI.line}
                strokeWidth={LINE_W}
              />
              <Cyl x={TUR.x} z={TUR.z} y0={0.98} y1={1.08} r={0.2} t={HI} />
              <ellipse
                ref={(el) => {
                  r.beacon = el;
                }}
                cx={px(TUR.x, 1.12, TUR.z)[0]}
                cy={px(TUR.x, 1.12, TUR.z)[1]}
                rx={4.5}
                ry={2.8}
                fill={BLUE}
              />
            </g>

            {/* the gate: rail, audit ledger, press and the review siding */}
            <g
              ref={(el) => {
                r.gate[0] = el;
              }}
            >
              {[-1, 0.35, 1.3].map((x) => (
                <Box
                  key={x}
                  x0={x - 0.05}
                  x1={x + 0.05}
                  y0={0}
                  y1={0.24}
                  z0={RAIL.z - 0.16}
                  z1={RAIL.z + 0.16}
                  t={LO}
                />
              ))}
              {[RAIL.z - 0.2, RAIL.z + 0.2].map((z) => (
                <Box
                  key={z}
                  x0={RAIL.x0}
                  x1={RAIL.x1}
                  y0={0.24}
                  y1={0.3}
                  z0={z - 0.03}
                  z1={z + 0.03}
                  t={MID}
                />
              ))}
              <path
                d={rulerPath()}
                fill="none"
                stroke={INK}
                strokeWidth={0.6}
                opacity={0.4}
              />
              <Box
                x0={AUDIT.x - 0.26}
                x1={AUDIT.x + 0.26}
                y0={0}
                y1={0.14}
                z0={AUDIT.z - 0.26}
                z1={AUDIT.z + 0.26}
                t={LO}
              />
              <Cyl x={AUDIT.x} z={AUDIT.z} y0={0.14} y1={0.32} r={0.2} t={HI} />
              <line
                ref={(el) => {
                  r.spool = el;
                }}
                stroke={INK}
                strokeWidth={1.2}
              />
              <text
                className="works-counter"
                ref={(el) => {
                  r.counter = el;
                }}
                x={px(AUDIT.x, 0, AUDIT.z + 0.45)[0]}
                y={px(AUDIT.x, 0, AUDIT.z + 0.45)[1]}
              >
                000
              </text>
              <polygon
                points={pts([
                  [AUDIT.x + 0.14, 0.26, AUDIT.z + 0.1],
                  [PRESS.x - 0.1, 0.9, RAIL.z - 0.44],
                  [PRESS.x - 0.1, 0.84, RAIL.z - 0.44],
                  [AUDIT.x + 0.14, 0.2, AUDIT.z + 0.1],
                ])}
                fill={INK}
                opacity={0.25}
              />
            </g>

            {/* pallets ride over everything on the floor, under the press frame */}
            {SCHEDULE.map((_, i) => (
              <g
                key={i}
                ref={(el) => {
                  r.pallets[i] = el;
                }}
                opacity={0}
              >
                <Pallet />
              </g>
            ))}

            <g
              className="works-press"
              ref={(el) => {
                r.gate[1] = el;
              }}
            >
              {[RAIL.z - 0.5, RAIL.z + 0.5].map((z) => (
                <Box
                  key={z}
                  x0={PRESS.x - 0.08}
                  x1={PRESS.x + 0.08}
                  y0={0}
                  y1={1.2}
                  z0={z - 0.08}
                  z1={z + 0.08}
                  t={MID}
                />
              ))}
              <g
                ref={(el) => {
                  r.keyA = el;
                }}
              >
                <Box
                  x0={PRESS.x - 0.05}
                  x1={PRESS.x + 0.05}
                  y0={0.9}
                  y1={0.98}
                  z0={RAIL.z - 0.46}
                  z1={RAIL.z - 0.2}
                  t={HI}
                />
              </g>
              <g
                ref={(el) => {
                  r.keyB = el;
                }}
              >
                <Box
                  x0={PRESS.x - 0.05}
                  x1={PRESS.x + 0.05}
                  y0={0.9}
                  y1={0.98}
                  z0={RAIL.z + 0.2}
                  z1={RAIL.z + 0.46}
                  t={HI}
                />
              </g>
              <g
                ref={(el) => {
                  r.head = el;
                }}
              >
                <Box
                  x0={PRESS.x - 0.16}
                  x1={PRESS.x + 0.16}
                  y0={0.78}
                  y1={1.1}
                  z0={RAIL.z - 0.16}
                  z1={RAIL.z + 0.16}
                  t={HI}
                />
                <polygon
                  points={pts([
                    [PRESS.x - 0.09, 0.78, RAIL.z - 0.09],
                    [PRESS.x + 0.09, 0.78, RAIL.z - 0.09],
                    [PRESS.x + 0.09, 0.78, RAIL.z + 0.09],
                    [PRESS.x - 0.09, 0.78, RAIL.z + 0.09],
                  ])}
                  fill={SEAL}
                  opacity={0.5}
                />
              </g>
              <Box
                x0={PRESS.x - 0.14}
                x1={PRESS.x + 0.14}
                y0={1.2}
                y1={1.4}
                z0={RAIL.z - 0.58}
                z1={RAIL.z + 0.58}
                t={MID}
              />
              <ellipse
                ref={(el) => {
                  r.gateLamp = el;
                }}
                cx={px(PRESS.x, 1.44, RAIL.z + 0.58)[0]}
                cy={px(PRESS.x, 1.44, RAIL.z + 0.58)[1]}
                rx={4}
                ry={2.6}
                fill={SEAL}
              />
            </g>
            <ellipse
              ref={(el) => {
                r.seal = el;
              }}
              rx={16}
              ry={9}
              fill="none"
              stroke={SEAL}
              strokeWidth={1.6}
              opacity={0}
            />

            <g
              className="works-siding"
              ref={(el) => {
                r.gate[2] = el;
              }}
            >
              <Box
                x0={SIDING.x - 0.3}
                x1={SIDING.x + 0.3}
                y0={0}
                y1={0.26}
                z0={SIDING.z - 0.3}
                z1={SIDING.z + 0.3}
                t={LO}
              />
              <Cyl
                x={SIDING.x + 0.22}
                z={SIDING.z + 0.22}
                y0={0.26}
                y1={0.72}
                r={0.03}
                t={MID}
              />
              <ellipse
                ref={(el) => {
                  r.reviewLamp = el;
                }}
                cx={px(SIDING.x + 0.22, 0.76, SIDING.z + 0.22)[0]}
                cy={px(SIDING.x + 0.22, 0.76, SIDING.z + 0.22)[1]}
                rx={3.6}
                ry={2.3}
                fill={AMBER}
                opacity={0.12}
              />
            </g>

            {/* the chute manifold and the client vaults */}
            <g
              className="works-vaults"
              ref={(el) => {
                r.vaults[2] = el;
              }}
            >
              {VZ.map((_, vi) => (
                <path
                  key={vi}
                  d={chutePath(vi)}
                  fill="none"
                  stroke={MID.top}
                  strokeWidth={1.1}
                  opacity={0.5}
                />
              ))}
              {VZ.map((vz, vi) => (
                <g key={vi}>
                  <Box
                    x0={SAFE.x0}
                    x1={SAFE.x1}
                    y0={0}
                    y1={SAFE_H[vi]}
                    z0={vz - SAFE_D[vi] / 2}
                    z1={vz + SAFE_D[vi] / 2}
                    t={vi === 0 ? HI : MID}
                  />
                  <SafeFront v={vi} />
                  <ellipse
                    ref={(el) => {
                      r.vaultLamps[vi] = el;
                    }}
                    cx={px((SAFE.x0 + SAFE.x1) / 2, SAFE_H[vi] + 0.08, vz)[0]}
                    cy={px((SAFE.x0 + SAFE.x1) / 2, SAFE_H[vi] + 0.08, vz)[1]}
                    rx={3.6}
                    ry={2.3}
                    fill={AMBER}
                    opacity={0.1}
                  />
                </g>
              ))}
            </g>

            {/* the engineer's plate labels */}
            <Label
              text="dispatch turret"
              at={[TUR.x, 1.1, TUR.z]}
              lx={236}
              ly={96}
            />
            <Label
              text="assay press"
              at={[PRESS.x, 1.42, RAIL.z]}
              lx={648}
              ly={88}
            />
            <Label
              text="audit ledger"
              at={[AUDIT.x, 0.34, AUDIT.z]}
              lx={760}
              ly={176}
            />
            <Label
              text="client vaults"
              at={[SAFE.x0 + 0.4, SAFE_H[0] + 0.04, VZ[0]]}
              lx={906}
              ly={130}
              anchor="end"
            />
            <Label
              text="review siding"
              at={[SIDING.x, 0.4, SIDING.z]}
              lx={492}
              ly={520}
            />
            <Label
              text="substrate"
              at={[PILLARS[3][0], -0.7, PILLARS[3][1]]}
              lx={210}
              ly={548}
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
