import { describe, expect, it } from "vitest";
import {
  cameraU,
  overlayOpacity,
  pose,
  screenDistance,
  screenFade,
  standAmount,
  waveAmount,
} from "./introTimeline";

describe("intro timeline", () => {
  it("is seated at rest and standing by the end of the stand beat", () => {
    expect(standAmount(0)).toBe(0);
    expect(standAmount(0.32)).toBe(1);
    expect(pose(0, 0, true).rootY).toBeCloseTo(0.47, 6);
    expect(pose(0.5, 0, true).rootY).toBeCloseTo(0.93, 6);
  });
  it("waves only inside the wave beat", () => {
    expect(waveAmount(0.3)).toBe(0);
    expect(waveAmount(0.45)).toBe(1);
    expect(waveAmount(0.6)).toBe(0);
    expect(Math.abs(pose(0.45, 0, true).waveR)).toBeGreaterThan(0);
  });
  it("types only at rest", () => {
    const a = pose(0, 0.05, false).foreArmL;
    const b = pose(0, 0.2, false).foreArmL;
    expect(a).not.toBeCloseTo(b, 4);
    expect(pose(0, 0.05, true).foreArmL).toBeCloseTo(
      pose(0, 0.2, true).foreArmL,
      6,
    );
  });
  it("fades the overlay and the screen at the right places", () => {
    expect(overlayOpacity(0.2)).toBe(1);
    expect(overlayOpacity(0.4)).toBe(0);
    expect(screenFade(0.85)).toBe(0);
    expect(screenFade(1)).toBe(1);
  });
  it("puts camera keyframes at their progress values", () => {
    expect(cameraU(0)).toBe(0);
    expect(cameraU(0.32)).toBeCloseTo(1 / 3, 6);
    expect(cameraU(0.7)).toBeCloseTo(2 / 3, 6);
    expect(cameraU(1)).toBe(1);
  });
  it("picks the screen distance that covers both axes", () => {
    const wide = screenDistance(0.585, 0.33, 45, 2.4);
    const tall = screenDistance(0.585, 0.33, 45, 0.5);
    expect(wide).toBeLessThan(tall);
    expect(tall).toBeCloseTo(0.33 / (2 * Math.tan(Math.PI / 8)), 6);
  });
});
