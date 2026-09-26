/**
 * Frozen-clock mode for the screenshot loop. With `?still` in the URL the
 * frameloop stops running itself and the page waits to be stepped
 * (`components/Stepper.tsx`), so a frame is a function of the step count
 * alone: the same commit and the same scroll position give the same pixels,
 * whatever the machine's frame rate.
 */

/** Seconds each stepped frame advances the clock. */
export const STILL_STEP = 1 / 60;

export function stillMode(): boolean {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("still")
  );
}
