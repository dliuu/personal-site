import { describe, expect, it } from "vitest";
import { frameLerp, lineOpacity, lineScale, solidScale } from "./drawIn";

describe("draw-in formulas", () => {
  it("lines complete before solids start to matter", () => {
    expect(lineScale(0)).toBe(0);
    expect(lineScale(0.625)).toBeCloseTo(1, 6);
    expect(lineScale(1)).toBe(1);
    expect(solidScale(0.35)).toBe(0);
    expect(solidScale(0.2)).toBe(0);
    expect(solidScale(1)).toBeCloseTo(1, 6);
  });
  it("contour opacity runs 1 → 0.5", () => {
    expect(lineOpacity(0)).toBe(1);
    expect(lineOpacity(1)).toBe(0.5);
  });
  it("frameLerp matches k at 60 Hz and halves at 120 Hz", () => {
    expect(frameLerp(0.12, 1 / 60)).toBeCloseTo(0.12, 6);
    expect(frameLerp(0.12, 1 / 120)).toBeCloseTo(1 - Math.sqrt(0.88), 6);
    expect(frameLerp(0.12, 0)).toBe(0);
  });
});
