// Boots the game and switches between the Garden and Sauce Raids.

import * as S from './state.js';
import { createGarden } from './garden.js';
import { createRaidScene } from './raid-scene.js';
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

const garden = createGarden({ canvas, player, showTip, onRaid: () => go('raid') });

const raid = createRaidScene({
  canvas,
  showTip,
  onFinish(result) {
    player.army = result.armyLeft;
    player.raids++;
    const banked = S.addLoot(player, result.loot, result.seeds);
    if (result.stars[1]) player.hiveLevel = Math.max(player.hiveLevel, result.level + 1);
    S.save(player);
    return banked;
  },
});

let scene = garden;

function go(name) {
  scene.exit();
  app.dataset.scene = name;
  scene = name === 'raid' ? raid : garden;
  if (name === 'raid') raid.enter({ army: { ...player.army }, level: player.hiveLevel, flavors: { ...player.flavors.infused } });
  else garden.enter();
  layout();
  showHelp(name, false);
}

$('#back-garden').addEventListener('click', () => go('garden'));

// ---------- help ----------

function showHelp(name, force) {
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
