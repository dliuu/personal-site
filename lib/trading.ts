import { smooth, stagger } from "./beats";
import { hash01 } from "./network";

/**
 * The trading agents: a market as a ridge of candles, a carousel of four
 * agent stations above it, orders that circle the stations and land on the
 * ridge as flags, and the run's line drawn along it. Pure series and
 * timing; instruments/projects/Trading.tsx draws it.
 */

export const CANDLES = 40;
export const STATIONS = ["research", "strategy", "risk", "execution"] as const;
export const SLIPS = 12;

export type Candle = { open: number; close: number; high: number; low: number };

/** A deterministic random walk, prices around 1 with a gentle upward drift. */
export function candleSeries(n = CANDLES, seed = 7): Candle[] {
  const out: Candle[] = [];
  let price = 1;
  for (let i = 0; i < n; i++) {
    const open = price;
    const move = (hash01(seed * 100 + i) - 0.47) * 0.16;
    const close = Math.max(0.3, open + move);
    const wick = 0.03 + 0.05 * hash01(seed * 100 + i + 1000);
    out.push({
      open,
      close,
      high: Math.max(open, close) + wick,
      low: Math.max(0.1, Math.min(open, close) - wick),
    });
    price = close;
  }
  return out;
}

/** Candles the loop traded on: a buy after two closes up, in order. */
export function tradeIndices(series: Candle[]): number[] {
  const out: number[] = [];
  for (let i = 2; i < series.length; i++) {
    const up = (c: Candle) => c.close > c.open;
    if (up(series[i - 1]) && up(series[i - 2]) && !up(series[i])) out.push(i);
  }
  return out;
}

/** The run's line: starts at 1 and follows the price between trades, flat elsewhere (a position is held from one trade to the next). */
export function equityCurve(series: Candle[], trades: number[]): number[] {
  const out: number[] = [];
  let equity = 1;
  let held = false;
  for (let i = 0; i < series.length; i++) {
    if (held) equity *= series[i].close / series[i].open;
    out.push(equity);
    if (trades.includes(i)) held = !held;
  }
  return out;
}

/** 0..1 presence of the carousel: it rises through the build beat and stands in the band. */
export function carouselUp(active: boolean, beat: number, t: number): number {
  if (!active) return 1;
  if (beat === 0) return 0;
  if (beat === 1) return smooth(0, 0.35, t);
  return 1;
}

/** Where slip i is on its circuit of the stations, 0..1, at `time`. */
export function slipU(time: number, i: number): number {
  const u = (time / 9 + hash01(300 + i)) % 1;
  return u < 0 ? u + 1 : u;
}

/** 0..1 of flag j (of n) landed on the ridge: in order through the result beat, all down in the band. */
export function flagDown(
  active: boolean,
  beat: number,
  t: number,
  j: number,
  n: number,
): number {
  if (!active) return 1;
  if (beat < 2) return 0;
  return stagger(smooth(0, 0.6, t), j, n, 0.5);
}

/** Fraction of the run's line drawn: through the result beat, full in the band. */
export function lineDrawn(active: boolean, beat: number, t: number): number {
  if (!active) return 1;
  if (beat < 2) return 0;
  return smooth(0.1, 0.85, t);
}

/** Volume under each candle: a deterministic bar, larger on big moves. */
export function volumeSeries(series: Candle[]): number[] {
  return series.map(
    (c, i) => 0.25 + 0.6 * hash01(4000 + i) + 2.5 * Math.abs(c.close - c.open),
  );
}

/** Where tape dash i (of n) is along the feed, 0..1, streaming in at `time`. */
export function tapeU(time: number, i: number, n: number): number {
  const u = (time / 4 + i / n) % 1;
  return u < 0 ? u + 1 : u;
}

/** Station k sits at this fraction of a slip's circuit (research first, execution last). */
export function stationU(k: number): number {
  return k / STATIONS.length;
}

/** A slip is stamped once it has passed the risk gate on this circuit. */
export function stamped(u: number): boolean {
  return u > stationU(2) + 0.02;
}

/** 0..1 strike of a station's mechanism (the gate's bar, the hammer) when a slip is at it: the nearest slip within the window. */
export function strike(slips: number[], k: number, window = 0.035): number {
  const at = stationU(k);
  let best = 0;
  for (const u of slips) {
    const d = Math.abs(u - at);
    if (d < window) best = Math.max(best, 1 - d / window);
  }
  return Math.sin(best * Math.PI);
}
