"use client";

import { Stage } from "@/components/Stage";
import { PAPER, INK } from "./palette";
import { Sections } from "./Sections";

export default function Chapters() {
  return (
    <>
      <Stage frameloop="always" background={PAPER} cameraPosition={[0, 0, 6]}>
        <hemisphereLight args={[PAPER, INK, 0.6]} />
        <directionalLight
          color="#fff1dc"
          intensity={2.5}
          position={[3, 4, 5]}
        />
        <mesh>
          <torusKnotGeometry args={[1, 0.3, 200, 32]} />
          <meshStandardMaterial color={INK} roughness={0.55} metalness={0.1} />
        </mesh>
      </Stage>
      <Sections />
    </>
  );
}
