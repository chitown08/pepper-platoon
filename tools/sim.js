// Headless balance check: plays raids with a few canned strategies and prints results.
// Run: npm run sim
import { Raid } from '../js/game.js';
import { ROWS } from '../js/config.js';

const strategies = {
  'dump everything in one spot': (g, t) => {
    if (t === 0) for (const k of ['bell', 'jalapeno', 'habanero']) while (g.army[k] > 0) g.deploy(k, 7.5, ROWS - 1.5);
  },
  'spread everything': (g, t) => {
    if (t === 0) { let x = 1; for (const k of ['bell', 'jalapeno', 'habanero']) while (g.army[k] > 0) { g.deploy(k, x, ROWS - 1.5); x = (x + 2.3) % 14; } }
  },
  'tanks first, then rest + spells': (g, t) => {
    if (t === 0) while (g.army.bell > 0) g.deploy('bell', 7.5, ROWS - 2.5);
    if (Math.abs(t - 3) < 0.01) { for (const k of ['jalapeno', 'habanero']) while (g.army[k] > 0) g.deploy(k, 7.5 + Math.random() * 2 - 1, ROWS - 1.2); }
    if (g.heat >= 50) g.castSpell(7.5, 10);
  },
  'smart: tanks lead, spells on defenses': (g, t) => {
    if (t === 0) while (g.army.bell > 0) g.deploy('bell', 4 + g.army.bell, ROWS - 2.5);
    if (Math.abs(t - 2.5) < 0.01) while (g.army.jalapeno > 0) g.deploy('jalapeno', 4 + Math.random() * 7, ROWS - 1.2);
    if (Math.abs(t - 4) < 0.01) while (g.army.habanero > 0) g.deploy('habanero', 4 + Math.random() * 7, ROWS - 0.5);
    if (g.heat >= 50) {
      const d = g.buildings.filter(b => b.alive && b.def.attack).sort((a, b) => b.cy - a.cy)[0];
      const c = g.buildings.find(b => b.type === 'compost');
      const tgt = d || (c.alive ? c : null);
      if (tgt) g.castSpell(tgt.cx, tgt.cy);
    }
  },
};

for (const [name, fn] of Object.entries(strategies)) {
  const results = [];
  for (let run = 0; run < 20; run++) {
    const g = new Raid();
    let t = 0;
    const dt = 1 / 60;
    while (g.phase !== 'over' && t < 200) { fn(g, Math.round(t * 100) / 100); g.update(dt); t += dt; }
    results.push({ stars: g.stars.filter(Boolean).length, pct: g.destruction, time: 150 - g.time });
  }
  const avg = (f) => (results.reduce((a, r) => a + f(r), 0) / results.length);
  const dist = [0, 1, 2, 3].map(s => results.filter(r => r.stars === s).length);
  console.log(`${name.padEnd(34)} avg stars ${avg(r => r.stars).toFixed(2)}  avg destroyed ${(avg(r => r.pct) * 100).toFixed(0)}%  avg time ${avg(r => r.time).toFixed(0)}s  stars[0..3]=${dist.join('/')}`);
}
