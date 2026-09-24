import { CanvasTexture, SRGBColorSpace } from "three";

import { ATLAS, paintSheet } from "@/lib/sheet";

/**
 * One canvas of sheet lettering, painted once. Unlike the terminal atlas it
 * never streams, so there is no windowing shader: parts sample their own rect
 * from lib/sheet's RECTS.
 */
export function makeSheetTexture(ink: string, accent: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS;
  canvas.height = ATLAS;
  const ctx = canvas.getContext("2d");
  if (ctx) paintSheet(ctx, ink, accent);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
