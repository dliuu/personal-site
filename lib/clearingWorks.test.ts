import { describe, expect, it } from "vitest";
import {
  buildSchedule,
  CELLS,
  CYCLE,
  iso,
  JOBS,
  jobsAt,
  metricsAt,
  REJECT_EVERY,
  SCHEDULE,
  STILL_U,
  WORKS_FRAMES,
  WORKS_ENTRY,
  WORKS_TRAVEL,
  worksEmphasis,
  worksFrame,
} from "./clearingWorks";

const SAMPLES = Array.from({ length: 97 }, (_, i) => (i / 97) * CYCLE);

describe("buildSchedule", () => {
  it("is deterministic and ordered within every job", () => {
    expect(buildSchedule()).toEqual(SCHEDULE);
    SCHEDULE.forEach((j) => {
      expect(j.seat).toBeGreaterThanOrEqual(j.spawn);
      expect(j.done).toBeGreaterThan(j.seat);
      j.passes.forEach(([a, b]) => expect(b).toBeGreaterThan(a));
      expect(j.settle).toBeGreaterThan(j.chute);
      expect(j.settle).toBeLessThan(CYCLE);
    });
  });
  it("never runs two jobs in one cell at once", () => {
    for (let c = 0; c < CELLS; c++) {
      const runs = SCHEDULE.filter((j) => j.cell === c).sort(
        (a, b) => a.seat - b.seat,
      );
      for (let i = 1; i < runs.length; i++)
        expect(runs[i].seat).toBeGreaterThanOrEqual(runs[i - 1].done);
    }
  });
  it("the press is a strict capacity-one resource", () => {
    const passes = SCHEDULE.flatMap((j) => j.passes).sort(
      (a, b) => a[0] - b[0],
    );
    for (let i = 1; i < passes.length; i++)
      expect(passes[i][0]).toBeGreaterThanOrEqual(passes[i - 1][1]);
  });
  it("rejects reworks: every REJECT_EVERY-th job stamps twice, the rest once", () => {
    SCHEDULE.forEach((j, i) => {
      const rejected = i % REJECT_EVERY === 2;
      expect(j.rejected).toBe(rejected);
      expect(j.passes.length).toBe(rejected ? 2 : 1);
      if (j.review) expect(j.review[0]).toBe(j.passes[0][1]);
    });
    expect(SCHEDULE.some((j) => j.rejected)).toBe(true);
  });
});

describe("jobsAt", () => {
  it("conserves: dispatched = queued + running + in flight + review + settled", () => {
    for (const u of SAMPLES) {
      const m = metricsAt(u);
      expect(m.queued + m.live + m.inFlight + m.review + m.settled).toBe(
        m.dispatched,
      );
    }
  });
  it("every job is in exactly one phase, and the books close before the wrap", () => {
    const end = jobsAt(CYCLE - 1e-6);
    expect(end.every((s) => s.phase === "settled")).toBe(true);
    expect(metricsAt(CYCLE - 1e-6).settled).toBe(JOBS);
    expect(jobsAt(0).every((s) => s.phase !== "settled")).toBe(true);
  });
  it("wraps at CYCLE and stays deterministic", () => {
    expect(jobsAt(STILL_U)).toEqual(jobsAt(STILL_U + CYCLE));
    expect(jobsAt(STILL_U)).toEqual(jobsAt(STILL_U));
  });
  it("queue positions are unique and start at the head", () => {
    for (const u of SAMPLES) {
      const queued = jobsAt(u).filter((s) => s.phase === "queued");
      const ranks = queued.map((s) => s.qi).sort((a, b) => a - b);
      expect(ranks).toEqual(ranks.map((_, i) => i));
    }
  });
});

describe("metricsAt", () => {
  it("strikes count both passes and pass rate reflects the rejects", () => {
    const m = metricsAt(CYCLE - 1e-6);
    const rejects = SCHEDULE.filter((j) => j.rejected).length;
    expect(m.strikes).toBe(JOBS + rejects);
    expect(m.stamped).toBe(JOBS);
    expect(m.passRate).toBeCloseTo((JOBS - rejects) / JOBS, 6);
    expect(metricsAt(0).passRate).toBe(1);
  });
});

describe("worksFrame", () => {
  it("travels from the previous key and holds, continuous across beats", () => {
    const close = (a: { x: number; y: number; k: number }, b: typeof a) => {
      expect(a.x).toBeCloseTo(b.x, 9);
      expect(a.y).toBeCloseTo(b.y, 9);
      expect(a.k).toBeCloseTo(b.k, 9);
    };
    close(worksFrame(0, 0), WORKS_ENTRY);
    close(worksFrame(0, WORKS_TRAVEL), WORKS_FRAMES[0]);
    close(worksFrame(0, 1), WORKS_FRAMES[0]);
    close(worksFrame(1, 0), WORKS_FRAMES[0]);
    close(worksFrame(2, 1), WORKS_FRAMES[2]);
  });
});

describe("worksEmphasis", () => {
  it("lifts one layer per beat and rests on the dispatch floor", () => {
    expect(worksEmphasis(false, 0).dispatch).toBeGreaterThan(
      worksEmphasis(false, 0).gate,
    );
    expect(worksEmphasis(true, 0).dispatch).toBe(1);
    expect(worksEmphasis(true, 1).gate).toBe(1);
    expect(worksEmphasis(true, 2).vaults).toBe(1);
  });
});

describe("iso", () => {
  it("projects +x right-down, +z left-down and +y straight up", () => {
    const [ox, oy] = iso(0, 0, 0);
    expect([ox, oy]).toEqual([0, 0]);
    const [x1, y1] = iso(1, 0, 0);
    expect(x1).toBeGreaterThan(0);
    expect(y1).toBeGreaterThan(0);
    const [x2, y2] = iso(0, 0, 1);
    expect(x2).toBeLessThan(0);
    expect(y2).toBeGreaterThan(0);
    expect(iso(0, 1, 0)[1]).toBe(-1);
  });
});
