/** The schedule of the room's procedural sound; the Web Audio graph lives in scene/. */

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
