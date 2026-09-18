import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { buildCurves, sampleAt, type Keyframe } from "./cameraPath";

const keyframes: Keyframe[] = [
  { position: [0, 1, 5], target: [0, 0, 0] },
  { position: [3, 1, 5], target: [3, 0, 0] },
  { position: [6, 2, 4], target: [6, 0, 0] },
  { position: [9, 1, 5], target: [9, 0, 0] },
];

describe("buildCurves", () => {
  it("rejects fewer than 2 keyframes", () => {
    expect(() => buildCurves([keyframes[0]])).toThrow(/at least 2/);
  });
  it("records the keyframe count", () => {
    expect(buildCurves(keyframes).count).toBe(4);
  });
});

describe("sampleAt", () => {
  const curves = buildCurves(keyframes);

  it("hits each keyframe at i/(n-1)", () => {
    keyframes.forEach((k, i) => {
      const t = i / (keyframes.length - 1);
      const s = sampleAt(curves, t);
      expect(s.position.x).toBeCloseTo(k.position[0], 5);
      expect(s.position.y).toBeCloseTo(k.position[1], 5);
      expect(s.position.z).toBeCloseTo(k.position[2], 5);
      expect(s.target.x).toBeCloseTo(k.target[0], 5);
    });
  });

  it("lands between neighbours at a midpoint", () => {
    const s = sampleAt(curves, 0.5 / 3); // halfway between keyframe 0 and 1
    expect(s.position.x).toBeGreaterThan(0);
    expect(s.position.x).toBeLessThan(3);
  });

  it("clamps t", () => {
    expect(sampleAt(curves, -1).position.x).toBeCloseTo(0, 5);
    expect(sampleAt(curves, 2).position.x).toBeCloseTo(9, 5);
  });

  it("writes into provided vectors", () => {
    const p = new Vector3();
    const tg = new Vector3();
    const s = sampleAt(curves, 1, p, tg);
    expect(s.position).toBe(p);
    expect(s.target).toBe(tg);
    expect(p.x).toBeCloseTo(9, 5);
  });
});
