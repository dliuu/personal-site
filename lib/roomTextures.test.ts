import { describe, expect, it } from "vitest";
import {
  paintCity,
  paintGobo,
  paintNature,
  paintNeon,
  paintNote,
  paintRug,
  paintSpine,
  paintSprite,
  paintWood,
  rng,
} from "./roomTextures";

/** A 2D context stand-in that records fills; gradients are inert objects. */
function fakeCtx(width: number, height: number) {
  const calls: string[] = [];
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
          return args;
        };
      },
      set() {
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

describe("room texture painters", () => {
  it("rng is seeded and stable", () => {
    const a = rng(7);
    const b = rng(7);
    expect(a()).toBe(b());
    expect(rng(7)()).not.toBe(rng(8)());
  });
  it("every painter fills the canvas and runs without a real canvas", () => {
    const painters: ((c: CanvasRenderingContext2D) => void)[] = [
      (c) => paintWood(c),
      (c) => paintRug(c),
      (c) => paintCity(c),
      (c) => paintSpine(c, "Title", "#7a3b3b", "serif"),
      (c) => paintNote(c, "ship the globe by friday", "#f6e27a", "cursive"),
      (c) => paintGobo(c),
      (c) => paintNature(c),
      (c) => paintSprite(c),
      (c) => paintNeon(c, "stay curious", "#ff8fb1", "cursive"),
    ];
    for (const paint of painters) {
      const { ctx, calls } = fakeCtx(64, 64);
      paint(ctx);
      expect(calls.filter((c) => c === "fillRect").length).toBeGreaterThan(0);
    }
  });
});
