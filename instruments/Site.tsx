"use client";

import { useContext, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from "three";
import {
  CAP_TOWER,
  FLOOR_PITCH,
  HOIST_TOWER,
  LAYOUT,
  SCAFFOLD_TOWER,
  TOWERS,
  WORKERS,
  capYaw,
  cladAmount,
  craneJib,
  craneMast,
  craneState,
  floorAmount,
  floorsRaised,
  hoistY,
  netAmount,
  scaffoldSegments,
  towerHeight,
  workerPose,
} from "@/lib/site";
import { useDeviceStore } from "@/store/useDeviceStore";
import { Callouts } from "./Callouts";
import { chapters, sections, wcpBeats } from "./chapters";
import { Edged, EdgedModeContext } from "./Instruments";
import { GOLD } from "./palette";
import { plateState } from "./plateState";
import { SiteDressing } from "./SiteDressing";
import { Members, SITE, Solid, segmentsMesh, siteMaterial } from "./siteParts";

/**
 * The Washington Capital Partners hero, the construction site: a city block
 * where five steel-frame towers rise floor by floor through the plate as the
 * loans fund them (core, columns, beams, slabs, then glazing a few floors
 * behind, with safety nets at the working deck), a scaffold on one, a hoist
 * on another, workers on the decks, under a lattice tower crane that swings
 * over the site and sets the gold cap on the tallest tower on the last beat.
 * The yard around them is in SiteDressing.
 */

const L = LAYOUT;
const C = L.crane;
const G = L.groundY;
const STILL_TIME = 3.2;
/** The block is laid out at street scale; this fits it in the plate camera's orbit. */
const SCALE = 0.55;
const CAP_H = 0.18;
const CAP = TOWERS[CAP_TOWER];
/** The trolley sits over the capped tower's centre. */
const TROLLEY = Math.hypot(CAP.x - C.x, CAP.z - C.z);
const JIB_Y = C.mastH;
const APEX_Y = 0.1 + 0.42;
const CAP_UP_Y = JIB_Y - 0.4;
const CAP_SET_Y = G + towerHeight(CAP) + CAP_H / 2 + 0.02;
const HOOK_GAP = CAP_H / 2 + 0.04;

/** Every floor of every tower, flattened: the instance index of floor f of tower i. */
const FLOOR_INDEX = TOWERS.flatMap((t, tower) =>
  Array.from({ length: t.floors }, (_, f) => ({ tower, f })),
);
const N_FLOORS = FLOOR_INDEX.length;
const N_WORKERS = WORKERS.length;

const WCP_PLATE = sections.findIndex(
  (s) => s.kind === "plate" && chapters[s.chapter].instrument === "site",
);
const WCP_PALETTE = chapters.find((c) => c.instrument === "site")!.palette;

/** Callout anchors, one per beat: the plot's front edge, a tower top, the crane mast, the silo; the cap beat is docked. */
const ANCHORS: (Vector3 | null)[] = [
  new Vector3(0, G + 0.05, L.plotD / 2),
  new Vector3(TOWERS[3].x, G + towerHeight(TOWERS[3]), TOWERS[3].z),
  new Vector3(C.x, G + C.mastH * 0.45, C.z),
  new Vector3(L.silo.x, G + 0.95, L.silo.z),
  // The cap is the highest point on the site: its card would leave the viewport, so the beat keeps the docked caption.
  null,
];

function unitRod(): CylinderGeometry {
  const c = new CylinderGeometry(1, 1, 1, 8);
  c.translate(0, 0.5, 0);
  return c;
}

export function Site({ mech }: { mech: RefObject<Group | null> }) {
  const ctx = useContext(EdgedModeContext);
  const g = useMemo(() => {
    const cable = new CylinderGeometry(1, 1, 1, 6);
    cable.translate(0, -0.5, 0);
    return {
      column: unitRod(),
      cores: TOWERS.map(
        (t) => new BoxGeometry(t.w * 0.3, towerHeight(t), t.d * 0.3),
      ),
      slab: new BoxGeometry(1, 0.03, 1),
      beam: new BoxGeometry(1, 0.025, 0.025),
      clad: new BoxGeometry(1, FLOOR_PITCH - 0.03, 0.01),
      net: new BoxGeometry(1, FLOOR_PITCH, 0.006),
      body: new CylinderGeometry(0.012, 0.012, 0.05, 8),
      helmet: new SphereGeometry(0.015, 8, 6),
      hoistMast: unitRod(),
      hoistCage: new BoxGeometry(0.1, 0.12, 0.1),
      ring: new CylinderGeometry(0.08, 0.08, 0.04, 16),
      weight: new BoxGeometry(0.08, 0.12, 0.14),
      cab: new BoxGeometry(0.12, 0.1, 0.1),
      trolley: new BoxGeometry(0.08, 0.04, 0.1),
      cable,
      hook: new BoxGeometry(0.04, 0.05, 0.04),
      cap: new CylinderGeometry(0.12, 0.18, CAP_H, 4),
      beacon: new SphereGeometry(0.02, 8, 6),
      pendants: (() => {
        const geo = new BufferGeometry();
        const pts = craneJib().pendants.flatMap(([a, b]) => [...a, ...b]);
        geo.setAttribute("position", new Float32BufferAttribute(pts, 3));
        return geo;
      })(),
      slabLines: (() => {
        const geo = new BufferGeometry();
        geo.setAttribute(
          "position",
          new Float32BufferAttribute(
            new Float32Array(N_FLOORS * 8 * 3),
            3,
          ).setUsage(DynamicDrawUsage),
        );
        return geo;
      })(),
    };
  }, []);
  const m = useMemo(
    () => ({
      slab: siteMaterial(SITE.concrete),
      beam: siteMaterial(SITE.steel, { metalness: 0.4, roughness: 0.5 }),
      clad: siteMaterial(SITE.glass, {
        transparent: true,
        opacity: 0.55,
        metalness: 0.3,
        roughness: 0.2,
      }),
      net: siteMaterial(SITE.net, {
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
      body: siteMaterial(SITE.hivis),
      helmet: siteMaterial(SITE.helmet),
      lattice: siteMaterial(SITE.crane, { metalness: 0.3, roughness: 0.5 }),
      scaffold: siteMaterial(SITE.steel, { metalness: 0.4, roughness: 0.5 }),
      pendant: new LineBasicMaterial({ color: SITE.steel }),
      beacon: new MeshBasicMaterial({ color: SITE.beacon, toneMapped: false }),
    }),
    [],
  );
  const lattice = useMemo(
    () => ({
      mast: segmentsMesh(craneMast(), 0.012, m.lattice),
      jib: segmentsMesh(craneJib().truss, 0.011, m.lattice),
    }),
    [m],
  );
  const scaffoldSegs = useMemo(
    () => scaffoldSegments(TOWERS[SCAFFOLD_TOWER]),
    [],
  );
  const beaconColour = useMemo(() => new Color(SITE.beacon), []);
  const dummy = useMemo(() => new Object3D(), []);
  const raised = useMemo(() => TOWERS.map(() => 0), []);

  const slabs = useRef<InstancedMesh>(null);
  const beams = useRef<InstancedMesh>(null);
  const clads = useRef<InstancedMesh>(null);
  const nets = useRef<InstancedMesh>(null);
  const bodies = useRef<InstancedMesh>(null);
  const helmets = useRef<InstancedMesh>(null);
  const slabLines = useRef<LineSegments>(null);
  const cores = useRef<(Group | null)[]>(TOWERS.map(() => null));
  const columns = useRef<(Group | null)[]>(TOWERS.map(() => null));
  const scaffold = useRef<Group>(null);
  const hoistMast = useRef<Group>(null);
  const hoistCage = useRef<Group>(null);
  const jib = useRef<Group>(null);
  const cable = useRef<Group>(null);
  const hook = useRef<Group>(null);
  const cap = useRef<Group>(null);

  /* eslint-disable react-hooks/immutability -- r3f pattern: mutate ref object3Ds, instance buffers and materials in useFrame */
  useFrame(({ clock }) => {
    const { reducedMotion } = useDeviceStore.getState();
    const active = plateState.instrument === "site";
    const { beat, t, p } = plateState;
    const time = reducedMotion ? STILL_TIME : clock.elapsedTime;

    // The towers: cores and columns climb with the floors.
    TOWERS.forEach((tower, i) => {
      raised[i] = floorsRaised(active, p, i);
      const s = Math.max(1e-4, raised[i] / tower.floors);
      const core = cores.current[i];
      if (core) core.scale.y = s;
      const col = columns.current[i];
      if (col) col.scale.y = s;
    });

    // A floor per draw: slab and beams, glazing a few floors behind, nets at the deck.
    const lines = slabLines.current
      ? (g.slabLines.getAttribute("position") as Float32BufferAttribute)
      : null;
    for (let idx = 0; idx < N_FLOORS; idx++) {
      const { tower, f } = FLOOR_INDEX[idx];
      const tw = TOWERS[tower];
      const a = floorAmount(raised[tower], f);
      const y = G + (f + 1) * FLOOR_PITCH;
      const hw = (tw.w / 2) * a;
      const hd = (tw.d / 2) * a;
      if (slabs.current) {
        dummy.position.set(tw.x, y, tw.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(Math.max(1e-4, tw.w * a), 1, Math.max(1e-4, tw.d * a));
        dummy.updateMatrix();
        slabs.current.setMatrixAt(idx, dummy.matrix);
      }
      if (lines) {
        const o = idx * 8;
        lines.setXYZ(o, tw.x - hw, y, tw.z - hd);
        lines.setXYZ(o + 1, tw.x + hw, y, tw.z - hd);
        lines.setXYZ(o + 2, tw.x + hw, y, tw.z - hd);
        lines.setXYZ(o + 3, tw.x + hw, y, tw.z + hd);
        lines.setXYZ(o + 4, tw.x + hw, y, tw.z + hd);
        lines.setXYZ(o + 5, tw.x - hw, y, tw.z + hd);
        lines.setXYZ(o + 6, tw.x - hw, y, tw.z + hd);
        lines.setXYZ(o + 7, tw.x - hw, y, tw.z - hd);
      }
      const c = cladAmount(raised[tower], f);
      const n = netAmount(raised[tower], f, tw.floors);
      for (let k = 0; k < 4; k++) {
        const alongX = k < 2;
        const sign = k % 2 === 0 ? 1 : -1;
        const len = alongX ? tw.w : tw.d;
        const px = alongX ? tw.x : tw.x + (sign * tw.w) / 2;
        const pz = alongX ? tw.z + (sign * tw.d) / 2 : tw.z;
        const ry = alongX ? 0 : Math.PI / 2;
        if (beams.current) {
          dummy.position.set(px, y - 0.028, pz);
          dummy.rotation.set(0, ry, 0);
          dummy.scale.set(
            Math.max(1e-4, len * a),
            Math.max(1e-4, a),
            Math.max(1e-4, a),
          );
          dummy.updateMatrix();
          beams.current.setMatrixAt(idx * 4 + k, dummy.matrix);
        }
        if (clads.current) {
          dummy.position.set(px, y - FLOOR_PITCH / 2, pz);
          dummy.rotation.set(0, ry, 0);
          dummy.scale.set(
            Math.max(1e-4, len * 0.98 * c),
            Math.max(1e-4, c),
            Math.max(1e-4, c),
          );
          dummy.updateMatrix();
          clads.current.setMatrixAt(idx * 4 + k, dummy.matrix);
        }
        if (nets.current) {
          const out = 0.025;
          dummy.position.set(
            alongX ? px : px + sign * out,
            y - FLOOR_PITCH / 2,
            alongX ? pz + sign * out : pz,
          );
          dummy.rotation.set(0, ry, 0);
          dummy.scale.set(
            Math.max(1e-4, (len + 0.05) * n),
            Math.max(1e-4, n),
            Math.max(1e-4, n),
          );
          dummy.updateMatrix();
          nets.current.setMatrixAt(idx * 4 + k, dummy.matrix);
        }
      }
    }
    if (slabs.current) slabs.current.instanceMatrix.needsUpdate = true;
    if (beams.current) beams.current.instanceMatrix.needsUpdate = true;
    if (clads.current) clads.current.instanceMatrix.needsUpdate = true;
    if (nets.current) nets.current.instanceMatrix.needsUpdate = true;
    if (lines) lines.needsUpdate = true;

    // The scaffold goes up with its tower's first lifts; the hoist climbs its mast.
    if (scaffold.current) {
      const s = Math.min(1, raised[SCAFFOLD_TOWER] / 4);
      scaffold.current.visible = s > 0.001;
      scaffold.current.scale.y = Math.max(1e-4, s);
    }
    const hoistTop = raised[HOIST_TOWER] * FLOOR_PITCH;
    if (hoistMast.current) hoistMast.current.scale.y = Math.max(1e-4, hoistTop);
    if (hoistCage.current) {
      hoistCage.current.visible = hoistTop > 0.2;
      hoistCage.current.position.y =
        G + 0.06 + hoistY(time, Math.max(0, hoistTop - 0.12));
    }

    // Workers on the decks and in the yard.
    if (bodies.current && helmets.current) {
      for (let i = 0; i < N_WORKERS; i++) {
        const w = WORKERS[i];
        const pose = workerPose(w, raised);
        const bob = 0.003 * Math.sin(time * 2 + w.phase * 6.28);
        const s = pose.visible ? 1 : 1e-4;
        dummy.position.set(pose.x, pose.y + 0.025 + bob, pose.z);
        dummy.rotation.set(0, w.phase * 6.28, 0);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        bodies.current.setMatrixAt(i, dummy.matrix);
        dummy.position.y = pose.y + 0.058 + bob;
        dummy.updateMatrix();
        helmets.current.setMatrixAt(i, dummy.matrix);
      }
      bodies.current.instanceMatrix.needsUpdate = true;
      helmets.current.instanceMatrix.needsUpdate = true;
    }

    // The crane: slews over the site, then sets the cap and recovers the hook.
    const crane = craneState(active, beat, t, wcpBeats.length, time);
    if (jib.current) jib.current.rotation.y = crane.yaw;
    const hookWorldY =
      CAP_UP_Y + (CAP_SET_Y + HOOK_GAP - CAP_UP_Y) * crane.hook;
    const hookLocal = hookWorldY - (G + JIB_Y);
    if (hook.current) hook.current.position.y = hookLocal;
    if (cable.current)
      cable.current.scale.y = Math.max(1e-4, -0.06 - hookLocal - 0.025);
    if (cap.current) {
      const hanging = hookLocal - HOOK_GAP;
      const set = CAP_SET_Y - (G + JIB_Y);
      cap.current.position.y = hanging + (set - hanging) * crane.seat;
    }
    const blink = Math.sin(time * 4) > 0 ? 2.2 : 0.35;
    m.beacon.color.copy(beaconColour).multiplyScalar(reducedMotion ? 1 : blink);
  });
  /* eslint-enable react-hooks/immutability */

  const hoistTower = TOWERS[HOIST_TOWER];
  return (
    <group position={[0, -0.3, 0]}>
      <group ref={mech} scale={SCALE}>
        <SiteDressing />

        {/* The towers: a lift core and four columns per tower, climbing with the floors. */}
        {TOWERS.map((tower, i) => (
          <group key={i} position={[tower.x, G, tower.z]}>
            <group
              ref={(el) => {
                cores.current[i] = el;
              }}
            >
              <Edged
                geometry={g.cores[i]}
                position={[0, towerHeight(tower) / 2, 0]}
                color={SITE.core}
              />
            </group>
            <group
              ref={(el) => {
                columns.current[i] = el;
              }}
            >
              {[-1, 1].flatMap((sx) =>
                [-1, 1].map((sz) => (
                  <group
                    key={`${sx}${sz}`}
                    position={[(sx * tower.w) / 2, 0, (sz * tower.d) / 2]}
                    scale={[0.016, towerHeight(tower), 0.016]}
                  >
                    <Edged geometry={g.column} color={SITE.steel} />
                  </group>
                )),
              )}
            </group>
          </group>
        ))}
        <Solid>
          <instancedMesh
            ref={slabs}
            args={[g.slab, m.slab, N_FLOORS]}
            frustumCulled={false}
          />
          <instancedMesh
            ref={beams}
            args={[g.beam, m.beam, N_FLOORS * 4]}
            frustumCulled={false}
          />
          <instancedMesh
            ref={clads}
            args={[g.clad, m.clad, N_FLOORS * 4]}
            frustumCulled={false}
          />
          <instancedMesh
            ref={nets}
            args={[g.net, m.net, N_FLOORS * 4]}
            frustumCulled={false}
          />
          <instancedMesh
            ref={bodies}
            args={[g.body, m.body, N_WORKERS]}
            frustumCulled={false}
          />
          <instancedMesh
            ref={helmets}
            args={[g.helmet, m.helmet, N_WORKERS]}
            frustumCulled={false}
          />
          <group ref={scaffold} position={[0, G, 0]}>
            <Members
              segs={scaffoldSegs}
              thickness={0.008}
              material={m.scaffold}
            />
          </group>
        </Solid>
        {/* The slabs' hairlines for the engraved twin. */}
        {ctx.mode === "lines" && ctx.lineMaterial ? (
          <lineSegments
            ref={slabLines}
            geometry={g.slabLines}
            material={ctx.lineMaterial}
            frustumCulled={false}
          />
        ) : null}

        {/* The hoist on its tower's flank. */}
        <group
          ref={hoistMast}
          position={[hoistTower.x + hoistTower.w / 2 + 0.07, G, hoistTower.z]}
          scale={[0.012, 1, 0.012]}
        >
          <Edged geometry={g.hoistMast} color={SITE.steel} />
        </group>
        <group
          ref={hoistCage}
          position={[
            hoistTower.x + hoistTower.w / 2 + 0.07,
            G + 0.06,
            hoistTower.z,
          ]}
        >
          <Edged geometry={g.hoistCage} color={SITE.crane} />
        </group>

        {/* The tower crane: lattice mast, slewing ring, jib and counter-jib, apex and pendants. */}
        <group position={[C.x, G, C.z]}>
          <Solid>
            <primitive object={lattice.mast} />
          </Solid>
          <Edged
            geometry={g.ring}
            position={[0, JIB_Y - 0.02, 0]}
            color={SITE.steel}
            threshold={25}
          />
          <group ref={jib} position={[0, JIB_Y, 0]} rotation={[0, capYaw(), 0]}>
            <Solid>
              <primitive object={lattice.jib} />
              <lineSegments geometry={g.pendants} material={m.pendant} />
              <mesh
                geometry={g.beacon}
                material={m.beacon}
                position={[0, APEX_Y + 0.02, 0]}
              />
            </Solid>
            <Edged
              geometry={g.cab}
              position={[0.1, -0.07, 0.09]}
              color={SITE.crane}
            />
            {[0, 1, 2].map((i) => (
              <Edged
                key={i}
                geometry={g.weight}
                position={[-C.counter + 0.06 + i * 0.09, -0.02, 0]}
                color={SITE.concrete}
              />
            ))}
            <Edged
              geometry={g.trolley}
              position={[TROLLEY, -0.04, 0]}
              color={SITE.steel}
            />
            <group
              ref={cable}
              position={[TROLLEY, -0.06, 0]}
              scale={[0.004, 1, 0.004]}
            >
              <Edged geometry={g.cable} color={SITE.steel} threshold={25} />
            </group>
            <group ref={hook} position={[TROLLEY, -0.4, 0]}>
              <Edged geometry={g.hook} color={SITE.steel} />
            </group>
            <group ref={cap} position={[TROLLEY, -0.5, 0]}>
              <Edged
                geometry={g.cap}
                rotation={[0, Math.PI / 4, 0]}
                color={GOLD}
                threshold={1}
              />
            </group>
          </group>
        </group>

        <Solid>
          <Callouts
            beats={wcpBeats}
            anchors={ANCHORS}
            sectionIndex={WCP_PLATE}
            palette={WCP_PALETTE}
          />
        </Solid>
      </group>
    </group>
  );
}
