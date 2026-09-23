import { describe, expect, it } from "vitest";
import {
  breathe,
  flicker,
  keyPress,
  parallax,
  phonePulse,
  tailFlick,
  twinkle,
} from "./ambient";

describe("ambient motions", () => {
  it("twinkles within 0.85..1 with distinct phases", () => {
    for (const t of [0, 0.3, 1.7, 9]) {
      const a = twinkle(t, 0);
      expect(a).toBeGreaterThanOrEqual(0.85);
      expect(a).toBeLessThanOrEqual(1);
    }
    expect(twinkle(1, 0)).not.toBeCloseTo(twinkle(1, 2.1), 3);
  });
  it("breathes around 1", () => {
    expect(breathe(0)).toBeCloseTo(1, 6);
    expect(Math.abs(breathe(0.83) - 1)).toBeLessThanOrEqual(0.02);
  });
  it("flicks the tail briefly and rests otherwise", () => {
    expect(tailFlick(0.2, 1)).toBeGreaterThan(0);
    expect(tailFlick(3, 1)).toBe(0);
  });
  it("pulses the phone for 1.5 s then rests", () => {
    expect(phonePulse(0.5, 1)).toBeGreaterThan(0);
    expect(phonePulse(5, 1)).toBe(0);
  });
  it("presses only a few keys and only while typing", () => {
    const pressed = Array.from({ length: 60 }, (_, i) =>
      keyPress(0.37, i, true),
    ).filter((v) => v > 0);
    expect(pressed.length).toBeGreaterThan(0);
    expect(pressed.length).toBeLessThan(12);
    expect(keyPress(0.37, 3, false)).toBe(0);
  });
  it("halves parallax on touch", () => {
    expect(parallax(1, 0, false)[0]).toBeCloseTo(0.03, 6);
    expect(parallax(1, 0, true)[0]).toBeCloseTo(0.015, 6);
  });
  it("flickers within 1.5 %", () => {
    for (const t of [0, 0.01, 0.37, 2])
      expect(Math.abs(flicker(t) - 1)).toBeLessThanOrEqual(0.015);
  });
});
