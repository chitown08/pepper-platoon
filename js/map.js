// The Garden Map: a backyard full of Bug Hives to raid, unlocked one by one.

import { GARDEN, MAP_NODES } from './config.js';
import * as S from './state.js';
import { drawStem } from './garden-art.js';
import { sfx } from './audio.js';

const $ = (s) => document.querySelector(s);
const { cols: COLS, rows: ROWS } = GARDEN;
const HOME = { x: 7.5, y: 18 };
const fmt = (n) => Math.floor(n).toLocaleString();

function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
function ellipse(c, x, y, rx, ry, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }

// ---------- location props ----------

const PROPS = {
  'Sandbox'(c, x, y) {
    c.fillStyle = '#8a5a2b'; c.fillRect(x - 1.5, y - 1.1, 3, 2.2);
    c.fillStyle = '#f1d58c'; c.fillRect(x - 1.35, y - 0.95, 2.7, 1.9);
    ellipse(c, x + 0.9, y + 0.5, 0.25, 0.15, '#e94b3c'); // toy bucket
    c.fillStyle = '#3a8fd8'; c.fillRect(x - 1.1, y + 0.3, 0.35, 0.12);
  },
  'Garden Hose'(c, x, y) {
    c.strokeStyle = '#2e8b3a'; c.lineWidth = 0.16;
    for (let r = 0.4; r < 1.3; r += 0.28) { c.beginPath(); c.ellipse(x + 0.4, y - 0.1, r, r * 0.7, 0, 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = '#ffcf33'; c.fillRect(x - 1.1, y + 0.6, 0.35, 0.18);
  },
  'Birdbath'(c, x, y) {
    ellipse(c, x, y - 0.4, 1.3, 0.55, '#a9a9a9');
    ellipse(c, x, y - 0.45, 1.05, 0.4, '#6cc4f2');
    ellipse(c, x - 0.3, y - 0.55, 0.25, 0.08, 'rgba(255,255,255,0.7)');
  },
  'Tool Shed'(c, x, y) {
    c.fillStyle = '#8b5a2b'; c.fillRect(x - 1.2, y - 1.4, 2.4, 1.5);
    c.fillStyle = '#5c3a1a';
    c.beginPath(); c.moveTo(x - 1.45, y - 1.35); c.lineTo(x, y - 2.2); c.lineTo(x + 1.45, y - 1.35); c.closePath(); c.fill();
    c.fillStyle = '#3d2610'; c.fillRect(x - 0.3, y - 0.9, 0.6, 1);
  },
  'Patio'(c, x, y) {
    for (let i = -2; i <= 1; i++) for (let j = -1; j <= 0; j++) {
      c.fillStyle = (i + j) % 2 ? '#c9b8a0' : '#b5a38a';
      c.fillRect(x + i * 0.8, y - 0.6 + j * 0.8, 0.78, 0.78);
    }
  },
  'Barbecue'(c, x, y) {
    c.strokeStyle = '#333'; c.lineWidth = 0.08;
    c.beginPath(); c.moveTo(x - 0.6, y + 0.2); c.lineTo(x - 0.9, y + 0.8); c.moveTo(x + 0.6, y + 0.2); c.lineTo(x + 0.9, y + 0.8); c.stroke();
    ellipse(c, x, y - 0.2, 1.1, 0.6, '#2a2a2a');
    ellipse(c, x, y - 0.3, 0.9, 0.45, '#552a1a');
    ellipse(c, x - 0.3, y - 0.3, 0.12, 0.08, '#ff7a1a');
    ellipse(c, x + 0.3, y - 0.25, 0.12, 0.08, '#ffb02e');
  },
  'Doghouse'(c, x, y) {
    c.fillStyle = '#c0392b'; c.fillRect(x - 1, y - 1.2, 2, 1.3);
    c.fillStyle = '#7b241c';
    c.beginPath(); c.moveTo(x - 1.25, y - 1.15); c.lineTo(x, y - 2); c.lineTo(x + 1.25, y - 1.15); c.closePath(); c.fill();
    ellipse(c, x, y - 0.35, 0.35, 0.45, '#2b1a10');
    ellipse(c, x + 1.3, y + 0.4, 0.25, 0.1, '#f4f4f4'); // bone
  },
  'Koi Pond'(c, x, y) {
    ellipse(c, x, y - 0.2, 1.6, 0.9, '#7a6a55');
    ellipse(c, x, y - 0.25, 1.45, 0.78, '#3a8fd8');
    ellipse(c, x - 0.4, y - 0.3, 0.25, 0.1, '#ff8a1c');
    ellipse(c, x + 0.5, y - 0.05, 0.22, 0.09, '#fff');
    ellipse(c, x + 0.9, y - 0.5, 0.3, 0.2, '#4fae3a'); // lily pad
  },
  'Greenhouse Ruins'(c, x, y) {
    c.fillStyle = 'rgba(200,235,255,0.55)';
    c.fillRect(x - 1.4, y - 1.5, 2.8, 1.6);
    c.strokeStyle = '#7a8a8a'; c.lineWidth = 0.06;
    c.strokeRect(x - 1.4, y - 1.5, 2.8, 1.6);
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x - 1.4 + i * 0.7, y - 1.5); c.lineTo(x - 1.4 + i * 0.7, y + 0.1); c.stroke(); }
    c.strokeStyle = '#555'; c.beginPath(); c.moveTo(x + 0.2, y - 1.4); c.lineTo(x + 0.5, y - 0.9); c.lineTo(x + 0.3, y - 0.5); c.stroke();
  },
};

export function createMap({ canvas, player, showTip, onRaid, onHome }) {
  const c = canvas.getContext('2d');
  const view = { tile: 20, dpr: 1, S: 20 };
  let clock = 0;
  let selected = null;
  const p = player;

  function resize(cssW, cssH) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const tile = Math.floor(Math.min(cssW / COLS, cssH / ROWS) * 100) / 100;
    Object.assign(view, { tile, dpr, S: tile * dpr });
    canvas.style.width = tile * COLS + 'px';
    canvas.style.height = tile * ROWS + 'px';
    canvas.width = Math.round(tile * COLS * dpr);
    canvas.height = Math.round(tile * ROWS * dpr);
  }

  function toWorld(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / view.tile, y: (e.clientY - r.top) / view.tile };
  }

  // ---------- drawing ----------

  function pathPoints() { return [HOME, ...MAP_NODES]; }

  function drawPath(upTo) {
    const pts = pathPoints().slice(0, upTo + 1);
    if (pts.length < 2) return;
    const trace = () => {
      c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const mx = (a.x + b.x) / 2 + (hash(i) - 0.5) * 2, my = (a.y + b.y) / 2 + (hash(i + 9) - 0.5) * 1.2;
        c.quadraticCurveTo(mx, my, b.x, b.y);
      }
    };
    c.lineCap = 'round'; c.lineJoin = 'round';
    trace(); c.strokeStyle = '#7a5532'; c.lineWidth = 0.75; c.stroke();
    trace(); c.strokeStyle = '#a77b4f'; c.lineWidth = 0.55; c.stroke();
    trace(); c.setLineDash([0.12, 0.35]); c.strokeStyle = '#8a6239'; c.lineWidth = 0.12; c.stroke(); c.setLineDash([]);
  }

  function drawHive(x, y, conquered, i) {
    ellipse(c, x, y + 0.45, 1.0, 0.35, 'rgba(0,0,0,0.25)');
    ellipse(c, x, y + 0.3, 0.95, 0.45, '#6b4528');
    // mini compost bin
    c.fillStyle = conquered ? '#5a6b4a' : '#3b5d2a';
    c.beginPath(); c.roundRect(x - 0.45, y - 0.6, 0.9, 0.95, 0.12); c.fill();
    c.strokeStyle = '#1b2c14'; c.lineWidth = 0.05; c.stroke();
    c.fillStyle = '#243b1a'; c.beginPath(); c.roundRect(x - 0.52, y - 0.72, 1.04, 0.2, 0.06); c.fill();
    // flag
    c.strokeStyle = '#3d2a17'; c.lineWidth = 0.06;
    c.beginPath(); c.moveTo(x + 0.35, y - 0.7); c.lineTo(x + 0.35, y - 1.6); c.stroke();
    const wave = Math.sin(clock * 4 + i) * 0.06;
    c.beginPath(); c.moveTo(x + 0.35, y - 1.6); c.quadraticCurveTo(x + 0.7, y - 1.5 + wave, x + 1.0, y - 1.45); c.lineTo(x + 0.35, y - 1.2); c.closePath();
    c.fillStyle = conquered ? '#3fa34d' : '#7b2fbf'; c.fill();
    if (conquered) {
      c.fillStyle = '#d9241a';
      c.beginPath(); c.ellipse(x + 0.6, y - 1.42, 0.08, 0.13, 0.6, 0, Math.PI * 2); c.fill();
    } else {
      for (let k = 0; k < 3; k++) {
        const a = clock * (2 + k) + k * 2 + i;
        ellipse(c, x + Math.cos(a) * 0.6, y - 0.8 + Math.sin(a * 1.3) * 0.2, 0.045, 0.045, '#111');
      }
    }
  }

  function drawCloud(x, y, i) {
    const drift = Math.sin(clock * 0.6 + i) * 0.15;
    const puffs = [[-0.9, 0.1, 0.65], [-0.3, -0.25, 0.8], [0.45, -0.15, 0.75], [0.95, 0.15, 0.55], [0, 0.25, 0.7]];
    for (const [dx, dy, r] of puffs) ellipse(c, x + dx + drift, y + dy + 0.15, r, r * 0.75, 'rgba(0,0,0,0.12)');
    for (const [dx, dy, r] of puffs) ellipse(c, x + dx + drift, y + dy, r, r * 0.75, 'rgba(250,250,255,0.96)');
  }

  function render() {
    c.setTransform(view.S, 0, 0, view.S, 0, 0);
    // mowed lawn stripes
    for (let x = 0; x < COLS; x++) {
      c.fillStyle = x % 2 ? '#6cbf4a' : '#62b342';
      c.fillRect(x, 0, 1.01, ROWS);
    }
    for (let i = 0; i < 120; i++) {
      const x = hash(i) * COLS, y = hash(i + 500) * ROWS;
      c.strokeStyle = 'rgba(40,110,30,0.5)'; c.lineWidth = 0.04;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - 0.06, y - 0.15); c.moveTo(x, y); c.lineTo(x + 0.05, y - 0.17); c.stroke();
    }
    // fence along the top
    c.fillStyle = '#d8c7a0';
    for (let x = 0.2; x < COLS; x += 0.7) {
      c.beginPath(); c.moveTo(x, 0.9); c.lineTo(x, 0.15); c.lineTo(x + 0.25, 0); c.lineTo(x + 0.5, 0.15); c.lineTo(x + 0.5, 0.9); c.fill();
    }
    c.fillRect(0, 0.35, COLS, 0.12);

    // path up to the furthest revealed hive (+ a stub into the fog)
    let reach = 0;
    MAP_NODES.forEach((n, i) => { if (S.nodeStatus(p, i) !== 'fog') reach = i + 1; });
    drawPath(Math.min(MAP_NODES.length, reach));

    // props & hives
    MAP_NODES.forEach((n, i) => {
      const st = S.nodeStatus(p, i);
      if (st === 'fog') return;
      c.save(); c.globalAlpha = 0.9; PROPS[n.name]?.(c, n.x - 1.4, n.y - 0.2); c.restore();
      if (selected === i) {
        c.beginPath(); c.arc(n.x, n.y - 0.1, 1.35 + Math.sin(clock * 5) * 0.06, 0, Math.PI * 2);
        c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 0.08; c.setLineDash([0.2, 0.12]); c.stroke(); c.setLineDash([]);
      } else if (st === 'open') {
        c.beginPath(); c.arc(n.x, n.y - 0.1, 1.2 + Math.sin(clock * 4) * 0.12, 0, Math.PI * 2);
        c.strokeStyle = 'rgba(255,90,60,0.7)'; c.lineWidth = 0.08; c.stroke();
      }
      drawHive(n.x, n.y, st === 'conquered', i);
    });

    // home garden
    ellipse(c, HOME.x, HOME.y + 0.3, 1.6, 0.6, '#6b4528');
    c.save(); c.translate(HOME.x - 0.75, HOME.y - 1.55); c.scale(0.5, 0.5);
    drawStem(c, 0, 0, Math.min(4, p.stem.level), clock);
    c.restore();

    // fog clouds over locked hives
    MAP_NODES.forEach((n, i) => { if (S.nodeStatus(p, i) === 'fog') drawCloud(n.x, n.y - 0.2, i); });

    // labels (screen space)
    c.setTransform(1, 0, 0, 1, 0, 0);
    const fs = Math.max(10, view.tile * 0.42) * view.dpr;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    MAP_NODES.forEach((n, i) => {
      const st = S.nodeStatus(p, i);
      const px = n.x * view.S, py = (n.y + 1.05) * view.S;
      if (st === 'fog') {
        c.font = `${fs * 1.3}px 'Lilita One', system-ui, sans-serif`;
        c.fillStyle = 'rgba(90,90,120,0.6)'; c.fillText('?', n.x * view.S, (n.y - 0.2) * view.S);
        return;
      }
      c.font = `${fs}px 'Lilita One', system-ui, sans-serif`;
      const label = `${n.name} · Lv ${S.nodeLevel(i)}`;
      const w = c.measureText(label).width + fs * 0.9;
      c.fillStyle = st === 'open' ? 'rgba(200,30,20,0.92)' : 'rgba(30,20,10,0.82)';
      c.beginPath(); c.roundRect(px - w / 2, py - fs * 0.75, w, fs * 1.5, fs * 0.5); c.fill();
      c.fillStyle = '#fff4d6'; c.fillText(label, px, py + fs * 0.05);
      const best = p.map.best[i] || 0;
      if (best || st === 'conquered') {
        c.font = `${fs * 1.1}px 'Lilita One', system-ui, sans-serif`;
        for (let k = 0; k < 3; k++) {
          const sx = px + (k - 1) * fs * 1.1, sy = py + fs * 1.35;
          c.lineWidth = fs * 0.15; c.strokeStyle = 'rgba(0,0,0,0.5)'; c.strokeText('★', sx, sy);
          c.fillStyle = k < best ? '#ffd23f' : '#6b5a46'; c.fillText('★', sx, sy);
        }
      }
    });
    c.font = `${fs}px 'Lilita One', system-ui, sans-serif`;
    const hy = (HOME.y + 0.6) * view.S;
    c.lineWidth = fs * 0.2; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.strokeText('Your Garden', HOME.x * view.S, hy);
    c.fillStyle = '#fff4d6'; c.fillText('Your Garden', HOME.x * view.S, hy);
  }

  // ---------- sheet ----------

  const sheetEl = $('#sheet');
  function closeSheet() { selected = null; sheetEl.classList.add('hidden'); sheetEl.innerHTML = ''; }

  function openNode(i) {
    selected = i;
    const n = MAP_NODES[i], st = S.nodeStatus(p, i), loot = S.nodeLoot(p, i);
    const best = p.map.best[i] || 0;
    const troops = Object.values(p.army).reduce((a, b) => a + b, 0);
    const status = st === 'conquered'
      ? 'Conquered. The bugs crept back in, but there\'s only half the loot left.'
      : 'Destroy its Compost Bin to conquer it and reveal the next hive.';
    sheetEl.innerHTML = `
      <div class="sh-head"><h3>${n.name} <span class="lvl">Lv ${S.nodeLevel(i)}</span></h3><button class="x" data-close>✕</button></div>
      <p class="sh-blurb">${status}</p>
      <div class="stats">
        <div><span>Loot</span><b>☀️ ${fmt(loot.sun)}</b></div>
        <div><span>&nbsp;</span><b>💧 ${fmt(loot.water)}</b></div>
        <div><span>Best</span><b class="stars-inline">${'★'.repeat(best)}<em>${'★'.repeat(3 - best)}</em></b></div>
      </div>
      <div class="row">
        <button id="m-raid" class="sbtn danger ${troops ? '' : 'disabled'}"><b>Scout &amp; Raid</b><small>${troops ? `${troops} troops ready` : 'No troops! Grow some first'}</small></button>
      </div>`;
    sheetEl.dataset.kind = 'node';
    sheetEl.classList.remove('again');
    sheetEl.classList.remove('hidden');
    sheetEl.querySelector('[data-close]').onclick = closeSheet;
    $('#m-raid').onclick = () => {
      if (!troops) { sfx('deny'); showTip('Grow some troops in your Garden first!'); return; }
      closeSheet();
      onRaid(i);
    };
  }

  // ---------- input ----------

  function pointerDown(e) {
    const w = toWorld(e);
    let hit = -1, bestD = 1.6;
    MAP_NODES.forEach((n, i) => { const d = Math.hypot(w.x - n.x, w.y - n.y + 0.2); if (d < bestD) { bestD = d; hit = i; } });
    if (Math.hypot(w.x - HOME.x, w.y - HOME.y + 0.6) < 1.4) { sfx('click'); onHome(); return; }
    if (hit < 0) { closeSheet(); return; }
    if (S.nodeStatus(p, hit) === 'fog') {
      sfx('deny');
      const prev = MAP_NODES[hit - 1];
      showTip(prev && S.nodeStatus(p, hit - 1) === 'open' ? `Conquer ${prev.name} to clear the fog` : 'Hidden in the fog. Keep conquering!');
      return;
    }
    sfx('click');
    openNode(hit);
  }

  function frame(dt) { clock += dt; render(); }

  $('#m-home').onclick = () => { sfx('click'); onHome(); };

  return {
    resize, frame, pointerDown, pointerMove() {}, pointerUp() {},
    enter(focus) {
      selected = null;
      $('#m-progress').textContent = `${S.conqueredCount(p)} / ${MAP_NODES.length} hives conquered`;
      const troops = Object.values(p.army).reduce((a, b) => a + b, 0);
      $('#m-army').textContent = `${troops} troops ready`;
      if (focus != null) openNode(focus);
    },
    exit() { closeSheet(); },
  };
}
