import { describe, expect, it } from "vitest";
import {
  edgeDraw,
  gatePulse,
  hash01,
  layerEmphasis,
  layoutNodes,
  lifecycle,
  nodeLife,
  packetU,
  PILLAR_REST,
  pillarRise,
  TIERS,
} from "./network";

describe("layoutNodes", () => {
  const nodes = layoutNodes();
  it("places every tier's nodes near its ring, ranked inner first", () => {
    expect(nodes.length).toBe(TIERS.reduce((n, t) => n + t.count, 0));
    nodes.forEach((n, i) => {
      const r = Math.hypot(n.x, n.z);
      expect(r).toBeGreaterThan(TIERS[n.tier].radius * 0.9);
      expect(r).toBeLessThan(TIERS[n.tier].radius * 1.1);
      expect(n.rank).toBe(i);
      expect(n.phase).toBeGreaterThanOrEqual(0);
      expect(n.phase).toBeLessThan(1);
    });
    expect(nodes[0].tier).toBe(0);
    expect(nodes[nodes.length - 1].tier).toBe(TIERS.length - 1);
  });
  it("is deterministic", () => {
    expect(layoutNodes()).toEqual(nodes);
    expect(hash01(7)).toBe(hash01(7));
  });
});

describe("lifecycle", () => {
  it("spins up, runs at 1, retires, and leaves a gap before the next cycle", () => {
    expect(lifecycle(0)).toBe(0);
    expect(lifecycle(0.5)).toBe(1);
    expect(lifecycle(0.97)).toBe(0);
    expect(lifecycle(1.5)).toBe(1);
  });
  it("nodeLife offsets by phase and period", () => {
    expect(nodeLife(4.5, 0)).toBe(1);
    expect(nodeLife(0, 0.5)).toBe(1);
    expect(nodeLife(0, 0, 9)).toBe(0);
  });
});

describe("layerEmphasis", () => {
  it("lifts one layer per beat and rests on the agents", () => {
    expect(layerEmphasis(false, 0).agents).toBeGreaterThan(
      layerEmphasis(false, 0).compliance,
    );
    expect(layerEmphasis(true, 0).agents).toBe(1);
    expect(layerEmphasis(true, 1).compliance).toBe(1);
    expect(layerEmphasis(true, 2).substrate).toBe(1);
  });
});

describe("edgeDraw and pillarRise", () => {
  it("draws edges out from the core over beat 0 and whole elsewhere", () => {
    expect(edgeDraw(true, 0, 0, 0, 10)).toBe(0);
    expect(edgeDraw(true, 0, 1, 9, 10)).toBe(1);
    expect(edgeDraw(true, 0, 0.5, 0, 10)).toBeGreaterThan(
      edgeDraw(true, 0, 0.5, 9, 10),
    );
    expect(edgeDraw(false, 0, 0, 0, 10)).toBe(1);
    expect(edgeDraw(true, 1, 0, 0, 10)).toBe(1);
  });
  it("keeps pillars at a stub until beat 2, then raises them in order", () => {
    expect(pillarRise(false, 0, 1, 0, 6)).toBe(PILLAR_REST);
    expect(pillarRise(true, 1, 1, 0, 6)).toBe(PILLAR_REST);
    expect(pillarRise(true, 2, 0, 0, 6)).toBe(PILLAR_REST);
    expect(pillarRise(true, 2, 1, 5, 6)).toBe(1);
    expect(pillarRise(true, 2, 0.4, 0, 6)).toBeGreaterThan(
      pillarRise(true, 2, 0.4, 5, 6),
    );
  });
});

describe("packetU and gatePulse", () => {
  it("packets wrap along their edge", () => {
    expect(packetU(0, 0.25, 1)).toBeCloseTo(0.25, 6);
    expect(packetU(2, 0.25, 1)).toBeCloseTo(0.25, 6);
    expect(packetU(0.5, 0.75, 1)).toBeCloseTo(0.25, 6);
  });
  it("gates fire in turn and decay", () => {
    const step = 0.22;
    expect(gatePulse(0, 0, 12, step)).toBe(1);
    expect(gatePulse(step * 3, 3, 12, step)).toBe(1);
    expect(gatePulse(step * 3, 0, 12, step)).toBe(0);
    expect(gatePulse(step * 12, 0, 12, step)).toBe(1);
  });
});
