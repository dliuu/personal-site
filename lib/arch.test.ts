import { describe, expect, it } from "vitest";
import { archVoussoirs } from "./arch";

describe("archVoussoirs", () => {
  it("places count blocks from the right pier to the left on the arc", () => {
    const v = archVoussoirs(3, 2);
    expect(v).toHaveLength(3);
    expect(v[0].position[0]).toBeGreaterThan(0);
    expect(v[2].position[0]).toBeLessThan(0);
    for (const b of v)
      expect(Math.hypot(b.position[0], b.position[1])).toBeCloseTo(2, 6);
  });
  it("puts the middle block at the crown with zero rotation", () => {
    const v = archVoussoirs(13, 1.3);
    expect(v[6].position[0]).toBeCloseTo(0, 6);
    expect(v[6].position[1]).toBeCloseTo(1.3, 6);
    expect(v[6].rotation).toBeCloseTo(0, 6);
  });
  it("is symmetric", () => {
    const v = archVoussoirs(5, 1);
    expect(v[0].position[0]).toBeCloseTo(-v[4].position[0], 6);
    expect(v[0].rotation).toBeCloseTo(-v[4].rotation, 6);
  });
  it("rejects bad input", () => {
    expect(() => archVoussoirs(0, 1)).toThrow();
    expect(() => archVoussoirs(3, 0)).toThrow();
  });
});
