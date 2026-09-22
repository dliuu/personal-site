import { describe, expect, it } from "vitest";
import { heroContinuous, type HeroSection } from "./heroContinuous";

const sections: HeroSection[] = [
  { chapter: 0, kind: "chapter" },
  { chapter: 1, kind: "chapter" },
  { chapter: 1, kind: "plate" },
  { chapter: 2, kind: "chapter" },
];

describe("heroContinuous", () => {
  it("is chapter + progress for a plain chapter", () => {
    expect(heroContinuous(sections, 0, 0)).toBe(0);
    expect(heroContinuous(sections, 0, 0.4)).toBeCloseTo(0.4, 6);
    expect(heroContinuous(sections, 3, 0.7)).toBeCloseTo(2.7, 6);
  });
  it("caps the chapter before a plate at the half point", () => {
    expect(heroContinuous(sections, 1, 0.3)).toBeCloseTo(1.3, 6);
    expect(heroContinuous(sections, 1, 0.8)).toBeCloseTo(1.5, 6);
  });
  it("holds through the plate and hands off on the way out", () => {
    expect(heroContinuous(sections, 2, 0)).toBeCloseTo(1.5, 6);
    expect(heroContinuous(sections, 2, 0.94)).toBeCloseTo(1.5, 6);
    expect(heroContinuous(sections, 2, 1)).toBeCloseTo(2, 6);
    const mid = heroContinuous(sections, 2, 0.97);
    expect(mid).toBeGreaterThan(1.5);
    expect(mid).toBeLessThan(2);
  });
  it("is continuous at both plate joins", () => {
    expect(heroContinuous(sections, 1, 1)).toBeCloseTo(
      heroContinuous(sections, 2, 0),
      6,
    );
    expect(heroContinuous(sections, 2, 1)).toBeCloseTo(
      heroContinuous(sections, 3, 0),
      6,
    );
  });
  it("falls back to the first section when active is out of range", () => {
    expect(heroContinuous(sections, 9, 0.25)).toBeCloseTo(0.25, 6);
  });
});
