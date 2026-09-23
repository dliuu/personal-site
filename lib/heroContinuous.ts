import { PLATE_EXIT, smooth } from "./beats";

export type HeroSection = {
  chapter: number;
  kind: "chapter" | "plate";
  /** A plate that ends by diving into its hero: no hand-off to the next. */
  dive?: boolean;
};

/** Hero-continuous value: chapter index plus a 0..1 blend toward the next hero. */
export function heroContinuous(
  sections: HeroSection[],
  active: number,
  progress: number,
): number {
  const sec = sections[active] ?? sections[0];
  if (sec.kind === "plate") {
    // A dive holds its hero to the end; the cut to the next section hides
    // the hand-off. Otherwise hold at the half point, then hand off while
    // the plate shrinks back (matches expandAmount's exit ramp).
    if (sec.dive) return sec.chapter + 0.5;
    return sec.chapter + 0.5 + 0.5 * smooth(PLATE_EXIT, 1, progress);
  }
  const next = sections[active + 1];
  if (next && next.kind === "plate")
    return sec.chapter + Math.min(progress, 0.5);
  return sec.chapter + progress;
}
