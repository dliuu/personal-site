"use client";

import { useEffect } from "react";
import { scrollToProgress } from "@/lib/progress";
import { useLabStore } from "@/store/useLabStore";

export function ScrollTrack({ pages }: { pages: number }) {
  const setRawProgress = useLabStore((s) => s.setRawProgress);

  useEffect(() => {
    const update = () =>
      setRawProgress(
        scrollToProgress(
          window.scrollY,
          document.documentElement.scrollHeight,
          window.innerHeight,
        ),
      );
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      setRawProgress(0);
    };
  }, [setRawProgress]);

  return <div aria-hidden style={{ height: `${pages * 100}vh` }} />;
}
