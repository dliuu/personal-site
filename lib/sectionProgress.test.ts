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
      depth: 0.5,
      tall: false,
      kind: "chapter",
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
    expect(s).toEqual({
      active: 0,
      progress: 0,
      continuous: 0,
      depth: -0.3,
      tall: false,
      kind: "chapter",
    });
  });
  it("returns zeros for no sections and guards zero height", () => {
    expect(sectionProgress([], vh)).toEqual({
      active: 0,
      progress: 0,
      continuous: 0,
      depth: 0,
      tall: false,
      kind: "chapter",
    });
    expect(sectionProgress([{ top: 0, height: 0 }], vh).progress).toBe(0);
  });
  it("flags sections taller than the viewport", () => {
    expect(sectionProgress([{ top: 0, height: 3000 }], 1000).tall).toBe(true);
    expect(sectionProgress([{ top: 0, height: 1000 }], 1000).tall).toBe(false);
  });
});

describe("sectionProgress depth", () => {
  const vh = 1000;
  it("measures viewport-heights into the active section", () => {
    expect(sectionProgress([{ top: 0, height: 3000 }], vh).depth).toBeCloseTo(
      0.5,
      6,
    );
    expect(
      sectionProgress([{ top: -1000, height: 3000 }], vh).depth,
    ).toBeCloseTo(1.5, 6);
  });
  it("is 0 with no sections", () => {
    expect(sectionProgress([], vh).depth).toBe(0);
  });
});

describe("sectionProgress with a tall section", () => {
  const vh = 1000;
  // one section 3000px tall starting at y=0 in page coords
  const tall = (scrollY: number) => [{ top: 0 - scrollY, height: 3000 }];
  it("ramps to 0.5 over the first half viewport", () => {
    expect(sectionProgress(tall(0), vh).progress).toBeCloseTo(0.5, 6); // centre at 500 = vh/2
    expect(sectionProgress(tall(-250), vh).progress).toBeCloseTo(0.25, 6); // centre 250 into the section
  });
  it("holds 0.5 through the middle", () => {
    expect(sectionProgress(tall(1000), vh).progress).toBe(0.5); // centre at 1500
    expect(sectionProgress(tall(1900), vh).progress).toBe(0.5); // centre at 2400
  });
  it("ramps to 1 over the last half viewport and is continuous at the joins", () => {
    expect(sectionProgress(tall(2000), vh).progress).toBeCloseTo(0.5, 6); // centre 2500 = height - vh/2
    expect(sectionProgress(tall(2250), vh).progress).toBeCloseTo(0.75, 6); // centre 2750
    expect(sectionProgress(tall(2500), vh).progress).toBeCloseTo(1, 6); // centre 3000
  });
  it("leaves viewport-sized sections unchanged", () => {
    expect(sectionProgress([{ top: -500, height: 1000 }], vh).progress).toBe(1);
  });
});

describe("sectionProgress plate sections", () => {
  const vh = 1000;
  // chapter 1000 tall at page y 0, then a 3000 plate
  const rects = (scrollY: number) => [
    { top: 0 - scrollY, height: 1000 },
    { top: 1000 - scrollY, height: 3000, kind: "plate" as const },
  ];
  it("is 0 when the plate's top reaches the viewport top", () => {
    const s = sectionProgress(rects(1000), vh);
    expect(s.active).toBe(1);
    expect(s.kind).toBe("plate");
    expect(s.progress).toBeCloseTo(0, 6);
  });
  it("is linear across the pinned range", () => {
    expect(sectionProgress(rects(2000), vh).progress).toBeCloseTo(0.5, 6);
    expect(sectionProgress(rects(3000), vh).progress).toBeCloseTo(1, 6);
  });
  it("reports chapter kind by default", () => {
    expect(sectionProgress(rects(0), vh).kind).toBe("chapter");
  });
  it("falls back to plain progress when the plate is no taller than the viewport", () => {
    const short = (scrollY: number) => [
      { top: 0 - scrollY, height: 1000 },
      { top: 1000 - scrollY, height: 1000, kind: "plate" as const },
    ];
    const s = sectionProgress(short(1250), vh);
    expect(s.active).toBe(1);
    expect(s.kind).toBe("plate");
    expect(s.progress).toBeCloseTo(0.75, 6);
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
