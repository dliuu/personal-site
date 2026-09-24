import type { InstrumentKind } from "./chapters";

import { Vector3 } from "three";

/**
 * Imperative, per-frame plate state. Written once by HeroObjects in its
 * useFrame (before the chapter loop) and read by instruments and effects, so
 * everything sees one coherent frame without React re-renders.
 */
export const plateState = {
  /** Whose plate is active, or null when no plate section is. */
  instrument: null as InstrumentKind | null,
  /** Plate progress 0..1. */
  p: 0,
  /** Beat index within the plate. */
  beat: 0,
  /** Progress within the beat, 0..1. */
  t: 0,
  /** Smoothed hero expansion, 0..1. */
  expand: 0,
  /** How far the engraving has dissolved into the real render, 0..1. */
  reveal: 0,
  /** Camera for this frame of the plate: mech yaw, elevation (rad), distance as a multiple of the sphere radius. */
  cam: { yaw: 0, el: 0, k: 3.1 },
  /**
   * The screen a dive plate flies into, written by its instrument each frame
   * (world space, one frame behind the mech rotation; CAM_LERP hides it):
   * the screen's centre, its outward normal and its half-height.
   */
  dive: {
    pos: new Vector3(),
    normal: new Vector3(0, 0, 1),
    halfHeight: 0.1,
    halfWidth: 0.13,
  },
  /** Camera for the intro scene, written by DeskScene each frame it is active. */
  introCam: {
    pos: new Vector3(-1.6, 1.5, 2.6),
    tgt: new Vector3(0.1, 0.9, 0.2),
  },
};
