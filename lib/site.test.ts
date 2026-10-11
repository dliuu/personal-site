import { describe, expect, it } from "vitest";
import {
  CAP_TOWER,
  CLAD_LAG,
  LAYOUT,
  RISE_ORDER,
  TOWERS,
  WORKERS,
  capYaw,
  cladAmount,
  craneJib,
  craneMast,
  craneState,
  fencePanels,
  floorAmount,
  floorsRaised,
  hoistY,
  netAmount,
  pilePositions,
  scaffoldSegments,
  towerHeight,
  workerPose,
} from "./site";

describe("towers", () => {
  it("stand finished in the band and rise through the plate", () => {
    TOWERS.forEach((t, i) => {
      expect(floorsRaised(false, 0, i)).toBe(t.floors);
      expect(floorsRaised(true, 0, i)).toBe(0);
      expect(floorsRaised(true, 0.95, i)).toBeCloseTo(t.floors);
    });
  });
  it("rise in order, the capped tower last", () => {
    expect(RISE_ORDER[RISE_ORDER.length - 1]).toBe(CAP_TOWER);
    expect([...RISE_ORDER].sort()).toEqual(TOWERS.map((_, i) => i));
    const first = RISE_ORDER[0];
    expect(floorsRaised(true, 0.2, first)).toBeGreaterThan(0);
    expect(floorsRaised(true, 0.2, CAP_TOWER)).toBe(0);
  });
  it("raise floors one at a time, cladding a few floors behind", () => {
    expect(floorAmount(2.5, 1)).toBe(1);
    expect(floorAmount(2.5, 2)).toBe(0.5);
    expect(floorAmount(2.5, 3)).toBe(0);
    expect(cladAmount(2.5 + CLAD_LAG, 2)).toBe(0.5);
    expect(cladAmount(2.5, 2)).toBe(0);
  });
  it("net the two floors under the working deck, and none once topped out", () => {
    expect(netAmount(5.5, 5, 10)).toBe(0.5);
    expect(netAmount(5.5, 4, 10)).toBe(1);
    expect(netAmount(5.5, 3, 10)).toBe(0);
    expect(netAmount(5.5, 6, 10)).toBe(0);
    expect(netAmount(10, 9, 10)).toBe(0);
  });
  it("the capped tower is the tallest", () => {
    const h = towerHeight(TOWERS[CAP_TOWER]);
    TOWERS.forEach((t) => expect(towerHeight(t)).toBeLessThanOrEqual(h));
  });
});

describe("craneState", () => {
  it("holds the cap set and the hook up in the band", () => {
    const s = craneState(false, 0, 0, 5, 12);
    expect(s.seat).toBe(1);
    expect(s.hook).toBe(0);
    expect(s.yaw).toBeCloseTo(capYaw());
  });
  it("turns idly with the cap up until the last beat", () => {
    const a = craneState(true, 1, 0.5, 5, 0);
    const b = craneState(true, 1, 0.5, 5, 6);
    expect(a.seat).toBe(0);
    expect(a.yaw).not.toBeCloseTo(b.yaw);
  });
  it("swings to the tower, lowers the cap, then raises the hook", () => {
    const swung = craneState(true, 4, 0.35, 5, 3);
    expect(swung.yaw).toBeCloseTo(capYaw());
    expect(swung.seat).toBe(0);
    const mid = craneState(true, 4, 0.55, 5, 3);
    expect(mid.seat).toBeGreaterThan(0);
    expect(mid.hook).toBeCloseTo(mid.seat);
    const done = craneState(true, 4, 1, 5, 3);
    expect(done.seat).toBe(1);
    expect(done.hook).toBe(0);
  });
});

describe("crane lattice", () => {
  it("has chords the full height of the mast and braces in every section", () => {
    const segs = craneMast();
    expect(segs.length).toBeGreaterThan(100);
    expect(
      segs.filter(([a, b]) => b[1] - a[1] === LAYOUT.crane.mastH).length,
    ).toBe(4);
  });
  it("runs the jib out to its length and the counter-jib back", () => {
    const { truss, pendants } = craneJib();
    const xs = truss.flatMap(([a, b]) => [a[0], b[0]]);
    expect(Math.max(...xs)).toBeCloseTo(LAYOUT.crane.jib);
    expect(Math.min(...xs)).toBeCloseTo(-LAYOUT.crane.counter);
    expect(pendants.length).toBe(3);
  });
});

describe("site dressing", () => {
  it("fences the plot with a gap at the gate", () => {
    const panels = fencePanels();
    expect(panels.length).toBeGreaterThan(40);
    const front = panels.filter((p) => p.z > LAYOUT.plotD / 2 - 0.01);
    const [g0, g1] = LAYOUT.gate;
    expect(front.some((p) => p.x > g0 && p.x < g1)).toBe(false);
    expect(front.length).toBeGreaterThan(5);
  });
  it("scaffolds the street face over the first lifts", () => {
    const segs = scaffoldSegments(TOWERS[0], 4);
    expect(segs.length).toBeGreaterThan(20);
    for (const [a, b] of segs) {
      expect(a[2]).toBeGreaterThan(TOWERS[0].z + TOWERS[0].d / 2);
      expect(b[1]).toBeLessThanOrEqual(4 * 0.14 + 1e-9);
    }
  });
  it("the hoist stays between the ground and the top", () => {
    for (let s = 0; s < 14; s += 0.5) {
      const y = hoistY(s, 1.2);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1.2);
    }
    expect(hoistY(0, 1.2)).toBe(0);
    expect(hoistY(7, 1.2)).toBeCloseTo(1.2);
  });
  it("workers wait for a deck, and the yard crew is always there", () => {
    const none = TOWERS.map(() => 0);
    const all = TOWERS.map((t) => t.floors);
    const onTower = WORKERS.find((w) => w.tower >= 0)!;
    const inYard = WORKERS.find((w) => w.tower < 0)!;
    expect(workerPose(onTower, none).visible).toBe(false);
    const up = workerPose(onTower, all);
    expect(up.visible).toBe(true);
    expect(up.y).toBeCloseTo(
      LAYOUT.groundY + TOWERS[onTower.tower].floors * 0.14 + 0.015,
    );
    expect(workerPose(inYard, none).visible).toBe(true);
  });
  it("piles sit inside the capped tower's footprint", () => {
    const t = TOWERS[CAP_TOWER];
    for (const [x, z] of pilePositions()) {
      expect(Math.abs(x - t.x)).toBeLessThan(t.w / 2);
      expect(Math.abs(z - t.z)).toBeLessThan(t.d / 2);
    }
  });
});
