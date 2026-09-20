"use client";

import { createRef, useMemo, useRef, type RefObject } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group, LineSegments, Material, Mesh } from "three";
import { heroWeight } from "@/lib/sectionProgress";
import { lerp } from "@/lib/progress";
import { useLabStore } from "@/store/useLabStore";
import { useSectionsStore } from "@/store/useSectionsStore";
import { chapters, type InstrumentKind } from "./chapters";
import { INK, PARCHMENT } from "./palette";
import { Armillary, Astrolabe, Gears, Quadrant } from "./Instruments";

const CAMERA_Z = 6;
const DOLLY = 0.4;
const INTRO_LERP = 0.05;
const LERP = 0.12;

const KIND: Record<
  InstrumentKind,
  (p: { mech: RefObject<Group | null> }) => JSX.Element
> = {
  armillary: Armillary,
  astrolabe: Astrolabe,
  gears: Gears,
  quadrant: Quadrant,
};

type Cache = { solids: Mesh[]; edges: LineSegments[] };

function collect(root: Group): Cache {
  const solids: Mesh[] = [];
  const edges: LineSegments[] = [];
  root.traverse((o) => {
    if (o.name === "solid") solids.push(o as Mesh);
    if (o.name === "edge") edges.push(o as LineSegments);
  });
  return { solids, edges };
}

export function HeroObjects() {
  const roots = useRef<(Group | null)[]>([]);
  const caches = useRef<(Cache | null)[]>([]);
  const mechs = useMemo(
    () => chapters.map(() => createRef<Group | null>()),
    [],
  );
  const weights = useRef<number[]>(chapters.map(() => 0));
  const primed = useRef(false);
  const introDone = useRef(false);
  const width = useThree((s) => s.size.width);
  const narrow = width <= 720;

  // eslint-disable-next-line react-hooks/immutability -- r3f pattern: mutate ref object3Ds in useFrame
  useFrame(({ camera }, delta) => {
    const { continuous } = useSectionsStore.getState();
    const { reducedMotion } = useLabStore.getState();

    if (!primed.current) {
      primed.current = true;
      for (let i = 0; i < chapters.length; i++) {
        weights.current[i] =
          i === 0 && !reducedMotion ? 0 : heroWeight(i, continuous);
      }
      if (reducedMotion) introDone.current = true;
    }

    for (let i = 0; i < chapters.length; i++) {
      const root = roots.current[i];
      if (!root) continue;
      if (!caches.current[i]) caches.current[i] = collect(root);
      const { solids, edges } = caches.current[i]!;

      const target = heroWeight(i, continuous);
      const factor = i === 0 && !introDone.current ? INTRO_LERP : LERP;
      let w = reducedMotion ? target : lerp(weights.current[i], target, factor);
      if (Math.abs(w - target) < 1e-3) {
        w = target;
        if (i === 0) introDone.current = true;
      }
      weights.current[i] = w;

      root.visible = w > 0.001;
      const lineScale = Math.min(1, 1.6 * w);
      const solidScale = Math.max(0, (w - 0.35) / 0.65);
      const lineOpacity = 0.15 + 0.85 * (1 - w);
      for (const m of solids) {
        m.scale.setScalar(Math.max(solidScale, 0.0001));
        m.visible = solidScale > 0.001;
      }
      for (const e of edges) {
        e.scale.setScalar(Math.max(lineScale, 0.0001));
        (e.material as Material).opacity = lineOpacity;
      }

      // mechanism: chapter-local progress turns the moving part
      const mech = mechs[i].current;
      if (mech) {
        const t = continuous - i;
        const idle = reducedMotion ? 0 : chapters[i].spin;
        const base = t * Math.PI * 0.8;
        if (chapters[i].instrument === "quadrant") {
          // eslint-disable-next-line react-hooks/immutability -- r3f pattern: mutate the ref's object3D in useFrame
          mech.rotation.z = Math.sin(base) * 0.35;
        } else {
          mech.rotation.y =
            base + (reducedMotion ? 0 : (performance.now() / 1000) * idle);
        }
      }
      if (!reducedMotion) root.rotation.y += delta * 0.05;
    }

    camera.position.z = CAMERA_Z - DOLLY * (continuous / chapters.length);
  });

  return (
    <>
      <hemisphereLight args={[PARCHMENT, INK, 0.6]} />
      <directionalLight color="#fff1dc" intensity={2.5} position={[3, 4, 5]} />
      <directionalLight
        color={PARCHMENT}
        intensity={0.8}
        position={[-4, -2, -3]}
      />
      <group
        position={narrow ? [0, 1.5, 0] : [1.6, 0, 0]}
        scale={narrow ? 0.6 : 0.95}
      >
        {chapters.map((c, i) => {
          const Instrument = KIND[c.instrument];
          return (
            <group
              key={c.id}
              ref={(el) => {
                roots.current[i] = el;
              }}
              position={[0, 0, -(i % 2) * 0.6]}
              visible={false}
            >
              <Instrument mech={mechs[i]} />
            </group>
          );
        })}
      </group>
    </>
  );
}
