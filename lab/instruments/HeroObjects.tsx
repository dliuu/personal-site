"use client";

import { createRef, useEffect, useMemo, useRef, type RefObject } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { DirectionalLight, Group, LineBasicMaterial, Vector3 } from "three";
import { heroPlacement } from "@/lib/heroRegion";
import { heroContinuous } from "@/lib/heroContinuous";
import { heroWeight } from "@/lib/sectionProgress";
import { lerp } from "@/lib/progress";
import { beatAt, expandAmount, revealAmount, smooth } from "@/lib/beats";
import { plateCamera, ZOOM_K, type CameraKey } from "@/lib/plateCamera";
import { frameLerp, lineOpacity, lineScale, solidScale } from "@/lib/drawIn";
import { useLabStore } from "@/store/useLabStore";
import { useSectionsStore } from "@/store/useSectionsStore";
import {
  chapters,
  sections,
  type InstrumentKind,
  type PlateBeat,
} from "./chapters";
import { locales, NYC } from "./locales";
import { DeskScene } from "./DeskScene";
import { Network } from "./Network";
import { Hotspots, useHotspotDismiss } from "./Hotspots";
import { INK, PARCHMENT } from "./palette";
import { plateState } from "./plateState";
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
const EXPAND_LERP = 0.1;
const CAM_LERP = 0.08;
// Where the plate opens: the Americas at full distance, so beat 0 turns east
// onto New York. Narrow screens stop a little further out on close-ups.
const ENTRY: CameraKey = { lon: -105, lat: 10, k: ZOOM_K.full };
const CLOSE_K_NARROW = 2.1;
// The globe's sphere sits 0.3 below its root; lift the hero so the sphere is
// centred on screen while the plate is open.
const PLATE_LIFT = 0.3;
/** Camera keys for a plate's beats: an anchor's lat/lon, or a longitude to face. */
function beatKeys(beats: PlateBeat[], closeK: number): CameraKey[] {
  return beats.map((b) => {
    const k = b.zoom === "close" ? closeK : ZOOM_K[b.zoom];
    if (b.at === "nyc") return { lon: NYC.lon, lat: NYC.lat, k };
    const l = b.at ? locales.find((x) => x.id === b.at) : undefined;
    return l
      ? { lon: l.lon, lat: l.lat, k }
      : { lon: b.lon ?? 0, lat: b.lat ?? 0, k };
  });
}
// Key light at rest, and raking low from camera-left during the beat-1 push-in.
const KEY_POS = new Vector3(3, 4, 5);
const KEY_RAKE = new Vector3(-4, 1.5, 4);

const KIND: Record<
  InstrumentKind,
  (p: { mech: RefObject<Group | null> }) => JSX.Element
> = {
  desk: () => <></>,
  armillary: Armillary,
  balance: Balance,
  network: Network,
  globe: Globe,
  bridge: Bridge,
  quadrant: Quadrant,
};

// Per-instrument half-width (world units at scale 1), used to shrink wide
// instruments to fit inside HERO_RADIUS; compact ones keep scale 1.
const FIT: Record<InstrumentKind, number> = {
  desk: 1,
  armillary: 1.75 / 1.9,
  balance: 1.75 / 1.5,
  network: 1.75 / 1.6,
  globe: 1.75 / 1.5,
  bridge: 1.75 / 2.1,
  quadrant: 1.75 / 1.45,
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
  const yaw = useRef<number[]>(chapters.map(() => 0));
  const idleAngle = useRef<number[]>(chapters.map(() => 0));
  const settleOff = useRef<number[]>(chapters.map(() => 0));
  const keyGoal = useRef(new Vector3().copy(KEY_POS));
  const fadeCur = useRef(1);
  const expandCur = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const parentRef = useRef<Group | null>(null);
  const keyLight = useRef<DirectionalLight | null>(null);
  const rimLight = useRef<DirectionalLight | null>(null);
  const camPos = useRef(new Vector3(0, 0, CAMERA_Z));
  const camTgt = useRef(new Vector3(0, 0, 0));
  const goalPos = useRef(new Vector3(0, 0, CAMERA_Z));
  const goalTgt = useRef(new Vector3(0, 0, 0));
  const tmp = useRef(new Vector3());
  const plateGoal = useRef(new Vector3());
  const sceneWas = useRef(false);
  const size = useThree((s) => s.size);
  const vp = useThree((s) => s.viewport);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const active = useSectionsStore((s) => s.active);
  const tall = useSectionsStore((s) => s.tall);
  const place = heroPlacement({
    width: size.width,
    height: size.height,
    vpWidth: vp.width,
    vpHeight: vp.height,
  });
  // Scale at which the hero fills the viewport height when a plate expands it.
  const full = (0.38 * vp.height) / 1.75;
  const narrow = size.width <= 720;
  const keys = useMemo(
    () =>
      chapters.map((c) =>
        c.plate
          ? beatKeys(c.plate.beats, narrow ? CLOSE_K_NARROW : ZOOM_K.close)
          : null,
      ),
    [narrow],
  );

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
      const i = sections[useSectionsStore.getState().active]?.chapter ?? 0;
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
    const { active, progress, depth, tall } = useSectionsStore.getState();
    const { reducedMotion } = useLabStore.getState();
    const sec = sections[active] ?? sections[0];
    const chapter = chapters[sec.chapter];
    // Heroes follow chapters, not sections: a plate holds its chapter centred
    // and hands off to the next hero as it shrinks back.
    const heroCont = heroContinuous(sections, active, progress);
    const fadeTarget =
      narrow && tall && sec.kind !== "plate"
        ? 1 - smooth(0.28, 0.55, depth)
        : 1;
    fadeCur.current = reducedMotion
      ? fadeTarget
      : lerp(fadeCur.current, fadeTarget, frameLerp(LERP, delta));
    const fade = fadeCur.current;

    const expandTarget = sec.kind === "plate" ? expandAmount(progress) : 0;
    expandCur.current = reducedMotion
      ? expandTarget
      : lerp(expandCur.current, expandTarget, frameLerp(EXPAND_LERP, delta));
    const expand = expandCur.current;

    // Publish before anything reads it, so instruments drawing in their own
    // useFrame (which may run before or after this one) see a coherent frame.
    plateState.instrument = sec.kind === "plate" ? chapter.instrument : null;
    plateState.p = sec.kind === "plate" ? progress : 0;
    const b = beatAt(plateState.p, chapter.plate?.beats.length ?? 1);
    plateState.beat = b.index;
    plateState.t = b.t;
    plateState.expand = expand;
    const k = keys[sec.chapter];
    if (sec.kind === "plate" && k) {
      const cam = plateCamera(ENTRY, k, b.index, b.t);
      plateState.cam.yaw = cam.yaw;
      plateState.cam.el = cam.el;
      plateState.cam.k = cam.k;
    }
    // A scene chapter is drawn real from its first frame; plates reveal.
    const isScene = Boolean(chapter.scene);
    plateState.reveal = isScene || chapter.screen ? 1 : revealAmount(expand);
    // The studio environment only lights the revealed globe (and, faintly, the room).
    // eslint-disable-next-line react-hooks/immutability -- r3f pattern: scene setting driven in useFrame
    scene.environmentIntensity = isScene ? 0.35 : plateState.reveal;

    const parent = parentRef.current;
    if (parent) {
      // The plate centres the hero; the camera then orbits its sphere.
      parent.position.set(
        lerp(place.x, 0, expand),
        lerp(place.y, PLATE_LIFT * full, expand),
        0,
      );
      parent.scale.setScalar(lerp(place.scale, full, expand));
    }

    if (!primed.current) {
      primed.current = true;
      for (let i = 0; i < chapters.length; i++) {
        weights.current[i] =
          i === 0 && !reducedMotion ? 0 : heroWeight(i, heroCont);
      }
      if (reducedMotion) introDone.current = true;
    }

    for (let i = 0; i < chapters.length; i++) {
      const { root, solid, lines } = refs.current[i];
      if (!root || !solid || !lines) continue;

      const inPlate = plateState.instrument === chapters[i].instrument;
      const target = heroWeight(i, heroCont);
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
      // The construction lines dissolve with the engraving in the plate.
      if (inPlate) op *= 1 - plateState.reveal;
      solid.scale.setScalar(Math.max(ss, 0.0001));
      lines.scale.setScalar(Math.max(lineScale(w), 0.0001));
      // eslint-disable-next-line react-hooks/immutability -- r3f pattern: mutate the memoized line material in useFrame
      lineMaterials[i].opacity = op;

      const t = heroCont - i;
      const base = t * Math.PI * 0.8;
      // Idle spin is an accumulated angle (not clock time) so its plate can
      // pause it and fold an offset into it.
      if (!inPlate && settleOff.current[i] !== 0) {
        // Leaving the plate: absorb the scripted offset so nothing unwinds.
        idleAngle.current[i] += settleOff.current[i];
        settleOff.current[i] = 0;
      }
      if (!reducedMotion && !inPlate)
        idleAngle.current[i] += delta * chapters[i].spin;
      const idle = idleAngle.current[i];
      // In its plate the yaw is scripted per beat (plateYaw); the offset
      // cancels the running spin, so the turn never snaps.
      const goal = inPlate ? plateState.cam.yaw - (base + idle) : 0;
      settleOff.current[i] = reducedMotion
        ? goal
        : lerp(settleOff.current[i], goal, frameLerp(CAM_LERP, delta));
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
            m.rotation.y = base + idle + settleOff.current[i];
        }
      }
      if (!dragging.current)
        yaw.current[i] = lerp(yaw.current[i], 0, frameLerp(0.03, delta));
      root.rotation.y =
        (reducedMotion ? 0 : 0.15 * Math.sin(clock.elapsedTime * 0.2)) +
        yaw.current[i];
    }

    if (keyLight.current) keyLight.current.intensity = 2.5 + 0.7 * expand;
    if (rimLight.current) rimLight.current.intensity = 1.2 * expand;
    // Beat 1: the key light swings low across the surface so coasts catch
    // hatching under the push-in.
    const rake = plateState.instrument
      ? Math.min(1, Math.max(0, (2.2 - plateState.cam.k) / 0.5))
      : 0;
    keyGoal.current.copy(KEY_POS).lerp(KEY_RAKE, rake);
    if (keyLight.current)
      keyLight.current.position.lerp(
        keyGoal.current,
        reducedMotion ? 1 : frameLerp(CAM_LERP, delta),
      );

    goalPos.current.set(0, 0, CAMERA_Z - DOLLY * (heroCont / chapters.length));
    goalTgt.current.set(0, 0, 0);
    if (chapter.scene === "desk" && sec.kind === "plate") {
      // The room owns its camera path; DeskScene writes it each frame.
      goalPos.current.copy(plateState.introCam.pos);
      goalTgt.current.copy(plateState.introCam.tgt);
    } else if (parent && plateState.instrument) {
      // Orbit the sphere's centre: rise to the anchor's latitude, sit k radii
      // out, and look at the centre; blended in by expand so entry is smooth.
      // From the chapter's own root: odd chapters sit 0.6 behind the parent.
      tmp.current.set(0, -PLATE_LIFT, 0);
      (refs.current[sec.chapter].root ?? parent).localToWorld(tmp.current);
      const R = 1.05 * parent.scale.x;
      const { el, k } = plateState.cam;
      plateGoal.current
        .set(0, Math.sin(el), Math.cos(el))
        .multiplyScalar(k * R)
        .add(tmp.current);
      goalPos.current.lerp(plateGoal.current, expand);
      goalTgt.current.lerp(tmp.current, expand);
    }
    // Leaving the room lands inside the monitor with the screen covering the
    // viewport, so the camera snaps to the next chapter's rig unseen.
    const wasScene = sceneWas.current;
    sceneWas.current = chapter.scene === "desk";
    const ck =
      reducedMotion || wasScene !== sceneWas.current
        ? 1
        : frameLerp(CAM_LERP, delta);
    camPos.current.lerp(goalPos.current, ck);
    camTgt.current.lerp(goalTgt.current, ck);
    camera.position.copy(camPos.current);
    camera.lookAt(camTgt.current);
  });

  return (
    <>
      <hemisphereLight args={[PARCHMENT, INK, 0.6]} />
      {/* A studio for the revealed globe: warm key, cool fill, thin rim. Its
          intensity is driven per frame from plateState.reveal. */}
      <Environment frames={1} resolution={256} environmentIntensity={0}>
        <Lightformer
          form="rect"
          color="#fff1dc"
          intensity={2.2}
          scale={[4, 4]}
          position={[4, 5, 4]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          color="#cfe0f5"
          intensity={1.2}
          scale={[6, 6]}
          position={[-6, 2, 2]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          color="#ffffff"
          intensity={2}
          scale={[8, 0.6]}
          position={[0, 3, -6]}
          target={[0, 0, 0]}
        />
      </Environment>
      <DeskScene />
      <directionalLight
        ref={keyLight}
        color="#fff1dc"
        intensity={2.5}
        position={[3, 4, 5]}
      />
      <directionalLight
        color={PARCHMENT}
        intensity={0.8}
        position={[-4, -2, -3]}
      />
      <directionalLight
        ref={rimLight}
        color="#fff6e6"
        intensity={0}
        position={[-3, 2, -4]}
      />
      <group ref={parentRef}>
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
                visible={
                  sections[active]?.chapter === i &&
                  sections[active]?.kind !== "plate" &&
                  !(narrow && tall)
                }
              />
            </group>
          );
        })}
      </group>
    </>
  );
}
