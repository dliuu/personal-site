"use client";

import { useEffect } from "react";
import { useDeviceStore } from "@/store/useDeviceStore";

export function useReducedMotion(): void {
  const setReducedMotion = useDeviceStore((s) => s.setReducedMotion);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [setReducedMotion]);
}
