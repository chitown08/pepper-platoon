// Raid simulation: units, defenses, projectiles, traps, Heat and scoring.

import {
  COLS, ROWS, DEPLOY_ROWS, RAID_TIME, UNITS, BUILDINGS, TRAP, HEAT, SPELL, LAYOUT, WALL_PATH_COST,
} from './config.js';
import { Grid, distToRect, findPath } from './grid.js';
import { sfx } from './audio.js';

const rand = (a, b) => a + Math.random() * (b - a);
let nextId = 1;

export class Raid {
  constructor() { this.reset(); }

  reset() {
    this.grid = new Grid(COLS, ROWS);
    this.buildings = [];
    this.traps = [];
    this.units = [];
    this.projectiles = [];
    this.particles = [];
    this.texts = [];
    this.effects = [];
    this.time = RAID_TIME;
    this.clock = 0;
    this.phase = 'scout';       // scout -> battle -> ending -> over
    this.heat = HEAT.start;
    this.shake = 0;
    this.endTimer = 0;
    this.pathsDirty = false;
    this.loot = { sun: 0, water: 0 };
    this.army = {};
    for (const k in UNITS) this.army[k] = UNITS[k].army;

    for (const b of LAYOUT.buildings) this.addBuilding(b.type, b.x, b.y);
    for (const [x, y] of LAYOUT.walls) this.addBuilding('wall', x, y);
    for (const [x, y] of LAYOUT.traps) this.traps.push({ x: x + 0.5, y: y + 0.5, state: 'hidden', timer: 0 });

    this.totalCount = this.buildings.filter(b => b.counts).length;
    this.destroyedCount = 0;
    this.stars = [false, false, false];
  }

  addBuilding(type, x, y) {
    const def = BUILDINGS[type];
    const b = {
      id: nextId++, type, def, x, y, w: def.size, h: def.size,
      cx: x + def.size / 2, cy: y + def.size / 2,
      hp: def.hp, maxHp: def.hp, alive: true, counts: type !== 'wall',
      cool: rand(0, 0.5), target: null, aim: -Math.PI / 2, hitT: 0, fireT: 0,
    };
    this.buildings.push(b);
    for (let dy = 0; dy < b.h; dy++) for (let dx = 0; dx < b.w; dx++) this.grid.set(x + dx, y + dy, b);
    return b;
  }

  // ---------- player actions ----------

  canDeployAt(x, y) {
    return x >= 0 && x < COLS && y >= ROWS - DEPLOY_ROWS && y < ROWS;
  }

  deploy(type, x, y) {
    if (this.phase !== 'scout' && this.phase !== 'battle') return false;
    const d = UNITS[type];
    if (!d || this.army[type] <= 0 || !this.canDeployAt(x, y)) return false;
    if (this.phase === 'scout') this.phase = 'battle';
    const n = Math.min(d.perDeploy, this.army[type]);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = n > 1 ? 0.3 : 0;
      this.spawnUnit(type, x + Math.cos(a) * r, Math.min(ROWS - 0.2, y + Math.sin(a) * r));
    }
    this.army[type] -= n;
    for (let i = 0; i < 8; i++) this.particle(x, y, rand(-2, 2), rand(-3, -1), 0.4, '#7a5a2e', 0.08);
    sfx('pop');
    return true;
  }

  castSpell(x, y) {
    if (this.phase !== 'battle' && this.phase !== 'scout') return false;
    if (this.heat < SPELL.cost) return false;
    if (this.phase === 'scout') this.phase = 'battle';
    this.heat -= SPELL.cost;
    this.effects.push({ kind: 'strike', x, y, t: 0, done: false });
    sfx('whistle');
    return true;
  }

  spawnUnit(type, x, y) {
    const d = UNITS[type];
    this.units.push({
      id: nextId++, type, d, x, y, hp: d.hp, maxHp: d.hp, alive: true,
      target: null, path: null, ignore: new Set(), cool: 0.3, slowT: 0, hitT: 0,
      face: 1, offx: rand(-0.18, 0.18), offy: rand(-0.18, 0.18), walk: rand(0, 6), atkAnim: 0,
    });
  }

  // ---------- helpers ----------

  get destruction() { return this.destroyedCount / this.totalCount; }

  particle(x, y, vx, vy, life, color, size, grav = 6) {
    this.particles.push({ x, y, vx, vy, life, max: life, color, size, grav });
  }

  floatText(x, y, text, color) {
    this.texts.push({ x, y, text, color, life: 1.1 });
  }

  // ---------- update ----------

  update(dt) {
    this.clock += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);

    if (this.phase === 'battle' || this.phase === 'ending') {
      if (this.phase === 'battle') {
        this.time = Math.max(0, this.time - dt);
        this.heat = Math.min(HEAT.max, this.heat + HEAT.perSecond * dt);
      }
      if (this.pathsDirty) {
        for (const u of this.units) u.path = null;
        this.pathsDirty = false;
      }
      for (const u of this.units) this.updateUnit(u, dt);
      for (const b of this.buildings) if (b.alive) this.updateBuilding(b, dt);
      for (const t of this.traps) this.updateTrap(t, dt);
      this.updateProjectiles(dt);
      this.updateEffects(dt);
      this.units = this.units.filter(u => u.alive);
      if (this.phase === 'battle') this.checkEnd();
      else {
        this.endTimer -= dt;
        if (this.endTimer <= 0) this.phase = 'over';
      }
    }

    for (const b of this.buildings) { b.hitT = Math.max(0, b.hitT - dt); b.fireT = Math.max(0, b.fireT - dt); }
    for (const p of this.particles) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt;
      p.vx *= 0.98;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const t of this.texts) { t.life -= dt; t.y -= 0.8 * dt; }
    this.texts = this.texts.filter(t => t.life > 0);
  }

  checkEnd() {
    const unitsLeft = this.units.length + Object.values(this.army).reduce((a, b) => a + b, 0);
    if (this.destroyedCount >= this.totalCount || this.time <= 0 || unitsLeft === 0) {
      this.phase = 'ending';
      this.endTimer = 1.6;
      this.won = this.stars.some(Boolean);
      sfx(this.won ? 'win' : 'lose');
    }
  }

  // ---------- units ----------

  pickTarget(u) {
    let best = null, bestD = Infinity;
    const pool = (filter) => {
      for (const b of this.buildings) {
        if (!b.alive || !b.counts || u.ignore.has(b.id) || !filter(b)) continue;
        const d = distToRect(u.x, u.y, b);
        if (d < bestD) { bestD = d; best = b; }
      }
    };
    if (u.d.targeting === 'defense') pool(b => !!b.def.attack);
    if (!best) pool(() => true);
    return best;
  }

  updateUnit(u, dt) {
    u.hitT = Math.max(0, u.hitT - dt);
    u.atkAnim = Math.max(0, u.atkAnim - dt);
    if (u.slowT > 0) u.slowT -= dt;
    const slowed = u.slowT > 0;

    if (!u.target || !u.target.alive) {
      u.target = this.pickTarget(u);
      u.path = null;
      if (!u.target) return;
    }
    const t = u.target;
    const dist = distToRect(u.x, u.y, t);
    const arrived = u.path && u.path.length === 0;
    if (dist <= u.d.range + 0.1 || (arrived && dist <= u.d.range + 0.7)) {
      this.unitAttack(u, t, dt, slowed);
      return;
    }

    if (!u.path) {
      u.path = findPath(this.grid, Math.floor(u.x), Math.floor(u.y), t, u.d.range, WALL_PATH_COST);
      if (u.path === null) { u.ignore.add(t.id); u.target = null; return; }
    }
    if (u.path.length === 0) { u.path = null; return; }

    const n = u.path[0];
    const occ = this.grid.get(n.x, n.y);
    if (occ && occ.alive && occ.type === 'wall') {
      if (distToRect(u.x, u.y, occ) <= Math.max(u.d.range, 0.55)) {
        this.unitAttack(u, occ, dt, slowed);
        return;
      }
    }

    const last = u.path.length === 1;
    const tx = n.x + 0.5 + (last ? u.offx : u.offx * 0.5);
    const ty = n.y + 0.5 + (last ? u.offy : u.offy * 0.5);
    const dx = tx - u.x, dy = ty - u.y;
    const d = Math.hypot(dx, dy);
    const step = u.d.speed * (slowed ? 0.5 : 1) * dt;
    if (Math.abs(dx) > 0.02) u.face = dx > 0 ? 1 : -1;
    u.walk += dt * 10;
    if (d <= step) { u.x = tx; u.y = ty; u.path.shift(); }
    else { u.x += (dx / d) * step; u.y += (dy / d) * step; }
  }

  unitAttack(u, b, dt, slowed) {
    if (Math.abs(b.cx - u.x) > 0.05) u.face = b.cx > u.x ? 1 : -1;
    u.cool -= dt;
    if (u.cool > 0) return;
    u.cool = u.d.atkInterval * (slowed ? 1.6 : 1);
    if (u.d.dmg <= 0) return;
    u.atkAnim = 0.18;
    if (u.d.ranged) {
      const tx = b.type === 'wall' ? b.cx : b.cx + rand(-0.3, 0.3);
      const ty = b.type === 'wall' ? b.cy : b.cy + rand(-0.3, 0.3);
      this.projectiles.push({ kind: 'seed', sx: u.x, sy: u.y - 0.3, tx, ty, t: 0, dur: 0.75, dmg: u.d.dmg, splash: u.d.splash });
      sfx('lob');
    } else {
      this.damageBuilding(b, u.d.dmg);
      for (let i = 0; i < 2; i++) this.particle(u.x + u.face * 0.25, u.y - 0.1, rand(-1.5, 1.5), rand(-2.5, -1), 0.3, '#c8a26a', 0.05);
      sfx('chomp');
    }
  }

  damageUnit(u, amt) {
    if (!u.alive) return;
    u.hp -= amt;
    u.hitT = 0.1;
    if (u.hp <= 0) {
      u.alive = false;
      const col = { jalapeno: '#3fa34d', bell: '#e23b2e', habanero: '#ff8a1c' }[u.type];
      for (let i = 0; i < 12; i++) this.particle(u.x, u.y - 0.2, rand(-3, 3), rand(-4, -0.5), rand(0.4, 0.8), col, rand(0.05, 0.12));
      for (let i = 0; i < 4; i++) this.particle(u.x, u.y - 0.2, rand(-2, 2), rand(-3, -1), 0.6, '#fff4c2', 0.05);
      sfx('squish');
    }
  }

  damageBuilding(b, amt) {
    if (!b.alive) return;
    b.hp -= amt;
    b.hitT = 0.1;
    if (b.hp <= 0) this.destroyBuilding(b);
  }

  destroyBuilding(b) {
    b.alive = false;
    b.hp = 0;
    const n = b.type === 'wall' ? 8 : 26;
    for (let i = 0; i < n; i++) {
      const col = ['#6b4a2b', '#8c6239', '#a9a9a9', '#5a7d2a'][i % 4];
      this.particle(b.cx + rand(-b.w / 3, b.w / 3), b.cy + rand(-b.h / 3, b.h / 3), rand(-4, 4), rand(-6, -1), rand(0.5, 1), col, rand(0.06, 0.16));
    }
    if (b.type === 'wall') {
      this.heat = Math.min(HEAT.max, this.heat + HEAT.perWall);
      this.pathsDirty = true;
      sfx('crunch');
      return;
    }
    this.destroyedCount++;
    this.heat = Math.min(HEAT.max, this.heat + HEAT.perBuilding);
    this.floatText(b.cx, b.y, `+${HEAT.perBuilding} Heat`, '#ff7a1a');
    if (b.def.loot) {
      this.loot.sun += b.def.loot.sun;
      this.loot.water += b.def.loot.water;
      if (b.def.loot.sun) this.floatText(b.cx - 0.6, b.cy, `+${b.def.loot.sun}☀️`, '#ffd23f');
      if (b.def.loot.water) this.floatText(b.cx + 0.6, b.cy + 0.3, `+${b.def.loot.water}💧`, '#7fd3ff');
    }
    this.shake = Math.max(this.shake, b.type === 'compost' ? 0.5 : 0.2);
    sfx('boom');

    const before = this.stars.filter(Boolean).length;
    if (this.destruction >= 0.5) this.stars[0] = true;
    if (b.type === 'compost') this.stars[1] = true;
    if (this.destroyedCount >= this.totalCount) this.stars[2] = true;
    if (this.stars.filter(Boolean).length > before) sfx('star');
  }

  // ---------- defenses ----------

  acquireTarget(b) {
    const r = b.def.range;
    if (b.def.attack === 'sap') {
      // Sap Sprayers ignore taunts and lob at the densest clump of peppers.
      let best = null, bestN = 0;
      for (const u of this.units) {
        if (!u.alive || Math.hypot(u.x - b.cx, u.y - b.cy) > r) continue;
        let n = 0;
        for (const v of this.units) if (Math.hypot(u.x - v.x, u.y - v.y) <= b.def.splash) n++;
        if (n > bestN) { bestN = n; best = u; }
      }
      return best;
    }
    let best = null, bestD = Infinity, taunted = false;
    for (const u of this.units) {
      if (!u.alive) continue;
      const d = Math.hypot(u.x - b.cx, u.y - b.cy);
      if (d > r) continue;
      const isTaunt = u.d.taunt && d <= u.d.taunt + b.w / 2;
      if (isTaunt && !taunted) { taunted = true; best = u; bestD = d; continue; }
      if (taunted && !isTaunt) continue;
      if (d < bestD) { best = u; bestD = d; }
    }
    return best;
  }

  updateBuilding(b, dt) {
    if (!b.def.attack) return;
    b.cool -= dt;
    let t = b.target;
    if (!t || !t.alive || Math.hypot(t.x - b.cx, t.y - b.cy) > b.def.range) t = b.target = null;
    if (b.cool <= 0 || !t) t = b.target = this.acquireTarget(b);
    if (!t) return;

    const want = Math.atan2(t.y - b.cy, t.x - b.cx);
    let diff = want - b.aim;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    b.aim += diff * Math.min(1, dt * 12);

    if (b.cool > 0) return;
    b.cool = b.def.interval;
    b.fireT = 0.1;
    const mx = b.cx + Math.cos(b.aim) * 0.7, my = b.cy - 0.35 + Math.sin(b.aim) * 0.7;
    if (b.def.attack === 'thorn') {
      this.projectiles.push({ kind: 'thorn', x: mx, y: my, target: t, lx: t.x, ly: t.y, speed: 12, dmg: b.def.dmg });
      sfx('thorn');
    } else if (b.def.attack === 'sap') {
      this.projectiles.push({ kind: 'sap', sx: mx, sy: my, tx: t.x, ty: t.y, t: 0, dur: 0.8, dmg: b.def.dmg, splash: b.def.splash, slow: b.def.slow });
      sfx('sap');
    }
  }

  updateTrap(t, dt) {
    if (t.state === 'hidden') {
      for (const u of this.units) {
        if (Math.hypot(u.x - t.x, u.y - t.y) <= TRAP.trigger) {
          t.state = 'armed'; t.timer = TRAP.fuse; sfx('click');
          break;
        }
      }
    } else if (t.state === 'armed') {
      t.timer -= dt;
      if (t.timer <= 0) {
        t.state = 'gone';
        for (const u of this.units) if (Math.hypot(u.x - t.x, u.y - t.y) <= TRAP.radius) this.damageUnit(u, TRAP.dmg);
        for (let i = 0; i < 30; i++) {
          const a = rand(0, Math.PI * 2), s = rand(1, 4);
          this.particle(t.x, t.y, Math.cos(a) * s, Math.sin(a) * s - 1, rand(0.5, 1.1), i % 2 ? '#ff9a2e' : '#e8452c', rand(0.1, 0.25), 0.5);
        }
        this.effects.push({ kind: 'ring', x: t.x, y: t.y, r: TRAP.radius, t: 0, dur: 0.5, color: '#ff8a1c' });
        this.floatText(t.x, t.y - 0.5, 'SPICY SPORE!', '#ffb347');
        this.shake = Math.max(this.shake, 0.25);
        sfx('spore');
      }
    }
  }

  // ---------- projectiles & effects ----------

  updateProjectiles(dt) {
    for (const p of this.projectiles) {
      if (p.kind === 'thorn') {
        if (p.target.alive) { p.lx = p.target.x; p.ly = p.target.y - 0.2; }
        const dx = p.lx - p.x, dy = p.ly - p.y, d = Math.hypot(dx, dy);
        p.ang = Math.atan2(dy, dx);
        const step = p.speed * dt;
        if (d <= step) {
          p.dead = true;
          if (p.target.alive) {
            this.damageUnit(p.target, p.dmg);
            this.particle(p.lx, p.ly, rand(-1, 1), rand(-2, 0), 0.25, '#e8f5c8', 0.05);
          }
        } else { p.x += (dx / d) * step; p.y += (dy / d) * step; }
      } else {
        p.t += dt;
        if (p.t >= p.dur) {
          p.dead = true;
          if (p.kind === 'sap') {
            for (const u of this.units) {
              if (Math.hypot(u.x - p.tx, u.y - p.ty) <= p.splash) { this.damageUnit(u, p.dmg); u.slowT = p.slow; }
            }
            for (let i = 0; i < 12; i++) this.particle(p.tx, p.ty, rand(-2.5, 2.5), rand(-3, -0.5), rand(0.4, 0.7), '#e0a526', rand(0.06, 0.13));
            this.effects.push({ kind: 'puddle', x: p.tx, y: p.ty, r: p.splash, t: 0, dur: 2.5 });
            sfx('splat');
          } else if (p.kind === 'seed') {
            for (const b of this.buildings) {
              if (b.alive && distToRect(p.tx, p.ty, b) <= p.splash) this.damageBuilding(b, p.dmg);
            }
            for (let i = 0; i < 14; i++) {
              const a = rand(0, Math.PI * 2), s = rand(1, 3.5);
              this.particle(p.tx, p.ty, Math.cos(a) * s, Math.sin(a) * s - 1.5, rand(0.3, 0.6), i % 3 ? '#ffb02e' : '#ff4b1f', rand(0.06, 0.14), 3);
            }
            this.effects.push({ kind: 'ring', x: p.tx, y: p.ty, r: p.splash, t: 0, dur: 0.3, color: '#ffb02e' });
            sfx('boom');
          }
        }
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }

  updateEffects(dt) {
    for (const e of this.effects) {
      e.t += dt;
      if (e.kind === 'strike' && !e.done && e.t >= SPELL.delay) {
        e.done = true;
        for (const b of this.buildings) {
          if (b.alive && distToRect(e.x, e.y, b) <= SPELL.radius) {
            this.damageBuilding(b, SPELL.dmg * (b.type === 'wall' ? SPELL.wallMult : 1));
          }
        }
        for (let i = 0; i < 50; i++) {
          const a = rand(0, Math.PI * 2), s = rand(1, 6);
          this.particle(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s - 2, rand(0.5, 1.2), ['#ff2a1a', '#ff7a1a', '#ffd23f', '#8b1a10'][i % 4], rand(0.08, 0.22), 4);
        }
        this.shake = 0.6;
        sfx('strike');
      }
    }
    this.effects = this.effects.filter(e =>
      e.kind === 'strike' ? e.t < SPELL.delay + 0.6 : e.t < e.dur);
  }
}
