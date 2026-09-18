"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import type { Mesh } from "three";
import { Stage } from "@/components/Stage";

function SpinningCube({ roughness }: { roughness: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.4;
    ref.current.rotation.y += dt * 0.6;
  });
  return (
    <mesh ref={ref} castShadow position={[0, 0.8, 0]}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial color="#e8e0d0" roughness={roughness} metalness={0} />
    </mesh>
  );
}

export default function HelloCube() {
  const { color, intensity, roughness } = useControls("light", {
    color: "#ffb454",
    intensity: { value: 3, min: 0, max: 10, step: 0.1 },
    roughness: { value: 0.6, min: 0, max: 1, step: 0.01 },
  });

  return (
    <Stage shadows background="#141418" cameraPosition={[3, 2.5, 4]}>
      <ambientLight intensity={0.3} />
      <directionalLight
        castShadow
        color={color}
        intensity={intensity}
        position={[4, 6, 3]}
        shadow-mapSize={[1024, 1024]}
      />
      <SpinningCube roughness={roughness} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#26262c" roughness={1} />
      </mesh>
      <OrbitControls target={[0, 0.8, 0]} />
    </Stage>
  );
}
