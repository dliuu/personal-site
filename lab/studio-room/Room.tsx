"use client";

import { PALETTE } from "./palette";

const W = 8;
const D = 8;
const H = 3.2;
const T = 0.15;
const WIN = { x: 1.2, y: 1.7, w: 1.8, h: 1.4 };

export function Room() {
  const halfW = W / 2;
  const bz = -D / 2;
  const lx = -W / 2;
  const leftW = WIN.x - WIN.w / 2 + halfW;
  const rightW = halfW - (WIN.x + WIN.w / 2);
  const belowH = WIN.y - WIN.h / 2;
  const aboveH = H - (WIN.y + WIN.h / 2);
  const wall = <meshStandardMaterial color={PALETTE.wall} roughness={0.95} />;

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={PALETTE.floor} roughness={0.85} />
      </mesh>
      {/* rug */}
      <mesh
        receiveShadow
        position={[0.4, 0.006, -1.4]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[3.2, 2.2]} />
        <meshStandardMaterial color="#b8563f" roughness={0.95} />
      </mesh>
      {/* left wall */}
      <mesh castShadow receiveShadow position={[lx, H / 2, 0]}>
        <boxGeometry args={[T, H, D]} />
        {wall}
      </mesh>
      {/* back wall around the window */}
      <mesh castShadow receiveShadow position={[-halfW + leftW / 2, H / 2, bz]}>
        <boxGeometry args={[leftW, H, T]} />
        {wall}
      </mesh>
      <mesh castShadow receiveShadow position={[halfW - rightW / 2, H / 2, bz]}>
        <boxGeometry args={[rightW, H, T]} />
        {wall}
      </mesh>
      <mesh castShadow receiveShadow position={[WIN.x, belowH / 2, bz]}>
        <boxGeometry args={[WIN.w, belowH, T]} />
        {wall}
      </mesh>
      <mesh castShadow receiveShadow position={[WIN.x, H - aboveH / 2, bz]}>
        <boxGeometry args={[WIN.w, aboveH, T]} />
        {wall}
      </mesh>
      {/* window frame: two thin verticals, one horizontal */}
      {[-WIN.w / 2, WIN.w / 2].map((dx) => (
        <mesh
          key={dx}
          castShadow
          position={[WIN.x + dx, WIN.y, bz + T / 2 + 0.02]}
        >
          <boxGeometry args={[0.06, WIN.h + 0.06, 0.08]} />
          <meshStandardMaterial color={PALETTE.paper} roughness={0.7} />
        </mesh>
      ))}
      <mesh castShadow position={[WIN.x, WIN.y, bz + T / 2 + 0.02]}>
        <boxGeometry args={[WIN.w, 0.05, 0.08]} />
        <meshStandardMaterial color={PALETTE.paper} roughness={0.7} />
      </mesh>
      {/* sill */}
      <mesh castShadow receiveShadow position={[WIN.x, belowH, bz + 0.12]}>
        <boxGeometry args={[WIN.w + 0.2, 0.06, 0.3]} />
        <meshStandardMaterial color={PALETTE.paper} roughness={0.7} />
      </mesh>
    </group>
  );
}
