"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CylinderGeometry,
  Group,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
} from "three";
import { useLabStore } from "@/store/useLabStore";

const mat = (color: string, roughness = 0.8) =>
  new MeshStandardMaterial({ color, roughness });

/** A leaf outline for ShapeGeometry: a pointed ellipse, tip along +y. */
function leafShape(w: number, l: number): Shape {
  const s = new Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(w, l * 0.3, w, l * 0.75, 0, l);
  s.bezierCurveTo(-w, l * 0.75, -w, l * 0.3, 0, 0);
  return s;
}

export function Plant({
  position,
  leaves,
  size,
  color,
  potColor = "#8a6a55",
  potH = 0.3,
  potR = 0.16,
  droop = 0,
  trunk = 0,
}: {
  position: [number, number, number];
  leaves: number;
  size: number;
  color: string;
  potColor?: string;
  potH?: number;
  potR?: number;
  droop?: number;
  /** Height of a woody trunk under the leaves, for tall plants. */
  trunk?: number;
}) {
  const g = useMemo(
    () => ({
      pot: new CylinderGeometry(potR, potR * 0.8, potH, 20),
      soil: new CylinderGeometry(potR * 0.95, potR * 0.95, 0.02, 20),
      leaf: new ShapeGeometry(leafShape(size * 0.35, size)),
      stem: new CylinderGeometry(0.006, 0.008, size * 0.9, 6),
      trunk: new CylinderGeometry(0.012, 0.02, Math.max(trunk, 0.01), 8),
    }),
    [potH, potR, size, trunk],
  );
  const m = useMemo(
    () => ({
      pot: mat(potColor, 0.9),
      soil: mat("#2b1f16", 1),
      leaf: new MeshStandardMaterial({ color, roughness: 0.7, side: 2 }),
      stem: mat("#3f6b3a", 0.9),
      trunk: mat("#6b5238", 0.9),
    }),
    [color, potColor],
  );
  const sway = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!sway.current) return;
    const { reducedMotion } = useLabStore.getState();
    sway.current.rotation.z = reducedMotion
      ? 0
      : 0.02 * Math.sin(clock.elapsedTime * 0.9 + position[0]);
  });
  return (
    <group position={position}>
      <mesh
        geometry={g.pot}
        material={m.pot}
        position={[0, potH / 2, 0]}
        castShadow
        receiveShadow
      />
      <mesh geometry={g.soil} material={m.soil} position={[0, potH, 0]} />
      {trunk > 0 ? (
        <mesh
          geometry={g.trunk}
          material={m.trunk}
          position={[0, potH + trunk / 2, 0]}
          castShadow
        />
      ) : null}
      <group ref={sway} position={[0, potH + trunk, 0]}>
        {Array.from({ length: leaves }, (_, i) => {
          const a = (i / leaves) * Math.PI * 2 + 0.4;
          const tilt = 0.5 + (0.35 * ((i * 7) % 3)) / 2 + droop;
          return (
            <group key={i} rotation={[0, a, 0]}>
              <group rotation={[tilt, 0, 0]}>
                <mesh
                  geometry={g.stem}
                  material={m.stem}
                  position={[0, size * 0.45, 0]}
                />
                <mesh
                  geometry={g.leaf}
                  material={m.leaf}
                  position={[0, size * 0.8, 0]}
                  rotation={[-0.2, 0, 0]}
                  castShadow
                />
              </group>
            </group>
          );
        })}
      </group>
    </group>
  );
}
