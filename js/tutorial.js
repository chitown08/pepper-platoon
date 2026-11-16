// First-time tutorial: a coach bubble that walks new players through harvest -> troops -> raid.

const $ = (s) => document.querySelector(s);

// Each step: where it shows, what it says, what to highlight, and the event that completes it.
const STEPS = [
  { scene: 'garden', text: 'Welcome, Head Gardener! Your Leaf has soaked up some Sunlight. Tap the ☀️ bubble to harvest it.', target: null, until: 'harvest', point: 'leaf' },
  { scene: 'garden', text: 'Sunlight builds things. Water grows troops. Open your <b>Platoon</b>.', target: '#g-army', until: 'army' },
  { scene: 'garden', text: 'Tap <b>+1</b> to grow a Jalapeño. They cost 💧 20 each.', target: '.train[data-type="jalapeno"]', until: 'train' },
  { scene: 'garden', text: 'Your platoon is ready. Hit <b>Raid!</b> to open the Garden Map.', target: '#g-raid', until: 'map' },
  { scene: 'map', text: 'Tap the <b>Sandbox</b> hive, then <b>Scout &amp; Raid</b>.', target: '#m-raid', until: 'raid' },
  { scene: 'raid', text: 'Pick a pepper below, then tap the red picnic blanket to drop it. Tip: send a Bell Pepper first to soak up fire.', target: '#cards', until: 'deploy' },
  { scene: 'raid', text: 'Destroy the <b>Compost Bin</b> to conquer the hive. Good luck!', target: null, until: 'timeout', time: 5 },
];

export function createTutorial({ player, save }) {
  const p = player;
  const el = $('#coach');
  let scene = 'garden';
  let timer = 0;

  const active = () => typeof p.tutorial === 'number' && p.tutorial < STEPS.length;

  function clearHighlight() {
    for (const n of document.querySelectorAll('.coach-target')) n.classList.remove('coach-target');
  }

  function render() {
    clearHighlight();
    if (!active()) { el.hidden = true; return; }
    const s = STEPS[p.tutorial];
    if (s.scene !== scene) { el.hidden = true; return; }
    el.hidden = false;
    el.querySelector('.coach-text').innerHTML = s.text;
    el.querySelector('.coach-step').textContent = `${p.tutorial + 1} / ${STEPS.length}`;
    if (s.target) {
      const t = document.querySelector(s.target);
      if (t) t.classList.add('coach-target');
    }
    if (s.until === 'timeout') timer = s.time;
  }

  function advance() {
    p.tutorial++;
    if (p.tutorial >= STEPS.length) { p.tutorial = 'done'; p.seenHelp = true; }
    save();
    render();
  }

  el.querySelector('.coach-skip').addEventListener('click', () => { p.tutorial = 'done'; p.seenHelp = true; save(); render(); });

  return {
    active,
    // the garden draws a pointing hand at this kind of building while the step wants it
    pointAt: () => (active() && STEPS[p.tutorial].scene === scene ? STEPS[p.tutorial].point || null : null),
    setScene(name) { scene = name; render(); },
    on(event) {
      if (!active()) return;
      if (STEPS[p.tutorial].until === event) advance();
    },
    refresh: render, // call after menus re-render so highlights land on the new elements
    tick(dt) {
      if (!active() || STEPS[p.tutorial].until !== 'timeout' || STEPS[p.tutorial].scene !== scene) return;
      timer -= dt;
      if (timer <= 0) advance();
    },
  };
}
