import { clamp01 } from "./progress";

export function easeOutCubic(t: number): number {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, 3);
}

export function introBlend(
  elapsed: number,
  duration: number,
): { t: number; done: boolean } {
  if (duration <= 0 || elapsed >= duration) return { t: 1, done: true };
  return { t: easeOutCubic(elapsed / duration), done: false };
}

export function parallaxOffset(
  pointer: { x: number; y: number },
  amount: number,
  reducedMotion: boolean,
): [number, number, number] {
  if (reducedMotion) return [0, 0, 0];
  const x = Number.isNaN(pointer.x) ? 0 : pointer.x;
  const y = Number.isNaN(pointer.y) ? 0 : pointer.y;
  return [x * amount, y * amount * 0.5, 0];
}

export function shouldInvalidate(s: {
  converged: boolean;
  introDone: boolean;
  parallaxSettled: boolean;
  panelOpen: boolean;
}): boolean {
  if (!s.converged) return true;
  if (!s.introDone) return true;
  if (!s.parallaxSettled && !s.panelOpen) return true;
  return false;
}
