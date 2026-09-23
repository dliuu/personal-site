"use client";

import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import {
  paintCity,
  paintGobo,
  paintNeon,
  paintNote,
  paintPhoto,
  paintRug,
  paintSpine,
  paintSprite,
  paintWood,
} from "@/lib/roomTextures";

/** The fonts the page already loaded, read from the codex element's variables. */
export function roomFonts(): { fell: string; script: string } {
  const el = document.querySelector(".instruments");
  const get = (name: string, fallback: string) => {
    const v = el ? getComputedStyle(el).getPropertyValue(name).trim() : "";
    return v ? `${v}, ${fallback}` : fallback;
  };
  return {
    fell: get("--font-fell", "Georgia, serif"),
    script: get("--font-script", "cursive"),
  };
}

function make(
  w: number,
  h: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
  opts: { srgb?: boolean; repeat?: [number, number] } = {},
): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(c.getContext("2d")!);
  const t = new CanvasTexture(c);
  if (opts.srgb !== false) t.colorSpace = SRGBColorSpace;
  if (opts.repeat) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(opts.repeat[0], opts.repeat[1]);
  }
  t.anisotropy = 4;
  return t;
}

export const wood = () =>
  make(256, 256, (c) => paintWood(c), { repeat: [2, 1] });
export const rug = () => make(512, 512, (c) => paintRug(c));
export const city = () => make(512, 256, (c) => paintCity(c));
export const gobo = () => make(128, 128, paintGobo, { srgb: false });
export const sprite = (softness = 0.4) =>
  make(64, 64, (c) => paintSprite(c, softness), { srgb: false });
export const photo = () => make(128, 96, (c) => paintPhoto(c));
export const spine = (title: string, color: string, font: string) =>
  make(64, 256, (c) => paintSpine(c, title, color, font));
export const note = (text: string, color: string, font: string) =>
  make(128, 128, (c) => paintNote(c, text, color, font));
export const neon = (text: string, color: string, font: string) =>
  make(512, 128, (c) => paintNeon(c, text, color, font));
