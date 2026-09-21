"use client";

import { useEffect } from "react";
import { sectionProgress } from "@/lib/sectionProgress";
import { useSectionsStore } from "@/store/useSectionsStore";

/** Measures the given section elements on scroll/resize and writes progress to the store. */
export function useSectionProgress(getEls: () => HTMLElement[]): void {
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const rects = getEls().map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, height: r.height };
      });
      const next = sectionProgress(rects, window.innerHeight);
      const cur = useSectionsStore.getState();
      if (
        next.active !== cur.active ||
        Math.abs(next.continuous - cur.continuous) > 1e-4
      ) {
        cur.set(next);
      }
    };
    const schedule = () => {
      if (raf === 0) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
      useSectionsStore
        .getState()
        .set({ active: 0, progress: 0, continuous: 0 });
    };
  }, [getEls]);
}
