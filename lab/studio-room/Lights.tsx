"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useLabStore } from "@/store/useLabStore";
import { PALETTE } from "./palette";
import { useRoomStore } from "./useRoomStore";

export function Lights() {
  const tier = useLabStore((s) => s.tier);
  const lampOn = useRoomStore((s) => s.lampOn);
  const high = tier === "high";

  return (
    <>
      <hemisphereLight args={[PALETTE.wall, PALETTE.floor, 0.35]} />
      <directionalLight
        castShadow
        color="#ffd9a8"
        intensity={4}
        position={[3, 4, -6]}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
      />
      <pointLight
        color="#ffb454"
        intensity={lampOn ? 6 : 0}
        distance={4}
        decay={2}
        position={[-0.65, 1.35, -2.8]}
      />
      {high ? (
        <>
          <ContactShadows
            position={[0, 0.001, 0]}
            opacity={0.45}
            blur={2.5}
            scale={12}
            far={2}
          />
          <Environment resolution={64}>
            <Lightformer
              intensity={1.2}
              position={[1.2, 2, -6]}
              scale={[2, 1.5, 1]}
              color="#ffe7c9"
            />
            <Lightformer
              intensity={0.4}
              position={[-4, 3, 2]}
              scale={[4, 2, 1]}
              color={PALETTE.wall}
            />
          </Environment>
        </>
      ) : null}
    </>
  );
}
