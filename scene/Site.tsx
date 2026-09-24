"use client";

import type { RefObject } from "react";
import { useContext, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  MeshStandardMaterial,
  PlaneGeometry,
} from "three";

import { hatchRect } from "@/lib/sheet";
import { FLOORS, TENANTS, stage, tenantAt } from "@/lib/site";

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
    }),
    [],
  );
  /**
   * Twelve institutions, twelve windows onto one sheet: each material samples
   * its own hatch cell, and all of them keep the chapter ink, because the
   * drawing tells them apart by ruling and never by colour. Only the solid
   * twin is mapped; the engraved twin draws the same parts as line work.
   */
  const hatch = useMemo(() => {
    if (!solid) return null;
    const sheet = makeSheetTexture(WCP_PALETTE.ink, WCP_PALETTE.accent);
    // lib/sheet's rects are the painter's, measured down from the top of the
    // canvas; a CanvasTexture samples up from the bottom, so without this the
    // hatch offsets would land on the floor labels. The clones inherit it, and
    // one flip for all of them keeps the upload shared.
    sheet.flipY = false;
    return Array.from({ length: TENANTS }, (_, i) => {
      const r = hatchRect(i);
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
    });
  }, [solid]);
  const walls = useRef<Group>(null);
  const frame = useRef<Group>(null);
  const beams = useRef<Group>(null);
  const cladding = useRef<Group>(null);

  useFrame(() => {
    const active = plateState.instrument === "site";
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
  });

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
      <group ref={mech} />
    </group>
  );
}
