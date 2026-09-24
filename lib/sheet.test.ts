import { describe, expect, it } from "vitest";
import { TENANTS } from "./site";
import {
  ATLAS,
  FLOOR_LABELS,
  hatchRect,
  paintDimensions,
  paintFloorLabels,
  paintHatches,
  paintNoteBlock,
  paintSheet,
  paintTitleBlock,
  RECTS,
} from "./sheet";

/** A 2D context stand-in that records calls and the text it was given. */
function fakeCtx(width = ATLAS, height = ATLAS) {
  const calls: string[] = [];
  const text: string[] = [];
  const grad = { addColorStop() {} };
  const ctx = new Proxy(
    { canvas: { width, height } },
    {
      get(target, key: string) {
        if (key in target) return (target as Record<string, unknown>)[key];
        if (key === "createLinearGradient" || key === "createRadialGradient")
          return () => grad;
        if (key === "measureText") return () => ({ width: 40 });
        return (...args: unknown[]) => {
          calls.push(key);
          if (key === "fillText" || key === "strokeText")
            text.push(String(args[0]));
          return args;
        };
      },
      set() {
        return true;
      },
    },
  );
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls, text };
}

describe("atlas rects", () => {
  it("keeps every rect inside the sheet", () => {
    for (const r of Object.values(RECTS)) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(1);
      expect(r.y + r.h).toBeLessThanOrEqual(1);
      expect(r.w).toBeGreaterThan(0);
      expect(r.h).toBeGreaterThan(0);
    }
  });
  it("never overlaps two rects", () => {
    const rs = Object.values(RECTS);
    for (let i = 0; i < rs.length; i++)
      for (let j = i + 1; j < rs.length; j++) {
        const a = rs[i];
        const b = rs[j];
        const apart =
          a.x + a.w <= b.x ||
          b.x + b.w <= a.x ||
          a.y + a.h <= b.y ||
          b.y + b.h <= a.y;
        expect(apart).toBe(true);
      }
  });
});

describe("painters", () => {
  it("names the four loan products on the floor labels", () => {
    const { ctx, text } = fakeCtx();
    paintFloorLabels(ctx, "#3d2418");
    expect(FLOOR_LABELS.length).toBe(4);
    for (const label of FLOOR_LABELS) expect(text).toContain(label);
  });
  it("puts the platform name in the title block", () => {
    const { ctx, text } = fakeCtx();
    paintTitleBlock(ctx, "#3d2418", "#c49a3c");
    expect(text.join(" ")).toContain("FISH");
  });
  it("draws the note block and the dimension numerals", () => {
    const note = fakeCtx();
    paintNoteBlock(note.ctx, "#3d2418");
    expect(note.calls).toContain("fillText");
    const dim = fakeCtx();
    paintDimensions(dim.ctx, "#3d2418");
    expect(dim.text.join(" ")).toContain("56");
  });
  it("paints the whole sheet without throwing", () => {
    const { ctx, calls } = fakeCtx();
    expect(() => paintSheet(ctx, "#3d2418", "#c49a3c")).not.toThrow();
    expect(calls.length).toBeGreaterThan(0);
  });
});

describe("hatches", () => {
  it("gives every institution its own cell inside the hatch region", () => {
    const seen = new Set<string>();
    for (let i = 0; i < TENANTS; i++) {
      const r = hatchRect(i);
      expect(r.x).toBeGreaterThanOrEqual(RECTS.hatch.x);
      expect(r.y).toBeGreaterThanOrEqual(RECTS.hatch.y);
      expect(r.x + r.w).toBeLessThanOrEqual(
        RECTS.hatch.x + RECTS.hatch.w + 1e-9,
      );
      expect(r.y + r.h).toBeLessThanOrEqual(
        RECTS.hatch.y + RECTS.hatch.h + 1e-9,
      );
      seen.add(`${r.x},${r.y}`);
    }
    expect(seen.size).toBe(TENANTS);
  });
  it("wraps a second-lap slot index back onto the first lap's cell", () => {
    // Slots run 0..23 over twelve institutions, so slot 12 is institution 0's
    // second face and must land on the same hatch.
    expect(hatchRect(TENANTS)).toEqual(hatchRect(0));
    expect(hatchRect(TENANTS + 5)).toEqual(hatchRect(5));
  });
  it("rules every institution's cell", () => {
    const { ctx, calls } = fakeCtx();
    expect(() => paintHatches(ctx, "#3d2418")).not.toThrow();
    expect(calls.filter((c) => c === "stroke").length).toBeGreaterThanOrEqual(
      TENANTS,
    );
  });
});
