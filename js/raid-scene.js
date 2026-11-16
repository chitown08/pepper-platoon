// The raid scene: wires the raid simulation, renderer and on-screen controls together.

import { UNITS, SPELL, FLAVORS, BUGS } from './config.js';
import { Raid } from './game.js';
import { Renderer, drawUnitIcon, drawSpellIcon } from './render.js';
import { sfx, unlockAudio } from './audio.js';

const $ = (s) => document.querySelector(s);

export function createRaidScene({ canvas, showTip, onFinish, onDeploy }) {
  let game = new Raid();
  const renderer = new Renderer(canvas);
  const ui = { selected: 'jalapeno', spellArmed: false, hover: null, denyFlash: 0, inspect: null };

  // ---------- cards ----------

  const cardsEl = $('#cards');
  let cardEls = {};
  // One card per troop type you brought (base species and hybrids).
  function buildCards(defs, army, flavors) {
    for (const el of Object.values(cardEls)) el.remove();
    cardEls = {};
    for (const [type, d] of Object.entries(defs)) {
      if (!army[type]) continue;
      const btn = document.createElement('button');
      btn.className = 'card' + (d.hybrid ? ' hybrid' : '');
      btn.dataset.type = type;
      const f = flavors[type];
      btn.innerHTML = `<span class="count"></span><span class="flav" title="${f ? FLAVORS[f].name : ''}">${f ? FLAVORS[f].icon : ''}</span><canvas width="96" height="96"></canvas><span class="name">${d.name}</span><span class="role">${d.role}</span>`;
      drawUnitIcon(btn.querySelector('canvas'), type, d);
      btn.addEventListener('click', () => {
        unlockAudio();
        ui.selected = type;
        ui.spellArmed = false;
        sfx('click');
        refreshCards();
      });
      cardsEl.insertBefore(btn, spellBtn);
      cardEls[type] = btn;
    }
    return Object.keys(cardEls).length + 1;
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
    pctEl.textContent = Math.round(game.destruction * 100) + '%' + (game.defense ? ' damage' : '');
    if (game.defense) {
      const left = game.bugsTotal - game.bugsKilled;
      $('#d-left').textContent = `${left} bug${left === 1 ? '' : 's'} left`;
      $('#d-killed').textContent = `${game.bugsKilled} squashed`;
    }
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
    if (game.defense) return; // your defenses fight on their own
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
      const next = Object.keys(game.army).find(k => game.army[k] > 0);
      if (!next) return;
      ui.selected = next;
    }
    if (game.deploy(ui.selected, p.x, p.y)) { refreshCards(); onDeploy?.(); }
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
  function showDefenseResults() {
    const lines = onFinish({ mode: 'defense', won: game.won });
    $('#res-title').textContent = game.won ? 'Garden Defended!' : 'The Stem Wilted!';
    $('#res-stars').innerHTML = `<span class="big-emoji">${game.won ? '🛡️' : '🥀'}</span>`;
    $('#res-pct').textContent = `Squashed ${game.bugsKilled} of ${game.bugsTotal} bugs · ${Math.round(game.destruction * 100)}% of your garden damaged`;
    $('#res-loot').innerHTML = `<ul class="dig-loot">${lines.map(l => `<li><span>${l.icon}</span>${l.text}</li>`).join('')}</ul>`;
    $('#res-tip').textContent = game.won
      ? 'More swarms will come. Upgrade your Thorn Shooters and keep your hedges thick.'
      : 'Tip: surround your Stem with Bramble Hedges, put Spicy Spores where bugs gather, and upgrade Thorn Shooters.';
    $('#back-garden').textContent = 'Back to the Garden';
    results.classList.remove('hidden');
  }

  function showResults() {
    shownResults = true;
    if (game.defense) { showDefenseResults(); return; }
    $('#back-garden').textContent = 'Back to the Map';
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
      banked.note ? banked.note
      : game.stars[1] ? 'Compost Bin down!'
      : stars > 0 ? 'Take out the Compost Bin to conquer this hive.'
      : 'Tip: lead with Bell Peppers to draw fire, spread your drops to dodge Spicy Spores, and save Hot Sauce for turrets or walls.');
    results.classList.remove('hidden');
  }

  // ---------- loop ----------

  let cardTick = 0;
  let speed = 1;
  const speedBtn = $('#d-speed');
  speedBtn.onclick = () => { speed = speed === 1 ? 2 : 1; speedBtn.querySelector('b').textContent = `Speed ×${speed}`; sfx('click'); };
  function frame(dt) {
    game.update(dt);
    if (game.defense && speed > 1) game.update(dt);
    ui.denyFlash = Math.max(0, ui.denyFlash - dt * 1.5);
    renderer.render(game, ui);
    updateHud();
    cardTick += dt;
    if (cardTick > 0.15) { cardTick = 0; refreshCards(); }
    if (game.phase === 'over' && !shownResults) showResults();
  }

  return {
    enter({ army, level, flavors = {}, layout, lootScale = 1, name, mode, spawnPlan, bugStrength, area, unitDefs }) {
      const defense = mode === 'defense';
      document.querySelector('#app').dataset.mode = defense ? 'defense' : 'raid';
      renderer.setScene(defense ? 'defense' : 'raid', area);
      game = defense
        ? new Raid({ mode, unitDefs: BUGS, core: 'stem', layout, spawnPlan, bugStrength })
        : new Raid({ army, level, flavors, layout, lootScale, unitDefs });
      this.mode = defense ? 'defense' : 'raid';
      const shown = buildCards(game.defs, game.army, flavors);
      window.raid = game; // handy for debugging in the console
      ui.selected = Object.keys(game.army).find(k => game.army[k] > 0) || 'jalapeno';
      cardsEl.style.setProperty('--cards', shown);
      cardsEl.classList.toggle('many', shown > 4);
      ui.spellArmed = false;
      ui.inspect = null;
      shownResults = false;
      results.classList.add('hidden');
      $('#banner b').textContent = `Scouting ${name || 'the Bug Hive'} · Lv ${level}`;
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
