// All drawing. World coordinates are in tiles; the canvas transform maps tiles to pixels.

import { COLS, ROWS, DEPLOY_ROWS, SPELL, UNITS, FLAVORS } from './config.js';
import { drawStem, PLANT_ART } from './garden-art.js';

// ---------- small helpers ----------

function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

function ellipse(c, x, y, rx, ry, fill) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
}

function rrect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function angryEyes(c, x, y, sep, size, look = 0) {
  for (const s of [-1, 1]) {
    const ex = x + s * sep;
    ellipse(c, ex, y, size, size * 1.15, '#fff');
    ellipse(c, ex + look * size * 0.35, y + size * 0.2, size * 0.5, size * 0.55, '#1a1a1a');
    c.beginPath();
    c.moveTo(ex - s * size * 1.2, y - size * 1.5);
    c.lineTo(ex + s * size * 1.1, y - size * 0.75);
    c.lineWidth = size * 0.55;
    c.lineCap = 'round';
    c.strokeStyle = '#1a1a1a';
    c.stroke();
  }
}

// ---------- unit art (drawn around origin, ~1 unit tall, facing right) ----------

export function drawJalapenoArt(c, flash) {
  const g = c.createLinearGradient(-0.4, 0, 0.4, 0);
  g.addColorStop(0, '#2c7a35'); g.addColorStop(0.5, '#4cbb57'); g.addColorStop(1, '#2a6e31');
  c.beginPath();
  c.moveTo(-0.28, -0.42);
  c.bezierCurveTo(0.2, -0.55, 0.42, 0.0, 0.2, 0.42);
  c.bezierCurveTo(0.12, 0.58, -0.02, 0.6, -0.1, 0.5);
  c.bezierCurveTo(-0.38, 0.15, -0.5, -0.3, -0.28, -0.42);
  c.fillStyle = flash ? '#fff' : g; c.fill();
  c.lineWidth = 0.04; c.strokeStyle = '#1d4d22'; c.stroke();
  // shine
  c.beginPath(); c.ellipse(-0.18, -0.12, 0.05, 0.18, -0.3, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill();
  // stem cap
  c.beginPath(); c.ellipse(-0.08, -0.47, 0.22, 0.08, 0.15, 0, Math.PI * 2); c.fillStyle = '#5b8f2a'; c.fill();
  c.beginPath(); c.moveTo(-0.05, -0.5); c.quadraticCurveTo(0.0, -0.75, 0.15, -0.72);
  c.lineWidth = 0.07; c.strokeStyle = '#4b6e21'; c.stroke();
  angryEyes(c, 0.0, -0.18, 0.11, 0.065, 0.6);
  c.beginPath(); c.arc(0.02, 0.06, 0.07, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 0.035; c.strokeStyle = '#123815'; c.stroke();
}

export function drawBellArt(c, flash) {
  const lobes = [[-0.22, 0.08, 0.3], [0.22, 0.08, 0.3], [0, 0.14, 0.32], [0, -0.1, 0.36]];
  for (const [x, y, r] of lobes) {
    const g = c.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, '#ff6b55'); g.addColorStop(1, '#b8221a');
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = flash ? '#fff' : g; c.fill();
  }
  c.lineWidth = 0.035; c.strokeStyle = 'rgba(110,15,10,0.6)';
  c.beginPath(); c.moveTo(-0.1, 0.4); c.quadraticCurveTo(-0.14, 0.1, -0.08, -0.2); c.stroke();
  c.beginPath(); c.moveTo(0.1, 0.4); c.quadraticCurveTo(0.14, 0.1, 0.08, -0.2); c.stroke();
  c.beginPath(); c.ellipse(-0.2, -0.2, 0.06, 0.12, -0.5, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill();
  // helmet-like stem cap
  c.beginPath(); c.ellipse(0, -0.42, 0.25, 0.09, 0, 0, Math.PI * 2); c.fillStyle = '#3f7a24'; c.fill();
  c.beginPath(); c.moveTo(0, -0.45); c.quadraticCurveTo(0.03, -0.62, 0.13, -0.62);
  c.lineWidth = 0.08; c.strokeStyle = '#2f5e1b'; c.stroke();
  angryEyes(c, 0.04, -0.12, 0.13, 0.07, 0.5);
  // grim mouth
  c.beginPath(); c.moveTo(-0.08, 0.1); c.lineTo(0.16, 0.08); c.lineWidth = 0.04; c.strokeStyle = '#4a0b06'; c.stroke();
}

export function drawHabaneroArt(c, flash) {
  const g = c.createRadialGradient(-0.1, -0.1, 0.05, 0, 0, 0.45);
  g.addColorStop(0, '#ffc04d'); g.addColorStop(1, '#e8620c');
  c.beginPath();
  c.moveTo(0, -0.38);
  c.bezierCurveTo(0.38, -0.4, 0.42, 0.1, 0.2, 0.3);
  c.quadraticCurveTo(0.08, 0.42, 0.05, 0.55);
  c.quadraticCurveTo(-0.02, 0.42, -0.18, 0.32);
  c.bezierCurveTo(-0.42, 0.1, -0.38, -0.4, 0, -0.38);
  c.fillStyle = flash ? '#fff' : g; c.fill();
  c.lineWidth = 0.035; c.strokeStyle = '#a2420a'; c.stroke();
  c.beginPath(); c.moveTo(-0.12, -0.3); c.quadraticCurveTo(-0.2, 0, -0.1, 0.25); c.lineWidth = 0.03; c.strokeStyle = 'rgba(160,60,0,0.5)'; c.stroke();
  c.beginPath(); c.ellipse(0, -0.4, 0.16, 0.06, 0, 0, Math.PI * 2); c.fillStyle = '#4f7d22'; c.fill();
  c.beginPath(); c.moveTo(0, -0.42); c.lineTo(0.06, -0.58); c.lineWidth = 0.06; c.strokeStyle = '#3e6419'; c.stroke();
  // wild twitchy eyes (uneven)
  ellipse(c, -0.08, -0.12, 0.08, 0.09, '#fff');
  ellipse(c, 0.12, -0.14, 0.06, 0.07, '#fff');
  ellipse(c, -0.05, -0.11, 0.035, 0.04, '#111');
  ellipse(c, 0.14, -0.13, 0.03, 0.035, '#111');
  // grin
  c.beginPath(); c.arc(0.03, 0.04, 0.1, 0.15 * Math.PI, 0.85 * Math.PI); c.fillStyle = '#5a1a00'; c.fill();
  c.fillStyle = '#fff'; c.fillRect(-0.04, 0.04, 0.12, 0.03);
}

export function drawGhostArt(c, flash) {
  // pale, wrinkled, with a wispy tail instead of a tip
  const g = c.createLinearGradient(0, -0.45, 0, 0.6);
  g.addColorStop(0, '#fbf8ff'); g.addColorStop(1, '#c9bfe0');
  c.beginPath();
  c.moveTo(-0.2, -0.42);
  c.bezierCurveTo(0.25, -0.5, 0.36, -0.05, 0.22, 0.2);
  c.quadraticCurveTo(0.3, 0.38, 0.12, 0.42);
  c.quadraticCurveTo(0.18, 0.58, 0.0, 0.62);
  c.quadraticCurveTo(-0.08, 0.48, -0.16, 0.5);
  c.quadraticCurveTo(-0.18, 0.36, -0.28, 0.3);
  c.bezierCurveTo(-0.42, 0.0, -0.38, -0.36, -0.2, -0.42);
  c.fillStyle = flash ? '#fff' : g; c.fill();
  c.lineWidth = 0.035; c.strokeStyle = '#9d8fc0'; c.stroke();
  c.strokeStyle = 'rgba(140,120,180,0.45)'; c.lineWidth = 0.025;
  for (const y of [-0.15, 0.02, 0.18]) { c.beginPath(); c.moveTo(-0.24, y); c.quadraticCurveTo(0, y + 0.06, 0.22, y - 0.02); c.stroke(); }
  c.beginPath(); c.ellipse(-0.02, -0.46, 0.17, 0.06, 0, 0, Math.PI * 2); c.fillStyle = '#7d9a6a'; c.fill();
  // hollow, glowing eyes
  ellipse(c, -0.09, -0.16, 0.07, 0.09, '#2a1f3d');
  ellipse(c, 0.11, -0.16, 0.07, 0.09, '#2a1f3d');
  ellipse(c, -0.08, -0.15, 0.025, 0.03, '#b8f0ff');
  ellipse(c, 0.12, -0.15, 0.025, 0.03, '#b8f0ff');
  c.beginPath(); c.ellipse(0.02, 0.06, 0.06, 0.04, 0, 0, Math.PI * 2); c.fillStyle = '#2a1f3d'; c.fill();
}

export function drawReaperArt(c, flash) {
  // deep crimson, bumpy, with the Reaper's hooked "scorpion" tail
  const g = c.createRadialGradient(-0.12, -0.15, 0.05, 0, 0, 0.55);
  g.addColorStop(0, '#ff4a2e'); g.addColorStop(0.6, '#b8150c'); g.addColorStop(1, '#6e0806');
  c.beginPath();
  c.moveTo(-0.05, -0.42);
  c.bezierCurveTo(0.3, -0.5, 0.42, -0.15, 0.36, 0.05);
  c.bezierCurveTo(0.42, 0.12, 0.3, 0.22, 0.28, 0.3);
  c.bezierCurveTo(0.2, 0.42, 0.1, 0.42, 0.12, 0.5);
  c.quadraticCurveTo(0.3, 0.58, 0.34, 0.7);    // the hooked tail
  c.quadraticCurveTo(0.12, 0.66, 0.0, 0.5);
  c.bezierCurveTo(-0.22, 0.45, -0.32, 0.3, -0.36, 0.18);
  c.bezierCurveTo(-0.44, 0.08, -0.38, -0.05, -0.38, -0.12);
  c.bezierCurveTo(-0.4, -0.35, -0.25, -0.44, -0.05, -0.42);
  c.fillStyle = flash ? '#fff' : g; c.fill();
  c.lineWidth = 0.04; c.strokeStyle = '#4a0402'; c.stroke();
  // wrinkles & bumps
  c.strokeStyle = 'rgba(70,0,0,0.45)'; c.lineWidth = 0.03;
  for (const [x, y] of [[-0.25, 0.1], [0.2, 0.15], [-0.1, 0.3], [0.25, -0.2]]) { c.beginPath(); c.arc(x, y, 0.08, 0.2, 2.6); c.stroke(); }
  c.beginPath(); c.ellipse(-0.18, -0.2, 0.05, 0.12, -0.4, 0, Math.PI * 2); c.fillStyle = 'rgba(255,200,180,0.35)'; c.fill();
  // stem cap + tiny crown
  c.beginPath(); c.ellipse(0, -0.44, 0.2, 0.07, 0, 0, Math.PI * 2); c.fillStyle = '#2f5e1b'; c.fill();
  c.fillStyle = '#ffd23f';
  c.beginPath(); c.moveTo(-0.14, -0.5); c.lineTo(-0.14, -0.66); c.lineTo(-0.07, -0.57); c.lineTo(0, -0.7); c.lineTo(0.07, -0.57); c.lineTo(0.14, -0.66); c.lineTo(0.14, -0.5); c.closePath(); c.fill();
  c.strokeStyle = '#b8860b'; c.lineWidth = 0.02; c.stroke();
  // blazing eyes
  for (const s of [-1, 1]) {
    const ex = 0.03 + s * 0.12;
    ellipse(c, ex, -0.15, 0.075, 0.07, '#ffe14d');
    ellipse(c, ex + 0.02, -0.14, 0.03, 0.04, '#300');
    c.beginPath(); c.moveTo(ex - s * 0.1, -0.29); c.lineTo(ex + s * 0.08, -0.21);
    c.lineWidth = 0.05; c.lineCap = 'round'; c.strokeStyle = '#1a0000'; c.stroke();
  }
  // fanged grin
  c.beginPath(); c.arc(0.04, 0.05, 0.13, 0.1 * Math.PI, 0.9 * Math.PI); c.fillStyle = '#2a0000'; c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.moveTo(-0.05, 0.07); c.lineTo(-0.02, 0.13); c.lineTo(0.01, 0.07); c.fill();
  c.beginPath(); c.moveTo(0.08, 0.07); c.lineTo(0.11, 0.13); c.lineTo(0.14, 0.07); c.fill();
}

const UNIT_ART = {
  jalapeno: drawJalapenoArt, bell: drawBellArt, habanero: drawHabaneroArt, ghost: drawGhostArt, reaper: drawReaperArt,
  aphid: (c, f) => drawAphidBug(c, f), beetle: (c, f) => drawBeetleBug(c, f), wasp: (c, f) => drawWaspBug(c, f),
};

export function drawUnitIcon(canvas, type, def) {
  const c = canvas.getContext('2d');
  const s = canvas.width;
  c.clearRect(0, 0, s, s);
  c.save();
  c.translate(s / 2, s * 0.55);
  c.scale(s * 0.75, s * 0.75);
  drawTroopArt(c, type, def, false);
  c.restore();
}

// ---------- Greenhouse hybrids & Duds ----------

export function drawWrinkleArt(c, flash) {
  c.beginPath();
  c.moveTo(-0.15, -0.3);
  c.bezierCurveTo(0.2, -0.36, 0.28, 0.0, 0.12, 0.22);
  c.quadraticCurveTo(0.2, 0.32, 0.02, 0.38);
  c.bezierCurveTo(-0.22, 0.3, -0.3, -0.12, -0.15, -0.3);
  c.fillStyle = flash ? '#fff' : '#7d7a3e'; c.fill();
  c.strokeStyle = '#4a4720'; c.lineWidth = 0.03; c.stroke();
  c.strokeStyle = 'rgba(60,55,20,0.55)'; c.lineWidth = 0.02;
  for (let i = 0; i < 6; i++) { const y = -0.22 + i * 0.1; c.beginPath(); c.moveTo(-0.18, y); c.quadraticCurveTo(0, y + 0.04 * (i % 2 ? 1 : -1), 0.17, y); c.stroke(); }
  c.beginPath(); c.ellipse(-0.02, -0.33, 0.12, 0.04, -0.3, 0, Math.PI * 2); c.fillStyle = '#6a6a3a'; c.fill();
  // droopy, teary eyes
  for (const s of [-1, 1]) {
    ellipse(c, s * 0.08, -0.1, 0.045, 0.035, '#fff');
    ellipse(c, s * 0.08, -0.09, 0.02, 0.02, '#111');
    c.beginPath(); c.moveTo(s * 0.03, -0.17); c.lineTo(s * 0.13, -0.14); c.lineWidth = 0.025; c.strokeStyle = '#333'; c.stroke();
  }
  ellipse(c, 0.11, -0.03, 0.02, 0.035, '#8fd3ff');
  c.beginPath(); c.arc(0, 0.06, 0.06, 1.15 * Math.PI, 1.85 * Math.PI); c.lineWidth = 0.025; c.strokeStyle = '#333'; c.stroke();
}

export function drawPotatoArt(c, flash) {
  ellipse(c, 0, 0.12, 0.34, 0.24, flash ? '#fff' : '#b88a55');
  c.strokeStyle = '#7a5530'; c.lineWidth = 0.03;
  c.beginPath(); c.ellipse(0, 0.12, 0.34, 0.24, 0, 0, Math.PI * 2); c.stroke();
  for (const [x, y] of [[-0.18, 0.2], [0.2, 0.05], [0.05, 0.28], [-0.05, -0.02]]) ellipse(c, x, y, 0.025, 0.018, '#7a5530');
  // confused face
  ellipse(c, -0.09, 0.06, 0.05, 0.05, '#fff'); ellipse(c, 0.1, 0.08, 0.04, 0.04, '#fff');
  ellipse(c, -0.08, 0.07, 0.02, 0.02, '#111'); ellipse(c, 0.11, 0.07, 0.018, 0.018, '#111');
  c.beginPath(); c.moveTo(-0.05, 0.19); c.quadraticCurveTo(0.0, 0.16, 0.05, 0.2); c.quadraticCurveTo(0.08, 0.22, 0.1, 0.18); c.lineWidth = 0.025; c.strokeStyle = '#333'; c.stroke();
  c.font = 'bold 0.16px sans-serif'; c.fillStyle = '#555'; c.fillText('?', 0.18, -0.12);
}

const spriteCache = new Map();
// Hybrids look like their Body parent, washed with their Seed parent's color.
function hybridSprite(d, flash) {
  const key = `${d.id}:${d.body}:${d.tint}:${flash ? 1 : 0}`;
  let cv = spriteCache.get(key);
  if (cv) return cv;
  cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  c.translate(64, 72); c.scale(80, 80);
  (UNIT_ART[d.body] || drawJalapenoArt)(c, flash);
  if (!flash) {
    c.globalCompositeOperation = 'source-atop';
    c.globalAlpha = 0.42; c.fillStyle = d.tint; c.fillRect(-1, -1, 2, 2);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // a little double-helix sparkle so hybrids stand out
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 0.025;
    for (let i = 0; i < 2; i++) {
      c.beginPath();
      for (let k = 0; k <= 12; k++) { const y = 0.12 + k * 0.02, x = -0.22 + Math.sin(k * 0.8 + i * Math.PI) * 0.05; k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
  }
  spriteCache.set(key, cv);
  return cv;
}

// Draws any troop at the origin (about one unit tall), base species, hybrid or Dud.
export function drawTroopArt(c, type, d, flash) {
  if (d && d.dud) { (d.dud === 'potato' ? drawPotatoArt : drawWrinkleArt)(c, flash); return; }
  if (d && d.hybrid) { c.drawImage(hybridSprite(d, flash), -0.8, -0.9, 1.6, 1.6); return; }
  UNIT_ART[type](c, flash);
}

export function drawSpellIcon(canvas) {
  const c = canvas.getContext('2d');
  const s = canvas.width;
  c.clearRect(0, 0, s, s);
  c.save();
  c.translate(s / 2, s / 2);
  c.scale(s, s);
  c.rotate(0.35);
  drawBottle(c);
  c.restore();
}

function drawBottle(c) {
  // hot sauce bottle, ~0.8 tall
  rrect(c, -0.16, -0.12, 0.32, 0.5, 0.07);
  c.fillStyle = '#d9241a'; c.fill();
  c.beginPath();
  c.moveTo(-0.16, -0.05); c.lineTo(-0.06, -0.24); c.lineTo(0.06, -0.24); c.lineTo(0.16, -0.05); c.closePath();
  c.fillStyle = '#c21d14'; c.fill();
  c.fillStyle = '#2b2b2b'; c.fillRect(-0.07, -0.36, 0.14, 0.13);
  c.fillStyle = '#fff3d6'; c.fillRect(-0.13, 0.02, 0.26, 0.2);
  c.fillStyle = '#d9241a';
  c.beginPath(); c.moveTo(0, 0.04); c.quadraticCurveTo(0.08, 0.12, 0.01, 0.2); c.quadraticCurveTo(-0.07, 0.12, 0, 0.04); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-0.12, -0.08, 0.04, 0.4);
}

// ---------- building art ----------

function shadow(c, b) {
  ellipse(c, b.cx, b.y + b.h - 0.15, b.w * 0.48, 0.28, 'rgba(0,0,0,0.25)');
}

function drawCompost(c, b, t) {
  const { x, y, w, h } = b;
  shadow(c, b);
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#2e4a22'); g.addColorStop(0.5, '#4c7337'); g.addColorStop(1, '#2a421e');
  rrect(c, x + 0.35, y + 0.5, w - 0.7, h - 0.6, 0.2);
  c.fillStyle = g; c.fill();
  c.strokeStyle = '#1b2c14'; c.lineWidth = 0.06; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 0.08;
  for (let i = 1; i < 4; i++) {
    const lx = x + 0.35 + (w - 0.7) * i / 4;
    c.beginPath(); c.moveTo(lx, y + 0.8); c.lineTo(lx, y + h - 0.3); c.stroke();
  }
  // gunk spilling over
  c.fillStyle = '#5b3b1f';
  c.beginPath(); c.ellipse(x + w / 2, y + 0.55, w / 2 - 0.3, 0.32, 0, 0, Math.PI * 2); c.fill();
  // banana peel
  c.fillStyle = '#f2d03b';
  c.beginPath(); c.ellipse(x + 1.0, y + 0.4, 0.3, 0.1, -0.5, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + 1.15, y + 0.5, 0.25, 0.08, 0.6, 0, Math.PI * 2); c.fill();
  // apple core
  ellipse(c, x + 2.0, y + 0.45, 0.13, 0.18, '#f4e7c5');
  ellipse(c, x + 2.0, y + 0.3, 0.12, 0.06, '#c0392b');
  // lid, ajar
  c.save(); c.translate(x + w - 0.4, y + 0.35); c.rotate(-0.35);
  rrect(c, -w + 0.75, -0.18, w - 0.7, 0.24, 0.08); c.fillStyle = '#243b1a'; c.fill();
  c.restore();
  // label
  rrect(c, x + w / 2 - 0.45, y + 1.4, 0.9, 0.55, 0.08); c.fillStyle = '#e9dcb0'; c.fill();
  c.fillStyle = '#3a2a14';
  ellipse(c, x + w / 2, y + 1.67, 0.16, 0.2, '#3a2a14');
  c.strokeStyle = '#3a2a14'; c.lineWidth = 0.04;
  for (const s of [-1, 1]) for (const dy of [-0.08, 0.04, 0.16]) {
    c.beginPath(); c.moveTo(x + w / 2, y + 1.67 + dy); c.lineTo(x + w / 2 + s * 0.3, y + 1.6 + dy + 0.05); c.stroke();
  }
  // flag
  c.strokeStyle = '#3d2a17'; c.lineWidth = 0.07;
  c.beginPath(); c.moveTo(x + w - 0.5, y + 0.5); c.lineTo(x + w - 0.5, y - 0.6); c.stroke();
  const wave = Math.sin(t * 4) * 0.08;
  c.beginPath();
  c.moveTo(x + w - 0.5, y - 0.6);
  c.quadraticCurveTo(x + w - 0.1, y - 0.5 + wave, x + w + 0.25, y - 0.45);
  c.lineTo(x + w - 0.5, y - 0.2);
  c.closePath(); c.fillStyle = '#7b2fbf'; c.fill();
  // flies
  for (let i = 0; i < 3; i++) {
    const a = t * (2 + i) + i * 2;
    ellipse(c, x + w / 2 + Math.cos(a) * 0.8, y + 0.1 + Math.sin(a * 1.3) * 0.25, 0.05, 0.05, '#111');
  }
}

function drawThorn(c, b, t) {
  shadow(c, b);
  const cx = b.cx, cy = b.cy;
  const g = c.createRadialGradient(cx - 0.2, cy - 0.1, 0.1, cx, cy + 0.1, 0.85);
  g.addColorStop(0, '#9b6a3e'); g.addColorStop(1, '#5a3a1e');
  c.beginPath(); c.ellipse(cx, cy + 0.15, 0.82, 0.62, 0, 0, Math.PI * 2); c.fillStyle = g; c.fill();
  c.strokeStyle = '#3e2712'; c.lineWidth = 0.05; c.stroke();
  // bark rings
  c.strokeStyle = 'rgba(40,20,5,0.4)'; c.lineWidth = 0.04;
  c.beginPath(); c.ellipse(cx, cy + 0.15, 0.55, 0.4, 0, 0, Math.PI * 2); c.stroke();
  const hy = cy - 0.35;
  // barrel
  c.save(); c.translate(cx, hy); c.rotate(b.aim);
  c.fillStyle = '#2f6b25';
  rrect(c, 0, -0.12, 0.75, 0.24, 0.08); c.fill();
  c.fillStyle = '#e9e1c0';
  c.beginPath(); c.moveTo(0.75, -0.08); c.lineTo(0.95, 0); c.lineTo(0.75, 0.08); c.fill();
  if (b.fireT > 0) { ellipse(c, 1.0, 0, 0.16, 0.12, 'rgba(255,240,180,0.9)'); }
  c.restore();
  // head bulb with spikes
  c.fillStyle = '#e9e1c0';
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + 0.2;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 0.38, hy + Math.sin(a) * 0.38);
    c.lineTo(cx + Math.cos(a + 0.18) * 0.55, hy + Math.sin(a + 0.18) * 0.55);
    c.lineTo(cx + Math.cos(a + 0.36) * 0.38, hy + Math.sin(a + 0.36) * 0.38);
    c.fill();
  }
  const hg = c.createRadialGradient(cx - 0.12, hy - 0.12, 0.05, cx, hy, 0.42);
  hg.addColorStop(0, '#7bd06a'); hg.addColorStop(1, '#2f7a28');
  c.beginPath(); c.arc(cx, hy, 0.4, 0, Math.PI * 2); c.fillStyle = hg; c.fill();
  c.strokeStyle = '#1e4a19'; c.lineWidth = 0.04; c.stroke();
  if (b.friendly) {
    // your own Thorn Shooter: a fierce little pepper bud
    angryEyes(c, cx, hy - 0.04, 0.11, 0.06, Math.cos(b.aim));
    return;
  }
  // bug pilot eyes
  ellipse(c, cx - 0.1, hy - 0.05, 0.07, 0.07, '#ffef5a');
  ellipse(c, cx + 0.1, hy - 0.05, 0.07, 0.07, '#ffef5a');
  ellipse(c, cx - 0.1, hy - 0.04, 0.03, 0.04, '#111');
  ellipse(c, cx + 0.1, hy - 0.04, 0.03, 0.04, '#111');
}

function drawSap(c, b, t) {
  shadow(c, b);
  const cx = b.cx, cy = b.cy;
  c.beginPath(); c.ellipse(cx, cy + 0.25, 0.8, 0.5, 0, 0, Math.PI * 2); c.fillStyle = '#4f7a2d'; c.fill();
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    ellipse(c, cx + Math.cos(a) * 0.6, cy + 0.25 + Math.sin(a) * 0.35, 0.22, 0.14, '#3e6623');
  }
  const pulse = 1 + Math.sin(t * 3 + b.id) * 0.04 + (b.fireT > 0 ? 0.12 : 0);
  // nozzle
  c.save(); c.translate(cx, cy - 0.3); c.rotate(b.aim);
  c.fillStyle = '#b5761a';
  rrect(c, 0.1, -0.11, 0.6, 0.22, 0.1); c.fill();
  ellipse(c, 0.72, 0, 0.1, 0.14, '#7a4c0c');
  c.restore();
  const g = c.createRadialGradient(cx - 0.2, cy - 0.5, 0.05, cx, cy - 0.25, 0.6 * pulse);
  g.addColorStop(0, '#ffe9a0'); g.addColorStop(0.4, '#f2b632'); g.addColorStop(1, '#b06f0f');
  c.beginPath(); c.arc(cx, cy - 0.25, 0.55 * pulse, 0, Math.PI * 2); c.fillStyle = g; c.fill();
  c.strokeStyle = '#7a4c0c'; c.lineWidth = 0.04; c.stroke();
  ellipse(c, cx - 0.18, cy - 0.45, 0.12, 0.07, 'rgba(255,255,255,0.6)');
  // drip
  const dp = (t * 0.6 + b.id * 0.3) % 1;
  ellipse(c, cx + 0.25, cy + 0.05 + dp * 0.3, 0.05, 0.07 + dp * 0.03, '#e0a526');
}

function drawAphid(c, b, t) {
  shadow(c, b);
  const { x, y, w, h } = b;
  rrect(c, x + 0.2, y + 0.45, w - 0.4, h - 0.6, 0.12); c.fillStyle = '#d9b860'; c.fill();
  c.strokeStyle = '#8a6a2a'; c.lineWidth = 0.04;
  for (let i = 0; i < 6; i++) {
    c.beginPath(); c.moveTo(x + 0.3 + i * 0.27, y + 0.55); c.lineTo(x + 0.45 + i * 0.25, y + h - 0.25); c.stroke();
  }
  // fence posts
  c.fillStyle = '#8a5a2b';
  for (let i = 0; i < 5; i++) {
    const px = x + 0.22 + i * (w - 0.44) / 4;
    rrect(c, px - 0.06, y + 0.25, 0.12, 0.45, 0.04); c.fill();
    rrect(c, px - 0.06, y + h - 0.55, 0.12, 0.45, 0.04); c.fill();
  }
  c.fillRect(x + 0.2, y + 0.38, w - 0.4, 0.07);
  c.fillRect(x + 0.2, y + h - 0.4, w - 0.4, 0.07);
  // aphids
  for (let i = 0; i < 5; i++) {
    const ax = x + 0.5 + hash(b.id * 7 + i) * (w - 1) + Math.sin(t * 2 + i) * 0.06;
    const ay = y + 0.8 + hash(b.id * 3 + i) * (h - 1.3);
    ellipse(c, ax, ay, 0.13, 0.09, '#a8e05f');
    ellipse(c, ax + 0.1, ay - 0.02, 0.05, 0.05, '#6aa32a');
  }
  // sun sign
  const sx = x + w - 0.35, sy = y + 0.2;
  c.strokeStyle = '#f5a623'; c.lineWidth = 0.05;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + t * 0.5;
    c.beginPath(); c.moveTo(sx + Math.cos(a) * 0.2, sy + Math.sin(a) * 0.2); c.lineTo(sx + Math.cos(a) * 0.3, sy + Math.sin(a) * 0.3); c.stroke();
  }
  ellipse(c, sx, sy, 0.17, 0.17, '#ffd23f');
}

function drawDew(c, b, t) {
  shadow(c, b);
  const cx = b.cx, cy = b.cy;
  c.save(); c.translate(cx, cy + 0.35);
  c.beginPath(); c.ellipse(0, 0, 0.9, 0.42, -0.2, 0, Math.PI * 2); c.fillStyle = '#4a9b3a'; c.fill();
  c.strokeStyle = '#2e6b24'; c.lineWidth = 0.04;
  c.beginPath(); c.moveTo(-0.8, 0.15); c.lineTo(0.8, -0.15); c.stroke();
  c.restore();
  const wob = Math.sin(t * 2.5 + b.id) * 0.03;
  const g = c.createRadialGradient(cx - 0.15, cy - 0.15, 0.05, cx, cy, 0.7);
  g.addColorStop(0, '#d8f4ff'); g.addColorStop(0.5, '#5bc0f0'); g.addColorStop(1, '#1f78b4');
  c.beginPath();
  c.moveTo(cx, cy - 0.85);
  c.bezierCurveTo(cx + 0.25, cy - 0.45, cx + 0.6 + wob, cy - 0.1, cx + 0.55, cy + 0.2);
  c.bezierCurveTo(cx + 0.5, cy + 0.55, cx - 0.5, cy + 0.55, cx - 0.55, cy + 0.2);
  c.bezierCurveTo(cx - 0.6 - wob, cy - 0.1, cx - 0.25, cy - 0.45, cx, cy - 0.85);
  c.fillStyle = g; c.fill();
  c.strokeStyle = '#15608f'; c.lineWidth = 0.04; c.stroke();
  ellipse(c, cx - 0.2, cy - 0.15, 0.08, 0.18, 'rgba(255,255,255,0.7)');
}

function drawNursery(c, b, t) {
  shadow(c, b);
  const cx = b.cx, cy = b.cy;
  const g = c.createRadialGradient(cx - 0.2, cy - 0.3, 0.1, cx, cy, 0.95);
  g.addColorStop(0, '#9c7448'); g.addColorStop(1, '#5e3f20');
  c.beginPath(); c.ellipse(cx, cy + 0.1, 0.88, 0.7, 0, 0, Math.PI * 2); c.fillStyle = g; c.fill();
  c.strokeStyle = '#3d2913'; c.lineWidth = 0.04; c.stroke();
  const cells = [[-0.35, -0.1], [0.05, -0.25], [0.4, 0.0], [-0.1, 0.25], [0.3, 0.35], [-0.45, 0.3]];
  cells.forEach(([dx, dy], i) => {
    c.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2;
      const px = cx + dx + Math.cos(a) * 0.17, py = cy + dy + Math.sin(a) * 0.15;
      k ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath(); c.fillStyle = '#e8c870'; c.fill(); c.strokeStyle = '#a77f2a'; c.stroke();
    const wig = Math.sin(t * 3 + i * 1.7) * 0.03;
    ellipse(c, cx + dx + wig, cy + dy, 0.08, 0.1, '#fffbe8');
  });
}

// Bramble Hedge tile. isHedge(x, y) says whether a neighbouring tile is also hedge.
export function drawHedge(c, x, y, seed, isHedge) {
  const cx = x + 0.5, cy = y + 0.5;
  ellipse(c, cx, cy + 0.2, 0.46, 0.2, 'rgba(0,0,0,0.2)');
  c.strokeStyle = '#5c3b1c'; c.lineWidth = 0.12; c.lineCap = 'round';
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    if (isHedge(x + dx, y + dy)) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + dx, cy + dy); c.stroke(); }
  }
  const blobs = [[-0.2, 0.05, 0.24], [0.2, 0.06, 0.23], [0, -0.13, 0.26], [0.02, 0.12, 0.22]];
  for (const [dx, dy, r] of blobs) ellipse(c, cx + dx, cy + dy, r, r * 0.9, hash(seed + dx * 7) > 0.5 ? '#2f7a28' : '#3a8f30');
  ellipse(c, cx - 0.08, cy - 0.18, 0.12, 0.07, 'rgba(160,230,120,0.4)');
  c.fillStyle = '#efe6c4';
  for (let i = 0; i < 5; i++) {
    const a = hash(seed + i) * Math.PI * 2, r = 0.22 + hash(seed + i + 3) * 0.1;
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * 0.85;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * 0.12, py + Math.sin(a) * 0.12); c.lineTo(px + Math.cos(a + 1.6) * 0.04, py + Math.sin(a + 1.6) * 0.04); c.fill();
  }
  if (hash(seed + 11) > 0.6) ellipse(c, cx + 0.15, cy - 0.05, 0.05, 0.05, '#d9241a'); // a tiny pepper
}

function drawWall(c, b, game) {
  const { x, y } = b;
  const cx = x + 0.5, cy = y + 0.5;
  if (b.style === 'hedge') {
    drawHedge(c, x, y, b.id, (nx, ny) => { const n = game.grid.get(nx, ny); return !!(n && n.alive && n.type === 'wall'); });
    return;
  }
  // twigs to neighbours
  c.lineCap = 'round';
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const n = game.grid.get(x + dx, y + dy);
    if (n && n.alive && n.type === 'wall') {
      c.strokeStyle = '#5c3b1c'; c.lineWidth = 0.22;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + dx, cy + dy); c.stroke();
      c.strokeStyle = '#8b5e34'; c.lineWidth = 0.1;
      c.beginPath(); c.moveTo(cx, cy - 0.04); c.lineTo(cx + dx, cy + dy - 0.04); c.stroke();
    }
  }
  ellipse(c, cx, cy + 0.15, 0.42, 0.22, 'rgba(0,0,0,0.2)');
  const pebbles = [[-0.18, 0.05, 0.22], [0.18, 0.08, 0.2], [0, -0.12, 0.22]];
  for (const [dx, dy, r] of pebbles) {
    const h = hash(b.id + dx * 10);
    const shade = 140 + Math.floor(h * 40);
    ellipse(c, cx + dx, cy + dy, r, r * 0.85, `rgb(${shade},${shade - 5},${shade - 15})`);
    ellipse(c, cx + dx - r * 0.3, cy + dy - r * 0.3, r * 0.3, r * 0.2, 'rgba(255,255,255,0.35)');
  }
}

const BUILDING_ART = {
  compost: drawCompost, thorn: drawThorn, sap: drawSap, aphid: drawAphid, dew: drawDew, nursery: drawNursery,
  // your garden, when it's under attack
  stem: (c, b, t) => drawStem(c, b.x, b.y, b.level, t),
  leaf: (c, b, t) => PLANT_ART.leaf(c, b.x, b.y, b.level, t),
  root: (c, b, t) => PLANT_ART.root(c, b.x, b.y, b.level, t),
  blossom: (c, b, t) => PLANT_ART.blossom(c, b.x, b.y, b.level, t, 0, 0),
  lab: (c, b, t) => PLANT_ART.lab(c, b.x, b.y, b.level, t),
  greenhouse: (c, b, t) => PLANT_ART.greenhouse(c, b.x, b.y, b.level, t),
};

// Lets the Garden draw Thorn Shooters and Sap Sprayers with the battle art.
export function drawTurret(c, type, x, y, level, t, aim = -Math.PI / 2, id = 1) {
  const b = { x, y, w: 2, h: 2, cx: x + 1, cy: y + 1, aim, fireT: 0, id, friendly: true, level };
  BUILDING_ART[type](c, b, t);
}

// ---------- bugs ----------

function bugLegs(c, n, len, spread, color) {
  c.strokeStyle = color; c.lineWidth = 0.035; c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * spread;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0.05, y); c.lineTo(0.05 + s * 0 + 0.0, y); c.lineTo(s * len, y + 0.12); c.stroke(); }
  }
}

export function drawAphidBug(c, flash) {
  bugLegs(c, 3, 0.3, 0.14, '#5c8a2a');
  const g = c.createRadialGradient(-0.08, -0.08, 0.02, 0, 0, 0.32);
  g.addColorStop(0, '#e4ffb0'); g.addColorStop(1, '#8cc63f');
  ellipse(c, 0, 0.05, 0.26, 0.3, flash ? '#fff' : g);
  ellipse(c, 0.18, -0.2, 0.13, 0.12, flash ? '#fff' : '#9bd14a');
  ellipse(c, 0.23, -0.23, 0.035, 0.04, '#111');
  c.strokeStyle = '#5c8a2a'; c.lineWidth = 0.03;
  c.beginPath(); c.moveTo(0.22, -0.3); c.quadraticCurveTo(0.3, -0.5, 0.42, -0.45); c.stroke();
}

export function drawBeetleBug(c, flash) {
  bugLegs(c, 3, 0.42, 0.18, '#1a120a');
  // mandibles
  c.strokeStyle = '#3a2412'; c.lineWidth = 0.07;
  c.beginPath(); c.moveTo(0.3, -0.25); c.quadraticCurveTo(0.6, -0.45, 0.5, -0.1); c.stroke();
  c.beginPath(); c.moveTo(0.3, -0.15); c.quadraticCurveTo(0.62, -0.05, 0.45, 0.08); c.stroke();
  const g = c.createLinearGradient(-0.3, -0.3, 0.3, 0.3);
  g.addColorStop(0, '#6b4a2a'); g.addColorStop(1, '#2a1a0c');
  ellipse(c, -0.02, 0.08, 0.36, 0.36, flash ? '#fff' : g);
  c.strokeStyle = '#120a04'; c.lineWidth = 0.03;
  c.beginPath(); c.moveTo(-0.02, -0.25); c.lineTo(-0.02, 0.43); c.stroke();
  ellipse(c, -0.12, -0.05, 0.08, 0.14, 'rgba(255,230,190,0.25)');
  ellipse(c, 0.22, -0.2, 0.15, 0.13, flash ? '#fff' : '#3a2412');
  ellipse(c, 0.27, -0.25, 0.04, 0.035, '#ff5a3a');
}

export function drawWaspBug(c, flash) {
  // wings flutter
  const flap = Math.sin(performance.now() / 30) * 0.08;
  ellipse(c, -0.05, -0.3 - flap, 0.22, 0.12, 'rgba(220,240,255,0.7)');
  ellipse(c, 0.12, -0.32 + flap, 0.2, 0.1, 'rgba(220,240,255,0.7)');
  c.save(); c.beginPath(); c.ellipse(-0.05, 0.05, 0.3, 0.17, 0, 0, Math.PI * 2); c.clip();
  c.fillStyle = flash ? '#fff' : '#ffd23f'; c.fillRect(-0.4, -0.2, 0.8, 0.4);
  c.fillStyle = '#1a1a1a';
  for (const x of [-0.25, -0.08, 0.09]) c.fillRect(x, -0.2, 0.07, 0.4);
  c.restore();
  c.fillStyle = '#1a1a1a'; c.beginPath(); c.moveTo(-0.34, 0.05); c.lineTo(-0.48, 0.1); c.lineTo(-0.33, 0.12); c.fill();
  ellipse(c, 0.3, -0.02, 0.12, 0.11, flash ? '#fff' : '#1a1a1a');
  ellipse(c, 0.34, -0.05, 0.04, 0.045, '#ff3b2e');
}

// ---------- unit drawing in world ----------

function drawUnit(c, u, t) {
  const s = u.d.radius * 3.2;
  const bob = Math.abs(Math.sin(u.walk)) * 0.06;
  ellipse(c, u.x, u.y + 0.05, u.d.radius * 0.9, u.d.radius * 0.4, 'rgba(0,0,0,0.3)');
  if (u.flavor) {
    c.beginPath(); c.ellipse(u.x, u.y + 0.05, u.d.radius * 1.1, u.d.radius * 0.5, 0, 0, Math.PI * 2);
    c.strokeStyle = FLAVORS[u.flavor].color; c.lineWidth = 0.06; c.stroke();
  }
  if (u.d.aura) {
    const pulse = 0.85 + Math.sin(t * 6) * 0.08;
    c.beginPath(); c.arc(u.x, u.y, u.d.aura * pulse, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,60,20,0.07)'; c.fill();
    c.strokeStyle = 'rgba(255,80,30,0.45)'; c.lineWidth = 0.06; c.stroke();
  }
  if (u.frenzy && Math.random() < 0.15) {
    // tiny flame flicker on frenzied peppers (drawn as a dot; cheap)
    ellipse(c, u.x + (Math.random() - 0.5) * 0.3, u.y - u.d.radius * 2, 0.04, 0.06, '#ff8a1c');
  }
  if (u.d.taunt) {
    c.beginPath(); c.arc(u.x, u.y, u.d.taunt, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(255,90,70,0.18)'; c.lineWidth = 0.05; c.setLineDash([0.2, 0.2]); c.stroke(); c.setLineDash([]);
  }
  c.save();
  if (u.hidden) c.globalAlpha = 0.35 + Math.sin(t * 8 + u.id) * 0.1;
  const lunge = u.atkAnim > 0 ? Math.sin((u.atkAnim / 0.18) * Math.PI) * 0.15 : 0;
  c.translate(u.x + lunge * u.face, u.y - s * 0.5 - bob);
  c.scale(s * u.face, s);
  drawTroopArt(c, u.type, u.d, u.hitT > 0);
  c.restore();
  if (u.slowT > 0) {
    ellipse(c, u.x, u.y - s * 0.2, u.d.radius * 0.9, u.d.radius * 0.5, 'rgba(240,170,40,0.5)');
  }
  if (u.hp < u.maxHp) hpBar(c, u.x, u.y - s * 1.15, 0.5, u.hp / u.maxHp, '#5fe05a');
}

function hpBar(c, x, y, w, frac, color) {
  c.fillStyle = 'rgba(0,0,0,0.55)';
  c.fillRect(x - w / 2 - 0.03, y - 0.03, w + 0.06, 0.13);
  c.fillStyle = frac > 0.5 ? color : frac > 0.25 ? '#ffc93c' : '#ff4b3a';
  c.fillRect(x - w / 2, y, w * Math.max(0, frac), 0.07);
}

// ---------- renderer ----------

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.c = canvas.getContext('2d');
    this.bg = document.createElement('canvas');
    this.mode = 'raid';
    this.area = null;
  }

  // 'raid' (picnic blanket) or 'defense' (your tilled garden plot in the middle)
  setScene(mode, area) {
    this.mode = mode;
    this.area = area;
    if (this.canvas.width) this.buildBackground();
  }

  resize(cssW, cssH) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const tile = Math.floor(Math.min(cssW / COLS, cssH / ROWS) * 100) / 100;
    this.tile = tile;
    this.dpr = dpr;
    const w = tile * COLS, h = tile * ROWS;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.S = tile * dpr;
    this.buildBackground();
  }

  buildBackground() {
    const bg = this.bg;
    bg.width = this.canvas.width; bg.height = this.canvas.height;
    const c = bg.getContext('2d');
    c.setTransform(this.S, 0, 0, this.S, 0, 0);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      c.fillStyle = (x + y) % 2 ? '#6cbf4a' : '#64b544';
      c.fillRect(x, y, 1.01, 1.01);
    }
    // grass tufts & flowers
    for (let i = 0; i < 160; i++) {
      const x = hash(i) * COLS, y = hash(i + 500) * (ROWS - DEPLOY_ROWS);
      c.strokeStyle = 'rgba(40,110,30,0.6)'; c.lineWidth = 0.04;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - 0.06, y - 0.15); c.moveTo(x, y); c.lineTo(x + 0.05, y - 0.17); c.stroke();
    }
    for (let i = 0; i < 22; i++) {
      const x = hash(i + 900) * COLS, y = hash(i + 1300) * (ROWS - DEPLOY_ROWS - 1);
      const col = ['#fff', '#ffe066', '#ff9ecb'][i % 3];
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2;
        ellipse(c, x + Math.cos(a) * 0.07, y + Math.sin(a) * 0.07, 0.05, 0.05, col);
      }
      ellipse(c, x, y, 0.04, 0.04, '#f5a623');
    }
    if (this.mode === 'defense' && this.area) {
      const a = this.area;
      c.fillStyle = '#4a3020';
      c.beginPath(); c.roundRect(a.x - 0.1, a.y - 0.1, a.w + 0.2, a.h + 0.2, 0.5); c.fill();
      c.fillStyle = '#6b4528';
      c.beginPath(); c.roundRect(a.x, a.y, a.w, a.h, 0.4); c.fill();
      c.strokeStyle = 'rgba(40,22,10,0.35)'; c.lineWidth = 0.05;
      for (let y = a.y + 0.5; y < a.y + a.h; y += 0.5) { c.beginPath(); c.moveTo(a.x + 0.2, y); c.lineTo(a.x + a.w - 0.2, y); c.stroke(); }
      return;
    }
    // picnic blanket (gingham)
    const top = ROWS - DEPLOY_ROWS;
    c.fillStyle = '#fbf3e4';
    c.fillRect(0, top, COLS, DEPLOY_ROWS);
    const n = 4;
    for (let y = 0; y < DEPLOY_ROWS * n; y++) for (let x = 0; x < COLS * n; x++) {
      const a = x % 2, b = y % 2;
      if (a && b) c.fillStyle = 'rgba(214,40,40,0.85)';
      else if (a || b) c.fillStyle = 'rgba(214,40,40,0.4)';
      else continue;
      c.fillRect(x / n, top + y / n, 1 / n + 0.005, 1 / n + 0.005);
    }
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.fillRect(0, top - 0.08, COLS, 0.08);
  }

  render(game, ui) {
    const c = this.c;
    const t = game.clock;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(this.bg, 0, 0);
    let sx = 0, sy = 0;
    if (game.shake > 0) { sx = (Math.random() - 0.5) * game.shake * 0.5; sy = (Math.random() - 0.5) * game.shake * 0.5; }
    c.setTransform(this.S, 0, 0, this.S, sx * this.S, sy * this.S);

    // deploy zone highlight
    if (!game.defense && ui.selected && !ui.spellArmed && (game.phase === 'scout' || game.phase === 'battle')) {
      const a = 0.15 + Math.sin(t * 4) * 0.08;
      c.fillStyle = `rgba(255,255,255,${a})`;
      c.fillRect(0, ROWS - DEPLOY_ROWS, COLS, DEPLOY_ROWS);
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 0.06; c.setLineDash([0.25, 0.18]);
      c.strokeRect(0.05, ROWS - DEPLOY_ROWS + 0.05, COLS - 0.1, DEPLOY_ROWS - 0.1); c.setLineDash([]);
    }
    if (ui.denyFlash > 0) {
      c.fillStyle = `rgba(255,40,40,${ui.denyFlash})`;
      c.fillRect(0, ROWS - DEPLOY_ROWS, COLS, DEPLOY_ROWS);
    }

    // rubble
    for (const b of game.buildings) {
      if (b.alive) continue;
      if (b.type === 'wall') {
        ellipse(c, b.cx, b.cy + 0.1, 0.3, 0.15, 'rgba(90,70,50,0.6)');
        ellipse(c, b.cx - 0.1, b.cy + 0.05, 0.08, 0.06, '#999');
      } else {
        ellipse(c, b.cx, b.cy + 0.1, b.w * 0.45, b.h * 0.35, '#6b4a2b');
        for (let i = 0; i < 6; i++) {
          ellipse(c, b.cx + (hash(b.id + i) - 0.5) * b.w * 0.7, b.cy + (hash(b.id + i + 9) - 0.5) * b.h * 0.5, 0.12, 0.08, '#4d3420');
        }
      }
    }

    // effects on the ground
    for (const e of game.effects) {
      if (e.kind === 'salsa') {
        const a = 0.8 * (1 - e.t / e.dur);
        const k = Math.min(1, e.t * 6);
        ellipse(c, e.x, e.y, e.r * 0.7 * k, e.r * 0.4 * k, `rgba(220,40,25,${a})`);
        for (let i = 0; i < 6; i++) {
          ellipse(c, e.x + Math.cos(i * 1.1) * e.r * 0.4 * k, e.y + Math.sin(i * 1.1) * e.r * 0.22 * k, 0.09, 0.06,
            i % 2 ? `rgba(80,180,60,${a})` : `rgba(255,240,200,${a})`);
        }
      }
      if (e.kind === 'puddle') {
        const a = 0.45 * (1 - e.t / e.dur);
        ellipse(c, e.x, e.y, e.r * 0.8, e.r * 0.45, `rgba(230,165,40,${a})`);
      }
    }

    // scouting: defense ranges
    if (game.phase === 'scout') {
      for (const b of game.buildings) {
        if (!b.alive || !b.def.attack) continue;
        c.beginPath(); c.arc(b.cx, b.cy, b.def.range, 0, Math.PI * 2);
        c.fillStyle = b.def.attack === 'sap' ? 'rgba(240,170,40,0.08)' : 'rgba(255,255,255,0.07)';
        c.fill();
        c.strokeStyle = b.def.attack === 'sap' ? 'rgba(240,170,40,0.6)' : 'rgba(255,255,255,0.55)';
        c.lineWidth = 0.05; c.setLineDash([0.2, 0.15]); c.stroke(); c.setLineDash([]);
      }
    }

    // walls (flat, drawn under everything else standing)
    for (const b of game.buildings) if (b.alive && b.type === 'wall') drawWall(c, b, game);

    // armed traps
    for (const tr of game.traps) {
      if (tr.state !== 'armed') continue;
      const k = 1 + (1 - tr.timer / 0.35) * 0.6;
      ellipse(c, tr.x, tr.y, 0.3 * k, 0.25 * k, '#ff8a1c');
      ellipse(c, tr.x - 0.1, tr.y - 0.08, 0.1 * k, 0.08 * k, '#ffd28a');
    }

    // depth-sorted buildings & units
    const things = [];
    for (const b of game.buildings) if (b.alive && b.type !== 'wall') things.push({ y: b.y + b.h, b });
    for (const u of game.units) things.push({ y: u.y, u });
    things.sort((a, b) => a.y - b.y);
    for (const th of things) {
      if (th.b) {
        const b = th.b;
        c.save();
        if (b.hitT > 0) { c.translate(b.cx, b.cy); c.scale(1.04, 0.96); c.translate(-b.cx, -b.cy); }
        BUILDING_ART[b.type](c, b, t);
        c.restore();
      } else drawUnit(c, th.u, t);
    }

    // flavor debuffs on buildings
    for (const b of game.buildings) {
      if (!b.alive) continue;
      if (b.mangoT > 0) {
        c.globalAlpha = Math.min(1, b.mangoT);
        ellipse(c, b.cx, b.cy - 0.45, b.w * 0.32, 0.18, '#ffb02e');
        for (let i = 0; i < 3; i++) {
          const dy = ((t * 0.8 + i * 0.33) % 1) * 0.6;
          ellipse(c, b.cx - 0.3 + i * 0.3, b.cy - 0.35 + dy, 0.06, 0.09, '#f29a12');
        }
        c.globalAlpha = 1;
      }
      if (b.onionT > 0) {
        c.globalAlpha = Math.min(0.6, b.onionT * 0.4);
        for (let i = 0; i < 4; i++) {
          const a = t * 1.5 + i * 1.57;
          ellipse(c, b.cx + Math.cos(a) * 0.5, b.cy - 0.5 + Math.sin(a) * 0.2, 0.28, 0.18, '#c58ad6');
        }
        c.globalAlpha = 1;
      }
    }

    // hp bars for damaged buildings
    for (const b of game.buildings) {
      if (b.alive && b.hp < b.maxHp) hpBar(c, b.cx, b.type === 'wall' ? b.y : b.y - 0.15, Math.min(1.4, b.w * 0.7), b.hp / b.maxHp, '#ffd23f');
    }

    // projectiles
    for (const p of game.projectiles) {
      if (p.kind === 'thorn') {
        c.save(); c.translate(p.x, p.y); c.rotate(p.ang || 0);
        c.fillStyle = '#efe6c4';
        c.beginPath(); c.moveTo(0.18, 0); c.lineTo(-0.12, -0.05); c.lineTo(-0.12, 0.05); c.fill();
        c.restore();
      } else {
        const k = p.t / p.dur;
        const x = p.sx + (p.tx - p.sx) * k, y = p.sy + (p.ty - p.sy) * k;
        const arc = Math.sin(k * Math.PI) * (p.kind === 'sap' ? 1.4 : 1.8);
        ellipse(c, x, y, 0.12, 0.06, 'rgba(0,0,0,0.25)');
        if (p.kind === 'sap') {
          ellipse(c, x, y - arc, 0.17, 0.15, '#f0b32e');
          ellipse(c, x - 0.05, y - arc - 0.05, 0.05, 0.04, '#fff3c4');
        } else {
          for (let i = 0; i < 3; i++) ellipse(c, x + (i - 1) * 0.1, y - arc + (i % 2) * 0.06, 0.07, 0.06, '#ffe08a');
          ellipse(c, x, y - arc, 0.05, 0.05, '#ff4b1f');
        }
      }
    }

    // effects in the air
    for (const e of game.effects) {
      if (e.kind === 'ring') {
        const k = e.t / e.dur;
        c.beginPath(); c.arc(e.x, e.y, e.r * (0.3 + k * 0.7), 0, Math.PI * 2);
        c.strokeStyle = e.color; c.globalAlpha = 1 - k; c.lineWidth = 0.12; c.stroke(); c.globalAlpha = 1;
      } else if (e.kind === 'strike') {
        if (e.t < SPELL.delay) {
          const k = e.t / SPELL.delay;
          c.beginPath(); c.arc(e.x, e.y, SPELL.radius, 0, Math.PI * 2);
          c.fillStyle = `rgba(255,40,20,${0.12 + k * 0.15})`; c.fill();
          c.strokeStyle = 'rgba(255,60,30,0.8)'; c.lineWidth = 0.08; c.stroke();
          c.save(); c.translate(e.x, e.y - (1 - k) * 8); c.rotate(Math.PI + k * 6); c.scale(1.4, 1.4);
          drawBottle(c); c.restore();
        } else {
          const k = (e.t - SPELL.delay) / 0.6;
          const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, SPELL.radius * (0.6 + k * 0.6));
          g.addColorStop(0, `rgba(255,240,180,${1 - k})`);
          g.addColorStop(0.4, `rgba(255,90,20,${0.9 * (1 - k)})`);
          g.addColorStop(1, 'rgba(180,20,10,0)');
          c.fillStyle = g;
          c.beginPath(); c.arc(e.x, e.y, SPELL.radius * (0.6 + k * 0.6), 0, Math.PI * 2); c.fill();
        }
      }
    }

    // particles
    for (const p of game.particles) {
      c.globalAlpha = Math.min(1, p.life / p.max * 1.5);
      c.fillStyle = p.color;
      c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;

    // spell targeting preview
    if (ui.spellArmed && ui.hover) {
      c.beginPath(); c.arc(ui.hover.x, ui.hover.y, SPELL.radius, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255,60,30,0.2)'; c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 0.06; c.setLineDash([0.2, 0.15]); c.stroke(); c.setLineDash([]);
    }

    // floating text (screen space for crisp fonts)
    c.setTransform(1, 0, 0, 1, 0, 0);
    const fs = Math.max(11, this.tile * 0.42) * this.dpr;
    c.font = `${fs}px 'Lilita One', system-ui, sans-serif`;
    c.textAlign = 'center';
    for (const tx of game.texts) {
      c.globalAlpha = Math.min(1, tx.life * 2);
      const px = tx.x * this.S, py = tx.y * this.S;
      c.lineWidth = fs * 0.18; c.strokeStyle = 'rgba(0,0,0,0.7)'; c.strokeText(tx.text, px, py);
      c.fillStyle = tx.color; c.fillText(tx.text, px, py);
    }
    c.globalAlpha = 1;

    // inspected building label (scouting)
    if (ui.inspect && ui.inspect.until > t) {
      const b = ui.inspect.b;
      const label = ui.inspect.text;
      const px = b.cx * this.S, py = (b.y - 0.35) * this.S;
      const w = c.measureText(label).width + fs;
      c.fillStyle = 'rgba(30,20,10,0.85)';
      c.beginPath(); c.roundRect(px - w / 2, py - fs * 1.1, w, fs * 1.5, fs * 0.4); c.fill();
      c.fillStyle = '#fff4d6'; c.fillText(label, px, py);
    }
  }

  toWorld(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (clientX - r.left) / this.tile, y: (clientY - r.top) / this.tile };
  }
}

export { UNITS };
