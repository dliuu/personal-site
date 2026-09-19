import { describe, expect, it } from "vitest";
import { heroWeight, sectionProgress } from "./sectionProgress";

const vh = 1000;
// three sections of 1000px stacked; rects are viewport-relative tops
const stacked = (scrollY: number) => [
  { top: 0 - scrollY, height: 1000 },
  { top: 1000 - scrollY, height: 1000 },
  { top: 2000 - scrollY, height: 1000 },
];

describe("sectionProgress", () => {
  it("is section 0 at progress 0.5 on load (centre at 500)", () => {
    expect(sectionProgress(stacked(0), vh)).toEqual({
      active: 0,
      progress: 0.5,
      continuous: 0.5,
    });
  });
  it("moves to section 1 when the centre crosses its top", () => {
    expect(sectionProgress(stacked(500), vh).active).toBe(1);
    expect(sectionProgress(stacked(500), vh).progress).toBe(0);
    expect(sectionProgress(stacked(499), vh).active).toBe(0);
  });
  it("clamps at the last section", () => {
    const s = sectionProgress(stacked(5000), vh);
    expect(s.active).toBe(2);
    expect(s.progress).toBe(1);
    expect(s.continuous).toBe(3);
  });
  it("handles an offset first section (centre above it)", () => {
    const s = sectionProgress([{ top: 800, height: 1000 }], vh);
    expect(s).toEqual({ active: 0, progress: 0, continuous: 0 });
  });
  it("returns zeros for no sections and guards zero height", () => {
    expect(sectionProgress([], vh)).toEqual({
      active: 0,
      progress: 0,
      continuous: 0,
    });
    expect(sectionProgress([{ top: 0, height: 0 }], vh).progress).toBe(0);
  });
});

describe("heroWeight", () => {
  it("peaks at the chapter centre and fades over one chapter", () => {
    expect(heroWeight(1, 1.5)).toBe(1);
    expect(heroWeight(1, 1.0)).toBeCloseTo(0.5, 6);
    expect(heroWeight(1, 2.0)).toBeCloseTo(0.5, 6);
    expect(heroWeight(1, 0.5)).toBe(0);
    expect(heroWeight(1, 2.5)).toBe(0);
  });
  it("neighbours sum to 1 between centres", () => {
    expect(heroWeight(0, 0.8) + heroWeight(1, 0.8)).toBeCloseTo(1, 6);
  });
});
