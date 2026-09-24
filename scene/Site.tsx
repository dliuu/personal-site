"use client";

import type { RefObject } from "react";
import { useContext, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  MeshStandardMaterial,
  PlaneGeometry,
} from "three";

import { hatchRect, RECTS, type Rect } from "@/lib/sheet";
import { BAYS, FLOORS, TENANTS, stage, tenantAt } from "@/lib/site";

import { chapters } from "./chapters";
import { Edged, EdgedModeContext } from "./Instruments";
import { plateState } from "./plateState";
import { makeSheetTexture } from "./sheetAtlas";

/** Lot and building, in world units at scale 1. */
const SHEET = { w: 2.6, d: 2.0 };
const FOOT = { w: 1.2, d: 0.9 };
const FLOOR_H = 0.34;
const STAKES = 8;
const FACES = 4;
const WALL_H = FLOOR_H * FLOORS;
/** Four faces, six floors: the slots the twelve institutions cycle over. */
const SLOTS = FACES * FLOORS;
/** Cladding stands just off the folded wall so the two never z-fight. */
const CLAD_OFF = 0.012;
const BEAM_T = 0.024;
/** The slab edge oversails the frame, as a floor plate does. */
const BEAM_OVER = 0.06;

const WCP_PALETTE = chapters.find((c) => c.instrument === "site")!.palette;

/** The yaw that turns a part's +z outward on face `f`. */
const faceYaw = (f: number) => f * (Math.PI / 2);
/** How far out face `f` sits: the faces alternate around the lot. */
const faceOut = (f: number) => (f % 2 === 0 ? FOOT.d : FOOT.w) / 2;
/** Whether face `f` is one of the long pair. */
const faceLong = (f: number) => f % 2 === 0;

/** Cladding runs face by face, six floors at a time. */
const panelYaw = (i: number) => faceYaw(Math.floor(i / FLOORS));
const panelPos = (i: number): [number, number, number] => {
  const a = panelYaw(i);
  const out = faceOut(Math.floor(i / FLOORS)) + CLAD_OFF;
  return [Math.sin(a) * out, ((i % FLOORS) + 0.5) * FLOOR_H, Math.cos(a) * out];
};

/** The two dimension runs sit beside the elevation, clear of the walls. */
const DIM1_X = -(FOOT.w / 2) - 0.18;
const DIM2_X = -(FOOT.w / 2) - 0.34;
/** The second run's target span: 56% of the first, the bullet made literal. */
const DIM_FULL = WALL_H;
const DIM_CLOSE = WALL_H * 0.56;

/** Bay `i`'s centre, marching in +X off the footprint at FOOT.w spacing. */
const bayX = (i: number) => FOOT.w * (i + 1);

/**
 * ~24 fixed samples of the traffic curve that drove the fleet's scaling —
 * hand-set, not `Math.random()`, so the drawing never changes between visits.
 */
const TRAFFIC = [
  0.32, 0.3, 0.35, 0.42, 0.55, 0.62, 0.58, 0.47, 0.4, 0.44, 0.53, 0.66, 0.74,
  0.7, 0.6, 0.52, 0.48, 0.57, 0.69, 0.8, 0.86, 0.78, 0.68, 0.6,
];
/** The curve rides just off the bay line, at the base of the frame. */
const trafficPoint = (i: number): [number, number, number] => [
  (i / (TRAFFIC.length - 1)) * bayX(BAYS - 1),
  0.02 + TRAFFIC[i] * 0.14,
  0.12,
];

/** A line-segment BufferGeometry for the drafting marks Edged draws as ink. */
function segments(pts: number[]): BufferGeometry {
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pts, 3));
  return geo;
}

export function Site({ mech }: { mech: RefObject<Group | null> }) {
  const { mode } = useContext(EdgedModeContext);
  const solid = mode === "solid";
  const g = useMemo(
    () => ({
      sheet: new PlaneGeometry(SHEET.w, SHEET.d),
      stake: new CylinderGeometry(0.012, 0.012, 0.16, 6),
      column: new BoxGeometry(0.05, WALL_H, 0.05),
      wallLong: new PlaneGeometry(FOOT.w, WALL_H),
      wallShort: new PlaneGeometry(FOOT.d, WALL_H),
      padLong: new PlaneGeometry(FOOT.w, FLOOR_H),
      padShort: new PlaneGeometry(FOOT.d, FLOOR_H),
      beam: new BoxGeometry(FOOT.w + BEAM_OVER, BEAM_T, FOOT.d + BEAM_OVER),
      // Dimension drafting marks: a unit line scaled per run, an end tick, and
      // an arrowhead (apex at the origin, pointing +Y; rotate π for the other end).
      dimLine: segments([0, 0, 0, 0, 1, 0]),
      dimTick: segments([-0.04, 0, 0, 0.04, 0, 0]),
      dimArrow: segments([
        0, 0, 0, -0.018, -0.045, 0, 0, 0, 0, 0.018, -0.045, 0,
      ]),
      dimPlate: new PlaneGeometry(0.32, 0.16),
      traffic: segments(
        Array.from({ length: TRAFFIC.length - 1 }, (_, i) => i).flatMap((i) => [
          ...trafficPoint(i),
          ...trafficPoint(i + 1),
        ]),
      ),
      vault: new BoxGeometry(0.5, 0.22, 0.4),
      drawLine: new CylinderGeometry(0.008, 0.008, WALL_H, 6),
      topOut: new BoxGeometry(FOOT.w, 0.04, 0.05),
    }),
    [],
  );
  /**
   * Twelve institutions, twelve windows onto one sheet: each material samples
   * its own hatch cell, and all of them keep the chapter ink, because the
   * drawing tells them apart by ruling and never by colour. The "56%" numeral
   * is one more window onto the same sheet, so it shares this one texture
   * upload rather than painting a second canvas. Only the solid twin is
   * mapped; the engraved twin draws the same parts as line work.
   */
  const sheetMats = useMemo(() => {
    if (!solid) return null;
    const sheet = makeSheetTexture(WCP_PALETTE.ink, WCP_PALETTE.accent);
    // lib/sheet's rects are the painter's, measured down from the top of the
    // canvas; a CanvasTexture samples up from the bottom, so without this the
    // hatch offsets would land on the floor labels. The clones inherit it, and
    // one flip for all of them keeps the upload shared.
    sheet.flipY = false;
    const matFor = (r: Rect) => {
      const tex = sheet.clone();
      tex.offset.set(r.x, r.y);
      tex.repeat.set(r.w, r.h);
      return new MeshStandardMaterial({
        color: WCP_PALETTE.ink,
        map: tex,
        // The sheet is painted on bare canvas, so the paper between the rules
        // is the texture's own transparency.
        transparent: true,
        roughness: 0.7,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
    };
    return {
      hatch: Array.from({ length: TENANTS }, (_, i) => matFor(hatchRect(i))),
      dim: matFor(RECTS.dim),
    };
  }, [solid]);
  const hatch = sheetMats?.hatch ?? null;
  const dimMat = sheetMats?.dim ?? null;
  const walls = useRef<Group>(null);
  const frame = useRef<Group>(null);
  const beams = useRef<Group>(null);
  const cladding = useRef<Group>(null);
  const dim2Line = useRef<Group>(null);
  const dim2Cap = useRef<Group>(null);
  const bayGroup = useRef<Group>(null);
  const capital = useRef<Group>(null);
  const drawMat = useMemo(
    () =>
      solid
        ? new MeshStandardMaterial({
            color: WCP_PALETTE.accent,
            emissive: WCP_PALETTE.accent,
            emissiveIntensity: 0,
            roughness: 0.5,
            metalness: 0.3,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
          })
        : null,
    [solid],
  );

  /* eslint-disable react-hooks/immutability -- r3f pattern: mutate the memoized gold material and the mech ref in useFrame */
  useFrame(() => {
    const active = plateState.instrument === "site";
    const beat = active ? plateState.beat : -1;
    const s = stage(active ? plateState.beat : 0, active ? plateState.t : 0);
    if (walls.current)
      walls.current.children.forEach((w, i) => {
        w.rotation.x = -(s.hinge[i % s.hinge.length] ?? 0);
      });
    if (frame.current) frame.current.visible = s.floors > 0;
    // Counted, not faded: the frame inks a floor at a time and the cladding
    // arrives face by face, so beat ii is built rather than dissolved in.
    if (beams.current)
      beams.current.children.forEach((b, i) => {
        b.visible = i < s.floors;
      });
    const clad = Math.round(s.clad * SLOTS);
    if (cladding.current)
      cladding.current.children.forEach((p, i) => {
        p.visible = i < clad;
      });
    // The second dimension run closes onto 56% of the first as s.dim runs
    // 0 → 1; the cap (tick + arrow) and the line it caps move together.
    const h2 = DIM_FULL + (DIM_CLOSE - DIM_FULL) * s.dim;
    if (dim2Line.current) {
      dim2Line.current.scale.y = h2;
      dim2Line.current.position.y = h2 / 2;
    }
    if (dim2Cap.current) dim2Cap.current.position.y = h2;
    if (bayGroup.current)
      bayGroup.current.children.forEach((b, i) => {
        b.visible = i < s.bays;
      });
    // The vault and its draws are beat iv's own instrument, not a standing
    // fixture, so they arrive with that beat rather than sitting idle before it.
    if (capital.current) capital.current.visible = beat === 3;
    if (drawMat) drawMat.emissiveIntensity = 0.3 + s.draw;
    if (mech.current) mech.current.position.y = s.beam;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group position={[0, -1.0, 0]}>
      {/* The sheet the whole chapter is drawn on. */}
      <Edged geometry={g.sheet} rotation={[-Math.PI / 2, 0, 0]} />
      {/* Eight survey stakes: the team that set the lot out. */}
      {Array.from({ length: STAKES }, (_, i) => {
        const a = (i / STAKES) * Math.PI * 2;
        return (
          <Edged
            key={i}
            geometry={g.stake}
            position={[Math.cos(a) * FOOT.w, 0.08, Math.sin(a) * FOOT.d]}
          />
        );
      })}
      <group ref={walls}>
        {Array.from({ length: FACES }, (_, f) => {
          const a = faceYaw(f);
          const out = faceOut(f);
          return (
            <group
              key={f}
              // The hinge turns about the lot line, so the yaw has to apply
              // after the tilt: in the default XYZ order the frame's
              // rotation.x would swing every wall about world X and the short
              // pair would never leave the sheet.
              rotation-order="YXZ"
              rotation-y={a}
              position={[Math.sin(a) * out, 0, Math.cos(a) * out]}
            >
              {/* Flat on the sheet it lies outward along the group's +z, so
                  rotation.x stands it up off the lot line. */}
              <Edged
                geometry={faceLong(f) ? g.wallLong : g.wallShort}
                position={[0, 0, WALL_H / 2]}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </group>
          );
        })}
      </group>
      <group ref={frame}>
        {[-1, 1].map((sx) =>
          [-1, 0, 1].map((sz) => (
            <Edged
              key={`${sx}:${sz}`}
              geometry={g.column}
              position={[(sx * FOOT.w) / 2, WALL_H / 2, (sz * FOOT.d) / 2]}
            />
          )),
        )}
        <group ref={beams}>
          {Array.from({ length: FLOORS }, (_, k) => (
            <Edged
              key={k}
              geometry={g.beam}
              position={[0, (k + 1) * FLOOR_H, 0]}
            />
          ))}
        </group>
      </group>
      {/* Twenty-four panels, one Edged part each: an InstancedMesh would never
          read the mode context, so it would draw solid in the engraved twin
          too and cost this chapter its line work. */}
      <group ref={cladding}>
        {Array.from({ length: SLOTS }, (_, i) => (
          <Edged
            key={i}
            geometry={faceLong(Math.floor(i / FLOORS)) ? g.padLong : g.padShort}
            position={panelPos(i)}
            rotation={[0, panelYaw(i), 0]}
            material={hatch?.[tenantAt(i)]}
          />
        ))}
      </group>
      {/* Dimension lines are drafting marks, not volumes: linesOnly, so they
          exist only in the engraved twin, the way a technical drawing's
          annotations always have been ink and never a solid. */}
      <group position={[DIM1_X, 0, 0]}>
        <group position={[0, WALL_H / 2, 0]} scale={[1, WALL_H, 1]}>
          <Edged linesOnly geometry={g.dimLine} edges={g.dimLine} />
        </group>
        <Edged linesOnly geometry={g.dimTick} edges={g.dimTick} />
        <Edged
          linesOnly
          geometry={g.dimTick}
          edges={g.dimTick}
          position={[0, WALL_H, 0]}
        />
        <Edged
          linesOnly
          geometry={g.dimArrow}
          edges={g.dimArrow}
          position={[0, WALL_H, 0]}
        />
        <Edged
          linesOnly
          geometry={g.dimArrow}
          edges={g.dimArrow}
          rotation={[0, 0, Math.PI]}
        />
      </group>
      {/* The second run closes to 56% of the first as s.dim runs 0 → 1 — the
          bullet's own number, staged as a caliper reading itself. */}
      <group position={[DIM2_X, 0, 0]}>
        <group ref={dim2Line}>
          <Edged linesOnly geometry={g.dimLine} edges={g.dimLine} />
        </group>
        <Edged linesOnly geometry={g.dimTick} edges={g.dimTick} />
        <group ref={dim2Cap}>
          <Edged linesOnly geometry={g.dimTick} edges={g.dimTick} />
          <Edged linesOnly geometry={g.dimArrow} edges={g.dimArrow} />
        </group>
        <Edged
          linesOnly
          geometry={g.dimArrow}
          edges={g.dimArrow}
          rotation={[0, 0, Math.PI]}
        />
      </group>
      {/* The "56%" numeral is one more window onto the sheet texture. */}
      <Edged
        geometry={g.dimPlate}
        position={[DIM2_X - 0.24, DIM_CLOSE / 2, 0]}
        material={dimMat ?? undefined}
      />
      {/* Bays extend the frame in +X, the fleet the traffic curve scaled. */}
      <group ref={bayGroup}>
        {Array.from({ length: BAYS }, (_, i) => (
          <Edged
            key={i}
            geometry={g.column}
            position={[bayX(i), WALL_H / 2, 0]}
            color={WCP_PALETTE.ink}
          />
        ))}
      </group>
      <Edged linesOnly geometry={g.traffic} edges={g.traffic} />
      {/* The vault and its draws are the only new gold in the chapter besides
          the title block's revision line. */}
      <group ref={capital}>
        <Edged
          geometry={g.vault}
          position={[0, -0.45, 0]}
          color={WCP_PALETTE.accent}
        />
        {[-1, 1].map((sx) =>
          [-1, 0, 1].map((sz) => (
            <Edged
              key={`${sx}:${sz}`}
              geometry={g.drawLine}
              position={[(sx * FOOT.w) / 2, WALL_H / 2, (sz * FOOT.d) / 2]}
              material={drawMat ?? undefined}
            />
          )),
        )}
      </group>
      <group ref={mech}>
        <Edged
          geometry={g.topOut}
          position={[0, WALL_H, 0]}
          color={WCP_PALETTE.ink}
        />
      </group>
    </group>
  );
}
