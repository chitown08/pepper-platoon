// Player progress: garden layout, resources, army. Saved to this device's browser storage.

import { GARDEN, STEM_LEVELS, PLANTS, TROOPS, FLAVORS, INFUSE_COST, MAP_NODES, LAYOUTS, BUILDINGS, HIVE, REPEAT_LOOT, parseLayout, DIG, DEFENSE, BUGS, ROWS as RAID_ROWS, COLS as RAID_COLS, UNITS, GREENHOUSE } from './config.js';

const SAVE_KEY = 'pepper-platoon-save-v2';
let nextId = 1;

export function newPlayer() {
  const now = Date.now();
  return {
    version: 1,
    sun: 400,
    water: 300,
    seeds: 0,
    army: { jalapeno: 8, habanero: 2, bell: 0 },
    stem: { x: 6, y: 8, level: 1 },
    plants: [
      { id: nextId++, type: 'leaf', x: 3, y: 6, level: 1, since: now - 60000 },
      { id: nextId++, type: 'root', x: 10, y: 11, level: 1, since: now - 60000 },
      { id: nextId++, type: 'blossom', x: 3, y: 11, level: 1 },
    ],
    raids: 0,
    seenHelp: false,
    flavors: { unlocked: [], infused: {} },
    map: { conquered: [], best: {} },
    roulette: { lastDay: null },
    boosts: {},
    defense: { next: null, shieldUntil: 0, wins: 0, losses: 0 },
    strains: [],
  };
}

// The current player's boosts, so stored() can see Photosynthesis Overdrive.
let boostRef = {};

export function load() {
  const p = loadRaw();
  boostRef = p.boosts;
  return p;
}

function loadRaw() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.version === 1) {
        p.flavors = p.flavors || { unlocked: [], infused: {} };
        p.roulette = p.roulette || { lastDay: null };
        p.defense = p.defense || { next: null, shieldUntil: 0, wins: 0, losses: 0 };
        p.strains = p.strains || [];
        if (p.defense.next == null && p.map && p.map.conquered.length) p.defense.next = Date.now();
        p.boosts = p.boosts || {};
        if (!p.map) {
          // older saves tracked a single hive level
          p.map = { conquered: [], best: {} };
          for (let i = 0; i < Math.min((p.hiveLevel || 1) - 1, MAP_NODES.length); i++) p.map.conquered.push(i);
        }
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
  return Object.entries(p.army).reduce((a, [k, n]) => a + n * (troopInfo(p, k)?.housing || 0), 0);
}

// How much a Leaf/Root has stored up right now.
export function stored(q, now = Date.now()) {
  const d = PLANTS[q.type];
  if (!d.makes) return 0;
  let mins = Math.max(0, now - q.since) / 60000;
  const b = boostRef.sun;
  if (q.type === 'leaf' && b) {
    // Photosynthesis Overdrive: time inside the boost window counts double
    const from = Math.max(q.since, b.from), to = Math.min(now, b.until);
    if (to > from) mins += (to - from) / 60000;
  }
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
  const t = troopInfo(p, type);
  if (!t) return 'Unknown troop';
  if (t.stem && p.stem.level < t.stem) return `Grow your Stem to level ${t.stem} first`;
  if (t.max && (p.army[type] || 0) >= t.max) return `You can only hold ${t.max}`;
  if (housingUsed(p) + t.housing > housingCap(p)) return 'Blossoms are full';
  if (p.water < t.cost) return 'Not enough Water';
  if (t.seeds && p.seeds < t.seeds) return 'Not enough Spice Seeds';
  return null;
}

export function train(p, type) {
  const err = canTrain(p, type);
  if (err) return err;
  const t = troopInfo(p, type);
  p.water -= t.cost;
  p.seeds -= t.seeds || 0;
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

// ---------- Flavor Lab ----------

export const hasLab = (p) => p.plants.some(q => q.type === 'lab');

export function canUnlockFlavor(p, f) {
  if (p.flavors.unlocked.includes(f)) return 'Already unlocked';
  if (FLAVORS[f].rare) return 'Only found deep in Root Roulette';
  if (p.seeds < FLAVORS[f].seeds) return 'Not enough Spice Seeds. Earn them with raid stars';
  return null;
}

export function unlockFlavor(p, f) {
  const err = canUnlockFlavor(p, f);
  if (err) return err;
  p.seeds -= FLAVORS[f].seeds;
  p.flavors.unlocked.push(f);
  return null;
}

// Infuse a troop type with a flavor, or pass the flavor it already has to remove it.
export function infuse(p, troop, f) {
  if (p.flavors.infused[troop] === f) { delete p.flavors.infused[troop]; return null; }
  if (!p.flavors.unlocked.includes(f)) return 'Unlock this flavor first';
  if (p.water < INFUSE_COST) return 'Not enough Water';
  p.water -= INFUSE_COST;
  p.flavors.infused[troop] = f;
  return null;
}

// ---------- Garden Map ----------

// 'conquered' (Compost Bin destroyed at least once), 'open' (next to attack), or 'fog'
export function nodeStatus(p, i) {
  if (p.map.conquered.includes(i)) return 'conquered';
  if (i === 0 || p.map.conquered.includes(i - 1)) return 'open';
  return 'fog';
}

export function nodeLevel(i) { return i + 1; }

export function nodeLayout(i) {
  const n = MAP_NODES[i];
  return parseLayout(LAYOUTS[n.layout], n.mirror);
}

export function nodeLootScale(p, i) { return nodeStatus(p, i) === 'conquered' ? REPEAT_LOOT : 1; }

// Total loot on offer if every building is destroyed.
export function nodeLoot(p, i) {
  const mult = HIVE.loot(nodeLevel(i)) * nodeLootScale(p, i);
  const out = { sun: 0, water: 0 };
  for (const b of nodeLayout(i).buildings) {
    const l = BUILDINGS[b.type].loot;
    if (l) { out.sun += Math.round(l.sun * mult); out.water += Math.round(l.water * mult); }
  }
  return out;
}

// Records a finished raid. Returns the index of a newly revealed hive, if any.
export function recordRaid(p, i, stars) {
  const n = stars.filter(Boolean).length;
  p.map.best[i] = Math.max(p.map.best[i] || 0, n);
  if (stars[1] && !p.map.conquered.includes(i)) {
    p.map.conquered.push(i);
    // the bugs strike back after your first conquest
    if (p.defense.next == null) p.defense.next = Date.now();
    if (i + 1 < MAP_NODES.length) return i + 1;
  }
  return null;
}

export const conqueredCount = (p) => p.map.conquered.length;

// ---------- Root Roulette ----------

export const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time

export const digReady = (p) => p.roulette.lastDay !== today();

export function canDig(p) {
  if (!digReady(p)) return 'The roots need rest. Come back tomorrow!';
  if (p.water < DIG.fee) return `Not enough Water (need ${DIG.fee})`;
  return null;
}

export function startDig(p) {
  const err = canDig(p);
  if (err) return err;
  p.water -= DIG.fee;
  p.roulette.lastDay = today();
  return null;
}

export function sunBoost(p, now = Date.now()) {
  const b = p.boosts.sun;
  return b && b.until > now ? b : null;
}

// Pays out the pockets tapped in a dig. Returns a list of { icon, text } lines.
export function payDig(p, rewards) {
  const lines = [];
  const c = cap(p);
  for (const r of rewards) {
    if (r.water) {
      const got = Math.min(r.water, Math.max(0, c.water - p.water));
      p.water += got;
      lines.push({ icon: '💧', text: `${got.toLocaleString()} Water${got < r.water ? ' (storage full)' : ''}` });
    }
    if (r.seeds) { p.seeds += r.seeds; lines.push({ icon: '🌱', text: `${r.seeds} Spice Seeds` }); }
    if (r.boost) {
      const now = Date.now();
      const cur = sunBoost(p, now);
      p.boosts.sun = { from: cur ? cur.from : now, until: (cur ? cur.until : now) + DIG.boostHours * 3600000 };
      boostRef = p.boosts;
      lines.push({ icon: '☀️', text: `Photosynthesis Overdrive: Leaves make double Sunlight for ${DIG.boostHours} hours` });
    }
    if (r.flavor) {
      if (!p.flavors.unlocked.includes(r.flavor)) {
        p.flavors.unlocked.push(r.flavor);
        lines.push({ icon: FLAVORS[r.flavor].icon, text: `${FLAVORS[r.flavor].name} unlocked in the Flavor Lab!` });
      } else {
        p.seeds += 4;
        lines.push({ icon: '🌱', text: `4 Spice Seeds (you already had ${FLAVORS[r.flavor].name})` });
      }
    }
  }
  return lines;
}

// ---------- Bug counter-attacks ----------

export const threatLevel = (p) => 1 + p.map.conquered.length;

export function attackDue(p, now = Date.now()) {
  return p.defense.next != null && now >= p.defense.next && now >= p.defense.shieldUntil;
}

// Your garden as a battlefield for the raid engine.
export function defenseLayout(p) {
  const out = { buildings: [{ type: 'stem', x: p.stem.x, y: p.stem.y, level: p.stem.level }], walls: [], traps: [] };
  for (const q of p.plants) {
    if (q.type === 'hedge') out.walls.push([q.x, q.y, 'hedge']);
    else if (q.type === 'spore') out.traps.push([q.x, q.y]);
    else out.buildings.push({ type: q.type, x: q.x, y: q.y, level: q.level || 1 });
  }
  return out;
}

// When and where each bug turns up: waves from the top and bottom edges, outside your plot.
export function swarmPlan(p) {
  const w = threatLevel(p);
  const counts = DEFENSE.swarm(w);
  const bugs = [];
  for (const [type, n] of Object.entries(counts)) for (let i = 0; i < n; i++) bugs.push(type);
  bugs.sort(() => Math.random() - 0.5);
  const waves = DEFENSE.waves.length;
  const plan = [];
  bugs.forEach((type, i) => {
    const wave = i % waves;
    const top = (wave + (w % 2)) % 2 === 0;
    const cx = 2 + ((wave * 5 + 3) % 11);
    plan.push({
      t: DEFENSE.waves[wave] + Math.random() * 2.5,
      type,
      x: Math.max(0.5, Math.min(RAID_COLS - 0.5, cx + (Math.random() - 0.5) * 4)),
      y: top ? 0.4 + Math.random() * 0.8 : RAID_ROWS - 0.6 - Math.random() * 1.2,
    });
  });
  plan.sort((a, b) => a.t - b.t);
  const firstOfWave = new Set();
  for (const s of plan) { const k = DEFENSE.waves.findIndex(t => s.t < t + 2.5); if (!firstOfWave.has(k)) { firstOfWave.add(k); s.first = true; } }
  return { plan, strength: DEFENSE.bugStrength(w), level: w };
}

export function swarmSummary(p) {
  const c = DEFENSE.swarm(threatLevel(p));
  return Object.entries(c).filter(([, n]) => n).map(([k, n]) => `${n} ${BUGS[k].name}${n > 1 ? 's' : ''}`).join(', ');
}

// Applies the outcome. Returns { lines, note } for the results screen.
export function recordDefense(p, won) {
  const now = Date.now();
  const w = threatLevel(p);
  const hours = (a, b) => (a + Math.random() * (b - a)) * 3600000;
  const lines = [];
  if (won) {
    const b = DEFENSE.bounty(w);
    const room = Math.max(0, cap(p).sun - p.sun);
    const sun = Math.min(b.sun, room);
    p.sun += sun; p.seeds += b.seeds;
    p.defense.wins++;
    p.defense.next = now + hours(...DEFENSE.nextHours);
    lines.push({ icon: '☀️', text: `${sun.toLocaleString()} Sunlight bounty` }, { icon: '🌱', text: `${b.seeds} Spice Seed` });
  } else {
    const sun = Math.floor(p.sun * DEFENSE.lossShare), water = Math.floor(p.water * DEFENSE.lossShare);
    p.sun -= sun; p.water -= water;
    for (const q of p.plants) if (PLANTS[q.type].makes) q.since = now; // unharvested stores are eaten
    p.defense.losses++;
    p.defense.shieldUntil = now + DEFENSE.shieldHours * 3600000;
    p.defense.next = p.defense.shieldUntil + hours(1, 2);
    lines.push({ icon: '☀️', text: `−${sun.toLocaleString()} Sunlight stolen` }, { icon: '💧', text: `−${water.toLocaleString()} Water stolen` },
      { icon: '🥀', text: `Wilted: no attacks for ${DEFENSE.shieldHours} hours` });
  }
  return lines;
}

// ---------- Greenhouse hybrids ----------

const findStrain = (p, id) => p.strains.find(s => s.id === id);

// Housing & Water cost for any troop, base or hybrid.
export function troopInfo(p, type) {
  if (TROOPS[type]) return TROOPS[type];
  const s = findStrain(p, type);
  return s ? { housing: s.housing, cost: s.cost } : null;
}

// Fighting stats for hybrids, in the same shape as UNITS entries.
export function strainDef(s) {
  return {
    ...s.stats, name: s.name, role: s.dud ? 'Dud' : `Gen-${s.gen} hybrid`,
    perDeploy: 1, army: 0, hybrid: true, id: s.id, body: s.body, tint: s.tint, dud: s.dud || false,
  };
}

// Every troop def the raid engine needs: base species + your hybrids.
export function unitDefs(p) {
  const out = { ...UNITS };
  for (const s of p.strains) out[s.id] = strainDef(s);
  return out;
}

// Flavors baked into hybrids at breeding time.
export function strainFlavors(p) {
  const out = {};
  for (const s of p.strains) if (s.flavor) out[s.id] = s.flavor;
  return out;
}

// Parent options: base species you've unlocked, plus non-Dud hybrids.
export function breedParents(p) {
  const out = GREENHOUSE.breedable
    .filter(k => !TROOPS[k].stem || p.stem.level >= TROOPS[k].stem)
    .map(k => ({ key: k, name: UNITS[k].name, gen: 0 }));
  for (const s of p.strains) if (!s.dud) out.push({ key: s.id, name: s.name, gen: s.gen });
  return out;
}

function parentInfo(p, key) {
  if (UNITS[key]) {
    const d = UNITS[key];
    return {
      gen: 0, body: key, bodyName: GREENHOUSE.body[key], tag: GREENHOUSE.tag[key], tint: GREENHOUSE.tint[key],
      housing: TROOPS[key].housing, cost: TROOPS[key].cost,
      stats: { hp: d.hp, speed: d.speed, radius: d.radius, dmg: d.dmg, atkInterval: d.atkInterval, range: d.range,
        splash: d.splash, ranged: d.ranged, targeting: d.targeting, phase: d.phase, fadeIn: d.fadeIn, taunt: d.taunt },
    };
  }
  const s = findStrain(p, key);
  return s && !s.dud ? { gen: s.gen, body: s.body, bodyName: s.bodyName, tag: s.tag, tint: s.tint, housing: s.housing, cost: s.cost, stats: s.stats } : null;
}

export function breedQuote(p, a, b, flavor) {
  const A = parentInfo(p, a), B = parentInfo(p, b);
  if (!A || !B) return null;
  const g = Math.min(2, Math.max(A.gen, B.gen));
  const same = a === b;
  const chance = same ? 1 : Math.min(0.95, GREENHOUSE.chance[g] + (flavor ? GREENHOUSE.stabilizer : 0));
  const gen = Math.max(A.gen, B.gen) + 1;
  const roman = ['', '', ' II', ' III', ' IV', ' V', ' VI'][Math.min(gen, 6)];
  return {
    A, B, gen, chance, water: GREENHOUSE.water[g], seeds: GREENHOUSE.seeds[g],
    name: `${B.tag}-${A.bodyName}${roman}`,
    housing: Math.max(A.housing, B.housing),
    cost: Math.round(((A.cost + B.cost) / 2) * 1.25),
  };
}

export function canBreed(p, a, b, flavor) {
  const q = breedQuote(p, a, b, flavor);
  if (!q) return 'Pick two parents';
  if (p.strains.length >= GREENHOUSE.maxStrains) return `Your Greenhouse holds ${GREENHOUSE.maxStrains} strains. Compost one first`;
  if (flavor && !p.flavors.unlocked.includes(flavor)) return 'Unlock that flavor in the Lab first';
  if (p.water < q.water) return 'Not enough Water';
  if (p.seeds < q.seeds) return 'Not enough Spice Seeds';
  return null;
}

let strainSeq = 1;
const newStrainId = (p) => {
  let id;
  do { id = 's' + (Date.now().toString(36).slice(-4)) + (strainSeq++); } while (findStrain(p, id));
  return id;
};

// Cross-pollinate. Returns { strain } (strain.dud set if it failed) or { error }.
export function breed(p, a, b, flavor) {
  const err = canBreed(p, a, b, flavor);
  if (err) return { error: err };
  const q = breedQuote(p, a, b, flavor);
  p.water -= q.water;
  p.seeds -= q.seeds;
  const id = newStrainId(p);
  if (Math.random() > q.chance) {
    const kind = Math.random() < 0.5 ? 'wrinkle' : 'potato';
    const s = {
      id, name: GREENHOUSE.duds[kind].name, gen: q.gen, dud: kind, body: kind, bodyName: '', tag: '', tint: '#8a7a5a',
      housing: 1, cost: 5, flavor: null, parents: [a, b],
      stats: { hp: 1, speed: 0.3, radius: 0.24, dmg: 0, atkInterval: 1, range: 0.6, targeting: 'any' },
    };
    p.strains.push(s);
    return { strain: s };
  }
  const [lo, hi] = GREENHOUSE.wobble[Math.min(2, q.gen - 1)];
  const w = () => lo + Math.random() * (hi - lo);
  const r2 = (n) => Math.round(n * 100) / 100;
  const A = q.A.stats, B = q.B.stats;
  const stats = {
    hp: Math.round(A.hp * GREENHOUSE.hpMult * w()),
    speed: r2(A.speed * w()),
    radius: A.radius,
    dmg: Math.round(B.dmg * GREENHOUSE.dmgMult * w()),
    atkInterval: r2(B.atkInterval * (2 - w())),
    range: B.range, splash: B.splash, ranged: B.ranged, targeting: B.targeting,
    phase: B.phase, fadeIn: B.fadeIn, taunt: B.taunt,
  };
  const s = {
    id, name: q.name, gen: q.gen, dud: false, body: q.A.body, bodyName: q.A.bodyName, tag: q.B.tag, tint: q.B.tint,
    housing: q.housing, cost: q.cost, flavor: flavor || null, parents: [a, b], stats,
  };
  p.strains.push(s);
  return { strain: s };
}

export function compostStrain(p, id) {
  p.strains = p.strains.filter(s => s.id !== id);
  delete p.army[id];
}

// ----- seed codes: share a strain as text -----

export function seedCode(s) {
  const data = { n: s.name, g: s.gen, d: s.dud || 0, b: s.body, bn: s.bodyName, t: s.tag, c: s.tint, h: s.housing, w: s.cost, f: s.flavor || 0, s: s.stats };
  return 'PP1-' + btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/=+$/, '');
}

// Seed codes come from other people: keep names to plain letters, digits and simple punctuation.
const clean = (v, n) => String(v || '').replace(/[^\p{L}\p{N} \-'.]/gu, '').slice(0, n).trim();

export function plantSeedCode(p, code) {
  if (p.strains.length >= GREENHOUSE.maxStrains) return { error: 'Your Greenhouse is full' };
  try {
    const raw = String(code).trim();
    if (!raw.startsWith('PP1-')) throw new Error();
    const d = JSON.parse(decodeURIComponent(escape(atob(raw.slice(4)))));
    const num = (v, lo, hi, def) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def);
    const st = d.s || {};
    const stats = {
      hp: num(st.hp, 1, 1600, 100), speed: num(st.speed, 0.2, 2.6, 1), radius: num(st.radius, 0.15, 0.45, 0.25),
      dmg: num(st.dmg, 0, 160, 10), atkInterval: num(st.atkInterval, 0.4, 3, 1), range: num(st.range, 0.5, 5, 0.6),
      splash: st.splash ? num(st.splash, 0.5, 1.5, 1) : undefined, ranged: !!st.ranged,
      targeting: st.targeting === 'defense' ? 'defense' : 'any',
      phase: !!st.phase, fadeIn: st.phase ? num(st.fadeIn, 0, 3, 2.5) : undefined, taunt: st.taunt ? num(st.taunt, 1, 4, 3.2) : undefined,
    };
    const bodies = ['jalapeno', 'habanero', 'bell', 'ghost', 'wrinkle', 'potato'];
    const s = {
      id: newStrainId(p), name: clean(d.n, 24) || 'Mystery Pepper', gen: num(d.g, 1, 9, 1),
      dud: d.d === 'wrinkle' || d.d === 'potato' ? d.d : false,
      body: bodies.includes(d.b) ? d.b : 'jalapeno', bodyName: clean(d.bn, 12), tag: clean(d.t, 12),
      tint: /^#[0-9a-f]{6}$/i.test(d.c) ? d.c : '#3fa34d',
      housing: num(d.h, 1, 6, 2), cost: num(d.w, 5, 400, 60),
      flavor: FLAVORS[d.f] && !FLAVORS[d.f].rare ? d.f : null, parents: [], stats,
    };
    if (s.dud) Object.assign(s.stats, { hp: 1, dmg: 0, speed: 0.3 });
    p.strains.push(s);
    return { strain: s };
  } catch (e) {
    return { error: "That seed code didn't sprout. Check it was copied exactly." };
  }
}
