// Procedural audio — no asset files. The AudioContext is created lazily
// on the first sound playback (browsers require a user gesture before any
// audio can start), so callers don't need to worry about timing.

class SoundController {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.musicNodes = [];
    this.melodyTimer = null;
    this.swooshTimer = 0;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // Short filtered-noise burst with a downward pitch sweep — sounds like
  // air rushing past. Used for jumps.
  swoosh() {
    this.init();
    if (!this.ctx) return;
    // Throttle so spammed inputs don't stack into a wall of noise.
    const now = this.ctx.currentTime;
    if (now < this.swooshTimer) return;
    this.swooshTimer = now + 0.05;

    const dur = 0.18;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2.5;
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + dur + 0.01);
  }

  // Longer, lower, more aggressive swoosh — used for the shell-bash dash.
  dashSwoosh() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const dur = 0.28;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.2;
    filter.frequency.setValueAtTime(1300, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.32, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + dur + 0.01);
  }

  // Ambient background music — sustained low drones in A minor with a
  // slow triangle-wave melody on top. Aiming for that calm-but-mournful
  // Hollow Knight ambient feel rather than a real chiptune.
  startMusic() {
    this.init();
    if (!this.ctx || this.musicGain) return;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.0001;
    this.musicGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 2);
    this.musicGain.connect(this.masterGain);

    // Sustained drone chord: A2, E3, C4 (A minor)
    const droneFreqs = [110, 164.81, 261.63];
    droneFreqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      // Detune slightly per oscillator for a thicker, warmer pad
      osc.detune.value = (i - 1) * 6;

      const g = this.ctx.createGain();
      g.gain.value = i === 0 ? 0.45 : 0.22;

      // Slow LFO on the gain so the pad gently breathes
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.08 + i * 0.03;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      lfo.start();

      osc.connect(g);
      g.connect(this.musicGain);
      osc.start();
      this.musicNodes.push(osc, lfo);
    });

    // Slow melody — A minor pentatonic (A, C, D, E, G) plus the low fifth
    const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
    const pattern = [0, 2, 4, 2, 5, 4, 2, 0, 1, 0, 4, 2, 3, 2, 0, 4];
    let idx = 0;

    const playNote = () => {
      if (!this.musicGain) return;
      const t = this.ctx.currentTime;
      const f = scale[pattern[idx % pattern.length]];

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;

      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.18, t + 0.4);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

      osc.connect(ng);
      ng.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 2.5);

      idx++;
    };

    // Play one note immediately, then on an irregular cadence
    playNote();
    this.melodyTimer = setInterval(playNote, 2400);
  }

  stopMusic() {
    if (this.melodyTimer) {
      clearInterval(this.melodyTimer);
      this.melodyTimer = null;
    }
    if (!this.musicGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    const oldGain = this.musicGain;
    const oldNodes = this.musicNodes;
    this.musicGain = null;
    this.musicNodes = [];
    setTimeout(() => {
      oldNodes.forEach(n => { try { n.stop(); } catch (_) {} });
      try { oldGain.disconnect(); } catch (_) {}
    }, 700);
  }
}

let _instance = null;
export function getSounds() {
  if (!_instance) _instance = new SoundController();
  return _instance;
}
