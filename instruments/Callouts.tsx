"use client";

import { Html } from "@react-three/drei";
import type { Vector3 } from "three";
import { beatAt } from "@/lib/beats";
import { TRAVEL } from "@/lib/plateCamera";
import { useSectionsStore } from "@/store/useSectionsStore";
import { sections, type PlateBeat } from "./chapters";
import { useProjectStore } from "./useProjectStore";
import { fell } from "./fonts";

const NUMERALS = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"];

/**
 * Callout cards anchored to points on the globe: a dot at the anchor, a leader
 * line that draws itself, then the card. Shown once the camera has travelled to
 * the beat's place; beats without an anchor use the docked captions instead.
 */
export function Callouts({
  beats,
  anchors,
  sectionIndex,
  projectId,
  palette,
}: {
  beats: PlateBeat[];
  anchors: (Vector3 | null)[];
  /** The plate section whose scroll reads these beats... */
  sectionIndex?: number;
  /** ...or the open project whose wheel does. */
  projectId?: string;
  palette: { paper: string; ink: string; accent: string };
}) {
  const fromSection = useSectionsStore((s) => {
    if (sectionIndex === undefined) return -1;
    if (s.active !== sectionIndex || s.kind !== "plate") return -1;
    const b = beatAt(s.progress, beats.length);
    return b.t > TRAVEL ? b.index : -1;
  });
  const fromProject = useProjectStore((s) => {
    if (projectId === undefined || s.open !== projectId) return -1;
    const b = beatAt(s.progress, beats.length);
    // The first card is up from the moment the project opens.
    return b.index === 0 || b.t > TRAVEL ? b.index : -1;
  });
  // A featured project's scroll plate reads the section like any plate.
  const plateIndex = sections.findIndex(
    (x) => x.kind === "plate" && x.project === projectId,
  );
  const fromProjectPlate = useSectionsStore((s) => {
    if (plateIndex < 0 || s.active !== plateIndex || s.kind !== "plate")
      return -1;
    const b = beatAt(s.progress, beats.length);
    return b.t > TRAVEL ? b.index : -1;
  });
  const shown =
    projectId !== undefined
      ? Math.max(fromProject, fromProjectPlate)
      : fromSection;
  return (
    <>
      {beats.map((b, i) => {
        const a = anchors[i];
        if (!a) return null;
        return (
          <Html
            key={i}
            position={[a.x * 1.08, a.y * 1.08, a.z * 1.08]}
            center
            zIndexRange={[5, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div
              className={`instruments-callout ${fell.variable} is-${b.side ?? "right"}${shown === i ? " is-shown" : ""}`}
              style={
                {
                  "--paper": palette.paper,
                  "--ink": palette.ink,
                  "--gold": palette.accent,
                } as React.CSSProperties
              }
              aria-hidden={shown !== i}
            >
              <span className="instruments-callout-dot" />
              <span className="instruments-callout-leader" />
              <div className="instruments-callout-card">
                <span className="instruments-caption-num">{NUMERALS[i]}</span>
                <span className="instruments-caption-sub">{b.sub}</span>
                <p>{b.caption}</p>
                {projectId !== undefined && i < beats.length - 1 ? (
                  <span className="instruments-continue">
                    Scroll to continue <span aria-hidden>↓</span>
                  </span>
                ) : null}
              </div>
            </div>
          </Html>
        );
      })}
    </>
  );
}
