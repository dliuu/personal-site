import { smooth } from "./beats";
import { lerp } from "./progress";

/**
 * The intro plate on one scroll: rest (seated, typing) → stand and step beside
 * the desk → wave → the camera goes into the monitor. All pure functions of
 * plate progress p (0..1) so the scene can be scrubbed both ways.
 */
export const STAND = [0.04, 0.32] as const;
export const WAVE = [0.32, 0.58] as const;
/** Camera keyframes sit at these progress values (rest, stood, over the desk, screen). */
export const CAMERA_KEYS = [0, 0.32, 0.7, 1] as const;

/** 0 seated → 1 standing. */
export function standAmount(p: number): number {
  return smooth(STAND[0], STAND[1], p);
}
/** 0 at the chair → 1 beside the desk, during the second half of standing. */
export function stepAside(p: number): number {
  return smooth(0.2, 0.42, p);
}
/** Envelope of the wave: up quickly, held, down before the camera leaves. */
export function waveAmount(p: number): number {
  return (
    smooth(WAVE[0], WAVE[0] + 0.08, p) *
    (1 - smooth(WAVE[1] - 0.06, WAVE[1], p))
  );
}
/** Phase of the wave's back-and-forth, three swings across the beat. */
export function wavePhase(p: number): number {
  return ((p - WAVE[0]) / (WAVE[1] - WAVE[0])) * Math.PI * 2 * 3;
}
/** The name and line fade as he stands. */
export function overlayOpacity(p: number): number {
  return 1 - smooth(0.25, 0.35, p);
}
/** The screen's picture gives way to the next chapter's flat colour at the seam. */
export function screenFade(p: number): number {
  return smooth(0.9, 1, p);
}
/** Curve parameter for the camera path: eased within each keyframe segment, keyframes at CAMERA_KEYS. */
export function cameraU(p: number): number {
  const n = CAMERA_KEYS.length - 1;
  for (let i = 0; i < n; i++) {
    const a = CAMERA_KEYS[i];
    const b = CAMERA_KEYS[i + 1];
    if (p <= b || i === n - 1) return (i + smooth(a, b, p)) / n;
  }
  return 1;
}
/** Distance at which a w × h screen fills the viewport (whichever axis binds). */
export function screenDistance(
  w: number,
  h: number,
  fovDeg: number,
  aspect: number,
): number {
  const t = Math.tan((fovDeg * Math.PI) / 360);
  return Math.min(h / (2 * t), w / (2 * t * aspect));
}

export type Pose = {
  rootX: number;
  rootY: number;
  rootZ: number;
  rootYaw: number;
  torsoPitch: number;
  thigh: number;
  shin: number;
  upperArmL: number;
  foreArmL: number;
  upperArmR: number;
  foreArmR: number;
  armRaiseR: number;
  waveR: number;
  headYaw: number;
};

/** Joint targets for the placeholder figure at progress p; `time` drives the idle typing. */
export function pose(p: number, time: number, reduced: boolean): Pose {
  const s = standAmount(p);
  const aside = stepAside(p);
  const w = waveAmount(p);
  const typing = reduced || p > STAND[0] ? 0 : Math.sin(time * 2 * Math.PI * 3);
  return {
    rootX: lerp(0, 1.05, aside),
    rootY: lerp(0.47, 0.93, s),
    rootZ: lerp(0.42, 0.75, aside),
    rootYaw: lerp(0, Math.PI * 0.8, aside),
    torsoPitch: lerp(0.12, 0, s),
    thigh: lerp(Math.PI / 2, 0, s),
    shin: lerp(-Math.PI / 2, 0, s),
    upperArmL: lerp(0.35, 0.1, s),
    foreArmL: lerp(1.2 + 0.05 * typing, 0.3, s),
    upperArmR: lerp(0.35, 0.1, s),
    foreArmR: lerp(1.2 - 0.05 * typing, 0.3, s),
    armRaiseR: w,
    waveR: w * 0.45 * Math.sin(wavePhase(p)),
    headYaw: lerp(0, 0.35, w),
  };
}
