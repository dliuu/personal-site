"use client";

import { createRef, useEffect, useMemo, useRef, type RefObject } from "react";
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
import { Hotspots, useHotspotDismiss } from "./Hotspots";
import { INK, PARCHMENT } from "./palette";
import { useExploreStore } from "./useExploreStore";
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

// Per-instrument half-width (world units at scale 1), used to shrink wide
// instruments to fit inside HERO_RADIUS; compact ones keep scale 1.
const FIT: Record<InstrumentKind, number> = {
  armillary: 1.75 / 1.9,
  balance: 1.75 / 1.5,
  globe: 1.75 / 1.5,
  bridge: 1.75 / 2.1,
  quadrant: 1.75 / 1.45,
};

function smooth(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

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
  const yaw = useRef<number[]>(chapters.map(() => 0));
  const fadeCur = useRef(1);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const size = useThree((s) => s.size);
  const vp = useThree((s) => s.viewport);
  const gl = useThree((s) => s.gl);
  const active = useSectionsStore((s) => s.active);
  const tall = useSectionsStore((s) => s.tall);
  const place = heroPlacement({
    width: size.width,
    height: size.height,
    vpWidth: vp.width,
    vpHeight: vp.height,
  });
  const narrow = size.width <= 720;

  // Drag the canvas left/right to turn the chapter in view; it eases back.
  /* eslint-disable react-hooks/immutability -- the canvas element is the drag surface; its listeners and touch/select behaviour are ours to set */
  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      lastX.current = e.clientX;
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const i = useSectionsStore.getState().active;
      yaw.current[i] += (e.clientX - lastX.current) * 0.006;
      lastX.current = e.clientX;
    };
    const up = () => {
      dragging.current = false;
    };
    el.style.touchAction = "pan-y";
    el.style.userSelect = "none";
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("blur", up);
    return () => {
      el.style.touchAction = "";
      el.style.userSelect = "";
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", up);
    };
  }, [gl]);
  /* eslint-enable react-hooks/immutability */

  useHotspotDismiss();

  useEffect(() => () => useExploreStore.getState().setOpen(null), []);

  // eslint-disable-next-line react-hooks/immutability -- r3f pattern: mutate ref object3Ds in useFrame
  useFrame(({ camera, clock }, delta) => {
    const { continuous, depth, tall } = useSectionsStore.getState();
    const { reducedMotion } = useLabStore.getState();
    const fadeTarget = narrow && tall ? 1 - smooth(0.28, 0.55, depth) : 1;
    fadeCur.current = reducedMotion
      ? fadeTarget
      : lerp(fadeCur.current, fadeTarget, frameLerp(LERP, delta));
    const fade = fadeCur.current;

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
      let op = lineOpacity(w);
      solid.visible = ss > 0.001 && fade > 0.6;
      op *= Math.max(0.12, fade);
      solid.scale.setScalar(Math.max(ss, 0.0001));
      lines.scale.setScalar(Math.max(lineScale(w), 0.0001));
      // eslint-disable-next-line react-hooks/immutability -- r3f pattern: mutate the memoized line material in useFrame
      lineMaterials[i].opacity = op;

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
      if (!dragging.current)
        yaw.current[i] = lerp(yaw.current[i], 0, frameLerp(0.03, delta));
      root.rotation.y =
        (reducedMotion ? 0 : 0.15 * Math.sin(clock.elapsedTime * 0.2)) +
        yaw.current[i];
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
              scale={Math.min(1, FIT[c.instrument])}
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
              <Hotspots
                chapterId={c.id}
                kind={c.instrument}
                palette={c.palette}
                visible={i === active && !(narrow && tall)}
              />
            </group>
          );
        })}
      </group>
    </>
  );
}
