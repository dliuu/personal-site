"use client";

import {
  bassNoteAt,
  CHORD_SECONDS,
  chordAt,
  crackleTimes,
  drumHits,
  midiToHz,
  SECONDS_PER_STEP,
  STEPS_PER_BAR,
  swingOffset,
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
  // Tape: everything above 6 kHz rolled off, then squeezed a little.
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 6000;
  const squash = ctx.createDynamicsCompressor();
  squash.threshold.value = -18;
  squash.ratio.value = 3;
  squash.attack.value = 0.005;
  squash.release.value = 0.25;
  master.connect(tone).connect(squash).connect(ctx.destination);

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

  // ---- drums, bass and tape wobble, all synthesised ----
  const kit = ctx.createGain();
  kit.gain.value = 0.5;
  kit.connect(master);
  const noiseBuf2 = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noiseBuf2.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  const kick = (at: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(120, at);
    o.frequency.exponentialRampToValueAtTime(45, at + 0.09);
    g.gain.setValueAtTime(0.9, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.32);
    o.connect(g).connect(kit);
    o.start(at);
    o.stop(at + 0.34);
  };
  const snare = (at: number) => {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf2;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1900;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.32, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.16);
    s.connect(bp).connect(g).connect(kit);
    s.start(at);
    s.stop(at + 0.2);
  };
  const hat = (at: number, v: number) => {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf2;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.1 * v, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
    s.connect(hp).connect(g).connect(kit);
    s.start(at);
    s.stop(at + 0.07);
  };
  const bassGain = ctx.createGain();
  bassGain.gain.value = 0.22;
  const bassTone = ctx.createBiquadFilter();
  bassTone.type = "lowpass";
  bassTone.frequency.value = 400;
  bassGain.connect(bassTone).connect(master);
  const bass = (at: number, note: number) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(midiToHz(note), at);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(1, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.9);
    o.connect(g).connect(bassGain);
    o.start(at);
    o.stop(at + 1);
  };
  // Tape wobble: a slow drift on a short delay the pad and bass pass through.
  const wobble = ctx.createDelay(0.05);
  wobble.delayTime.value = 0.012;
  const wobbleLfo = ctx.createOscillator();
  wobbleLfo.frequency.value = 0.35;
  const wobbleAmt = ctx.createGain();
  wobbleAmt.gain.value = 0.004;
  wobbleLfo.connect(wobbleAmt).connect(wobble.delayTime);
  wobble.connect(master);
  padGain.connect(wobble);

  let step = 0;
  let nextStepTime = 0;
  let scheduler: number | null = null;
  const SCHEDULE_AHEAD = 0.12;
  const tick = () => {
    while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) {
      const bar = Math.floor(step / STEPS_PER_BAR);
      const at = nextStepTime + swingOffset(step);
      const h = drumHits(step, bar);
      if (h.kick) kick(at);
      if (h.snare) snare(at);
      if (h.hat > 0) hat(at, h.hat);
      const n = bassNoteAt(Math.floor(bar / 2), step);
      if (n !== null) bass(at, n);
      step++;
      nextStepTime += SECONDS_PER_STEP;
    }
  };

  let running = false;
  let started = false;
  let wobbleStarted = false;
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
      if (!wobbleStarted) {
        wobbleLfo.start();
        wobbleStarted = true;
      }
      step = 0;
      nextStepTime = ctx.currentTime + 0.1;
      tick();
      scheduler = window.setInterval(tick, 25);
      master.gain.setTargetAtTime(1, ctx.currentTime, 0.6);
      running = true;
    },
    stop() {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      if (chordTimer) window.clearInterval(chordTimer);
      if (crackleTimer) window.clearInterval(crackleTimer);
      if (scheduler) window.clearInterval(scheduler);
      chordTimer = crackleTimer = scheduler = null;
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
