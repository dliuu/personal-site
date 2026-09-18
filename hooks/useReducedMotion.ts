"use client";

import { useEffect } from "react";
import { useLabStore } from "@/store/useLabStore";

export function useReducedMotion(): void {
  const setReducedMotion = useLabStore((s) => s.setReducedMotion);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [setReducedMotion]);
}
