# 🌶️ Pepper Platoon

A mobile-first web strategy game: grow a sentient pepper plant, then lead platoons of volatile pepper warriors on **Sauce Raids** against garden pests.

## Current state: Sauce Raid prototype

One playable raid against an AI **Bug Hive**:

- **Troops:** Jalapeño (swarm infantry), Bell Pepper (tank, taunts turrets, no damage), Habanero (grenadier, lobs over walls)
- **Bug defenses:** Thorn Shooter (rapid single-target), Sap Sprayer (slowing AoE that targets clumps), hidden Spicy Spore traps, Twig & Pebble Walls
- **Heat:** builds over time and spikes on kills; spend 50 for a **Hot Sauce Strike** (extra damage to walls)
- **Stars:** ★ 50% destroyed · ★ Compost Bin destroyed · ★ 100% destroyed

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
| `js/config.js` | **All balance numbers and the base layout.** Tweak here first. |
| `js/game.js` | Raid simulation: troop AI, defenses, traps, Heat, scoring |
| `js/grid.js` | Tile grid and pathfinding |
| `js/render.js` | All the drawing (every sprite is drawn in code, no image files) |
| `js/audio.js` | Synthesized sound effects |
| `js/main.js` | Wires input, HUD and the game loop together |
| `tools/sim.js` | Headless balance tester. Run `npm run sim` (needs Node.js). |

## Design decisions so far

- **Web first.** It can be wrapped for the App Store and Google Play later (e.g. Capacitor) using the same code.
- **Resources:** ☀️ Sunlight (build), 💧 Water (troops/infusions), 🌱 Spice Seeds (rare). Heat exists only during raids.
- **Base view:** top-down. The Stem is the core, branches are the buildable grid, and it's the same map attackers raid. Root Roulette is the underground layer.
- **Flavor Lab and Greenhouse** are merged into one system.
- **Compost Bin** is the core of AI bug bases. Player bases defend their Stem.
- **Walls:** Bramble Hedges (player) and Twig & Pebble Walls (bugs).
