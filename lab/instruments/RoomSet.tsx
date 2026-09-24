"use client";

import { useEffect, useMemo, useState } from "react";
import type { Texture } from "three";
import {
  BoxGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
} from "three";
import { Plant } from "./Plant";
import { loadGarden, note, photo, rug, spine, wood } from "./roomTextures";
import { useRoomStore } from "./useRoomStore";

const mat = (color: string, roughness = 0.85, metalness = 0) =>
  new MeshStandardMaterial({ color, roughness, metalness });

/** PLACEHOLDER titles and notes until the owner supplies theirs. */
const BOOKS = [
  ["Data-Intensive Apps", "#8a6a55"],
  ["Gödel, Escher, Bach", "#6b7a5a"],
  ["Pragmatic Programmer", "#b58a5a"],
  ["SICP", "#5a6b5a"],
  ["Dune", "#c4795a"],
  ["Sapiens", "#a3906a"],
  ["Norwegian Wood", "#7a8b6a"],
  ["Zero to One", "#8c8c84"],
  ["Deep Learning", "#5a6a7a"],
  ["Snow Crash", "#9a5a4a"],
  ["Thinking, Fast and Slow", "#7a8a5a"],
  ["Designing Design", "#3a3128"],
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
 * The static set: a modern room in plaster and pale oak. The back wall is
 * glass from floor to ceiling (the panes and curtains live in RoomLife); the
 * side walls carry the print and the shelves. Stage 0 is the shell, stage 1
 * adds textures, the shelf wall and the desk extras, stage 2 the rest.
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
      wallSide: new PlaneGeometry(6, 2.6),
      ceiling: new PlaneGeometry(4.8, 6),
      slat: new BoxGeometry(4.8, 0.03, 0.06),
      baseboard: new BoxGeometry(6, 0.06, 0.02),
      mullion: new BoxGeometry(0.05, 2.6, 0.05),
      header: new BoxGeometry(4.9, 0.06, 0.08),
      threshold: new BoxGeometry(4.9, 0.02, 0.1),
      rug: new PlaneGeometry(2.8, 2.0),
      door: new BoxGeometry(0.02, 2.05, 0.85),
      doorFrame: new BoxGeometry(0.04, 2.12, 0.95),
      handle: new SphereGeometry(0.025, 10, 8),
      shelf: new BoxGeometry(1.0, 0.03, 0.26),
      book: new BoxGeometry(0.035, 0.22, 0.17),
      plinth: new BoxGeometry(0.34, 0.06, 0.28),
      sleeve: new BoxGeometry(0.3, 0.3, 0.01),
      deck: new BoxGeometry(0.28, 0.1, 0.18),
      deckWindow: new PlaneGeometry(0.16, 0.05),
      photoFrame: new BoxGeometry(0.15, 0.115, 0.015),
      photo: new PlaneGeometry(0.128, 0.096),
      poster: new PlaneGeometry(0.42, 0.55),
      posterFrame: new BoxGeometry(0.48, 0.61, 0.025),
      cork: new BoxGeometry(0.6, 0.45, 0.02),
      card: new PlaneGeometry(0.11, 0.08),
      floorCushion: new CylinderGeometry(0.28, 0.3, 0.12, 24),
      stackBook: new BoxGeometry(0.2, 0.03, 0.14),
      standTop: new CylinderGeometry(0.16, 0.16, 0.02, 20),
      standLeg: new CylinderGeometry(0.01, 0.01, 0.5, 6),
      bench: new BoxGeometry(1.2, 0.05, 0.35),
      benchLeg: new BoxGeometry(0.04, 0.4, 0.3),
      monitor2: new BoxGeometry(0.5, 0.3, 0.025),
      stem2: new BoxGeometry(0.04, 0.12, 0.04),
      penCup: new CylinderGeometry(0.035, 0.03, 0.09, 12),
      pen: new CylinderGeometry(0.004, 0.004, 0.14, 6),
      band: new TorusGeometry(0.075, 0.008, 8, 24, Math.PI),
      cup: new CylinderGeometry(0.035, 0.03, 0.03, 12),
      wrist: new BoxGeometry(0.44, 0.02, 0.06),
      cable: new CylinderGeometry(0.004, 0.004, 0.6, 6),
      hangerCord: new CylinderGeometry(0.003, 0.003, 0.7, 5),
    }),
    [],
  );
  const woodTex = useMemo(() => (stage >= 1 ? wood() : null), [stage]);
  const rugTex = useMemo(() => (stage >= 1 ? rug() : null), [stage]);
  const paintedPhoto = useMemo(() => (stage >= 1 ? photo() : null), [stage]);
  // The framed photo is a corner of the garden outside, until a real one lands.
  const [gardenPhoto, setGardenPhoto] = useState<Texture | null>(null);
  useEffect(() => {
    let on = true;
    loadGarden().then(
      (t) => {
        if (!on) return;
        const c = t.clone();
        c.repeat.set(0.28, 0.42);
        c.offset.set(0.36, 0.3);
        c.needsUpdate = true;
        setGardenPhoto(c);
      },
      () => {},
    );
    return () => {
      on = false;
    };
  }, []);
  const photoTex = gardenPhoto ?? paintedPhoto;
  const spines = useMemo(
    () => (stage >= 1 ? BOOKS.map(([t, c]) => spine(t, c, fonts.fell)) : null),
    [stage, fonts.fell],
  );
  const m = useMemo(
    () => ({
      floor: mat("#c9b08a", 0.7),
      wall: mat("#e8e0d4", 0.95),
      ceiling: mat("#efe8df", 1),
      slat: mat("#b89b74", 0.75),
      trim: mat("#d9d0c2", 0.8),
      black: mat("#2a2724", 0.5, 0.2),
      rug: rugTex
        ? new MeshStandardMaterial({
            map: rugTex,
            roughness: 1,
            color: "#e6dccb",
          })
        : mat("#d9cdb8", 1),
      wood: woodTex
        ? new MeshStandardMaterial({
            map: woodTex,
            roughness: 0.6,
            color: "#e0c9a6",
          })
        : mat("#b89b74", 0.6),
      oak: mat("#b89b74", 0.6),
      door: mat("#d2c4b0", 0.8),
      brass: mat("#b08d4f", 0.3, 0.9),
      cushion: mat("#c4795a", 1),
      linen: mat("#e6dccb", 1),
      sage: mat("#7a8b6a", 0.95),
      dark: mat("#3a3128", 0.6),
      sleeve: mat("#efe6d8", 0.9),
      posterFrame: mat("#3a3128", 0.6),
      poster: mat("#efe4cc", 0.9),
      cork: mat("#c9a77a", 1),
      card: mat("#efe4cc", 0.9),
      terracotta: mat("#b86a4a", 0.9),
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
    [woodTex, rugTex, spines, photoTex],
  );
  const baked = useRoomStore((s) => s.baked);
  const posterThing = useThing(
    "the codex",
    "chapters II–V; click to turn the page",
    () =>
      document.getElementById("eisen")?.scrollIntoView({ behavior: "smooth" }),
  );

  return (
    <group>
      {/* Shell: floor, two plaster walls, a slatted ceiling; the back is glass. */}
      <mesh
        geometry={g.floor}
        visible={!baked}
        material={m.floor}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      />
      <mesh
        geometry={g.wallSide}
        visible={!baked}
        material={m.wall}
        position={[-2.4, 1.3, 1.8]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      />
      <mesh
        geometry={g.wallSide}
        visible={!baked}
        material={m.wall}
        position={[2.4, 1.3, 1.8]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      />
      <mesh
        geometry={g.ceiling}
        visible={!baked}
        material={m.ceiling}
        position={[0, 2.6, 1.8]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      {stage >= 1
        ? Array.from({ length: 9 }, (_, i) => (
            <mesh
              key={i}
              geometry={g.slat}
              visible={!baked}
              material={m.slat}
              position={[0, 2.56, -0.9 + i * 0.5]}
            />
          ))
        : null}
      <mesh
        geometry={g.baseboard}
        visible={!baked}
        material={m.trim}
        position={[-2.39, 0.03, 1.8]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <mesh
        geometry={g.baseboard}
        visible={!baked}
        material={m.trim}
        position={[2.39, 0.03, 1.8]}
        rotation={[0, Math.PI / 2, 0]}
      />
      {/* Glass wall frame: mullions, header and threshold in black steel. */}
      {[-2.4, -0.8, 0.8, 2.4].map((x) => (
        <mesh
          key={x}
          geometry={g.mullion}
          visible={!baked}
          material={m.black}
          position={[x, 1.3, -1.2]}
          castShadow
        />
      ))}
      <mesh
        geometry={g.header}
        visible={!baked}
        material={m.black}
        position={[0, 2.57, -1.2]}
      />
      <mesh
        geometry={g.threshold}
        visible={!baked}
        material={m.black}
        position={[0, 0.01, -1.2]}
      />
      <mesh
        geometry={g.rug}
        visible={!baked}
        material={m.rug}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0.2, 0.004, 0.55]}
        receiveShadow
      />
      {/* Left wall: the print, the cork board, a hanging pothos */}
      <group position={[-2.38, 1.75, -0.2]} rotation={[0, Math.PI / 2, 0]}>
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
      {stage >= 2 ? (
        <group position={[-2.38, 1.35, 1.0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh geometry={g.cork} material={m.cork} />
          {(
            [
              [-0.18, 0.1, 0.08],
              [0.1, 0.05, -0.05],
              [-0.05, -0.12, 0.03],
            ] as const
          ).map(([x, y, r], i) => (
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
      {stage >= 2 ? (
        <group position={[-1.6, 2.58, 0.4]}>
          <mesh
            geometry={g.hangerCord}
            material={m.dark}
            position={[0, -0.35, 0]}
          />
          <Plant
            position={[0, -0.78, 0]}
            leaves={12}
            size={0.2}
            color="#5f8a55"
            potColor="#e6dccb"
            potR={0.09}
            potH={0.1}
            droop={1.2}
          />
        </group>
      ) : null}
      {/* Floor: cushion, a stack of books, a plant stand, a bench under the glass with pots */}
      {stage >= 2 ? (
        <>
          <mesh
            geometry={g.floorCushion}
            visible={!baked}
            material={m.cushion}
            position={[1.75, 0.06, 0.25]}
            castShadow
          />
          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              geometry={g.stackBook}
              material={m.spines?.[(i * 5) % 12] ?? m.sleeve}
              position={[1.8, 0.015 + i * 0.03, 0.7]}
              rotation={[0, i * 0.25, 0]}
              castShadow
            />
          ))}
          <group position={[-1.9, 0, 0.6]}>
            {[0, 1, 2].map((i) => (
              <mesh
                key={i}
                geometry={g.standLeg}
                visible={!baked}
                material={m.black}
                position={[
                  Math.cos(i * 2.1) * 0.12,
                  0.25,
                  Math.sin(i * 2.1) * 0.12,
                ]}
              />
            ))}
            <mesh
              geometry={g.standTop}
              visible={!baked}
              material={m.oak}
              position={[0, 0.5, 0]}
            />
            <Plant
              position={[0, 0.51, 0]}
              leaves={10}
              size={0.2}
              color="#6a9a60"
              potColor="#e6dccb"
              potR={0.09}
              potH={0.12}
            />
          </group>
          <group position={[1.4, 0, -0.95]}>
            <mesh
              geometry={g.bench}
              visible={!baked}
              material={m.oak}
              position={[0, 0.42, 0]}
              castShadow
              receiveShadow
            />
            <mesh
              geometry={g.benchLeg}
              visible={!baked}
              material={m.oak}
              position={[-0.55, 0.2, 0]}
            />
            <mesh
              geometry={g.benchLeg}
              visible={!baked}
              material={m.oak}
              position={[0.55, 0.2, 0]}
            />
            <Plant
              position={[-0.4, 0.445, 0]}
              leaves={8}
              size={0.18}
              color="#7aa065"
              potColor="#c4795a"
              potR={0.08}
              potH={0.12}
            />
            <Plant
              position={[0.05, 0.445, 0.02]}
              leaves={11}
              size={0.13}
              color="#5a8a5a"
              potColor="#e6dccb"
              potR={0.07}
              potH={0.1}
              droop={0.6}
            />
            <Plant
              position={[0.45, 0.445, -0.02]}
              leaves={6}
              size={0.22}
              color="#4f7a4a"
              potColor="#3a3128"
              potR={0.08}
              potH={0.12}
            />
          </group>
          <group visible={!baked}>
            <Plant
              position={[-1.95, 0, -0.7]}
              leaves={7}
              size={0.34}
              color="#3f7a45"
              potColor="#e6dccb"
              potR={0.15}
              potH={0.3}
              trunk={0.9}
            />
          </group>
          <group visible={!baked}>
            <Plant
              position={[2.0, 0, -0.55]}
              leaves={9}
              size={0.3}
              color="#5a8a50"
              potColor="#c4795a"
              potR={0.14}
              potH={0.28}
              trunk={0.6}
            />
          </group>
        </>
      ) : null}
      {/* Desk extras */}
      {stage >= 1 ? (
        <>
          <group position={[-0.55, 0.9, -0.55]} rotation={[0, 0.35, 0]}>
            <mesh
              geometry={g.stem2}
              visible={!baked}
              material={m.black}
              position={[0, -0.09, 0]}
            />
            <mesh
              geometry={g.monitor2}
              visible={!baked}
              material={m.black}
              castShadow
            />
          </group>
          <group position={[0.45, 0.8, -0.55]}>
            <mesh geometry={g.penCup} material={m.terracotta} />
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
            <mesh geometry={g.band} visible={!baked} material={m.black} />
            <mesh
              geometry={g.cup}
              visible={!baked}
              material={m.black}
              position={[-0.075, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            />
            <mesh
              geometry={g.cup}
              visible={!baked}
              material={m.black}
              position={[0.075, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            />
          </group>
          <mesh
            geometry={g.wrist}
            material={m.linen}
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
