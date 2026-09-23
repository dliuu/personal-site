/** The schedule of the room's procedural sound; the Web Audio graph lives in lab/. */

/** ii–V–I–vi in D♭ as MIDI note voicings, 8 s per chord. */
const CHORDS: number[][] = [
  [63, 66, 70, 73], // E♭m7
  [68, 72, 75, 78], // A♭7
  [61, 65, 68, 72], // D♭maj7
  [58, 61, 65, 68], // B♭m7
];
export const CHORD_SECONDS = 8;

export function chordAt(t: number): { index: number; notes: number[] } {
  const index = Math.floor(t / CHORD_SECONDS) % CHORDS.length;
  return { index, notes: CHORDS[index] };
}
export function midiToHz(n: number): number {
  return 440 * Math.pow(2, (n - 69) / 12);
}
/** Times (seconds) of vinyl clicks over `span` seconds: sparse, seeded, never regular. */
export function crackleTimes(seed: number, span: number): number[] {
  const out: number[] = [];
  let x = seed % 1 || 0.5;
  let t = 0;
  while (t < span) {
    x = (x * 9301 + 0.49297) % 1;
    t += 0.05 + x * 0.6;
    if (t < span) out.push(Number(t.toFixed(3)));
  }
  return out;
}

/** 72 BPM, two bars per chord, sixteen steps to the bar. */
export const BPM = 72;
export const STEPS_PER_BAR = 16;
export const SECONDS_PER_STEP = 60 / BPM / 4;
/** How far the off-eighths are pushed late, as a fraction of a step. */
export const SWING = 0.16;

/** Timing offset in seconds for a step, so the groove is not machine-straight. */
export function swingOffset(step: number): number {
  return step % 2 === 1 ? SECONDS_PER_STEP * SWING : 0;
}

export type Hit = { kick: boolean; snare: boolean; hat: number };

/**
 * One bar of a slow lofi groove: kick on 1 and the "and" of 3, snare on 2 and
 * 4, hats on the eighths with a dropped one so it breathes. `bar` varies the
 * fills without a second pattern.
 */
export function drumHits(step: number, bar = 0): Hit {
  const s = ((step % STEPS_PER_BAR) + STEPS_PER_BAR) % STEPS_PER_BAR;
  const kick = s === 0 || s === 10 || (bar % 4 === 3 && s === 14);
  const snare = s === 4 || s === 12;
  const hat =
    s % 2 === 0 && !(s === 6 && bar % 2 === 1) ? (s % 4 === 0 ? 1 : 0.55) : 0;
  return { kick, snare, hat };
}

/** The bass follows the chord root, an octave down, on the first and third beat. */
export function bassNoteAt(chordIndex: number, step: number): number | null {
  const s = ((step % STEPS_PER_BAR) + STEPS_PER_BAR) % STEPS_PER_BAR;
  if (s !== 0 && s !== 8) return null;
  const roots = [63, 68, 61, 58];
  return (
    roots[((chordIndex % roots.length) + roots.length) % roots.length] - 24
  );
}
