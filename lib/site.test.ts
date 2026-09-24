import { describe, expect, it } from "vitest";
import { BAYS, bayCount, FLOORS, stage, tenantAt, TENANTS } from "./site";

describe("hinge", () => {
  it("is flat before the walls rise and square when beat i ends", () => {
    expect(stage(0, 0).hinge.every((a) => a === 0)).toBe(true);
    const end = stage(0, 1).hinge;
    expect(end.length).toBe(4);
    end.forEach((a) => expect(a).toBeCloseTo(Math.PI / 2, 6));
  });
  it("staggers: each wall leads the next, and none exceeds square", () => {
    const h = stage(0, 0.55).hinge;
    for (let i = 1; i < h.length; i++)
      expect(h[i - 1]).toBeGreaterThanOrEqual(h[i]);
    h.forEach((a) => {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(Math.PI / 2);
    });
  });
  it("stays square once the plan is up, in every later beat", () => {
    for (const b of [1, 2, 3])
      stage(b, 0.5).hinge.forEach((a) => expect(a).toBeCloseTo(Math.PI / 2, 6));
  });
});

describe("frame and cladding", () => {
  it("inks no floors at the start and all of them by the end of beat ii", () => {
    expect(stage(0, 0).floors).toBe(0);
    expect(stage(1, 1).floors).toBe(FLOORS);
  });
  it("clads monotonically through beat ii", () => {
    let prevClad = -1;
    for (let i = 0; i <= 10; i++) {
      const s = stage(1, i / 10);
      expect(s.clad).toBeGreaterThanOrEqual(prevClad);
      prevClad = s.clad;
    }
    expect(stage(1, 1).clad).toBeCloseTo(1, 6);
  });
  it("cycles twelve tenants across the twenty-four slots without gaps", () => {
    const seen = new Set(Array.from({ length: 24 }, (_, i) => tenantAt(i)));
    expect(seen.size).toBe(TENANTS);
    for (let i = 0; i < TENANTS; i++) expect(seen.has(i)).toBe(true);
  });
});

describe("beat iii", () => {
  it("closes the dimension arrows across the beat", () => {
    expect(stage(2, 0).dim).toBe(0);
    expect(stage(2, 1).dim).toBeCloseTo(1, 6);
  });
  it("steps the bays from one to five off the traffic curve", () => {
    expect(bayCount(0)).toBe(1);
    expect(bayCount(1)).toBe(BAYS);
    let prev = 0;
    for (let i = 0; i <= 20; i++) {
      const n = bayCount(i / 20);
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
  });
});

describe("beat iv", () => {
  it("keeps the draw phase in [0, 1) across the beat", () => {
    for (let i = 0; i <= 300; i++) {
      const d = stage(3, i / 300).draw;
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThan(1);
    }
  });
  it("runs exactly three passes down the columns, resetting at each", () => {
    // The phase drives a repeating pattern: it climbs within a pass and drops
    // back to 0 at the next, so three drops means three passes.
    let drops = 0;
    let prev = stage(3, 0).draw;
    for (let i = 1; i <= 3000; i++) {
      const d = stage(3, i / 3000).draw;
      if (d < prev) drops++;
      else expect(d).toBeGreaterThan(prev);
      prev = d;
    }
    expect(drops).toBe(3);
  });
  it("drops the topping-out beam into its seat by the end", () => {
    expect(stage(3, 0)).toHaveProperty("beam");
    expect(stage(3, 0).beam).toBeGreaterThan(0);
    expect(stage(3, 1).beam).toBeCloseTo(0, 6);
  });
  it("leaves the beam aloft in every earlier beat", () => {
    for (const b of [0, 1, 2]) expect(stage(b, 1).beam).toBeGreaterThan(0);
  });
});
