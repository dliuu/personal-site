"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CatmullRomCurve3, Group, Vector3 } from "three";
import { heroWeight } from "@/lib/sectionProgress";
import { lerp } from "@/lib/progress";
import { useLabStore } from "@/store/useLabStore";
import { chapters, type HeroKind } from "./chapters";
import { INK, PAPER } from "./palette";
import { useSectionsStore } from "@/store/useSectionsStore";

const CAMERA_Z = 6;
const DOLLY = 0.4;

function HeroMaterial() {
  return (
    <meshStandardMaterial color="#7a6f63" roughness={0.55} metalness={0.1} />
  );
}

function Knot() {
  return (
    <mesh>
      <torusKnotGeometry args={[1, 0.3, 200, 32]} />
      <HeroMaterial />
    </mesh>
  );
}

const CLUSTER: [number, number, number][] = [
  [0, 0, 0],
  [1.1, 0.4, -0.2],
  [-1.0, 0.6, 0.3],
  [0.5, -1.0, 0.4],
  [-0.6, -0.9, -0.5],
  [0.2, 1.2, 0.6],
  [-1.2, -0.2, -0.8],
];

function Cluster() {
  return (
    <group>
      {CLUSTER.map((p, i) => (
        <mesh key={i} position={p} scale={i === 0 ? 0.9 : 0.55}>
          <icosahedronGeometry args={[1, 0]} />
          <HeroMaterial />
        </mesh>
      ))}
    </group>
  );
}

function Slabs() {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[0, (i - 2) * 0.32, 0]}
          rotation={[0, (i - 2) * 0.18, 0]}
        >
          <boxGeometry args={[2.2, 0.18, 1.4]} />
          <HeroMaterial />
        </mesh>
      ))}
    </group>
  );
}

function Ribbon() {
  const curve = useMemo(
    () =>
      new CatmullRomCurve3(
        [
          new Vector3(1.4, 0, 0),
          new Vector3(0.4, 1.1, 0.6),
          new Vector3(-1.2, 0.6, -0.4),
          new Vector3(-1.0, -0.9, 0.5),
          new Vector3(0.6, -1.1, -0.6),
        ],
        true,
        "centripetal",
      ),
    [],
  );
  return (
    <mesh>
      <tubeGeometry args={[curve, 220, 0.14, 16, true]} />
      <HeroMaterial />
    </mesh>
  );
}

const HERO: Record<HeroKind, () => React.JSX.Element> = {
  knot: Knot,
  cluster: Cluster,
  slabs: Slabs,
  ribbon: Ribbon,
};

export function HeroObjects() {
  const groups = useRef<(Group | null)[]>([]);
  const weights = useRef<number[]>(chapters.map(() => 0));
  const primed = useRef(false);
  const width = useThree((s) => s.size.width);
  const narrow = width <= 720;

  useFrame(({ camera }, delta) => {
    const { continuous } = useSectionsStore.getState();
    const { reducedMotion } = useLabStore.getState();
    if (!primed.current) {
      primed.current = true;
      for (let i = 0; i < chapters.length; i++)
        weights.current[i] = heroWeight(i, continuous);
    }
    for (let i = 0; i < chapters.length; i++) {
      const g = groups.current[i];
      if (!g) continue;
      const target = heroWeight(i, continuous);
      const w = reducedMotion ? target : lerp(weights.current[i], target, 0.12);
      weights.current[i] = Math.abs(w - target) < 1e-4 ? target : w;
      g.visible = weights.current[i] > 0.001;
      g.scale.setScalar(Math.max(weights.current[i], 0.0001));
      if (!reducedMotion) {
        g.rotation.y += delta * chapters[i].spin;
        g.rotation.x += delta * chapters[i].spin * 0.35;
      }
    }
    camera.position.z = CAMERA_Z - DOLLY * (continuous / chapters.length);
  });

  return (
    <>
      <hemisphereLight args={[PAPER, INK, 0.6]} />
      <directionalLight color="#fff1dc" intensity={2.5} position={[3, 4, 5]} />
      <directionalLight color={PAPER} intensity={0.8} position={[-4, -2, -3]} />
      <group
        position={narrow ? [0, 1.5, 0] : [1.6, 0, 0]}
        scale={narrow ? 0.65 : 1}
      >
        {chapters.map((c, i) => {
          const Hero = HERO[c.hero];
          return (
            <group
              key={c.id}
              ref={(el) => {
                groups.current[i] = el;
              }}
              position={[0, 0, -(i % 2) * 0.6]}
              visible={false}
              scale={0.0001}
            >
              <Hero />
            </group>
          );
        })}
      </group>
    </>
  );
}
