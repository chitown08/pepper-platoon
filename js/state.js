// Player progress: garden layout, resources, army. Saved to this device's browser storage.

import { GARDEN, STEM_LEVELS, PLANTS, TROOPS } from './config.js';

const SAVE_KEY = 'pepper-platoon-save-v2';
let nextId = 1;

export function newPlayer() {
  const now = Date.now();
  return {
    version: 1,
    sun: 400,
    water: 300,
    seeds: 0,
    hiveLevel: 1,
    army: { jalapeno: 8, habanero: 2, bell: 0 },
    stem: { x: 6, y: 8, level: 1 },
    plants: [
      { id: nextId++, type: 'leaf', x: 3, y: 6, level: 1, since: now - 60000 },
      { id: nextId++, type: 'root', x: 10, y: 11, level: 1, since: now - 60000 },
      { id: nextId++, type: 'blossom', x: 3, y: 11, level: 1 },
    ],
    raids: 0,
    seenHelp: false,
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.version === 1) {
        nextId = Math.max(nextId, ...p.plants.map(q => q.id + 1));
        return p;
      }
    }
  } catch (e) { /* storage unavailable: start fresh */ }
  return newPlayer();
}

export function save(p) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); } catch (e) { /* ignore */ }
}

export function wipe() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}

// ---------- derived values ----------

export const stemInfo = (p) => STEM_LEVELS[p.stem.level];
export const maxStemLevel = () => STEM_LEVELS.length - 1;
export const cap = (p) => stemInfo(p).cap;

// The square of tilled soil you can build on, centred on the Stem.
export function buildArea(p) {
  const a = stemInfo(p).area;
  return { x: Math.floor((GARDEN.cols - a) / 2), y: Math.floor((GARDEN.rows - a) / 2), w: a, h: a };
}

export function countOf(p, type) { return p.plants.filter(q => q.type === type).length; }
export function limitOf(p, type) { return stemInfo(p).limits[type] || 0; }

export function housingCap(p) {
  return p.plants.filter(q => q.type === 'blossom').reduce((a, q) => a + PLANTS.blossom.housing[q.level], 0);
}
export function housingUsed(p) {
  return Object.entries(p.army).reduce((a, [k, n]) => a + n * TROOPS[k].housing, 0);
}

// How much a Leaf/Root has stored up right now.
export function stored(q, now = Date.now()) {
  const d = PLANTS[q.type];
  if (!d.makes) return 0;
  const mins = Math.max(0, now - q.since) / 60000;
  return Math.min(d.store[q.level], Math.floor(mins * d.rate[q.level]));
}

// ---------- actions (return an error string, or null on success) ----------

export function harvest(p, q) {
  const d = PLANTS[q.type];
  const amt = stored(q);
  if (amt <= 0) return { got: 0 };
  const room = cap(p)[d.makes] - p[d.makes];
  if (room <= 0) return { got: 0, full: true };
  const got = Math.min(amt, room);
  p[d.makes] += got;
  // keep any leftover (if storage was nearly full) by rewinding the clock proportionally
  const left = amt - got;
  q.since = Date.now() - (left / d.rate[q.level]) * 60000;
  return { got, resource: d.makes };
}

// The Stem stands 3 tiles wide but its leafy crown also needs the row above it.
const stemRect = (x, y) => ({ x, y: y - 1, w: 3, h: 4 });

// Can something of `size` go at x,y? Pass ignoreId = 'stem' when placing the Stem itself.
export function fits(p, x, y, size, ignoreId) {
  const r = ignoreId === 'stem' ? stemRect(x, y) : { x, y, w: size, h: size };
  const a = buildArea(p);
  if (r.x < a.x || r.y < a.y || r.x + r.w > a.x + a.w || r.y + r.h > a.y + a.h) return false;
  const overlaps = (o) => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y;
  if (ignoreId !== 'stem' && overlaps(stemRect(p.stem.x, p.stem.y))) return false;
  for (const q of p.plants) {
    if (q.id === ignoreId) continue;
    const s = PLANTS[q.type].size;
    if (overlaps({ x: q.x, y: q.y, w: s, h: s })) return false;
  }
  return true;
}

export function findSpot(p, size) {
  const a = buildArea(p);
  const c = a.x + a.w / 2;
  const spots = [];
  for (let y = a.y; y <= a.y + a.h - size; y++) for (let x = a.x; x <= a.x + a.w - size; x++) {
    if (fits(p, x, y, size)) spots.push({ x, y, d: Math.hypot(x + size / 2 - c, y + size / 2 - c) });
  }
  spots.sort((m, n) => m.d - n.d);
  return spots[0] || null;
}

export function canBuild(p, type) {
  const d = PLANTS[type];
  if (countOf(p, type) >= limitOf(p, type)) return 'Grow your Stem to unlock more';
  if (p.sun < d.cost[1]) return 'Not enough Sunlight';
  if (!findSpot(p, d.size)) return 'No room. Grow your Stem for more soil';
  return null;
}

export function build(p, type, x, y) {
  const d = PLANTS[type];
  const err = canBuild(p, type);
  if (err) return err;
  if (!fits(p, x, y, d.size)) return "Can't plant there";
  p.sun -= d.cost[1];
  const q = { id: nextId++, type, x, y, level: 1 };
  if (d.makes) q.since = Date.now();
  p.plants.push(q);
  return null;
}

export function upgradeCost(p, q) {
  if (q === 'stem') return STEM_LEVELS[p.stem.level + 1]?.cost ?? null;
  return PLANTS[q.type].cost[q.level + 1] ?? null;
}

export function canUpgrade(p, q) {
  const cost = upgradeCost(p, q);
  if (cost == null) return 'Max level';
  if (q !== 'stem' && q.level >= p.stem.level) return 'Grow your Stem first';
  if (p.sun < cost) return 'Not enough Sunlight';
  return null;
}

export function upgrade(p, q) {
  const err = canUpgrade(p, q);
  if (err) return err;
  p.sun -= upgradeCost(p, q);
  if (q === 'stem') { p.stem.level++; return null; }
  if (PLANTS[q.type].makes) harvestSilently(p, q);
  q.level++;
  return null;
}

function harvestSilently(p, q) {
  const r = harvest(p, q);
  if (!r.got) q.since = Date.now();
}

export function move(p, q, x, y) {
  const size = q === 'stem' ? 3 : PLANTS[q.type].size;
  if (!fits(p, x, y, size, q === 'stem' ? 'stem' : q.id)) return "Can't move there";
  const t = q === 'stem' ? p.stem : q;
  t.x = x; t.y = y;
  return null;
}

export function canTrain(p, type) {
  const t = TROOPS[type];
  if (housingUsed(p) + t.housing > housingCap(p)) return 'Blossoms are full';
  if (p.water < t.cost) return 'Not enough Water';
  return null;
}

export function train(p, type) {
  const err = canTrain(p, type);
  if (err) return err;
  p.water -= TROOPS[type].cost;
  p.army[type] = (p.army[type] || 0) + 1;
  return null;
}

export function addLoot(p, loot, seeds) {
  const c = cap(p);
  const sun = Math.min(loot.sun, Math.max(0, c.sun - p.sun));
  const water = Math.min(loot.water, Math.max(0, c.water - p.water));
  p.sun += sun;
  p.water += water;
  p.seeds += seeds;
  return { sun, water, lostSun: loot.sun - sun, lostWater: loot.water - water };
}
