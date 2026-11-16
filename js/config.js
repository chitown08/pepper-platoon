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
  ghost: {
    name: 'Ghost Pepper', role: 'Assassin',
    hp: 65, dmg: 48, atkInterval: 1.0, range: 0.6, speed: 1.9,
    radius: 0.22, perDeploy: 1, army: 0, targeting: 'defense',
    phase: true,         // walks through walls; turrets can't see it inside one
    fadeIn: 2.5,         // seconds unseen after being dropped
  },
  reaper: {
    name: 'Carolina Reaper', role: 'Hero',
    hp: 1300, dmg: 110, atkInterval: 0.9, range: 0.7, speed: 1.3,
    radius: 0.36, perDeploy: 1, army: 0, targeting: 'any',
    aura: 3.2,           // Capsaicin Frenzy radius: nearby peppers attack 40% faster, move 30% faster
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
  // your garden, when bugs attack it
  stem:    { name: 'The Stem', size: 3, hp: 4000 },
  greenhouse: { name: 'Greenhouse', size: 2, hp: 600 },
  leaf:    { name: 'Leaf', size: 2, hp: 400 },
  root:    { name: 'Root', size: 2, hp: 400 },
  blossom: { name: 'Blossom', size: 2, hp: 500 },
  lab:     { name: 'Flavor Lab', size: 2, hp: 500 },
};

export const TRAP = { name: 'Spicy Spore', trigger: 0.9, radius: 1.8, dmg: 200, fuse: 0.35 };

export const HEAT = { start: 20, max: 100, perSecond: 1.6, perBuilding: 10, perWall: 3 };

export const SPELL = {
  name: 'Hot Sauce Strike', cost: 50, radius: 2.0, dmg: 350, wallMult: 3, delay: 0.7,
};

export const WALL_PATH_COST = 10;  // how strongly units prefer walking around walls

// ---------- Bug Hive layouts ----------
// Each layout is 15 columns x 18 rows (the picnic blanket adds 3 more rows below).
//   C Compost Bin (3x3)   T Thorn Shooter (2x2)   S Sap Sprayer (2x2)
//   A Aphid Farm (2x2)    D Dew Drop Tank (2x2)   N Larva Nursery (2x2)
//   # wall                * Spicy Spore (hidden)  . empty
// Fill every tile a building covers with its letter.
export const LAYOUTS = {
  sandbox: [
    '...............',
    '.AA...SS....AA.',
    '.AA...SS*...AA.',
    '...............',
    '.NN.#######.NN.',
    '.NN.#.....#.NN.',
    '....#.CCC.#....',
    '..TT#.CCC.#TT..',
    '..TT#.CCC.#TT..',
    '....#.....#....',
    '....#######....',
    '...........*...',
    '...*..TT..SS...',
    '......TT..SS...',
    '.DD.........DD.',
    '.DD.........DD.',
    '.......*.......',
    '...............',
  ],
  hose: [
    '...............',
    '.AA.....SS..DD.',
    '.AA.....SS..DD.',
    '...............',
    '#########......',
    '#.......#..TT..',
    '#..CCC..#..TT..',
    '#..CCC..#......',
    '#..CCC..#...NN.',
    '#.......#...NN.',
    '###.#####......',
    '...*.......SS..',
    '.TT........SS..',
    '.TT....*.......',
    '.....NN....AA..',
    '.....NN....AA..',
    '..*.........*..',
    '...............',
  ],
  birdbath: [
    '...............',
    '.DD...CCC...DD.',
    '.DD...CCC...DD.',
    '.....#CCC#.....',
    '..TT.#...#.TT..',
    '..TT.##.##.TT..',
    '...............',
    '....#######....',
    '.NN....*....NN.',
    '.NN.SS...SS.NN.',
    '....SS...SS....',
    '...............',
    '.AA...TT...AA..',
    '.AA...TT...AA..',
    '...............',
    '....*.....*....',
    '...............',
    '...............',
  ],
  toolshed: [
    '...............',
    '..NN...AA...NN.',
    '..NN...AA...NN.',
    '...............',
    '.TT....SS....TT',
    '.TT....SS....TT',
    '...............',
    '.....*CCC*.....',
    '......CCC......',
    '.DD...CCC...DD.',
    '.DD.........DD.',
    '...............',
    '...TT.....TT...',
    '...TT..*..TT...',
    '...............',
    '......SS.......',
    '......SS.......',
    '...............',
  ],
  patio: [
    '.AA..NN.NN..AA.',
    '.AA..NN.NN..AA.',
    '...............',
    '.DD....SS....DD',
    '.DD....SS....DD',
    '...............',
    '..TT.......TT..',
    '..TT...*...TT..',
    '...............',
    '...#########...',
    '...#.......#...',
    '...#.#####.#...',
    'TT.#.#CCC#.#.TT',
    'TT.#.#CCC#.#.TT',
    '...#.#CCC#.#...',
    '...#.#####.#...',
    '.*.#.......#.*.',
    '...#########...',
  ],
  barbecue: [
    '...............',
    '.NN.SS...SS.NN.',
    '.NN.SS...SS.NN.',
    '...............',
    '######...######',
    '#....#...#....#',
    '#.TT.#.*.#CCC.#',
    '#.TT.#...#CCC.#',
    '#....#...#CCC.#',
    '#AA..#...#..DD#',
    '#AA..#...#..DD#',
    '###.##...######',
    '...............',
    '..TT...*...TT..',
    '..TT.......TT..',
    '...............',
    '....*.....*....',
    '...............',
  ],
};

const LETTERS = { C: 'compost', T: 'thorn', S: 'sap', A: 'aphid', D: 'dew', N: 'nursery' };

// Turns a text layout into { buildings, walls, traps }. mirror flips it left-to-right.
export function parseLayout(rows, mirror = false) {
  if (mirror) rows = rows.map(r => [...r].reverse().join(''));
  if (rows.length !== ROWS - DEPLOY_ROWS) throw new Error(`layout needs ${ROWS - DEPLOY_ROWS} rows`);
  const used = rows.map(r => {
    if (r.length !== COLS) throw new Error(`layout row "${r}" must be ${COLS} wide`);
    return new Array(COLS).fill(false);
  });
  const out = { buildings: [], walls: [], traps: [] };
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (used[y][x] || ch === '.') return;
    if (ch === '#') { out.walls.push([x, y]); return; }
    if (ch === '*') { out.traps.push([x, y]); return; }
    const type = LETTERS[ch];
    if (!type) throw new Error(`unknown layout letter "${ch}"`);
    const n = BUILDINGS[type].size;
    for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) {
      if (rows[y + dy]?.[x + dx] !== ch) throw new Error(`${type} at ${x},${y} needs a full ${n}x${n} block of "${ch}"`);
      used[y + dy][x + dx] = true;
    }
    out.buildings.push({ type, x, y });
  }));
  return out;
}

// The original test hive (used by tools/sim.js).
export const LAYOUT = parseLayout(LAYOUTS.sandbox);

// ---------- The Garden Map ----------
// Hives in the order you unlock them. x,y = position on the map screen (in map tiles, 15 x 19).
export const MAP_NODES = [
  { name: 'Sandbox',          layout: 'sandbox',  x: 3.5,  y: 15.2 },
  { name: 'Garden Hose',      layout: 'hose',     x: 10.5, y: 13.8 },
  { name: 'Birdbath',         layout: 'birdbath', x: 12,   y: 10 },
  { name: 'Tool Shed',        layout: 'toolshed', x: 7,    y: 9.2 },
  { name: 'Patio',            layout: 'patio',    x: 2.6,  y: 7 },
  { name: 'Barbecue',         layout: 'barbecue', x: 7.2,  y: 4.8 },
  { name: 'Doghouse',         layout: 'hose',     x: 12.4, y: 5.8, mirror: true },
  { name: 'Koi Pond',         layout: 'barbecue', x: 10.4, y: 1.8, mirror: true },
  { name: 'Greenhouse Ruins', layout: 'patio',    x: 4,    y: 2,   mirror: true },
];
export const REPEAT_LOOT = 0.5; // loot multiplier when re-raiding a conquered hive

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
// stem = Stem level needed to grow it; seeds = Spice Seeds also needed; max = most you can hold.
export const TROOPS = {
  jalapeno: { housing: 1, cost: 20 },
  habanero: { housing: 2, cost: 50 },
  bell:     { housing: 4, cost: 120 },
  ghost:    { housing: 3, cost: 90, stem: 2 },
  reaper:   { housing: 0, cost: 600, seeds: 3, stem: 3, max: 1 },
};

// Stem (HQ) levels. Upgrading grows the buildable plot and raises limits.
// cost = Sunlight to reach that level.
export const STEM_LEVELS = [
  null,
  { cost: 0,     area: 9,  cap: { sun: 3000,  water: 3000 },  limits: { leaf: 2, root: 2, blossom: 1, lab: 1, greenhouse: 0, thorn: 1, sap: 0, spore: 2, hedge: 12 } },
  { cost: 2000,  area: 11, cap: { sun: 8000,  water: 8000 },  limits: { leaf: 3, root: 3, blossom: 2, lab: 1, greenhouse: 1, thorn: 2, sap: 1, spore: 3, hedge: 20 } },
  { cost: 6000,  area: 13, cap: { sun: 20000, water: 20000 }, limits: { leaf: 4, root: 4, blossom: 3, lab: 1, greenhouse: 1, thorn: 3, sap: 2, spore: 4, hedge: 30 } },
  { cost: 15000, area: 15, cap: { sun: 45000, water: 45000 }, limits: { leaf: 5, root: 5, blossom: 4, lab: 1, greenhouse: 1, thorn: 4, sap: 2, spore: 5, hedge: 40 } },
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
  greenhouse: {
    name: 'Greenhouse', size: 2, blurb: 'Cross-breed peppers into brand-new hybrid troops.',
    cost: [0, 1500],
  },
  // ----- defenses -----
  thorn: {
    name: 'Thorn Shooter', size: 2, defense: true, blurb: 'Rapid-fire thorns at one bug at a time.',
    cost: [0, 300, 900, 2500, 6000],
  },
  sap: {
    name: 'Sap Sprayer', size: 2, defense: true, blurb: 'Lobs sticky sap that slows groups of bugs.',
    cost: [0, 500, 1500, 4000, 8000],
  },
  spore: {
    name: 'Spicy Spore', size: 1, defense: true, blurb: 'Hidden trap. Blows up on the first bug to step near.',
    cost: [0, 150],
  },
  hedge: {
    name: 'Bramble Hedge', size: 1, defense: true, blurb: 'Thorny wall segment. Tap or drag to plant a row.',
    cost: [0, 25],
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
  // Rare: only found at the bottom of Root Roulette
  truffle:  { name: 'Truffle',  icon: '🍄', color: '#7a5a3a', seeds: null, rare: true, best: 'Jalapeño',
              text: 'Earthy Fortune: buildings it finishes off drop 50% more loot.' },
  saffron:  { name: 'Saffron',  icon: '🌺', color: '#e8452c', seeds: null, rare: true, best: 'Habanero',
              text: 'Golden Threads: attacks 35% faster.' },
};

// ---------- Root Roulette (daily underground puzzle) ----------
export const DIG = {
  fee: 100,          // Water to start the day's Deep Tap
  time: 60,          // seconds of Sap Pressure before the root bursts
  cols: 7, rows: 9,
  bedrock: 0.18,     // share of spare tiles that are solid rock
  mycoBonus: 0.25,   // each glowing fungus tile in your root network adds this to rewards
  grubEvery: [7, 10],// seconds between Burrowing Grubs
  grubFuse: 2.5,     // seconds before a grub scrambles the roots around it
  boostHours: 4,     // Photosynthesis Overdrive length
};
// Nutrient pockets, shallow to deep. rows = depth band the pocket can appear in.
export const POCKETS = [
  { kind: 'aquifer', rows: [2, 3], name: 'Aquifer' },
  { kind: 'geode',   rows: [4, 5], name: 'Seed Geode' },
  { kind: 'deep',    rows: [5, 6], name: 'Deep Aquifer' },
  { kind: 'geyser',  rows: [6, 7], name: 'Fertilizer Geyser' },
  { kind: 'rare',    rows: [8, 8], name: 'Ancient Ingredient' },
];

// ---------- Bug counter-attacks on your garden ----------

// Bugs use the same fields as UNITS. armor = share of damage ignored. fly = goes over walls.
export const BUGS = {
  aphid:  { name: 'Aphid', role: 'Swarm', hp: 55, dmg: 9, atkInterval: 0.7, range: 0.6, speed: 1.9, radius: 0.18, targeting: 'any' },
  beetle: { name: 'Stag Beetle', role: 'Armored', hp: 650, dmg: 35, atkInterval: 1.2, range: 0.6, speed: 0.85, radius: 0.36, targeting: 'any', armor: 0.4 },
  wasp:   { name: 'Wasp', role: 'Flyer', hp: 80, dmg: 18, atkInterval: 0.8, range: 0.6, speed: 2.2, radius: 0.2, targeting: 'defense', fly: true },
};

export const DEFENSE = {
  time: 90,                                  // seconds the swarm has to fell your Stem
  hpByLevel: [0, 1, 1.3, 1.65, 2.0, 2.4],    // garden building HP multiplier by level
  dmgByLevel: [0, 1, 1.35, 1.75, 2.2, 2.6],  // Thorn Shooter / Sap Sprayer damage multiplier by level
  // swarm size and toughness from the threat level (1 + hives you've conquered)
  swarm: (w) => ({ aphid: 6 + 3 * w, beetle: Math.floor(w / 2), wasp: w >= 3 ? w - 1 : 0 }),
  bugStrength: (w) => 1 + 0.1 * (w - 1),
  waves: [0, 7, 14],                         // seconds when each wave arrives
  bounty: (w) => ({ sun: 150 * w, seeds: 1 }),
  lossShare: 0.25,                           // share of stored Sunlight & Water the bugs carry off
  shieldHours: 6,                            // "Wilted" protection after a loss
  nextHours: [2, 3],                         // hours until the next swarm after a defense
};

// ---------- The Greenhouse (cross-breeding) ----------
// Parent A (Body) gives health, speed and size. Parent B (Seed) gives attack, damage and targeting.
export const GREENHOUSE = {
  maxStrains: 6,
  breedable: ['jalapeno', 'habanero', 'bell', 'ghost'],     // base species you can use as parents
  tag:  { jalapeno: 'Snap', habanero: 'Boom', bell: 'Shield', ghost: 'Ghost' },  // name from the Seed parent
  body: { jalapeno: 'Jalapeño', habanero: 'Habanero', bell: 'Bell', ghost: 'Ghost' }, // name from the Body parent
  tint: { jalapeno: '#3fa34d', habanero: '#ff8a1c', bell: '#e23b2e', ghost: '#cfc4f0' },
  chance: [0.55, 0.4, 0.3],      // success chance by the older parent's generation (0 = base species)
  stabilizer: 0.35,              // added by mixing in an unlocked flavor
  water: [300, 600, 900],        // breeding cost by generation
  seeds: [1, 2, 3],
  hpMult: 0.8, dmgMult: 0.85,    // hybrids trade a little raw power for flexibility
  wobble: [[0.95, 1.05], [0.85, 1.2], [0.75, 1.3]], // random stat swing by generation
  duds: {
    wrinkle: { name: 'Wrinkle-Pepper', text: 'Sad, shriveled, harmless. Turrets stop to stare in pity.' },
    potato:  { name: 'Couch Potato', text: 'Deeply confused. Turrets stop to stare in pity.' },
  },
  pity: [0.5, 1.5],              // seconds turrets near a fresh Dud stop firing
  pityRange: 5,
};
