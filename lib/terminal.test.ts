import { describe, expect, it } from "vitest";
import { PHASE } from "./network";
import {
  ATLAS_H,
  ATLAS_W,
  COL_LINES,
  COL_W,
  header,
  LINE_H,
  LOG_LINES,
  logLines,
  MAX_CHARS,
  printedLines,
  screenDim,
  screenScroll,
  STATUS_STRIPS,
  STATUS_Y,
  statusStrip,
  statusText,
  STRIP_STRIDE,
  taskTemplates,
  templateOrigin,
  VERDICT_Y,
  verdictCode,
  VIEW_LINES,
} from "./terminal";

describe("templates", () => {
  it("has four of each kind, each printing LOG_LINES lines that fit the column", () => {
    for (const kind of ["DEV", "TEST", "FEAT"] as const)
      expect(taskTemplates.filter((t) => t.kind === kind).length).toBe(4);
    for (const t of taskTemplates) {
      const lines = logLines(t);
      expect(lines.length).toBe(LOG_LINES);
      for (const l of lines) expect(l.length).toBeLessThanOrEqual(MAX_CHARS);
      expect(header(t).length).toBeLessThanOrEqual(MAX_CHARS);
      expect(header(t)).toContain(t.kind);
    }
  });
  it("is deterministic", () => {
    expect(logLines(taskTemplates[0])).toEqual(logLines(taskTemplates[0]));
  });
});

describe("screen timing", () => {
  it("prints nothing before spin up, the header at spin up, everything by the verdict", () => {
    expect(printedLines(0)).toBe(0);
    expect(printedLines(PHASE.up)).toBe(1);
    expect(printedLines(PHASE.verdict)).toBe(1 + LOG_LINES);
    expect(printedLines(1)).toBe(1 + LOG_LINES);
    let last = 0;
    for (let f = 0; f <= 1; f += 0.02) {
      const p = printedLines(f);
      expect(p).toBeGreaterThanOrEqual(last);
      last = p;
    }
  });
  it("scrolls only once the window is full and never past the column", () => {
    expect(screenScroll(3)).toBe(0);
    expect(screenScroll(VIEW_LINES)).toBe(0);
    expect(screenScroll(VIEW_LINES + 2)).toBe(2);
    expect(screenScroll(99)).toBe(1 + LOG_LINES - VIEW_LINES);
  });
  it("shows the verdict from the verdict phase and dims through teardown", () => {
    expect(verdictCode(0.5, true)).toBe(0);
    expect(verdictCode(PHASE.verdict, true)).toBe(1);
    expect(verdictCode(PHASE.verdict, false)).toBe(2);
    expect(screenDim(0.5)).toBe(1);
    expect(screenDim(PHASE.gap)).toBeCloseTo(0.15, 6);
  });
});

describe("status strips", () => {
  it("maps running counts and retrying to strips with text", () => {
    expect(statusStrip(3, false)).toBe(3);
    expect(statusStrip(20, false)).toBe(STATUS_STRIPS - 2);
    expect(statusStrip(3, true)).toBe(STATUS_STRIPS - 1);
    expect(statusText(3)).toBe("3 running");
    expect(statusText(STATUS_STRIPS - 1)).toBe("retrying");
  });
});

describe("atlas layout", () => {
  it("tiles the template columns without overlap and stacks the strips below", () => {
    const seen = new Set<string>();
    taskTemplates.forEach((_, i) => {
      const o = templateOrigin(i);
      expect(o.x % COL_W).toBe(0);
      expect(o.y % (COL_LINES * LINE_H)).toBe(0);
      expect(o.x + COL_W).toBeLessThanOrEqual(ATLAS_W);
      expect(o.y + COL_LINES * LINE_H).toBeLessThanOrEqual(VERDICT_Y);
      const k = `${o.x},${o.y}`;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    });
    expect(STATUS_Y).toBe(VERDICT_Y + 2 * STRIP_STRIDE);
    expect(ATLAS_H).toBe(STATUS_Y + STATUS_STRIPS * STRIP_STRIDE);
  });
});
