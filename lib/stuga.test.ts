import { describe, expect, it } from "vitest";
import {
  LONE_WEEKS,
  OWNERS,
  WEEKS,
  neighboursUp,
  sliceGap,
  weekAngle,
  weekLit,
  weekOwner,
} from "./stuga";

describe("weekOwner", () => {
  it("gives every owner weeks, in monthly blocks", () => {
    const counts = Array(OWNERS).fill(0);
    for (let k = 0; k < WEEKS; k++) counts[weekOwner(k)]++;
    counts.forEach((c) => expect(c).toBeGreaterThanOrEqual(4));
    expect(weekOwner(0)).toBe(weekOwner(3));
    expect(weekOwner(4)).not.toBe(weekOwner(3));
  });
});

describe("weekLit", () => {
  it("lights only the lone weeks in the problem beat", () => {
    for (let k = 0; k < WEEKS; k++)
      expect(weekLit(true, 0, 0.5, k)).toBe(LONE_WEEKS.includes(k) ? 1 : 0);
  });
  it("fills the ring in order through the build, and is full after", () => {
    expect(weekLit(true, 1, 0.05, 0)).toBeGreaterThan(0);
    expect(weekLit(true, 1, 0.05, 40)).toBe(0);
    for (let k = 0; k < WEEKS; k++) {
      expect(weekLit(true, 1, 1, k)).toBe(1);
      expect(weekLit(true, 2, 0, k)).toBe(1);
      expect(weekLit(false, 0, 0, k)).toBe(1);
    }
  });
});

describe("the house", () => {
  it("splits into shares through the build and seats again for the result", () => {
    expect(sliceGap(true, 0, 0.9)).toBe(0);
    expect(sliceGap(true, 1, 0.1)).toBeGreaterThan(0);
    expect(sliceGap(true, 1, 0.5)).toBe(1);
    expect(sliceGap(true, 2, 0)).toBe(1);
    expect(sliceGap(true, 2, 0.5)).toBe(0);
    expect(sliceGap(false, 1, 0.5)).toBe(0);
  });
  it("gains its neighbours in the result and keeps them in the band", () => {
    expect(neighboursUp(true, 1, 1)).toBe(0);
    expect(neighboursUp(true, 2, 0.45)).toBeGreaterThan(0);
    expect(neighboursUp(true, 2, 0.8)).toBe(1);
    expect(neighboursUp(false, 0, 0)).toBe(1);
  });
  it("puts week 0 at the front of the ring and runs clockwise", () => {
    expect(Math.cos(weekAngle(0))).toBeCloseTo(0);
    expect(Math.sin(weekAngle(0))).toBeCloseTo(1);
    expect(weekAngle(1)).toBeLessThan(weekAngle(0));
  });
});
