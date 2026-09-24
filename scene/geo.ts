"use client";

import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  SRGBColorSpace,
} from "three";
import { decodeRing, latLonToVec3 } from "@/lib/geo";
import { LAND, OCEAN } from "./palette";

/** Baked Natural Earth land: rings of [lon, lat, …] in hundredths of a degree. */
export type Land = { rings: number[][] };

let landPromise: Promise<Land> | null = null;
export function loadLand(): Promise<Land> {
  landPromise ??= fetch("/geo/land.json").then((r) => {
    if (!r.ok) throw new Error(`land.json ${r.status}`);
    return r.json() as Promise<Land>;
  });
  return landPromise;
}

/** Equirectangular land/ocean fill: x = (lon+180)/360·W, y = (90−lat)/180·H. */
export function buildLandTexture(land: Land): CanvasTexture {
  const W = 1024;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = OCEAN;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = LAND;
  ctx.beginPath();
  for (const ring of land.rings) {
    decodeRing(ring).forEach(([lon, lat], i) => {
      const x = ((lon + 180) / 360) * W;
      const y = ((90 - lat) / 180) * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
  ctx.fill("evenodd");
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** Coastlines as line segments on a sphere of radius r. */
export function buildCoastGeometry(land: Land, r: number): BufferGeometry {
  const pts: number[] = [];
  for (const ring of land.rings) {
    const v = decodeRing(ring).map(([lon, lat]) => latLonToVec3(lat, lon));
    for (let i = 0; i < v.length; i++) {
      const a = v[i];
      const b = v[(i + 1) % v.length];
      pts.push(a[0] * r, a[1] * r, a[2] * r, b[0] * r, b[1] * r, b[2] * r);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pts, 3));
  return g;
}
