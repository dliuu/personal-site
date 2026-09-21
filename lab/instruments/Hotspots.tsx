"use client";

import { useEffect } from "react";
import { Html } from "@react-three/drei";
import type { InstrumentKind } from "./chapters";
import { fell } from "./fonts";
import { hotspots } from "./hotspotNotes";
import { useExploreStore } from "./useExploreStore";

export function Hotspots({
  chapterId,
  kind,
  visible,
}: {
  chapterId: string;
  kind: InstrumentKind;
  visible: boolean;
}) {
  const open = useExploreStore((s) => s.open);
  const setOpen = useExploreStore((s) => s.setOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!visible) return null;

  return (
    <>
      {hotspots[kind].map((h, i) => {
        const id = `${chapterId}-${i}`;
        const isOpen = open === id;
        return (
          <Html key={id} position={h.position} center zIndexRange={[5, 0]}>
            <div className={`instruments-hotspot-wrap ${fell.variable}`}>
              <button
                type="button"
                className={`instruments-hotspot${isOpen ? " is-open" : ""}`}
                aria-expanded={isOpen}
                aria-label={`Note ${h.label}`}
                onClick={() => setOpen(isOpen ? null : id)}
              >
                {h.label}
              </button>
              {isOpen ? (
                <div className="instruments-hotspot-card" role="note">
                  {h.note}
                </div>
              ) : null}
            </div>
          </Html>
        );
      })}
    </>
  );
}
