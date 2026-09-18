"use client";

import { Instance, Instances } from "@react-three/drei";
import { PALETTE } from "./palette";
import { useRoomStore } from "./useRoomStore";

const BOOK_COLORS = [
  "#c94f3d",
  "#3d6fc9",
  "#d9a441",
  "#4f8f4a",
  "#7a4fc9",
  "#e6e1d8",
  "#2c2c30",
];

function Desk() {
  const wood = <meshStandardMaterial color={PALETTE.wood} roughness={0.75} />;
  return (
    <group position={[0.2, 0, -2.6]}>
      <mesh castShadow receiveShadow position={[0, 0.74, 0]}>
        <boxGeometry args={[2.4, 0.05, 0.95]} />
        {wood}
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            castShadow
            position={[sx * 1.12, 0.36, sz * 0.4]}
          >
            <boxGeometry args={[0.06, 0.72, 0.06]} />
            {wood}
          </mesh>
        )),
      )}
      {/* monitor */}
      <mesh castShadow position={[0.1, 1.1, -0.28]}>
        <boxGeometry args={[1.05, 0.62, 0.04]} />
        <meshStandardMaterial color={PALETTE.dark} roughness={0.7} />
      </mesh>
      <mesh position={[0.1, 1.1, -0.255]}>
        <planeGeometry args={[0.98, 0.55]} />
        <meshStandardMaterial
          color="#2a3340"
          roughness={0.3}
          emissive="#1c2633"
          emissiveIntensity={0.6}
        />
      </mesh>
      <mesh castShadow position={[0.1, 0.8, -0.28]}>
        <boxGeometry args={[0.22, 0.1, 0.18]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.7} />
      </mesh>
      {/* keyboard */}
      <mesh castShadow position={[0.1, 0.78, 0.12]}>
        <boxGeometry args={[0.7, 0.025, 0.24]} />
        <meshStandardMaterial color={PALETTE.paper} roughness={0.8} />
      </mesh>
      {/* mug */}
      <mesh castShadow position={[1.0, 0.83, 0.25]}>
        <cylinderGeometry args={[0.06, 0.05, 0.12, 16]} />
        <meshStandardMaterial color={PALETTE.accent} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Chair() {
  const m = <meshStandardMaterial color={PALETTE.woodDark} roughness={0.8} />;
  return (
    <group position={[0.2, 0, -1.75]}>
      <mesh castShadow receiveShadow position={[0, 0.46, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.5]} />
        {m}
      </mesh>
      <mesh castShadow position={[0, 0.78, 0.23]}>
        <boxGeometry args={[0.5, 0.6, 0.05]} />
        {m}
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            castShadow
            position={[sx * 0.21, 0.22, sz * 0.21]}
          >
            <boxGeometry args={[0.04, 0.44, 0.04]} />
            {m}
          </mesh>
        )),
      )}
    </group>
  );
}

function Lamp() {
  const lampOn = useRoomStore((s) => s.lampOn);
  return (
    <group position={[-0.75, 0.77, -2.85]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.03, 20]} />
        <meshStandardMaterial color={PALETTE.metal} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
        <meshStandardMaterial color={PALETTE.metal} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.08, 0.52, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.14, 0.18, 20, 1, true]} />
        <meshStandardMaterial
          color={PALETTE.accent}
          roughness={0.7}
          emissive={PALETTE.accent}
          emissiveIntensity={lampOn ? 0.6 : 0}
          side={2}
        />
      </mesh>
    </group>
  );
}

function Shelf() {
  return (
    <group position={[-0.6, 1.85, -3.79]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.04, 0.28]} />
        <meshStandardMaterial color={PALETTE.wood} roughness={0.75} />
      </mesh>
      {/* books, instanced, standing along the shelf */}
      <Instances range={12} castShadow>
        <boxGeometry args={[0.05, 0.26, 0.16]} />
        <meshStandardMaterial roughness={0.85} />
        {Array.from({ length: 12 }, (_, i) => {
          const s = 0.85 + (i % 4) * 0.08;
          return (
            <Instance
              key={i}
              color={BOOK_COLORS[i % BOOK_COLORS.length]}
              position={[-0.75 + i * 0.065, 0.02 + 0.13 * s, 0.02]}
              scale={[1, s, 1]}
              rotation={[0, 0, i % 5 === 0 ? 0.12 : 0]}
            />
          );
        })}
      </Instances>
    </group>
  );
}

function Notes() {
  const notes: [number, number, string][] = [
    [-3.2, 2.45, PALETTE.paper],
    [-2.95, 2.3, "#ffe08a"],
    [-2.7, 2.5, PALETTE.paper],
    [-2.45, 2.28, "#ffd1c4"],
  ];
  return (
    <group>
      {notes.map(([z, y, c], i) => (
        <mesh
          key={i}
          position={[-3.92, y, z]}
          rotation={[0, Math.PI / 2, (i % 2 ? 1 : -1) * 0.05]}
        >
          <planeGeometry args={[0.18, 0.18]} />
          <meshStandardMaterial color={c} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Plant({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[0.14, 0.11, 0.22, 14]} />
        <meshStandardMaterial color="#b58863" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.24, 14, 14]} />
        <meshStandardMaterial color={PALETTE.green} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.12, 0.42, 0.05]}>
        <coneGeometry args={[0.12, 0.3, 10]} />
        <meshStandardMaterial color={PALETTE.greenDark} roughness={0.9} />
      </mesh>
    </group>
  );
}

function SideTable() {
  const m = <meshStandardMaterial color={PALETTE.woodDark} roughness={0.8} />;
  return (
    <group position={[2.8, 0, -3.4]}>
      <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[0.6, 0.04, 0.6]} />
        {m}
      </mesh>
      <mesh castShadow position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.54, 8]} />
        {m}
      </mesh>
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 16]} />
        {m}
      </mesh>
      {/* a small stack of letters */}
      <mesh castShadow position={[0.05, 0.585, 0.02]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.28, 0.03, 0.2]} />
        <meshStandardMaterial color={PALETTE.paper} roughness={0.95} />
      </mesh>
    </group>
  );
}

export function Furniture() {
  return (
    <group>
      <Desk />
      <Chair />
      <Lamp />
      <Shelf />
      <Notes />
      <Plant position={[-3.3, 0.11, -3.3]} scale={1.6} />
      <Plant position={[1.35, 0.88, -2.85]} scale={0.55} />
      <SideTable />
    </group>
  );
}
