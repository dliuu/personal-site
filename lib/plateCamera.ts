import { smooth } from "./beats";
import { lerp } from "./progress";

/** Camera distance as a multiple of the sphere radius, per zoom name. */
export const ZOOM_K = { far: 3.5, full: 3.1, mid: 2.2, close: 1.85 } as const;
export type Zoom = keyof typeof ZOOM_K;

export type CameraKey = { lon: number; lat: number; k: number };
export type CameraState = { yaw: number; el: number; k: number };

const D2R = Math.PI / 180;

/** Mech yaw (about y) that brings a longitude to face the camera; matches latLonToVec3. */
export function faceYaw(lon: number): number {
  return -Math.PI / 2 - lon * D2R;
}

/** Unwrap yaws so each is in (prev − 2π, prev]: the globe only ever turns east. */
export function unwrapDescending(yaws: number[]): number[] {
  const out: number[] = [];
  let prev = 0;
  yaws.forEach((y, i) => {
    let v = y;
    if (i === 0) {
      v =
        ((((v + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) -
        Math.PI;
    } else {
      while (v > prev) v -= 2 * Math.PI;
      while (v <= prev - 2 * Math.PI) v += 2 * Math.PI;
    }
    out.push(v);
    prev = v;
  });
  return out;
}

/** Fraction of a beat spent travelling to its place; the rest holds with a slow drift. */
export const TRAVEL = 0.3;
const DRIFT = 0.04;

/**
 * Camera for beat `beat` at local progress `t`: travels from the previous key
 * (the entry key before beat 0) over the first TRAVEL of the beat, then holds,
 * drifting east so the world never sits dead still.
 */
export function plateCamera(
  entry: CameraKey,
  keys: CameraKey[],
  beat: number,
  t: number,
): CameraState {
  if (keys.length === 0)
    return { yaw: faceYaw(entry.lon), el: entry.lat * D2R, k: entry.k };
  const i = Math.min(Math.max(0, beat), keys.length - 1);
  const yaws = unwrapDescending([entry, ...keys].map((k) => faceYaw(k.lon)));
  const prev = i === 0 ? entry : keys[i - 1];
  const cur = keys[i];
  const s = smooth(0, TRAVEL, t);
  const drift = -DRIFT * Math.max(0, t - TRAVEL);
  return {
    yaw: lerp(yaws[i], yaws[i + 1], s) + drift,
    el: lerp(prev.lat, cur.lat, s) * D2R,
    k: lerp(prev.k, cur.k, s),
  };
}
