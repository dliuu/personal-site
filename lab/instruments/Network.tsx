"use client";

import { useContext, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  MeshBasicMaterial,
  Object3D,
  OctahedronGeometry,
  Points,
  PointsMaterial,
  Vector3,
} from "three";
import { frameLerp } from "@/lib/drawIn";
import {
  cycleAt,
  edgeDraw,
  iterateFlash,
  layerEmphasis,
  layoutOrchestrators,
  layoutWorkers,
  ORCHESTRATORS,
  passes,
  pillarRise,
  resultU,
  taskU,
  verdictGlow,
  workerScale,
  type Emphasis,
} from "@/lib/network";
import { lerp } from "@/lib/progress";
import { useLabStore } from "@/store/useLabStore";
import { Callouts } from "./Callouts";
import { chapters, eisenBeats, sections } from "./chapters";
import { EdgedModeContext } from "./Instruments";
import { plateState } from "./plateState";

/**
 * SKELETON of the Eisen hero: the software factory as an orchestrator-worker
 * network on the screen inside the intro's monitor. A group of orchestrator
 * agents each spin up their own worker containers; a task packet goes down
 * the edge, the worker runs, a deterministic verdict lights it green or red,
 * the result packet comes back up, and a failure flashes the orchestrator,
 * which spins up the next container in that slot. It all stands on a backend
 * substrate. Each plate beat lifts one layer and the camera turns to its
 * anchor. Drawn raw (the chapter is a screen); solid mode only.
 */

const ORCHS = layoutOrchestrators();
const WORKERS = layoutWorkers();
const N = WORKERS.length;
const ORCH_COLOUR = "#7fb0ff";
const MESH_COLOUR = "#9cc0ff";
const RUN_COLOUR = "#cfe6ff";
const PASS = "#8ef0a0";
const FAIL = "#ff6b5e";
const SUBSTRATE = "#6f8fc9";
const PILLARS = 12;
const PILLAR_R = 0.62;
const GRID_Y = -0.95;
const PILLAR_H = 0.83;
const GRID_HALF = 1.6;
const GRID_N = 12;
const EMPH_LERP = 0.08;
/** The factory at radius ~1.25 fills its band region and the plate frame at this scale. */
const NETWORK_SCALE = 1.15;
/** The pause the whole factory sits at under reduced motion: mid-run. */
const STILL_TIME = 4.5;

const EISEN_PLATE = sections.findIndex(
  (s) => s.kind === "plate" && chapters[s.chapter].instrument === "network",
);
const EISEN_PALETTE = chapters.find((c) => c.instrument === "network")!.palette;

const pillarAngle = (i: number) => (i / PILLARS) * Math.PI * 2;
/**
 * Callout anchors, one per beat: orchestrator 0, one of orchestrator 3's
 * workers, a pillar top. A local point at xz-angle α faces the camera when
 * the beat's longitude is −α (see faceYaw): orchestrator 0 sits at 90° for
 * lon −90, orchestrator 3's last slot near −30° for lon 30, pillar 7 at
 * 210° for lon 150.
 */
const WORKER_ANCHOR = WORKERS.find((w) => w.orch === 3 && w.slot === 6)!;
const PILLAR_ANCHOR = 7;
const ANCHORS: (Vector3 | null)[] = [
  new Vector3(ORCHS[0].x, ORCHS[0].y + 0.06, ORCHS[0].z),
  new Vector3(WORKER_ANCHOR.x, WORKER_ANCHOR.y, WORKER_ANCHOR.z),
  new Vector3(
    Math.cos(pillarAngle(PILLAR_ANCHOR)) * PILLAR_R,
    GRID_Y + PILLAR_H,
    Math.sin(pillarAngle(PILLAR_ANCHOR)) * PILLAR_R,
  ),
];

function dotSprite(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 32, 32);
  return new CanvasTexture(c);
}

function gridGeometry(): BufferGeometry {
  const pts: number[] = [];
  for (let i = 0; i <= GRID_N; i++) {
    const v = -GRID_HALF + (i / GRID_N) * 2 * GRID_HALF;
    pts.push(-GRID_HALF, GRID_Y, v, GRID_HALF, GRID_Y, v);
    pts.push(v, GRID_Y, -GRID_HALF, v, GRID_Y, GRID_HALF);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pts, 3));
  return g;
}

/** The orchestration network itself: every orchestrator linked to every other. */
function meshGeometry(): BufferGeometry {
  const pts: number[] = [];
  for (let a = 0; a < ORCHESTRATORS; a++)
    for (let b = a + 1; b < ORCHESTRATORS; b++)
      pts.push(
        ORCHS[a].x,
        ORCHS[a].y,
        ORCHS[a].z,
        ORCHS[b].x,
        ORCHS[b].y,
        ORCHS[b].z,
      );
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pts, 3));
  return g;
}

/** Dynamic positions, `count` vertices. */
function dynamicGeometry(count: number, colours = false): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute(
    "position",
    new Float32BufferAttribute(new Float32Array(count * 3), 3).setUsage(
      DynamicDrawUsage,
    ),
  );
  if (colours)
    g.setAttribute(
      "color",
      new Float32BufferAttribute(new Float32Array(count * 3), 3).setUsage(
        DynamicDrawUsage,
      ),
    );
  return g;
}

/** A material that blooms: unlit, untone-mapped, brightness set per frame. */
function glow(colour: string): MeshBasicMaterial {
  return new MeshBasicMaterial({ color: colour, toneMapped: false });
}

export function Network({ mech }: { mech: RefObject<Group | null> }) {
  const { mode } = useContext(EdgedModeContext);
  const g = useMemo(() => {
    const pillar = new CylinderGeometry(0.028, 0.028, 1, 8);
    pillar.translate(0, 0.5, 0);
    return {
      orch: new OctahedronGeometry(0.11, 0),
      worker: new BoxGeometry(0.085, 0.085, 0.085),
      pillar,
      grid: gridGeometry(),
      mesh: meshGeometry(),
      // One segment per worker, orchestrator → worker.
      edges: dynamicGeometry(N * 2),
      // A task packet and a result packet per worker.
      packets: dynamicGeometry(N * 2, true),
    };
  }, []);
  const m = useMemo(
    () => ({
      orch: glow(ORCH_COLOUR),
      mesh: new LineBasicMaterial({
        color: MESH_COLOUR,
        transparent: true,
        opacity: 0.5,
      }),
      worker: glow("#ffffff"),
      edge: new LineBasicMaterial({
        color: ORCH_COLOUR,
        transparent: true,
        opacity: 0.4,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
      packet: new PointsMaterial({
        size: 0.06,
        map: dotSprite(),
        vertexColors: true,
        toneMapped: false,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
      grid: new LineBasicMaterial({
        color: SUBSTRATE,
        transparent: true,
        opacity: 0.2,
      }),
      pillar: glow(SUBSTRATE),
    }),
    [],
  );
  const colours = useMemo(
    () => ({
      orch: new Color(ORCH_COLOUR),
      run: new Color(RUN_COLOUR),
      pass: new Color(PASS),
      fail: new Color(FAIL),
      substrate: new Color(SUBSTRATE),
      task: new Color(ORCH_COLOUR).multiplyScalar(1.8),
    }),
    [],
  );
  const dummy = useMemo(() => new Object3D(), []);
  const tmpColour = useMemo(() => new Color(), []);
  const orchs = useRef<InstancedMesh>(null);
  const workers = useRef<InstancedMesh>(null);
  const pillars = useRef<InstancedMesh>(null);
  const packets = useRef<Points>(null);
  const tilt = useRef<Group>(null);
  const emph = useRef<Emphasis>({
    orchestrators: 0.6,
    verdicts: 0.4,
    substrate: 0.3,
  });
  const flash = useRef<number[]>(ORCHS.map(() => 0));

  /* eslint-disable react-hooks/immutability -- r3f pattern: mutate memoized materials, buffers and ref object3Ds in useFrame */
  useFrame(({ clock }, delta) => {
    const { reducedMotion } = useLabStore.getState();
    const active = plateState.instrument === "network";
    const { beat, t, expand } = plateState;
    const time = reducedMotion ? STILL_TIME : clock.elapsedTime;
    // In the band the factory leans toward the reader so its floor reads as
    // a floor; the plate levels it and lets the camera do the looking.
    if (tilt.current) tilt.current.rotation.x = 0.42 * (1 - expand);
    const target = layerEmphasis(active, beat);
    const e = emph.current;
    const k = reducedMotion ? 1 : frameLerp(EMPH_LERP, delta);
    e.orchestrators = lerp(e.orchestrators, target.orchestrators, k);
    e.verdicts = lerp(e.verdicts, target.verdicts, k);
    e.substrate = lerp(e.substrate, target.substrate, k);
    for (let i = 0; i < ORCHESTRATORS; i++) flash.current[i] = 0;

    // Workers: each container lives its own cycle in its orchestrator's slot.
    // In beat 0 the wave out from the orchestrators gates them, so the floor
    // fills in sector by sector.
    const edgePos = g.edges.getAttribute("position") as Float32BufferAttribute;
    const pktPos = g.packets.getAttribute("position") as Float32BufferAttribute;
    const pktCol = g.packets.getAttribute("color") as Float32BufferAttribute;
    if (workers.current) {
      for (let i = 0; i < N; i++) {
        const w = WORKERS[i];
        const o = ORCHS[w.orch];
        const draw = edgeDraw(active, beat, t, w.rank, N);
        const { generation, f } = cycleAt(time, w.phase);
        const ok = passes(w.seed, generation);
        const s = workerScale(f) * draw;
        const glowV = verdictGlow(f);
        dummy.position.set(w.x, w.y, w.z);
        dummy.rotation.set(0, time * 0.25 + w.phase, 0);
        dummy.scale.setScalar(Math.max(1e-4, s));
        dummy.updateMatrix();
        workers.current.setMatrixAt(i, dummy.matrix);
        // Running: a cool white. At the verdict: green or red, brighter in
        // beat 1 where the criteria are the story.
        tmpColour
          .copy(colours.run)
          .multiplyScalar(0.9 + 0.6 * e.orchestrators)
          .lerp(
            ok ? colours.pass : colours.fail,
            glowV * (0.6 + 0.4 * e.verdicts),
          );
        if (glowV > 0) tmpColour.multiplyScalar(1 + 1.6 * glowV * e.verdicts);
        workers.current.setColorAt(i, tmpColour);
        // The edge from the orchestrator draws out to the slot with the wave.
        edgePos.setXYZ(i * 2, o.x, o.y, o.z);
        edgePos.setXYZ(
          i * 2 + 1,
          lerp(o.x, w.x, draw),
          lerp(o.y, w.y, draw),
          lerp(o.z, w.z, draw),
        );
        // Task packet down, result packet back up; parked inside the
        // orchestrator when not in flight (the octahedron hides them).
        const tu = draw > 0.99 ? taskU(f) : null;
        const ru = draw > 0.99 ? resultU(f) : null;
        const a = tu ?? 0;
        pktPos.setXYZ(
          i * 2,
          lerp(o.x, w.x, a),
          lerp(o.y, w.y, a),
          lerp(o.z, w.z, a),
        );
        tmpColour.copy(colours.task).multiplyScalar(tu === null ? 0 : 1);
        pktCol.setXYZ(i * 2, tmpColour.r, tmpColour.g, tmpColour.b);
        const b = ru === null ? 0 : 1 - ru;
        pktPos.setXYZ(
          i * 2 + 1,
          lerp(o.x, w.x, b),
          lerp(o.y, w.y, b),
          lerp(o.z, w.z, b),
        );
        tmpColour
          .copy(ok ? colours.pass : colours.fail)
          .multiplyScalar(ru === null ? 0 : 1.6 + 1.2 * e.verdicts);
        pktCol.setXYZ(i * 2 + 1, tmpColour.r, tmpColour.g, tmpColour.b);
        // A failed result lands: the orchestrator flashes and iterates.
        flash.current[w.orch] = Math.max(
          flash.current[w.orch],
          iterateFlash(f, !ok) * draw,
        );
      }
      workers.current.instanceMatrix.needsUpdate = true;
      if (workers.current.instanceColor)
        workers.current.instanceColor.needsUpdate = true;
      edgePos.needsUpdate = true;
      pktPos.needsUpdate = true;
      pktCol.needsUpdate = true;
    }
    m.edge.opacity = 0.15 + 0.4 * e.orchestrators;
    m.mesh.opacity = 0.25 + 0.5 * e.orchestrators;

    // Orchestrators: bright, breathing out of step, flashing red when they
    // have to iterate.
    if (orchs.current) {
      for (let i = 0; i < ORCHESTRATORS; i++) {
        const o = ORCHS[i];
        const breathe = 0.5 + 0.5 * Math.sin(time * 1.6 + i * 1.3);
        const fl = flash.current[i];
        dummy.position.set(o.x, o.y, o.z);
        dummy.rotation.set(0, time * 0.4 + i, 0);
        dummy.scale.setScalar(1 + 0.08 * breathe + 0.35 * fl);
        dummy.updateMatrix();
        orchs.current.setMatrixAt(i, dummy.matrix);
        orchs.current.setColorAt(
          i,
          tmpColour
            .copy(colours.orch)
            .multiplyScalar(1.3 + 1.2 * e.orchestrators + 0.6 * breathe)
            .lerp(colours.fail, fl)
            .multiplyScalar(1 + 1.5 * fl),
        );
      }
      orchs.current.instanceMatrix.needsUpdate = true;
      if (orchs.current.instanceColor)
        orchs.current.instanceColor.needsUpdate = true;
    }

    // Substrate: the grid the factory stands on and the pillars that carry it.
    m.grid.opacity = 0.12 + 0.55 * e.substrate;
    if (pillars.current) {
      for (let i = 0; i < PILLARS; i++) {
        const a = pillarAngle(i);
        const h = pillarRise(active, beat, t, i, PILLARS) * PILLAR_H;
        dummy.position.set(
          Math.cos(a) * PILLAR_R,
          GRID_Y,
          Math.sin(a) * PILLAR_R,
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        pillars.current.setMatrixAt(i, dummy.matrix);
        pillars.current.setColorAt(
          i,
          tmpColour
            .copy(colours.substrate)
            .multiplyScalar(0.7 + 1.6 * e.substrate),
        );
      }
      pillars.current.instanceMatrix.needsUpdate = true;
      if (pillars.current.instanceColor)
        pillars.current.instanceColor.needsUpdate = true;
    }
  });
  /* eslint-enable react-hooks/immutability */

  // The screen chapter is drawn raw: no engraved twin, so the lines root is empty.
  if (mode !== "solid") return <group ref={mech} />;

  return (
    <group position={[0, -0.3, 0]} scale={NETWORK_SCALE}>
      <group ref={tilt}>
        <group ref={mech}>
          <instancedMesh
            ref={orchs}
            args={[g.orch, m.orch, ORCHESTRATORS]}
            frustumCulled={false}
          />
          <lineSegments geometry={g.mesh} material={m.mesh} />
          <instancedMesh
            ref={workers}
            args={[g.worker, m.worker, N]}
            frustumCulled={false}
          />
          <lineSegments geometry={g.edges} material={m.edge} />
          <points
            ref={packets}
            geometry={g.packets}
            material={m.packet}
            frustumCulled={false}
          />
          <lineSegments geometry={g.grid} material={m.grid} />
          <instancedMesh
            ref={pillars}
            args={[g.pillar, m.pillar, PILLARS]}
            frustumCulled={false}
          />
          <Callouts
            beats={eisenBeats}
            anchors={ANCHORS}
            sectionIndex={EISEN_PLATE}
            palette={EISEN_PALETTE}
          />
        </group>
      </group>
    </group>
  );
}
