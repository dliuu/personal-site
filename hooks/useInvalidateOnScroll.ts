"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useLabStore } from "@/store/useLabStore";

/** Inside a Canvas with frameloop="demand": request a frame whenever scroll progress changes. */
export function useInvalidateOnScroll(): void {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(
    () =>
      useLabStore.subscribe((state, prev) => {
        if (state.rawProgress !== prev.rawProgress) invalidate();
      }),
    [invalidate],
  );
}
