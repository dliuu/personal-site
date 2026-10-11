"use client";

import { useEffect } from "react";
import { Html } from "@react-three/drei";
import type { InstrumentKind } from "./chapters";
import { fell } from "./fonts";
import { hotspots } from "./hotspotNotes";
import { useExploreStore } from "./useExploreStore";

// Mounted once by the hero, not per instrument: one key and one pointer
// listener close whichever note is open.
export function useHotspotDismiss() {
  const open = useExploreStore((s) => s.open);
  const setOpen = useExploreStore((s) => s.setOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (!el?.closest?.(".instruments-hotspot-wrap")) setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, true);
    };
  }, [open, setOpen]);
}

export function Hotspots({
  chapterId,
  kind,
  palette,
  visible,
}: {
  chapterId: string;
  kind: InstrumentKind;
  palette: { paper: string; ink: string; accent: string };
  visible: boolean;
}) {
  const open = useExploreStore((s) => s.open);
  const setOpen = useExploreStore((s) => s.setOpen);

  if (!visible) return null;

  return (
    <>
      {hotspots[kind].map((h, i) => {
        const id = `${chapterId}-${i}`;
        const isOpen = open === id;
        // Markers right of the instrument axis open their card to the left.
        const flip = h.position[0] > 0;
        return (
          <Html key={id} position={h.position} center zIndexRange={[5, 0]}>
            <div
              className={`instruments-hotspot-wrap ${fell.variable}`}
              style={
                {
                  "--paper": palette.paper,
                  "--ink": palette.ink,
                  "--gold": palette.accent,
                } as React.CSSProperties
              }
            >
              <button
                type="button"
                className={`instruments-hotspot${isOpen ? " is-open" : ""}`}
                aria-expanded={isOpen}
                aria-label={`Note ${h.label}`}
                onClick={() => setOpen(isOpen ? null : id)}
                // Keyboard focus opens the note; a mouse press must not, or
                // the focus would open it and the click would close it again.
                onFocus={(e) => {
                  if (e.target.matches(":focus-visible")) setOpen(id);
                }}
              >
                {h.label}
              </button>
              {isOpen ? (
                <div
                  className={`instruments-hotspot-card${flip ? " is-left" : ""}`}
                  role="note"
                >
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
