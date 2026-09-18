"use client";

import { useCursor } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { PALETTE } from "./palette";
import { projects } from "./content";
import { PROJECT_SLOTS } from "./sections";
import { useRoomStore } from "./useRoomStore";

function ProjectObject({ slug, slot }: { slug: string; slot: number }) {
  const hovered = useRoomStore((s) => s.hoveredProject === slug);
  const setHovered = useRoomStore((s) => s.setHovered);
  const setOpen = useRoomStore((s) => s.setOpen);
  useCursor(hovered);
  const [x, y, z] = PROJECT_SLOTS[slot];

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(slug);
  };
  const out = () => setHovered(null);
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setOpen(slug);
  };

  return (
    <group position={[x, y, z]}>
      {/* static hit box: carries the events, never moves, not rendered */}
      <mesh onPointerOver={over} onPointerOut={out} onClick={click}>
        <boxGeometry args={[0.28, 0.2, 0.22]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* visible object: lifts on hover, ignores the raycaster */}
      <group position={[0, hovered ? 0.04 : 0, 0]}>
        <mesh castShadow raycast={() => null}>
          <boxGeometry args={[0.22, 0.12, 0.16]} />
          <meshStandardMaterial
            color={PALETTE.paper}
            roughness={0.7}
            emissive={PALETTE.accent}
            emissiveIntensity={hovered ? 0.35 : 0}
          />
        </mesh>
        <mesh castShadow position={[0, 0.075, 0]} raycast={() => null}>
          <boxGeometry args={[0.24, 0.03, 0.18]} />
          <meshStandardMaterial color={PALETTE.accent} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

export function ProjectObjects() {
  return (
    <group>
      {projects.map((p) => (
        <ProjectObject key={p.slug} slug={p.slug} slot={p.slot} />
      ))}
    </group>
  );
}
