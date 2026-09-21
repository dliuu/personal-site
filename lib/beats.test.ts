import { describe, expect, it } from "vitest";
import { beatAt, expandAmount, smooth, stagger } from "./beats";

describe("beatAt", () => {
  it("splits progress into equal beats", () => {
    expect(beatAt(0, 4)).toEqual({ index: 0, t: 0 });
    expect(beatAt(0.125, 4)).toEqual({ index: 0, t: 0.5 });
    expect(beatAt(0.25, 4).index).toBe(1);
    expect(beatAt(1, 4)).toEqual({ index: 3, t: 1 });
  });
  it("clamps progress outside 0..1", () => {
    expect(beatAt(-0.2, 4)).toEqual({ index: 0, t: 0 });
    expect(beatAt(1.5, 4)).toEqual({ index: 3, t: 1 });
  });
});
describe("stagger", () => {
  it("runs items in order and finishes at 1", () => {
    expect(stagger(0, 0, 4)).toBe(0);
    expect(stagger(1, 3, 4)).toBe(1);
    expect(stagger(0.5, 0, 4)).toBe(1);
    expect(stagger(0.5, 3, 4)).toBe(0);
  });
  it("is monotone in p", () => {
    let last = 0;
    for (let p = 0; p <= 1; p += 0.05) {
      const v = stagger(p, 2, 5);
      expect(v).toBeGreaterThanOrEqual(last - 1e-9);
      last = v;
    }
  });
});
describe("expandAmount", () => {
  it("is 0 at the ends and 1 in the middle", () => {
    expect(expandAmount(0)).toBe(0);
    expect(expandAmount(0.5)).toBe(1);
    expect(expandAmount(1)).toBe(0);
  });
  it("is fully open across the hold and ramps at the ends", () => {
    expect(expandAmount(0.12)).toBe(1);
    expect(expandAmount(0.88)).toBe(1);
    expect(expandAmount(0.06)).toBeCloseTo(0.5, 2);
  });
});
describe("smooth", () => {
  it("clamps and eases", () => {
    expect(smooth(0, 1, -1)).toBe(0);
    expect(smooth(0, 1, 2)).toBe(1);
    expect(smooth(0, 1, 0.5)).toBe(0.5);
  });
});
