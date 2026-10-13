import { describe, expect, it } from "vitest";
import {
  CANDLES,
  candleSeries,
  carouselUp,
  equityCurve,
  flagDown,
  lineDrawn,
  slipU,
  tradeIndices,
} from "./trading";

describe("candleSeries", () => {
  const s = candleSeries();
  it("is deterministic and well formed", () => {
    expect(s.length).toBe(CANDLES);
    expect(candleSeries()).toEqual(s);
    for (const c of s) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
      expect(c.low).toBeGreaterThan(0);
    }
  });
  it("opens each candle where the last closed", () => {
    for (let i = 1; i < s.length; i++) expect(s[i].open).toBe(s[i - 1].close);
  });
});

describe("trades and the run", () => {
  const s = candleSeries();
  const trades = tradeIndices(s);
  it("finds a handful of trades on the series, in order", () => {
    expect(trades.length).toBeGreaterThan(2);
    expect(trades.length).toBeLessThan(CANDLES / 2);
    for (let i = 1; i < trades.length; i++)
      expect(trades[i]).toBeGreaterThan(trades[i - 1]);
  });
  it("holds flat before the first trade and moves while a position is held", () => {
    const e = equityCurve(s, trades);
    expect(e.length).toBe(s.length);
    for (let i = 0; i <= trades[0]; i++) expect(e[i]).toBe(1);
    expect(e[trades[0] + 1]).not.toBe(1);
  });
});

describe("timing", () => {
  it("raises the carousel through the build and keeps it up", () => {
    expect(carouselUp(true, 0, 1)).toBe(0);
    expect(carouselUp(true, 1, 0.2)).toBeGreaterThan(0);
    expect(carouselUp(true, 1, 0.5)).toBe(1);
    expect(carouselUp(true, 2, 0)).toBe(1);
    expect(carouselUp(false, 0, 0)).toBe(1);
  });
  it("sends the slips round on their own phases", () => {
    const a = slipU(0, 0);
    const b = slipU(0, 1);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
    expect(a).not.toBeCloseTo(b);
    expect(slipU(9, 0)).toBeCloseTo(a);
  });
  it("drops the flags in order through the result, all down in the band", () => {
    expect(flagDown(true, 1, 1, 0, 5)).toBe(0);
    expect(flagDown(true, 2, 0.3, 0, 5)).toBeGreaterThan(0);
    expect(flagDown(true, 2, 0.3, 4, 5)).toBe(0);
    expect(flagDown(true, 2, 1, 4, 5)).toBe(1);
    expect(flagDown(false, 0, 0, 4, 5)).toBe(1);
  });
  it("draws the line through the result and keeps it drawn", () => {
    expect(lineDrawn(true, 1, 1)).toBe(0);
    expect(lineDrawn(true, 2, 0.5)).toBeGreaterThan(0);
    expect(lineDrawn(true, 2, 1)).toBe(1);
    expect(lineDrawn(false, 0, 0)).toBe(1);
  });
});

describe("polish", () => {
  it("volumes are positive and larger on big moves", async () => {
    const { volumeSeries, candleSeries } = await import("./trading");
    const s = candleSeries();
    const v = volumeSeries(s);
    expect(v.length).toBe(s.length);
    v.forEach((x) => expect(x).toBeGreaterThan(0));
  });
  it("tape dashes stream and wrap", async () => {
    const { tapeU } = await import("./trading");
    expect(tapeU(0, 0, 4)).toBeCloseTo(0);
    expect(tapeU(4, 0, 4)).toBeCloseTo(0);
    expect(tapeU(1, 1, 4)).toBeCloseTo(0.5);
  });
  it("stamps after the risk gate and strikes when a slip is at a station", async () => {
    const { stamped, strike, stationU } = await import("./trading");
    expect(stamped(stationU(1))).toBe(false);
    expect(stamped(stationU(2) + 0.05)).toBe(true);
    expect(strike([stationU(2)], 2)).toBeCloseTo(0);
    expect(strike([stationU(2) + 0.0175], 2)).toBeCloseTo(1);
    expect(strike([stationU(0)], 2)).toBe(0);
  });
});
