// The raid scene: wires the raid simulation, renderer and on-screen controls together.

import { UNITS, SPELL, FLAVORS } from './config.js';
import { Raid } from './game.js';
import { Renderer, drawUnitIcon, drawSpellIcon } from './render.js';
import { sfx, unlockAudio } from './audio.js';

const $ = (s) => document.querySelector(s);

export function createRaidScene({ canvas, showTip, onFinish }) {
  let game = new Raid();
  const renderer = new Renderer(canvas);
  const ui = { selected: 'jalapeno', spellArmed: false, hover: null, denyFlash: 0, inspect: null };

  // ---------- cards ----------

  const cardsEl = $('#cards');
  const cardEls = {};
  for (const [type, d] of Object.entries(UNITS)) {
    const btn = document.createElement('button');
    btn.className = 'card';
    btn.dataset.type = type;
    btn.innerHTML = `<span class="count"></span><span class="flav"></span><canvas width="96" height="96"></canvas><span class="name">${d.name}</span><span class="role">${d.role}</span>`;
    drawUnitIcon(btn.querySelector('canvas'), type);
    btn.addEventListener('click', () => {
      unlockAudio();
      ui.selected = type;
      ui.spellArmed = false;
      sfx('click');
      refreshCards();
    });
    cardsEl.appendChild(btn);
    cardEls[type] = btn;
  }

  const spellBtn = document.createElement('button');
  spellBtn.className = 'card spell';
  spellBtn.innerHTML = `<span class="count">${SPELL.cost}🔥</span><canvas width="96" height="96"></canvas><span class="name">Hot Sauce</span><span class="role">Strike</span><span class="heatfill"></span>`;
  drawSpellIcon(spellBtn.querySelector('canvas'));
  spellBtn.addEventListener('click', () => {
    unlockAudio();
    if (game.heat < SPELL.cost) { sfx('deny'); return; }
    ui.spellArmed = !ui.spellArmed;
    sfx('click');
    refreshCards();
  });
  cardsEl.appendChild(spellBtn);

  function refreshCards() {
    for (const [type, el] of Object.entries(cardEls)) {
      el.querySelector('.count').textContent = 'x' + game.army[type];
      el.classList.toggle('selected', ui.selected === type && !ui.spellArmed);
      el.classList.toggle('empty', game.army[type] <= 0);
    }
    spellBtn.classList.toggle('selected', ui.spellArmed);
    spellBtn.classList.toggle('ready', game.heat >= SPELL.cost);
    spellBtn.querySelector('.heatfill').style.height = `${Math.min(1, game.heat / SPELL.cost) * 100}%`;
  }

  // ---------- HUD ----------

  const timerEl = $('#timer'), pctEl = $('#pct'), heatEl = $('#heatbar > i'), heatNum = $('#heatnum');
  const starEls = [...document.querySelectorAll('#stars .star')];
  const banner = $('#banner');

  function updateHud() {
    const s = Math.ceil(game.time);
    timerEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    timerEl.classList.toggle('low', game.time < 20 && game.phase === 'battle');
    pctEl.textContent = Math.round(game.destruction * 100) + '%';
    heatEl.style.width = (game.heat) + '%';
    heatNum.textContent = Math.floor(game.heat);
    starEls.forEach((el, i) => el.classList.toggle('on', game.stars[i]));
    banner.classList.toggle('hidden', game.phase !== 'scout');
  }

  // ---------- input ----------

  let pointerDown = false, lastDeploy = 0;

  function tryAct(e, fresh) {
    const p = renderer.toWorld(e.clientX, e.clientY);
    ui.hover = p;
    if (game.phase === 'ending' || game.phase === 'over') return;
    if (ui.spellArmed) {
      if (!fresh) return;
      if (game.castSpell(p.x, p.y)) ui.spellArmed = false;
      else sfx('deny');
      refreshCards();
      return;
    }
    const tx = Math.floor(p.x), ty = Math.floor(p.y);
    if (!game.canDeployAt(tx, ty)) {
      if (!fresh) return;
      // tapping the base during scouting shows what's there
      const o = game.grid.get(tx, ty);
      if (o && o.alive) {
        const target = o;
        const extra = target.def.attack ? ` · range ${target.def.range}` : '';
        ui.inspect = { b: target, text: `${target.def.name} · ${Math.ceil(target.hp)} HP${extra}`, until: game.clock + 2 };
      } else {
        ui.denyFlash = 0.5;
        sfx('deny');
        showTip('Drop troops on the picnic blanket!');
      }
      return;
    }
    if (game.army[ui.selected] <= 0) {
      const next = Object.keys(UNITS).find(k => game.army[k] > 0);
      if (!next) return;
      ui.selected = next;
    }
    if (game.deploy(ui.selected, p.x, p.y)) refreshCards();
  }

  function onPointerDown(e) {
    unlockAudio();
    pointerDown = true;
    lastDeploy = performance.now();
    tryAct(e, true);
  }
  function onPointerMove(e) {
    ui.hover = renderer.toWorld(e.clientX, e.clientY);
    // hold & drag to keep deploying
    if (pointerDown && !ui.spellArmed && performance.now() - lastDeploy > 180) {
      lastDeploy = performance.now();
      tryAct(e, false);
    }
  }
  const up = () => { pointerDown = false; };

  // ---------- results ----------

  const results = $('#results');
  let shownResults = false;
  function showResults() {
    shownResults = true;
    const stars = game.stars.filter(Boolean).length;
    const seeds = stars;
    const banked = onFinish({ loot: { ...game.loot }, seeds, stars: [...game.stars], armyLeft: { ...game.army }, level: game.level });
    $('#res-title').textContent = stars === 3 ? 'TOTAL SAUCE-CESS!' : stars > 0 ? 'Victory!' : 'Raid Failed';
    $('#res-stars').innerHTML = [0, 1, 2].map(i => `<span class="star ${game.stars[i] ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('');
    $('#res-pct').textContent = Math.round(game.destruction * 100) + '% destroyed';
    $('#res-loot').innerHTML = `
      <div><b>☀️ ${banked.sun.toLocaleString()}</b><small>Sunlight</small></div>
      <div><b>💧 ${banked.water.toLocaleString()}</b><small>Water</small></div>
      <div><b>🌱 ${seeds}</b><small>Spice Seeds</small></div>`;
    const lost = banked.lostSun + banked.lostWater;
    $('#res-tip').textContent = (lost > 0 ? `Your storage was full, so ${lost.toLocaleString()} loot spilled. Grow your Stem to hold more. ` : '') + (
      game.stars[1] ? `Compost Bin down! A tougher Lv ${game.level + 1} Bug Hive has moved in.`
      : stars > 0 ? 'Take out the Compost Bin to unlock the next Bug Hive.'
      : 'Tip: lead with Bell Peppers to draw fire, spread your drops to dodge Spicy Spores, and save Hot Sauce for turrets or walls.');
    results.classList.remove('hidden');
  }

  // ---------- loop ----------

  let cardTick = 0;
  function frame(dt) {
    game.update(dt);
    ui.denyFlash = Math.max(0, ui.denyFlash - dt * 1.5);
    renderer.render(game, ui);
    updateHud();
    cardTick += dt;
    if (cardTick > 0.15) { cardTick = 0; refreshCards(); }
    if (game.phase === 'over' && !shownResults) showResults();
  }

  return {
    enter({ army, level, flavors = {} }) {
      game = new Raid({ army, level, flavors });
      for (const [type, el] of Object.entries(cardEls)) {
        const f = flavors[type];
        el.querySelector('.flav').textContent = f ? FLAVORS[f].icon : '';
        el.querySelector('.flav').title = f ? FLAVORS[f].name : '';
      }
      window.raid = game; // handy for debugging in the console
      ui.selected = Object.keys(UNITS).find(k => game.army[k] > 0) || 'jalapeno';
      ui.spellArmed = false;
      ui.inspect = null;
      shownResults = false;
      results.classList.add('hidden');
      $('#banner b').textContent = `Scouting Bug Hive Lv ${level}`;
      refreshCards();
    },
    exit() { results.classList.add('hidden'); },
    resize: (w, h) => renderer.resize(w, h),
    frame,
    pointerDown: onPointerDown,
    pointerMove: onPointerMove,
    pointerUp: up,
  };
}
