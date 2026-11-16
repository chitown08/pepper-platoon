// The Garden scene: your Pepper Plant home base.

import { GARDEN, PLANTS, STEM_LEVELS, TROOPS, UNITS, FLAVORS, INFUSE_COST, DIG, BUILDINGS, DEFENSE, TRAP, GREENHOUSE } from './config.js';
import * as S from './state.js';
import { drawStem, PLANT_ART, drawBubble, drawPlantIcon } from './garden-art.js';
import { drawUnitIcon, drawTurret, drawHedge } from './render.js';
import { sfx } from './audio.js';

const $ = (s) => document.querySelector(s);
const { cols: COLS, rows: ROWS } = GARDEN;
const RES_ICON = { sun: '☀️', water: '💧' };
const MAP_COUNT = 9;
const PLANT_UNLOCK = (type) => STEM_LEVELS.findIndex(l => l && l.limits[type] > 0);
const TROOP_BLURB = {
  jalapeno: 'Cheap swarm. Rushes the nearest building.',
  habanero: 'Lobs explosive seeds over walls. Fragile.',
  bell: 'No damage, but turrets nearby must shoot it.',
  ghost: 'Hunts turrets and walks through walls. Unseen at first.',
  reaper: 'Hero. Massive hits; nearby peppers go into a frenzy.',
};

function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

function drawSporePatch(c, x, y, level, t, bounce = 0) {
  const cx = x + 0.5, cy = y + 0.55, k = 1 + bounce * 0.3 + Math.sin(t * 2 + x) * 0.03;
  c.beginPath(); c.ellipse(cx, cy + 0.12, 0.38, 0.16, 0, 0, Math.PI * 2); c.fillStyle = '#4a2f17'; c.fill();
  for (const [dx, dy, r, col] of [[-0.15, 0.02, 0.15, '#ff8a1c'], [0.14, 0.04, 0.13, '#e8452c'], [0, -0.1, 0.17, '#ffb02e']]) {
    c.beginPath(); c.ellipse(cx + dx, cy + dy, r * k, r * 0.9 * k, 0, 0, Math.PI * 2); c.fillStyle = col; c.fill();
    c.beginPath(); c.ellipse(cx + dx - r * 0.3, cy + dy - r * 0.3, r * 0.3, r * 0.2, 0, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fill();
  }
}
const fmt = (n) => Math.floor(n).toLocaleString();

export function createGarden({ canvas, player, onRaid, onDig, onDefend, showTip }) {
  const c = canvas.getContext('2d');
  const view = { tile: 20, dpr: 1, S: 20 };
  const bg = document.createElement('canvas');
  let bgKey = '';
  let clock = 0;
  const bounces = new Map();     // id -> time of last sprout animation
  const floaters = [];           // floating "+120 ☀️" texts
  const leaves = [];             // falling-leaf particles
  // ui state
  let selected = null;           // 'stem' | plant object | null
  let place = null;              // { kind: 'build'|'move', type, target, x, y, size }
  let sheet = null;              // 'info' | 'build' | 'army' | 'place' | null

  const p = player;
  const save = () => S.save(p);

  // ---------- layout ----------

  function resize(cssW, cssH) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const tile = Math.floor(Math.min(cssW / COLS, cssH / ROWS) * 100) / 100;
    Object.assign(view, { tile, dpr, S: tile * dpr });
    canvas.style.width = tile * COLS + 'px';
    canvas.style.height = tile * ROWS + 'px';
    canvas.width = Math.round(tile * COLS * dpr);
    canvas.height = Math.round(tile * ROWS * dpr);
    bgKey = '';
  }

  function toWorld(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / view.tile, y: (e.clientY - r.top) / view.tile };
  }

  // ---------- background (grass + tilled soil) ----------

  function buildBackground() {
    const a = S.buildArea(p);
    const key = `${canvas.width}x${canvas.height}:${a.w}`;
    if (key === bgKey) return;
    bgKey = key;
    bg.width = canvas.width; bg.height = canvas.height;
    const g = bg.getContext('2d');
    g.setTransform(view.S, 0, 0, view.S, 0, 0);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      g.fillStyle = (x + y) % 2 ? '#6cbf4a' : '#64b544';
      g.fillRect(x, y, 1.01, 1.01);
    }
    for (let i = 0; i < 140; i++) {
      const x = hash(i) * COLS, y = hash(i + 500) * ROWS;
      g.strokeStyle = 'rgba(40,110,30,0.6)'; g.lineWidth = 0.04;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 0.06, y - 0.15); g.moveTo(x, y); g.lineTo(x + 0.05, y - 0.17); g.stroke();
    }
    // next growth ring preview
    const next = STEM_LEVELS[p.stem.level + 1];
    if (next) {
      const ox = Math.floor((COLS - next.area) / 2), oy = Math.floor((ROWS - next.area) / 2);
      g.setLineDash([0.25, 0.2]);
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.05;
      g.strokeRect(ox + 0.05, oy + 0.05, next.area - 0.1, next.area - 0.1);
      g.setLineDash([]);
    }
    // soil
    g.fillStyle = '#4a3020';
    g.beginPath(); g.roundRect(a.x - 0.1, a.y - 0.1, a.w + 0.2, a.h + 0.2, 0.5); g.fill();
    g.fillStyle = '#6b4528';
    g.beginPath(); g.roundRect(a.x, a.y, a.w, a.h, 0.4); g.fill();
    g.strokeStyle = 'rgba(40,22,10,0.35)'; g.lineWidth = 0.05;
    for (let y = a.y + 0.5; y < a.y + a.h; y += 0.5) {
      g.beginPath(); g.moveTo(a.x + 0.2, y); g.lineTo(a.x + a.w - 0.2, y); g.stroke();
    }
    for (let i = 0; i < 60; i++) {
      const x = a.x + hash(i + 77) * a.w, y = a.y + hash(i + 177) * a.h;
      g.fillStyle = i % 2 ? 'rgba(120,85,50,0.7)' : 'rgba(50,30,15,0.5)';
      g.beginPath(); g.arc(x, y, 0.04 + hash(i) * 0.04, 0, Math.PI * 2); g.fill();
    }
  }

  // ---------- drawing ----------

  function sizeOf(q) { return q === 'stem' ? 3 : PLANTS[q.type].size; }

  const isHedgeAt = (x, y) => p.plants.some(q => q.type === 'hedge' && q.x === x && q.y === y);
  function art(type) {
    if (type === 'thorn' || type === 'sap') return (c2, x, y, level, t) => drawTurret(c2, type, x, y, level, t, -Math.PI / 2 + Math.sin(t * 0.7 + x) * 0.8, x * 31 + y);
    if (type === 'hedge') return (c2, x, y) => drawHedge(c2, x, y, x * 17 + y * 3, isHedgeAt);
    if (type === 'spore') return drawSporePatch;
    return PLANT_ART[type];
  }
  function posOf(q) { return q === 'stem' ? p.stem : q; }

  function bounceOf(id) {
    const t0 = bounces.get(id);
    if (t0 == null) return 0;
    const k = (clock - t0) / 0.6;
    if (k >= 1) { bounces.delete(id); return 0; }
    return Math.sin(k * Math.PI * 3) * (1 - k);
  }

  function drawVine(x1, y1, x2, y2, seed) {
    const mx = (x1 + x2) / 2 + (hash(seed) - 0.5) * 1.5;
    const my = (y1 + y2) / 2 + (hash(seed + 3) - 0.5) * 1.5;
    c.lineCap = 'round';
    c.strokeStyle = '#2f6b22'; c.lineWidth = 0.28;
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.stroke();
    c.strokeStyle = '#4fa63a'; c.lineWidth = 0.14;
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.stroke();
    for (let k = 0.25; k < 0.9; k += 0.3) {
      const ix = (1 - k) * (1 - k) * x1 + 2 * (1 - k) * k * mx + k * k * x2;
      const iy = (1 - k) * (1 - k) * y1 + 2 * (1 - k) * k * my + k * k * y2;
      c.save(); c.translate(ix, iy); c.rotate(hash(seed + k * 10) * 6);
      c.beginPath(); c.ellipse(0.15, 0, 0.16, 0.07, 0, 0, Math.PI * 2); c.fillStyle = '#5cc04a'; c.fill();
      c.restore();
    }
  }

  function render() {
    buildBackground();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(bg, 0, 0);
    c.setTransform(view.S, 0, 0, view.S, 0, 0);
    const now = Date.now();
    const stemC = { x: p.stem.x + 1.5, y: p.stem.y + 2.2 };

    // vines from the stem to every plant (not to hedges & traps)
    for (const q of p.plants) {
      if (place && place.kind === 'move' && place.target === q) continue;
      if (PLANTS[q.type].size < 2) continue;
      drawVine(stemC.x, stemC.y, q.x + 1, q.y + 1.4, q.id);
    }

    // placement footprint
    if (place && place.kind !== 'paint') {
      const ok = S.fits(p, place.x, place.y, place.size, place.kind === 'move' ? (place.target === 'stem' ? 'stem' : place.target.id) : undefined);
      c.fillStyle = ok ? 'rgba(120,255,120,0.35)' : 'rgba(255,70,50,0.4)';
      c.strokeStyle = ok ? '#b8ffb0' : '#ff8a7a';
      c.lineWidth = 0.06;
      c.beginPath(); c.roundRect(place.x + 0.05, place.y + 0.05, place.size - 0.1, place.size - 0.1, 0.2); c.fill(); c.stroke();
    }

    // depth-sorted plants
    // hedges & spores lie flat, so they're drawn first
    const flat = (q) => q !== 'stem' && PLANTS[q.type].size === 1;
    const items = [{ q: 'stem', y: p.stem.y + 3 }, ...p.plants.map(q => ({ q, y: q.y + PLANTS[q.type].size - (flat(q) ? 100 : 0) }))];
    items.sort((m, n) => m.y - n.y);
    for (const { q } of items) {
      const moving = place && place.kind === 'move' && place.target === q;
      const pos = moving ? place : posOf(q);
      if (moving) c.globalAlpha = 0.75;
      if (q === selected && !place) {
        c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 0.07; c.setLineDash([0.2, 0.12]);
        const s = sizeOf(q);
        c.beginPath(); c.roundRect(pos.x + 0.05, pos.y + 0.05, s - 0.1, s - 0.1, 0.25); c.stroke(); c.setLineDash([]);
      }
      if (q === 'stem') drawStem(c, pos.x, pos.y, p.stem.level, clock, bounceOf('stem'));
      else art(q.type)(c, pos.x, pos.y, q.level, clock, bounceOf(q.id), q.type === 'blossom' ? troopsShown(q) : 0);
      c.globalAlpha = 1;
    }

    // ghost for a new building
    if (place && place.kind === 'build') {
      c.globalAlpha = 0.8;
      art(place.type)(c, place.x, place.y, 1, clock, 0, 0);
      c.globalAlpha = 1;
    }

    // ready bubbles
    for (const q of p.plants) {
      const d = PLANTS[q.type];
      if (!d.makes || (place && place.target === q)) continue;
      const amt = S.stored(q, now);
      if (amt >= Math.max(1, d.store[q.level] * 0.1)) drawBubble(c, q.x + 1.55, q.y - 0.1, d.makes, clock, amt >= d.store[q.level]);
    }

    // falling leaves
    for (const l of leaves) {
      c.save(); c.translate(l.x, l.y); c.rotate(l.r);
      c.globalAlpha = Math.min(1, l.life * 2);
      c.beginPath(); c.ellipse(0, 0, 0.14, 0.06, 0, 0, Math.PI * 2); c.fillStyle = l.color; c.fill();
      c.restore();
    }
    c.globalAlpha = 1;

    // screen-space text: level badges + floaters
    c.setTransform(1, 0, 0, 1, 0, 0);
    const badge = Math.max(9, view.tile * 0.34) * view.dpr;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `${badge}px 'Lilita One', system-ui, sans-serif`;
    for (const { q } of items) {
      if (flat(q)) continue;
      const pos = posOf(q), s = sizeOf(q);
      const lvl = q === 'stem' ? p.stem.level : q.level;
      const bx = (pos.x + s - 0.25) * view.S, by = (pos.y + s - 0.25) * view.S;
      c.fillStyle = '#2b1d14'; c.beginPath(); c.arc(bx, by, badge * 0.72, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(bx, by, badge * 0.58, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2b1d14'; c.fillText(String(lvl), bx, by + badge * 0.05);
    }
    const fs = Math.max(12, view.tile * 0.5) * view.dpr;
    c.font = `${fs}px 'Lilita One', system-ui, sans-serif`;
    c.textBaseline = 'alphabetic';
    for (const f of floaters) {
      c.globalAlpha = Math.min(1, f.life * 2);
      const px = f.x * view.S, py = f.y * view.S;
      c.lineWidth = fs * 0.18; c.strokeStyle = 'rgba(0,0,0,0.7)'; c.strokeText(f.text, px, py);
      c.fillStyle = f.color; c.fillText(f.text, px, py);
    }
    c.globalAlpha = 1;
  }

  // Spread the army across Blossoms just for show.
  function troopsShown(q) {
    const blossoms = p.plants.filter(b => b.type === 'blossom');
    const total = Object.values(p.army).reduce((a, b) => a + b, 0);
    const i = blossoms.indexOf(q);
    return Math.max(0, Math.ceil((total - i * 5) / Math.max(1, blossoms.length)));
  }

  // ---------- effects ----------

  function sprout(q) {
    const pos = posOf(q), s = sizeOf(q);
    bounces.set(q === 'stem' ? 'stem' : q.id, clock);
    for (let i = 0; i < 14; i++) {
      leaves.push({
        x: pos.x + s / 2 + (Math.random() - 0.5) * s * 0.6, y: pos.y + s / 2,
        vx: (Math.random() - 0.5) * 3, vy: -2 - Math.random() * 2, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8,
        life: 1 + Math.random() * 0.5, color: ['#5cc04a', '#7fd85a', '#3fa13a', '#ffe066'][i % 4],
      });
    }
  }

  function floatText(x, y, text, color) { floaters.push({ x, y, text, color, life: 1.2 }); }

  // ---------- HUD ----------

  const sunEl = $('#g-sun'), waterEl = $('#g-water'), seedEl = $('#g-seeds');
  const sunBar = $('#g-sun-bar'), waterBar = $('#g-water-bar');
  const raidSub = $('#g-raid-sub');
  function updateHud() {
    const cp = S.cap(p);
    sunEl.textContent = `${fmt(p.sun)} / ${fmt(cp.sun)}`;
    waterEl.textContent = `${fmt(p.water)} / ${fmt(cp.water)}`;
    seedEl.textContent = fmt(p.seeds);
    sunBar.style.width = Math.min(100, p.sun / cp.sun * 100) + '%';
    waterBar.style.width = Math.min(100, p.water / cp.water * 100) + '%';
    raidSub.textContent = `Map · ${S.conqueredCount(p)}/${MAP_COUNT}`;
    const due = S.attackDue(p);
    alertEl.hidden = !due;
    if (due) $('#g-alert small').textContent = `${S.swarmSummary(p)}. Tap to defend!`;
    $('#g-dig-sub').innerHTML = S.digReady(p) ? `💧 ${DIG.fee}<span class="dot"></span>` : 'Tomorrow';
    const boost = S.sunBoost(p);
    let bEl = $('#g-boost');
    if (boost) {
      if (!bEl) { bEl = document.createElement('span'); bEl.id = 'g-boost'; bEl.className = 'boost'; sunEl.after(bEl); }
      const mins = Math.ceil((boost.until - Date.now()) / 60000);
      bEl.textContent = `×2 ${mins >= 60 ? Math.floor(mins / 60) + 'h ' : ''}${mins % 60}m`;
    } else if (bEl) bEl.remove();
    $('#g-army-sub').textContent = `${S.housingUsed(p)} / ${S.housingCap(p)}`;
    if (sheet === 'army') refreshArmy();
    if (sheet === 'info') refreshInfoButtons();
  }

  // ---------- sheets ----------

  const sheetEl = $('#sheet');
  function openSheet(kind, html) {
    sheetEl.classList.toggle('again', sheet === kind);
    sheet = kind;
    sheetEl.innerHTML = html;
    sheetEl.classList.remove('hidden');
    sheetEl.dataset.kind = kind;
  }
  function closeSheet() {
    sheet = null;
    sheetEl.classList.add('hidden');
    sheetEl.innerHTML = '';
    for (const b of document.querySelectorAll('#gbar .gbtn')) b.classList.remove('active');
  }

  function btn(id, label, sub, cls = '') {
    return `<button id="${id}" class="sbtn ${cls}"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
  }

  // ----- info sheet for a selected building -----
  function infoHtml(q) {
    if (q === 'stem') {
      const L = p.stem.level, cur = STEM_LEVELS[L], nxt = STEM_LEVELS[L + 1];
      const lim = (o) => `${o.limits.leaf} Leaves · ${o.limits.root} Roots · ${o.limits.blossom} Blossoms`;
      return `
        <div class="sh-head"><h3>The Stem <span class="lvl">Lv ${L}</span></h3><button class="x" data-close>✕</button></div>
        <p class="sh-blurb">The heart of your plant. If it falls in battle, you lose.</p>
        <div class="stats">
          <div><span>Plot</span><b>${cur.area}×${cur.area}</b>${nxt ? `<i>→ ${nxt.area}×${nxt.area}</i>` : ''}</div>
          <div><span>Storage</span><b>${fmt(cur.cap.sun)}</b>${nxt ? `<i>→ ${fmt(nxt.cap.sun)}</i>` : ''}</div>
          <div class="wide"><span>Allows</span><b>${lim(cur)}</b>${nxt ? `<i>→ ${lim(nxt)}</i>` : ''}</div>
        </div>
        <div class="row">${btn('sh-up', nxt ? 'Grow' : 'Fully grown', nxt ? `☀️ ${fmt(nxt.cost)}` : '', 'primary')}${btn('sh-move', 'Move', '')}</div>`;
    }
    const d = PLANTS[q.type], L = q.level, N = L + 1;
    const has = (arr) => arr && arr[N] != null;
    let stats = '';
    if (d.makes) {
      const icon = RES_ICON[d.makes];
      stats = `
        <div><span>Makes</span><b>${d.rate[L]} ${icon}/min</b>${has(d.rate) ? `<i>→ ${d.rate[N]}</i>` : ''}</div>
        <div><span>Holds</span><b>${fmt(d.store[L])}</b>${has(d.store) ? `<i>→ ${fmt(d.store[N])}</i>` : ''}</div>
        <div><span>Ready</span><b id="sh-ready">${fmt(S.stored(q))}</b></div>`;
    } else if (q.type === 'thorn' || q.type === 'sap') {
      const B = BUILDINGS[q.type];
      const nx = d.cost[N] != null;
      const dps = (lv) => Math.round(B.dmg * DEFENSE.dmgByLevel[lv] / B.interval);
      stats = `
        <div><span>Damage/s</span><b>${dps(L)}</b>${nx ? `<i>→ ${dps(N)}</i>` : ''}</div>
        <div><span>Health</span><b>${fmt(B.hp * DEFENSE.hpByLevel[L])}</b>${nx ? `<i>→ ${fmt(B.hp * DEFENSE.hpByLevel[N])}</i>` : ''}</div>
        <div><span>Range</span><b>${B.range} tiles</b></div>`;
    } else if (q.type === 'spore') {
      stats = `<div><span>Blast</span><b>${TRAP.dmg} damage</b></div><div><span>Radius</span><b>${TRAP.radius} tiles</b></div><div><span>Seen by</span><b>Only you</b></div>`;
    } else if (q.type === 'hedge') {
      stats = `<div><span>Health</span><b>${fmt(BUILDINGS.wall.hp)}</b></div><div class="wide"><span>Tip</span><b>Bugs chew through hedges. Wasps fly over them.</b></div>`;
    } else if (q.type === 'lab') {
      stats = '';
    } else {
      stats = `<div><span>Houses</span><b>${d.housing[L]} troops</b>${has(d.housing) ? `<i>→ ${d.housing[N]}</i>` : ''}</div>`;
    }
    const cost = S.upgradeCost(p, q);
    return `
      <div class="sh-head"><h3>${d.name} <span class="lvl">Lv ${L}</span></h3><button class="x" data-close>✕</button></div>
      <p class="sh-blurb">${d.blurb}</p>
      <div class="stats">${stats}</div>
      <div class="row">
        ${btn('sh-up', cost != null ? 'Upgrade' : 'Max level', cost != null ? `☀️ ${fmt(cost)}` : '', 'primary')}
        ${d.makes ? btn('sh-collect', 'Collect', '') : ''}
        ${btn('sh-move', 'Move', '')}
        ${d.size === 1 ? btn('sh-dig-up', 'Remove', '') : ''}
      </div>
      <p class="sh-note" id="sh-note"></p>`;
  }

  function openInfo(q) {
    if (q !== 'stem' && q.type === 'lab') { openLab(q); return; }
    if (q !== 'stem' && q.type === 'greenhouse') { openGreenhouse(q); return; }
    selected = q;
    openSheet('info', infoHtml(q));
    wireSheetCommon();
    $('#sh-up').onclick = () => {
      const err = S.upgrade(p, q);
      if (err) { sfx('deny'); showTip(err); return; }
      sfx('star'); sprout(q); save();
      if (q === 'stem') { bgKey = ''; showTip(`Your Stem grew to level ${p.stem.level}!`); }
      openInfo(q);
    };
    $('#sh-move').onclick = () => startMove(q);
    const rm = $('#sh-dig-up');
    if (rm) rm.onclick = () => { p.plants.splice(p.plants.indexOf(q), 1); sfx('crunch'); save(); selected = null; closeSheet(); };
    const col = $('#sh-collect');
    if (col) col.onclick = () => { collect(q); openInfo(q); };
    refreshInfoButtons();
  }

  function refreshInfoButtons() {
    const up = $('#sh-up');
    if (!up || !selected) return;
    const err = S.canUpgrade(p, selected);
    up.classList.toggle('disabled', !!err);
    const note = $('#sh-note');
    if (note) note.textContent = err && err !== 'Max level' ? err : '';
    const ready = $('#sh-ready');
    if (ready && selected !== 'stem') ready.textContent = fmt(S.stored(selected));
  }

  // ----- Flavor Lab -----
  function openLab(q) {
    selected = q;
    const troops = Object.keys(TROOPS);
    const rows = Object.entries(FLAVORS).map(([f, d]) => {
      const unlocked = p.flavors.unlocked.includes(f);
      const right = !unlocked && d.rare
        ? `<span class="rare-tag">Deep find in Root Roulette</span>`
        : unlocked
        ? `<span class="tchips">${troops.map(tr => `<button class="tchip ${p.flavors.infused[tr] === f ? 'on' : ''}" data-f="${f}" data-t="${tr}" aria-label="Infuse ${UNITS[tr].name}"><canvas width="64" height="64"></canvas></button>`).join('')}</span>`
        : `<button class="sbtn primary unlock" data-f="${f}"><b>Unlock</b><small>🌱 ${d.seeds}</small></button>`;
      return `<div class="frow ${unlocked ? '' : 'locked'}">
        <span class="ficon" style="--fc:${d.color}">${d.icon}</span>
        <span class="bmain"><b>${d.name}</b><small>${d.text}</small><small class="best">Best on ${d.best}</small></span>
        ${right}
      </div>`;
    }).join('');
    openSheet('lab', `
      <div class="sh-head"><h3>Flavor Lab <span class="lvl">🌱 ${fmt(p.seeds)}</span></h3><button class="x" data-close>✕</button></div>
      <p class="sh-blurb">Unlock flavors with Spice Seeds. Then tap a troop to infuse it (💧 ${INFUSE_COST}). Each troop type holds one flavor; tap again to remove it.</p>
      <div class="flist">${rows}</div>
      <div class="row lab-foot">${btn('sh-move', 'Move Lab', '')}</div>`);
    wireSheetCommon();
    $('#sh-move').onclick = () => startMove(q);
    for (const ch of sheetEl.querySelectorAll('.tchip')) {
      drawUnitIcon(ch.querySelector('canvas'), ch.dataset.t);
      ch.onclick = () => {
        const had = p.flavors.infused[ch.dataset.t] === ch.dataset.f;
        const err = S.infuse(p, ch.dataset.t, ch.dataset.f);
        if (err) { sfx('deny'); showTip(err); return; }
        sfx(had ? 'click' : 'sap');
        if (!had) showTip(`${UNITS[ch.dataset.t].name}s infused with ${FLAVORS[ch.dataset.f].name}!`);
        save(); keepScroll(() => openLab(q));
      };
    }
    for (const b of sheetEl.querySelectorAll('.unlock')) {
      b.onclick = () => {
        const err = S.unlockFlavor(p, b.dataset.f);
        if (err) { sfx('deny'); showTip(err); return; }
        sfx('star'); sprout(q); save();
        showTip(`${FLAVORS[b.dataset.f].name} unlocked!`);
        keepScroll(() => openLab(q));
      };
    }
  }

  // ----- Greenhouse -----
  const gh = { a: 'bell', b: 'habanero', f: null, fresh: null };
  const statLine = (d) => {
    const bits = [`❤ ${d.hp}`, `⚔ ${d.dmg}`, `💨 ${d.speed}`];
    if (d.ranged) bits.push('ranged');
    if (d.splash) bits.push('splash');
    if (d.phase) bits.push('phases');
    if (d.taunt) bits.push('taunts');
    if (d.targeting === 'defense') bits.push('hunts turrets');
    return bits.join(' · ');
  };

  function openGreenhouse(q) {
    selected = q;
    const parents = S.breedParents(p);
    if (!parents.some(o => o.key === gh.a)) gh.a = parents[0].key;
    if (!parents.some(o => o.key === gh.b)) gh.b = parents[Math.min(1, parents.length - 1)].key;
    if (gh.f && !p.flavors.unlocked.includes(gh.f)) gh.f = null;
    const chips = (role, cur) => parents.map(o => `<button class="pchip ${o.key === cur ? 'on' : ''}" data-role="${role}" data-k="${o.key}"><canvas width="64" height="64"></canvas><span>${o.name}</span></button>`).join('');
    const flavChips = `<button class="pchip flav ${!gh.f ? 'on' : ''}" data-role="f" data-k=""><span class="fi">—</span><span>None</span></button>` +
      p.flavors.unlocked.map(f => `<button class="pchip flav ${gh.f === f ? 'on' : ''}" data-role="f" data-k="${f}"><span class="fi">${FLAVORS[f].icon}</span><span>${FLAVORS[f].name}</span></button>`).join('');
    const quote = S.breedQuote(p, gh.a, gh.b, gh.f);
    const err = S.canBreed(p, gh.a, gh.b, gh.f);
    const strains = p.strains.map(s => {
      const d = S.strainDef(s);
      return `<div class="srow ${s.dud ? 'dud' : ''} ${gh.fresh === s.id ? 'fresh' : ''}" data-id="${s.id}">
        <canvas width="96" height="96"></canvas>
        <span class="bmain"><b>${s.name}${s.flavor ? ` ${FLAVORS[s.flavor].icon}` : ''}</b>
          <small>${s.dud ? GREENHOUSE.duds[s.dud].text : `Gen ${s.gen} · ${statLine(d)}`}</small>
          <small>Takes ${s.housing} space · 💧 ${s.cost} to grow</small>
          <input class="scode" readonly value="${S.seedCode(s)}" aria-label="Seed code for ${s.name}"></span>
        <span class="sbtns"><button class="sbtn mini copy" data-id="${s.id}"><b>Copy code</b></button><button class="sbtn mini compost" data-id="${s.id}"><b>Compost</b></button></span>
      </div>`;
    }).join('') || '<p class="sh-blurb">No strains yet. Cross two peppers above!</p>';
    openSheet('greenhouse', `
      <div class="sh-head"><h3>Greenhouse <span class="lvl">🌱 ${fmt(p.seeds)}</span></h3><button class="x" data-close>✕</button></div>
      <p class="sh-blurb">The <b>Body</b> parent gives health, speed and size. The <b>Seed</b> parent gives the attack and who it targets. Mix in a flavor to stabilize the cross, or risk a Dud.</p>
      <h4 class="bgroup">Body parent</h4><div class="pchips">${chips('a', gh.a)}</div>
      <h4 class="bgroup">Seed parent</h4><div class="pchips">${chips('b', gh.b)}</div>
      <h4 class="bgroup">Stabilizer</h4><div class="pchips">${flavChips}</div>
      <div class="breed-preview">
        <span>→ <b>${quote.name}</b> · Gen ${quote.gen}</span>
        <span class="odds ${quote.chance < 0.5 ? 'risky' : ''}">${Math.round(quote.chance * 100)}% chance it sprouts</span>
      </div>
      <div class="row">${btn('gh-breed', 'Cross-pollinate', `💧 ${quote.water} · 🌱 ${quote.seeds}`, 'primary')}</div>
      <p class="sh-note">${err && err !== 'Pick two parents' ? err : ''}</p>
      <h4 class="bgroup">Your strains (${p.strains.length} / ${GREENHOUSE.maxStrains})</h4>
      <div class="slist">${strains}</div>
      <h4 class="bgroup">Plant a seed code</h4>
      <div class="row codein"><input id="gh-code" placeholder="Paste a PP1-… code from a friend" aria-label="Seed code"><button id="gh-plant" class="sbtn"><b>Plant</b></button></div>
      <div class="row lab-foot">${btn('sh-move', 'Move Greenhouse', '')}</div>`);
    wireSheetCommon();
    $('#gh-breed').classList.toggle('disabled', !!err);
    for (const ch of sheetEl.querySelectorAll('.pchip')) {
      const cv = ch.querySelector('canvas');
      if (cv) { const k = ch.dataset.k; drawUnitIcon(cv, k, UNITS[k] ? undefined : S.strainDef(p.strains.find(s => s.id === k))); }
      ch.onclick = () => { gh[ch.dataset.role] = ch.dataset.k || null; sfx('click'); keepScroll(() => openGreenhouse(q)); };
    }
    for (const row of sheetEl.querySelectorAll('.srow')) {
      const s = p.strains.find(x => x.id === row.dataset.id);
      drawUnitIcon(row.querySelector('canvas'), s.id, S.strainDef(s));
    }
    for (const b of sheetEl.querySelectorAll('.copy')) {
      b.onclick = () => {
        const input = b.closest('.srow').querySelector('.scode');
        const done = () => { showTip('Seed code copied!'); sfx('click'); };
        const fallback = () => { input.focus(); input.select(); showTip('Code selected. Copy it from here.'); };
        try { navigator.clipboard.writeText(input.value).then(done, fallback); } catch (e) { fallback(); }
      };
    }
    for (const b of sheetEl.querySelectorAll('.compost')) {
      b.onclick = () => {
        if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.querySelector('b').textContent = 'Sure?'; return; }
        S.compostStrain(p, b.dataset.id); sfx('crunch'); save(); keepScroll(() => openGreenhouse(q));
      };
    }
    $('#gh-breed').onclick = () => {
      const r = S.breed(p, gh.a, gh.b, gh.f);
      if (r.error) { sfx('deny'); showTip(r.error); return; }
      gh.fresh = r.strain.id;
      save(); sprout(q);
      if (r.strain.dud) { sfx('lose'); showTip(`Oh no… a ${r.strain.name}! At least turrets will pity it.`); }
      else { sfx('win'); showTip(`It's a ${r.strain.name}! Grow them in your Platoon.`); }
      openGreenhouse(q);
      const fresh = sheetEl.querySelector('.srow.fresh');
      if (fresh) fresh.scrollIntoView({ block: 'nearest' });
    };
    $('#gh-plant').onclick = () => {
      const r = S.plantSeedCode(p, $('#gh-code').value);
      if (r.error) { sfx('deny'); showTip(r.error); return; }
      gh.fresh = r.strain.id; save(); sfx('win'); showTip(`${r.strain.name} sprouted from the seed code!`);
      openGreenhouse(q);
    };
    $('#sh-move').onclick = () => startMove(q);
  }

  function keepScroll(fn) {
    const y = sheetEl.scrollTop;
    fn();
    sheetEl.scrollTop = y;
  }

  // ----- build sheet -----
  let buildTab = 'garden';
  function openBuild(tab) {
    selected = null;
    if (tab) buildTab = tab;
    const row = ([type, d]) => {
      const n = S.countOf(p, type), lim = S.limitOf(p, type);
      const err = S.canBuild(p, type);
      return `<button class="brow ${err ? 'disabled' : ''}" data-type="${type}">
        <canvas width="96" height="96"></canvas>
        <span class="bmain"><b>${d.name}</b><small>${d.blurb}</small></span>
        <span class="bside"><b>☀️ ${fmt(d.cost[1])}</b><small>${lim ? `${n} / ${lim}` : `Stem Lv ${PLANT_UNLOCK(type)}`}</small></span>
      </button>`;
    };
    const all = Object.entries(PLANTS);
    const def = buildTab === 'defense';
    openSheet('build', `<div class="sh-head"><h3>Plant something</h3><button class="x" data-close>✕</button></div>
      <div class="tabs"><button class="tab ${def ? '' : 'on'}" data-tab="garden">🌿 Garden</button><button class="tab ${def ? 'on' : ''}" data-tab="defense">🛡️ Defenses</button></div>
      <div class="blist">${all.filter(([, d]) => !!d.defense === def).map(row).join('')}</div>`);
    wireSheetCommon();
    for (const t of sheetEl.querySelectorAll('.tab')) t.onclick = () => { sfx('click'); openBuild(t.dataset.tab); };
    for (const el of sheetEl.querySelectorAll('.brow')) {
      plantIcon(el.querySelector('canvas'), el.dataset.type);
      el.onclick = () => {
        const err = S.canBuild(p, el.dataset.type);
        if (err) { sfx('deny'); showTip(err); return; }
        startBuild(el.dataset.type);
      };
    }
  }

  function plantIcon(cv, type) {
    if (!['thorn', 'sap', 'hedge', 'spore'].includes(type)) { drawPlantIcon(cv, type); return; }
    const c2 = cv.getContext('2d'), s = cv.width;
    c2.clearRect(0, 0, s, s);
    c2.save();
    if (type === 'thorn' || type === 'sap') { c2.scale(s / 2.4, s / 2.4); c2.translate(0.2, 0.45); drawTurret(c2, type, 0, 0, 1, 0); }
    else { c2.scale(s / 1.2, s / 1.2); c2.translate(0.1, 0.05); art(type)(c2, 0, 0, 1, 0, 0); }
    c2.restore();
  }

  // ----- army sheet -----
  function openArmy() {
    selected = null;
    const strainRows = p.strains.map(s => `
      <div class="arow hybrid ${s.dud ? 'dud' : ''}" data-type="${s.id}">
        <canvas width="96" height="96"></canvas>
        <span class="bmain"><b>${s.name}${s.flavor ? ` ${FLAVORS[s.flavor].icon}` : ''}</b><small>${s.dud ? 'Dud · stuns turrets with pity' : `Gen-${s.gen} hybrid · takes ${s.housing} space`}</small><small class="blurb">${s.dud ? '' : statLine(S.strainDef(s))}</small></span>
        <span class="acount" id="ac-${s.id}">x0</span>
        <button class="sbtn primary train" data-type="${s.id}"><b>+1</b><small>💧 ${s.cost}</small></button>
      </div>`).join('');
    const rows = Object.entries(TROOPS).map(([type, t]) => {
      const locked = t.stem && p.stem.level < t.stem;
      const info = t.max ? `${UNITS[type].role} · one per raid, no space needed` : `${UNITS[type].role} · takes ${t.housing} space`;
      const price = `💧 ${t.cost}${t.seeds ? ` 🌱${t.seeds}` : ''}`;
      return `
      <div class="arow ${locked ? 'locked' : ''} ${t.max ? 'hero' : ''}" data-type="${type}">
        <canvas width="96" height="96"></canvas>
        <span class="bmain"><b>${UNITS[type].name}</b><small>${locked ? `Unlocks at Stem level ${t.stem}` : info}</small><small class="blurb">${TROOP_BLURB[type]}</small></span>
        <span class="acount" id="ac-${type}">x0</span>
        <button class="sbtn primary train" data-type="${type}"><b>${locked ? '🔒' : '+1'}</b><small>${price}</small></button>
      </div>`;
    }).join('');
    openSheet('army', `
      <div class="sh-head"><h3>Grow your platoon</h3><button class="x" data-close>✕</button></div>
      <div class="housing"><span>Blossom space</span><div class="hbar"><i id="hbar"></i></div><b id="hnum"></b></div>
      <div class="alist">${rows}</div>
      ${strainRows ? `<h4 class="bgroup">Greenhouse hybrids</h4><div class="alist">${strainRows}</div>` : ''}`);
    wireSheetCommon();
    for (const el of sheetEl.querySelectorAll('.arow')) {
      const s = p.strains.find(x => x.id === el.dataset.type);
      drawUnitIcon(el.querySelector('canvas'), el.dataset.type, s ? S.strainDef(s) : undefined);
    }
    for (const b of sheetEl.querySelectorAll('.train')) {
      b.onclick = () => {
        const err = S.train(p, b.dataset.type);
        if (err) { sfx('deny'); showTip(err); return; }
        sfx('pop'); save(); refreshArmy();
      };
    }
    refreshArmy();
  }

  function refreshArmy() {
    const used = S.housingUsed(p), capH = S.housingCap(p);
    const hb = $('#hbar'); if (!hb) return;
    hb.style.width = Math.min(100, used / Math.max(1, capH) * 100) + '%';
    $('#hnum').textContent = `${used} / ${capH}`;
    for (const type of [...Object.keys(TROOPS), ...p.strains.map(s => s.id)]) {
      $('#ac-' + type).textContent = 'x' + (p.army[type] || 0);
      sheetEl.querySelector(`.train[data-type="${type}"]`).classList.toggle('disabled', !!S.canTrain(p, type));
    }
  }

  // ----- placement -----
  function startBuild(type) {
    if (type === 'hedge') {
      place = { kind: 'paint', type, size: 1, x: -10, y: -10 };
      openSheet('place', `
        <div class="sh-head"><h3>Plant Bramble Hedges</h3></div>
        <p class="sh-blurb">Tap or drag across the soil to plant hedges (☀️ ${PLANTS.hedge.cost[1]} each). <b id="pl-count"></b></p>
        <div class="row">${btn('pl-cancel', 'Done', '', 'primary')}</div>`);
      $('#pl-cancel').onclick = () => { place = null; closeSheet(); };
      updatePaintCount();
      return;
    }
    const size = PLANTS[type].size;
    const spot = S.findSpot(p, size);
    place = { kind: 'build', type, size, x: spot.x, y: spot.y };
    openPlaceSheet(`Plant a ${PLANTS[type].name}`, `☀️ ${fmt(PLANTS[type].cost[1])}`);
  }
  function startMove(q) {
    const pos = posOf(q);
    place = { kind: 'move', target: q, size: sizeOf(q), x: pos.x, y: pos.y };
    openPlaceSheet(`Move ${q === 'stem' ? 'the Stem' : 'the ' + PLANTS[q.type].name}`, '');
  }
  function openPlaceSheet(title, cost) {
    openSheet('place', `
      <div class="sh-head"><h3>${title}</h3></div>
      <p class="sh-blurb">Tap or drag on the soil to choose a spot.</p>
      <div class="row">${btn('pl-ok', 'Confirm', cost, 'primary')}${btn('pl-cancel', 'Cancel', '')}</div>`);
    $('#pl-cancel').onclick = () => { place = null; closeSheet(); };
    $('#pl-ok').onclick = confirmPlace;
  }
  function confirmPlace() {
    if (!place) return;
    let err;
    if (place.kind === 'build') {
      err = S.build(p, place.type, place.x, place.y);
      if (!err) { const q = p.plants[p.plants.length - 1]; sfx('pop'); sprout(q); }
    } else {
      err = S.move(p, place.target, place.x, place.y);
      if (!err) { sfx('click'); sprout(place.target); }
    }
    if (err) { sfx('deny'); showTip(err); return; }
    save();
    place = null;
    closeSheet();
  }

  function wireSheetCommon() {
    for (const x of sheetEl.querySelectorAll('[data-close]')) x.onclick = () => { selected = null; closeSheet(); };
  }

  // ---------- actions ----------

  function collect(q) {
    const r = S.harvest(p, q);
    if (r.full) { sfx('deny'); showTip('Storage full! Grow your Stem to hold more.'); return false; }
    if (!r.got) return false;
    floatText(q.x + 1, q.y, `+${fmt(r.got)} ${RES_ICON[r.resource]}`, r.resource === 'sun' ? '#ffd23f' : '#7fd3ff');
    sfx(r.resource === 'sun' ? 'star' : 'sap');
    save();
    return true;
  }

  function hitTest(x, y) {
    for (let i = p.plants.length - 1; i >= 0; i--) {
      const q = p.plants[i], s = PLANTS[q.type].size;
      if (x >= q.x && x < q.x + s && y >= q.y && y < q.y + s) return q;
    }
    if (x >= p.stem.x && x < p.stem.x + 3 && y >= p.stem.y - 1 && y < p.stem.y + 3) return 'stem';
    return null;
  }

  function updatePaintCount() {
    const el = $('#pl-count');
    if (el) el.textContent = `${S.countOf(p, 'hedge')} / ${S.limitOf(p, 'hedge')} planted`;
  }
  function paintHedge(w) {
    const x = Math.floor(w.x), y = Math.floor(w.y);
    if (place.x === x && place.y === y) return;
    place.x = x; place.y = y;
    if (!S.fits(p, x, y, 1)) return;
    const err = S.canBuild(p, 'hedge');
    if (err) { if (!place.warned) { sfx('deny'); showTip(err); place.warned = true; } return; }
    S.build(p, 'hedge', x, y);
    sfx('pop'); save(); updatePaintCount();
  }

  let dragging = false;
  function movePlacement(w) {
    if (place.kind === 'paint') { paintHedge(w); return; }
    place.x = Math.floor(w.x - place.size / 2 + 0.5);
    place.y = Math.floor(w.y - place.size / 2 + 0.5);
    place.x = Math.max(0, Math.min(COLS - place.size, place.x));
    place.y = Math.max(0, Math.min(ROWS - place.size, place.y));
  }

  function pointerDown(e) {
    const w = toWorld(e);
    if (place) { dragging = true; movePlacement(w); return; }
    const q = hitTest(w.x, w.y);
    if (!q) { selected = null; closeSheet(); return; }
    if (q !== 'stem' && PLANTS[q.type].makes && S.stored(q) >= 1 && selected !== q) {
      if (collect(q)) return;
    }
    sfx('click');
    openInfo(q);
  }
  function pointerMove(e) { if (place && dragging) movePlacement(toWorld(e)); }
  function pointerUp() { dragging = false; }

  // ---------- bottom bar ----------

  $('#g-build').onclick = () => { place = null; toggle('build', () => openBuild(S.attackDue(p) ? 'defense' : undefined), '#g-build'); };
  $('#g-army').onclick = () => { place = null; toggle('army', openArmy, '#g-army'); };
  $('#g-dig').onclick = () => {
    const err = S.canDig(p);
    if (err) { sfx('deny'); showTip(err); return; }
    place = null; selected = null; closeSheet();
    onDig();
  };
  const alertEl = $('#g-alert');
  alertEl.onclick = () => {
    place = null; selected = null; closeSheet();
    onDefend();
  };
  $('#g-raid').onclick = () => {
    place = null; selected = null; closeSheet();
    onRaid();
  };
  function toggle(kind, open, id) {
    if (sheet === kind) { closeSheet(); return; }
    open();
    sfx('click');
    $(id).classList.add('active');
  }

  // ---------- loop ----------

  let hudT = 0;
  function frame(dt) {
    clock += dt;
    for (const f of floaters) { f.life -= dt; f.y -= dt * 0.9; }
    for (let i = floaters.length - 1; i >= 0; i--) if (floaters[i].life <= 0) floaters.splice(i, 1);
    for (const l of leaves) { l.life -= dt; l.x += l.vx * dt; l.y += l.vy * dt; l.vy += 5 * dt; l.vx *= 0.97; l.r += l.vr * dt; }
    for (let i = leaves.length - 1; i >= 0; i--) if (leaves[i].life <= 0) leaves.splice(i, 1);
    render();
    hudT += dt;
    if (hudT > 0.25) { hudT = 0; updateHud(); }
  }

  return {
    resize, frame, pointerDown, pointerMove, pointerUp,
    enter() { bgKey = ''; updateHud(); },
    exit() { place = null; selected = null; closeSheet(); },
    floatText,
    refresh: updateHud,
  };
}
