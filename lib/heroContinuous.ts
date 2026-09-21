import { smooth } from "./beats";

export type HeroSection = { chapter: number; kind: "chapter" | "plate" };

/** Hero-continuous value: chapter index plus a 0..1 blend toward the next hero. */
export function heroContinuous(
  sections: HeroSection[],
  active: number,
  progress: number,
): number {
  const sec = sections[active] ?? sections[0];
  if (sec.kind === "plate") {
    // Hold at the half point, then hand off to the next hero while the plate
    // shrinks back (matches expandAmount's 0.88..1 ramp).
    return sec.chapter + 0.5 + 0.5 * smooth(0.88, 1, progress);
  }
  const next = sections[active + 1];
  if (next && next.kind === "plate")
    return sec.chapter + Math.min(progress, 0.5);
  return sec.chapter + progress;
}
