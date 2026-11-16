// Simulates bug counter-attacks on sample gardens. Run: node tools/defense.js
import { Raid } from '../js/game.js';
import { BUGS } from '../js/config.js';
import * as S from '../js/state.js';

function garden(stemLevel, conquered, extras) {
  const p = S.newPlayer();
  p.stem.level = stemLevel;
  p.map.conquered = [...Array(conquered).keys()];
  let id = 1000;
  for (const [type, x, y, level = 1] of extras) p.plants.push({ id: id++, type, x, y, level });
  return p;
}
const ring = (x0, y0, x1, y1) => {
  const out = [];
  for (let x = x0; x <= x1; x++) out.push(['hedge', x, y0], ['hedge', x, y1]);
  for (let y = y0 + 1; y < y1; y++) out.push(['hedge', x0, y], ['hedge', x1, y]);
  return out;
};

const ok = (p) => { // drop extras that overlap something already planted
  const keep = [];
  for (const q of p.plants.splice(3)) { const sz = q.type === 'hedge' || q.type === 'spore' ? 1 : 2; if (S.fits(p, q.x, q.y, sz)) { p.plants.push(q); } }
  return p;
};
const cases = {
  'Stem 1, 1 hive, no defenses': garden(1, 1, []),
  'Stem 1, 1 hive, 1 thorn + 2 spores': ok(garden(1, 1, [['thorn', 10, 7], ['spore', 7, 6], ['spore', 7, 12]])),
  'Stem 1, 1 hive, thorn + spores + 12 hedges': ok(garden(1, 1, [['thorn', 10, 7], ['spore', 7, 6], ['spore', 7, 12], ...ring(5, 7, 9, 11).slice(0, 12)])),
  'Stem 2, 3 hives, no defenses': garden(2, 3, []),
  'Stem 2, 3 hives, 2 thorn L2 + sap + spores + hedges': ok(garden(2, 3, [['thorn', 10, 7, 2], ['thorn', 3, 13, 2], ['sap', 10, 13], ['spore', 7, 6], ['spore', 7, 12], ['spore', 2, 8], ...ring(5, 7, 9, 11)])),
  'Stem 3, 5 hives, 3 thorn L3 + 2 sap L2 + spores + hedges': ok(garden(3, 5, [['thorn', 10, 7, 3], ['thorn', 3, 13, 3], ['thorn', 10, 3, 3], ['sap', 10, 13, 2], ['sap', 2, 3, 2], ['spore', 7, 6], ['spore', 7, 12], ['spore', 2, 8], ['spore', 12, 9], ...ring(5, 7, 9, 11)])),
};

for (const [name, p] of Object.entries(cases)) {
  let wins = 0, dmg = 0; const N = 20;
  for (let r = 0; r < N; r++) {
    const sw = S.swarmPlan(p);
    const g = new Raid({ mode: 'defense', unitDefs: BUGS, core: 'stem', layout: S.defenseLayout(p), spawnPlan: sw.plan, bugStrength: sw.strength });
    let t = 0;
    while (g.phase !== 'over' && t < 200) { g.update(1 / 60); t += 1 / 60; }
    if (g.won) wins++;
    dmg += g.destruction;
  }
  console.log(`${name.padEnd(58)} threat ${S.threatLevel(p)}  ${S.swarmSummary(p).padEnd(40)} defended ${(wins / N * 100).toFixed(0).padStart(3)}%  garden damaged ${(dmg / N * 100).toFixed(0)}%`);
}
