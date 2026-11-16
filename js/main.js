// Boots the game and switches between the Garden and Sauce Raids.

import * as S from './state.js';
import { createGarden } from './garden.js';
import { createRaidScene } from './raid-scene.js';
import { createMap } from './map.js';
import { createRoulette } from './roulette.js';
import { MAP_NODES } from './config.js';
import { unlockAudio, setMuted, isMuted } from './audio.js';

const $ = (s) => document.querySelector(s);
const app = $('#app');
const canvas = $('#game');
const stage = $('#stage');

const player = S.load();

// ---------- shared bits ----------

const tipEl = $('#tip');
let tipTimer = 0;
function showTip(text) {
  tipEl.textContent = text;
  tipEl.classList.add('show');
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => tipEl.classList.remove('show'), 1800);
}

for (const b of document.querySelectorAll('.mute')) {
  b.addEventListener('click', () => {
    setMuted(!isMuted());
    for (const m of document.querySelectorAll('.mute')) m.textContent = isMuted() ? '🔇' : '🔊';
  });
}

// ---------- scenes ----------

const garden = createGarden({ canvas, player, showTip, onRaid: () => go('map'), onDefend: () => go('raid', 'defense'), onDig: () => {
  if (S.startDig(player)) return;
  S.save(player);
  go('roulette');
} });
const roulette = createRoulette({ canvas, player, showTip, onExit: () => go('garden') });
const map = createMap({ canvas, player, showTip, onRaid: (i) => go('raid', i), onHome: () => go('garden') });
let raidNode = 0;

const raid = createRaidScene({
  canvas,
  showTip,
  onFinish(result) {
    if (result.mode === 'defense') {
      const lines = S.recordDefense(player, result.won);
      S.save(player);
      return lines;
    }
    player.army = result.armyLeft;
    player.raids++;
    const banked = S.addLoot(player, result.loot, result.seeds);
    const revealed = S.recordRaid(player, raidNode, result.stars);
    if (revealed != null) banked.note = `${MAP_NODES[raidNode].name} conquered! The fog lifts over the ${MAP_NODES[revealed].name}.`;
    else if (result.stars[1] && S.conqueredCount(player) === MAP_NODES.length) banked.note = 'Every hive in the backyard is yours. Re-raid them for loot!';
    S.save(player);
    return banked;
  },
});

let scene = garden;

function go(name, arg) {
  scene.exit();
  app.dataset.scene = name;
  scene = { raid, garden, map, roulette }[name];
  if (name === 'raid' && arg === 'defense') {
    const sw = S.swarmPlan(player);
    raid.enter({ mode: 'defense', layout: S.defenseLayout(player), spawnPlan: sw.plan, bugStrength: sw.strength, area: S.buildArea(player) });
  } else if (name === 'raid') {
    raidNode = arg;
    raid.enter({
      army: { ...player.army }, flavors: { ...player.flavors.infused, ...S.strainFlavors(player) }, unitDefs: S.unitDefs(player),
      level: S.nodeLevel(arg), layout: S.nodeLayout(arg), lootScale: S.nodeLootScale(player, arg), name: MAP_NODES[arg].name,
    });
  } else if (name === 'map') map.enter();
  else if (name === 'roulette') roulette.enter();
  else garden.enter();
  layout();
  showHelp(name, false);
}

$('#back-garden').addEventListener('click', () => go(raid.mode === 'defense' ? 'garden' : 'map'));

// ---------- help ----------

function showHelp(name, force) {
  if (name === 'map' || name === 'roulette') name = 'garden';
  const key = name === 'raid' ? 'seenRaidHelp' : 'seenHelp';
  if (!force && player[key]) return;
  $('#help-garden').hidden = name !== 'garden';
  $('#help-raid').hidden = name !== 'raid';
  $('#help').classList.remove('hidden');
  player[key] = true;
  S.save(player);
}
for (const b of document.querySelectorAll('.help-btn')) b.addEventListener('click', () => showHelp(app.dataset.scene, true));
$('#help-close').addEventListener('click', () => { unlockAudio(); $('#help').classList.add('hidden'); resetArmed = false; $('#reset').textContent = 'Start over'; });

// Two-tap reset (the viewer can't show confirm dialogs).
let resetArmed = false;
$('#reset').addEventListener('click', () => {
  if (!resetArmed) { resetArmed = true; $('#reset').textContent = 'Tap again to erase your garden'; return; }
  S.wipe();
  location.reload();
});

// ---------- input ----------

canvas.addEventListener('pointerdown', (e) => {
  unlockAudio();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  scene.pointerDown(e);
});
canvas.addEventListener('pointermove', (e) => scene.pointerMove(e));
canvas.addEventListener('pointerup', (e) => scene.pointerUp(e));
canvas.addEventListener('pointercancel', (e) => scene.pointerUp(e));

// ---------- layout & loop ----------

function layout() {
  scene.resize(stage.clientWidth - 8, stage.clientHeight - 8);
}
window.addEventListener('resize', layout);
if (document.fonts) document.fonts.ready.then(layout);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  scene.frame(dt);
  requestAnimationFrame(frame);
}

app.dataset.scene = 'garden';
garden.enter();
layout();
showHelp('garden', false);
requestAnimationFrame(frame);

window.player = player; // handy for debugging in the console
window.dig = roulette;
