// Checks the difficulty curve: each Bug Hive level vs. the army a player likely has by then.
// Run: node tools/progression.js
import { Raid } from '../js/game.js';
import { ROWS, TROOPS } from '../js/config.js';

function armyFor(housing) {
  const bell = Math.floor(housing / 20);
  const habanero = Math.floor((housing * 0.3) / TROOPS.habanero.housing);
  const jalapeno = housing - bell * TROOPS.bell.housing - habanero * TROOPS.habanero.housing;
  return { jalapeno, habanero, bell };
}

// Sensible play: tanks on the flanks, troops spread in waves, strikes on the nearest turret.
function smart(g, t) {
  if (t === 0) for (let i = 0; g.army.bell > 0; i++) g.deploy('bell', i % 2 ? 11 : 4, ROWS - 2.5);
  if (Math.abs(t - 2.5) < 0.01) for (let i = 0; g.army.jalapeno > 0; i++) g.deploy('jalapeno', 2 + (i * 3.7) % 11, ROWS - 1.2);
  if (Math.abs(t - 4) < 0.01) for (let i = 0; g.army.habanero > 0; i++) g.deploy('habanero', 2 + (i * 4.3) % 11, ROWS - 0.5);
  if (g.heat >= 50) {
    const d = g.buildings.filter(b => b.alive && b.def.attack).sort((a, b) => b.cy - a.cy)[0];
    const c = g.buildings.find(b => b.type === 'compost');
    const tgt = d || (c.alive ? c : null);
    if (tgt) g.castSpell(tgt.cx, tgt.cy);
  }
}

const stages = [[1, 20], [1, 30], [2, 30], [2, 40], [3, 50], [3, 60], [4, 70], [4, 80], [5, 100], [6, 120]];
for (const [level, housing] of stages) {
  const army = armyFor(housing);
  const res = [];
  for (let r = 0; r < 20; r++) {
    const g = new Raid({ level, army });
    let t = 0;
    while (g.phase !== 'over' && t < 200) { smart(g, Math.round(t * 100) / 100); g.update(1 / 60); t += 1 / 60; }
    res.push(g);
  }
  const avgStars = res.reduce((a, g) => a + g.stars.filter(Boolean).length, 0) / res.length;
  const binRate = res.filter(g => g.stars[1]).length / res.length;
  const loot = res.reduce((a, g) => a + g.loot.sun, 0) / res.length;
  console.log(`hive L${level} vs ${String(housing).padStart(3)} housing ${JSON.stringify(army).padEnd(40)} avg stars ${avgStars.toFixed(2)}  bin destroyed ${(binRate * 100).toFixed(0).padStart(3)}%  avg sun loot ${loot.toFixed(0)}`);
}
