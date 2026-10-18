/**
 * The frontispiece gate. The page opens on a static first screen; nothing
 * beyond it (the 3D chunk, then its models and textures) is asked for until
 * that screen has settled: its fonts are in, the document's load event has
 * fired and two frames have painted. A timeout bounds the wait so a stalled
 * font never holds the rest of the site back.
 */
export type GateEnv = {
  fontsReady: Promise<unknown>;
  loaded: Promise<unknown>;
  frame: (cb: () => void) => void;
  timer: (cb: () => void, ms: number) => void;
};

export type GateResult = "settled" | "timeout";

export function firstScreenSettled(
  env: GateEnv,
  timeoutMs: number,
): Promise<GateResult> {
  const settled = Promise.all([env.fontsReady, env.loaded])
    .catch(() => undefined)
    .then(
      () =>
        new Promise<GateResult>((resolve) =>
          env.frame(() => env.frame(() => resolve("settled"))),
        ),
    );
  const timeout = new Promise<GateResult>((resolve) =>
    env.timer(() => resolve("timeout"), timeoutMs),
  );
  return Promise.race([settled, timeout]);
}

/** The live document's signals, for firstScreenSettled. */
export function browserGateEnv(): GateEnv {
  return {
    fontsReady: document.fonts ? document.fonts.ready : Promise.resolve(),
    loaded:
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) =>
            window.addEventListener("load", () => resolve(undefined), {
              once: true,
            }),
          ),
    frame: (cb) => {
      requestAnimationFrame(() => cb());
    },
    timer: (cb, ms) => {
      window.setTimeout(cb, ms);
    },
  };
}
