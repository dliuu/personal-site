import { describe, expect, it } from "vitest";
import { clamp01, lerp, progressToSection, scrollToProgress } from "./progress";

describe("clamp01", () => {
  it("clamps below and above", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.25)).toBe(0.25);
  });
  it("treats NaN as 0", () => {
    expect(clamp01(NaN)).toBe(0);
  });
});

describe("lerp", () => {
  it("interpolates", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
  });
});

describe("progressToSection", () => {
  it("maps 0 and 1 to first and last", () => {
    expect(progressToSection(0, 4)).toBe(0);
    expect(progressToSection(1, 4)).toBe(3);
  });
  it("rounds to nearest keyframe", () => {
    expect(progressToSection(0.34, 4)).toBe(1); // 0.34 * 3 = 1.02
    expect(progressToSection(0.5, 4)).toBe(2); // 1.5 rounds up
    expect(progressToSection(0.49, 4)).toBe(1);
  });
  it("returns 0 for count <= 1", () => {
    expect(progressToSection(0.9, 1)).toBe(0);
    expect(progressToSection(0.9, 0)).toBe(0);
  });
  it("clamps out-of-range progress", () => {
    expect(progressToSection(-3, 4)).toBe(0);
    expect(progressToSection(7, 4)).toBe(3);
  });
});

describe("scrollToProgress", () => {
  it("maps scroll position across the scrollable range", () => {
    expect(scrollToProgress(0, 4000, 1000)).toBe(0);
    expect(scrollToProgress(1500, 4000, 1000)).toBe(0.5);
    expect(scrollToProgress(3000, 4000, 1000)).toBe(1);
  });
  it("returns 0 when nothing can scroll", () => {
    expect(scrollToProgress(0, 1000, 1000)).toBe(0);
    expect(scrollToProgress(50, 500, 1000)).toBe(0);
  });
});
