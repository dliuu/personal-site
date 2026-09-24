"use client";

import type { RefObject } from "react";
import { useContext, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
} from "three";

import { FLOOR_LABELS, hatchRect, RECTS, type Rect } from "@/lib/sheet";
import { BAYS, FLOORS, TENANTS, stage, tenantAt } from "@/lib/site";

import { chapters } from "./chapters";
import { Edged, EdgedModeContext } from "./Instruments";
import { BRONZE } from "./palette";
import { plateState } from "./plateState";
import { makeSheetTexture } from "./sheetAtlas";

/** Lot and building, in world units at scale 1. */
const SHEET = { w: 2.6, d: 2.0 };
/** Every drawing sheet carries a border inside its trim (spec 5.2). */
const BORDER = 0.08;
const FOOT = { w: 1.2, d: 0.9 };
const FLOOR_H = 0.34;
const STAKES = 8;
const FACES = 4;
const WALL_H = FLOOR_H * FLOORS;
/** Four faces, six floors: the slots the twelve institutions cycle over. */
const SLOTS = FACES * FLOORS;
/** Cladding stands just off the folded wall so the two never z-fight. */
const CLAD_OFF = 0.012;
/** And the draw runs just off the cladding, clear of the column it follows. */
const DRAW_OFF = 0.035;
/**
 * Whole repeats of the painted strip down one rod, so the rod carries this
 * many times lib/sheet's DRAW_DASHES and the phase is periodic: scrolling the
 * strip by one atlas height lands dash on dash, which is what makes the reset
 * at each pass boundary invisible rather than merely smooth.
 */
const DRAW_REPEATS = 2;
/** The vault sits under the slab; its lid is where the draws come to rest. */
const VAULT_Y = -0.45;
const VAULT_TOP = VAULT_Y + 0.11;
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

/**
 * Bay `i`'s centre, marching in +X off the footprint. The run has to finish
 * inside the sheet's own half-width (1.3): at the building's own 1.2 spacing
 * the last three bays stood off the page, where no zoom step could reach them.
 */
const BAY_0 = FOOT.w / 2 + 0.12;
const BAY_STEP = 0.14;
const bayX = (i: number) => BAY_0 + BAY_STEP * i;

/**
 * The sheet's lettering: one plane per painted rect, each the aspect of the
 * rect it samples so nothing is stretched. The floor labels sample only the
 * left third of their row, where the painter puts the words — a whole row is
 * 8:1, and at that aspect a plane tall enough to read would be wider than the
 * building it names.
 */
const TITLE_SIZE: [number, number] = [0.78, 0.39];
/** A drawing's title block lies on the page, in the corner beat i looks down at. */
const TITLE_POS: [number, number, number] = [0.87, 0.003, 0.76];
const NOTE_SIZE: [number, number] = [0.86, 0.43];
/**
 * The notes stand clear of beat iii's elevation on the camera's right, outboard
 * of both dimension runs — and, at 0.86 wide against the 0.36 of paper left
 * between the border and the second run, off the sheet entirely: they float
 * beside the page rather than in a margin of it. Flat on the page they would
 * be unreadable anyway, since beat iii looks along the sheet at 4°, where
 * anything lying on it is edge-on.
 */
const NOTE_POS: [number, number, number] = [-1.95, 1.02, 0];
/**
 * The numeral plate is the beat's headline number, so it is sized to be read
 * at the distance the whole elevation needs; it too sits outboard of both runs
 * and, at that size, beyond the sheet's own edge.
 */
const DIM_PLATE_SIZE: [number, number] = [0.64, 0.32];
const DIM_PLATE_X = DIM2_X - 0.41;
/** Beat iii's yaw is −180°, so its lettering faces local −Z, not +Z. */
const FACE_BACK: [number, number, number] = [0, Math.PI, 0];
/** The label window, in atlas UV: the left of the row, where the words are. */
const LABEL_W = 0.34;
const LABEL_SIZE: [number, number] = [0.66, 0.24];
const floorLabelRect = (i: number): Rect => {
  const b = RECTS.floors;
  const h = b.h / FLOOR_LABELS.length;
  return { x: b.x, y: b.y + i * h, w: LABEL_W, h };
};
/**
 * Beat ii faces lon 30, which turns the drawing to a yaw of −120°. Lettering
 * has to be aimed rather than made double-sided: a plane seen from behind
 * shows its text mirrored. At that yaw the local direction 240° is what lands
 * at the camera's right, and a plane yawed 120° is what faces it — so the four
 * labels stand off the frame on the clear side, one per floor, with the bays
 * marching away on the other.
 */
const LABEL_OUT = 1.15;
const LABEL_SIDE = (240 * Math.PI) / 180;
const LABEL_YAW = (120 * Math.PI) / 180;
const labelPos = (i: number): [number, number, number] => [
  Math.cos(LABEL_SIDE) * LABEL_OUT,
  (i + 1) * FLOOR_H,
  Math.sin(LABEL_SIDE) * LABEL_OUT,
];

/**
 * ~24 fixed samples of the traffic curve that drove the fleet's scaling —
 * hand-set, not `Math.random()`, so the drawing never changes between visits.
 */
const TRAFFIC = [
  0.32, 0.3, 0.35, 0.42, 0.55, 0.62, 0.58, 0.47, 0.4, 0.44, 0.53, 0.66, 0.74,
  0.7, 0.6, 0.52, 0.48, 0.57, 0.69, 0.8, 0.86, 0.78, 0.68, 0.6,
];
/** The curve rides along the bay run, at the base of the frame and no wider. */
const trafficPoint = (i: number): [number, number, number] => [
  bayX(0) + (i / (TRAFFIC.length - 1)) * (bayX(BAYS - 1) - bayX(0)),
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
      // The border rule, inset from the trim: ink, like every other rule on
      // the page, so it is drawn by the engraved twin the chapter never loses.
      border: segments(
        [
          [-1, -1, 1, -1],
          [1, -1, 1, 1],
          [1, 1, -1, 1],
          [-1, 1, -1, -1],
        ].flatMap(([ax, az, bx, bz]) => [
          ax * (SHEET.w / 2 - BORDER),
          0,
          az * (SHEET.d / 2 - BORDER),
          bx * (SHEET.w / 2 - BORDER),
          0,
          bz * (SHEET.d / 2 - BORDER),
        ]),
      ),
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
      dimPlate: new PlaneGeometry(...DIM_PLATE_SIZE),
      title: new PlaneGeometry(...TITLE_SIZE),
      note: new PlaneGeometry(...NOTE_SIZE),
      label: new PlaneGeometry(...LABEL_SIZE),
      traffic: segments(
        Array.from({ length: TRAFFIC.length - 1 }, (_, i) => i).flatMap((i) => [
          ...trafficPoint(i),
          ...trafficPoint(i + 1),
        ]),
      ),
      vault: new BoxGeometry(0.5, 0.22, 0.4),
      // The draw runs from the roof to the vault's own level, not to grade:
      // stopped at the slab it left a hand's gap of paper between the money
      // and what it paid for.
      drawLine: new CylinderGeometry(0.008, 0.008, WALL_H - VAULT_TOP, 6),
      topOut: new BoxGeometry(FOOT.w, 0.04, 0.05),
    }),
    [],
  );
  /**
   * One sheet, many windows: every hatch, the title block, the notes, the four
   * floor labels and the "56%" numeral are cells of the same painted canvas,
   * so the chapter's whole surface is one texture upload. All of them keep the
   * chapter ink — the drawing tells its faces apart by ruling and never by
   * colour. Only the solid twin is mapped; the engraved twin draws the same
   * parts as line work.
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
      // Unflipped, v = 0 is the top of the canvas, so the V axis is run
      // backwards here: without it every rect arrives upside down, which no
      // one could see while the only mapped cells were symmetrical hatches.
      tex.offset.set(r.x, r.y + r.h);
      tex.repeat.set(r.w, -r.h);
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
    // The draws sample the one region that tiles. U is windowed to the strip
    // as usual; V repeats, and because a wrap repeats the whole texture rather
    // than a sub-rect the strip runs the atlas's full height. The V axis still
    // runs backwards, so the dashes are the way up the painter drew them.
    const drawTex = sheet.clone();
    drawTex.wrapT = RepeatWrapping;
    drawTex.offset.set(RECTS.draw.x, RECTS.draw.y + RECTS.draw.h);
    drawTex.repeat.set(RECTS.draw.w, -DRAW_REPEATS);
    return {
      hatch: Array.from({ length: TENANTS }, (_, i) => matFor(hatchRect(i))),
      dim: matFor(RECTS.dim),
      // Gold, and the only gold besides the vault and the revision line. The
      // gaps between the dashes are cut rather than blended: alphaTest keeps
      // the rods in the opaque pass, where six of them cannot sort wrongly
      // against each other or the cladding they run down.
      draw: new MeshStandardMaterial({
        color: WCP_PALETTE.accent,
        map: drawTex,
        alphaTest: 0.5,
        emissive: WCP_PALETTE.accent,
        emissiveIntensity: 0.55,
        roughness: 0.5,
        metalness: 0.3,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
      title: matFor(RECTS.title),
      note: matFor(RECTS.note),
      labels: FLOOR_LABELS.map((_, i) => matFor(floorLabelRect(i))),
    };
  }, [solid]);
  const hatch = sheetMats?.hatch ?? null;
  const dimMat = sheetMats?.dim ?? null;
  /**
   * The four walls are planes, and a plane is one-sided: after the hinge their
   * normals all point out of the lot, so the far wall was culled and the side
   * pair went edge-on, leaving beat i's gesture to be carried by whichever
   * single wall happened to face the camera. Two-sided here and nowhere else —
   * these are four unshadowed procedural planes, not a baked model.
   */
  const wallMat = useMemo(
    () =>
      solid
        ? new MeshStandardMaterial({
            color: BRONZE,
            side: DoubleSide,
            roughness: 0.6,
            metalness: 0.15,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
          })
        : null,
    [solid],
  );
  const walls = useRef<Group>(null);
  const frame = useRef<Group>(null);
  const beams = useRef<Group>(null);
  const cladding = useRef<Group>(null);
  const dim1 = useRef<Group>(null);
  const dim2 = useRef<Group>(null);
  const traffic = useRef<Group>(null);
  const dim2Line = useRef<Group>(null);
  const dim2Cap = useRef<Group>(null);
  const bayGroup = useRef<Group>(null);
  const capital = useRef<Group>(null);
  const topOut = useRef<Group>(null);
  const title = useRef<Group>(null);
  const labels = useRef<Group>(null);
  const note = useRef<Group>(null);
  const dimPlate = useRef<Group>(null);
  const drawMat = sheetMats?.draw ?? null;

  /* eslint-disable react-hooks/immutability -- r3f pattern: mutate the memoized gold material and the part refs in useFrame */
  useFrame(() => {
    const active = plateState.instrument === "site";
    const beat = active ? plateState.beat : -1;
    const s = stage(active ? plateState.beat : 0, active ? plateState.t : 0);
    if (walls.current)
      walls.current.children.forEach((w, i) => {
        w.rotation.x = -s.hinge[i];
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
    if (dim2Line.current) dim2Line.current.scale.y = h2;
    if (dim2Cap.current) dim2Cap.current.position.y = h2;
    // Beat iii's furniture belongs to the plate. In the chapter band the
    // camera sits near level, where the page is almost edge-on: two
    // full-height dimension runs, a 2.04 bay column and the traffic curve
    // under it left a flat smear with a mast through it, and the runs measure
    // a building that is not standing yet.
    if (dim1.current) dim1.current.visible = active;
    if (dim2.current) dim2.current.visible = active;
    if (traffic.current) traffic.current.visible = active;
    if (bayGroup.current) {
      bayGroup.current.visible = active;
      bayGroup.current.children.forEach((b, i) => {
        b.visible = i < s.bays;
      });
    }
    // The vault and its draws are beat iv's own instrument, not a standing
    // fixture, so they arrive with that beat rather than sitting idle before it.
    if (capital.current) capital.current.visible = beat === 3;
    // Three passes of dashes down the rods over the beat: capital running
    // from the roof into the vault. The strip is scrolled, not dimmed, and a
    // pass is exactly one atlas height, a whole number of dashes — so the wrap
    // lands dash on dash and no reset is visible. Walking the offset backwards
    // is what sends them down, because this atlas's V runs backwards.
    if (drawMat?.map)
      drawMat.map.offset.y = RECTS.draw.y + RECTS.draw.h - s.draw;
    // The lettering inks with the beat it belongs to: the title block as the
    // plan lifts, a floor label as its floor is inked, the notes with beat iii
    // and the numeral once its dimension run has closed onto 56%. The title
    // block leaves at beat iv: its solid twin is culled from under the sheet,
    // but the line twin would keep drawing an empty ruled rectangle there.
    if (title.current) title.current.visible = s.hinge[0] > 0 && beat !== 3;
    // The labels are aimed at beat ii's camera, so they belong to beat ii:
    // held on, they stood across the elevation and (turned away) left four
    // empty rules behind them in the line twin.
    if (labels.current)
      labels.current.children.forEach((l, i) => {
        l.visible = beat === 1 && s.floors > i;
      });
    // Aimed lettering is shown only at the beat it is aimed at; only the title
    // block, which lies flat on the page, belongs to every view of it.
    if (note.current) note.current.visible = beat === 2;
    if (dimPlate.current) dimPlate.current.visible = beat === 2 && s.dim > 0.5;
    // The last beam arrives with the beat that drops it. Held aloft through
    // the earlier beats it only hung above the frame, out of the plate's
    // vertical reach, as a pale band behind the nav.
    if (topOut.current) {
      topOut.current.visible = beat === 3;
      topOut.current.position.y = s.beam;
    }
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group position={[0, -1.0, 0]}>
      {/* The whole drawing hangs off the mech group, the way the globe and the
          factory do: HeroObjects writes the plate yaw onto that group and
          nothing else, so a part left outside it would never turn and the
          beats' longitudes would be inert. */}
      <group ref={mech}>
        {/* The sheet the whole chapter is drawn on, and its border rule. */}
        <Edged geometry={g.sheet} rotation={[-Math.PI / 2, 0, 0]} />
        <Edged
          linesOnly
          geometry={g.border}
          edges={g.border}
          position={[0, 0.002, 0]}
        />
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
                  material={wallMat ?? undefined}
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
              geometry={
                faceLong(Math.floor(i / FLOORS)) ? g.padLong : g.padShort
              }
              position={panelPos(i)}
              rotation={[0, panelYaw(i), 0]}
              material={hatch?.[tenantAt(i)]}
            />
          ))}
        </group>
        {/* Dimension lines are drafting marks, not volumes: linesOnly, so they
          exist only in the engraved twin, the way a technical drawing's
          annotations always have been ink and never a solid. */}
        <group ref={dim1} position={[DIM1_X, 0, 0]}>
          <group scale={[1, WALL_H, 1]}>
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
        <group ref={dim2} position={[DIM2_X, 0, 0]}>
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
        {/* The "56%" numeral is one more window onto the sheet texture, aimed
          at beat iii the way the notes beside it are. */}
        <group ref={dimPlate}>
          <Edged
            geometry={g.dimPlate}
            position={[DIM_PLATE_X, DIM_CLOSE / 2, 0]}
            rotation={FACE_BACK}
            material={dimMat ?? undefined}
          />
        </group>
        {/* The title block: the sheet says whose drawing this is, and the
          revision line carries the number beat i claims. */}
        <group ref={title}>
          <Edged
            geometry={g.title}
            position={TITLE_POS}
            rotation={[-Math.PI / 2, 0, 0]}
            material={sheetMats?.title}
          />
        </group>
        {/* Region guidelines, standing beside the elevation beat iii reads —
          clear of the page, which the elevation and its runs already fill. */}
        <group ref={note}>
          <Edged
            geometry={g.note}
            position={NOTE_POS}
            rotation={FACE_BACK}
            material={sheetMats?.note}
          />
        </group>
        {/* One label per loan product, against the floor it names. */}
        <group ref={labels}>
          {FLOOR_LABELS.map((label, i) => (
            <Edged
              key={label}
              geometry={g.label}
              position={labelPos(i)}
              rotation={[0, LABEL_YAW, 0]}
              material={sheetMats?.labels[i]}
            />
          ))}
        </group>
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
        <group ref={traffic}>
          <Edged linesOnly geometry={g.traffic} edges={g.traffic} />
        </group>
        {/* The vault and its draws are the only new gold in the chapter besides
          the title block's revision line. */}
        <group ref={capital}>
          <Edged
            geometry={g.vault}
            position={[0, VAULT_Y, 0]}
            color={WCP_PALETTE.accent}
          />
          {[-1, 1].map((sx) =>
            [-1, 0, 1].map((sz) => (
              <Edged
                key={`${sx}:${sz}`}
                geometry={g.drawLine}
                // Outside the column, not inside it: a 0.008 rod on the
                // column's own centreline is money nobody can see, and by
                // beat iv the cladding has closed over the frame.
                position={[
                  sx * (FOOT.w / 2 + DRAW_OFF),
                  (WALL_H + VAULT_TOP) / 2,
                  (sz * FOOT.d) / 2,
                ]}
                material={drawMat ?? undefined}
              />
            )),
          )}
        </group>
        <group ref={topOut}>
          <Edged
            geometry={g.topOut}
            position={[0, WALL_H, 0]}
            color={WCP_PALETTE.ink}
          />
        </group>
      </group>
    </group>
  );
}
