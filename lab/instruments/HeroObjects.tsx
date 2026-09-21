"use client";

import { createRef, useMemo, useRef, type RefObject } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, LineBasicMaterial } from "three";
import { heroPlacement } from "@/lib/heroRegion";
import { heroWeight } from "@/lib/sectionProgress";
import { lerp } from "@/lib/progress";
import { frameLerp, lineOpacity, lineScale, solidScale } from "@/lib/drawIn";
import { useLabStore } from "@/store/useLabStore";
import { useSectionsStore } from "@/store/useSectionsStore";
import { chapters, type InstrumentKind } from "./chapters";
import { INK, PARCHMENT } from "./palette";
import {
  Armillary,
  Balance,
  Bridge,
  EdgedModeContext,
  Globe,
  Quadrant,
} from "./Instruments";

const CAMERA_Z = 6;
const DOLLY = 0.4;
const INTRO_LERP = 0.05;
const LERP = 0.12;

const KIND: Record<
  InstrumentKind,
  (p: { mech: RefObject<Group | null> }) => JSX.Element
> = {
  armillary: Armillary,
  balance: Balance,
  globe: Globe,
  bridge: Bridge,
  quadrant: Quadrant,
};

type Refs = { root: Group | null; solid: Group | null; lines: Group | null };

export function HeroObjects() {
  const refs = useRef<Refs[]>(
    chapters.map(() => ({ root: null, solid: null, lines: null })),
  );
  const mechs = useMemo(
    () =>
      chapters.map(() => ({
        solid: createRef<Group | null>(),
        lines: createRef<Group | null>(),
      })),
    [],
  );
  const lineMaterials = useMemo(
    () =>
      chapters.map(
        () =>
          new LineBasicMaterial({ color: INK, transparent: true, opacity: 1 }),
      ),
    [],
  );
  const weights = useRef<number[]>(chapters.map(() => 0));
  const primed = useRef(false);
  const introDone = useRef(false);
  const size = useThree((s) => s.size);
  const vp = useThree((s) => s.viewport);
  const place = heroPlacement({
    width: size.width,
    height: size.height,
    vpWidth: vp.width,
    vpHeight: vp.height,
  });

  // eslint-disable-next-line react-hooks/immutability -- r3f pattern: mutate ref object3Ds in useFrame
  useFrame(({ camera, clock }, delta) => {
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
      const { root, solid, lines } = refs.current[i];
      if (!root || !solid || !lines) continue;

      const target = heroWeight(i, continuous);
      const k = i === 0 && !introDone.current ? INTRO_LERP : LERP;
      let w = reducedMotion
        ? target
        : lerp(weights.current[i], target, frameLerp(k, delta));
      if (Math.abs(w - target) < 1e-3) {
        w = target;
        if (i === 0) introDone.current = true;
      }
      weights.current[i] = w;

      root.visible = w > 0.001;
      const ss = solidScale(w);
      solid.visible = ss > 0.001;
      solid.scale.setScalar(Math.max(ss, 0.0001));
      lines.scale.setScalar(Math.max(lineScale(w), 0.0001));
      // eslint-disable-next-line react-hooks/immutability -- r3f pattern: mutate the memoized line material in useFrame
      lineMaterials[i].opacity = lineOpacity(w);

      const t = continuous - i;
      const base = t * Math.PI * 0.8;
      const idle = reducedMotion ? 0 : clock.elapsedTime * chapters[i].spin;
      for (const m of [mechs[i].solid.current, mechs[i].lines.current]) {
        if (!m) continue;
        switch (chapters[i].mech) {
          case "swing":
            m.rotation.z = Math.sin(base) * 0.35;
            break;
          case "spinZ":
            m.rotation.z = base + idle;
            break;
          case "tilt": {
            const u = Math.min(1, Math.max(0, t));
            m.rotation.z = 0.22 * Math.sin(Math.PI * 2 * u) * (1 - u);
            break;
          }
          case "drop": {
            const p = Math.min(1, Math.max(0, t / 0.5));
            m.position.y = 0.5 * (1 - p);
            break;
          }
          default:
            m.rotation.y = base + idle;
        }
      }
      root.rotation.y = reducedMotion
        ? 0
        : 0.15 * Math.sin(clock.elapsedTime * 0.2);
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
      <group position={[place.x, place.y, 0]} scale={place.scale}>
        {chapters.map((c, i) => {
          const Instrument = KIND[c.instrument];
          return (
            <group
              key={c.id}
              ref={(el) => {
                refs.current[i].root = el;
              }}
              position={[0, 0, -(i % 2) * 0.6]}
              visible={false}
            >
              <EdgedModeContext.Provider value={{ mode: "solid" }}>
                <group
                  ref={(el) => {
                    refs.current[i].solid = el;
                  }}
                >
                  <Instrument mech={mechs[i].solid} />
                </group>
              </EdgedModeContext.Provider>
              <EdgedModeContext.Provider
                value={{ mode: "lines", lineMaterial: lineMaterials[i] }}
              >
                <group
                  ref={(el) => {
                    refs.current[i].lines = el;
                  }}
                >
                  <Instrument mech={mechs[i].lines} />
                </group>
              </EdgedModeContext.Provider>
            </group>
          );
        })}
      </group>
    </>
  );
}
