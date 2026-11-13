// Tiny synthesized sound effects (no audio files needed).

let ac = null;
let muted = false;
const last = {};

function ctx() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

export function unlockAudio() { ctx(); }
export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function tone(freq, dur, { type = 'sine', vol = 0.2, slide = 0, delay = 0 } = {}) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, { vol = 0.3, freq = 1200, q = 1, delay = 0 } = {}) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime + delay;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = a.createBufferSource();
  s.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = a.createGain();
  g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination);
  s.start(t);
}

const SOUNDS = {
  pop:    () => { tone(420, 0.12, { type: 'triangle', vol: 0.25, slide: 1.8 }); },
  thorn:  () => { tone(1400, 0.05, { type: 'square', vol: 0.04, slide: 0.5 }); },
  sap:    () => { tone(180, 0.25, { type: 'sine', vol: 0.18, slide: 0.4 }); },
  splat:  () => { noise(0.18, { vol: 0.25, freq: 700 }); tone(120, 0.15, { vol: 0.15, slide: 0.5 }); },
  chomp:  () => { noise(0.05, { vol: 0.12, freq: 2500 }); },
  lob:    () => { tone(600, 0.15, { type: 'triangle', vol: 0.08, slide: 1.5 }); },
  boom:   () => { noise(0.45, { vol: 0.5, freq: 500 }); tone(90, 0.4, { vol: 0.3, slide: 0.4 }); },
  crunch: () => { noise(0.2, { vol: 0.3, freq: 1600 }); },
  squish: () => { noise(0.15, { vol: 0.25, freq: 900 }); tone(300, 0.15, { type: 'sine', vol: 0.12, slide: 0.3 }); },
  click:  () => { tone(900, 0.06, { type: 'square', vol: 0.08 }); },
  spore:  () => { noise(0.5, { vol: 0.45, freq: 900 }); tone(70, 0.4, { vol: 0.25, slide: 0.5 }); },
  whistle:() => { tone(1800, 0.65, { type: 'sine', vol: 0.12, slide: 0.35 }); },
  strike: () => { noise(0.7, { vol: 0.6, freq: 700 }); tone(60, 0.6, { vol: 0.4, slide: 0.5 }); },
  star:   () => { tone(660, 0.12, { type: 'triangle', vol: 0.2 }); tone(990, 0.2, { type: 'triangle', vol: 0.2, delay: 0.1 }); },
  deny:   () => { tone(160, 0.15, { type: 'square', vol: 0.08 }); },
  win:    () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.2, delay: i * 0.12 })); },
  lose:   () => { [392, 330, 262].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.18, delay: i * 0.18 })); },
};

const MIN_GAP = { thorn: 0.06, chomp: 0.05, splat: 0.05, squish: 0.05, crunch: 0.05 };

export function sfx(name) {
  if (muted || !SOUNDS[name]) return;
  const now = performance.now() / 1000;
  if (last[name] && now - last[name] < (MIN_GAP[name] || 0.02)) return;
  last[name] = now;
  try { SOUNDS[name](); } catch (e) { /* audio is optional */ }
}
