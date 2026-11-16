# 🌶️ Pepper Platoon

A mobile-first web strategy game: grow a sentient pepper plant, then lead platoons of volatile pepper warriors on **Sauce Raids** against garden pests.

## Current state: Garden + Sauce Raids

**The Garden (home base)**: a top-down plot with your sentient Stem in the middle and vines running out to each building.
- **Leaves** make ☀️ Sunlight and **Roots** draw 💧 Water over time, even while the game is closed. Tap them to harvest.
- **Blossoms** house your platoon. Growing troops costs Water.
- Growing the **Stem** enlarges the plot, raises storage and unlocks more and higher-level buildings.
- Tap any building to upgrade or move it.
- The **Flavor Lab** turns 🌱 Spice Seeds (1 per raid star) into flavor recipes. Infuse a troop type with one flavor for 💧 Water: Tomato (healing salsa on death), Garlic (poison), Lime (double damage to walls and turrets), Salt (finisher), Cilantro (dodge), Mango (slows turrets), Onion (turrets miss), Chipotle (tougher, resists sap and spores).
- Progress is saved in the browser on this device.

**The Garden Map**: a backyard of nine Bug Hives (Sandbox, Garden Hose, Birdbath, Tool Shed, Patio, Barbecue, Doghouse, Koi Pond, Greenhouse Ruins), each with its own layout and level. Destroy a hive's Compost Bin to conquer it and lift the fog off the next one. Conquered hives can be re-raided for half loot.

**The Greenhouse** (Stem Lv 2): cross-breed two peppers into a new hybrid troop. The Body parent gives health, speed and size; the Seed parent gives the attack, damage and targeting (Bell body + Habanero seed = **Boom-Bell**). Mixing in an unlocked flavor stabilizes the cross and bakes that flavor in; unstable crosses fail into **Duds** (Wrinkle-Pepper, Couch Potato) with 1 HP that make nearby turrets stop and stare in pity. Hybrids can be bred again for wilder Gen-2+ strains. Each strain has a shareable **seed code** (PP1-…) that friends can plant.

**Defend your garden**: plant Thorn Shooters, Sap Sprayers, hidden Spicy Spores and Bramble Hedges (drag to paint a row) from the Plant menu's Defenses tab. After your first conquest, bug swarms (Aphids, armored Stag Beetles, flying Wasps) attack every few hours, growing with the hives you've conquered. Watch the battle play out on your own garden: hold the Stem for a Sunlight and Spice Seed bounty; lose it and they carry off a quarter of your Sunlight and Water, and your garden is Wilted (safe) for 6 hours. `node tools/defense.js` simulates attacks on sample gardens.

**Root Roulette**: once a day, Dig under your plant (💧100). Tap root pieces to rotate them and connect the taproot to nutrient pockets before the 60-second Sap Pressure bursts: Aquifers (Water), Seed Geodes (Spice Seeds), a Fertilizer Geyser (Photosynthesis Overdrive: double Sunlight for 4 hours), and on the bottom row an Ancient Ingredient that unlocks the rare **Truffle** (bonus loot) or **Saffron** (faster attacks) flavor. Glowing fungus tiles in your root network multiply rewards; tap Burrowing Grubs before they scramble your roots. Every puzzle is generated to be solvable.

**Sauce Raids**: attack a Bug Hive with the troops you've grown.
- **Troops:** Jalapeño (swarm infantry), Bell Pepper (tank that taunts turrets and deals no damage), Habanero (grenadier that lobs over walls), Ghost Pepper (Stem Lv 2: turret assassin that walks through walls and is unseen at first), Carolina Reaper (Stem Lv 3 hero: one per raid, costs Spice Seeds, huge melee and a frenzy aura)
- **Bug defenses:** Thorn Shooter (rapid single target), Sap Sprayer (slowing goo aimed at clumps), hidden Spicy Spore traps, Twig & Pebble Walls
- **Heat:** builds over time and spikes on kills; spend 50 for a **Hot Sauce Strike** (extra damage to walls)
- **Stars:** ★ 50% destroyed · ★ Compost Bin destroyed · ★ 100% destroyed
- Deployed troops are used up; the rest come home.

**Polish**: a synthesized kitchen marching band (pots, pans, wooden spoons, kazoo, tuba and glockenspiel) with a tune per screen; a 7-step first-time tutorial; optional growth timers for upgrades (one at a time, finish early with Spice Seeds); Settings for music, sound effects and timers; an app icon, home-screen install support and offline play from the public site.

## Play it locally

It's plain HTML/CSS/JavaScript with no build step, but it needs a tiny web server (browsers block JS modules from `file://`):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Project layout

| File | What it does |
|---|---|
| `index.html`, `style.css` | Page, HUD, cards, menus |
| `js/config.js` | **All balance numbers, costs, and the Bug Hive layouts** (drawn as text grids, so you can design new bases). Tweak here first. |
| `js/game.js` | Raid simulation: troop AI, defenses, traps, Heat, scoring |
| `js/grid.js` | Tile grid and pathfinding |
| `js/render.js` | All the drawing (every sprite is drawn in code, no image files) |
| `js/audio.js`, `js/music.js` | Synthesized sound effects and music |
| `js/tutorial.js` | First-time tutorial coach |
| `manifest.webmanifest`, `sw.js`, `icons/` | Home-screen install and offline support |
| `js/main.js` | Boots the game and switches between Garden and Raid |
| `js/state.js` | Save data and the economy (harvest, build, upgrade, train) |
| `js/garden.js`, `js/garden-art.js` | The Garden screen, its menus and art |
| `js/raid-scene.js` | Raid screen controls, HUD and results |
| `js/map.js` | The Garden Map screen |
| `js/roulette.js` | Root Roulette: puzzle generator, flow logic and screen |
| `tools/sim.js` | Headless raid balance tester. Run `npm run sim` (needs Node.js). |
| `tools/defense.js` | Simulates bug swarms against sample gardens |
| `tools/progression.js` | Simulates every map hive against a typical army for that stage |

## Design decisions so far

- **Web first.** It can be wrapped for the App Store and Google Play later (e.g. Capacitor) using the same code.
- **Resources:** ☀️ Sunlight (build), 💧 Water (troops/infusions), 🌱 Spice Seeds (rare). Heat exists only during raids.
- **Base view:** top-down. The Stem is the core, branches are the buildable grid, and it's the same map attackers raid. Root Roulette is the underground layer.
- **Flavor Lab and Greenhouse** are merged into one system.
- **Compost Bin** is the core of AI bug bases. Player bases defend their Stem.
- **Walls:** Bramble Hedges (player) and Twig & Pebble Walls (bugs).
