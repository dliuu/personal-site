import { describe, expect, it } from "vitest";
import {
  beatAt,
  expandAmount,
  pinTint,
  smooth,
  plateYaw,
  stagger,
  tickAlive,
  washAmount,
} from "./beats";

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

describe("washAmount", () => {
  it("scales expand to 0.85", () => {
    expect(washAmount(0)).toBe(0);
    expect(washAmount(1)).toBeCloseTo(0.85, 6);
  });
});
describe("pinTint", () => {
  it("is full in beat 0, fades early in beat 1, off after", () => {
    expect(pinTint(0, 0.7)).toBe(1);
    expect(pinTint(1, 0)).toBe(1);
    expect(pinTint(1, 0.3)).toBe(0);
    expect(pinTint(1, 0.15)).toBeCloseTo(0.5, 6);
    expect(pinTint(2, 0)).toBe(0);
    expect(pinTint(3, 1)).toBe(0);
  });
});
describe("tickAlive", () => {
  it("shows nothing before beat 2", () => {
    expect(tickAlive(0, 1, 1)).toBe(false);
  });
  it("keeps the four cardinal ticks", () => {
    for (const i of [0, 6, 12, 18]) {
      expect(tickAlive(i, 2, 1)).toBe(true);
      expect(tickAlive(i, 3, 0.5)).toBe(true);
    }
  });
  it("kills the doomed ticks in index order over beat 2", () => {
    expect(tickAlive(1, 2, 0)).toBe(true);
    expect(tickAlive(1, 2, 0.06)).toBe(false);
    expect(tickAlive(23, 2, 0.99)).toBe(true);
    expect(tickAlive(23, 2, 1)).toBe(true);
    expect(tickAlive(23, 3, 0)).toBe(false);
  });
});
describe("plateYaw", () => {
  it("turns from the Atlantic to New York in beat 0 and holds there in beat 1", () => {
    expect(plateYaw(0, 0)).toBeCloseTo(-0.9, 6);
    expect(plateYaw(0, 1)).toBeCloseTo(0, 6);
    expect(plateYaw(1, 0.5)).toBe(0);
  });
  it("decelerates to a stop across beat 2 and stays still in beat 3", () => {
    expect(plateYaw(2, 0)).toBe(0);
    expect(plateYaw(2, 0.5)).toBeCloseTo(0.45, 6);
    expect(plateYaw(2, 1)).toBeCloseTo(0.6, 6);
    expect(plateYaw(3, 0)).toBeCloseTo(0.6, 6);
  });
});
