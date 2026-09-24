"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CapsuleGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  Group,
  MeshStandardMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { breathe, tailFlick } from "@/lib/ambient";
import { useLabStore } from "@/store/useLabStore";
import { useRoomStore } from "./useRoomStore";

/** A cat curled asleep on the rug; click wakes it and it looks at the camera for a while. */
export function Cat({ position }: { position: [number, number, number] }) {
  const g = useMemo(() => {
    const tail = new CatmullRomCurve3([
      new Vector3(0.12, 0.04, 0.06),
      new Vector3(0.2, 0.05, 0.12),
      new Vector3(0.24, 0.06, 0.02),
      new Vector3(0.16, 0.07, -0.06),
    ]);
    return {
      body: new CapsuleGeometry(0.09, 0.16, 6, 14),
      head: new SphereGeometry(0.07, 18, 14),
      ear: new ConeGeometry(0.02, 0.04, 6),
      tail: new TubeGeometry(tail, 20, 0.018, 8, false),
      paw: new SphereGeometry(0.025, 10, 8),
    };
  }, []);
  const m = useMemo(
    () => ({
      fur: new MeshStandardMaterial({ color: "#6b5a4b", roughness: 0.95 }),
      dark: new MeshStandardMaterial({ color: "#3d3229", roughness: 0.95 }),
      eye: new MeshStandardMaterial({
        color: "#b8d36a",
        emissive: "#4a5d1f",
        emissiveIntensity: 0.3,
      }),
    }),
    [],
  );
  const chest = useRef<Group>(null);
  const head = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const awake = useRef(0);

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    const { reducedMotion } = useLabStore.getState();
    const until = useRoomStore.getState().catAwakeUntil;
    const target = until > performance.now() / 1000 ? 1 : 0;
    awake.current += (target - awake.current) * 0.08;
    const a = awake.current;
    if (chest.current)
      chest.current.scale.setScalar(reducedMotion ? 1 : breathe(t));
    if (tail.current)
      tail.current.rotation.y = reducedMotion ? 0 : tailFlick(t, 3) + a * 0.3;
    if (head.current) {
      // Asleep: tucked; awake: lifted and turned toward the camera.
      head.current.position.set(-0.1, 0.05 + 0.09 * a, 0.04);
      head.current.rotation.x = -0.6 * (1 - a);
      const dir = camera.position
        .clone()
        .sub(head.current.getWorldPosition(new Vector3()));
      head.current.rotation.y = a * Math.atan2(dir.x, dir.z) * 0.6;
    }
    if (eyes.current) eyes.current.visible = a > 0.5;
  });

  const wake = useRoomStore((s) => s.wakeCat);
  const setHover = useRoomStore((s) => s.setHover);
  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover({ label: "the cat", note: "click to wake him" });
      }}
      onPointerOut={() => setHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        wake();
      }}
    >
      <group ref={chest}>
        <mesh
          geometry={g.body}
          material={m.fur}
          rotation={[0, 0, Math.PI / 2]}
          position={[0, 0.08, 0]}
          castShadow
        />
        <mesh
          geometry={g.paw}
          material={m.fur}
          position={[-0.12, 0.03, 0.08]}
        />
        <mesh
          geometry={g.paw}
          material={m.fur}
          position={[-0.14, 0.03, -0.02]}
        />
      </group>
      <group ref={head}>
        <mesh geometry={g.head} material={m.fur} castShadow />
        <mesh geometry={g.ear} material={m.dark} position={[-0.04, 0.07, 0]} />
        <mesh geometry={g.ear} material={m.dark} position={[0.04, 0.07, 0]} />
        <group ref={eyes} visible={false}>
          <mesh
            geometry={g.paw}
            material={m.eye}
            scale={0.35}
            position={[-0.03, 0.01, 0.06]}
          />
          <mesh
            geometry={g.paw}
            material={m.eye}
            scale={0.35}
            position={[0.03, 0.01, 0.06]}
          />
        </group>
      </group>
      <group ref={tail}>
        <mesh geometry={g.tail} material={m.dark} />
      </group>
    </group>
  );
}
