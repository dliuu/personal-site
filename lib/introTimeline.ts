import { smooth } from "./beats";

/**
 * The intro plate on one scroll: rest (seated, typing) → stand and step beside
 * the desk → wave → the camera goes into the monitor. All pure functions of
 * plate progress p (0..1) so the scene can be scrubbed both ways.
 */
/** The greeting: the chair turns toward you, holds, then turns back. */
export const SWIVEL = [0.08, 0.3] as const;
export const SWIVEL_BACK = [0.55, 0.7] as const;
/** How far the chair turns from facing the desk, in radians. */
export const SWIVEL_TURN = -2.6;
/** Camera keyframes sit at these progress values (rest, greeted, over the desk, screen). */
export const CAMERA_KEYS = [0, 0.32, 0.7, 1] as const;

/** 0 facing the desk, 1 turned to the camera. */
export function swivelAmount(p: number): number {
  return (
    smooth(SWIVEL[0], SWIVEL[1], p) *
    (1 - smooth(SWIVEL_BACK[0], SWIVEL_BACK[1], p))
  );
}
/** A small bob and wobble while the greeting is held, so it is not a turntable. */
export function greetBob(
  p: number,
  time: number,
): { lift: number; tilt: number } {
  const a = swivelAmount(p);
  return {
    lift: a * 0.012 * Math.sin(time * 3.1),
    tilt: a * 0.05 * Math.sin(time * 2.3 + 0.7),
  };
}
/** Idle breathing sway while he is working, in radians. */
export function idleSway(time: number): number {
  return 0.02 * Math.sin(time * 0.6);
}
/** He is typing while he still faces the desk. */
export function isTyping(p: number): boolean {
  return p < SWIVEL[0];
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
