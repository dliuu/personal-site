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
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  Object3D,
  Points,
  PointsMaterial,
  TorusGeometry,
  Vector3,
} from "three";
import { frameLerp } from "@/lib/drawIn";
import {
  edgeDraw,
  gatePulse,
  hash01,
  layerEmphasis,
  layoutNodes,
  nodeLife,
  packetU,
  pillarRise,
  type Emphasis,
} from "@/lib/network";
import { lerp } from "@/lib/progress";
import { useLabStore } from "@/store/useLabStore";
import { Callouts } from "./Callouts";
import { chapters, eisenBeats, sections } from "./chapters";
import { EdgedModeContext } from "./Instruments";
import { plateState } from "./plateState";

/**
 * SKELETON of the Eisen hero: the software factory as a live orchestration
 * network on the screen inside the intro's monitor. A core spins up container
 * agents on three tier rings (developer tasks, test runs, client features),
 * packets travel the edges, a compliance ring stamps them, and the whole thing
 * stands on a backend substrate. Each plate beat lifts one layer and the
 * camera turns to its anchor. Drawn raw (the chapter is a screen); solid mode
 * only, there is no engraved twin.
 */

const NODES = layoutNodes();
const N = NODES.length;
/** dev, test, feature */
const TIER_COLOURS = ["#7fb0ff", "#7fe0c8", "#ffc46b"];
const CORE = "#dff0ff";
const STAMP = "#8ef0a0";
const SUBSTRATE = "#6f8fc9";
const GATES = 12;
const RING_R = 1.22;
const RING_Y = -0.02;
const PILLARS = 12;
const PILLAR_R = 0.72;
const GRID_Y = -0.95;
const PILLAR_H = 0.94;
const GRID_HALF = 1.6;
const GRID_N = 12;
const PACKETS = 90;
/** Per tier: inner edges are short, so their packets cycle faster. */
const PACKET_SPEED = [0.55, 0.42, 0.34];
const EMPH_LERP = 0.08;
/** The pause the whole factory sits at under reduced motion: mid-lifecycle. */
const STILL_TIME = 4.5;

const EISEN_PLATE = sections.findIndex(
  (s) => s.kind === "plate" && chapters[s.chapter].instrument === "network",
);
const EISEN_PALETTE = chapters.find((c) => c.instrument === "network")!.palette;

const gateAngle = (i: number) => (i / GATES) * Math.PI * 2;
const pillarAngle = (i: number) => (i / PILLARS) * Math.PI * 2;
/**
 * Callout anchors, one per beat: the core, a compliance gate, a pillar top.
 * A local point at xz-angle α faces the camera when the beat's longitude is
 * −α (see faceYaw), so the gate sits at −30° for lon 30 and the pillar at
 * 210° for lon 150.
 */
const GATE_ANCHOR = 11;
const PILLAR_ANCHOR = 7;
const ANCHORS: (Vector3 | null)[] = [
  new Vector3(0, 0.05, 0),
  new Vector3(
    Math.cos(gateAngle(GATE_ANCHOR)) * RING_R,
    RING_Y,
    Math.sin(gateAngle(GATE_ANCHOR)) * RING_R,
  ),
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
      core: new IcosahedronGeometry(0.17, 2),
      shell: new IcosahedronGeometry(0.27, 1),
      node: new BoxGeometry(0.075, 0.075, 0.075),
      ring: new TorusGeometry(RING_R, 0.012, 8, 128),
      gate: new BoxGeometry(0.06, 0.16, 0.03),
      pillar,
      grid: gridGeometry(),
      edges: (() => {
        const geo = new BufferGeometry();
        const pos = new Float32Array(N * 6);
        const col = new Float32Array(N * 6);
        const c = new Color();
        NODES.forEach((n, i) => {
          c.set(TIER_COLOURS[n.tier]);
          for (let k = 0; k < 2; k++) {
            col[i * 6 + k * 3] = c.r;
            col[i * 6 + k * 3 + 1] = c.g;
            col[i * 6 + k * 3 + 2] = c.b;
          }
        });
        geo.setAttribute(
          "position",
          new Float32BufferAttribute(pos, 3).setUsage(DynamicDrawUsage),
        );
        geo.setAttribute("color", new Float32BufferAttribute(col, 3));
        return geo;
      })(),
      packets: (() => {
        const geo = new BufferGeometry();
        geo.setAttribute(
          "position",
          new Float32BufferAttribute(new Float32Array(PACKETS * 3), 3).setUsage(
            DynamicDrawUsage,
          ),
        );
        return geo;
      })(),
    };
  }, []);
  const m = useMemo(
    () => ({
      core: glow(CORE),
      shell: new LineBasicMaterial({
        color: CORE,
        transparent: true,
        opacity: 0.5,
      }),
      node: glow("#ffffff"),
      edge: new LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
      packet: new PointsMaterial({
        size: 0.05,
        map: dotSprite(),
        color: new Color("#ffffff").multiplyScalar(1.8),
        toneMapped: false,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
      ring: new MeshBasicMaterial({
        color: STAMP,
        toneMapped: false,
        transparent: true,
      }),
      gate: glow(STAMP),
      grid: new LineBasicMaterial({
        color: SUBSTRATE,
        transparent: true,
        opacity: 0.2,
      }),
      pillar: glow(SUBSTRATE),
    }),
    [],
  );
  const tierColours = useMemo(() => TIER_COLOURS.map((c) => new Color(c)), []);
  const stamp = useMemo(() => new Color(STAMP), []);
  const substrate = useMemo(() => new Color(SUBSTRATE), []);
  const coreColour = useMemo(() => new Color(CORE), []);
  const packetSeeds = useMemo(
    () =>
      Array.from({ length: PACKETS }, (_, i) => ({
        node: i % N,
        phase: hash01(500 + i),
        inbound: i % 3 === 0,
      })),
    [],
  );
  const dummy = useMemo(() => new Object3D(), []);
  const tmpColour = useMemo(() => new Color(), []);
  const nodes = useRef<InstancedMesh>(null);
  const gates = useRef<InstancedMesh>(null);
  const pillars = useRef<InstancedMesh>(null);
  const edges = useRef<LineSegments>(null);
  const packets = useRef<Points>(null);
  const shell = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const emph = useRef<Emphasis>({
    agents: 0.6,
    compliance: 0.3,
    substrate: 0.3,
  });

  /* eslint-disable react-hooks/immutability -- r3f pattern: mutate memoized materials, buffers and ref object3Ds in useFrame */
  useFrame(({ clock }, delta) => {
    const { reducedMotion } = useLabStore.getState();
    const active = plateState.instrument === "network";
    const { beat, t, expand } = plateState;
    const time = reducedMotion ? STILL_TIME : clock.elapsedTime;
    // In the band the factory leans toward the reader so its rings read as
    // discs; the plate levels it and lets the camera do the looking.
    if (tilt.current) tilt.current.rotation.x = 0.42 * (1 - expand);
    const target = layerEmphasis(active, beat);
    const e = emph.current;
    const k = reducedMotion ? 1 : frameLerp(EMPH_LERP, delta);
    e.agents = lerp(e.agents, target.agents, k);
    e.compliance = lerp(e.compliance, target.compliance, k);
    e.substrate = lerp(e.substrate, target.substrate, k);

    // The orchestrator: a breathing core inside a slowly counter-turning shell.
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
    m.core.color.copy(coreColour).multiplyScalar(1.4 + 1.2 * pulse * e.agents);
    if (shell.current) {
      shell.current.rotation.y = -time * 0.15;
      shell.current.rotation.x = time * 0.07;
    }

    // Agents: each container spins up, runs and retires on its own cycle; in
    // beat 0 the wave out from the core gates them so the factory fills in order.
    const edgePos = g.edges.getAttribute("position") as Float32BufferAttribute;
    const life: number[] = [];
    if (nodes.current) {
      for (let i = 0; i < N; i++) {
        const n = NODES[i];
        const draw = edgeDraw(active, beat, t, n.rank, N);
        const s = nodeLife(time, n.phase) * draw;
        life[i] = s;
        const bob = 0.03 * Math.sin(time * 0.8 + n.phase * 6.28);
        dummy.position.set(n.x, n.y + bob, n.z);
        dummy.rotation.set(time * 0.3 + n.phase, time * 0.2, 0);
        dummy.scale.setScalar(Math.max(1e-4, s * (0.7 + 0.3 * e.agents)));
        dummy.updateMatrix();
        nodes.current.setMatrixAt(i, dummy.matrix);
        nodes.current.setColorAt(
          i,
          tmpColour
            .copy(tierColours[n.tier])
            .multiplyScalar(1.0 + 1.8 * e.agents),
        );
        // The edge ends at the node once it exists; it draws in with the wave.
        edgePos.setXYZ(i * 2, 0, 0, 0);
        edgePos.setXYZ(i * 2 + 1, n.x * draw, (n.y + bob) * draw, n.z * draw);
      }
      nodes.current.instanceMatrix.needsUpdate = true;
      if (nodes.current.instanceColor)
        nodes.current.instanceColor.needsUpdate = true;
      edgePos.needsUpdate = true;
    }
    m.edge.opacity = 0.18 + 0.4 * e.agents;

    // Packets: work leaving the core and results coming back, along live edges.
    if (packets.current) {
      const pos = g.packets.getAttribute("position") as Float32BufferAttribute;
      for (let i = 0; i < PACKETS; i++) {
        const p = packetSeeds[i];
        const n = NODES[p.node];
        const alive = (life[p.node] ?? 0) > 0.25;
        let u = packetU(time, p.phase, PACKET_SPEED[n.tier]);
        if (p.inbound) u = 1 - u;
        const s = alive ? u : 0;
        pos.setXYZ(i, n.x * s, n.y * s, n.z * s);
      }
      pos.needsUpdate = true;
      m.packet.opacity = 0.5 + 0.5 * e.agents;
    }

    // Compliance: a ring the traffic must cross; its gates stamp in turn.
    m.ring.color.copy(stamp).multiplyScalar(0.5 + 1.4 * e.compliance);
    m.ring.opacity = 0.3 + 0.7 * e.compliance;
    if (gates.current) {
      for (let i = 0; i < GATES; i++) {
        const a = gateAngle(i);
        const flash = gatePulse(time, i, GATES) * e.compliance;
        dummy.position.set(Math.cos(a) * RING_R, RING_Y, Math.sin(a) * RING_R);
        dummy.rotation.set(0, -a, 0);
        dummy.scale.set(1, 1 + 1.2 * flash, 1);
        dummy.updateMatrix();
        gates.current.setMatrixAt(i, dummy.matrix);
        gates.current.setColorAt(
          i,
          tmpColour.setScalar(0.5 + 0.8 * e.compliance + 2.4 * flash),
        );
      }
      gates.current.instanceMatrix.needsUpdate = true;
      if (gates.current.instanceColor)
        gates.current.instanceColor.needsUpdate = true;
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
          tmpColour.copy(substrate).multiplyScalar(0.7 + 1.6 * e.substrate),
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
    <group position={[0, -0.3, 0]}>
      <group ref={tilt}>
        <group ref={mech}>
          <mesh geometry={g.core} material={m.core} />
          <group ref={shell}>
            <lineSegments material={m.shell}>
              <edgesGeometry args={[g.shell, 1]} />
            </lineSegments>
          </group>
          <instancedMesh
            ref={nodes}
            args={[g.node, m.node, N]}
            frustumCulled={false}
          />
          <lineSegments ref={edges} geometry={g.edges} material={m.edge} />
          <points
            ref={packets}
            geometry={g.packets}
            material={m.packet}
            frustumCulled={false}
          />
          <mesh
            geometry={g.ring}
            material={m.ring}
            position={[0, RING_Y, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <instancedMesh
            ref={gates}
            args={[g.gate, m.gate, GATES]}
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
