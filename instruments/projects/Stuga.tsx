"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  CircleGeometry,
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
  SphereGeometry,
  Vector3,
} from "three";
import {
  LONE_WEEKS,
  OWNERS,
  SLICES,
  WEEKS,
  monthAngles,
  neighboursUp,
  puff,
  roofLift,
  sliceGap,
  sliceSpread,
  tileRise,
  weekAngle,
  weekLit,
  weekOwner,
} from "@/lib/stuga";
import { useDeviceStore } from "@/store/useDeviceStore";
import { Callouts } from "../Callouts";
import { chapters } from "../chapters";
import type { Project } from "../content";
import { plateState } from "../plateState";
import { siteMaterial } from "../siteParts";
import { useProjectStore } from "../useProjectStore";

/**
 * Stuga, the house and the year: a timber cabin with an overhanging roof,
 * a porch, a lantern and a stone chimney that smokes, on a lawn with a
 * lake, a stone path, conifers and bushes, in the middle of a ring of 52
 * week-tiles with a post for every month. The problem beat lights one
 * owner's two weeks; the build lifts the roof, fans the house into eight
 * tinted shares and fills the ring with no two weeks overlapping; the
 * result seats the house and raises two more homes, one on a beach with
 * palms, one in the mountains under snow, each with a full ring of its own.
 */

const RING_R = 0.95;
const HOUSE_W = 0.7;
const HOUSE_D = 0.55;
const SLICE_D = HOUSE_D / SLICES;
const G = -0.22;
const SPREAD = 0.075;
const NEIGHBOUR = 0.42;
const TILT = 0.45;
const PUFFS = 6;
const STILL_TIME = 2;
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
const C = {
  timber: "#b8865a",
  timberDark: "#8d6540",
  roof: "#5e4134",
  ridge: "#3f2b22",
  stone: "#8d8a84",
  stoneDark: "#6f6c66",
  dark: "#6a655c",
  grass: "#7d9a5c",
  grassDark: "#6a8a4e",
  sand: "#dcc48f",
  water: "#6fa3c4",
  rock: "#8f8b85",
  snow: "#f1f1ee",
  glow: "#f2d36b",
  trunk: "#6b4a3a",
  conifer: "#4f7140",
  coniferLight: "#5f8a4a",
  bush: "#5c8a4c",
  palm: "#5f9a4a",
  cloud: "#f4f1ea",
  smoke: "#d8d2c6",
};
const PALETTE = chapters.find((c) => c.instrument === "folio")!.palette;

/** The gable wall: a pentagon in XY, extruded along z and centred. */
function wallGeometry(depth: number): ExtrudeGeometry {
  const s = new Shape();
  const hw = HOUSE_W / 2;
  s.moveTo(-hw, -0.22);
  s.lineTo(hw, -0.22);
  s.lineTo(hw, 0.2);
  s.lineTo(0, 0.5);
  s.lineTo(-hw, 0.2);
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Callout anchors: the house, the front of the ring, the mountain home. */
const ANCHORS: (Vector3 | null)[] = [
  new Vector3(0, 0.72, 0.3),
  new Vector3(0, -0.1, RING_R),
  new Vector3(-1.25, 0.15, -0.35),
];

const PATH_STONES: [number, number][] = [
  [0.02, 0.52],
  [-0.03, 0.6],
  [0.03, 0.68],
  [-0.02, 0.76],
  [0.02, 0.84],
];
const CONIFERS: [number, number, number][] = [
  [-0.7, -0.45, 1],
  [0.72, -0.5, 0.85],
  [0.6, 0.55, 0.7],
  [-0.55, 0.6, 0.6],
  [-0.1, -0.7, 0.9],
];
const BUSHES: [number, number, number][] = [
  [-0.45, 0.25, 0.07],
  [0.45, 0.3, 0.06],
  [-0.3, -0.55, 0.05],
];
const CLOUDS: [number, number, number][] = [
  [-0.9, 1.05, -0.4],
  [0.3, 1.2, -0.7],
  [0.95, 1.0, 0.1],
];

export function Stuga({ project }: { project: Project }) {
  const g = useMemo(() => {
    const roofSlope = Math.atan2(0.3, HOUSE_W / 2);
    const roofLen = Math.hypot(0.3, HOUSE_W / 2) + 0.08;
    return {
      slice: wallGeometry(SLICE_D),
      whole: wallGeometry(HOUSE_D),
      roofSlab: new BoxGeometry(roofLen, 0.035, HOUSE_D + 0.14),
      ridge: new BoxGeometry(0.05, 0.04, HOUSE_D + 0.16),
      roofSlope,
      roofLen,
      ground: new CylinderGeometry(1.12, 1.15, 0.05, 56),
      rim: new CylinderGeometry(1.14, 1.14, 0.012, 56),
      smallGround: new CylinderGeometry(0.42, 0.45, 0.05, 36),
      lake: new CircleGeometry(0.2, 28),
      stone: new CylinderGeometry(0.045, 0.045, 0.012, 10),
      tile: new BoxGeometry(0.09, 0.025, 0.14),
      smallTile: new BoxGeometry(0.035, 0.02, 0.055),
      post: new CylinderGeometry(0.012, 0.012, 0.11, 8),
      chimney: new BoxGeometry(0.1, 0.26, 0.1),
      chimneyCap: new BoxGeometry(0.13, 0.03, 0.13),
      puff: new SphereGeometry(1, 10, 8),
      doorFrame: new BoxGeometry(0.13, 0.19, 0.02),
      door: new BoxGeometry(0.1, 0.16, 0.02),
      knob: new SphereGeometry(0.008, 8, 6),
      windowFrame: new BoxGeometry(0.13, 0.11, 0.02),
      pane: new BoxGeometry(0.1, 0.08, 0.02),
      mullionV: new BoxGeometry(0.008, 0.08, 0.022),
      mullionH: new BoxGeometry(0.1, 0.008, 0.022),
      bracket: new CylinderGeometry(0.005, 0.005, 0.06, 6),
      lantern: new SphereGeometry(0.018, 10, 8),
      deck: new BoxGeometry(0.82, 0.03, 0.3),
      deckPost: new CylinderGeometry(0.012, 0.012, 0.12, 8),
      rail: new BoxGeometry(0.82, 0.012, 0.012),
      railSide: new BoxGeometry(0.012, 0.012, 0.3),
      step: new BoxGeometry(0.22, 0.025, 0.07),
      trunk: new CylinderGeometry(0.018, 0.028, 0.18, 8),
      tierLow: new ConeGeometry(0.15, 0.26, 9),
      tierHigh: new ConeGeometry(0.1, 0.24, 9),
      bush: new SphereGeometry(1, 10, 8),
      cloud: new SphereGeometry(1, 10, 8),
      palmTrunk: new CylinderGeometry(0.014, 0.022, 0.3, 8),
      palmCrown: new SphereGeometry(0.1, 10, 8),
      peak: new ConeGeometry(0.22, 0.42, 7),
      snow: new ConeGeometry(0.09, 0.17, 7),
    };
  }, []);
  const m = useMemo(
    () => ({
      slices: Array.from({ length: SLICES }, () => siteMaterial(C.timber)),
      whole: siteMaterial(C.timber),
      timberDark: siteMaterial(C.timberDark),
      roof: siteMaterial(C.roof),
      ridge: siteMaterial(C.ridge),
      stone: siteMaterial(C.stone),
      stoneDark: siteMaterial(C.stoneDark),
      grass: siteMaterial(C.grass),
      grassDark: siteMaterial(C.grassDark),
      sand: siteMaterial(C.sand),
      water: siteMaterial(C.water, { roughness: 0.25, metalness: 0.1 }),
      rock: siteMaterial(C.rock),
      snow: siteMaterial(C.snow),
      tile: siteMaterial("#ffffff"),
      glow: siteMaterial(C.glow, {
        emissive: new Color(C.glow),
        emissiveIntensity: 0.7,
      }),
      lantern: siteMaterial(C.glow, {
        emissive: new Color(C.glow),
        emissiveIntensity: 1.6,
      }),
      trunk: siteMaterial(C.trunk),
      conifer: siteMaterial(C.conifer),
      coniferLight: siteMaterial(C.coniferLight),
      bush: siteMaterial(C.bush),
      palm: siteMaterial(C.palm),
      cloud: siteMaterial(C.cloud, { transparent: true, opacity: 0.85 }),
      smoke: siteMaterial(C.smoke, {
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    }),
    [],
  );
  const tints = useMemo(() => OWNER_TINTS.map((c) => new Color(c)), []);
  const timber = useMemo(() => new Color(C.timber), []);
  const dark = useMemo(() => new Color(C.dark), []);
  const dummy = useMemo(() => new Object3D(), []);
  const tmp = useMemo(() => new Color(), []);

  // Laid out once: the month posts, the path, the neighbours' rings.
  const statics = useMemo(() => {
    const o = new Object3D();
    const posts = new InstancedMesh(g.post, m.timberDark, 12);
    monthAngles().forEach((a, i) => {
      o.position.set(
        Math.cos(a) * (RING_R + 0.1),
        G + 0.05,
        Math.sin(a) * (RING_R + 0.1),
      );
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(1);
      o.updateMatrix();
      posts.setMatrixAt(i, o.matrix);
    });
    const stones = new InstancedMesh(g.stone, m.stone, PATH_STONES.length);
    PATH_STONES.forEach(([x, z], i) => {
      o.position.set(x, G + 0.006, z);
      o.rotation.set(0, i * 0.7, 0);
      o.scale.set(1 + 0.2 * (i % 2), 1, 0.85);
      o.updateMatrix();
      stones.setMatrixAt(i, o.matrix);
    });
    const c = new Color();
    const rings = [0, 1].map(() => {
      const mesh = new InstancedMesh(g.smallTile, m.tile, WEEKS);
      for (let k = 0; k < WEEKS; k++) {
        const a = weekAngle(k);
        o.position.set(Math.cos(a) * 0.37, 0.03, Math.sin(a) * 0.37);
        o.rotation.set(0, Math.PI / 2 - a, 0);
        o.scale.setScalar(1);
        o.updateMatrix();
        mesh.setMatrixAt(k, o.matrix);
        mesh.setColorAt(k, c.set(OWNER_TINTS[weekOwner(k)]));
      }
      mesh.frustumCulled = false;
      return mesh;
    });
    for (const mesh of [posts, stones]) mesh.frustumCulled = false;
    return { posts, stones, rings };
  }, [g, m]);

  const slices = useRef<(Mesh | null)[]>(Array(SLICES).fill(null));
  const roof = useRef<Group>(null);
  const tiles = useRef<InstancedMesh>(null);
  const puffs = useRef<InstancedMesh>(null);
  const neighbours = useRef<(Group | null)[]>([null, null]);
  const details = useRef<Group>(null);
  const clouds = useRef<(Group | null)[]>(CLOUDS.map(() => null));

  useFrame(({ clock }) => {
    const { reducedMotion } = useDeviceStore.getState();
    const time = reducedMotion ? STILL_TIME : clock.elapsedTime;
    const active =
      plateState.instrument === "folio" &&
      useProjectStore.getState().open === project.id;
    const { beat, t } = plateState;

    // The house: the roof lifts and eight shares fan out, outer ones first.
    const gap = sliceGap(active, beat, t);
    slices.current.forEach((s, i) => {
      if (!s) return;
      const spread = sliceSpread(gap, i, SLICES);
      s.position.z =
        -HOUSE_D / 2 +
        SLICE_D / 2 +
        i * SLICE_D +
        (i - (SLICES - 1) / 2) * spread * SPREAD;
      (s.material as MeshStandardMaterial).color
        .copy(timber)
        .lerp(tints[i % OWNERS], spread);
    });
    if (roof.current) roof.current.position.y = roofLift(gap);
    if (details.current) {
      details.current.visible = gap < 0.999;
      details.current.scale.setScalar(Math.max(1e-4, 1 - gap));
    }

    // The year: a tile per week, rising in its owner's tint as it is booked.
    if (tiles.current) {
      for (let k = 0; k < WEEKS; k++) {
        const lit = weekLit(active, beat, t, k);
        const a = weekAngle(k);
        dummy.position.set(
          Math.cos(a) * RING_R,
          G + 0.03,
          Math.sin(a) * RING_R,
        );
        dummy.rotation.set(0, Math.PI / 2 - a, 0);
        dummy.scale.set(1, tileRise(lit), 1);
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

    // Smoke from the chimney.
    if (puffs.current) {
      for (let i = 0; i < PUFFS; i++) {
        const p = puff(time, i, PUFFS);
        dummy.position.set(0.15 + p.drift, 0.66 + p.y, 0.18);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(Math.max(1e-4, p.r * (0.3 + p.alpha)));
        dummy.updateMatrix();
        puffs.current.setMatrixAt(i, dummy.matrix);
      }
      puffs.current.instanceMatrix.needsUpdate = true;
    }

    // Clouds drift; the neighbours rise for the result.
    clouds.current.forEach((c, i) => {
      if (!c) return;
      c.position.x = CLOUDS[i][0] + 0.12 * Math.sin(time * 0.1 + i * 2);
    });
    const up = neighboursUp(active, beat, t);
    neighbours.current.forEach((n) => {
      if (!n) return;
      n.visible = up > 0.001;
      n.scale.setScalar(Math.max(1e-4, NEIGHBOUR * up));
    });
  });

  const wall = HOUSE_W / 2 + 0.012;
  // The house is turned so its shares spread across the view; the door,
  // windows and porch sit on the long wall that faces the reader.
  const frontage = (
    <group rotation={[0, Math.PI / 2, 0]}>
      <mesh
        geometry={g.doorFrame}
        material={m.ridge}
        position={[-wall, -0.125, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <mesh
        geometry={g.door}
        material={m.timberDark}
        position={[-wall - 0.006, -0.14, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <mesh
        geometry={g.knob}
        material={m.lantern}
        position={[-wall - 0.018, -0.14, 0.035]}
      />
      {[-0.17, 0.17].map((z) => (
        <group
          key={z}
          position={[-wall, 0.03, z]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <mesh geometry={g.windowFrame} material={m.ridge} />
          <mesh geometry={g.pane} material={m.glow} position={[0, 0, -0.004]} />
          <mesh geometry={g.mullionV} material={m.ridge} />
          <mesh geometry={g.mullionH} material={m.ridge} />
        </group>
      ))}
      <mesh
        geometry={g.bracket}
        material={m.ridge}
        position={[-wall - 0.03, 0.06, -0.1]}
        rotation={[0, 0, Math.PI / 2]}
      />
      <mesh
        geometry={g.lantern}
        material={m.lantern}
        position={[-wall - 0.055, 0.04, -0.1]}
      />
      <group
        position={[-wall - 0.15, -0.235, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <mesh geometry={g.deck} material={m.timberDark} />
        {[-0.38, 0.38].flatMap((x) =>
          [-0.13, 0.13].map((z) => (
            <mesh
              key={`${x}${z}`}
              geometry={g.deckPost}
              material={m.ridge}
              position={[x, 0.07, z]}
            />
          )),
        )}
        <mesh geometry={g.rail} material={m.ridge} position={[0, 0.13, 0.13]} />
        {[-0.38, 0.38].map((x) => (
          <mesh
            key={x}
            geometry={g.railSide}
            material={m.ridge}
            position={[x, 0.13, 0]}
          />
        ))}
        {[0, 1].map((i) => (
          <mesh
            key={i}
            geometry={g.step}
            material={m.timberDark}
            position={[0, -0.02 - i * 0.025, 0.19 + i * 0.07]}
          />
        ))}
      </group>
    </group>
  );
  const roofPiece = (
    <group>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={g.roofSlab}
          material={m.roof}
          position={[
            (side * g.roofLen * Math.cos(g.roofSlope)) / 2 - side * 0.03,
            0.2 + (g.roofLen * Math.sin(g.roofSlope)) / 2 + 0.01,
            0,
          ]}
          rotation={[0, 0, -side * g.roofSlope]}
        />
      ))}
      <mesh geometry={g.ridge} material={m.ridge} position={[0, 0.52, 0]} />
    </group>
  );
  const chimney = (
    <group position={[0.15, 0, 0.18]}>
      <mesh geometry={g.chimney} material={m.stone} position={[0, 0.5, 0]} />
      <mesh
        geometry={g.chimneyCap}
        material={m.stoneDark}
        position={[0, 0.64, 0]}
      />
    </group>
  );

  return (
    <group rotation={[TILT, 0, 0]}>
      {/* The lawn, its rim, the lake and the path. */}
      <mesh
        geometry={g.ground}
        material={m.grass}
        position={[0, G - 0.025, 0]}
      />
      <mesh
        geometry={g.rim}
        material={m.grassDark}
        position={[0, G - 0.048, 0]}
      />
      <mesh
        geometry={g.lake}
        material={m.water}
        position={[0.5, G + 0.003, -0.05]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.35, 1, 1]}
      />
      <primitive object={statics.stones} />
      <primitive object={statics.posts} />
      <instancedMesh
        ref={tiles}
        args={[g.tile, m.tile, WEEKS]}
        frustumCulled={false}
      />

      {/* The house in its shares, the roof above, the frontage, the chimney. */}
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
      <group ref={roof} rotation={[0, Math.PI / 2, 0]}>
        {roofPiece}
      </group>
      <group ref={details}>{frontage}</group>
      {chimney}
      <instancedMesh
        ref={puffs}
        args={[g.puff, m.smoke, PUFFS]}
        frustumCulled={false}
      />

      {/* Conifers, bushes and clouds. */}
      {CONIFERS.map(([x, z, s]) => (
        <group key={`${x}${z}`} position={[x, G, z]} scale={s}>
          <mesh geometry={g.trunk} material={m.trunk} position={[0, 0.09, 0]} />
          <mesh
            geometry={g.tierLow}
            material={m.conifer}
            position={[0, 0.28, 0]}
          />
          <mesh
            geometry={g.tierHigh}
            material={m.coniferLight}
            position={[0, 0.46, 0]}
          />
        </group>
      ))}
      {BUSHES.map(([x, z, r]) => (
        <mesh
          key={`${x}${z}`}
          geometry={g.bush}
          material={m.bush}
          position={[x, G + r * 0.7, z]}
          scale={[r * 1.3, r, r]}
        />
      ))}
      {CLOUDS.map(([x, y, z], i) => (
        <group
          key={i}
          position={[x, y, z]}
          ref={(el) => {
            clouds.current[i] = el;
          }}
        >
          <mesh
            geometry={g.cloud}
            material={m.cloud}
            scale={[0.16, 0.08, 0.1]}
          />
          <mesh
            geometry={g.cloud}
            material={m.cloud}
            position={[0.12, 0.02, 0]}
            scale={[0.12, 0.07, 0.09]}
          />
          <mesh
            geometry={g.cloud}
            material={m.cloud}
            position={[-0.11, -0.01, 0.02]}
            scale={[0.1, 0.06, 0.08]}
          />
        </group>
      ))}

      {/* The neighbours: a beach home among palms, a mountain home under snow. */}
      {[
        { x: -1.25, z: -0.35, kind: "beach" as const },
        { x: 1.25, z: -0.35, kind: "mountain" as const },
      ].map((n, i) => (
        <group
          key={n.kind}
          position={[n.x, G, n.z]}
          ref={(el) => {
            neighbours.current[i] = el;
          }}
        >
          {n.kind === "beach" ? (
            <>
              <mesh
                geometry={g.smallGround}
                material={m.water}
                position={[0, -0.04, 0]}
                scale={[1.2, 1, 1.2]}
              />
              <mesh
                geometry={g.smallGround}
                material={m.sand}
                position={[0, -0.025, 0]}
              />
              {[
                [-0.5, 0.25, 0.25],
                [0.55, 0.2, -0.3],
              ].map(([x, lean, z]) => (
                <group key={x} position={[x, 0, z]} rotation={[0, 0, lean]}>
                  <mesh
                    geometry={g.palmTrunk}
                    material={m.trunk}
                    position={[0, 0.15, 0]}
                  />
                  <mesh
                    geometry={g.palmCrown}
                    material={m.palm}
                    position={[0, 0.32, 0]}
                    scale={[1.4, 0.6, 1.4]}
                  />
                </group>
              ))}
            </>
          ) : (
            <>
              <mesh
                geometry={g.smallGround}
                material={m.rock}
                position={[0, -0.025, 0]}
              />
              {[
                [-0.55, 0.0, 0.9],
                [0.5, -0.25, 1],
                [0.15, -0.6, 0.7],
              ].map(([x, z, s]) => (
                <group key={`${x}${z}`} position={[x, 0, z]} scale={s}>
                  <mesh
                    geometry={g.peak}
                    material={m.rock}
                    position={[0, 0.21, 0]}
                  />
                  <mesh
                    geometry={g.snow}
                    material={m.snow}
                    position={[0, 0.345, 0]}
                  />
                </group>
              ))}
            </>
          )}
          <primitive object={statics.rings[i]} />
          <group position={[0, 0.22, 0]}>
            <mesh
              geometry={g.whole}
              material={m.whole}
              rotation={[0, Math.PI / 2, 0]}
            />
            <group rotation={[0, Math.PI / 2, 0]}>{roofPiece}</group>
            {frontage}
            {chimney}
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
