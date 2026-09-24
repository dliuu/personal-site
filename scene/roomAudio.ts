"use client";

import {
  CHORD_SECONDS,
  chordAt,
  crackleTimes,
  midiToHz,
} from "@/lib/roomAudio";

/**
 * The room's sound, built from oscillators and noise on the first user
 * gesture (autoplay-safe), no files: rain, vinyl crackle, a slow pad, a purr.
 */
export type RoomAudio = {
  start(): void;
  stop(): void;
  /** 0..1 master fade (used while scrolling away). */
  setLevel(v: number): void;
  /** Rain is louder with the blinds open. */
  setRain(open: boolean): void;
  purr(): void;
  dispose(): void;
};

export function createRoomAudio(): RoomAudio {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // Rain: noise → band-pass → slow swell.
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  const rainFilter = ctx.createBiquadFilter();
  rainFilter.type = "bandpass";
  rainFilter.frequency.value = 800;
  rainFilter.Q.value = 0.7;
  const rainGain = ctx.createGain();
  rainGain.gain.value = 0.12;
  const swell = ctx.createOscillator();
  swell.frequency.value = 0.07;
  const swellGain = ctx.createGain();
  swellGain.gain.value = 0.03;
  swell.connect(swellGain).connect(rainGain.gain);
  noise.connect(rainFilter).connect(rainGain).connect(master);

  // Crackle: scheduled clicks through a low-pass.
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.05;
  const crackleFilter = ctx.createBiquadFilter();
  crackleFilter.type = "lowpass";
  crackleFilter.frequency.value = 3000;
  crackleFilter.connect(crackleGain).connect(master);
  const click = ctx.createBuffer(1, 64, ctx.sampleRate);
  const cd = click.getChannelData(0);
  for (let i = 0; i < cd.length; i++)
    cd[i] = (Math.random() * 2 - 1) * (1 - i / cd.length);

  // Pad: four detuned triangles → low-pass with a slow LFO → delay.
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 1200;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 500;
  lfo.connect(lfoGain).connect(padFilter.frequency);
  const padGain = ctx.createGain();
  padGain.gain.value = 0.06;
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.4;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.25;
  delay.connect(feedback).connect(delay);
  padFilter.connect(padGain).connect(master);
  padGain.connect(delay).connect(master);
  const voices = [0, 1, 2, 3].map(() => {
    const pair = [-6, 6].map((cents) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.detune.value = cents;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      o.connect(g).connect(padFilter);
      return o;
    });
    return pair;
  });

  let running = false;
  let started = false;
  let chordTimer: number | null = null;
  let crackleTimer: number | null = null;
  let t0 = 0;

  const setChord = (time: number) => {
    const { notes } = chordAt(time - t0);
    voices.forEach((pair, i) =>
      pair.forEach((o) =>
        o.frequency.setTargetAtTime(midiToHz(notes[i]), ctx.currentTime, 0.8),
      ),
    );
  };
  const scheduleCrackle = () => {
    const base = ctx.currentTime;
    for (const t of crackleTimes(Math.random(), 4)) {
      const s = ctx.createBufferSource();
      s.buffer = click;
      s.connect(crackleFilter);
      s.start(base + t);
    }
  };

  return {
    start() {
      if (!started) {
        noise.start();
        swell.start();
        lfo.start();
        voices.flat().forEach((o) => o.start());
        started = true;
      }
      if (ctx.state === "suspended") void ctx.resume();
      t0 = ctx.currentTime;
      setChord(ctx.currentTime);
      chordTimer = window.setInterval(
        () => setChord(ctx.currentTime),
        CHORD_SECONDS * 1000,
      );
      scheduleCrackle();
      crackleTimer = window.setInterval(scheduleCrackle, 4000);
      master.gain.setTargetAtTime(1, ctx.currentTime, 0.6);
      running = true;
    },
    stop() {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      if (chordTimer) window.clearInterval(chordTimer);
      if (crackleTimer) window.clearInterval(crackleTimer);
      chordTimer = crackleTimer = null;
      running = false;
    },
    setLevel(v) {
      if (running) master.gain.setTargetAtTime(v, ctx.currentTime, 0.3);
    },
    setRain(open) {
      rainGain.gain.setTargetAtTime(open ? 0.16 : 0.08, ctx.currentTime, 0.5);
    },
    purr() {
      if (!running) return;
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 25;
      const am = ctx.createOscillator();
      am.frequency.value = 3;
      const amGain = ctx.createGain();
      amGain.gain.value = 0.5;
      const env = ctx.createGain();
      env.gain.value = 0;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 120;
      am.connect(amGain).connect(env.gain);
      o.connect(bp).connect(env).connect(master);
      const now = ctx.currentTime;
      env.gain.setTargetAtTime(0.35, now, 0.2);
      env.gain.setTargetAtTime(0, now + 1.6, 0.3);
      o.start(now);
      am.start(now);
      o.stop(now + 2.6);
      am.stop(now + 2.6);
    },
    dispose() {
      this.stop();
      void ctx.close();
    },
  };
}
