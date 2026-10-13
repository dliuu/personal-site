"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
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
  tradeIndices,
} from "@/lib/trading";
import { useDeviceStore } from "@/store/useDeviceStore";
import { Callouts } from "../Callouts";
import { chapters } from "../chapters";
import type { Project } from "../content";
import { plateState } from "../plateState";
import { siteMaterial } from "../siteParts";

/**
 * The trading agents, the candle ridge and the four stations: the market as
 * a ridge of candles with a red stop lever at its end; above it a carousel
 * of four agent stations (research, a lens; strategy, a rule; risk, a gate;
 * execution, a hammer) that rises for the build and turns, with order slips
 * circling it; for the result, flags land on the traded candles and the
 * run's line draws itself along the ridge.
 */

const SERIES = candleSeries();
const TRADES = tradeIndices(SERIES);
const EQUITY = equityCurve(SERIES, TRADES);
const X0 = -0.9;
const X1 = 0.9;
const BASE_Y = -0.56;
const PRICE_K = 0.65;
/** The scene leans toward the reader so the ridge and the ring read from a little above. */
const TILT = 0.3;
const CAROUSEL = { x: 0, y: 0.3, z: -0.32, r: 0.55 };
const SLATE = "#4a4e56";
const UP = "#3f9a6a";
const DOWN = "#c0463c";
const BRASS = "#b08d4f";
const GOLD = "#c49a3c";
const RED = "#c0463c";
const INK_LINE = "#1c2b4b";
const STILL_TIME = 2;
const PALETTE = chapters.find((c) => c.instrument === "folio")!.palette;

const candleX = (i: number) => X0 + (i / (CANDLES - 1)) * (X1 - X0);
/** The ridge stands on the plinth: its lowest low sits just above the slab. */
const MIN_LOW = Math.min(...SERIES.map((c) => c.low));
const priceY = (p: number) => BASE_Y + 0.04 + (p - MIN_LOW) * PRICE_K;
const equityY = (e: number) => -0.25 + (e - 1) * 1.0;

/** Callout anchors: the problem beat is docked (its card would cover the ridge), then the carousel, then a traded candle. */
const ANCHORS: (Vector3 | null)[] = [
  null,
  new Vector3(CAROUSEL.x - 0.4, CAROUSEL.y - 0.08, CAROUSEL.z + 0.4),
  new Vector3(candleX(TRADES[Math.min(2, TRADES.length - 1)]), 0.15, 0.1),
];

/** Instances laid out once from a list of poses. */
function placed(
  geometry: BoxGeometry,
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
      const c = new CylinderGeometry(r, r, h, 8);
      c.translate(0, h / 2, 0);
      return c;
    };
    const line = new BufferGeometry();
    const pts = EQUITY.flatMap((e, i) => [candleX(i), equityY(e), 0.36]);
    line.setAttribute("position", new Float32BufferAttribute(pts, 3));
    line.setDrawRange(0, 0);
    return {
      plinth: new BoxGeometry(2.2, 0.08, 0.95),
      body: new BoxGeometry(0.05, 1, 0.05),
      wick: new BoxGeometry(0.008, 1, 0.008),
      leverBase: new BoxGeometry(0.1, 0.06, 0.1),
      leverArm: rod(0.26, 0.012),
      knob: new SphereGeometry(0.045, 12, 10),
      spindle: rod(CAROUSEL.y - BASE_Y, 0.02),
      ring: new TorusGeometry(CAROUSEL.r, 0.014, 8, 64),
      lens: new TorusGeometry(0.07, 0.012, 8, 32),
      handle: rod(0.1, 0.01),
      rule: new BoxGeometry(0.22, 0.015, 0.04),
      post: rod(0.16, 0.01),
      bar: new BoxGeometry(0.16, 0.015, 0.015),
      shaft: rod(0.14, 0.01),
      head: new BoxGeometry(0.08, 0.05, 0.05),
      slip: new BoxGeometry(0.06, 0.002, 0.045),
      pole: new BoxGeometry(0.008, 0.14, 0.008),
      pennant: new BoxGeometry(0.06, 0.035, 0.003),
      line,
    };
  }, []);
  const m = useMemo(
    () => ({
      plinth: siteMaterial(SLATE),
      candle: siteMaterial("#ffffff"),
      wick: siteMaterial("#2a2d33"),
      brass: siteMaterial(BRASS, { metalness: 0.4, roughness: 0.45 }),
      red: siteMaterial(RED, {
        emissive: new Color(RED),
        emissiveIntensity: 0.4,
      }),
      paper: siteMaterial("#f3e9d2"),
      gold: siteMaterial(GOLD),
      line: new LineBasicMaterial({ color: INK_LINE }),
    }),
    [],
  );
  const candles = useMemo(
    () => ({
      bodies: placed(
        g.body,
        m.candle,
        SERIES.map((c, i) => ({
          x: candleX(i),
          y: priceY((c.open + c.close) / 2),
          z: 0,
          sy: Math.max(0.012, Math.abs(c.close - c.open) * PRICE_K),
          colour: c.close >= c.open ? UP : DOWN,
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
    }),
    [g, m],
  );
  const dummy = useMemo(() => new Object3D(), []);
  const carousel = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const slips = useRef<InstancedMesh>(null);
  const poles = useRef<InstancedMesh>(null);
  const pennants = useRef<InstancedMesh>(null);
  const runLine = useMemo(() => new Line(g.line, m.line), [g.line, m.line]);

  useFrame(({ clock }) => {
    const { reducedMotion } = useDeviceStore.getState();
    const time = reducedMotion ? STILL_TIME : clock.elapsedTime;
    const active = plateState.project === project.id;
    const { beat, t } = plateState;

    // The carousel rises for the build and turns while it stands.
    const up = carouselUp(active, beat, t);
    if (carousel.current) {
      carousel.current.visible = up > 0.001;
      carousel.current.scale.setScalar(Math.max(1e-4, up));
    }
    if (spin.current) spin.current.rotation.y = time * 0.3;

    // Order slips circle the stations.
    if (slips.current) {
      for (let i = 0; i < SLIPS; i++) {
        const u = slipU(time, i);
        const a = u * Math.PI * 2;
        dummy.position.set(
          Math.cos(a) * CAROUSEL.r,
          0.04 + 0.03 * Math.sin(a * 4 + i),
          Math.sin(a) * CAROUSEL.r,
        );
        dummy.rotation.set(0, -a, 0);
        dummy.scale.setScalar(Math.max(1e-4, up));
        dummy.updateMatrix();
        slips.current.setMatrixAt(i, dummy.matrix);
      }
      slips.current.instanceMatrix.needsUpdate = true;
    }

    // Flags land on the traded candles for the result.
    if (poles.current && pennants.current) {
      TRADES.forEach((idx, j) => {
        const down = flagDown(active, beat, t, j, TRADES.length);
        const x = candleX(idx);
        const y = priceY(SERIES[idx].high) + 0.07 + (1 - down) * 0.5;
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(down > 0.001 ? 1 : 1e-4);
        dummy.position.set(x, y, 0);
        dummy.updateMatrix();
        poles.current!.setMatrixAt(j, dummy.matrix);
        dummy.position.set(x + 0.03, y + 0.05, 0);
        dummy.updateMatrix();
        pennants.current!.setMatrixAt(j, dummy.matrix);
      });
      poles.current.instanceMatrix.needsUpdate = true;
      pennants.current.instanceMatrix.needsUpdate = true;
    }

    // The run's line draws along the ridge.
    g.line.setDrawRange(0, Math.round(lineDrawn(active, beat, t) * CANDLES));
  });

  const stationAngle = (k: number) => (k / STATIONS.length) * Math.PI * 2;
  return (
    <group rotation={[TILT, 0, 0]}>
      <mesh
        geometry={g.plinth}
        material={m.plinth}
        position={[0, BASE_Y - 0.04, 0]}
      />
      <primitive object={candles.wicks} />
      <primitive object={candles.bodies} />

      {/* The stop lever at the end of the ridge. */}
      <group position={[1.02, BASE_Y, 0.3]}>
        <mesh
          geometry={g.leverBase}
          material={m.plinth}
          position={[0, 0.03, 0]}
        />
        <group rotation={[0, 0, -0.35]} position={[0, 0.05, 0]}>
          <mesh geometry={g.leverArm} material={m.brass} />
          <mesh geometry={g.knob} material={m.red} position={[0, 0.27, 0]} />
        </group>
      </group>

      {/* The carousel of four stations on its spindle. */}
      <mesh
        geometry={g.spindle}
        material={m.brass}
        position={[CAROUSEL.x, BASE_Y, CAROUSEL.z]}
      />
      <group ref={carousel} position={[CAROUSEL.x, CAROUSEL.y, CAROUSEL.z]}>
        <group ref={spin}>
          <mesh
            geometry={g.ring}
            material={m.brass}
            rotation={[Math.PI / 2, 0, 0]}
          />
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
                {name === "research" ? (
                  <>
                    <mesh
                      geometry={g.lens}
                      material={m.brass}
                      position={[0, 0.14, 0]}
                    />
                    <mesh geometry={g.handle} material={m.brass} />
                  </>
                ) : name === "strategy" ? (
                  <mesh
                    geometry={g.rule}
                    material={m.brass}
                    position={[0, 0.03, 0]}
                  />
                ) : name === "risk" ? (
                  <>
                    {[-0.07, 0.07].map((x) => (
                      <mesh
                        key={x}
                        geometry={g.post}
                        material={m.brass}
                        position={[x, 0, 0]}
                      />
                    ))}
                    <mesh
                      geometry={g.bar}
                      material={m.red}
                      position={[0, 0.16, 0]}
                    />
                  </>
                ) : (
                  <>
                    <mesh geometry={g.shaft} material={m.brass} />
                    <mesh
                      geometry={g.head}
                      material={m.plinth}
                      position={[0, 0.14, 0]}
                    />
                  </>
                )}
              </group>
            );
          })}
          <instancedMesh
            ref={slips}
            args={[g.slip, m.paper, SLIPS]}
            frustumCulled={false}
          />
        </group>
      </group>

      {/* The trades, flagged, and the run. */}
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
      <primitive object={runLine} />

      <Callouts
        beats={project.beats}
        anchors={ANCHORS}
        projectId={project.id}
        palette={PALETTE}
      />
    </group>
  );
}
