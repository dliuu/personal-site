import { Vector3 } from "three";
import type { InstrumentKind } from "./chapters";

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
  /**
   * World point the camera looks at in beat 1; written by the instrument.
   * Written by the solid Globe's useFrame, which runs before HeroObjects' —
   * one frame behind the parent transform; CAM_LERP smooths it. Do not reorder.
   */
  focus: new Vector3(),
  hasFocus: false,
};
