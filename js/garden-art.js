// Drawing for the Garden (home base). Coordinates are in tiles.

function ellipse(c, x, y, rx, ry, fill) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
}

function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

function leafShape(c, len, wid) {
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(len * 0.3, -wid, len * 0.75, -wid * 0.8, len, 0);
  c.bezierCurveTo(len * 0.75, wid * 0.8, len * 0.3, wid, 0, 0);
  c.closePath();
}

function miniPepper(c, x, y, s, color, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.beginPath();
  c.moveTo(-0.25, -0.4);
  c.bezierCurveTo(0.3, -0.45, 0.3, 0.3, 0.05, 0.6);
  c.bezierCurveTo(-0.3, 0.3, -0.45, -0.3, -0.25, -0.4);
  c.fillStyle = color; c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath(); c.ellipse(-0.1, -0.1, 0.05, 0.18, -0.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#3e6b1f';
  c.beginPath(); c.ellipse(-0.05, -0.45, 0.2, 0.08, 0, 0, Math.PI * 2); c.fill();
  c.restore();
}

// ---------- the Stem (HQ): x,y = top-left of its 3x3 plot ----------
export function drawStem(c, x, y, level, t, bounce = 0) {
  const cx = x + 1.5, base = y + 2.55;
  const h = 1.75 + level * 0.35;
  const w = 0.34 + level * 0.07;
  const sway = Math.sin(t * 1.2) * 0.04;
  ellipse(c, cx, base, 1.35, 0.42, 'rgba(0,0,0,0.22)');
  ellipse(c, cx, base - 0.05, 1.15, 0.34, '#5a3a1e');
  ellipse(c, cx, base - 0.1, 0.95, 0.24, '#6e4826');

  c.save();
  c.translate(cx, base - 0.1);
  c.scale(1 + bounce * 0.12, 1 - bounce * 0.08);
  c.rotate(sway);

  // stalk
  const g = c.createLinearGradient(-w, 0, w, 0);
  const woody = level >= 3;
  g.addColorStop(0, woody ? '#4f6b2a' : '#2f7a2a');
  g.addColorStop(0.5, woody ? '#7d9a3f' : '#57b347');
  g.addColorStop(1, woody ? '#435a22' : '#276623');
  c.beginPath();
  c.moveTo(-w, 0);
  c.bezierCurveTo(-w * 0.9, -h * 0.5, -w * 0.6, -h * 0.85, -w * 0.45, -h);
  c.lineTo(w * 0.45, -h);
  c.bezierCurveTo(w * 0.6, -h * 0.85, w * 0.9, -h * 0.5, w, 0);
  c.closePath();
  c.fillStyle = g; c.fill();
  c.strokeStyle = '#1d4a19'; c.lineWidth = 0.04; c.stroke();
  if (woody) {
    c.strokeStyle = 'rgba(60,40,15,0.35)'; c.lineWidth = 0.03;
    for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-w * 0.7, -h * i / 5); c.quadraticCurveTo(0, -h * i / 5 + 0.06, w * 0.7, -h * i / 5); c.stroke(); }
  }

  // canopy leaves
  const nLeaves = 4 + level * 2;
  for (let i = 0; i < nLeaves; i++) {
    const side = i % 2 ? 1 : -1;
    const k = i / nLeaves;
    const ly = -h * (0.55 + k * 0.5);
    const len = 0.7 + level * 0.12 - k * 0.2;
    c.save();
    c.translate(side * w * 0.3, ly);
    c.rotate(side > 0 ? -0.35 - k * 0.4 + Math.sin(t * 2 + i) * 0.05 : Math.PI + 0.35 + k * 0.4 + Math.sin(t * 2 + i) * 0.05);
    leafShape(c, len, len * 0.38);
    c.fillStyle = i % 3 ? '#3fa13a' : '#4fbf46'; c.fill();
    c.strokeStyle = '#256b22'; c.lineWidth = 0.03; c.stroke();
    c.beginPath(); c.moveTo(0, 0); c.lineTo(len * 0.9, 0); c.stroke();
    c.restore();
  }
  // top sprout
  c.save(); c.translate(0, -h * 1.05); c.rotate(-Math.PI / 2 + Math.sin(t * 1.5) * 0.1);
  leafShape(c, 0.5, 0.2); c.fillStyle = '#6fd35f'; c.fill(); c.restore();

  // hanging peppers
  const nPeppers = level + 1;
  const colors = ['#d9241a', '#3fa34d', '#ff8a1c', '#d9241a', '#b01f16', '#3fa34d'];
  for (let i = 0; i < nPeppers; i++) {
    const side = i % 2 ? 1 : -1;
    const px = side * (w * 0.9 + 0.25 + (i >> 1) * 0.12);
    const py = -h * (0.6 + ((i * 0.37) % 0.35));
    miniPepper(c, px, py + 0.25, 0.42 + level * 0.03, colors[i % colors.length], side * 0.25 + Math.sin(t * 2 + i) * 0.08);
  }

  // face
  const fy = -h * 0.32;
  for (const s of [-1, 1]) {
    ellipse(c, s * w * 0.42, fy, 0.09, 0.11, '#fff');
    ellipse(c, s * w * 0.42 + 0.02, fy + 0.02, 0.045, 0.06, '#111');
    c.beginPath(); c.moveTo(s * w * 0.42 - s * 0.12, fy - 0.16); c.lineTo(s * w * 0.42 + s * 0.1, fy - 0.1);
    c.lineWidth = 0.05; c.lineCap = 'round'; c.strokeStyle = '#123'; c.stroke();
  }
  c.beginPath(); c.arc(0, fy + 0.18, 0.1, 0.1 * Math.PI, 0.9 * Math.PI); c.lineWidth = 0.04; c.strokeStyle = '#123'; c.stroke();
  c.restore();
}

// ---------- Leaf (Sunlight) ----------
export function drawLeaf(c, x, y, level, t, bounce = 0) {
  const cx = x + 1, cy = y + 1.1;
  ellipse(c, cx, cy + 0.6, 0.85, 0.3, 'rgba(0,0,0,0.2)');
  c.save();
  c.translate(cx - 0.75, cy + 0.45);
  const s = 0.75 + level * 0.12;
  c.scale(s * (1 + bounce * 0.15), s * (1 - bounce * 0.1));
  c.rotate(-0.6 + Math.sin(t * 1.6 + x) * 0.05);
  // petiole
  c.strokeStyle = '#3d7a22'; c.lineWidth = 0.1;
  c.beginPath(); c.moveTo(-0.15, 0.1); c.lineTo(0.15, 0); c.stroke();
  const g = c.createLinearGradient(0, -0.5, 0, 0.5);
  g.addColorStop(0, '#7fd85a'); g.addColorStop(1, '#3a9a2c');
  leafShape(c, 1.9, 0.75);
  c.fillStyle = g; c.fill();
  c.strokeStyle = '#2a6e21'; c.lineWidth = 0.05; c.stroke();
  c.lineWidth = 0.035;
  c.beginPath(); c.moveTo(0.05, 0); c.lineTo(1.8, 0); c.stroke();
  for (let i = 1; i < 6; i++) {
    const px = i * 0.3;
    c.beginPath(); c.moveTo(px, 0); c.lineTo(px + 0.25, -0.4 + i * 0.03); c.stroke();
    c.beginPath(); c.moveTo(px, 0); c.lineTo(px + 0.25, 0.4 - i * 0.03); c.stroke();
  }
  // glint
  c.fillStyle = 'rgba(255,255,220,0.35)';
  c.beginPath(); c.ellipse(0.8, -0.25, 0.35, 0.08, -0.1, 0, Math.PI * 2); c.fill();
  c.restore();
}

// ---------- Root (Water) ----------
export function drawRoot(c, x, y, level, t, bounce = 0) {
  const cx = x + 1, cy = y + 1.05;
  ellipse(c, cx, cy + 0.15, 0.95, 0.65, '#4a2f17');
  ellipse(c, cx, cy + 0.1, 0.8, 0.52, '#5e3d1f');
  // water seeping
  const lvlR = 0.25 + level * 0.06;
  const g = c.createRadialGradient(cx - 0.1, cy, 0.02, cx, cy + 0.1, lvlR + 0.1);
  g.addColorStop(0, '#bfeaff'); g.addColorStop(1, '#2b86c4');
  ellipse(c, cx, cy + 0.15, lvlR + 0.05, (lvlR + 0.05) * 0.6, g);
  // tendrils
  c.lineCap = 'round';
  const n = 4 + level;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3;
    const len = 0.7 + level * 0.06 + hash(i + x) * 0.15;
    const wig = Math.sin(t * 1.5 + i) * 0.05;
    c.strokeStyle = '#c8a06a'; c.lineWidth = 0.1 * (1 + bounce * 0.4);
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 0.2, cy + Math.sin(a) * 0.15);
    c.quadraticCurveTo(cx + Math.cos(a + 0.4) * len * 0.6 + wig, cy + Math.sin(a + 0.4) * len * 0.45,
      cx + Math.cos(a) * len, cy + Math.sin(a) * len * 0.7);
    c.stroke();
    c.strokeStyle = '#e4c590'; c.lineWidth = 0.035;
    c.stroke();
  }
  // root crown
  ellipse(c, cx, cy - 0.15, 0.3, 0.2, '#8c6239');
  c.fillStyle = '#4fae3a';
  c.beginPath(); c.moveTo(cx - 0.12, cy - 0.25); c.quadraticCurveTo(cx - 0.3, cy - 0.7, cx - 0.05, cy - 0.75); c.quadraticCurveTo(cx, cy - 0.5, cx - 0.12, cy - 0.25); c.fill();
  c.beginPath(); c.moveTo(cx + 0.08, cy - 0.25); c.quadraticCurveTo(cx + 0.35, cy - 0.65, cx + 0.15, cy - 0.72); c.quadraticCurveTo(cx + 0.05, cy - 0.5, cx + 0.08, cy - 0.25); c.fill();
}

// ---------- Blossom (barracks) ----------
export function drawBlossom(c, x, y, level, t, bounce = 0, troops = 0) {
  const cx = x + 1, cy = y + 0.95;
  ellipse(c, cx, cy + 0.65, 0.85, 0.3, 'rgba(0,0,0,0.2)');
  // stem & sepals
  c.strokeStyle = '#3d7a22'; c.lineWidth = 0.1;
  c.beginPath(); c.moveTo(cx, cy + 0.65); c.quadraticCurveTo(cx + 0.1, cy + 0.3, cx, cy); c.stroke();
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + 0.6;
    c.save(); c.translate(cx, cy); c.rotate(a);
    leafShape(c, 0.75, 0.22); c.fillStyle = '#4b9a32'; c.fill(); c.restore();
  }
  const s = (0.8 + level * 0.08) * (1 + bounce * 0.2);
  const spin = Math.sin(t * 0.8 + x) * 0.08;
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + spin;
    c.save(); c.translate(cx, cy); c.rotate(a);
    c.beginPath(); c.ellipse(0.33 * s, 0, 0.36 * s, 0.24 * s, 0, 0, Math.PI * 2);
    const g = c.createRadialGradient(0.1 * s, 0, 0.02, 0.33 * s, 0, 0.4 * s);
    g.addColorStop(0, '#fffbe8'); g.addColorStop(1, level >= 3 ? '#ffd0e0' : '#f2ede0');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(160,140,110,0.5)'; c.lineWidth = 0.025; c.stroke();
    c.restore();
  }
  ellipse(c, cx, cy, 0.17 * s, 0.17 * s, '#f5c518');
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    ellipse(c, cx + Math.cos(a) * 0.1 * s, cy + Math.sin(a) * 0.1 * s, 0.03, 0.03, '#b07d0a');
  }
  // little peppers waiting in the blossom
  const shown = Math.min(5, troops);
  for (let i = 0; i < shown; i++) {
    const a = i / 5 * Math.PI * 2 + 0.3;
    miniPepper(c, cx + Math.cos(a) * 0.62, cy + 0.15 + Math.sin(a) * 0.45 + Math.sin(t * 4 + i) * 0.03, 0.28,
      ['#3fa34d', '#ff8a1c', '#d9241a'][i % 3], Math.sin(t * 3 + i) * 0.2);
  }
}

// ---------- Flavor Lab: a bubbling clay pot and a flask ----------
export function drawLab(c, x, y, level, t, bounce = 0) {
  const cx = x + 0.9, cy = y + 1.15;
  ellipse(c, x + 1, cy + 0.6, 0.95, 0.3, 'rgba(0,0,0,0.22)');
  // flask behind
  const fx = x + 1.6, fy = y + 0.85;
  c.fillStyle = 'rgba(220,240,255,0.55)';
  c.beginPath(); c.moveTo(fx - 0.06, fy - 0.55); c.lineTo(fx + 0.06, fy - 0.55); c.lineTo(fx + 0.06, fy - 0.25);
  c.lineTo(fx + 0.25, fy + 0.25); c.quadraticCurveTo(fx, fy + 0.4, fx - 0.25, fy + 0.25); c.lineTo(fx - 0.06, fy - 0.25); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(80,110,140,0.8)'; c.lineWidth = 0.03; c.stroke();
  const hue = (t * 40) % 360;
  c.fillStyle = `hsl(${hue},85%,55%)`;
  c.beginPath(); c.moveTo(fx - 0.17, fy + 0.1); c.lineTo(fx + 0.17, fy + 0.1); c.lineTo(fx + 0.25, fy + 0.25);
  c.quadraticCurveTo(fx, fy + 0.4, fx - 0.25, fy + 0.25); c.closePath(); c.fill();
  // pot
  c.save(); c.translate(cx, cy); c.scale(1 + bounce * 0.15, 1 - bounce * 0.1);
  const g = c.createLinearGradient(-0.7, 0, 0.7, 0);
  g.addColorStop(0, '#9c4a22'); g.addColorStop(0.5, '#d9773e'); g.addColorStop(1, '#8a3f1c');
  c.beginPath(); c.moveTo(-0.62, -0.25); c.quadraticCurveTo(-0.75, 0.45, 0, 0.55); c.quadraticCurveTo(0.75, 0.45, 0.62, -0.25); c.closePath();
  c.fillStyle = g; c.fill(); c.strokeStyle = '#5e2a10'; c.lineWidth = 0.04; c.stroke();
  ellipse(c, 0, -0.25, 0.7, 0.2, '#7a3516');
  // brew
  ellipse(c, 0, -0.24, 0.58, 0.14, '#e8452c');
  ellipse(c, -0.15, -0.27, 0.2, 0.05, '#ff8a5a');
  // pepper stripe on pot
  c.fillStyle = '#3fa34d';
  c.beginPath(); c.ellipse(0, 0.15, 0.12, 0.2, 0.3, 0, Math.PI * 2); c.fill();
  c.restore();
  // bubbles & steam
  for (let i = 0; i < 4; i++) {
    const k = (t * 0.7 + i * 0.25) % 1;
    c.globalAlpha = 1 - k;
    ellipse(c, cx - 0.3 + i * 0.2 + Math.sin(t * 3 + i) * 0.05, cy - 0.3 - k * 0.9, 0.06 + k * 0.1, 0.06 + k * 0.1, i % 2 ? '#ffd0c0' : '#ffffff');
  }
  c.globalAlpha = 1;
}

// ---------- Greenhouse: a little glass house full of seedlings ----------
export function drawGreenhouse(c, x, y, level, t, bounce = 0) {
  const cx = x + 1, base = y + 1.75;
  ellipse(c, cx, base + 0.1, 1.0, 0.25, 'rgba(0,0,0,0.22)');
  c.save(); c.translate(cx, base); c.scale(1 + bounce * 0.1, 1 - bounce * 0.08);
  // frame + glass
  c.fillStyle = 'rgba(200,240,255,0.55)';
  c.beginPath(); c.moveTo(-0.85, 0); c.lineTo(-0.85, -0.85); c.lineTo(0, -1.45); c.lineTo(0.85, -0.85); c.lineTo(0.85, 0); c.closePath(); c.fill();
  // seedlings inside
  for (let i = 0; i < 5; i++) {
    const px = -0.6 + i * 0.3, sway = Math.sin(t * 2 + i) * 0.04;
    c.fillStyle = '#6b4528'; c.fillRect(px - 0.09, -0.2, 0.18, 0.2);
    c.fillStyle = ['#3fa34d', '#ff8a1c', '#e23b2e', '#cfc4f0', '#3fa34d'][i];
    c.beginPath(); c.ellipse(px + sway, -0.33, 0.07, 0.13, sway, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = '#e8e8e8'; c.lineWidth = 0.06; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-0.85, 0); c.lineTo(-0.85, -0.85); c.lineTo(0, -1.45); c.lineTo(0.85, -0.85); c.lineTo(0.85, 0); c.closePath(); c.stroke();
  c.lineWidth = 0.035;
  c.beginPath(); c.moveTo(0, -1.45); c.lineTo(0, 0); c.moveTo(-0.85, -0.85); c.lineTo(0.85, -0.85); c.moveTo(-0.42, -1.15); c.lineTo(-0.42, 0); c.moveTo(0.42, -1.15); c.lineTo(0.42, 0); c.stroke();
  // glint
  c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 0.05;
  c.beginPath(); c.moveTo(-0.7, -0.75); c.lineTo(-0.5, -0.95); c.stroke();
  c.restore();
}

export const PLANT_ART = { leaf: drawLeaf, root: drawRoot, blossom: drawBlossom, lab: drawLab, greenhouse: drawGreenhouse };

// ---------- bubbles & badges ----------

export function drawBubble(c, x, y, kind, t, full) {
  const bob = Math.sin(t * 3 + x) * 0.06;
  y += bob;
  c.fillStyle = full ? '#ffe2a8' : '#ffffff';
  c.strokeStyle = full ? '#e8452c' : 'rgba(0,0,0,0.35)';
  c.lineWidth = full ? 0.06 : 0.04;
  c.beginPath(); c.arc(x, y, 0.32, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x - 0.08, y + 0.28); c.lineTo(x, y + 0.45); c.lineTo(x + 0.08, y + 0.28); c.fill();
  if (kind === 'sun') {
    c.strokeStyle = '#f5a623'; c.lineWidth = 0.045;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + t;
      c.beginPath(); c.moveTo(x + Math.cos(a) * 0.14, y + Math.sin(a) * 0.14); c.lineTo(x + Math.cos(a) * 0.22, y + Math.sin(a) * 0.22); c.stroke();
    }
    ellipse(c, x, y, 0.12, 0.12, '#ffd23f');
  } else {
    c.beginPath();
    c.moveTo(x, y - 0.2);
    c.bezierCurveTo(x + 0.08, y - 0.08, x + 0.15, y, x + 0.14, y + 0.07);
    c.bezierCurveTo(x + 0.12, y + 0.18, x - 0.12, y + 0.18, x - 0.14, y + 0.07);
    c.bezierCurveTo(x - 0.15, y, x - 0.08, y - 0.08, x, y - 0.2);
    c.fillStyle = '#3aa7e6'; c.fill();
  }
}

export function drawLevelBadge(c, x, y, level) {
  c.fillStyle = '#2b1d14';
  c.beginPath(); c.arc(x, y, 0.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffd23f';
  c.beginPath(); c.arc(x, y, 0.16, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2b1d14';
  c.font = `bold 0.22px 'Lilita One', system-ui, sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(String(level), x, y + 0.01);
}

// Build-menu icon for a plant type (draws into a small canvas).
export function drawPlantIcon(canvas, type) {
  const c = canvas.getContext('2d');
  const s = canvas.width;
  c.clearRect(0, 0, s, s);
  c.save();
  if (type === 'stem') { c.scale(s / 3.2, s / 3.6); c.translate(0.1, 0.5); drawStem(c, 0, 0, 2, 0); }
  else { c.scale(s / 2.2, s / 2.2); c.translate(0.1, 0.05); PLANT_ART[type](c, 0, 0, 2, 0, 0, 3); }
  c.restore();
}
