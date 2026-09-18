"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import { Stage } from "@/components/Stage";

const ROOM = { w: 8, d: 8, h: 3.2 };
const WALL_T = 0.15;
// window hole in the back wall, centred at x=1.2, y=1.7
const WIN = { x: 1.2, y: 1.7, w: 1.8, h: 1.4 };

function Walls({ wall, floor }: { wall: string; floor: string }) {
  const bz = -ROOM.d / 2; // back wall plane
  const lx = -ROOM.w / 2; // left wall plane
  const mat = <meshStandardMaterial color={wall} roughness={0.95} />;
  const halfW = ROOM.w / 2;
  const leftW = WIN.x - WIN.w / 2 + halfW; // from -halfW to window left edge
  const rightW = halfW - (WIN.x + WIN.w / 2);
  const belowH = WIN.y - WIN.h / 2;
  const aboveH = ROOM.h - (WIN.y + WIN.h / 2);
  return (
    <group>
      {/* floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color={floor} roughness={0.85} />
      </mesh>
      {/* left wall */}
      <mesh receiveShadow position={[lx, ROOM.h / 2, 0]}>
        <boxGeometry args={[WALL_T, ROOM.h, ROOM.d]} />
        {mat}
      </mesh>
      {/* back wall, four pieces around the window */}
      <mesh receiveShadow position={[-halfW + leftW / 2, ROOM.h / 2, bz]}>
        <boxGeometry args={[leftW, ROOM.h, WALL_T]} />
        {mat}
      </mesh>
      <mesh receiveShadow position={[halfW - rightW / 2, ROOM.h / 2, bz]}>
        <boxGeometry args={[rightW, ROOM.h, WALL_T]} />
        {mat}
      </mesh>
      <mesh receiveShadow position={[WIN.x, belowH / 2, bz]}>
        <boxGeometry args={[WIN.w, belowH, WALL_T]} />
        {mat}
      </mesh>
      <mesh receiveShadow position={[WIN.x, ROOM.h - aboveH / 2, bz]}>
        <boxGeometry args={[WIN.w, aboveH, WALL_T]} />
        {mat}
      </mesh>
      {/* window sill */}
      <mesh castShadow receiveShadow position={[WIN.x, belowH, bz + 0.12]}>
        <boxGeometry args={[WIN.w + 0.2, 0.06, 0.3]} />
        <meshStandardMaterial color="#e6e1d8" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Furniture({ wood }: { wood: string }) {
  const m = <meshStandardMaterial color={wood} roughness={0.75} />;
  return (
    <group position={[0.2, 0, -2.6]}>
      {/* desk top */}
      <mesh castShadow receiveShadow position={[0, 0.74, 0]}>
        <boxGeometry args={[2.2, 0.05, 0.9]} />
        {m}
      </mesh>
      {/* legs */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} castShadow position={[sx * 1.02, 0.36, sz * 0.38]}>
            <boxGeometry args={[0.06, 0.72, 0.06]} />
            {m}
          </mesh>
        )),
      )}
      {/* monitor */}
      <mesh castShadow position={[0, 1.08, -0.25]}>
        <boxGeometry args={[1.0, 0.6, 0.04]} />
        <meshStandardMaterial color="#1b1b1f" roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 0.8, -0.25]}>
        <boxGeometry args={[0.2, 0.1, 0.16]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.5} />
      </mesh>
      {/* mug */}
      <mesh castShadow position={[0.8, 0.82, 0.2]}>
        <cylinderGeometry args={[0.06, 0.05, 0.12, 16]} />
        <meshStandardMaterial color="#d95d39" roughness={0.6} />
      </mesh>
      {/* plant */}
      <group position={[-0.85, 0.77, 0.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.14, 12]} />
          <meshStandardMaterial color="#b58863" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.16, 12, 12]} />
          <meshStandardMaterial color="#4f8f4a" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

export default function LightingBench() {
  const sun = useControls("sun", {
    color: "#ffd9a8",
    intensity: { value: 4, min: 0, max: 12, step: 0.1 },
    x: { value: 3, min: -6, max: 6, step: 0.1 },
    y: { value: 4, min: 0.5, max: 8, step: 0.1 },
    z: { value: -6, min: -10, max: 4, step: 0.1 },
    bias: { value: -0.0005, min: -0.005, max: 0.005, step: 0.0001 },
  });
  const fill = useControls("fill", {
    ambient: { value: 0.35, min: 0, max: 2, step: 0.01 },
    lamp: { value: 6, min: 0, max: 20, step: 0.1 },
    lampColor: "#ffb454",
  });
  const fog = useControls("fog", {
    enabled: true,
    near: { value: 6, min: 0, max: 20, step: 0.1 },
    far: { value: 16, min: 1, max: 40, step: 0.1 },
  });
  const palette = useControls("palette", {
    wall: "#e9e2d6",
    floor: "#8c6b4f",
    wood: "#a67c52",
  });

  return (
    <Stage
      shadows
      background={palette.wall}
      fog={fog.enabled ? { color: palette.wall, near: fog.near, far: fog.far } : undefined}
      cameraPosition={[3.5, 2.2, 4.5]}
    >
      <ambientLight intensity={fill.ambient} />
      <directionalLight
        castShadow
        color={sun.color}
        intensity={sun.intensity}
        position={[sun.x, sun.y, sun.z]}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={sun.bias}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
      />
      <pointLight
        castShadow
        color={fill.lampColor}
        intensity={fill.lamp}
        distance={5}
        decay={2}
        position={[-0.7, 1.4, -2.4]}
      />
      <Walls wall={palette.wall} floor={palette.floor} />
      <Furniture wood={palette.wood} />
      <ContactShadows position={[0, 0.001, 0]} opacity={0.5} blur={2.5} scale={12} far={2} />
      <OrbitControls target={[0.2, 0.9, -2.4]} maxPolarAngle={Math.PI / 2 - 0.02} />
    </Stage>
  );
}
