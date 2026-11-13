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
