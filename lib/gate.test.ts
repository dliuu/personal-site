import { describe, expect, it } from "vitest";
import { firstScreenSettled, type GateEnv } from "./gate";

type Deferred = {
  promise: Promise<unknown>;
  resolve: () => void;
  reject: () => void;
};
function deferred(): Deferred {
  let resolve!: () => void;
  let reject!: () => void;
  const promise = new Promise<unknown>((res, rej) => {
    resolve = () => res(undefined);
    reject = () => rej(new Error("fonts"));
  });
  return { promise, resolve, reject };
}

/** A hand-cranked environment: frames and timers fire only when told to. */
function env() {
  const fonts = deferred();
  const loaded = deferred();
  const frames: (() => void)[] = [];
  const timers: { cb: () => void; ms: number }[] = [];
  const e: GateEnv = {
    fontsReady: fonts.promise,
    loaded: loaded.promise,
    frame: (cb) => frames.push(cb),
    timer: (cb, ms) => timers.push({ cb, ms }),
  };
  const flush = () => new Promise((r) => setTimeout(r, 0));
  return { e, fonts, loaded, frames, timers, flush };
}

async function state(p: Promise<unknown>): Promise<"pending" | unknown> {
  return Promise.race([p, Promise.resolve("pending")]);
}

describe("firstScreenSettled", () => {
  it("waits for fonts, load and two painted frames", async () => {
    const h = env();
    const p = firstScreenSettled(h.e, 2500);
    h.fonts.resolve();
    await h.flush();
    expect(await state(p)).toBe("pending");
    expect(h.frames).toHaveLength(0);
    h.loaded.resolve();
    await h.flush();
    expect(h.frames).toHaveLength(1);
    h.frames.shift()!();
    expect(h.frames).toHaveLength(1);
    expect(await state(p)).toBe("pending");
    h.frames.shift()!();
    expect(await p).toBe("settled");
  });

  it("gives up waiting at the timeout", async () => {
    const h = env();
    const p = firstScreenSettled(h.e, 2500);
    expect(h.timers).toEqual([{ cb: expect.any(Function), ms: 2500 }]);
    h.timers[0].cb();
    expect(await p).toBe("timeout");
  });

  it("treats a failed font load as settled", async () => {
    const h = env();
    const p = firstScreenSettled(h.e, 2500);
    h.fonts.reject();
    h.loaded.resolve();
    await h.flush();
    h.frames.shift()!();
    h.frames.shift()!();
    expect(await p).toBe("settled");
  });
});
