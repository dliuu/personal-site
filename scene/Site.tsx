"use client";

import type { RefObject } from "react";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, CylinderGeometry, Group, PlaneGeometry } from "three";

import { FLOORS, stage } from "@/lib/site";

import { Edged } from "./Instruments";
import { plateState } from "./plateState";

/** Lot and building, in world units at scale 1. */
const SHEET = { w: 2.6, d: 2.0 };
const FOOT = { w: 1.2, d: 0.9 };
const FLOOR_H = 0.34;
const STAKES = 8;

export function Site({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(
    () => ({
      sheet: new PlaneGeometry(SHEET.w, SHEET.d),
      stake: new CylinderGeometry(0.012, 0.012, 0.16, 6),
      column: new BoxGeometry(0.05, FLOOR_H * FLOORS, 0.05),
    }),
    [],
  );
  const walls = useRef<Group>(null);
  const frame = useRef<Group>(null);

  useFrame(() => {
    const active = plateState.instrument === "site";
    const s = stage(active ? plateState.beat : 0, active ? plateState.t : 0);
    if (walls.current)
      walls.current.children.forEach((w, i) => {
        w.rotation.x = -(s.hinge[i % s.hinge.length] ?? 0);
      });
    if (frame.current) frame.current.visible = s.floors > 0;
  });

  return (
    <group position={[0, -1.0, 0]}>
      {/* The sheet the whole chapter is drawn on. */}
      <Edged geometry={g.sheet} rotation={[-Math.PI / 2, 0, 0]} />
      {/* Eight survey stakes: the team that set the lot out. */}
      {Array.from({ length: STAKES }, (_, i) => {
        const a = (i / STAKES) * Math.PI * 2;
        return (
          <Edged
            key={i}
            geometry={g.stake}
            position={[Math.cos(a) * FOOT.w, 0.08, Math.sin(a) * FOOT.d]}
          />
        );
      })}
      <group ref={walls} />
      <group ref={frame}>
        {[-1, 1].map((sx) =>
          [-1, 0, 1].map((sz) => (
            <Edged
              key={`${sx}:${sz}`}
              geometry={g.column}
              position={[
                (sx * FOOT.w) / 2,
                (FLOOR_H * FLOORS) / 2,
                (sz * FOOT.d) / 2,
              ]}
            />
          )),
        )}
      </group>
      <group ref={mech} />
    </group>
  );
}
