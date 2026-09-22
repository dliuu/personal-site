"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import {
  BoxGeometry,
  CapsuleGeometry,
  Group,
  MeshStandardMaterial,
  SphereGeometry,
} from "three";
import type { Pose } from "@/lib/introTimeline";

export type AvatarHandle = { apply(pose: Pose): void };

/**
 * PLACEHOLDER figure: a sketched, jointed person built from capsules, posed
 * by `pose()` from lib/introTimeline. To be replaced by the owner's rigged
 * avatar (Ready Player Me + Mixamo clips) driving the same progress.
 * Faces −z at yaw 0; the root sits at the hips.
 */
export const Avatar = forwardRef<
  AvatarHandle,
  { position?: [number, number, number] }
>(function Avatar(_, ref) {
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const head = useRef<Group>(null);
  const upperL = useRef<Group>(null);
  const foreL = useRef<Group>(null);
  const upperR = useRef<Group>(null);
  const foreR = useRef<Group>(null);
  const thighL = useRef<Group>(null);
  const shinL = useRef<Group>(null);
  const thighR = useRef<Group>(null);
  const shinR = useRef<Group>(null);

  const g = useMemo(
    () => ({
      head: new SphereGeometry(0.11, 24, 18),
      hair: new SphereGeometry(
        0.115,
        24,
        18,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.55,
      ),
      eye: new SphereGeometry(0.012, 8, 8),
      torso: new CapsuleGeometry(0.14, 0.3, 6, 16),
      hips: new BoxGeometry(0.3, 0.16, 0.2),
      upper: new CapsuleGeometry(0.045, 0.2, 4, 12),
      fore: new CapsuleGeometry(0.04, 0.18, 4, 12),
      hand: new SphereGeometry(0.045, 12, 10),
      thigh: new CapsuleGeometry(0.07, 0.3, 4, 12),
      shin: new CapsuleGeometry(0.055, 0.3, 4, 12),
      foot: new BoxGeometry(0.1, 0.07, 0.24),
    }),
    [],
  );
  const m = useMemo(
    () => ({
      skin: new MeshStandardMaterial({ color: "#e9c4a0", roughness: 0.75 }),
      hair: new MeshStandardMaterial({ color: "#1d1a1a", roughness: 0.6 }),
      eye: new MeshStandardMaterial({ color: "#14110f", roughness: 0.4 }),
      hoodie: new MeshStandardMaterial({ color: "#3b4a6b", roughness: 0.95 }),
      jeans: new MeshStandardMaterial({ color: "#2b2f3a", roughness: 0.9 }),
      shoe: new MeshStandardMaterial({ color: "#8f8a82", roughness: 0.8 }),
    }),
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      apply(p: Pose) {
        const r = root.current;
        if (!r) return;
        r.position.set(p.rootX, p.rootY, p.rootZ);
        r.rotation.y = p.rootYaw;
        if (torso.current) torso.current.rotation.x = -p.torsoPitch;
        if (head.current) head.current.rotation.y = p.headYaw;
        if (upperL.current) upperL.current.rotation.set(p.upperArmL, 0, 0);
        if (foreL.current) foreL.current.rotation.set(p.foreArmL, 0, 0);
        if (upperR.current)
          upperR.current.rotation.set(
            p.upperArmR * (1 - p.armRaiseR),
            0,
            -2.6 * p.armRaiseR,
          );
        if (foreR.current)
          foreR.current.rotation.set(
            p.foreArmR * (1 - p.armRaiseR),
            0,
            p.waveR,
          );
        for (const t of [thighL, thighR])
          if (t.current) t.current.rotation.x = p.thigh;
        for (const s of [shinL, shinR])
          if (s.current) s.current.rotation.x = p.shin;
      },
    }),
    [],
  );

  const Limb = ({
    geometry,
    material,
    length,
  }: {
    geometry: CapsuleGeometry;
    material: MeshStandardMaterial;
    length: number;
  }) => (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, -length / 2, 0]}
      castShadow
    />
  );

  return (
    <group ref={root} position={[0, 0.47, 0.42]}>
      <group ref={torso}>
        <mesh
          geometry={g.hips}
          material={m.jeans}
          position={[0, 0.04, 0]}
          castShadow
        />
        <mesh
          geometry={g.torso}
          material={m.hoodie}
          position={[0, 0.32, 0]}
          castShadow
        />
        <group ref={head} position={[0, 0.66, 0]}>
          <mesh geometry={g.head} material={m.skin} castShadow />
          <mesh
            geometry={g.hair}
            material={m.hair}
            position={[0, 0.01, -0.01]}
          />
          <mesh
            geometry={g.eye}
            material={m.eye}
            position={[-0.04, 0.01, -0.1]}
          />
          <mesh
            geometry={g.eye}
            material={m.eye}
            position={[0.04, 0.01, -0.1]}
          />
        </group>
        {/* Facing −z, his right arm is at −x. */}
        <group ref={upperR} position={[-0.2, 0.5, 0]}>
          <Limb geometry={g.upper} material={m.hoodie} length={0.26} />
          <group ref={foreR} position={[0, -0.26, 0]}>
            <Limb geometry={g.fore} material={m.hoodie} length={0.24} />
            <mesh
              geometry={g.hand}
              material={m.skin}
              position={[0, -0.27, 0]}
              castShadow
            />
          </group>
        </group>
        <group ref={upperL} position={[0.2, 0.5, 0]}>
          <Limb geometry={g.upper} material={m.hoodie} length={0.26} />
          <group ref={foreL} position={[0, -0.26, 0]}>
            <Limb geometry={g.fore} material={m.hoodie} length={0.24} />
            <mesh
              geometry={g.hand}
              material={m.skin}
              position={[0, -0.27, 0]}
              castShadow
            />
          </group>
        </group>
      </group>
      {(
        [
          [-0.1, thighR, shinR],
          [0.1, thighL, shinL],
        ] as const
      ).map(([x, thigh, shin]) => (
        <group key={x} ref={thigh} position={[x, 0, 0]}>
          <Limb geometry={g.thigh} material={m.jeans} length={0.38} />
          <group ref={shin} position={[0, -0.38, 0]}>
            <Limb geometry={g.shin} material={m.jeans} length={0.38} />
            <mesh
              geometry={g.foot}
              material={m.shoe}
              position={[0, -0.4, -0.05]}
              castShadow
            />
          </group>
        </group>
      ))}
    </group>
  );
});
