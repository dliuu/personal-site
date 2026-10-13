"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  Object3D,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import {
  CANDLES,
  SLIPS,
  STATIONS,
  candleSeries,
  carouselUp,
  equityCurve,
  flagDown,
  lineDrawn,
  slipU,
  stamped,
  stationU,
  strike,
  tapeU,
  tradeIndices,
  volumeSeries,
} from "@/lib/trading";
import { useDeviceStore } from "@/store/useDeviceStore";
import { Callouts } from "../Callouts";
import { chapters } from "../chapters";
import type { Project } from "../content";
import { plateState } from "../plateState";
import { siteMaterial } from "../siteParts";
import { useProjectStore } from "../useProjectStore";

/**
 * The trading agents, the candle ridge and the four stations: the market as
 * a ridge of candles with its volume beneath, against an engraved chart
 * board on a bevelled slate plinth, with a red stop lever in its housing
 * at the end. A ticker tape streams data up to the hub of a spoked brass
 * carousel; four agent stations ride it on pedestals, research a lens,
 * strategy a rule, risk a gate that stamps each slip as it passes,
 * execution a hammer that knocks; stamped slips circle on. For the result,
 * pennants land on the traded candles and the run's line draws itself as
 * a tube along the ridge.
 */

const SERIES = candleSeries();
const TRADES = tradeIndices(SERIES);
const EQUITY = equityCurve(SERIES, TRADES);
const VOLUME = volumeSeries(SERIES);
const X0 = -0.9;
const X1 = 0.9;
const BASE_Y = -0.56;
const PRICE_K = 0.65;
const TILT = 0.3;
const CAROUSEL = { x: 0, y: 0.3, z: -0.32, r: 0.55 };
const TAPE_DASHES = 20;
const STILL_TIME = 2;
const C = {
  slate: "#4a4e56",
  slateDark: "#3a3d44",
  up: "#3f9a6a",
  down: "#c0463c",
  brass: "#b08d4f",
  brassDark: "#8a6c3a",
  gold: "#c49a3c",
  red: "#c0463c",
  ink: "#1c2b4b",
  paper: "#f3e9d2",
  board: "#ebe4d3",
  glass: "#9cc4dc",
  volume: "#6f7f99",
};
const PALETTE = chapters.find((c) => c.instrument === "folio")!.palette;

const MIN_LOW = Math.min(...SERIES.map((c) => c.low));
const candleX = (i: number) => X0 + (i / (CANDLES - 1)) * (X1 - X0);
const priceY = (p: number) => BASE_Y + 0.05 + (p - MIN_LOW) * PRICE_K;
const equityY = (e: number) => -0.2 + (e - 1) * 1.0;

/** Callout anchors: the problem beat is docked, then the carousel's rim, then a traded candle. */
const ANCHORS: (Vector3 | null)[] = [
  null,
  new Vector3(CAROUSEL.x - 0.4, CAROUSEL.y - 0.08, CAROUSEL.z + 0.4),
  new Vector3(candleX(TRADES[Math.min(2, TRADES.length - 1)]), 0.15, 0.1),
];

function roundedRect(w: number, h: number, r: number): Shape {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** A flat ribbon along a curve, `width` across, for the ticker tape. */
function ribbon(
  curve: CatmullRomCurve3,
  width: number,
  segments = 48,
): BufferGeometry {
  const frames = curve.computeFrenetFrames(segments, false);
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const p = curve.getPointAt(i / segments);
    const n = frames.binormals[i];
    pos.push(
      p.x + n.x * width * 0.5,
      p.y + n.y * width * 0.5,
      p.z + n.z * width * 0.5,
      p.x - n.x * width * 0.5,
      p.y - n.y * width * 0.5,
      p.z - n.z * width * 0.5,
    );
    if (i < segments) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A pennant: a flat triangle, two-sided. */
function pennant(): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0, 0.07, -0.02, 0, 0, -0.045, 0], 3),
  );
  g.computeVertexNormals();
  return g;
}

/** Instances laid out once. */
function placed(
  geometry: BufferGeometry,
  material: ReturnType<typeof siteMaterial>,
  items: { x: number; y: number; z: number; sy: number; colour?: string }[],
): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, items.length);
  const o = new Object3D();
  const c = new Color();
  items.forEach((it, i) => {
    o.position.set(it.x, it.y, it.z);
    o.scale.set(1, Math.max(1e-3, it.sy), 1);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
    if (it.colour) mesh.setColorAt(i, c.set(it.colour));
  });
  mesh.frustumCulled = false;
  return mesh;
}

export function Trading({ project }: { project: Project }) {
  const g = useMemo(() => {
    const rod = (h: number, r: number) => {
      const c = new CylinderGeometry(r, r, h, 10);
      c.translate(0, h / 2, 0);
      return c;
    };
    const plinth = new ExtrudeGeometry(roundedRect(2.2, 0.95, 0.08), {
      depth: 0.08,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.015,
      bevelSegments: 3,
    });
    plinth.rotateX(-Math.PI / 2);
    // The chart board behind the ridge: price levels across, every fifth candle up.
    const grid: number[] = [];
    const boardZ = -0.16;
    for (let p = 0.4; p <= 2.2; p += 0.2) {
      const y = priceY(p);
      if (y > BASE_Y + 0.62) break;
      grid.push(X0 - 0.06, y, boardZ, X1 + 0.06, y, boardZ);
    }
    for (let i = 0; i < CANDLES; i += 5)
      grid.push(
        candleX(i),
        BASE_Y + 0.02,
        boardZ,
        candleX(i),
        BASE_Y + 0.62,
        boardZ,
      );
    const gridGeo = new BufferGeometry();
    gridGeo.setAttribute("position", new Float32BufferAttribute(grid, 3));
    const tapeCurve = new CatmullRomCurve3([
      new Vector3(-1.02, BASE_Y + 0.02, 0.42),
      new Vector3(-0.85, BASE_Y + 0.2, 0.28),
      new Vector3(-0.55, 0.0, -0.05),
      new Vector3(-0.12, CAROUSEL.y - 0.02, CAROUSEL.z + 0.02),
    ]);
    const runCurve = new CatmullRomCurve3(
      EQUITY.map((e, i) => new Vector3(candleX(i), equityY(e), 0.36)),
    );
    const run = new TubeGeometry(runCurve, (CANDLES - 1) * 2, 0.009, 6, false);
    run.setDrawRange(0, 0);
    return {
      plinth,
      inlay: new BoxGeometry(2.0, 0.006, 0.006),
      inlaySide: new BoxGeometry(0.006, 0.006, 0.78),
      board: new BoxGeometry(X1 - X0 + 0.2, 0.62, 0.012),
      grid: gridGeo,
      body: new BoxGeometry(0.05, 1, 0.05),
      wick: new BoxGeometry(0.008, 1, 0.008),
      volume: new BoxGeometry(0.035, 1, 0.03),
      housing: new BoxGeometry(0.14, 0.08, 0.12),
      slot: new BoxGeometry(0.02, 0.004, 0.08),
      plate: new BoxGeometry(0.08, 0.002, 0.03),
      leverArm: rod(0.26, 0.012),
      knob: new SphereGeometry(0.045, 14, 12),
      spindle: rod(CAROUSEL.y - BASE_Y, 0.02),
      collar: new CylinderGeometry(0.035, 0.035, 0.03, 16),
      gear: new CylinderGeometry(0.09, 0.09, 0.03, 24),
      tooth: new BoxGeometry(0.025, 0.03, 0.02),
      crank: rod(0.1, 0.008),
      hub: new CylinderGeometry(0.06, 0.06, 0.05, 20),
      ring: new TorusGeometry(CAROUSEL.r, 0.014, 10, 72),
      spoke: new BoxGeometry(CAROUSEL.r - 0.06, 0.008, 0.012),
      pedestal: new CylinderGeometry(0.035, 0.04, 0.03, 14),
      nameplate: new BoxGeometry(0.06, 0.002, 0.02),
      lens: new TorusGeometry(0.07, 0.012, 10, 36),
      glass: new CircleGeometry(0.062, 24),
      handle: rod(0.1, 0.01),
      rule: new BoxGeometry(0.22, 0.015, 0.04),
      tick: new BoxGeometry(0.004, 0.016, 0.012),
      post: rod(0.16, 0.01),
      bar: new BoxGeometry(0.17, 0.016, 0.016),
      shaft: rod(0.14, 0.01),
      head: new BoxGeometry(0.08, 0.05, 0.05),
      slip: new BoxGeometry(0.06, 0.002, 0.045),
      stamp: new BoxGeometry(0.02, 0.003, 0.02),
      tape: ribbon(tapeCurve, 0.05),
      tapeCurve,
      dash: new BoxGeometry(0.012, 0.003, 0.03),
      pole: new BoxGeometry(0.008, 0.14, 0.008),
      pennant: pennant(),
      marker: new TorusGeometry(0.03, 0.005, 6, 16),
      run,
    };
  }, []);
  const m = useMemo(
    () => ({
      slate: siteMaterial(C.slate, { roughness: 0.6 }),
      slateDark: siteMaterial(C.slateDark),
      brass: siteMaterial(C.brass, { metalness: 0.5, roughness: 0.4 }),
      brassDark: siteMaterial(C.brassDark, { metalness: 0.5, roughness: 0.45 }),
      candle: siteMaterial("#ffffff"),
      wick: siteMaterial("#2a2d33"),
      volume: siteMaterial(C.volume, { transparent: true, opacity: 0.8 }),
      board: siteMaterial(C.board, { transparent: true, opacity: 0.55 }),
      grid: new LineBasicMaterial({
        color: C.ink,
        transparent: true,
        opacity: 0.25,
      }),
      red: siteMaterial(C.red, {
        emissive: new Color(C.red),
        emissiveIntensity: 0.4,
      }),
      paper: siteMaterial(C.paper, { side: DoubleSide }),
      stamp: siteMaterial(C.red),
      glass: siteMaterial(C.glass, {
        transparent: true,
        opacity: 0.45,
        side: DoubleSide,
      }),
      gold: siteMaterial(C.gold, { side: DoubleSide }),
      ink: siteMaterial(C.ink),
      dash: siteMaterial("#2a2d33"),
    }),
    [],
  );
  const statics = useMemo(
    () => ({
      bodies: placed(
        g.body,
        m.candle,
        SERIES.map((c, i) => ({
          x: candleX(i),
          y: priceY((c.open + c.close) / 2),
          z: 0,
          sy: Math.max(0.012, Math.abs(c.close - c.open) * PRICE_K),
          colour: c.close >= c.open ? C.up : C.down,
        })),
      ),
      wicks: placed(
        g.wick,
        m.wick,
        SERIES.map((c, i) => ({
          x: candleX(i),
          y: priceY((c.high + c.low) / 2),
          z: 0,
          sy: (c.high - c.low) * PRICE_K,
        })),
      ),
      volume: placed(
        g.volume,
        m.volume,
        VOLUME.map((v, i) => ({
          x: candleX(i),
          y: BASE_Y + 0.004 + v * 0.03,
          z: 0.22,
          sy: v * 0.06,
        })),
      ),
      teeth: (() => {
        const mesh = new InstancedMesh(g.tooth, m.brassDark, 12);
        const o = new Object3D();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          o.position.set(Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1);
          o.rotation.set(0, -a, 0);
          o.updateMatrix();
          mesh.setMatrixAt(i, o.matrix);
        }
        return mesh;
      })(),
      ticks: (() => {
        const mesh = new InstancedMesh(g.tick, m.brassDark, 9);
        const o = new Object3D();
        for (let i = 0; i < 9; i++) {
          o.position.set(-0.09 + i * 0.0225, 0.012, 0.012);
          o.updateMatrix();
          mesh.setMatrixAt(i, o.matrix);
        }
        return mesh;
      })(),
    }),
    [g, m],
  );
  const dummy = useMemo(() => new Object3D(), []);
  const slipUs = useRef<number[]>(Array<number>(SLIPS).fill(0));
  const carousel = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const gearRef = useRef<Group>(null);
  const gateBar = useRef<Group>(null);
  const hammer = useRef<Group>(null);
  const slips = useRef<InstancedMesh>(null);
  const stamps = useRef<InstancedMesh>(null);
  const dashes = useRef<InstancedMesh>(null);
  const poles = useRef<InstancedMesh>(null);
  const pennants = useRef<InstancedMesh>(null);
  const markers = useRef<InstancedMesh>(null);
  const runMesh = useMemo(() => new Mesh(g.run, m.ink), [g.run, m.ink]);
  const gridLines = useMemo(
    () => new LineSegments(g.grid, m.grid),
    [g.grid, m.grid],
  );
  const tapePoint = useMemo(() => new Vector3(), []);
  const tapeTangent = useMemo(() => new Vector3(), []);

  useFrame(({ clock }) => {
    const { reducedMotion } = useDeviceStore.getState();
    const time = reducedMotion ? STILL_TIME : clock.elapsedTime;
    const active =
      plateState.instrument === "folio" &&
      useProjectStore.getState().open === project.id;
    const { beat, t } = plateState;

    // The carousel rises for the build and turns while it stands; the gear below drives it.
    const up = carouselUp(active, beat, t);
    if (carousel.current) {
      carousel.current.visible = up > 0.001;
      carousel.current.scale.setScalar(Math.max(1e-4, up));
    }
    if (spin.current) spin.current.rotation.y = time * 0.3;
    if (gearRef.current) gearRef.current.rotation.y = -time * 0.9;

    // Order slips circle the stations, stamped once past the gate.
    if (slips.current && stamps.current) {
      for (let i = 0; i < SLIPS; i++) {
        const u = slipU(time, i);
        slipUs.current[i] = u;
        const a = u * Math.PI * 2;
        const sx = Math.cos(a) * CAROUSEL.r;
        const sy = 0.04 + 0.03 * Math.sin(a * 4 + i);
        const sz = Math.sin(a) * CAROUSEL.r;
        dummy.position.set(sx, sy, sz);
        dummy.rotation.set(0, -a, 0);
        dummy.scale.setScalar(Math.max(1e-4, up));
        dummy.updateMatrix();
        slips.current.setMatrixAt(i, dummy.matrix);
        dummy.position.set(sx, sy + 0.003, sz);
        dummy.scale.setScalar(stamped(u) ? Math.max(1e-4, up) : 1e-4);
        dummy.updateMatrix();
        stamps.current.setMatrixAt(i, dummy.matrix);
      }
      slips.current.instanceMatrix.needsUpdate = true;
      stamps.current.instanceMatrix.needsUpdate = true;
    }
    // The gate's bar comes down on a slip; the hammer knocks on one.
    if (gateBar.current)
      gateBar.current.rotation.x = -0.9 * strike(slipUs.current, 2);
    if (hammer.current)
      hammer.current.rotation.x = 0.7 * strike(slipUs.current, 3);

    // The tape streams data up to the hub.
    if (dashes.current) {
      for (let i = 0; i < TAPE_DASHES; i++) {
        const u = tapeU(time, i, TAPE_DASHES);
        g.tapeCurve.getPointAt(u, tapePoint);
        g.tapeCurve.getTangentAt(u, tapeTangent);
        dummy.position
          .copy(tapePoint)
          .addScaledVector(tapeTangent, 0)
          .setY(tapePoint.y + 0.004);
        dummy.lookAt(
          tapePoint.x + tapeTangent.x,
          tapePoint.y + 0.004 + tapeTangent.y,
          tapePoint.z + tapeTangent.z,
        );
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        dashes.current.setMatrixAt(i, dummy.matrix);
      }
      dashes.current.instanceMatrix.needsUpdate = true;
    }

    // Pennants land on the traded candles for the result.
    if (poles.current && pennants.current && markers.current) {
      TRADES.forEach((idx, j) => {
        const down = flagDown(active, beat, t, j, TRADES.length);
        const x = candleX(idx);
        const top = priceY(SERIES[idx].high) + 0.02;
        const y = top + 0.07 + (1 - down) * 0.5;
        const s = down > 0.001 ? 1 : 1e-4;
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(s);
        dummy.position.set(x, y, 0);
        dummy.updateMatrix();
        poles.current!.setMatrixAt(j, dummy.matrix);
        dummy.position.set(x + 0.004, y + 0.07, 0);
        dummy.rotation.set(0, 0, 0.08 * Math.sin(time * 3 + j));
        dummy.updateMatrix();
        pennants.current!.setMatrixAt(j, dummy.matrix);
        dummy.position.set(x, top, 0);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.scale.setScalar(Math.max(1e-4, Math.min(1, down * 1.2)));
        dummy.updateMatrix();
        markers.current!.setMatrixAt(j, dummy.matrix);
      });
      poles.current.instanceMatrix.needsUpdate = true;
      pennants.current.instanceMatrix.needsUpdate = true;
      markers.current.instanceMatrix.needsUpdate = true;
    }

    // The run's line draws itself along the ridge.
    const n = g.run.index?.count ?? 0;
    g.run.setDrawRange(0, Math.round(lineDrawn(active, beat, t) * n));
  });

  const stationAngle = (k: number) => stationU(k) * Math.PI * 2;
  return (
    <group rotation={[TILT, 0, 0]}>
      {/* The plinth, its brass inlay, the chart board and its grid. */}
      <mesh
        geometry={g.plinth}
        material={m.slate}
        position={[0, BASE_Y - 0.08, 0]}
      />
      {[-0.39, 0.39].map((z) => (
        <mesh
          key={z}
          geometry={g.inlay}
          material={m.brass}
          position={[0, BASE_Y + 0.003, z]}
        />
      ))}
      {[-1.0, 1.0].map((x) => (
        <mesh
          key={x}
          geometry={g.inlaySide}
          material={m.brass}
          position={[x, BASE_Y + 0.003, 0]}
        />
      ))}
      <mesh
        geometry={g.board}
        material={m.board}
        position={[0, BASE_Y + 0.32, -0.17]}
      />
      <primitive object={gridLines} />
      <primitive object={statics.wicks} />
      <primitive object={statics.bodies} />
      <primitive object={statics.volume} />

      {/* The stop lever in its housing. */}
      <group position={[1.02, BASE_Y, 0.3]}>
        <mesh
          geometry={g.housing}
          material={m.slateDark}
          position={[0, 0.04, 0]}
        />
        <mesh geometry={g.slot} material={m.wick} position={[0, 0.082, 0]} />
        <mesh
          geometry={g.plate}
          material={m.brass}
          position={[0, 0.082, 0.045]}
        />
        <group rotation={[0, 0, -0.35]} position={[0, 0.07, 0]}>
          <mesh geometry={g.leverArm} material={m.brass} />
          <mesh geometry={g.knob} material={m.red} position={[0, 0.27, 0]} />
        </group>
      </group>

      {/* The ticker tape, streaming in. */}
      <mesh geometry={g.tape} material={m.paper} />
      <instancedMesh
        ref={dashes}
        args={[g.dash, m.dash, TAPE_DASHES]}
        frustumCulled={false}
      />

      {/* The spindle, its gear and crank, and the carousel of four stations. */}
      <group position={[CAROUSEL.x, BASE_Y, CAROUSEL.z]}>
        <mesh geometry={g.spindle} material={m.brass} />
        <mesh
          geometry={g.collar}
          material={m.brassDark}
          position={[0, 0.05, 0]}
        />
        <group ref={gearRef} position={[0, 0.03, 0]}>
          <mesh geometry={g.gear} material={m.brass} />
          <primitive object={statics.teeth} />
          <mesh
            geometry={g.crank}
            material={m.brassDark}
            position={[0.08, 0.015, 0]}
          />
        </group>
      </group>
      <group ref={carousel} position={[CAROUSEL.x, CAROUSEL.y, CAROUSEL.z]}>
        <group ref={spin}>
          <mesh geometry={g.hub} material={m.brassDark} />
          <mesh
            geometry={g.ring}
            material={m.brass}
            rotation={[Math.PI / 2, 0, 0]}
          />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <mesh
                key={i}
                geometry={g.spoke}
                material={m.brassDark}
                position={[
                  (Math.cos(a) * (CAROUSEL.r + 0.06)) / 2,
                  0,
                  (Math.sin(a) * (CAROUSEL.r + 0.06)) / 2,
                ]}
                rotation={[0, -a, 0]}
              />
            );
          })}
          {STATIONS.map((name, k) => {
            const a = stationAngle(k);
            return (
              <group
                key={name}
                position={[
                  Math.cos(a) * CAROUSEL.r,
                  0,
                  Math.sin(a) * CAROUSEL.r,
                ]}
                rotation={[0, -a, 0]}
              >
                <mesh
                  geometry={g.pedestal}
                  material={m.brassDark}
                  position={[0, 0.015, 0]}
                />
                <mesh
                  geometry={g.nameplate}
                  material={m.gold}
                  position={[0, 0.032, 0.03]}
                />
                {name === "research" ? (
                  <group position={[0, 0.03, 0]}>
                    <mesh geometry={g.handle} material={m.brass} />
                    <mesh
                      geometry={g.lens}
                      material={m.brass}
                      position={[0, 0.15, 0]}
                    />
                    <mesh
                      geometry={g.glass}
                      material={m.glass}
                      position={[0, 0.15, 0]}
                    />
                  </group>
                ) : name === "strategy" ? (
                  <group position={[0, 0.04, 0]}>
                    <mesh geometry={g.rule} material={m.brass} />
                    <primitive object={statics.ticks} />
                  </group>
                ) : name === "risk" ? (
                  <group position={[0, 0.03, 0]}>
                    {[-0.07, 0.07].map((x) => (
                      <mesh
                        key={x}
                        geometry={g.post}
                        material={m.brass}
                        position={[x, 0, 0]}
                      />
                    ))}
                    <group ref={gateBar} position={[0, 0.16, 0]}>
                      <mesh geometry={g.bar} material={m.red} />
                    </group>
                  </group>
                ) : (
                  <group ref={hammer} position={[0, 0.03, 0]}>
                    <mesh geometry={g.shaft} material={m.brass} />
                    <mesh
                      geometry={g.head}
                      material={m.slateDark}
                      position={[0, 0.14, 0]}
                    />
                  </group>
                )}
              </group>
            );
          })}
          <instancedMesh
            ref={slips}
            args={[g.slip, m.paper, SLIPS]}
            frustumCulled={false}
          />
          <instancedMesh
            ref={stamps}
            args={[g.stamp, m.stamp, SLIPS]}
            frustumCulled={false}
          />
        </group>
      </group>

      {/* The trades, flagged and ringed, and the run. */}
      <instancedMesh
        ref={poles}
        args={[g.pole, m.wick, TRADES.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={pennants}
        args={[g.pennant, m.gold, TRADES.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={markers}
        args={[g.marker, m.gold, TRADES.length]}
        frustumCulled={false}
      />
      <primitive object={runMesh} />

      <Callouts
        beats={project.beats}
        anchors={ANCHORS}
        projectId={project.id}
        palette={PALETTE}
      />
    </group>
  );
}
