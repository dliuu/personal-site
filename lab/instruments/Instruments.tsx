"use client";

import { createContext, useContext, useMemo, type RefObject } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
} from "three";
import type { LineBasicMaterial } from "three";
import { archVoussoirs } from "@/lib/arch";
import { BRONZE, INK } from "./palette";

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
}: {
  geometry: BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
  threshold?: number;
  edges?: BufferGeometry;
}) {
  const ctx = useContext(EdgedModeContext);
  const edges = useMemo(
    () => edgesOverride ?? new EdgesGeometry(geometry, threshold),
    [edgesOverride, geometry, threshold],
  );
  return (
    <group position={position} rotation={rotation}>
      {ctx.mode === "solid" ? (
        <mesh geometry={geometry} name="solid">
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

export function Globe({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(
    () => ({
      sphere: new SphereGeometry(1.05, 32, 20),
      sphereLine: torusOutline(1.05, 0),
      equator: ring(1.06, 0.015),
      equatorLine: torusOutline(1.06, 0.015),
      meridian: ring(1.18, 0.035),
      meridianLine: torusOutline(1.18, 0.035),
      pin: rod(0.16, 0.012),
      stand: rod(0.9, 0.04),
      base: new CylinderGeometry(0.5, 0.6, 0.1, 40),
    }),
    [],
  );
  const pinEdges = useMemo(() => new EdgesGeometry(g.pin, 20), [g.pin]);
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
          {PIN_POINTS.map((p, i) => {
            // Orient the pin along the radial direction: three composes an XYZ
            // Euler as Rx*Ry*Rz, so with ry = 0 local +y lands on
            // (-sin rz, cos rx * cos rz, sin rx * cos rz). Solving that for p
            // gives rz = -asin(x) and rx = atan2(z, y).
            const [x, y, z] = p;
            const rotZ = -Math.asin(x);
            const rotX = Math.atan2(z, y);
            return (
              <Edged
                key={i}
                geometry={g.pin}
                edges={pinEdges}
                position={[x * 1.1, y * 1.1, z * 1.1]}
                rotation={[rotX, 0, rotZ]}
              />
            );
          })}
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
      pier: new BoxGeometry(0.5, 2.0, 0.6),
      deck: new BoxGeometry(3.6, 0.12, 0.6),
      post: rod(2.4, 0.03),
      rail: rod(3.8, 0.025),
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
      <Edged geometry={g.deck} position={[0, 2.06, 0]} />
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
