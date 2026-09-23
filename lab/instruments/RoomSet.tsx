"use client";

import { useMemo } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
} from "three";
import { neon, note, photo, rug, spine, wood } from "./roomTextures";
import { useRoomStore } from "./useRoomStore";
import { Plant } from "./Plant";

const mat = (color: string, roughness = 0.85, metalness = 0) =>
  new MeshStandardMaterial({ color, roughness, metalness });

/** PLACEHOLDER titles and notes until the owner supplies theirs. */
const BOOKS = [
  ["Data-Intensive Apps", "#7a3b3b"],
  ["Gödel, Escher, Bach", "#3b5a7a"],
  ["Pragmatic Programmer", "#7a6a3b"],
  ["SICP", "#3b6a4a"],
  ["Dune", "#5a3b7a"],
  ["Sapiens", "#8a5a2b"],
  ["Norwegian Wood", "#2b5a5a"],
  ["Zero to One", "#6a6a6a"],
  ["Deep Learning", "#3b3b7a"],
  ["Snow Crash", "#8a2b4a"],
  ["Thinking, Fast and Slow", "#4a6a2b"],
  ["Designing Design", "#2b2b2b"],
] as const;
const NOTES = [
  ["ship the globe by friday", "#c9b04a", [0.345, 1.16, -0.44]],
  ["call mom", "#c98a96", [0.345, 1.06, -0.44]],
  ["water the monstera", "#8fb07a", [-0.345, 1.15, -0.44]],
  ["48 locales → get the real list", "#7fa6c4", [-0.345, 1.05, -0.44]],
] as const;

/** Hover/click plumbing for an interactive thing in the room. */
export function useThing(label: string, note?: string, onClick?: () => void) {
  const setHover = useRoomStore((s) => s.setHover);
  return {
    onPointerOver: (e: { stopPropagation(): void }) => {
      e.stopPropagation();
      setHover({ label, note });
    },
    onPointerOut: () => setHover(null),
    onClick: (e: { stopPropagation(): void }) => {
      e.stopPropagation();
      onClick?.();
    },
  };
}

function Note({
  text,
  color,
  position,
  font,
}: {
  text: string;
  color: string;
  position: readonly [number, number, number];
  font: string;
}) {
  const tex = useMemo(() => note(text, color, font), [text, color, font]);
  const m = useMemo(
    () =>
      new MeshStandardMaterial({ map: tex, roughness: 1, color: "#bfbfbf" }),
    [tex],
  );
  const g = useMemo(() => new PlaneGeometry(0.075, 0.075), []);
  const pin = useRoomStore((s) => s.pin);
  const pinned = useRoomStore((s) => s.pinned);
  const thing = useThing("a note", text, () =>
    pin(pinned === text ? null : text),
  );
  return (
    <mesh
      geometry={g}
      material={m}
      position={[position[0], position[1], position[2] + 0.02]}
      rotation={[0, 0, (position[0] > 0 ? -1 : 1) * 0.06]}
      {...thing}
    />
  );
}

/**
 * The static set: walls and ceiling, the window bay, the shelf wall, the
 * left wall, the floor and the desk's extras. Stage 0 is the shell, stage 1
 * adds textures and the shelf wall, stage 2 the rest, so the room settles in
 * after first paint instead of delaying it.
 */
export function RoomSet({
  stage,
  fonts,
}: {
  stage: number;
  fonts: { fell: string; script: string };
}) {
  const g = useMemo(
    () => ({
      floor: new PlaneGeometry(9, 9),
      wallBack: new PlaneGeometry(4.8, 2.6),
      wallSide: new PlaneGeometry(6, 2.6),
      ceiling: new PlaneGeometry(4.8, 6),
      baseboard: new BoxGeometry(4.8, 0.08, 0.02),
      rug: new PlaneGeometry(2.6, 1.8),
      door: new BoxGeometry(0.02, 2.05, 0.85),
      doorFrame: new BoxGeometry(0.04, 2.12, 0.95),
      handle: new SphereGeometry(0.025, 10, 8),
      radiator: new BoxGeometry(0.7, 0.5, 0.08),
      fin: new BoxGeometry(0.03, 0.46, 0.1),
      sill: new BoxGeometry(1.1, 0.04, 0.22),
      cushion: new BoxGeometry(0.9, 0.06, 0.18),
      frame: new BoxGeometry(0.05, 1.2, 0.03),
      frameH: new BoxGeometry(1.0, 0.05, 0.03),
      shelf: new BoxGeometry(0.9, 0.03, 0.26),
      book: new BoxGeometry(0.035, 0.22, 0.17),
      plinth: new BoxGeometry(0.34, 0.06, 0.28),
      sleeve: new BoxGeometry(0.3, 0.3, 0.01),
      deck: new BoxGeometry(0.28, 0.1, 0.18),
      deckWindow: new PlaneGeometry(0.16, 0.05),
      photoFrame: new BoxGeometry(0.15, 0.115, 0.015),
      photo: new PlaneGeometry(0.128, 0.096),
      poster: new PlaneGeometry(0.42, 0.55),
      posterFrame: new BoxGeometry(0.48, 0.61, 0.025),
      neon: new PlaneGeometry(0.9, 0.225),
      cork: new BoxGeometry(0.6, 0.45, 0.02),
      card: new PlaneGeometry(0.11, 0.08),
      floorCushion: new CylinderGeometry(0.28, 0.3, 0.12, 24),
      stackBook: new BoxGeometry(0.2, 0.03, 0.14),
      monitor2: new BoxGeometry(0.5, 0.3, 0.025),
      stem2: new BoxGeometry(0.04, 0.12, 0.04),
      penCup: new CylinderGeometry(0.035, 0.03, 0.09, 12),
      pen: new CylinderGeometry(0.004, 0.004, 0.14, 6),
      band: new TorusGeometry(0.075, 0.008, 8, 24, Math.PI),
      cup: new CylinderGeometry(0.035, 0.03, 0.03, 12),
      wrist: new BoxGeometry(0.44, 0.02, 0.06),
      cable: new CylinderGeometry(0.004, 0.004, 0.6, 6),
    }),
    [],
  );
  const woodTex = useMemo(() => (stage >= 1 ? wood() : null), [stage]);
  const rugTex = useMemo(() => (stage >= 1 ? rug() : null), [stage]);
  const photoTex = useMemo(() => (stage >= 1 ? photo() : null), [stage]);
  const neonTex = useMemo(() => {
    return stage >= 2 ? neon("stay curious", "#ff8fb1", fonts.script) : null;
  }, [stage, fonts.script]);
  const spines = useMemo(
    () => (stage >= 1 ? BOOKS.map(([t, c]) => spine(t, c, fonts.fell)) : null),
    [stage, fonts.fell],
  );
  const m = useMemo(
    () => ({
      floor: mat("#2a2320", 0.95),
      wall: mat("#3a3341", 0.95),
      wallSide: mat("#332d3a", 0.95),
      ceiling: mat("#2b2630", 1),
      trim: mat("#4a3a30", 0.7),
      rug: rugTex
        ? new MeshStandardMaterial({ map: rugTex, roughness: 1 })
        : mat("#5a3a3a", 1),
      wood: woodTex
        ? new MeshStandardMaterial({ map: woodTex, roughness: 0.55 })
        : mat("#5a3d2b", 0.55),
      door: mat("#4a3b33", 0.8),
      brass: mat("#b08d4f", 0.3, 0.9),
      radiator: mat("#c9c3b8", 0.6, 0.3),
      cushion: mat("#7a5a4a", 1),
      dark: mat("#1e2027", 0.5, 0.2),
      black: mat("#0c0d10", 0.35, 0.3),
      sleeve: mat("#d8cdb4", 0.9),
      posterFrame: mat("#24201c", 0.6),
      poster: mat("#d8cdb4", 0.9),
      cork: mat("#b58b5a", 1),
      card: mat("#efe4cc", 0.9),
      neon: neonTex
        ? new MeshStandardMaterial({
            color: "#000000",
            emissive: "#ffffff",
            emissiveMap: neonTex,
            emissiveIntensity: 2.2,
          })
        : null,
      photo: photoTex
        ? new MeshStandardMaterial({ map: photoTex, roughness: 0.6 })
        : mat("#8899aa"),
      spines: spines
        ? spines.map(
            (t) => new MeshStandardMaterial({ map: t, roughness: 0.9 }),
          )
        : null,
      deckGlass: new MeshStandardMaterial({
        color: "#111",
        emissive: "#ffb36b",
        emissiveIntensity: 0.4,
      }),
    }),
    [woodTex, rugTex, neonTex, spines, photoTex],
  );
  const toggleBlinds = useRoomStore((s) => s.toggleBlinds);
  const posterThing = useThing(
    "the codex",
    "chapters II–V; click to turn the page",
    () =>
      document.getElementById("eisen")?.scrollIntoView({ behavior: "smooth" }),
  );
  const sillThing = useThing(
    "the window",
    "click the cord to work the blinds",
    toggleBlinds,
  );

  return (
    <group>
      {/* Shell */}
      <mesh
        geometry={g.floor}
        material={m.floor}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      />
      <mesh
        geometry={g.wallBack}
        material={m.wall}
        position={[0, 1.3, -1.2]}
        receiveShadow
      />
      <mesh
        geometry={g.wallSide}
        material={m.wallSide}
        position={[-2.4, 1.3, 1.8]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      />
      <mesh
        geometry={g.wallSide}
        material={m.wallSide}
        position={[2.4, 1.3, 1.8]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      />
      <mesh
        geometry={g.ceiling}
        material={m.ceiling}
        position={[0, 2.6, 1.8]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        geometry={g.baseboard}
        material={m.trim}
        position={[0, 0.04, -1.19]}
      />
      <mesh
        geometry={g.rug}
        material={m.rug}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0.2, 0.004, 0.5]}
        receiveShadow
      />
      {/* Door on the right wall */}
      <group position={[2.39, 1.03, 1.6]}>
        <mesh geometry={g.doorFrame} material={m.trim} />
        <mesh geometry={g.door} material={m.door} position={[-0.01, 0, 0]} />
        <mesh
          geometry={g.handle}
          material={m.brass}
          position={[-0.04, 0, -0.32]}
        />
      </group>
      {/* Window bay (the pane and blinds live in RoomLife) */}
      <group position={[1.65, 1.75, -1.19]}>
        <mesh
          geometry={g.frame}
          material={m.wood}
          position={[-0.47, 0, 0.01]}
        />
        <mesh geometry={g.frame} material={m.wood} position={[0.47, 0, 0.01]} />
        <mesh
          geometry={g.frameH}
          material={m.wood}
          position={[0, 0.57, 0.01]}
        />
        <mesh
          geometry={g.frameH}
          material={m.wood}
          position={[0, -0.57, 0.01]}
        />
        <mesh
          geometry={g.sill}
          material={m.wood}
          position={[0, -0.61, 0.1]}
          castShadow
          {...sillThing}
        />
        <mesh
          geometry={g.cushion}
          material={m.cushion}
          position={[0, -0.56, 0.1]}
        />
        <group position={[0, -1.35, 0.08]}>
          <mesh geometry={g.radiator} material={m.radiator} />
          {Array.from({ length: 9 }, (_, i) => (
            <mesh
              key={i}
              geometry={g.fin}
              material={m.radiator}
              position={[-0.3 + i * 0.075, 0, 0.02]}
            />
          ))}
        </group>
      </group>
      {/* Left wall: the print, the neon, the cork board */}
      <group position={[-1.05, 1.75, -1.18]}>
        <mesh
          geometry={g.posterFrame}
          material={m.posterFrame}
          {...posterThing}
        />
        <mesh
          geometry={g.poster}
          material={m.poster}
          position={[0, 0, 0.014]}
        />
      </group>
      {stage >= 2 && m.neon ? (
        <mesh
          geometry={g.neon}
          material={m.neon}
          position={[2.38, 2.08, -0.3]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      ) : null}
      {stage >= 2 ? (
        <group position={[-1.85, 1.35, -1.18]}>
          <mesh geometry={g.cork} material={m.cork} />
          {[
            [-0.18, 0.1, 0.08],
            [0.1, 0.05, -0.05],
            [-0.05, -0.12, 0.03],
          ].map(([x, y, r], i) => (
            <mesh
              key={i}
              geometry={g.card}
              material={m.card}
              position={[x, y, 0.012]}
              rotation={[0, 0, r]}
            />
          ))}
        </group>
      ) : null}
      {/* Shelf wall (right) */}
      {stage >= 1 ? (
        <group position={[2.27, 1.25, -0.3]} rotation={[0, Math.PI / 2, 0]}>
          <mesh geometry={g.shelf} material={m.wood} castShadow receiveShadow />
          <mesh
            geometry={g.shelf}
            material={m.wood}
            position={[0, 0.5, 0]}
            castShadow
            receiveShadow
          />
          {m.spines?.map((sm, i) => (
            <mesh
              key={i}
              geometry={g.book}
              material={sm}
              position={[-0.4 + i * 0.038, 0.125, 0.02]}
              rotation={[0, 0, i === 11 ? -0.18 : 0]}
              castShadow
            />
          ))}
          <group position={[0.22, 0.515, -0.02]}>
            <mesh geometry={g.plinth} material={m.wood} castShadow />
            <mesh
              geometry={g.sleeve}
              material={m.sleeve}
              position={[0.2, 0.15, -0.08]}
              rotation={[0, 0, -0.08]}
            />
          </group>
          <group position={[-0.22, 0.565, 0]}>
            <mesh geometry={g.deck} material={m.black} castShadow />
            <mesh
              geometry={g.deckWindow}
              material={m.deckGlass}
              position={[0, 0.005, 0.091]}
            />
          </group>
          <group position={[0.02, 0.575, 0.03]} rotation={[0, -0.3, 0]}>
            <mesh geometry={g.photoFrame} material={m.posterFrame} />
            <mesh
              geometry={g.photo}
              material={m.photo}
              position={[0, 0, 0.009]}
            />
          </group>
          <Plant
            position={[-0.38, 0.515, 0.02]}
            leaves={9}
            size={0.16}
            color="#4f8a4a"
            potR={0.07}
            potH={0.09}
            droop={0.9}
          />
        </group>
      ) : null}
      {/* Floor: cushion, a stack of books */}
      {stage >= 2 ? (
        <>
          <mesh
            geometry={g.floorCushion}
            material={m.cushion}
            position={[1.3, 0.06, 0.9]}
            castShadow
          />
          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              geometry={g.stackBook}
              material={m.spines?.[(i * 5) % 12] ?? m.sleeve}
              position={[1.0, 0.015 + i * 0.03, 0.3]}
              rotation={[0, i * 0.25, 0]}
              castShadow
            />
          ))}
        </>
      ) : null}
      {/* Desk extras */}
      {stage >= 1 ? (
        <>
          <group position={[-0.55, 0.9, -0.55]} rotation={[0, 0.35, 0]}>
            <mesh
              geometry={g.stem2}
              material={m.dark}
              position={[0, -0.09, 0]}
            />
            <mesh geometry={g.monitor2} material={m.black} castShadow />
          </group>
          <group position={[0.45, 0.8, -0.55]}>
            <mesh geometry={g.penCup} material={m.dark} />
            {[-0.01, 0.008, 0.0].map((x, i) => (
              <mesh
                key={i}
                geometry={g.pen}
                material={i ? m.sleeve : m.brass}
                position={[x, 0.07, i * 0.01 - 0.01]}
                rotation={[0.1 * i, 0, 0.15 - 0.15 * i]}
              />
            ))}
          </group>
          <group position={[0.34, 1.2, -0.42]} rotation={[0, 0, 0.2]}>
            <mesh geometry={g.band} material={m.black} />
            <mesh
              geometry={g.cup}
              material={m.black}
              position={[-0.075, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            />
            <mesh
              geometry={g.cup}
              material={m.black}
              position={[0.075, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            />
          </group>
          <mesh
            geometry={g.wrist}
            material={m.cushion}
            position={[0, 0.762, -0.05]}
          />
          <mesh
            geometry={g.cable}
            material={m.black}
            position={[0.15, 0.755, -0.45]}
            rotation={[0, 0.9, Math.PI / 2]}
          />
          {NOTES.map(([text, color, pos]) => (
            <Note
              key={text}
              text={text}
              color={color}
              position={pos}
              font={fonts.script}
            />
          ))}
        </>
      ) : null}
    </group>
  );
}
