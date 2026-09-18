"use client";

import { useCallback, useRef } from "react";
import { lerp } from "@/lib/progress";
import { useLabStore } from "@/store/useLabStore";

export type ProgressSample = { raw: number; smoothed: number; converged: boolean };

const EPSILON = 0.0005;

export function useScrollProgress(factor = 0.08) {
  const state = useRef<ProgressSample>({ raw: 0, smoothed: 0, converged: true });

  const step = useCallback((): ProgressSample => {
    const { rawProgress, reducedMotion } = useLabStore.getState();
    const s = state.current;
    s.raw = rawProgress;
    s.smoothed = reducedMotion ? rawProgress : lerp(s.smoothed, rawProgress, factor);
    if (Math.abs(s.smoothed - s.raw) < EPSILON) s.smoothed = s.raw;
    s.converged = s.smoothed === s.raw;
    return s;
  }, [factor]);

  return { step };
}
