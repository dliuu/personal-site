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
const S = 60;
const CX = 500;
const CY = 288;
/** The drawing window: the camera group is clipped to it, so zoomed beats
 * never cover the title row or the readout band. */
const CLIP = { x: 18, y: 58, w: 964, h: 492 };
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
      {/* a strap over the cargo */}
      <polygon
        points={pts(
          [
            [-0.1, 0.228, -0.02],
            [0.1, 0.228, -0.02],
            [0.1, 0.228, 0.02],
            [-0.1, 0.228, 0.02],
          ],
          rel,
        )}
        fill={BLUE}
        opacity={0.45}
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
      {/* vent slots on the lid */}
      {[-0.05, 0.04].map((d) => (
        <polygon
          key={d}
          points={pts(
            [
              [-0.1, 0.412, d],
              [0.1, 0.412, d],
              [0.1, 0.412, d + 0.025],
              [-0.1, 0.412, d + 0.025],
            ],
            rel,
          )}
          fill={LO.right}
          opacity={0.9}
        />
      ))}
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

function chutePath(v: number, lift = 0): string {
  const [ax, ay] = px(2.45, RAIL.top + lift, RAIL.z);
  const [mx, my] = px(3.1, 0.18 + lift, lerp(RAIL.z, VZ[v], 0.6));
  const [bx, by] = px(HATCH_X, 0.03 + lift, VZ[v]);
  return `M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
}

/** A circle lying on the floor plane (y = h), as a projected polygon. */
function floorCircle(
  cx: number,
  cz: number,
  r: number,
  h = 0,
  segs = 16,
): string {
  const out: [number, number, number][] = [];
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    out.push([cx + r * Math.cos(a), h, cz + r * Math.sin(a)]);
  }
  return pts(out);
}

/** Knurl ticks around a drum's top rim (the turret base reads as machined). */
function knurlPath(
  cx: number,
  cz: number,
  r: number,
  y: number,
  n = 28,
): string {
  const seg: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const [ax, ay] = px(cx + r * Math.cos(a), y, cz + r * Math.sin(a));
    const [bx, by] = px(cx + r * Math.cos(a), y - 0.07, cz + r * Math.sin(a));
    seg.push(
      `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`,
    );
  }
  return seg.join(" ");
}

/** The divert track from the press out to the review siding and back. */
function sidingTrack(off: number): string {
  const [ax, ay] = px(PRESS.x + off, RAIL.top, RAIL.z + 0.2);
  const [mx, my] = px(
    lerp(PRESS.x, SIDING.x, 0.5) + off,
    RAIL.top,
    lerp(RAIL.z, SIDING.z, 0.7),
  );
  const [bx, by] = px(SIDING.x + off, 0.28, SIDING.z - 0.2);
  return `M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
}

/** Corner screws: a ring and a slot dot, on the floor plane. */
function Screw({ x, z, h = 0.005 }: { x: number; z: number; h?: number }) {
  return (
    <g>
      <polygon
        points={floorCircle(x, z, 0.055, h, 12)}
        fill="none"
        stroke={MID.top}
        strokeWidth={0.7}
        opacity={0.7}
      />
      <polygon
        points={floorCircle(x, z, 0.018, h, 8)}
        fill={MID.top}
        opacity={0.7}
      />
    </g>
  );
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
        {/* the locking wheel's spokes */}
        {[0, 1, 2].map((k) => {
          const a = (k / 3) * Math.PI;
          const [sx, sy] = px(
            cx + 0.2 * Math.cos(a),
            h * 0.52 + 0.2 * Math.sin(a),
            zf,
          );
          const [ex, ey] = px(
            cx - 0.2 * Math.cos(a),
            h * 0.52 - 0.2 * Math.sin(a),
            zf,
          );
          return (
            <line
              key={k}
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke={AMBER}
              strokeWidth={0.9}
              opacity={0.7}
            />
          );
        })}
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
      {/* hinges on the door's left edge, rivets down the right */}
      {[0.32, 0.6].map((f) => {
        const hf = boxFaces(
          cx - 0.26,
          cx - 0.2,
          h * f,
          h * f + 0.07,
          zf,
          zf + 0.03,
        );
        return (
          <g key={f}>
            <polygon
              points={hf.right}
              fill={HI.top}
              stroke={LO.line}
              strokeWidth={0.7}
            />
            <polygon
              points={hf.left}
              fill={HI.left}
              stroke={LO.line}
              strokeWidth={0.7}
            />
            <polygon
              points={hf.top}
              fill={HI.top}
              stroke={LO.line}
              strokeWidth={0.7}
            />
          </g>
        );
      })}
      {[0.2, 0.4, 0.6].map((f) => (
        <polygon
          key={f}
          points={faceCircle(SAFE.x0 + 0.08, h * f, zf, 0.018, 8)}
          fill={MID.top}
          opacity={0.8}
        />
      ))}
      {/* a step at the hatch, where the chute hands its pallet in */}
      <Box
        x0={SAFE.x0 - 0.18}
        x1={SAFE.x0}
        y0={0}
        y1={0.09}
        z0={VZ[v] - 0.16}
        z1={VZ[v] + 0.16}
        t={LO}
      />
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
  counterweight: SVGPolygonElement | null;
  /** The grabber hanging from the arm tip, shown while a cartridge is carried. */
  hang: SVGGElement | null;
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
    counterweight: null,
    hang: null,
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
      // The counterweight rides opposite the arm; the grabber hangs from the
      // tip and only carries a cartridge in the beat before a seat.
      r.counterweight?.setAttribute(
        "points",
        pts([
          [
            TUR.x + n[0] * 0.1 - Math.cos(a) * 0.18,
            ARM_Y + 0.07,
            TUR.z + n[1] * 0.1 - Math.sin(a) * 0.18,
          ],
          [
            TUR.x + n[0] * 0.1 - Math.cos(a) * 0.46,
            ARM_Y + 0.07,
            TUR.z + n[1] * 0.1 - Math.sin(a) * 0.46,
          ],
          [
            TUR.x - n[0] * 0.1 - Math.cos(a) * 0.46,
            ARM_Y - 0.1,
            TUR.z - n[1] * 0.1 - Math.sin(a) * 0.46,
          ],
          [
            TUR.x - n[0] * 0.1 - Math.cos(a) * 0.18,
            ARM_Y - 0.1,
            TUR.z - n[1] * 0.1 - Math.sin(a) * 0.18,
          ],
        ]),
      );
      const carrying = SCHEDULE.some((j) => u >= j.seat - 0.35 && u < j.seat);
      if (r.hang) {
        const [hx, hy] = px(tip[0], ARM_Y, tip[1]);
        r.hang.setAttribute(
          "transform",
          `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`,
        );
        r.hang.setAttribute("opacity", carrying ? "1" : "0");
      }
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
          {/* the card frame and title block: chrome stays outside the clip,
              so no zoomed beat ever covers it */}
          <defs>
            <clipPath id="works-clip">
              <rect x={CLIP.x} y={CLIP.y} width={CLIP.w} height={CLIP.h} />
            </clipPath>
          </defs>
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
          {(
            [
              [22, 22, 1, 1],
              [978, 22, -1, 1],
              [22, 598, 1, -1],
              [978, 598, -1, -1],
            ] as const
          ).map(([tx, ty, sx, sy]) => (
            <path
              key={`${tx}:${ty}`}
              d={`M ${tx + 14 * sx} ${ty} L ${tx} ${ty} L ${tx} ${ty + 14 * sy}`}
              fill="none"
              stroke={INK}
              strokeOpacity={0.3}
              strokeWidth={1}
            />
          ))}
          <text className="works-fig" x={34} y={44}>
            Fig. II
          </text>
          <text className="works-title" x={92} y={44}>
            THE EISEN CLEARING WORKS
          </text>
          <text className="works-subtitle" x={966} y={44} textAnchor="end">
            agent orchestration · compliance · settlement
          </text>
          <line
            x1={22}
            y1={CLIP.y - 2}
            x2={978}
            y2={CLIP.y - 2}
            stroke={INK}
            strokeOpacity={0.12}
          />
          <line
            x1={22}
            y1={CLIP.y + CLIP.h + 2}
            x2={978}
            y2={CLIP.y + CLIP.h + 2}
            stroke={INK}
            strokeOpacity={0.12}
          />
          {[0, 1, 2].map((i) => (
            <text
              key={i}
              ref={(el) => {
                r.readout[i] = el;
              }}
              className="works-readout"
              x={966}
              y={566 + i * 15}
              textAnchor="end"
            />
          ))}
          <text className="works-hint" x={34} y={572}>
            every job is seated, assayed, stamped and settled —
          </text>
          <text className="works-hint" x={34} y={592}>
            the books balance each cycle
          </text>

          <g clipPath="url(#works-clip)">
            <g
              ref={(el) => {
                r.cam = el;
              }}
            >
              {/* substrate: pillars, the floor slab and its ledger grid */}
              <ellipse
                cx={CX}
                cy={CY + 3.95 * 0.5 * S + 1.08 * S}
                rx={7.4 * 0.866 * S}
                ry={2.1 * S * 0.5}
                fill="#000309"
                opacity={0.4}
              />
              <g
                ref={(el) => {
                  r.vaults[0] = el;
                }}
              >
                {PILLARS.map(([x, z]) => (
                  <g key={`${x}:${z}`}>
                    <Cyl x={x} z={z} y0={-1.0} y1={-0.2} r={0.17} t={LO} />
                    {/* seam collar and foot flange, with anchor bolts */}
                    <Cyl x={x} z={z} y0={-0.32} y1={-0.26} r={0.21} t={LO} />
                    <Cyl x={x} z={z} y0={-1.08} y1={-1.0} r={0.26} t={LO} />
                    <polygon
                      points={floorCircle(x, z, 0.34, -1.08, 14)}
                      fill={LO.right}
                      stroke={LO.line}
                      strokeWidth={0.7}
                    />
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
                {/* groove inset, corner screws and the hatch slots the chutes feed */}
                <polygon
                  points={pts([
                    [FLOOR.x0 + 0.22, 0.002, FLOOR.z0 + 0.22],
                    [FLOOR.x1 - 0.22, 0.002, FLOOR.z0 + 0.22],
                    [FLOOR.x1 - 0.22, 0.002, FLOOR.z1 - 0.22],
                    [FLOOR.x0 + 0.22, 0.002, FLOOR.z1 - 0.22],
                  ])}
                  fill="none"
                  stroke={LO.line}
                  strokeWidth={0.8}
                  opacity={0.8}
                />
                {(
                  [
                    [FLOOR.x0 + 0.34, FLOOR.z0 + 0.34],
                    [FLOOR.x1 - 0.34, FLOOR.z0 + 0.34],
                    [FLOOR.x0 + 0.34, FLOOR.z1 - 0.34],
                    [FLOOR.x1 - 0.34, FLOOR.z1 - 0.34],
                  ] as const
                ).map(([sx, sz]) => (
                  <Screw key={`${sx}:${sz}`} x={sx} z={sz} />
                ))}
                {VZ.map((vz) => (
                  <g key={vz}>
                    <polygon
                      points={pts([
                        [HATCH_X - 0.16, 0.004, vz - 0.13],
                        [HATCH_X + 0.1, 0.004, vz - 0.13],
                        [HATCH_X + 0.1, 0.004, vz + 0.13],
                        [HATCH_X - 0.16, 0.004, vz + 0.13],
                      ])}
                      fill="#0a0c11"
                      stroke={MID.top}
                      strokeWidth={0.7}
                      opacity={0.9}
                    />
                  </g>
                ))}
              </g>

              {/* the dispatch floor: turret, magazine, queue and workcells */}
              <g
                ref={(el) => {
                  r.dispatch = el;
                }}
              >
                {/* painted bay boundaries on the floor */}
                {[1, -1].map((bay) => (
                  <polygon
                    key={bay}
                    points={pts([
                      [-3.85, 0.003, bay * 0.68],
                      [-1.45, 0.003, bay * 0.68],
                      [-1.45, 0.003, bay * 2.32],
                      [-3.85, 0.003, bay * 2.32],
                    ])}
                    fill="none"
                    stroke={bay > 0 ? BLUE : AMBER}
                    strokeWidth={0.7}
                    strokeDasharray="5 4"
                    opacity={0.3}
                  />
                ))}
                {/* the cartridge magazine: a rack of spares between two posts */}
                <Box
                  x0={MAG.x - 0.26}
                  x1={MAG.x + 0.26}
                  y0={0}
                  y1={0.06}
                  z0={MAG.z - 0.26}
                  z1={MAG.z + 0.26}
                  t={LO}
                />
                {([-0.22, 0.22] as const).map((d) => (
                  <Cyl
                    key={d}
                    x={MAG.x + d}
                    z={MAG.z + d}
                    y0={0.06}
                    y1={1.32}
                    r={0.03}
                    t={MID}
                  />
                ))}
                {Array.from({ length: 4 }, (_, i) => (
                  <Box
                    key={i}
                    x0={MAG.x - 0.16}
                    x1={MAG.x + 0.16}
                    y0={0.06 + i * 0.3}
                    y1={0.06 + i * 0.3 + 0.28}
                    z0={MAG.z - 0.16}
                    z1={MAG.z + 0.16}
                    t={MID}
                  />
                ))}
                {/* the queue stand: a post, a slotted sign, the waiting tickets */}
                <Cyl
                  x={QUEUE.x + 0.4}
                  z={QUEUE.z + 0.35}
                  y0={0}
                  y1={1.5}
                  r={0.025}
                  t={MID}
                />
                <Box
                  x0={QUEUE.x + 0.37}
                  x1={QUEUE.x + 0.43}
                  y0={1.5}
                  y1={1.66}
                  z0={QUEUE.z + 0.13}
                  z1={QUEUE.z + 0.57}
                  t={HI}
                />
                <Box
                  x0={QUEUE.x - 0.24}
                  x1={QUEUE.x + 0.24}
                  y0={0}
                  y1={0.05}
                  z0={QUEUE.z - 0.19}
                  z1={QUEUE.z + 0.19}
                  t={LO}
                />
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
                {/* the turret: knurled base drum, seamed column, arm with
                  counterweight and a grabber that carries the next cartridge */}
                <Cyl x={TUR.x} z={TUR.z} y0={0} y1={0.16} r={0.5} t={LO} />
                <path
                  d={knurlPath(TUR.x, TUR.z, 0.5, 0.16)}
                  fill="none"
                  stroke={MID.top}
                  strokeWidth={0.6}
                  opacity={0.6}
                />
                <polygon
                  points={floorCircle(TUR.x, TUR.z, 0.36, 0.165, 20)}
                  fill="none"
                  stroke={MID.top}
                  strokeWidth={0.7}
                  opacity={0.5}
                />
                <Cyl x={TUR.x} z={TUR.z} y0={0.16} y1={0.98} r={0.16} t={HI} />
                <Cyl x={TUR.x} z={TUR.z} y0={0.52} y1={0.57} r={0.19} t={MID} />
                <polygon
                  ref={(el) => {
                    r.counterweight = el;
                  }}
                  points=""
                  fill={MID.left}
                  stroke={MID.line}
                  strokeWidth={LINE_W}
                />
                <polygon
                  ref={(el) => {
                    r.arm = el;
                  }}
                  points=""
                  fill={HI.top}
                  stroke={HI.line}
                  strokeWidth={LINE_W}
                />
                <g
                  ref={(el) => {
                    r.hang = el;
                  }}
                  opacity={0}
                >
                  <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={0.3 * S}
                    stroke={INK}
                    strokeWidth={0.8}
                    opacity={0.7}
                  />
                  <polygon
                    points={pts(
                      [
                        [-0.12, -0.3, -0.12],
                        [0.12, -0.3, -0.12],
                        [0.12, -0.3, 0.12],
                        [-0.12, -0.3, 0.12],
                      ],
                      rel,
                    )}
                    fill={HI.top}
                    stroke={HI.line}
                    strokeWidth={0.8}
                  />
                </g>
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
                  <g key={x}>
                    <Box
                      x0={x - 0.12}
                      x1={x + 0.12}
                      y0={0}
                      y1={0.03}
                      z0={RAIL.z - 0.2}
                      z1={RAIL.z + 0.2}
                      t={LO}
                    />
                    <Box
                      x0={x - 0.05}
                      x1={x + 0.05}
                      y0={0.03}
                      y1={0.24}
                      z0={RAIL.z - 0.16}
                      z1={RAIL.z + 0.16}
                      t={LO}
                    />
                  </g>
                ))}
                {/* cross-ties under the running surface */}
                {[-0.7, -0.1, 0.7, 1.05, 1.95].map((x) => (
                  <Box
                    key={x}
                    x0={x - 0.03}
                    x1={x + 0.03}
                    y0={0.21}
                    y1={0.24}
                    z0={RAIL.z - 0.2}
                    z1={RAIL.z + 0.2}
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
                <Cyl
                  x={AUDIT.x}
                  z={AUDIT.z}
                  y0={0.14}
                  y1={0.32}
                  r={0.2}
                  t={HI}
                />
                <line
                  ref={(el) => {
                    r.spool = el;
                  }}
                  stroke={INK}
                  strokeWidth={1.2}
                />
                {/* the strike counter: an engraved plate on the plinth's front */}
                <Box
                  x0={AUDIT.x - 0.17}
                  x1={AUDIT.x + 0.17}
                  y0={0.15}
                  y1={0.34}
                  z0={AUDIT.z + 0.26}
                  z1={AUDIT.z + 0.3}
                  t={LO}
                />
                <text
                  className="works-counter"
                  textAnchor="middle"
                  ref={(el) => {
                    r.counter = el;
                  }}
                  x={px(AUDIT.x, 0.21, AUDIT.z + 0.31)[0]}
                  y={px(AUDIT.x, 0.21, AUDIT.z + 0.31)[1]}
                >
                  000
                </text>
                {/* the tape: spool, over the guide post, onto the takeup reel */}
                <Cyl
                  x={lerp(AUDIT.x, PRESS.x, 0.55)}
                  z={lerp(AUDIT.z, RAIL.z - 0.44, 0.55)}
                  y0={0}
                  y1={0.56}
                  r={0.025}
                  t={MID}
                />
                <Cyl
                  x={PRESS.x - 0.14}
                  z={RAIL.z - 0.52}
                  y0={0}
                  y1={0.12}
                  r={0.09}
                  t={MID}
                />
                <polygon
                  points={pts([
                    [AUDIT.x + 0.14, 0.26, AUDIT.z + 0.1],
                    [
                      lerp(AUDIT.x, PRESS.x, 0.55) + 0.02,
                      0.56,
                      lerp(AUDIT.z, RAIL.z - 0.44, 0.55),
                    ],
                    [PRESS.x - 0.1, 0.9, RAIL.z - 0.44],
                    [PRESS.x - 0.1, 0.84, RAIL.z - 0.44],
                    [
                      lerp(AUDIT.x, PRESS.x, 0.55) + 0.02,
                      0.5,
                      lerp(AUDIT.z, RAIL.z - 0.44, 0.55),
                    ],
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
                  <g key={z}>
                    <Box
                      x0={PRESS.x - 0.13}
                      x1={PRESS.x + 0.13}
                      y0={0}
                      y1={0.05}
                      z0={z - 0.13}
                      z1={z + 0.13}
                      t={LO}
                    />
                    <Box
                      x0={PRESS.x - 0.08}
                      x1={PRESS.x + 0.08}
                      y0={0.05}
                      y1={1.2}
                      z0={z - 0.08}
                      z1={z + 0.08}
                      t={MID}
                    />
                  </g>
                ))}
                {/* guide rods the head runs on */}
                {[RAIL.z - 0.24, RAIL.z + 0.24].map((z) => (
                  <Cyl
                    key={z}
                    x={PRESS.x}
                    z={z}
                    y0={0.6}
                    y1={1.2}
                    r={0.022}
                    t={HI}
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
                {/* beam bolts and the lamp housing */}
                {[
                  RAIL.z - 0.44,
                  RAIL.z - 0.15,
                  RAIL.z + 0.15,
                  RAIL.z + 0.44,
                ].map((z) => (
                  <polygon
                    key={z}
                    points={floorCircle(PRESS.x, z, 0.03, 1.402, 8)}
                    fill={HI.top}
                    opacity={0.8}
                  />
                ))}
                <Box
                  x0={PRESS.x - 0.06}
                  x1={PRESS.x + 0.06}
                  y0={1.4}
                  y1={1.5}
                  z0={RAIL.z + 0.5}
                  z1={RAIL.z + 0.62}
                  t={HI}
                />
                <ellipse
                  ref={(el) => {
                    r.gateLamp = el;
                  }}
                  cx={px(PRESS.x, 1.52, RAIL.z + 0.56)[0]}
                  cy={px(PRESS.x, 1.52, RAIL.z + 0.56)[1]}
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
                {/* the divert track out and back, then the inspection platform */}
                {[-0.04, 0.04].map((off) => (
                  <path
                    key={off}
                    d={sidingTrack(off)}
                    fill="none"
                    stroke={MID.right}
                    strokeWidth={1}
                    opacity={0.55}
                  />
                ))}
                <Box
                  x0={SIDING.x - 0.3}
                  x1={SIDING.x + 0.3}
                  y0={0}
                  y1={0.26}
                  z0={SIDING.z - 0.3}
                  z1={SIDING.z + 0.3}
                  t={LO}
                />
                <Box
                  x0={SIDING.x - 0.22}
                  x1={SIDING.x + 0.02}
                  y0={0.26}
                  y1={0.38}
                  z0={SIDING.z - 0.24}
                  z1={SIDING.z - 0.06}
                  t={MID}
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
                {/* the outlet nozzle, then each chute as a two-rail trough */}
                <Box
                  x0={2.3}
                  x1={2.52}
                  y0={0.24}
                  y1={0.42}
                  z0={RAIL.z - 0.14}
                  z1={RAIL.z + 0.14}
                  t={HI}
                />
                {VZ.map((_, vi) => (
                  <g key={vi}>
                    <path
                      d={chutePath(vi)}
                      fill="none"
                      stroke={LO.line}
                      strokeWidth={2.4}
                      opacity={0.7}
                    />
                    <path
                      d={chutePath(vi, 0.035)}
                      fill="none"
                      stroke={MID.top}
                      strokeWidth={0.9}
                      opacity={0.7}
                    />
                  </g>
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

              {/* the engineer's plate labels (band only: captions carry the plate) */}
              <Label
                text="ticket queue"
                at={[QUEUE.x + 0.4, 1.62, QUEUE.z + 0.35]}
                lx={92}
                ly={92}
              />
              <Label
                text="cartridge magazine"
                at={[MAG.x, 1.3, MAG.z]}
                lx={292}
                ly={74}
              />
              <Label
                text="dispatch turret"
                at={[TUR.x, 1.1, TUR.z]}
                lx={168}
                ly={176}
              />
              <Label
                text="assay press"
                at={[PRESS.x, 1.44, RAIL.z]}
                lx={632}
                ly={96}
              />
              <Label
                text="audit ledger"
                at={[AUDIT.x, 0.34, AUDIT.z]}
                lx={812}
                ly={166}
              />
              <Label
                text="client vaults"
                at={[SAFE.x0 + 0.4, SAFE_H[1] + 0.04, VZ[1]]}
                lx={930}
                ly={266}
                anchor="end"
              />
              <Label
                text="review siding"
                at={[SIDING.x, 0.4, SIDING.z]}
                lx={596}
                ly={508}
              />
              <Label
                text="substrate"
                at={[PILLARS[3][0], -0.7, PILLARS[3][1]]}
                lx={238}
                ly={492}
              />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
