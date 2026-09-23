import { describe, expect, it } from "vitest";
import {
  cameraU,
  greetBob,
  idleSway,
  isTyping,
  overlayOpacity,
  screenDistance,
  screenFade,
  swivelAmount,
} from "./introTimeline";

describe("intro timeline", () => {
  it("faces the desk at rest and turns to the camera for the greeting", () => {
    expect(swivelAmount(0)).toBe(0);
    expect(swivelAmount(0.05)).toBe(0);
    expect(swivelAmount(0.3)).toBe(1);
    expect(swivelAmount(0.45)).toBe(1);
  });
  it("turns back before the camera reaches the screen", () => {
    expect(swivelAmount(0.7)).toBe(0);
    expect(swivelAmount(1)).toBe(0);
  });
  it("bobs only while the greeting is held", () => {
    expect(greetBob(0, 1).lift).toBe(0);
    expect(Math.abs(greetBob(0.4, 1).lift)).toBeGreaterThan(0);
  });
  it("sways gently and types only before the turn", () => {
    expect(Math.abs(idleSway(2))).toBeLessThanOrEqual(0.02);
    expect(isTyping(0)).toBe(true);
    expect(isTyping(0.2)).toBe(false);
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
