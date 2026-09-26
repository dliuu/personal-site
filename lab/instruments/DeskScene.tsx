"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BoxGeometry,
  CylinderGeometry,
  Fog,
  Group,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  SpotLight,
  Vector3,
  type DirectionalLight,
  type HemisphereLight,
  type PerspectiveCamera,
} from "three";
import { flicker, parallax } from "@/lib/ambient";
import { buildCurves, sampleAt, type Keyframe } from "@/lib/cameraPath";
import {
  cameraU,
  isTyping,
  screenDistance,
  screenFade,
} from "@/lib/introTimeline";
import { useLabStore } from "@/store/useLabStore";
import { useSectionsStore } from "@/store/useSectionsStore";
import { BakedRoom } from "./BakedRoom";
import { DevFigure } from "./DevFigure";
import { chapters, sections } from "./chapters";
import { Plant } from "./Plant";
import { plateState } from "./plateState";
import { createRoomAudio, type RoomAudio } from "./roomAudio";
import { RoomLife } from "./RoomLife";
import { RoomSet, useThing } from "./RoomSet";
import { gobo, roomFonts } from "./roomTextures";
import { makeScreen } from "./screenTexture";
import { useRoomStore } from "./useRoomStore";

// Metres. The desk's front edge is at z = 0, the man sits at +z facing −z,
// the monitor faces him (+z), the camera comes from his side.
// The centre monitor of the baked workstation (see the props manifest): the
// real-time picture sits a centimetre in front of its panel.
const SCREEN_W = 0.66;
const SCREEN_H = 0.4;
const SCREEN_C = new Vector3(0.115, 1.24, -0.46);
const EISEN_PAPER =
  chapters.find((c) => c.id === "eisen")?.palette.paper ?? "#14161c";
const INTRO_CHAPTER = chapters.findIndex((c) => c.scene === "desk");
const FOG = new Fog("#5a4437", 8, 20);
const ESTABLISH_SECONDS = 2.5;
const ESTABLISH_OFFSET = new Vector3(-0.7, 0.35, 1.3);

const mat = (color: string, roughness = 0.8, metalness = 0) =>
  new MeshStandardMaterial({ color, roughness, metalness });

/** Advance a stage counter in idle time after the first frame, so detail never delays first paint. */
function useStagedMount(stages: number): number {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (stage >= stages) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const next = () => setStage((s) => s + 1);
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(next, { timeout: 800 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(next, 120);
    return () => window.clearTimeout(id);
  }, [stage, stages]);
  return stage;
}

export function DeskScene() {
  const root = useRef<Group>(null);
  const lamp = useRef<SpotLight>(null);
  const lampTarget = useRef<Group>(null);
  const windowLight = useRef<DirectionalLight>(null);
  const windowTarget = useRef<Group>(null);
  const glow = useRef<PointLight>(null);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const tier = useLabStore((s) => s.tier);
  const high = tier === "high";
  const narrow = size.width <= 720;
  const aspect = size.width / size.height;
  const lastDraw = useRef(-1);
  const stage = useStagedMount(2);
  const fonts = useMemo(() => roomFonts(), []);
  const typing = useRef(0);
  const establish = useRef(-1);
  const audio = useRef<RoomAudio | null>(null);
  const ptr = useRef(new Vector3());

  const screen = useMemo(() => makeScreen(), []);
  const goboTex = useMemo(() => gobo(), []);
  const g = useMemo(
    () => ({
      screen: new PlaneGeometry(SCREEN_W, SCREEN_H),
      seat: new BoxGeometry(0.46, 0.06, 0.46),
      back: new BoxGeometry(0.44, 0.5, 0.05),
      column: new CylinderGeometry(0.025, 0.025, 0.36, 10),
      base: new CylinderGeometry(0.3, 0.3, 0.03, 5),
      lampBase: new CylinderGeometry(0.09, 0.1, 0.02, 20),
      lampArm: new CylinderGeometry(0.012, 0.012, 0.55, 8),
      lampHead: new CylinderGeometry(0.03, 0.09, 0.12, 20, 1, true),
      bulb: new SphereGeometry(0.03, 12, 10),
    }),
    [],
  );
  const m = useMemo(
    () => ({
      dark: mat("#2a2724", 0.5, 0.2),
      metal: mat("#8c8c94", 0.35, 0.8),
      fabric: mat("#2a2b30", 0.95),
      brass: mat("#b08d4f", 0.3, 0.9),
      bulb: new MeshStandardMaterial({
        color: "#ffd9a3",
        emissive: "#ffb36b",
        emissiveIntensity: 3,
      }),
      // Unlit, so the room's lights never glint off the picture.
      screen: new MeshBasicMaterial({ map: screen.texture }),
    }),
    [screen.texture],
  );

  // The camera path, per aspect: rest, stood, over the desk, on the screen.
  const curves = useMemo(() => {
    const d = screenDistance(SCREEN_W, SCREEN_H, camera.fov, aspect) * 0.985;
    const onScreen: Keyframe = {
      position: [SCREEN_C.x, SCREEN_C.y, SCREEN_C.z + d],
      target: [SCREEN_C.x, SCREEN_C.y, SCREEN_C.z],
    };
    const keys: Keyframe[] = narrow
      ? [
          { position: [-1.1, 1.8, 3.8], target: [0.2, 0.9, 0.1] },
          { position: [-1.5, 1.7, 4.2], target: [0.4, 1.0, 0.3] },
          { position: [-0.3, 1.55, 1.2], target: [0.115, 1.24, -0.46] },
          onScreen,
        ]
      : [
          { position: [-1.6, 1.5, 2.6], target: [0.1, 0.95, 0.2] },
          { position: [-2.1, 1.45, 3.1], target: [0.35, 1.0, 0.3] },
          { position: [-0.35, 1.5, 0.9], target: [0.115, 1.24, -0.46] },
          onScreen,
        ];
    return buildCurves(keys);
  }, [aspect, narrow, camera.fov]);

  // Sound: built on the first toggle (a user gesture), never before.
  const soundOn = useRoomStore((s) => s.soundOn);
  const curtainsOpen = useRoomStore((s) => s.curtainsOpen);
  const petAwakeUntil = useRoomStore((s) => s.petAwakeUntil);
  const baked = useRoomStore((s) => s.baked);
  const hemi = useRef<HemisphereLight>(null);
  useEffect(() => {
    if (soundOn && !audio.current) {
      try {
        audio.current = createRoomAudio();
      } catch {
        return;
      }
    }
    if (!audio.current) return;
    if (soundOn) audio.current.start();
    else audio.current.stop();
  }, [soundOn]);
  useEffect(() => {
    audio.current?.setRain(curtainsOpen);
  }, [curtainsOpen]);
  useEffect(() => {
    if (petAwakeUntil) audio.current?.purr();
  }, [petAwakeUntil]);
  useEffect(() => () => audio.current?.dispose(), []);

  const lampThing = useThing("the lamp", "on for the evening");

  /* eslint-disable react-hooks/immutability -- r3f pattern: drive lights, materials, the scene fog and plateState in useFrame */
  useFrame(({ clock, pointer }, delta) => {
    const active = plateState.instrument === "desk";
    const sec = sections[useSectionsStore.getState().active];
    const visible = active || sec?.chapter === INTRO_CHAPTER;
    if (root.current) root.current.visible = visible;
    scene.fog = visible ? FOG : null;
    if (!active) {
      audio.current?.setLevel(0);
      return;
    }

    const p = plateState.p;
    const { reducedMotion } = useLabStore.getState();
    const room = useRoomStore.getState();
    const t = clock.elapsedTime;

    typing.current = isTyping(p) ? 1 : 0;

    // The screen types at rest (4 Hz redraw), freezes while scrolling, and
    // gives way to Eisen's colour at the seam.
    const fade = screenFade(p);
    const resting = isTyping(p);
    if (t - lastDraw.current > (resting ? 0.25 : 0.1) || fade > 0) {
      lastDraw.current = t;
      screen.draw(
        t,
        resting && !reducedMotion,
        !reducedMotion,
        fade,
        EISEN_PAPER,
      );
    }

    // Lamp: on with a filament flicker; the gobo shapes the pool.
    if (lamp.current) {
      lamp.current.intensity = 9 * (reducedMotion ? 1 : flicker(t));
      if (lampTarget.current) lamp.current.target = lampTarget.current;
      if (high && lamp.current.map !== goboTex) lamp.current.map = goboTex;
    }
    if (glow.current)
      glow.current.intensity =
        1.2 * (1 + (reducedMotion ? 0 : 0.04 * Math.sin(t * 11)));
    // With the baked room in, sun and sky are already in the lightmap; the
    // real-time copies drop so dynamic things still get lit and shadowed
    // without doubling the room.
    // Sunset: a low warm sun through the glass, the lamp and monitor on.
    const bakedK = room.baked ? 0.5 : 1;
    if (hemi.current) hemi.current.intensity = (room.baked ? 0.07 : 0.3) * 4;
    if (windowLight.current) {
      windowLight.current.intensity =
        (room.curtainsOpen ? 0.35 : 0.15) * bakedK * 6;
      if (windowTarget.current)
        windowLight.current.target = windowTarget.current;
    }

    // Camera: the path, plus at rest a breathing sway and pointer parallax,
    // and once per session an establishing move into the first frame.
    sampleAt(
      curves,
      cameraU(p),
      plateState.introCam.pos,
      plateState.introCam.tgt,
    );
    const rest = Math.max(0, 1 - p / 0.08);
    if (!reducedMotion && rest > 0) {
      const [px, py] = parallax(pointer.x, pointer.y, size.width <= 720);
      ptr.current.set(
        px + 0.01 * Math.sin(t * 0.5),
        py + 0.008 * Math.sin(t * 0.37),
        0,
      );
      plateState.introCam.pos.addScaledVector(ptr.current, rest);
    }
    if (establish.current < 0) {
      establish.current =
        reducedMotion || sessionStorage.getItem("instruments-establish")
          ? 1
          : 0;
      sessionStorage.setItem("instruments-establish", "1");
    } else if (establish.current < 1) {
      establish.current = Math.min(
        1,
        establish.current + delta / ESTABLISH_SECONDS,
      );
    }
    if (establish.current < 1) {
      const e = establish.current;
      const ease = 1 - Math.pow(1 - e, 3);
      plateState.introCam.pos.addScaledVector(
        ESTABLISH_OFFSET,
        (1 - ease) * rest,
      );
    }

    // Sound fades as the story leaves the room.
    audio.current?.setLevel(
      room.soundOn ? 1 - Math.min(1, Math.max(0, (p - 0.5) / 0.15)) : 0,
    );
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group ref={root} visible={false}>
      <hemisphereLight ref={hemi} args={["#cfe0f0", "#b8a58a", 0.6]} />
      {/* The sun, low through the glass wall, going down behind the city. */}
      <directionalLight
        ref={windowLight}
        color="#ff9a60"
        intensity={2.4}
        position={[1.6, 3.2, -4.5]}
        castShadow={high}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3.5}
        shadow-camera-right={3.5}
        shadow-camera-top={3.5}
        shadow-camera-bottom={-3.5}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-bias={-0.0006}
        shadow-radius={3}
      />
      <group ref={windowTarget} position={[0, 0.6, 0.4]} />
      <spotLight
        ref={lamp}
        color="#ffb36b"
        intensity={30}
        distance={4}
        angle={0.8}
        penumbra={0.6}
        decay={2}
        position={[-0.5, 1.25, -0.35]}
        castShadow={high}
        shadow-mapSize={[1024, 1024]}
        shadow-radius={4}
        shadow-bias={-0.0005}
      />
      <group ref={lampTarget} position={[0, 0.75, -0.2]} />
      <pointLight
        ref={glow}
        color="#9fc3ff"
        intensity={1.2}
        distance={2.5}
        decay={2}
        position={[0.115, 1.25, -0.35]}
      />

      <BakedRoom />
      <RoomSet stage={stage} fonts={fonts} />
      <RoomLife stage={stage} typing={typing} />

      {/* The desk is baked (the workstation in the props manifest); only what sits on it is here */}
      <mesh
        geometry={g.screen}
        material={m.screen}
        position={[SCREEN_C.x, SCREEN_C.y, SCREEN_C.z]}
      />
      <group position={[-0.6, 0.755, -0.5]} {...lampThing}>
        <mesh geometry={g.lampBase} visible={!baked} material={m.brass} />
        <mesh
          geometry={g.lampArm}
          visible={!baked}
          material={m.brass}
          position={[0.05, 0.27, 0.07]}
          rotation={[0.25, 0, -0.2]}
        />
        <mesh
          geometry={g.lampHead}
          visible={!baked}
          material={m.brass}
          position={[0.1, 0.5, 0.15]}
          rotation={[0.5, 0, -0.3]}
        />
        <mesh
          geometry={g.bulb}
          material={m.bulb}
          position={[0.11, 0.47, 0.16]}
        />
      </group>
      <group visible={!baked}>
        <Plant
          position={[-1.35, 0, -0.5]}
          leaves={8}
          size={0.42}
          color="#3f7a45"
          potR={0.17}
          potH={0.36}
        />
      </group>

      {/* Chair */}
      <mesh
        geometry={g.base}
        visible={!baked}
        material={m.dark}
        position={[0, 0.02, 0.42]}
      />
      <mesh
        geometry={g.column}
        visible={!baked}
        material={m.metal}
        position={[0, 0.22, 0.42]}
      />
      <mesh
        geometry={g.seat}
        visible={!baked}
        material={m.fabric}
        position={[0, 0.43, 0.42]}
        castShadow
      />
      <mesh
        geometry={g.back}
        visible={!baked}
        material={m.fabric}
        position={[0, 0.72, 0.64]}
        rotation={[-0.1, 0, 0]}
        castShadow
      />

      <DevFigure />
    </group>
  );
}
