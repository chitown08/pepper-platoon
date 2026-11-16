// Root Roulette: the daily underground pipe puzzle.
// Rotate root pieces to connect the taproot to nutrient pockets before the Sap Pressure bursts.

import { DIG, POCKETS, FLAVORS } from './config.js';
import * as S from './state.js';
import { sfx } from './audio.js';

const $ = (s) => document.querySelector(s);
const { cols: W, rows: H } = DIG;
const TOP = 1.4;                       // tiles of surface above the grid
const N = 1, E = 2, So = 4, Wd = 8;    // connection bits
const DIRS = [[N, 0, -1], [E, 1, 0], [So, 0, 1], [Wd, -1, 0]];
const OPP = { [N]: So, [E]: Wd, [So]: N, [Wd]: E };
const SRC = Math.floor(W / 2);          // taproot enters the top of this column
const rot = (m) => ((m << 1) | (m >> 3)) & 15;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const bits = (m) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1);

function ellipse(c, x, y, rx, ry, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }
function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

// ---------- level generation (always solvable) ----------

function generate(stemLevel) {
  const cells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cells.push({ x, y, kind: 'pipe', mask: 0, myco: false, angle: 0 });
  const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? cells[y * W + x] : null);

  // place pockets, never next to each other
  const pockets = [];
  for (const P of POCKETS) {
    for (let tries = 0; tries < 50; tries++) {
      const y = Math.floor(rand(P.rows[0], P.rows[1] + 1));
      const x = Math.floor(rand(0, W));
      if (pockets.some(q => Math.abs(q.x - x) + Math.abs(q.y - y) < 3)) continue;
      const c = at(x, y);
      c.kind = 'pocket';
      c.pocket = { ...P, claimed: false };
      if (P.kind === 'rare') c.pocket.flavor = Math.random() < 0.5 ? 'truffle' : 'saffron';
      if (P.kind === 'aquifer') c.pocket.reward = { water: 250 * stemLevel };
      if (P.kind === 'deep') c.pocket.reward = { water: 600 * stemLevel };
      if (P.kind === 'geode') c.pocket.reward = { seeds: 2 };
      if (P.kind === 'geyser') c.pocket.reward = { boost: true };
      if (P.kind === 'rare') c.pocket.reward = { flavor: c.pocket.flavor };
      pockets.push(c);
      break;
    }
  }

  // carve a path from the root network to each pocket (randomized shortest path)
  const net = new Set([at(SRC, 0)]);
  at(SRC, 0).mask |= N;
  const path = [];
  for (const target of pockets) {
    const dist = new Map(), prev = new Map(), open = [];
    for (const c of net) { dist.set(c, 0); open.push(c); }
    while (open.length) {
      open.sort((a, b) => dist.get(a) - dist.get(b));
      const c = open.shift();
      if (c === target) break;
      for (const [, dx, dy] of DIRS) {
        const n = at(c.x + dx, c.y + dy);
        if (!n || (n.kind === 'pocket' && n !== target)) continue;
        const d = dist.get(c) + 1 + Math.random() * 2.5;
        if (d < (dist.get(n) ?? Infinity)) { dist.set(n, d); prev.set(n, c); if (!open.includes(n)) open.push(n); }
      }
    }
    let c = target;
    while (prev.has(c)) {
      const p = prev.get(c);
      const [bit] = DIRS.find(([, dx, dy]) => p.x + dx === c.x && p.y + dy === c.y);
      p.mask |= bit;
      if (c.kind === 'pipe') { c.mask |= OPP[bit]; net.add(c); path.push(c); }
      c = p;
    }
  }

  // glowing fungus on a couple of path tiles
  const route = [...new Set(path)].filter(c => !(c.x === SRC && c.y === 0));
  for (let i = 0; i < 2 && route.length; i++) route.splice(Math.floor(Math.random() * route.length), 1)[0].myco = true;

  // fill the rest: bedrock or random pieces
  for (const c of cells) {
    if (c.kind !== 'pipe') continue;
    if (!net.has(c)) {
      if (Math.random() < DIG.bedrock) { c.kind = 'rock'; continue; }
      c.mask = pick([5, 5, 3, 3, 3, 7]);
    }
    if (bits(c.mask) === 1) c.mask |= OPP[c.mask]; // dead ends become straights
    c.solution = c.mask;
    const turns = Math.floor(rand(0, 4));
    for (let i = 0; i < turns; i++) c.mask = rot(c.mask);
    c.angle = 0;
  }
  // make sure it isn't already solved at the start
  const first = at(SRC, 0);
  if (first.mask & N) first.mask = rot(first.mask);
  return { cells, at, pockets };
}

// ---------- scene ----------

export function createRoulette({ canvas, player, showTip, onExit }) {
  const c = canvas.getContext('2d');
  const view = { tile: 20, dpr: 1, S: 20 };
  const p = player;
  let lvl = null;
  let time = 0, clock = 0, phase = 'idle'; // idle -> play -> burst -> done
  let flowing = new Set();
  let rewards = [];
  let grub = null, grubTimer = 0;
  let shake = 0;
  const particles = [];
  const floaters = [];

  function resize(cssW, cssH) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const rowsTotal = H + TOP + 0.3;
    const tile = Math.floor(Math.min(cssW / W, cssH / rowsTotal) * 100) / 100;
    Object.assign(view, { tile, dpr, S: tile * dpr });
    canvas.style.width = tile * W + 'px';
    canvas.style.height = tile * rowsTotal + 'px';
    canvas.width = Math.round(tile * W * dpr);
    canvas.height = Math.round(tile * rowsTotal * dpr);
  }

  // ---------- flow ----------

  function computeFlow() {
    const seen = new Set();
    const first = lvl.at(SRC, 0);
    if (!(first.mask & N)) return seen;
    const stack = [first];
    seen.add(first);
    while (stack.length) {
      const cell = stack.pop();
      for (const [bit, dx, dy] of DIRS) {
        if (!(cell.mask & bit)) continue;
        const n = lvl.at(cell.x + dx, cell.y + dy);
        if (!n || seen.has(n)) continue;
        if (n.kind === 'pocket') { seen.add(n); continue; }
        if (n.kind === 'pipe' && (n.mask & OPP[bit])) { seen.add(n); stack.push(n); }
      }
    }
    return seen;
  }

  function multiplier() {
    let m = 1;
    for (const cell of flowing) if (cell.myco) m += DIG.mycoBonus;
    return m;
  }

  function refreshFlow() {
    flowing = computeFlow();
    for (const cell of flowing) {
      if (cell.kind !== 'pocket' || cell.pocket.claimed) continue;
      claim(cell);
    }
    updateHud();
  }

  function claim(cell) {
    const pk = cell.pocket;
    pk.claimed = true;
    const m = multiplier();
    const r = { ...pk.reward };
    if (r.water) r.water = Math.round(r.water * m);
    if (r.seeds) r.seeds = Math.round(r.seeds * m);
    rewards.push(r);
    const label = r.water ? `+${r.water.toLocaleString()} 💧` : r.seeds ? `+${r.seeds} 🌱` : r.boost ? '☀️ ×2!' : `${FLAVORS[r.flavor].icon} ${FLAVORS[r.flavor].name}!`;
    floaters.push({ x: cell.x + 0.5, y: cell.y + TOP, text: label, life: 1.6 });
    for (let i = 0; i < 24; i++) {
      const a = rand(0, Math.PI * 2), s = rand(1, 4);
      particles.push({ x: cell.x + 0.5, y: cell.y + TOP + 0.5, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: rand(0.5, 1), color: pocketColor(pk), size: rand(0.04, 0.1) });
    }
    sfx('star');
    if (lvl.pockets.every(q => q.pocket.claimed)) { showTip('Every pocket tapped!'); finish(false); }
  }

  // ---------- input ----------

  function toCell(e) {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / view.tile);
    const y = Math.floor((e.clientY - r.top) / view.tile - TOP);
    return lvl.at(x, y);
  }

  function pointerDown(e) {
    if (phase !== 'play') return;
    const cell = toCell(e);
    if (!cell) return;
    if (grub && grub.cell === cell) {
      squishGrub();
      return;
    }
    if (cell.kind === 'rock') { sfx('deny'); return; }
    if (cell.kind !== 'pipe') return;
    cell.mask = rot(cell.mask);
    cell.angle -= Math.PI / 2; // animate from the old orientation
    sfx('click');
    refreshFlow();
  }

  // ---------- grubs ----------

  function spawnGrub() {
    const options = lvl.cells.filter(cl => cl.kind === 'pipe' && !(cl.x === SRC && cl.y === 0));
    grub = { cell: pick(options), t: DIG.grubFuse };
    grubTimer = rand(...DIG.grubEvery);
  }

  function squishGrub() {
    const g = grub;
    grub = null;
    for (let i = 0; i < 10; i++) particles.push({ x: g.cell.x + 0.5, y: g.cell.y + TOP + 0.5, vx: rand(-2, 2), vy: rand(-3, -0.5), life: 0.6, color: '#f2a6b8', size: 0.07 });
    floaters.push({ x: g.cell.x + 0.5, y: g.cell.y + TOP, text: 'Squish!', life: 0.9 });
    sfx('squish');
  }

  function grubScramble() {
    const g = grub.cell;
    grub = null;
    for (const [, dx, dy] of DIRS) {
      const n = lvl.at(g.x + dx, g.y + dy);
      if (n && n.kind === 'pipe') {
        const turns = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < turns; i++) { n.mask = rot(n.mask); n.angle -= Math.PI / 2; }
      }
    }
    floaters.push({ x: g.x + 0.5, y: g.y + TOP, text: 'Grub scramble!', life: 1.2 });
    sfx('crunch');
    refreshFlow();
  }

  // ---------- flow of the game ----------

  function finish(burst) {
    if (phase !== 'play') return;
    phase = burst ? 'burst' : 'done';
    grub = null;
    if (burst) {
      shake = 0.6;
      sfx('spore');
      const first = lvl.at(SRC, 0);
      for (let i = 0; i < 40; i++) particles.push({ x: first.x + 0.5, y: TOP - 0.2, vx: rand(-4, 4), vy: rand(-6, -1), life: rand(0.6, 1.2), color: i % 2 ? '#e8c27a' : '#8fd3ff', size: rand(0.05, 0.14) });
    }
    setTimeout(showResults, burst ? 1100 : 700);
  }

  function showResults() {
    phase = 'done';
    const lines = S.payDig(p, rewards);
    S.save(p);
    $('#dig-title').textContent = rewards.length ? (rewards.length >= 4 ? 'Mother Lode!' : 'Deep Tap Complete') : 'The Root Burst!';
    $('#dig-sub').textContent = rewards.length
      ? `You tapped ${rewards.length} of ${lvl.pockets.length} pockets.`
      : 'No pockets reached before the Sap Pressure burst.';
    $('#dig-loot').innerHTML = lines.length
      ? lines.map(l => `<li><span>${l.icon}</span>${l.text}</li>`).join('')
      : '<li><span>🪨</span>Nothing this time</li>';
    $('#dig-results').classList.remove('hidden');
    sfx(rewards.length ? 'win' : 'lose');
  }

  $('#dig-done').addEventListener('click', () => { $('#dig-results').classList.add('hidden'); onExit(); });
  $('#dig-cash').addEventListener('click', () => {
    if (phase !== 'play') return;
    sfx('click');
    finish(false);
  });

  // ---------- HUD ----------

  const pressEl = $('#dig-pressure > i'), timeEl = $('#dig-time'), multEl = $('#dig-mult'), gotEl = $('#dig-got');
  function updateHud() {
    const k = Math.min(1, 1 - time / DIG.time);
    pressEl.style.width = k * 100 + '%';
    timeEl.textContent = Math.ceil(Math.max(0, time)) + 's';
    timeEl.classList.toggle('low', time < 10);
    multEl.textContent = '×' + multiplier().toFixed(2).replace(/\.?0+$/, '');
    gotEl.textContent = `${rewards.length} / ${lvl ? lvl.pockets.length : 0}`;
  }

  // ---------- drawing ----------

  function pocketColor(pk) {
    return { aquifer: '#4fb6f0', deep: '#2a7fd4', geode: '#a970e0', geyser: '#7ee05a', rare: '#f0b84a' }[pk.kind];
  }

  function drawPocket(cell) {
    const pk = cell.pocket;
    const x = cell.x + 0.5, y = cell.y + TOP + 0.5;
    const glow = 0.5 + Math.sin(clock * 3 + cell.x) * 0.2;
    ellipse(c, x, y, 0.46, 0.46, pk.claimed ? 'rgba(255,255,255,0.12)' : `rgba(255,240,180,${glow * 0.35})`);
    if (pk.kind === 'aquifer' || pk.kind === 'deep') {
      const r = pk.kind === 'deep' ? 0.38 : 0.3;
      const g = c.createRadialGradient(x - 0.1, y - 0.1, 0.02, x, y, r);
      g.addColorStop(0, '#d8f4ff'); g.addColorStop(1, pocketColor(pk));
      ellipse(c, x, y, r, r * 0.8, g);
      ellipse(c, x - r * 0.35, y - r * 0.3, r * 0.25, r * 0.15, 'rgba(255,255,255,0.7)');
    } else if (pk.kind === 'geode') {
      ellipse(c, x, y, 0.36, 0.3, '#5a4a5a');
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2 + 0.3;
        c.fillStyle = i % 2 ? '#c99af5' : '#8a4fd1';
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 0.3, y + Math.sin(a) * 0.25); c.lineTo(x + Math.cos(a + 0.6) * 0.3, y + Math.sin(a + 0.6) * 0.25); c.fill();
      }
    } else if (pk.kind === 'geyser') {
      ellipse(c, x, y + 0.1, 0.34, 0.2, '#3d5a2a');
      for (let i = 0; i < 4; i++) {
        const k = (clock * 0.8 + i * 0.25) % 1;
        c.globalAlpha = (1 - k) * 0.9;
        ellipse(c, x + Math.sin(i * 2 + clock) * 0.08, y + 0.05 - k * 0.45, 0.08 + k * 0.08, 0.08 + k * 0.08, '#9df27a');
      }
      c.globalAlpha = 1;
    } else {
      // ancient ingredient in a clay pot
      ellipse(c, x, y + 0.08, 0.3, 0.26, '#b0643a');
      ellipse(c, x, y - 0.12, 0.26, 0.08, '#7a3c1c');
    }
    if (pk.kind === 'rare') {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      const fs = view.tile * 0.42 * view.dpr;
      c.font = `${fs}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(FLAVORS[pk.flavor].icon, x * view.S, (y - 0.12) * view.S);
      c.restore();
    }
    if (pk.claimed) {
      c.strokeStyle = '#7dff7a'; c.lineWidth = 0.08; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - 0.15, y + 0.25); c.lineTo(x - 0.05, y + 0.35); c.lineTo(x + 0.18, y + 0.12); c.stroke();
    }
  }

  function drawPipe(cell, wet) {
    const x = cell.x + 0.5, y = cell.y + TOP + 0.5;
    c.save(); c.translate(x, y); c.rotate(cell.angle);
    const arms = [];
    for (const [bit, dx, dy] of DIRS) if (cell.mask & bit) arms.push([dx, dy]);
    c.lineCap = 'round';
    for (const [w, col] of [[0.34, '#5a3a1e'], [0.24, '#c8a06a'], [0.1, wet ? '#5ec4ff' : '#9c7646']]) {
      c.strokeStyle = col; c.lineWidth = w;
      for (const [dx, dy] of arms) { c.beginPath(); c.moveTo(0, 0); c.lineTo(dx * 0.52, dy * 0.52); c.stroke(); }
    }
    ellipse(c, 0, 0, 0.15, 0.15, wet ? '#5ec4ff' : '#b08a58');
    if (wet) {
      // little bubbles travelling along the root
      for (const [dx, dy] of arms) {
        const k = (clock * 1.5 + cell.x * 0.3 + cell.y * 0.2) % 1;
        ellipse(c, dx * k * 0.5, dy * k * 0.5, 0.035, 0.035, '#e0f6ff');
      }
    }
    c.restore();
    if (cell.myco) {
      for (let i = 0; i < 5; i++) {
        const a = i * 1.3 + clock * 0.5;
        ellipse(c, x + Math.cos(a) * 0.32, y + Math.sin(a * 1.1) * 0.32, 0.05, 0.05, `rgba(120,255,230,${0.5 + Math.sin(clock * 3 + i) * 0.3})`);
      }
    }
  }

  function render() {
    c.setTransform(1, 0, 0, 1, 0, 0);
    let sx = 0, sy = 0;
    if (shake > 0) { sx = (Math.random() - 0.5) * shake * 0.4 * view.S; sy = (Math.random() - 0.5) * shake * 0.4 * view.S; }
    c.setTransform(view.S, 0, 0, view.S, sx, sy);
    const totalH = H + TOP + 0.3;
    // surface
    c.fillStyle = '#6cbf4a'; c.fillRect(0, 0, W, TOP - 0.3);
    c.fillStyle = '#4a9b35'; c.fillRect(0, TOP - 0.4, W, 0.15);
    // soil getting darker with depth
    const g = c.createLinearGradient(0, TOP - 0.3, 0, totalH);
    g.addColorStop(0, '#7a5232'); g.addColorStop(0.5, '#4f331d'); g.addColorStop(1, '#24170d');
    c.fillStyle = g; c.fillRect(0, TOP - 0.3, W, totalH);
    for (let i = 0; i < 70; i++) {
      ellipse(c, hash(i) * W, TOP + hash(i + 40) * H, 0.05 + hash(i + 7) * 0.06, 0.04, 'rgba(0,0,0,0.25)');
    }
    // your plant on the surface, taproot down into the grid
    const px = SRC + 0.5;
    c.strokeStyle = '#c8a06a'; c.lineWidth = 0.24; c.lineCap = 'round';
    c.beginPath(); c.moveTo(px, TOP - 0.5); c.lineTo(px, TOP); c.stroke();
    c.strokeStyle = '#5ec4ff'; c.lineWidth = 0.1;
    c.beginPath(); c.moveTo(px, TOP - 0.5); c.lineTo(px, TOP); c.stroke();
    c.fillStyle = '#3fa13a';
    c.beginPath(); c.moveTo(px - 0.12, TOP - 0.4); c.lineTo(px - 0.08, TOP - 1.2); c.lineTo(px + 0.08, TOP - 1.2); c.lineTo(px + 0.12, TOP - 0.4); c.fill();
    for (const s of [-1, 1]) {
      c.save(); c.translate(px, TOP - 0.95); c.rotate(s * 0.8);
      ellipse(c, 0, -0.25, 0.12, 0.28, '#4fbf46'); c.restore();
    }
    ellipse(c, px - 0.04, TOP - 0.85, 0.035, 0.04, '#fff');
    ellipse(c, px + 0.06, TOP - 0.85, 0.035, 0.04, '#fff');

    // tiles
    for (const cell of lvl.cells) {
      const x = cell.x, y = cell.y + TOP;
      c.fillStyle = 'rgba(0,0,0,0.12)';
      c.beginPath(); c.roundRect(x + 0.04, y + 0.04, 0.92, 0.92, 0.12); c.fill();
      if (cell.kind === 'rock') {
        ellipse(c, x + 0.5, y + 0.55, 0.42, 0.36, '#6e6e74');
        ellipse(c, x + 0.42, y + 0.45, 0.3, 0.22, '#8d8d94');
        ellipse(c, x + 0.35, y + 0.38, 0.1, 0.06, 'rgba(255,255,255,0.3)');
      } else if (cell.kind === 'pocket') drawPocket(cell);
      else drawPipe(cell, flowing.has(cell));
    }

    // grub
    if (grub) {
      const x = grub.cell.x + 0.5, y = grub.cell.y + TOP + 0.5;
      const k = grub.t / DIG.grubFuse;
      c.beginPath(); c.arc(x, y, 0.46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
      c.strokeStyle = '#ff5a4a'; c.lineWidth = 0.06; c.stroke();
      for (let i = 0; i < 5; i++) {
        const wig = Math.sin(clock * 10 + i) * 0.05;
        ellipse(c, x - 0.24 + i * 0.12, y + wig, 0.09, 0.08, i === 4 ? '#e88aa0' : '#f2b8c6');
      }
      ellipse(c, x + 0.26, y - 0.02, 0.02, 0.02, '#111');
    }

    // particles
    for (const pt of particles) {
      c.globalAlpha = Math.min(1, pt.life * 2);
      ellipse(c, pt.x, pt.y, pt.size, pt.size, pt.color);
    }
    c.globalAlpha = 1;

    // floaters
    c.setTransform(1, 0, 0, 1, 0, 0);
    const fs = Math.max(12, view.tile * 0.36) * view.dpr;
    c.font = `${fs}px 'Lilita One', system-ui, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    for (const f of floaters) {
      c.globalAlpha = Math.min(1, f.life * 2);
      const fx = Math.min(W - 1.2, Math.max(1.2, f.x)) * view.S, fy = f.y * view.S;
      c.lineWidth = fs * 0.2; c.strokeStyle = 'rgba(0,0,0,0.8)'; c.strokeText(f.text, fx, fy);
      c.fillStyle = '#fff4d6'; c.fillText(f.text, fx, fy);
    }
    c.globalAlpha = 1;
  }

  // ---------- loop ----------

  function frame(dt) {
    clock += dt;
    if (shake > 0) shake = Math.max(0, shake - dt);
    if (phase === 'play') {
      time -= dt;
      grubTimer -= dt;
      if (!grub && grubTimer <= 0) spawnGrub();
      if (grub) { grub.t -= dt; if (grub.t <= 0) grubScramble(); }
      if (time <= 0) { time = 0; finish(true); }
      updateHud();
    }
    for (const cell of lvl.cells) if (cell.angle) cell.angle *= Math.pow(0.0001, dt * 2.5);
    for (const pt of particles) { pt.life -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 6 * dt; }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
    for (const f of floaters) { f.life -= dt; f.y -= dt * 0.7; }
    for (let i = floaters.length - 1; i >= 0; i--) if (floaters[i].life <= 0) floaters.splice(i, 1);
    render();
  }

  return {
    resize, frame, pointerDown, pointerMove() {}, pointerUp() {},
    enter() {
      lvl = generate(p.stem.level);
      time = DIG.time; phase = 'play'; rewards = []; grub = null;
      grubTimer = rand(...DIG.grubEvery);
      particles.length = 0; floaters.length = 0;
      refreshFlow();
    },
    exit() { phase = 'idle'; },
    debug: () => lvl,
  };
}
