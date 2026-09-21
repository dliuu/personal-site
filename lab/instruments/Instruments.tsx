"use client";

import {
  createContext,
  createRef,
  useContext,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import type { LineBasicMaterial, MeshStandardMaterial } from "three";
import { archVoussoirs } from "@/lib/arch";
import { smooth, stagger } from "@/lib/beats";
import { lerp } from "@/lib/progress";
import { BRONZE, INK } from "./palette";
import { plateState } from "./plateState";

export type EdgedMode = {
  mode: "solid" | "lines";
  lineMaterial?: LineBasicMaterial;
};
export const EdgedModeContext = createContext<EdgedMode>({ mode: "solid" });

/** Line segments for a torus outline: two circles at r±t in the XY plane (matches TorusGeometry's plane); partial arcs are closed at both ends. */
export function torusOutline(
  r: number,
  t: number,
  arc = Math.PI * 2,
  segments = 96,
): BufferGeometry {
  const pts: number[] = [];
  for (const radius of [r + t, r - t]) {
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * arc;
      const a1 = ((i + 1) / segments) * arc;
      pts.push(
        Math.cos(a0) * radius,
        Math.sin(a0) * radius,
        0,
        Math.cos(a1) * radius,
        Math.sin(a1) * radius,
        0,
      );
    }
  }
  if (arc < Math.PI * 2) {
    for (const a of [0, arc]) {
      pts.push(
        Math.cos(a) * (r - t),
        Math.sin(a) * (r - t),
        0,
        Math.cos(a) * (r + t),
        Math.sin(a) * (r + t),
        0,
      );
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pts, 3));
  return g;
}

export function Edged({
  geometry,
  position,
  rotation,
  threshold = 20,
  edges: edgesOverride,
  meshRef,
  linesOnly = false,
}: {
  geometry: BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
  threshold?: number;
  edges?: BufferGeometry;
  meshRef?: RefObject<Mesh | null>;
  /** Draw only in lines mode — `geometry` is then unused; pass the line set as `edges`. */
  linesOnly?: boolean;
}) {
  const ctx = useContext(EdgedModeContext);
  const edges = useMemo(
    () => edgesOverride ?? new EdgesGeometry(geometry, threshold),
    [edgesOverride, geometry, threshold],
  );
  if (linesOnly && ctx.mode === "solid") return null;
  return (
    <group position={position} rotation={rotation}>
      {ctx.mode === "solid" ? (
        <mesh ref={meshRef} geometry={geometry} name="solid">
          <meshStandardMaterial
            color={BRONZE}
            roughness={0.6}
            metalness={0.15}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      ) : ctx.lineMaterial ? (
        <lineSegments
          geometry={edges}
          material={ctx.lineMaterial}
          name="edge"
        />
      ) : (
        <lineSegments geometry={edges} name="edge">
          <lineBasicMaterial color={INK} transparent />
        </lineSegments>
      )}
    </group>
  );
}

const ring = (r: number, t: number) => new TorusGeometry(r, t, 10, 96);
const rod = (l: number, r: number) => new CylinderGeometry(r, r, l, 12);
const TICKS_24 = Array.from({ length: 24 }, (_, i) => (i / 24) * Math.PI * 2);
const QUADRANT_TICKS = Array.from(
  { length: 10 },
  (_, i) => (i / 9) * (Math.PI / 2),
);

export function Armillary({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(() => {
    const tick = new BoxGeometry(0.04, 0.12, 0.04);
    return {
      outer: ring(1.5, 0.05),
      mid: ring(1.2, 0.045),
      inner: ring(0.9, 0.04),
      axis: rod(3.6, 0.03),
      globe: new SphereGeometry(0.22, 16, 12),
      tick,
      tickEdges: new EdgesGeometry(tick),
      outerLine: torusOutline(1.5, 0.05),
      midLine: torusOutline(1.2, 0.045),
      innerLine: torusOutline(0.9, 0.04),
    };
  }, []);
  return (
    <group>
      <group ref={mech}>
        <Edged
          geometry={g.outer}
          edges={g.outerLine}
          rotation={[Math.PI / 2, 0, 0]}
        />
        {TICKS_24.map((a) => (
          <Edged
            key={a}
            geometry={g.tick}
            edges={g.tickEdges}
            position={[Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5]}
            rotation={[0, -a, 0]}
          />
        ))}
      </group>
      <Edged
        geometry={g.mid}
        edges={g.midLine}
        rotation={[Math.PI / 2, 0.5, 0.4]}
      />
      <Edged geometry={g.inner} edges={g.innerLine} rotation={[0.3, 0, 1.0]} />
      <Edged geometry={g.axis} rotation={[0, 0, 0.42]} />
      <Edged geometry={g.globe} />
    </group>
  );
}

export function Balance({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(
    () => ({
      base: new CylinderGeometry(0.7, 0.8, 0.12, 48),
      pillar: rod(2.4, 0.05),
      finial: new SphereGeometry(0.09, 12, 10),
      beam: new BoxGeometry(2.6, 0.06, 0.08),
      chain: rod(0.7, 0.012),
      pan: new CylinderGeometry(0.42, 0.38, 0.05, 40),
    }),
    [],
  );
  return (
    <group position={[0, -1.2, 0]}>
      <Edged geometry={g.base} />
      <Edged geometry={g.pillar} position={[0, 1.26, 0]} />
      <Edged geometry={g.finial} position={[0, 2.55, 0]} />
      <group ref={mech} position={[0, 2.46, 0]}>
        <Edged geometry={g.beam} />
        {[-1.2, 1.2].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <Edged geometry={g.chain} position={[0, -0.35, 0]} />
            <Edged geometry={g.pan} position={[0, -0.72, 0]} />
          </group>
        ))}
      </group>
    </group>
  );
}

function fibonacciSphere(n: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const a = golden * i;
    pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  return pts;
}
const PIN_POINTS = fibonacciSphere(48);
const PIN_DIRS = PIN_POINTS.map(([x, y, z]) => new Vector3(x, y, z));
/** Radius the pins sit at once seated: base near the surface, tip outward. */
const PIN_R = 1.18;
/** Manhattan: latitude 40.7° (0.71 rad) on the prime azimuth. */
const NYC_DIR = new Vector3(0, Math.sin(0.71), Math.cos(0.71));
/** Graticule latitudes: the equator and two parallels either side. */
const GRATICULE_LATS = [
  -Math.PI / 3,
  -Math.PI / 6,
  0,
  Math.PI / 6,
  Math.PI / 3,
];
const GRATICULE_R = 1.052;
const MERIDIAN_COUNT = 6;
const GAUGE_R = 1.16;
const SATELLITES = [
  { r: 1.6, tilt: 0.5 },
  { r: 1.75, tilt: -0.4 },
  { r: 1.9, tilt: 0.9 },
];

export function Globe({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(() => {
    const tick = new BoxGeometry(0.02, 0.1, 0.02);
    return {
      sphere: new SphereGeometry(1.05, 32, 20),
      sphereLine: torusOutline(1.05, 0),
      equator: ring(1.06, 0.015),
      equatorLine: torusOutline(1.06, 0.015),
      meridian: ring(1.18, 0.035),
      meridianLine: torusOutline(1.18, 0.035),
      pin: new ConeGeometry(0.02, 0.16, 8),
      nyc: new ConeGeometry(0.035, 0.26, 10),
      stand: rod(0.9, 0.04),
      base: new CylinderGeometry(0.5, 0.6, 0.1, 40),
      tick,
      tickEdges: new EdgesGeometry(tick),
      latLines: GRATICULE_LATS.map((lat) =>
        torusOutline(GRATICULE_R * Math.cos(lat), 0),
      ),
      meridianLines: torusOutline(GRATICULE_R, 0),
      satRings: SATELLITES.map((s) => torusOutline(s.r, 0)),
      satBody: new SphereGeometry(0.06, 12, 10),
    };
  }, []);
  const pinEdges = useMemo(() => new EdgesGeometry(g.pin, 20), [g.pin]);
  const nycEdges = useMemo(() => new EdgesGeometry(g.nyc, 20), [g.nyc]);
  const pinRefs = useMemo(() => PIN_DIRS.map(() => createRef<Group>()), []);
  const tickRefs = useMemo(() => TICKS_24.map(() => createRef<Group>()), []);
  const satRefs = useMemo(() => SATELLITES.map(() => createRef<Group>()), []);
  const nycGroup = useRef<Group>(null);
  const nycMesh = useRef<Mesh>(null);
  const { mode } = useContext(EdgedModeContext);

  // Both instruments (solid and lines) run this; every value is a pure
  // function of plateState, so the two stay in lockstep.
  useFrame(() => {
    const active = plateState.instrument === "globe";

    // Beat 0: the pins fall in, staggered, from well above the surface.
    const dropping = active && plateState.beat === 0;
    for (let i = 0; i < PIN_DIRS.length; i++) {
      const r = dropping
        ? lerp(2.2, PIN_R, stagger(plateState.t, i, PIN_DIRS.length, 0.6))
        : PIN_R;
      pinRefs[i].current?.position.copy(PIN_DIRS[i]).multiplyScalar(r);
    }

    // Beat 1: the Manhattan pin lifts off the surface and lights up, and the
    // solid instrument publishes its world point for the camera to push in on.
    const close = active && plateState.beat === 1;
    const lift = close ? 1.1 + 0.15 * smooth(0, 0.3, plateState.t) : 1.1;
    const nyc = nycGroup.current;
    if (nyc) {
      nyc.position.copy(NYC_DIR).multiplyScalar(lift);
      if (mode === "solid") {
        nyc.getWorldPosition(plateState.focus);
        plateState.hasFocus = true;
      }
    }
    if (nycMesh.current) {
      const m = nycMesh.current.material as MeshStandardMaterial;
      m.emissive.setScalar(close ? 0.9 : 0);
    }

    // Beat 2: the gauge reads down from 24 ticks to 4, and holds at 4 after.
    const gauge = active && plateState.beat >= 2;
    const count = !gauge
      ? 0
      : plateState.beat === 2
        ? Math.round(24 - 20 * smooth(0, 1, plateState.t))
        : 4;
    tickRefs.forEach((ref, i) => {
      if (ref.current) ref.current.visible = i < count;
    });

    // Beat 3: three satellites come up on their tilted rings.
    const sats = active && plateState.beat === 3;
    satRefs.forEach((ref, k) => {
      if (!ref.current) return;
      ref.current.visible = sats;
      ref.current.rotation.y = plateState.t * Math.PI * 2 * (1 + k * 0.3) + k;
    });
  });

  return (
    <group position={[0, -0.3, 0]}>
      <Edged geometry={g.base} position={[0, -1.35, 0]} />
      <Edged geometry={g.stand} position={[0, -0.85, 0]} />
      <Edged geometry={g.meridian} edges={g.meridianLine} />
      <group rotation={[0, 0, 0.41]}>
        <group ref={mech}>
          <Edged geometry={g.sphere} edges={g.sphereLine} />
          <Edged
            geometry={g.equator}
            edges={g.equatorLine}
            rotation={[Math.PI / 2, 0, 0]}
          />
          {GRATICULE_LATS.map((lat, i) => (
            <Edged
              key={lat}
              linesOnly
              geometry={g.sphere}
              edges={g.latLines[i]}
              position={[0, GRATICULE_R * Math.sin(lat), 0]}
              rotation={[Math.PI / 2, 0, 0]}
            />
          ))}
          {Array.from({ length: MERIDIAN_COUNT }, (_, k) => (
            <Edged
              key={k}
              linesOnly
              geometry={g.sphere}
              edges={g.meridianLines}
              rotation={[0, (k * Math.PI) / MERIDIAN_COUNT, 0]}
            />
          ))}
          {PIN_POINTS.map((p, i) => {
            // Orient the pin along the radial direction: three composes an XYZ
            // Euler as Rx*Ry*Rz, so with ry = 0 local +y lands on
            // (-sin rz, cos rx * cos rz, sin rx * cos rz). Solving that for p
            // gives rz = -asin(x) and rx = atan2(z, y).
            const [x, y, z] = p;
            const rotZ = -Math.asin(x);
            const rotX = Math.atan2(z, y);
            return (
              <group
                key={i}
                ref={pinRefs[i]}
                position={[x * PIN_R, y * PIN_R, z * PIN_R]}
              >
                <Edged
                  geometry={g.pin}
                  edges={pinEdges}
                  rotation={[rotX, 0, rotZ]}
                />
              </group>
            );
          })}
          <group
            ref={nycGroup}
            position={[NYC_DIR.x * 1.1, NYC_DIR.y * 1.1, NYC_DIR.z * 1.1]}
          >
            <Edged
              geometry={g.nyc}
              edges={nycEdges}
              meshRef={nycMesh}
              rotation={[Math.atan2(NYC_DIR.z, NYC_DIR.y), 0, 0]}
            />
          </group>
          {TICKS_24.map((a, i) => (
            <group
              key={a}
              ref={tickRefs[i]}
              position={[Math.cos(a) * GAUGE_R, 0, Math.sin(a) * GAUGE_R]}
              rotation={[0, -a, 0]}
              visible={false}
            >
              <Edged geometry={g.tick} edges={g.tickEdges} />
            </group>
          ))}
          {SATELLITES.map((s, k) => (
            <group
              key={s.r}
              ref={satRefs[k]}
              rotation={[s.tilt, 0, 0]}
              visible={false}
            >
              <Edged
                linesOnly
                geometry={g.sphere}
                edges={g.satRings[k]}
                rotation={[Math.PI / 2, 0, 0]}
              />
              <Edged geometry={g.satBody} position={[s.r, 0, 0]} />
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

const VOUSSOIRS = archVoussoirs(13, 1.3);
const KEYSTONE = 6;

export function Bridge({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(
    () => ({
      block: new BoxGeometry(0.3, 0.26, 0.5),
      pier: new BoxGeometry(0.34, 2.0, 0.6),
      deck: new BoxGeometry(3.6, 0.08, 0.6),
      post: rod(2.4, 0.03),
      rail: rod(3.8, 0.02),
    }),
    [],
  );
  const blockEdges = useMemo(() => new EdgesGeometry(g.block, 20), [g.block]);
  return (
    <group position={[0, -1.0, 0]}>
      {[-1.55, 1.55].map((x) => (
        <Edged key={x} geometry={g.pier} position={[x, 1.0, 0]} />
      ))}
      {VOUSSOIRS.map((v, i) =>
        i === KEYSTONE ? null : (
          <Edged
            key={i}
            geometry={g.block}
            edges={blockEdges}
            position={v.position}
            rotation={[0, 0, v.rotation]}
          />
        ),
      )}
      <group ref={mech}>
        <Edged
          geometry={g.block}
          edges={blockEdges}
          position={VOUSSOIRS[KEYSTONE].position}
          rotation={[0, 0, VOUSSOIRS[KEYSTONE].rotation]}
        />
      </group>
      <Edged geometry={g.deck} position={[0, 2.04, 0]} />
      {[-1.9, -0.65, 0.65, 1.9].map((x) => (
        <Edged key={x} geometry={g.post} position={[x, 1.2, 0.45]} />
      ))}
      {[0.9, 2.1].map((y) => (
        <Edged
          key={y}
          geometry={g.rail}
          position={[0, y, 0.45]}
          rotation={[0, 0, Math.PI / 2]}
        />
      ))}
    </group>
  );
}

export function Quadrant({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(() => {
    const tick = new BoxGeometry(0.03, 0.14, 0.03);
    return {
      arc: new RingGeometry(1.35, 1.6, 48, 1, 0, Math.PI / 2),
      side: new BoxGeometry(1.6, 0.06, 0.06),
      sight: rod(1.7, 0.035),
      tick,
      tickEdges: new EdgesGeometry(tick),
      bob: new SphereGeometry(0.07, 12, 10),
      thread: rod(1.5, 0.008),
    };
  }, []);
  return (
    <group position={[-0.6, -0.6, 0]}>
      <Edged geometry={g.arc} threshold={1} />
      <Edged geometry={g.side} position={[0.8, 0, 0]} />
      <Edged
        geometry={g.side}
        position={[0, 0.8, 0]}
        rotation={[0, 0, Math.PI / 2]}
      />
      <Edged
        geometry={g.sight}
        position={[0.85, 0.85, 0.08]}
        rotation={[0, 0, Math.PI / 4]}
      />
      {QUADRANT_TICKS.map((a) => (
        <Edged
          key={a}
          geometry={g.tick}
          edges={g.tickEdges}
          position={[Math.cos(a) * 1.47, Math.sin(a) * 1.47, 0.04]}
          rotation={[0, 0, a - Math.PI / 2]}
        />
      ))}
      <group ref={mech}>
        <Edged geometry={g.thread} position={[0, -0.75, 0.1]} />
        <Edged geometry={g.bob} position={[0, -1.5, 0.1]} />
      </group>
    </group>
  );
}
