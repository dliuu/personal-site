"use client";

import { Stage } from "@/components/Stage";
import { Codex } from "./Codex";
import { BRONZE, INK, PARCHMENT } from "./palette";

export default function Instruments() {
  return (
    <>
      <Stage
        frameloop="always"
        background={PARCHMENT}
        cameraPosition={[0, 0, 6]}
      >
        <hemisphereLight args={[PARCHMENT, INK, 0.6]} />
        <directionalLight
          color="#fff1dc"
          intensity={2.5}
          position={[3, 4, 5]}
        />
        <mesh position={[1.6, 0, 0]}>
          <torusGeometry args={[1.2, 0.06, 12, 96]} />
          <meshStandardMaterial
            color={BRONZE}
            roughness={0.6}
            metalness={0.15}
          />
        </mesh>
      </Stage>
      <Codex />
    </>
  );
}
