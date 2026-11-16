// Background music: a marching band of kitchen instruments, synthesized live.
// Pots (bass drum), pans (clangy snare), wooden spoons (clicks), a kazoo, a tuba and a glockenspiel.

import { audioCtx, isMuted } from './audio.js';

const N = null;
const m = (name) => { // note name like 'G4' -> MIDI number
  const i = 'C C#D D#E F F#G G#A A#B '.indexOf(name.slice(0, -1).padEnd(2, ' '));
  return i / 2 + 12 * (Number(name.slice(-1)) + 1);
};
const seq = (s) => s.trim().split(/\s+/).map(x => (x === '.' ? N : m(x)));
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Each track: 32 sixteenth-note steps (two bars), looped.
const TRACKS = {
  garden: {
    bpm: 92, lead: 'bell', vol: 0.8,
    pot: [0, 16], pan: [], spoon: [4, 12, 20, 28],
    bass: seq('C3 . . . . . . . G2 . . . . . . . F2 . . . . . . . G2 . . . . . . .'),
    melody: seq('C5 . E5 . G5 . E5 . F5 . A5 . G5 . . . E5 . G5 . C6 . G5 . F5 . D5 . C5 . . .'),
  },
  raid: {
    bpm: 116, lead: 'kazoo', vol: 0.9,
    pot: [0, 8, 16, 24], pan: [4, 12, 14, 15, 20, 28], spoon: [2, 6, 10, 18, 22, 26, 30],
    bass: seq('G2 . . . D3 . . . G2 . . . D3 . . . C3 . . . G3 . . . D3 . . . A2 . . .'),
    melody: seq('G4 . B4 . D5 . . B4 C5 . A4 . D5 . . . B4 . G4 . A4 . B4 C5 D5 . . . G5 . . .'),
  },
  defense: {
    bpm: 128, lead: 'kazoo', vol: 0.85,
    pot: [0, 6, 8, 14, 16, 22, 24, 30], pan: [4, 12, 20, 28], spoon: [2, 10, 18, 26],
    bass: seq('D2 . D2 . F2 . D2 . C2 . C2 . E2 . C2 . D2 . D2 . F2 . G2 . A2 . A2 . C3 . A2 .'),
    melody: seq('A4 . . . G4 . F4 . E4 . . . F4 . D4 . . . . . A4 . . . C5 . A4 . G4 . E4 .'),
  },
  dig: {
    bpm: 104, lead: 'bell', vol: 0.7,
    pot: [0, 10, 16, 26], pan: [], spoon: [2, 6, 10, 14, 18, 22, 26, 30],
    bass: seq('A2 . . . . . . . F2 . . . . . . . C3 . . . . . . . G2 . . . . . . .'),
    melody: seq('A4 C5 E5 . A5 . E5 C5 F4 A4 C5 . F5 . C5 A4 C5 E5 G5 . C6 . G5 E5 G4 B4 D5 . G5 . . .'),
  },
};

let musicOn = true;
let current = null, want = null;
let out = null, noiseBuf = null;
let step = 0, nextT = 0, timer = null;

function bus() {
  const a = audioCtx();
  if (!a) return null;
  if (!out) {
    out = a.createGain();
    out.gain.value = 0.32;
    out.connect(a.destination);
    const len = a.sampleRate * 0.5;
    noiseBuf = a.createBuffer(1, len, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return a;
}

function env(a, t, peak, dur, attack = 0.005) {
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out);
  return g;
}

function osc(a, type, f, t, dur, dest) {
  const o = a.createOscillator();
  o.type = type; o.frequency.setValueAtTime(f, t);
  o.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  return o;
}

function noise(a, t, dur, dest, filterType, freq, q = 1) {
  const s = a.createBufferSource();
  s.buffer = noiseBuf;
  const f = a.createBiquadFilter();
  f.type = filterType; f.frequency.value = freq; f.Q.value = q;
  s.connect(f).connect(dest);
  s.start(t); s.stop(t + dur);
}

const INSTR = {
  pot(a, t, v) { // stock-pot bass drum
    const g = env(a, t, 0.55 * v, 0.28);
    const o = osc(a, 'sine', 140, t, 0.3, g);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.16);
    noise(a, t, 0.03, env(a, t, 0.12 * v, 0.04), 'lowpass', 500);
  },
  pan(a, t, v) { // frying-pan clang
    noise(a, t, 0.14, env(a, t, 0.22 * v, 0.14), 'bandpass', 2600, 1.4);
    const g = env(a, t, 0.05 * v, 0.18);
    osc(a, 'square', 523, t, 0.2, g); osc(a, 'square', 787, t, 0.2, g);
  },
  spoon(a, t, v) { // wooden-spoon click
    osc(a, 'sine', 1750, t, 0.05, env(a, t, 0.14 * v, 0.045, 0.002));
    osc(a, 'triangle', 880, t, 0.05, env(a, t, 0.06 * v, 0.04, 0.002));
  },
  bass(a, t, f, dur, v) { // tuba
    osc(a, 'triangle', f, t, dur, env(a, t, 0.32 * v, dur * 0.95, 0.02));
    osc(a, 'sine', f / 2, t, dur, env(a, t, 0.14 * v, dur * 0.9, 0.02));
  },
  kazoo(a, t, f, dur, v) {
    const g = env(a, t, 0.11 * v, dur, 0.02);
    const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 1.6;
    bp.connect(g);
    const o = osc(a, 'sawtooth', f, t, dur, bp);
    const lfo = a.createOscillator(); lfo.frequency.value = 6.5;
    const depth = a.createGain(); depth.gain.value = f * 0.012;
    lfo.connect(depth).connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.05);
  },
  bell(a, t, f, dur, v) { // glockenspiel
    osc(a, 'sine', f, t, 0.9, env(a, t, 0.16 * v, 0.9, 0.003));
    osc(a, 'sine', f * 2.76, t, 0.4, env(a, t, 0.04 * v, 0.35, 0.003));
  },
};

function noteLen(arr, i, stepDur) {
  let n = 1;
  while (n < 4 && arr[(i + n) % arr.length] === N) n++;
  return n * stepDur * 0.92;
}

function tick() {
  const a = audioCtx();
  if (!a || !current) return;
  const tr = TRACKS[current];
  const stepDur = 60 / tr.bpm / 4;
  if (nextT < a.currentTime) nextT = a.currentTime + 0.05;
  while (nextT < a.currentTime + 0.15) {
    const i = step % 32, t = nextT, v = tr.vol;
    if (a.state === 'running' && !isMuted() && musicOn) {
      if (tr.pot.includes(i)) INSTR.pot(a, t, v);
      if (tr.pan.includes(i)) INSTR.pan(a, t, v);
      if (tr.spoon.includes(i)) INSTR.spoon(a, t, v);
      if (tr.bass[i] != null) INSTR.bass(a, t, hz(tr.bass[i]), noteLen(tr.bass, i, stepDur), v);
      if (tr.melody[i] != null) INSTR[tr.lead](a, t, hz(tr.melody[i]), noteLen(tr.melody, i, stepDur), v);
    }
    step++;
    nextT += stepDur;
  }
}

export function playMusic(name) {
  want = name;
  if (!musicOn) return;
  if (!bus()) return;
  if (current !== name) { current = name; step = 0; }
  if (!timer) timer = setInterval(tick, 25);
}

export function stopMusic() {
  current = null;
  if (timer) { clearInterval(timer); timer = null; }
}

export function setMusicOn(on) {
  musicOn = on;
  if (!on) stopMusic();
  else if (want) playMusic(want);
}

// Pause while the page is in the background.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopMusic();
    else if (want && musicOn) playMusic(want);
  });
}
