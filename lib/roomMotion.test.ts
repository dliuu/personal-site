import { describe, expect, it } from "vitest";
import {
  easeOutCubic,
  introBlend,
  parallaxOffset,
  shouldInvalidate,
} from "./roomMotion";

describe("easeOutCubic", () => {
  it("starts at 0 and ends at 1", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });
  it("is above linear in the middle", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
  it("clamps input", () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });
});

describe("introBlend", () => {
  it("is 0 at start and not done", () => {
    expect(introBlend(0, 1.5)).toEqual({ t: 0, done: false });
  });
  it("is eased mid-way", () => {
    const { t, done } = introBlend(0.75, 1.5);
    expect(t).toBeCloseTo(easeOutCubic(0.5), 6);
    expect(done).toBe(false);
  });
  it("is 1 and done at or after duration", () => {
    expect(introBlend(1.5, 1.5)).toEqual({ t: 1, done: true });
    expect(introBlend(9, 1.5)).toEqual({ t: 1, done: true });
  });
  it("is done immediately for non-positive duration", () => {
    expect(introBlend(0, 0)).toEqual({ t: 1, done: true });
  });
});

describe("parallaxOffset", () => {
  it("scales x fully and y by half", () => {
    expect(parallaxOffset({ x: 1, y: 1 }, 0.15, false)).toEqual([
      0.15, 0.075, 0,
    ]);
    expect(parallaxOffset({ x: -1, y: 0 }, 0.15, false)).toEqual([-0.15, 0, 0]);
  });
  it("is zero under reduced motion", () => {
    expect(parallaxOffset({ x: 1, y: 1 }, 0.15, true)).toEqual([0, 0, 0]);
  });
  it("treats NaN as 0", () => {
    expect(parallaxOffset({ x: NaN, y: NaN }, 0.15, false)).toEqual([0, 0, 0]);
  });
});

describe("shouldInvalidate", () => {
  const base = {
    converged: true,
    introDone: true,
    parallaxSettled: true,
    panelOpen: false,
  };
  it("is false when everything is settled", () => {
    expect(shouldInvalidate(base)).toBe(false);
  });
  it("is true while progress converges", () => {
    expect(shouldInvalidate({ ...base, converged: false })).toBe(true);
  });
  it("is true while the intro plays", () => {
    expect(shouldInvalidate({ ...base, introDone: false })).toBe(true);
  });
  it("is true while parallax settles, unless a panel is open", () => {
    expect(shouldInvalidate({ ...base, parallaxSettled: false })).toBe(true);
    expect(
      shouldInvalidate({ ...base, parallaxSettled: false, panelOpen: true }),
    ).toBe(false);
  });
});
