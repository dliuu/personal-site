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
  PlaneGeometry,
  Points,
  PointsMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { frameLerp } from "@/lib/drawIn";
import {
  cycleAt,
  edgeDraw,
  hash01,
  iterateFlash,
  layerEmphasis,
  layoutOrchestrators,
  layoutWorkers,
  ORCHESTRATORS,
  passes,
  PHASE,
  pillarRise,
  resultU,
  taskU,
  verdictGlow,
  workerScale,
  type Emphasis,
} from "@/lib/network";
import {
  printedLines,
  screenDim,
  screenScroll,
  statusStrip,
  taskTemplates,
  verdictCode,
  VIEW_LINES,
} from "@/lib/terminal";
import { lerp } from "@/lib/progress";
import { useLabStore } from "@/store/useLabStore";
import { Callouts } from "./Callouts";
import { chapters, eisenBeats, plateSlots, sections } from "./chapters";
import { EdgedModeContext } from "./Instruments";
import { plateState } from "./plateState";
import {
  screenAttributes,
  screenMaterial,
  setPage,
  setStatus,
  setTemplate,
  terminalAtlas,
} from "./terminalAtlas";
import { smooth } from "@/lib/beats";

/**
 * The Eisen hero: the software factory as an orchestrator-worker network on
 * the screen inside the intro's monitor. A group of orchestrator agents each
 * spin up their own worker containers; each container is a terminal card
 * whose screen streams the task's log, a task packet goes down the edge, a
 * deterministic verdict prints PASS or FAIL, the result packet comes back up,
 * and a failure flashes the orchestrator, which spins up the next container
 * in that slot. It all stands on a backend substrate. Each plate beat lifts
 * one layer and the camera turns to its anchor. Drawn raw (the chapter is a
 * screen); solid mode only.
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
/** A terminal card: a slab with a screen on its outward face, tilted up toward the camera. */
const CARD = { w: 0.15, h: 0.11, d: 0.026, tilt: -0.22 };
const SCREEN_W = 0.14;
const SCREEN_H = (SCREEN_W * 3) / 4;
/** One atlas strip (256×24) at a size that stays legible from the plate camera. */
const STATUS_W = 0.36;
const STATUS_H = (STATUS_W * 24) / 256;
const STATUS_LIFT = 0.19;
const EYE_R = 0.13;
const TURN_LERP = 0.1;

const EISEN_PLATE = sections.findIndex(
  (s) => s.kind === "plate" && chapters[s.chapter].instrument === "network",
);
const EISEN_PALETTE = chapters.find((c) => c.instrument === "network")!.palette;

const pillarAngle = (i: number) => (i / PILLARS) * Math.PI * 2;
/** Each worker's task, spread over the templates by seed. */
const TASK_OF = WORKERS.map((w) =>
  Math.floor(hash01(w.seed + 9) * taskTemplates.length),
);
/** Yaw that points a card's +z (its screen) radially outward. */
const FACE_OUT = WORKERS.map((w) => Math.PI / 2 - Math.atan2(w.z, w.x));
/**
 * Callout anchors, one per beat: orchestrator 0, one of orchestrator 3's
 * workers, a pillar top. A local point at xz-angle α faces the camera when
 * the beat's longitude is −α (see faceYaw): orchestrator 0 sits at 90° for
 * lon −90, orchestrator 3's last slot near −30° for lon 30, pillar 7 at
 * 210° for lon 150.
 */
const WORKER_ANCHOR = WORKERS.find((w) => w.orch === 3 && w.slot === 6)!;
/**
 * The dive target: beat iii faces lon 150, so this worker near 210°
 * (orchestrator 2, slot 0) faces the camera when the plate's last slot
 * begins. Its screen shows the page and the card grows as the camera comes.
 */
const DIVE_I = WORKERS.findIndex((w) => w.orch === 2 && w.slot === 0);
const DIVE_GROW = 2.5;
const EISEN_CHAPTER = chapters.find((c) => c.instrument === "network")!;
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

/** Shortest-arc step from angle a toward b. */
function turnToward(a: number, b: number, k: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * k;
}

export function Network({ mech }: { mech: RefObject<Group | null> }) {
  const { mode } = useContext(EdgedModeContext);
  const solid = mode === "solid";
  const g = useMemo(() => {
    const pillar = new CylinderGeometry(0.028, 0.028, 1, 8);
    pillar.translate(0, 0.5, 0);
    // The screen sits just proud of the slab's outward face; both share a matrix.
    const screen = new PlaneGeometry(SCREEN_W, SCREEN_H);
    screen.translate(0, 0, CARD.d / 2 + 0.002);
    const sa = screenAttributes(N);
    screen.setAttribute("aOrigin", sa.origin);
    screen.setAttribute("aState", sa.state);
    WORKERS.forEach((_, i) => setTemplate(sa.origin, i, TASK_OF[i]));
    const status = new PlaneGeometry(STATUS_W, STATUS_H);
    const st = screenAttributes(ORCHESTRATORS);
    status.setAttribute("aOrigin", st.origin);
    status.setAttribute("aState", st.state);
    for (let i = 0; i < ORCHESTRATORS; i++) st.state.setXYZ(i, 0, 1, 0);
    return {
      orch: new OctahedronGeometry(0.11, 0),
      eye: new SphereGeometry(0.02, 8, 6),
      card: new BoxGeometry(CARD.w, CARD.h, CARD.d),
      screen,
      screenState: sa.state,
      screenOrigin: sa.origin,
      status,
      statusOrigin: st.origin,
      pillar,
      grid: gridGeometry(),
      mesh: meshGeometry(),
      // One segment per worker, orchestrator → worker.
      edges: dynamicGeometry(N * 2),
      // A task packet and a result packet per worker.
      packets: dynamicGeometry(N * 2, true),
    };
  }, []);
  // The atlas is one canvas and one GPU texture; only the solid twin needs it.
  const atlas = useMemo(() => (solid ? terminalAtlas() : null), [solid]);
  const m = useMemo(
    () => ({
      orch: glow(ORCH_COLOUR),
      eye: glow("#ffffff"),
      mesh: new LineBasicMaterial({
        color: MESH_COLOUR,
        transparent: true,
        opacity: 0.5,
      }),
      card: glow("#ffffff"),
      screen: atlas ? screenMaterial(atlas, VIEW_LINES) : null,
      status: atlas ? screenMaterial(atlas, 1, true) : null,
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
    [atlas],
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
  const dummy = useMemo(() => {
    const d = new Object3D();
    // Yaw first, then the tilt about the card's own x, so screens lean back
    // toward an elevated camera whichever way they face.
    d.rotation.order = "YXZ";
    return d;
  }, []);
  const tmpColour = useMemo(() => new Color(), []);
  const tmpVec = useMemo(() => new Vector3(), []);
  const tmpVec2 = useMemo(() => new Vector3(), []);
  const orchs = useRef<InstancedMesh>(null);
  const eyes = useRef<InstancedMesh>(null);
  const statuses = useRef<InstancedMesh>(null);
  const cards = useRef<InstancedMesh>(null);
  const screens = useRef<InstancedMesh>(null);
  const pillars = useRef<InstancedMesh>(null);
  const packets = useRef<Points>(null);
  const tilt = useRef<Group>(null);
  const emph = useRef<Emphasis>({
    orchestrators: 0.6,
    verdicts: 0.4,
    substrate: 0.3,
  });
  const flash = useRef<number[]>(ORCHS.map(() => 0));
  const running = useRef<number[]>(ORCHS.map(() => 0));
  /** Per orchestrator: the worker it last dispatched to, and its current yaw. */
  const dispatch = useRef<number[]>(ORCHS.map(() => -1));
  const dispatchF = useRef<number[]>(ORCHS.map(() => 2));
  const yaw = useRef<number[]>(ORCHS.map((o) => o.angle));

  /* eslint-disable react-hooks/immutability -- r3f pattern: mutate memoized materials, buffers and ref object3Ds in useFrame */
  useFrame(({ clock, camera }, delta) => {
    const { reducedMotion } = useLabStore.getState();
    const active = plateState.instrument === "network";
    const { beat, t, expand } = plateState;
    // The plate's last slot, past its beats, is the dive.
    const diving = active && beat >= eisenBeats.length;
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
    for (let i = 0; i < ORCHESTRATORS; i++) {
      flash.current[i] = 0;
      running.current[i] = 0;
      dispatchF.current[i] = 2;
    }

    // Workers: each container lives its own cycle in its orchestrator's slot.
    // In beat 0 the wave out from the orchestrators gates them, so the floor
    // fills in sector by sector.
    const edgePos = g.edges.getAttribute("position") as Float32BufferAttribute;
    const pktPos = g.packets.getAttribute("position") as Float32BufferAttribute;
    const pktCol = g.packets.getAttribute("color") as Float32BufferAttribute;
    if (cards.current && screens.current) {
      for (let i = 0; i < N; i++) {
        const w = WORKERS[i];
        const o = ORCHS[w.orch];
        const draw = edgeDraw(active, beat, t, w.rank, N);
        const { generation, f } = cycleAt(time, w.phase);
        const ok = passes(w.seed, generation);
        // The dive target holds through the plate's last slot: it never
        // tears down, its screen is the page, and it grows to meet the camera.
        const isDive = diving && i === DIVE_I;
        const s = isDive
          ? draw * lerp(1, DIVE_GROW, smooth(0, 0.6, t))
          : workerScale(f) * draw;
        const glowV = isDive ? 0 : verdictGlow(f);
        dummy.position.set(w.x, w.y, w.z);
        dummy.rotation.set(CARD.tilt, FACE_OUT[i], 0);
        dummy.scale.setScalar(Math.max(1e-4, s));
        dummy.updateMatrix();
        cards.current.setMatrixAt(i, dummy.matrix);
        screens.current.setMatrixAt(i, dummy.matrix);
        if (i === DIVE_I) {
          if (isDive) setPage(g.screenOrigin, i);
          else setTemplate(g.screenOrigin, i, TASK_OF[i]);
          // Publish the screen for the camera: its centre, outward normal
          // and half extents in world units (one frame behind the mech).
          const { pos, normal } = plateState.dive;
          tmpVec2.set(0, 0, CARD.d / 2 + 0.002).applyMatrix4(dummy.matrix);
          screens.current.localToWorld(pos.copy(tmpVec2));
          normal
            .set(0, 0, 1)
            .applyQuaternion(dummy.quaternion)
            .transformDirection(screens.current.matrixWorld);
          const ws = screens.current.getWorldScale(tmpVec2).x * s;
          plateState.dive.halfHeight = (SCREEN_H / 2) * ws;
          plateState.dive.halfWidth = (SCREEN_W / 2) * ws;
        }
        // The slab: a cool white while it runs; green or red at the verdict,
        // brighter in beat 1 where the criteria are the story.
        tmpColour
          .copy(colours.run)
          .multiplyScalar(0.7 + 0.5 * e.orchestrators)
          .lerp(
            ok ? colours.pass : colours.fail,
            glowV * (0.6 + 0.4 * e.verdicts),
          );
        if (glowV > 0) tmpColour.multiplyScalar(1 + 1.6 * glowV * e.verdicts);
        cards.current.setColorAt(i, tmpColour);
        // The screen: the log streams in, the verdict row prints, then it
        // goes dark through teardown.
        const printed = isDive ? 99 : printedLines(f);
        g.screenState.setXYZ(
          i,
          isDive ? 0 : screenScroll(printed),
          printed,
          isDive ? 0 : verdictCode(f, ok),
        );
        // The page is drawn at exactly its paper colour, so the cut behind
        // the filled screen lands on the same paper.
        screens.current.setColorAt(
          i,
          tmpColour.setScalar(
            isDive ? 1 : screenDim(f) * (1.1 + 0.5 * e.orchestrators),
          ),
        );
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
        // What the orchestrator knows: how many of its containers run, which
        // one it dispatched to most recently, and a failed result landing.
        if (f >= PHASE.up && f < PHASE.verdict) running.current[w.orch]++;
        if (f >= PHASE.up && f < dispatchF.current[w.orch]) {
          dispatchF.current[w.orch] = f;
          dispatch.current[w.orch] = i;
        }
        flash.current[w.orch] = Math.max(
          flash.current[w.orch],
          iterateFlash(f, !ok) * draw,
        );
      }
      cards.current.instanceMatrix.needsUpdate = true;
      screens.current.instanceMatrix.needsUpdate = true;
      if (cards.current.instanceColor)
        cards.current.instanceColor.needsUpdate = true;
      if (screens.current.instanceColor)
        screens.current.instanceColor.needsUpdate = true;
      g.screenState.needsUpdate = true;
      g.screenOrigin.needsUpdate = true;
      edgePos.needsUpdate = true;
      pktPos.needsUpdate = true;
      pktCol.needsUpdate = true;
    }
    m.edge.opacity = 0.15 + 0.4 * e.orchestrators;
    m.mesh.opacity = 0.25 + 0.5 * e.orchestrators;

    // Orchestrators: bright, breathing out of step, turning to face the
    // worker they last dispatched to (an eye marks the facing), flashing red
    // when they have to iterate; a status strip above each faces the camera.
    if (orchs.current && eyes.current && statuses.current && mech.current) {
      const camLocal = mech.current.worldToLocal(tmpVec.copy(camera.position));
      for (let i = 0; i < ORCHESTRATORS; i++) {
        const o = ORCHS[i];
        const breathe = 0.5 + 0.5 * Math.sin(time * 1.6 + i * 1.3);
        const fl = flash.current[i];
        const d = dispatch.current[i];
        if (d >= 0) {
          const w = WORKERS[d];
          const goal = Math.atan2(w.x - o.x, w.z - o.z);
          yaw.current[i] = reducedMotion
            ? goal
            : turnToward(yaw.current[i], goal, frameLerp(TURN_LERP, delta));
        }
        dummy.position.set(o.x, o.y, o.z);
        dummy.rotation.set(0, yaw.current[i], 0);
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
        dummy.position.set(
          o.x + Math.sin(yaw.current[i]) * EYE_R,
          o.y,
          o.z + Math.cos(yaw.current[i]) * EYE_R,
        );
        dummy.scale.setScalar(1 + 0.6 * fl);
        dummy.updateMatrix();
        eyes.current.setMatrixAt(i, dummy.matrix);
        eyes.current.setColorAt(i, tmpColour.setScalar(1.6 + 1.2 * fl));
        // The status strip billboards toward the camera in the mech's frame.
        dummy.position.set(o.x, o.y + STATUS_LIFT, o.z);
        dummy.rotation.set(
          0,
          Math.atan2(camLocal.x - o.x, camLocal.z - o.z),
          0,
        );
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        statuses.current.setMatrixAt(i, dummy.matrix);
        setStatus(
          g.statusOrigin,
          i,
          statusStrip(running.current[i], fl > 0.05),
        );
        // Kept under the bloom threshold: small bright text blooms into a
        // speckled halo.
        statuses.current.setColorAt(
          i,
          tmpColour.setScalar(0.7 + 0.3 * e.orchestrators),
        );
      }
      orchs.current.instanceMatrix.needsUpdate = true;
      eyes.current.instanceMatrix.needsUpdate = true;
      statuses.current.instanceMatrix.needsUpdate = true;
      if (orchs.current.instanceColor)
        orchs.current.instanceColor.needsUpdate = true;
      if (eyes.current.instanceColor)
        eyes.current.instanceColor.needsUpdate = true;
      if (statuses.current.instanceColor)
        statuses.current.instanceColor.needsUpdate = true;
      g.statusOrigin.needsUpdate = true;
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
  if (!solid || !m.screen || !m.status) return <group ref={mech} />;

  return (
    <group position={[0, -0.3, 0]} scale={NETWORK_SCALE}>
      <group ref={tilt}>
        <group ref={mech}>
          <instancedMesh
            ref={orchs}
            args={[g.orch, m.orch, ORCHESTRATORS]}
            frustumCulled={false}
          />
          <instancedMesh
            ref={eyes}
            args={[g.eye, m.eye, ORCHESTRATORS]}
            frustumCulled={false}
          />
          <instancedMesh
            ref={statuses}
            args={[g.status, m.status, ORCHESTRATORS]}
            frustumCulled={false}
          />
          <lineSegments geometry={g.mesh} material={m.mesh} />
          <instancedMesh
            ref={cards}
            args={[g.card, m.card, N]}
            frustumCulled={false}
          />
          <instancedMesh
            ref={screens}
            args={[g.screen, m.screen, N]}
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
            slots={plateSlots(EISEN_CHAPTER)}
            palette={EISEN_PALETTE}
          />
        </group>
      </group>
    </group>
  );
}
