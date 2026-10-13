"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Shape,
  Vector3,
} from "three";
import {
  LONE_WEEKS,
  OWNERS,
  SLICES,
  WEEKS,
  neighboursUp,
  sliceGap,
  weekAngle,
  weekLit,
  weekOwner,
} from "@/lib/stuga";
import { Callouts } from "../Callouts";
import { chapters } from "../chapters";
import type { Project } from "../content";
import { plateState } from "../plateState";
import { siteMaterial } from "../siteParts";

/**
 * Stuga, the house and the year: a cabin in the middle of a ring of 52
 * week-tiles. The problem beat lights one owner's two weeks; the build
 * splits the house into eight tinted shares and fills the ring, no two
 * weeks overlapping; the result seats the shares and raises two more
 * homes, on sand and on rock, each with a full ring of its own.
 */

const RING_R = 0.95;
const HOUSE_D = 0.55;
const SLICE_D = HOUSE_D / SLICES;
const GROUND_Y = -0.22;
const SPREAD = 0.07;
const NEIGHBOUR = 0.4;
/** The scene leans toward the reader so the ring of weeks reads as a ring. */
const TILT = 0.45;
const OWNER_TINTS = [
  "#c0574a",
  "#d99a3e",
  "#7d9a5c",
  "#4e8f8a",
  "#4f7fb5",
  "#8a6aa6",
  "#c56f8f",
  "#9a8a5a",
];
const TIMBER = "#b8865a";
const ROOF = "#6b4a3a";
const DARK = "#6a655c";
const GRASS = "#7d9a5c";
const SAND = "#d9c38f";
const ROCK = "#8d8a84";
const GLOW = "#f2d36b";
const PALETTE = chapters.find((c) => c.instrument === "folio")!.palette;

/** The gable end: a pentagon, extruded along z. */
function houseGeometry(depth: number): ExtrudeGeometry {
  const s = new Shape();
  s.moveTo(-0.35, -0.22);
  s.lineTo(0.35, -0.22);
  s.lineTo(0.35, 0.2);
  s.lineTo(0, 0.5);
  s.lineTo(-0.35, 0.2);
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Callout anchors: the house, the front of the ring, the right-hand neighbour. */
const ANCHORS: (Vector3 | null)[] = [
  new Vector3(0, 0.6, 0.2),
  new Vector3(0, -0.1, RING_R),
  new Vector3(1.25, 0.1, -0.35),
];

export function Stuga({ project }: { project: Project }) {
  const g = useMemo(
    () => ({
      slice: houseGeometry(SLICE_D),
      whole: houseGeometry(HOUSE_D),
      ground: new CylinderGeometry(1.12, 1.12, 0.04, 48),
      smallGround: new CylinderGeometry(0.42, 0.42, 0.04, 32),
      tile: new BoxGeometry(0.09, 0.025, 0.14),
      smallTile: new BoxGeometry(0.035, 0.02, 0.055),
      chimney: new BoxGeometry(0.08, 0.22, 0.08),
      door: new BoxGeometry(0.1, 0.16, 0.02),
      window: new BoxGeometry(0.1, 0.08, 0.02),
      deck: new BoxGeometry(0.8, 0.03, 0.3),
      trunk: new CylinderGeometry(0.02, 0.025, 0.16, 8),
      crown: new ConeGeometry(0.12, 0.34, 8),
    }),
    [],
  );
  const m = useMemo(
    () => ({
      slices: Array.from({ length: SLICES }, () => siteMaterial(TIMBER)),
      whole: siteMaterial(TIMBER),
      roof: siteMaterial(ROOF),
      grass: siteMaterial(GRASS),
      sand: siteMaterial(SAND),
      rock: siteMaterial(ROCK),
      tile: siteMaterial("#ffffff"),
      glow: siteMaterial(GLOW, {
        emissive: new Color(GLOW),
        emissiveIntensity: 0.6,
      }),
      trunk: siteMaterial("#6b4a3a"),
      crown: siteMaterial("#5f7d4a"),
    }),
    [],
  );
  const tints = useMemo(() => OWNER_TINTS.map((c) => new Color(c)), []);
  const timber = useMemo(() => new Color(TIMBER), []);
  const dark = useMemo(() => new Color(DARK), []);
  const dummy = useMemo(() => new Object3D(), []);
  const tmp = useMemo(() => new Color(), []);
  const slices = useRef<(Mesh | null)[]>(Array(SLICES).fill(null));
  const tiles = useRef<InstancedMesh>(null);
  const neighbours = useRef<(Group | null)[]>([null, null]);
  const details = useRef<Group>(null);

  // The neighbours' rings never change: laid out once, one per neighbour.
  const smallRings = useMemo(
    () =>
      [0, 1].map(() => {
        const mesh = new InstancedMesh(g.smallTile, m.tile, WEEKS);
        const o = new Object3D();
        const c = new Color();
        for (let k = 0; k < WEEKS; k++) {
          const a = weekAngle(k);
          o.position.set(Math.cos(a) * 0.37, 0.03, Math.sin(a) * 0.37);
          o.rotation.set(0, Math.PI / 2 - a, 0);
          o.updateMatrix();
          mesh.setMatrixAt(k, o.matrix);
          mesh.setColorAt(k, c.set(OWNER_TINTS[weekOwner(k)]));
        }
        mesh.frustumCulled = false;
        return mesh;
      }),
    [g.smallTile, m.tile],
  );

  useFrame(() => {
    const active = plateState.project === project.id;
    const { beat, t } = plateState;

    // The house: eight shares that stand apart through the build.
    const gap = sliceGap(active, beat, t);
    slices.current.forEach((s, i) => {
      if (!s) return;
      s.position.z =
        -HOUSE_D / 2 +
        SLICE_D / 2 +
        i * SLICE_D +
        (i - (SLICES - 1) / 2) * gap * SPREAD;
      (s.material as MeshStandardMaterial).color
        .copy(timber)
        .lerp(tints[i % OWNERS], gap);
    });

    // The door, windows and deck step aside while the shares stand apart.
    if (details.current) {
      details.current.visible = gap < 0.999;
      details.current.scale.setScalar(Math.max(1e-4, 1 - gap));
    }

    // The year: a tile per week, lit in its owner's tint.
    if (tiles.current) {
      for (let k = 0; k < WEEKS; k++) {
        const lit = weekLit(active, beat, t, k);
        const a = weekAngle(k);
        dummy.position.set(
          Math.cos(a) * RING_R,
          GROUND_Y + 0.02,
          Math.sin(a) * RING_R,
        );
        dummy.rotation.set(0, Math.PI / 2 - a, 0);
        dummy.scale.set(1, 1 + 1.2 * lit, 1);
        dummy.updateMatrix();
        tiles.current.setMatrixAt(k, dummy.matrix);
        const owner =
          active && beat === 0 && LONE_WEEKS.includes(k) ? 0 : weekOwner(k);
        tiles.current.setColorAt(k, tmp.copy(dark).lerp(tints[owner], lit));
      }
      tiles.current.instanceMatrix.needsUpdate = true;
      if (tiles.current.instanceColor)
        tiles.current.instanceColor.needsUpdate = true;
    }

    // The neighbours rise for the result.
    const up = neighboursUp(active, beat, t);
    neighbours.current.forEach((n) => {
      if (!n) return;
      n.visible = up > 0.001;
      n.scale.setScalar(Math.max(1e-4, NEIGHBOUR * up));
    });
  });

  // The house is turned so its slices spread across the view; the door and
  // windows sit on the long wall that faces the reader.
  const house = (
    <group rotation={[0, Math.PI / 2, 0]}>
      <mesh geometry={g.chimney} material={m.roof} position={[0, 0.5, 0.15]} />
      <mesh
        geometry={g.door}
        material={m.roof}
        position={[-0.36, -0.14, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      {[-0.15, 0.15].map((z) => (
        <mesh
          key={z}
          geometry={g.window}
          material={m.glow}
          position={[-0.36, 0.02, z]}
          rotation={[0, Math.PI / 2, 0]}
        />
      ))}
      <mesh
        geometry={g.deck}
        material={m.roof}
        position={[-0.5, -0.235, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </group>
  );

  return (
    <group rotation={[TILT, 0, 0]}>
      <mesh
        geometry={g.ground}
        material={m.grass}
        position={[0, GROUND_Y - 0.02, 0]}
      />
      <instancedMesh
        ref={tiles}
        args={[g.tile, m.tile, WEEKS]}
        frustumCulled={false}
      />

      {/* The house in its shares, turned so they spread across the view. */}
      <group rotation={[0, Math.PI / 2, 0]}>
        {Array.from({ length: SLICES }, (_, i) => (
          <mesh
            key={i}
            ref={(el) => {
              slices.current[i] = el;
            }}
            geometry={g.slice}
            material={m.slices[i]}
          />
        ))}
      </group>
      <group ref={details}>{house}</group>
      {[
        [-0.7, -0.45],
        [0.72, -0.5],
        [0.55, 0.6],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, GROUND_Y, z]}>
          <mesh geometry={g.trunk} material={m.trunk} position={[0, 0.08, 0]} />
          <mesh geometry={g.crown} material={m.crown} position={[0, 0.3, 0]} />
        </group>
      ))}

      {/* The neighbours: on sand and on rock, each with its own full year. */}
      {[
        { x: -1.25, z: -0.35, ground: m.sand },
        { x: 1.25, z: -0.35, ground: m.rock },
      ].map((n, i) => (
        <group
          key={n.x}
          position={[n.x, GROUND_Y, n.z]}
          ref={(el) => {
            neighbours.current[i] = el;
          }}
        >
          <mesh
            geometry={g.smallGround}
            material={n.ground}
            position={[0, -0.02, 0]}
          />
          <primitive object={smallRings[i]} />
          <group position={[0, 0.22, 0]}>
            <mesh
              geometry={g.whole}
              material={m.whole}
              rotation={[0, Math.PI / 2, 0]}
            />
            {house}
          </group>
        </group>
      ))}

      <Callouts
        beats={project.beats}
        anchors={ANCHORS}
        projectId={project.id}
        palette={PALETTE}
      />
    </group>
  );
}
