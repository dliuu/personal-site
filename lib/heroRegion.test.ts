import { describe, expect, it } from "vitest";
import { heroPlacement } from "./heroRegion";

describe("heroPlacement", () => {
  it("places the hero right of the 540px column on wide viewports", () => {
    const p = heroPlacement({
      width: 1440,
      height: 900,
      vpWidth: 7.95,
      vpHeight: 4.97,
    });
    // column: start 300, end 840 → f = 0.583; region 0.583..0.97, centre 0.777
    expect(p.x).toBeCloseTo((0.7767 - 0.5) * 7.95, 2);
    expect(p.y).toBe(0);
    expect(p.scale).toBeCloseTo(
      Math.min(0.95, (((0.97 - 0.5833) / 2) * 7.95) / 1.75),
      2,
    );
    // left edge of the hero (x - scale*1.75) must be right of the column end in world units
    const colEndWorld = (0.5833 - 0.5) * 7.95;
    expect(p.x - p.scale * 1.75).toBeGreaterThan(colEndWorld);
  });
  it("uses a top band on narrow viewports", () => {
    const p = heroPlacement({
      width: 390,
      height: 844,
      vpWidth: 2.3,
      vpHeight: 4.97,
    });
    expect(p.x).toBe(0);
    expect(p.y).toBeCloseTo(0.5 * 4.97 * 0.55, 6);
    expect(p.scale).toBeCloseTo(0.55, 6);
    // hero bottom (y - scale*1.75) stays in the top 42% of the viewport
    const bottomFrac = (4.97 / 2 - (p.y - p.scale * 1.75)) / 4.97;
    expect(bottomFrac).toBeLessThan(0.42);
  });
  it("never scales above 0.95 on very wide viewports", () => {
    const p = heroPlacement({
      width: 3000,
      height: 900,
      vpWidth: 16.5,
      vpHeight: 4.97,
    });
    expect(p.scale).toBe(0.95);
  });
});
