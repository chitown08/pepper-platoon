// Pepper Platoon — game balance & level data.
// Tweak numbers here to rebalance without touching game logic.

export const COLS = 15;
export const ROWS = 21;
export const DEPLOY_ROWS = 3;      // bottom rows = picnic blanket drop zone
export const RAID_TIME = 150;      // seconds

export const UNITS = {
  jalapeno: {
    name: 'Jalapeño', role: 'Infantry',
    hp: 95, dmg: 16, atkInterval: 0.8, range: 0.6, speed: 1.7,
    radius: 0.22, perDeploy: 3, army: 18, targeting: 'any',
  },
  bell: {
    name: 'Bell Pepper', role: 'Tank',
    hp: 800, dmg: 0, atkInterval: 1, range: 0.6, speed: 0.9,
    radius: 0.36, perDeploy: 1, army: 3, targeting: 'defense', taunt: 3.2,
  },
  habanero: {
    name: 'Habanero', role: 'Grenadier',
    hp: 70, dmg: 44, splash: 1.0, atkInterval: 2.0, range: 3.6, speed: 1.3,
    radius: 0.24, perDeploy: 1, army: 7, targeting: 'any', ranged: true,
  },
};

export const BUILDINGS = {
  compost: { name: 'Compost Bin', size: 3, hp: 4000, loot: { sun: 1000, water: 1000 } },
  thorn:   { name: 'Thorn Shooter', size: 2, hp: 900, attack: 'thorn', range: 5.5, dmg: 28, interval: 0.45 },
  sap:     { name: 'Sap Sprayer', size: 2, hp: 800, attack: 'sap', range: 4.5, dmg: 40, interval: 2.0, splash: 1.3, slow: 3 },
  aphid:   { name: 'Aphid Farm', size: 2, hp: 750, loot: { sun: 1500, water: 0 } },
  dew:     { name: 'Dew Drop Tank', size: 2, hp: 750, loot: { sun: 0, water: 1200 } },
  nursery: { name: 'Larva Nursery', size: 2, hp: 600, loot: { sun: 300, water: 300 } },
  wall:    { name: 'Twig & Pebble Wall', size: 1, hp: 700 },
};

export const TRAP = { name: 'Spicy Spore', trigger: 0.9, radius: 1.8, dmg: 200, fuse: 0.35 };

export const HEAT = { start: 20, max: 100, perSecond: 1.6, perBuilding: 10, perWall: 3 };

export const SPELL = {
  name: 'Hot Sauce Strike', cost: 50, radius: 2.0, dmg: 350, wallMult: 3, delay: 0.7,
};

export const WALL_PATH_COST = 10;  // how strongly units prefer walking around walls

// The AI Bug Hive layout. x,y = top-left tile.
const ring = [];
for (let i = 4; i <= 10; i++) {
  ring.push([i, 4], [i, 10]);
  if (i > 4 && i < 10) ring.push([4, i], [10, i]);
}

export const LAYOUT = {
  buildings: [
    { type: 'compost', x: 6, y: 6 },
    { type: 'aphid', x: 1, y: 1 },
    { type: 'sap', x: 6, y: 1 },
    { type: 'aphid', x: 12, y: 1 },
    { type: 'nursery', x: 1, y: 4 },
    { type: 'nursery', x: 12, y: 4 },
    { type: 'thorn', x: 2, y: 7 },
    { type: 'thorn', x: 11, y: 7 },
    { type: 'thorn', x: 6, y: 12 },
    { type: 'sap', x: 10, y: 12 },
    { type: 'dew', x: 1, y: 14 },
    { type: 'dew', x: 12, y: 14 },
  ],
  walls: ring,
  traps: [[7, 16], [3, 12], [11, 11], [8, 2]],
};

// ---------- Bug Hive difficulty by level ----------
// level 0 = the original full-strength test hive (used by tools/sim.js)
export const HIVE = {
  // multiplies HP & damage; tuned so hive N is beatable with roughly 20*N housing of troops
  strength: (lvl) => (!lvl ? 1 : lvl <= 6 ? [0, 0.55, 0.75, 0.92, 1.12, 1.4, 1.7][lvl] : 1.7 + 0.3 * (lvl - 6)),
  loot: (lvl) => (lvl ? 0.3 + 0.12 * (lvl - 1) : 1),        // multiplies loot
};

// ---------- The Garden (home base) ----------

export const GARDEN = { cols: 15, rows: 19 };

// Housing space each troop takes up in your Blossoms, and its Water cost to grow.
export const TROOPS = {
  jalapeno: { housing: 1, cost: 20 },
  habanero: { housing: 2, cost: 50 },
  bell:     { housing: 4, cost: 120 },
};

// Stem (HQ) levels. Upgrading grows the buildable plot and raises limits.
// cost = Sunlight to reach that level.
export const STEM_LEVELS = [
  null,
  { cost: 0,     area: 9,  cap: { sun: 3000,  water: 3000 },  limits: { leaf: 2, root: 2, blossom: 1, lab: 1 } },
  { cost: 2000,  area: 11, cap: { sun: 8000,  water: 8000 },  limits: { leaf: 3, root: 3, blossom: 2, lab: 1 } },
  { cost: 6000,  area: 13, cap: { sun: 20000, water: 20000 }, limits: { leaf: 4, root: 4, blossom: 3, lab: 1 } },
  { cost: 15000, area: 15, cap: { sun: 45000, water: 45000 }, limits: { leaf: 5, root: 5, blossom: 4, lab: 1 } },
];

// Garden structures. Arrays are indexed by level (index 0 unused).
// cost = Sunlight to build (level 1) or upgrade to that level.
export const PLANTS = {
  leaf: {
    name: 'Leaf', size: 2, blurb: 'Soaks up Sunlight. Tap it to harvest.',
    makes: 'sun', cost: [0, 100, 500, 1500, 4000],
    rate: [0, 20, 35, 55, 80],          // per minute
    store: [0, 200, 450, 900, 1600],
  },
  root: {
    name: 'Root', size: 2, blurb: 'Draws Water from the soil. Tap it to harvest.',
    makes: 'water', cost: [0, 100, 500, 1500, 4000],
    rate: [0, 20, 35, 55, 80],
    store: [0, 200, 450, 900, 1600],
  },
  blossom: {
    name: 'Blossom', size: 2, blurb: 'Houses your platoon. More Blossoms, bigger army.',
    cost: [0, 300, 1200, 3500, 8000],
    housing: [0, 20, 30, 40, 50],
  },
  lab: {
    name: 'Flavor Lab', size: 2, blurb: 'Brew flavors that change how your troops fight.',
    cost: [0, 400],
  },
};

// ---------- Flavor Lab ----------
// Unlock a flavor once with Spice Seeds, then infuse a troop type with it for Water.
// Each troop type carries one flavor at a time.
export const INFUSE_COST = 200; // Water

export const FLAVORS = {
  tomato:   { name: 'Tomato',   icon: '🍅', color: '#e8352a', seeds: 2, best: 'Bell Pepper',
              text: 'Juicy Burst: when it falls, it splats into salsa that heals nearby peppers.' },
  garlic:   { name: 'Garlic',   icon: '🧄', color: '#d9d2b8', seeds: 2, best: 'Jalapeño',
              text: 'Lingering Stink: hits leave a poison that keeps damaging the building.' },
  lime:     { name: 'Lime',     icon: '🍋', color: '#b8e03a', seeds: 3, best: 'Habanero',
              text: 'Acidic Tang: double damage to walls and turrets.' },
  salt:     { name: 'Salt',     icon: '🧂', color: '#f4f4f4', seeds: 3, best: 'Jalapeño',
              text: 'Salt in the Wound: hits harder the more damaged the target is.' },
  cilantro: { name: 'Cilantro', icon: '🌿', color: '#4fd16b', seeds: 3, best: 'Habanero',
              text: 'Soapy Reflexes: 25% chance to dodge thorns and sap.' },
  mango:    { name: 'Mango',    icon: '🥭', color: '#ffb02e', seeds: 3, best: 'Jalapeño',
              text: 'Sugar Rush Crash: hit turrets fire 40% slower for 4 seconds.' },
  onion:    { name: 'Onion',    icon: '🧅', color: '#c58ad6', seeds: 4, best: 'Habanero',
              text: 'Tear Gas: hit turrets miss half their shots for 3 seconds.' },
  smoked:   { name: 'Chipotle', icon: '🔥', color: '#8b4a2b', seeds: 4, best: 'Bell Pepper',
              text: 'Smoked & Cured: +35% health, ignores sap slow, half damage from Spicy Spores.' },
};
