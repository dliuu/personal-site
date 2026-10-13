import { describe, expect, it } from "vitest";
import { fanPose, scrub } from "./folio";

describe("fanPose", () => {
  it("stacks the plates squared up at t = 0", () => {
    for (let i = 0; i < 4; i++) {
      const p = fanPose(i, 4, 0);
      expect(p.x).toBeCloseTo(0);
      expect(p.rz).toBeCloseTo(0);
      expect(p.y).toBeCloseTo(i * 0.028);
    }
  });
  it("spreads them symmetrically about the middle", () => {
    const a = fanPose(0, 3, 1);
    const b = fanPose(2, 3, 1);
    expect(fanPose(1, 3, 1).x).toBeCloseTo(0);
    expect(a.x).toBeCloseTo(-b.x);
    expect(a.rz).toBeCloseTo(-b.rz);
  });
});

describe("scrub", () => {
  it("advances with the wheel and clamps at both ends", () => {
    expect(scrub(0, 1200, 2400)).toBeCloseTo(0.5);
    expect(scrub(0.9, 1200, 2400)).toBe(1);
    expect(scrub(0.1, -1200, 2400)).toBe(0);
  });
});
