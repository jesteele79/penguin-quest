# Penguin Quest: Aurora Rescue — Design

An open-world 3D math adventure for grades 4–6, built from the key-art image (igloo observatory,
glowing lake, golden path, Gloom critters on a cliff, heart-flag huts, ice cave, Aurora Spire).

## Goals

- A child who loves penguins *wants* to play it, and gets measurably better at grade 4–6 math.
- Runs well on a typical Chromebook, keyboard only, offline, with no store or account.
- A parent can see what was practiced, what was mastered, and what went wrong.

## Platform decision

| Option | Verdict |
|---|---|
| **three.js web game, bundled into one offline HTML file (+ optional installable PWA)** | **Chosen.** Opens in Chrome on any Chromebook, works offline, no install friction, easy to update. |
| Unity / Godot WebGL export | Heavy downloads, weak on low-end Chromebook GPUs, no build tooling here. |
| Android app through Play Store | Needs a developer account and review; overkill for one family. |

Build: ES modules in `src/`, bundled by esbuild into `dist/PenguinQuest.html` (three.js, fonts, code all
inlined). A `dist/pwa/` folder adds a manifest + service worker for "Install app" when hosted over HTTPS.

## Story

The Glooms — grumpy shadow critters from the far ridge — pulled the Aurora out of the sky and locked its
light in five Aurora Crystals, each sealed with number magic. Professor Waddlesworth (igloo observatory)
gives the hero (named by the child; default "Pip") the Aurora Scarf. Restoring each crystal returns one
color band to the sky. Glooms are never defeated — they are *cheered up* by aurora light and turn into
bright Glimmers that float up to join the aurora. The Gloom King at the Spire is lonely, not evil.

## World (one continuous island, ~440 × 440 units, ringed by mountains)

| Region | Math domain | Mini-game | Aurora band |
|---|---|---|---|
| Snowdrift Home (igloo, telescope, 3 penguin kids) | Tutorial + placement warm-up; optional data/statistics at the telescope | Snowflake hunt | — |
| Glimmer Lake (glowing lake, fish, dock, island) | Multiply & divide | **Fishing** (hook the fish with the right answer) + **Floe Hop** (jump onto the floe with the right answer) | Green |
| Crystal Grove | Fractions | **Fraction Locks** (fill pillars to exactly one whole) | Teal |
| Heart Huts | Decimals, money, ratios, percents | **Snack Shack** (serve 5 customers) | Pink |
| Glacier Cave | Geometry & measurement | **Ice Architect** (answers build 3D area/perimeter/volume models) | Blue |
| Gloom Ridge | Number sense & algebra | **Cheer-Up Battle** (type answers to beam approaching Glooms) | Violet |
| Aurora Spire | Mixed review | **Gloom King finale** | Gold crown |

Each region ends with a **Crystal Challenge** (6 correct answers). The Spire is sealed until all five
crystals are restored. A golden road connects regions; a sparkle **guide trail** always leads to the next
objective (road-graph pathfinding, so it never points up a cliff).

Side content: 30 golden snowflakes (movement collectibles), 12 treasure chests (1 problem each), wandering
Glooms (repeatable practice), telescope star charts (data), wardrobe shop (scarves, hats, slide trails)
bought with fish coins.

## Depth and pacing (revision: "deep enough that he can't finish it in a day")

**Story in chapters, one per day by default.** Prologue (home), Chapters 1–5 (one region each), Chapter 6
(Aurora Spire and the Gloom King), Chapter 7 (Act 2: the Great Aurora Festival). When a chapter is finished,
the next one opens on the next calendar day with a "good morning" radio briefing from the Professor. Grown-ups
can switch pacing to "no limit". Side quests, daily tasks and practice stay available while waiting.

**Each chapter:** meet the region's friend, earn 3 Aurora Shards from 3 different activities, charge the
crystal's *resonance* (every solved problem in that subject adds to it, so struggling kids get more practice
before moving on), then pass the Crystal Challenge.

| Chapter | Shard 1 | Shard 2 | Shard 3 |
|---|---|---|---|
| 1 Glimmer Lake | Fishing (6 fish) | Relight 4 channel buoys (swim to them) | Floe Hop to Shimmer Isle |
| 2 Crystal Grove | Fraction Locks | Fern's Glow Potions | Seed hunt, then plant 5 crystal seeds |
| 3 Heart Huts | Snack Shack (5 customers) | Cocoa delivery to 4 friends around the bay | Granny Purl's knitting patterns (ratios) |
| 4 Glacier Cave | Ice Architect (5 builds) | Pebble's survey of 4 ice formations | Mirror beams (angles) |
| 5 Gloom Ridge | Light 4 signal beacons | Cheer-Up Battle (3 waves) | Befriend 4 wandering Glooms |
| 6 Aurora Spire | Gloom King finale (3 phases) | | |
| 7 Festival | Five Legend Trials (hard mode) light the festival lanterns, then the festival night | | |

**Side quests:** snowflake collectors (30), treasure chests (12), Lost Chicks rescue (8 chicks that follow you
home; all 8 earn a chick buddy), Captain's treasure map (coordinate-grid clues), Sled Slalom (medals, best time),
Big Fish Tournament, Snack Shack Rush, Snow Sculpture Contest, Star Charts (daily data puzzles), Glimmer Friends.

**Daily Aurora Patrol:** 3 tasks per day from a pool (solve puzzles in a subject, cheer up Glooms, belly-slide
distance, swim distance, a slalom medal, 5 in a row...). Tasks earn coins and Aurora Stars; finishing all three
extends a streak. Stars buy special gear (galaxy scarf, comet trail, comet sled, Aurora Crown).

**Quest Journal (J):** chapters with steps, side quests with progress, today's patrol, collections. Any quest
can be tracked; the guide trail and objective banner follow the tracked quest.

## Controls (keyboard first)

W/↑ forward · S/↓ back · A/← and D/→ turn · Space jump · Shift belly-slide (swim boost in water) ·
E/Enter interact · 1–4 pick an answer · type numbers + Enter · H hint · M map · Esc pause.
The camera follows automatically; mouse drag orbits and the wheel zooms (optional).

## Learning design

- **Skill ladders**: ~50 skills tagged with grade and Common Core code, ordered per domain.
  Grade choice at new game marks lower-grade skills as known-but-reviewed; a 6-question warm-up calibrates.
- **Mastery**: exponential moving average of first-try correctness (hinted answers count half). Mastered at
  ≥ 0.8 with ≥ 5 attempts. Difficulty tier (1–3) inside each skill follows mastery.
- **Selection**: ~70% frontier skill, ~20% spaced review of mastered skills, retry queue for recent misses.
- **Teaching loop**: wrong once → targeted hint (and misconception-specific feedback when a known distractor
  was chosen); wrong twice → worked solution, step by step, with a visual model; a similar problem returns soon.
- **Visual models** (SVG): fraction bars/circles, number lines, area models, rectangles, 3D boxes, angles,
  coordinate grids, bar charts, line plots.
- **Answer input**: whole numbers, decimals, money, negatives, fractions, mixed numbers (`1 1/2`),
  remainders (`12 R3`). Equivalent fractions are accepted unless the question asks for simplest form.
- **No fail states**: wrong answers never cost progress; the Gloom battle's hearts only restart a wave, and
  Gentle Mode makes Glooms wait.

## Grown-ups dashboard

Time played, problems solved, first-try accuracy, per-domain mastery, a per-skill table with Common Core
codes, the most recent mistakes (question, answer given, correct answer), grade setting, Gentle Mode,
read-aloud, "copy report", reset progress.

## Architecture

```
src/
  main.js            boot, loop, activity stack
  core/              state (G), input, rng/noise/math utils, canvas textures, audio synth
  world/             terrain (pure height/color fn + mesh), sky + aurora, water, vegetation, crystals,
                     buildings, roads + guide trail, effects (snow, glows, particles, footprints)
  actors/            penguin model + procedural animation, player controller, NPCs, Glooms, camera
  math/              rational numbers + answer parser, formatting, skill generators, tutor, SVG visuals
  ui/                HUD, dialog, quiz panel, menus, grown-ups, shop, map, 3D-anchored labels, toasts
  game/              save, quests, interactions, activities (explore, dialog, quiz, each mini-game, boss)
test/                node --test suites for generators, parser, tutor
build.mjs            esbuild bundle → single offline HTML + PWA folder
```

`math/` has no three.js or DOM dependency, so it is unit-tested in Node. `world/terrain.js` exposes a pure
height function used by both the mesh and physics, and by a Node script that renders a top-down layout map.

## Performance budget (Chromebook)

Instanced trees/rocks/crystals, one merged terrain mesh, all static glows in one Points draw call,
≤ 2 dynamic point lights (assigned to the nearest lanterns), procedural textures only.
Quality presets (Low/Medium/High) with Auto mode that steps down if frame time stays above ~28 ms.
Bloom only on High. Target < 250 draw calls.

## Saving

`localStorage` (versioned JSON, autosave every 30 s and at milestones), every access in try/catch; the game
runs normally when storage is unavailable.

## Testing

- Generators: every skill × tier × 300 seeds — canonical answer passes the checker, exactly one correct
  choice, no duplicate choices, no NaN/undefined text, hints and steps present; independent recomputation
  for arithmetic skills.
- Parser: fractions, mixed numbers, decimals, money, negatives, commas, remainders.
- In-browser: console clean, screenshots of title, each region, each mini-game (debug hooks behind `?debug`).
