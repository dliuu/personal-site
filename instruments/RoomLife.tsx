"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
} from "three";
import { keyPress, phonePulse, twinkle } from "@/lib/ambient";
import { lerp } from "@/lib/progress";
import { frameLerp } from "@/lib/drawIn";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useThing } from "./RoomSet";
import { skyline } from "./roomTextures";
import { useRoomStore } from "./useRoomStore";

const BULBS = 24;
const KEYS = 60;

/**
 * Everything in the room that moves on its own: the curtains, string
 * lights, keys that press as he types, the phone; and the city outside.
 */
export function RoomLife({
  stage,
  typing,
}: {
  stage: number;
  /** Ref: 1 while he is typing at rest. */
  typing: { current: number };
}) {
  const dummy = useMemo(() => new Object3D(), []);
  const tmpColor = useMemo(() => new Color(), []);

  // The view: Manhattan at sunset, painted once per wall in idle time. Unlit
  // and untonemapped, so it shows as painted.
  const ready = stage >= 1;
  const pane = useMemo(
    () =>
      ready
        ? new MeshBasicMaterial({ map: skyline("front"), toneMapped: false })
        : null,
    [ready],
  );
  const paneR = useMemo(
    () =>
      ready
        ? new MeshBasicMaterial({ map: skyline("right"), toneMapped: false })
        : null,
    [ready],
  );
  const glassMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#ffffff",
        roughness: 0.04,
        metalness: 0,
        transparent: true,
        opacity: 0.1,
        envMapIntensity: 1.2,
        depthWrite: false,
      }),
    [],
  );
  const curtainsCur = useRef(1);
  const curtainL = useRef<Mesh>(null);
  const curtainR = useRef<Mesh>(null);
  // Linen with folds: a fine plane displaced by a sine along its width, so
  // the folds bunch as the curtain gathers (scale.x shrinks).
  const curtainGeom = useMemo(() => {
    const g = new PlaneGeometry(1, 2.5, 64, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(
        i,
        0.035 * Math.sin(x * Math.PI * 16) + 0.012 * Math.sin(x * Math.PI * 37),
      );
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const curtainMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#efe6d8",
        roughness: 1,
        transparent: true,
        opacity: 0.93,
        side: 2,
      }),
    [],
  );
  // String lights
  const bulbs = useRef<InstancedMesh>(null);
  const bulbGeom = useMemo(() => new SphereGeometry(0.02, 8, 6), []);
  const bulbMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color("#ffd08a").multiplyScalar(2.4),
        toneMapped: false,
      }),
    [],
  );
  const bulbPositions = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < BULBS; i++) {
      const u = i / (BULBS - 1);
      // Two shallow swags along the glass wall's header.
      const v = u * 2;
      const seg = Math.floor(v);
      const f = v - seg;
      pts.push([
        -2.2 + seg * 2.2 + f * 2.2,
        2.46 - 0.1 * Math.sin(f * Math.PI),
        -1.1,
      ]);
    }
    return pts;
  }, []);

  // Keys, phone
  const keys = useRef<InstancedMesh>(null);
  const keyGeom = useMemo(() => new BoxGeometry(0.024, 0.008, 0.024), []);
  const keyMat = useMemo(
    () => new MeshStandardMaterial({ color: "#1c1d22", roughness: 0.45 }),
    [],
  );
  const phoneScreen = useRef<Mesh>(null);
  const phoneLight = useRef<PointLight>(null);
  const phoneMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#050608",
        emissive: "#bcd4ff",
        emissiveIntensity: 0,
      }),
    [],
  );
  const g = useMemo(
    () => ({
      city: new PlaneGeometry(13.5, 6.75),
      glass: new PlaneGeometry(1.55, 2.6),
      glassR: new PlaneGeometry(1.5, 2.6),
      rail: new CylinderGeometry(0.012, 0.012, 4.8, 8).rotateZ(Math.PI / 2),
      knob: new SphereGeometry(0.012, 8, 6),
      phone: new BoxGeometry(0.07, 0.008, 0.14),
      phoneScreen: new PlaneGeometry(0.062, 0.13),
    }),
    [],
  );
  const m = useMemo(
    () => ({
      dark: new MeshStandardMaterial({
        color: "#1e2027",
        roughness: 0.5,
        metalness: 0.2,
      }),
      black: new MeshStandardMaterial({
        color: "#0c0d10",
        roughness: 0.35,
        metalness: 0.3,
      }),
    }),
    [],
  );

  const toggleCurtains = useRoomStore((s) => s.toggleCurtains);
  // The baked workstation brings its own keyboard; the pressing keys were the built one's.
  const baked = useRoomStore((s) => s.baked);
  const curtainsThing = useThing(
    "the curtains",
    "click to draw or open",
    toggleCurtains,
  );
  const phoneThing = useThing("the phone", "face up, mostly quiet");

  /* eslint-disable react-hooks/immutability -- r3f pattern: drive instances, materials and refs in useFrame */
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const { reducedMotion } = useDeviceStore.getState();
    const room = useRoomStore.getState();
    const k = frameLerp(0.06, delta);

    // Curtains gather to the mullions when open and meet in the middle when
    // closed.
    curtainsCur.current = lerp(
      curtainsCur.current,
      room.curtainsOpen ? 1 : 0,
      k,
    );
    const open = curtainsCur.current;
    const spread = lerp(2.4, 0.5, open);
    for (const [ref, side] of [
      [curtainL, -1],
      [curtainR, 1],
    ] as const) {
      const c = ref.current;
      if (!c) continue;
      c.scale.x = spread;
      c.position.x = side * (2.4 - spread / 2);
      c.rotation.y = side * 0.06 * open;
    }

    // String lights: laid out each frame (24 is nothing), twinkling by
    // instance colour.
    if (bulbs.current) {
      for (let i = 0; i < BULBS; i++) {
        dummy.position.set(...bulbPositions[i]);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        bulbs.current.setMatrixAt(i, dummy.matrix);
        const v = reducedMotion ? 1 : twinkle(t, i * 1.37);
        bulbs.current.setColorAt(i, tmpColor.setScalar(v));
      }
      bulbs.current.instanceMatrix.needsUpdate = true;
      if (bulbs.current.instanceColor)
        bulbs.current.instanceColor.needsUpdate = true;
    }

    // Keys press while he types.
    if (keys.current) {
      const typingNow = typing.current > 0.5 && !reducedMotion;
      for (let i = 0; i < KEYS; i++) {
        const col = i % 15;
        const row = Math.floor(i / 15);
        dummy.position.set(
          -0.19 + col * 0.027,
          0.772 - 0.003 * keyPress(t, i, typingNow),
          -0.19 + row * 0.028,
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        keys.current.setMatrixAt(i, dummy.matrix);
      }
      keys.current.instanceMatrix.needsUpdate = true;
    }

    // The phone lights now and then.
    const pulse = reducedMotion ? 0 : phonePulse(t, 2);
    phoneMat.emissiveIntensity = 1.4 * pulse;
    if (phoneLight.current) phoneLight.current.intensity = 0.6 * pulse;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group>
      {/* The glass walls: the city well behind each for parallax, sheets of
          glass with a faint reflection, linen curtains on a rail along the
          back one. */}
      {pane && paneR ? (
        <>
          <mesh geometry={g.city} material={pane} position={[0, 1.9, -3.8]} />
          <mesh
            geometry={g.city}
            material={paneR}
            position={[5.0, 1.9, 1.8]}
            rotation={[0, -Math.PI / 2, 0]}
          />
        </>
      ) : null}
      {[-1.6, 0, 1.6].map((x) => (
        <mesh
          key={x}
          geometry={g.glass}
          material={glassMat}
          position={[x, 1.3, -1.2]}
        />
      ))}
      {[-0.45, 1.05, 2.55, 4.05].map((z) => (
        <mesh
          key={z}
          geometry={g.glassR}
          material={glassMat}
          position={[2.4, 1.3, z]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      ))}
      <group position={[0, 1.32, -1.08]} {...curtainsThing}>
        <mesh ref={curtainL} geometry={curtainGeom} material={curtainMat} />
        <mesh ref={curtainR} geometry={curtainGeom} material={curtainMat} />
        <mesh geometry={g.rail} material={m.black} position={[0, 1.27, 0]} />
      </group>
      {stage >= 2 ? (
        <instancedMesh
          ref={bulbs}
          args={[bulbGeom, bulbMat, BULBS]}
          frustumCulled={false}
        />
      ) : null}
      {stage >= 1 ? (
        <>
          <instancedMesh
            ref={keys}
            args={[keyGeom, keyMat, KEYS]}
            visible={!baked}
            castShadow
            frustumCulled={false}
          />
          <group
            position={[-0.38, 0.759, -0.1]}
            rotation={[0, 0.25, 0]}
            {...phoneThing}
          >
            <mesh geometry={g.phone} material={m.black} />
            <mesh
              ref={phoneScreen}
              geometry={g.phoneScreen}
              material={phoneMat}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.0045, 0]}
            />
            <pointLight
              ref={phoneLight}
              color="#bcd4ff"
              intensity={0}
              distance={0.6}
              decay={2}
              position={[0, 0.05, 0]}
            />
          </group>
        </>
      ) : null}
    </group>
  );
}
