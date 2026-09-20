"use client";

import { useMemo, type RefObject } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Group,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
} from "three";
import { BRONZE, INK } from "./palette";

export function Edged({
  geometry,
  position,
  rotation,
  threshold = 20,
}: {
  geometry: BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
  threshold?: number;
}) {
  const edges = useMemo(
    () => new EdgesGeometry(geometry, threshold),
    [geometry, threshold],
  );
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} name="solid">
        <meshStandardMaterial color={BRONZE} roughness={0.6} metalness={0.15} />
      </mesh>
      <lineSegments geometry={edges} name="edge">
        <lineBasicMaterial color={INK} transparent opacity={1} />
      </lineSegments>
    </group>
  );
}

const ring = (r: number, t: number) => new TorusGeometry(r, t, 10, 96);
const rod = (l: number, r: number) => new CylinderGeometry(r, r, l, 12);
const TICKS_24 = Array.from({ length: 24 }, (_, i) => (i / 24) * Math.PI * 2);

export function Armillary({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(
    () => ({
      outer: ring(1.5, 0.05),
      mid: ring(1.2, 0.045),
      inner: ring(0.9, 0.04),
      axis: rod(3.6, 0.03),
      globe: new SphereGeometry(0.22, 16, 12),
      tick: new BoxGeometry(0.04, 0.12, 0.04),
    }),
    [],
  );
  return (
    <group>
      <group ref={mech}>
        <Edged geometry={g.outer} rotation={[Math.PI / 2, 0, 0]} />
        {TICKS_24.map((a) => (
          <Edged
            key={a}
            geometry={g.tick}
            position={[Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5]}
            rotation={[0, -a, 0]}
          />
        ))}
      </group>
      <Edged geometry={g.mid} rotation={[Math.PI / 2, 0.5, 0.4]} />
      <Edged geometry={g.inner} rotation={[0.3, 0, 1.0]} />
      <Edged geometry={g.axis} rotation={[0, 0, 0.42]} />
      <Edged geometry={g.globe} />
    </group>
  );
}

export function Astrolabe({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(
    () => ({
      mater: new CylinderGeometry(1.45, 1.45, 0.08, 96),
      limb: ring(1.45, 0.06),
      arc: new TorusGeometry(0.9, 0.035, 8, 64, Math.PI * 0.9),
      pointer: new BoxGeometry(2.6, 0.05, 0.08),
      pin: rod(0.3, 0.06),
      throne: new TorusGeometry(0.18, 0.05, 8, 32),
    }),
    [],
  );
  return (
    <group rotation={[0.35, 0, 0]}>
      <Edged geometry={g.mater} rotation={[Math.PI / 2, 0, 0]} />
      <Edged geometry={g.limb} />
      <Edged geometry={g.throne} position={[0, 1.6, 0]} />
      <group ref={mech} position={[0, 0, 0.08]}>
        {[0, 1, 2, 3].map((i) => (
          <Edged
            key={i}
            geometry={g.arc}
            position={[Math.cos(i * 1.7) * 0.3, Math.sin(i * 1.7) * 0.3, 0]}
            rotation={[0, 0, i * 1.9]}
          />
        ))}
        <Edged geometry={g.pointer} rotation={[0, 0, 0.6]} />
      </group>
      <Edged
        geometry={g.pin}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0.1]}
      />
    </group>
  );
}

function gearGeometry(r: number, teeth: number, thickness: number) {
  const body = new CylinderGeometry(r, r, thickness, teeth * 2);
  const tooth = new BoxGeometry(0.22, thickness, 0.14);
  return {
    body,
    tooth,
    angles: Array.from({ length: teeth }, (_, i) => (i / teeth) * Math.PI * 2),
  };
}

function Gear({
  r,
  teeth,
  thickness,
  position,
  mech,
  phase,
}: {
  r: number;
  teeth: number;
  thickness: number;
  position: [number, number, number];
  mech?: RefObject<Group | null>;
  phase: number;
}) {
  const g = useMemo(
    () => gearGeometry(r, teeth, thickness),
    [r, teeth, thickness],
  );
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <group ref={mech} rotation={[0, phase, 0]}>
        <Edged geometry={g.body} />
        {g.angles.map((a) => (
          <Edged
            key={a}
            geometry={g.tooth}
            position={[Math.cos(a) * (r + 0.08), 0, Math.sin(a) * (r + 0.08)]}
            rotation={[0, -a, 0]}
          />
        ))}
      </group>
    </group>
  );
}

export function Gears({ mech }: { mech: RefObject<Group | null> }) {
  return (
    <group>
      <Gear
        r={0.9}
        teeth={14}
        thickness={0.18}
        position={[-0.9, 0.1, 0]}
        mech={mech}
        phase={0}
      />
      <Gear
        r={0.55}
        teeth={9}
        thickness={0.18}
        position={[0.62, 0.55, 0]}
        phase={0.35}
      />
      <Gear
        r={0.7}
        teeth={11}
        thickness={0.18}
        position={[0.55, -0.85, 0]}
        phase={0.15}
      />
    </group>
  );
}

export function Quadrant({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(
    () => ({
      arc: new RingGeometry(1.35, 1.6, 48, 1, 0, Math.PI / 2),
      side: new BoxGeometry(1.6, 0.06, 0.06),
      sight: rod(1.7, 0.035),
      tick: new BoxGeometry(0.03, 0.14, 0.03),
      bob: new SphereGeometry(0.07, 12, 10),
      thread: rod(1.5, 0.008),
    }),
    [],
  );
  const ticks = Array.from({ length: 10 }, (_, i) => (i / 9) * (Math.PI / 2));
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
      {ticks.map((a) => (
        <Edged
          key={a}
          geometry={g.tick}
          position={[Math.cos(a) * 1.47, Math.sin(a) * 1.47, 0.04]}
          rotation={[0, 0, a]}
        />
      ))}
      <group ref={mech}>
        <Edged geometry={g.thread} position={[0, -0.75, 0.1]} />
        <Edged geometry={g.bob} position={[0, -1.5, 0.1]} />
      </group>
    </group>
  );
}
