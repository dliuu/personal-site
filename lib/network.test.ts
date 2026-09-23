import { describe, expect, it } from "vitest";
import {
  cycleAt,
  edgeDraw,
  hash01,
  iterateFlash,
  layerEmphasis,
  layoutOrchestrators,
  layoutWorkers,
  orchAngle,
  ORCH_R,
  ORCHESTRATORS,
  passes,
  PHASE,
  PILLAR_REST,
  pillarRise,
  resultU,
  slotOffset,
  taskU,
  verdictGlow,
  WORKERS_PER,
  workerScale,
} from "./network";

describe("layout", () => {
  it("puts orchestrator 0 at +z (facing the camera at lon −90) on a small circle", () => {
    const o = layoutOrchestrators();
    expect(o.length).toBe(ORCHESTRATORS);
    expect(o[0].x).toBeCloseTo(0, 6);
    expect(o[0].z).toBeCloseTo(ORCH_R, 6);
    expect(orchAngle(1) - orchAngle(0)).toBeCloseTo((2 * Math.PI) / 5, 6);
  });
  it("fans each orchestrator's workers across its own sector, outside the orchestrators", () => {
    const w = layoutWorkers();
    expect(w.length).toBe(ORCHESTRATORS * WORKERS_PER);
    w.forEach((n, i) => {
      expect(n.rank).toBe(i);
      expect(n.orch).toBe(Math.floor(i / WORKERS_PER));
      expect(Math.hypot(n.x, n.z)).toBeGreaterThan(ORCH_R * 1.5);
      const a = Math.atan2(n.z, n.x);
      const d = Math.atan2(
        Math.sin(a - orchAngle(n.orch)),
        Math.cos(a - orchAngle(n.orch)),
      );
      expect(Math.abs(d)).toBeLessThan(0.55);
    });
    expect(slotOffset(0)).toBeLessThan(0);
    expect(slotOffset(WORKERS_PER - 1)).toBeGreaterThan(0);
    expect(layoutWorkers()).toEqual(w);
    expect(hash01(7)).toBe(hash01(7));
  });
});

describe("lifecycle", () => {
  it("cycleAt splits time into generations by phase and period", () => {
    expect(cycleAt(0, 0, 9)).toEqual({ generation: 0, f: 0 });
    expect(cycleAt(4.5, 0, 9).f).toBeCloseTo(0.5, 6);
    expect(cycleAt(9, 0.25, 9)).toEqual({ generation: 1, f: 0.25 });
  });
  it("workerScale spins up, holds, and tears down before the gap", () => {
    expect(workerScale(0)).toBe(0);
    expect(workerScale(PHASE.up)).toBe(1);
    expect(workerScale(0.5)).toBe(1);
    expect(workerScale(PHASE.gap)).toBe(0);
  });
  it("the task goes down, then the result comes back up", () => {
    expect(taskU(0)).toBeNull();
    expect(taskU(PHASE.up)).toBe(0);
    expect(taskU((PHASE.up + PHASE.task) / 2)).toBeCloseTo(0.5, 6);
    expect(taskU(PHASE.task)).toBeNull();
    expect(resultU(0.5)).toBeNull();
    expect(resultU(PHASE.verdict)).toBe(0);
    expect(resultU(PHASE.back)).toBeNull();
  });
  it("verdict glow flashes at the verdict and dies with the container", () => {
    expect(verdictGlow(0.5)).toBe(0);
    expect(verdictGlow(PHASE.verdict)).toBe(1);
    expect(verdictGlow(PHASE.gap)).toBe(0);
  });
  it("verdicts are deterministic and roughly follow the pass rate", () => {
    expect(passes(3, 4)).toBe(passes(3, 4));
    let n = 0;
    for (let g = 0; g < 400; g++) if (passes(1, g)) n++;
    expect(n / 400).toBeGreaterThan(0.6);
    expect(n / 400).toBeLessThan(0.85);
  });
  it("only a failure makes the orchestrator flash, when the result lands", () => {
    expect(iterateFlash(PHASE.back, false)).toBe(0);
    expect(iterateFlash(PHASE.back, true)).toBe(1);
    expect(iterateFlash(0.5, true)).toBe(0);
    expect(iterateFlash(PHASE.gap, true)).toBe(0);
  });
});

describe("layerEmphasis", () => {
  it("lifts one layer per beat and rests on the orchestrators", () => {
    expect(layerEmphasis(false, 0).orchestrators).toBeGreaterThan(
      layerEmphasis(false, 0).verdicts,
    );
    expect(layerEmphasis(true, 0).orchestrators).toBe(1);
    expect(layerEmphasis(true, 1).verdicts).toBe(1);
    expect(layerEmphasis(true, 2).substrate).toBe(1);
  });
});

describe("edgeDraw and pillarRise", () => {
  it("draws edges out from the orchestrators over beat 0 and whole elsewhere", () => {
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
    expect(pillarRise(true, 2, 1, 5, 6)).toBe(1);
    expect(pillarRise(true, 2, 0.4, 0, 6)).toBeGreaterThan(
      pillarRise(true, 2, 0.4, 5, 6),
    );
  });
});
