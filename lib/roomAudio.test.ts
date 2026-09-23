import { describe, expect, it } from "vitest";
import { CHORD_SECONDS, chordAt, crackleTimes, midiToHz } from "./roomAudio";

describe("room audio schedule", () => {
  it("cycles four chords every 8 s", () => {
    expect(chordAt(0).index).toBe(0);
    expect(chordAt(CHORD_SECONDS * 3.5).index).toBe(3);
    expect(chordAt(CHORD_SECONDS * 4).index).toBe(0);
    expect(chordAt(1).notes).toHaveLength(4);
  });
  it("converts A4 to 440 Hz", () => {
    expect(midiToHz(69)).toBe(440);
    expect(midiToHz(81)).toBeCloseTo(880, 6);
  });
  it("produces sparse, increasing, seeded click times", () => {
    const a = crackleTimes(0.3, 10);
    expect(a.length).toBeGreaterThan(10);
    expect(a.length).toBeLessThan(200);
    for (let i = 1; i < a.length; i++) expect(a[i]).toBeGreaterThan(a[i - 1]);
    expect(crackleTimes(0.3, 10)).toEqual(a);
    expect(crackleTimes(0.7, 10)).not.toEqual(a);
  });
});
