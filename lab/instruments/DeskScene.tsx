"use client";

import { useMemo, useRef } from "react";
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
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SpotLight,
  Vector3,
  type PerspectiveCamera,
} from "three";
import { buildCurves, sampleAt, type Keyframe } from "@/lib/cameraPath";
import {
  cameraU,
  pose,
  screenDistance,
  screenFade,
  STAND,
} from "@/lib/introTimeline";
import { useLabStore } from "@/store/useLabStore";
import { useSectionsStore } from "@/store/useSectionsStore";
import { Avatar, type AvatarHandle } from "./Avatar";
import { chapters, sections } from "./chapters";
import { plateState } from "./plateState";
import { makeScreen } from "./screenTexture";

// Metres. The desk's front edge is at z = 0, the man sits at +z facing −z,
// the monitor faces him (+z), the camera comes from his side.
const SCREEN_W = 0.585;
const SCREEN_H = 0.33;
const SCREEN_C = new Vector3(0, 1.05, -0.44);
const EISEN_PAPER =
  chapters.find((c) => c.id === "eisen")?.palette.paper ?? "#14161c";
const INTRO_CHAPTER = chapters.findIndex((c) => c.scene === "desk");
const FOG = new Fog("#1c1a24", 7, 14);

const mat = (color: string, roughness = 0.8, metalness = 0) =>
  new MeshStandardMaterial({ color, roughness, metalness });

/** A leaf outline for ShapeGeometry: a pointed ellipse, tip along +y. */
function leafShape(w: number, l: number): Shape {
  const s = new Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(w, l * 0.3, w, l * 0.75, 0, l);
  s.bezierCurveTo(-w, l * 0.75, -w, l * 0.3, 0, 0);
  return s;
}

function Plant({
  position,
  leaves,
  size,
  color,
  potColor = "#8a6a55",
  potH = 0.3,
  potR = 0.16,
  droop = 0,
}: {
  position: [number, number, number];
  leaves: number;
  size: number;
  color: string;
  potColor?: string;
  potH?: number;
  potR?: number;
  droop?: number;
}) {
  const g = useMemo(
    () => ({
      pot: new CylinderGeometry(potR, potR * 0.8, potH, 20),
      soil: new CylinderGeometry(potR * 0.95, potR * 0.95, 0.02, 20),
      leaf: new ShapeGeometry(leafShape(size * 0.35, size)),
      stem: new CylinderGeometry(0.006, 0.008, size * 0.9, 6),
    }),
    [potH, potR, size],
  );
  const m = useMemo(
    () => ({
      pot: mat(potColor, 0.9),
      soil: mat("#2b1f16", 1),
      leaf: new MeshStandardMaterial({ color, roughness: 0.7, side: 2 }),
      stem: mat("#3f6b3a", 0.9),
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
      <group ref={sway} position={[0, potH, 0]}>
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

export function DeskScene() {
  const root = useRef<Group>(null);
  const avatar = useRef<AvatarHandle>(null);
  const lamp = useRef<SpotLight>(null);
  const lampTarget = useRef<Group>(null);
  const glow = useRef<PointLight>(null);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const narrow = size.width <= 720;
  const aspect = size.width / size.height;
  const lastDraw = useRef(-1);

  const screen = useMemo(() => makeScreen(), []);
  const g = useMemo(
    () => ({
      floor: new PlaneGeometry(9, 9),
      wall: new PlaneGeometry(9, 4),
      rug: new PlaneGeometry(2.6, 1.8),
      deskTop: new BoxGeometry(1.7, 0.035, 0.75),
      deskLeg: new BoxGeometry(0.05, 0.72, 0.7),
      panel: new BoxGeometry(0.63, 0.37, 0.03),
      screen: new PlaneGeometry(SCREEN_W, SCREEN_H),
      stem: new BoxGeometry(0.05, 0.16, 0.04),
      foot: new BoxGeometry(0.28, 0.015, 0.16),
      keyboard: new BoxGeometry(0.44, 0.015, 0.15),
      mouse: new BoxGeometry(0.06, 0.025, 0.1),
      mug: new CylinderGeometry(0.045, 0.04, 0.1, 16),
      seat: new BoxGeometry(0.46, 0.06, 0.46),
      back: new BoxGeometry(0.44, 0.5, 0.05),
      column: new CylinderGeometry(0.025, 0.025, 0.36, 10),
      base: new CylinderGeometry(0.3, 0.3, 0.03, 5),
      lampBase: new CylinderGeometry(0.09, 0.1, 0.02, 20),
      lampArm: new CylinderGeometry(0.012, 0.012, 0.55, 8),
      lampHead: new CylinderGeometry(0.03, 0.09, 0.12, 20, 1, true),
      bulb: new SphereGeometry(0.03, 12, 10),
      shelf: new BoxGeometry(0.8, 0.03, 0.26),
      book: new BoxGeometry(0.035, 0.22, 0.17),
      window: new PlaneGeometry(0.9, 1.1),
      frame: new BoxGeometry(0.05, 1.2, 0.03),
      frameH: new BoxGeometry(1.0, 0.05, 0.03),
      poster: new PlaneGeometry(0.42, 0.55),
      posterFrame: new BoxGeometry(0.48, 0.61, 0.025),
    }),
    [],
  );
  const m = useMemo(
    () => ({
      floor: mat("#2a2320", 0.95),
      wall: mat("#3a3341", 0.95),
      rug: mat("#5a3a3a", 1),
      wood: mat("#5a3d2b", 0.55),
      dark: mat("#1e2027", 0.5, 0.2),
      metal: mat("#8c8c94", 0.35, 0.8),
      fabric: mat("#2f3340", 0.95),
      mug: mat("#a89a86", 0.5),
      brass: mat("#b08d4f", 0.3, 0.9),
      bulb: new MeshStandardMaterial({
        color: "#ffd9a3",
        emissive: "#ffb36b",
        emissiveIntensity: 3,
      }),
      pane: new MeshStandardMaterial({
        color: "#ffd9a3",
        emissive: "#ffc98a",
        emissiveIntensity: 0.6,
      }),
      // Unlit, so the room's lights never glint off the picture.
      screen: new MeshBasicMaterial({ map: screen.texture }),
      poster: mat("#d8cdb4", 0.9),
      posterFrame: mat("#24201c", 0.6),
      books: ["#7a3b3b", "#3b5a7a", "#7a6a3b", "#3b6a4a", "#5a3b7a"].map((c) =>
        mat(c, 0.9),
      ),
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
          { position: [-0.3, 1.4, 1.2], target: [0, 1.05, -0.4] },
          onScreen,
        ]
      : [
          { position: [-1.6, 1.5, 2.6], target: [0.1, 0.95, 0.2] },
          { position: [-2.1, 1.45, 3.1], target: [0.35, 1.0, 0.3] },
          { position: [-0.35, 1.35, 0.9], target: [0, 1.05, -0.4] },
          onScreen,
        ];
    return buildCurves(keys);
  }, [aspect, narrow, camera.fov]);

  /* eslint-disable react-hooks/immutability -- r3f pattern: drive lights, materials, the scene fog and plateState in useFrame */
  useFrame(({ clock }) => {
    const active = plateState.instrument === "desk";
    const sec = sections[useSectionsStore.getState().active];
    const visible = active || sec?.chapter === INTRO_CHAPTER;
    if (root.current) root.current.visible = visible;
    scene.fog = visible ? FOG : null;
    if (!active) return;

    const p = plateState.p;
    const { reducedMotion } = useLabStore.getState();
    const t = clock.elapsedTime;
    avatar.current?.apply(pose(p, t, reducedMotion));

    // The screen types at rest (4 Hz redraw), freezes while scrolling, and
    // gives way to Eisen's colour at the seam.
    const fade = screenFade(p);
    const resting = p < STAND[0];
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
    if (glow.current)
      glow.current.intensity =
        3 * (1 + (reducedMotion ? 0 : 0.04 * Math.sin(t * 11)));
    if (lamp.current && lampTarget.current)
      lamp.current.target = lampTarget.current;

    sampleAt(
      curves,
      cameraU(p),
      plateState.introCam.pos,
      plateState.introCam.tgt,
    );
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group ref={root} visible={false}>
      <hemisphereLight args={["#3a3f5c", "#2a1e16", 0.35]} />
      <directionalLight
        color="#ffd9a3"
        intensity={0.8}
        position={[1.5, 2.5, -2]}
      />
      <spotLight
        ref={lamp}
        color="#ffb36b"
        intensity={30}
        distance={4}
        angle={0.8}
        penumbra={0.6}
        decay={2}
        position={[-0.5, 1.25, -0.35]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <group ref={lampTarget} position={[0, 0.75, -0.2]} />
      <pointLight
        ref={glow}
        color="#9fc3ff"
        intensity={3}
        distance={2.5}
        decay={2}
        position={[0, 1.05, -0.2]}
      />

      {/* Room */}
      <mesh
        geometry={g.floor}
        material={m.floor}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      />
      <mesh
        geometry={g.rug}
        material={m.rug}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0.2, 0.004, 0.5]}
        receiveShadow
      />
      <mesh
        geometry={g.wall}
        material={m.wall}
        position={[0, 2, -1.2]}
        receiveShadow
      />
      <group position={[1.65, 1.75, -1.19]}>
        <mesh geometry={g.window} material={m.pane} />
        <mesh
          geometry={g.frame}
          material={m.wood}
          position={[-0.47, 0, 0.01]}
        />
        <mesh geometry={g.frame} material={m.wood} position={[0.47, 0, 0.01]} />
        <mesh
          geometry={g.frameH}
          material={m.wood}
          position={[0, 0.57, 0.01]}
        />
        <mesh
          geometry={g.frameH}
          material={m.wood}
          position={[0, -0.57, 0.01]}
        />
        <mesh
          geometry={g.frame}
          material={m.wood}
          position={[0, 0, 0.01]}
          scale={[0.6, 1, 1]}
        />
      </group>
      <group position={[-1.05, 1.75, -1.18]}>
        <mesh geometry={g.posterFrame} material={m.posterFrame} />
        <mesh
          geometry={g.poster}
          material={m.poster}
          position={[0, 0, 0.014]}
        />
      </group>
      <group position={[1.75, 1.25, -1.05]}>
        <mesh geometry={g.shelf} material={m.wood} castShadow receiveShadow />
        {m.books.map((bm, i) => (
          <mesh
            key={i}
            geometry={g.book}
            material={bm}
            position={[-0.25 + i * 0.045, 0.125, 0]}
            rotation={[0, 0, i === 4 ? -0.15 : 0]}
            castShadow
          />
        ))}
        <Plant
          position={[0.22, 0.015, 0]}
          leaves={9}
          size={0.16}
          color="#4f8a4a"
          potR={0.07}
          potH={0.09}
          droop={0.9}
        />
      </group>

      {/* Desk and what sits on it */}
      <mesh
        geometry={g.deskTop}
        material={m.wood}
        position={[0, 0.735, -0.36]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={g.deskLeg}
        material={m.wood}
        position={[-0.8, 0.36, -0.36]}
        castShadow
      />
      <mesh
        geometry={g.deskLeg}
        material={m.wood}
        position={[0.8, 0.36, -0.36]}
        castShadow
      />
      <mesh geometry={g.foot} material={m.dark} position={[0, 0.76, -0.5]} />
      <mesh geometry={g.stem} material={m.dark} position={[0, 0.84, -0.5]} />
      <mesh
        geometry={g.panel}
        material={m.dark}
        position={[0, 1.05, -0.46]}
        castShadow
      />
      <mesh
        geometry={g.screen}
        material={m.screen}
        position={[SCREEN_C.x, SCREEN_C.y, SCREEN_C.z]}
      />
      <mesh
        geometry={g.keyboard}
        material={m.dark}
        position={[0, 0.76, -0.15]}
        castShadow
      />
      <mesh
        geometry={g.mouse}
        material={m.dark}
        position={[0.32, 0.765, -0.15]}
        castShadow
      />
      <mesh
        geometry={g.mug}
        material={m.mug}
        position={[0.55, 0.8, -0.32]}
        castShadow
      />
      <group position={[-0.6, 0.755, -0.5]}>
        <mesh geometry={g.lampBase} material={m.brass} />
        <mesh
          geometry={g.lampArm}
          material={m.brass}
          position={[0.05, 0.27, 0.07]}
          rotation={[0.25, 0, -0.2]}
        />
        <mesh
          geometry={g.lampHead}
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
      <Plant
        position={[0.66, 0.755, -0.58]}
        leaves={6}
        size={0.14}
        color="#5a9a55"
        potR={0.06}
        potH={0.08}
      />
      <Plant
        position={[-1.35, 0, -0.5]}
        leaves={8}
        size={0.42}
        color="#3f7a45"
        potR={0.17}
        potH={0.36}
      />

      {/* Chair */}
      <mesh geometry={g.base} material={m.dark} position={[0, 0.02, 0.42]} />
      <mesh geometry={g.column} material={m.metal} position={[0, 0.22, 0.42]} />
      <mesh
        geometry={g.seat}
        material={m.fabric}
        position={[0, 0.43, 0.42]}
        castShadow
      />
      <mesh
        geometry={g.back}
        material={m.fabric}
        position={[0, 0.72, 0.64]}
        rotation={[-0.1, 0, 0]}
        castShadow
      />

      <Avatar ref={avatar} />
    </group>
  );
}
