import { describe, expect, it } from "vitest";
import {
  bassNoteAt,
  CHORD_SECONDS,
  chordAt,
  crackleTimes,
  drumHits,
  midiToHz,
  SECONDS_PER_STEP,
  swingOffset,
} from "./roomAudio";

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

describe("the groove", () => {
  it("pushes the off-eighths late and leaves the downbeats alone", () => {
    expect(swingOffset(0)).toBe(0);
    expect(swingOffset(2)).toBe(0);
    expect(swingOffset(1)).toBeGreaterThan(0);
    expect(swingOffset(1)).toBeLessThan(SECONDS_PER_STEP);
  });
  it("puts the kick on one and the snare on two and four", () => {
    expect(drumHits(0).kick).toBe(true);
    expect(drumHits(4).snare).toBe(true);
    expect(drumHits(12).snare).toBe(true);
    expect(drumHits(4).kick).toBe(false);
  });
  it("plays hats on the eighths and drops one every other bar", () => {
    expect(drumHits(0).hat).toBeGreaterThan(0);
    expect(drumHits(1).hat).toBe(0);
    expect(drumHits(6, 0).hat).toBeGreaterThan(0);
    expect(drumHits(6, 1).hat).toBe(0);
  });
  it("sounds the bass on the first and third beat, an octave under the root", () => {
    expect(bassNoteAt(0, 0)).toBe(39);
    expect(bassNoteAt(0, 8)).toBe(39);
    expect(bassNoteAt(0, 4)).toBeNull();
    expect(bassNoteAt(1, 0)).toBe(44);
  });
});
