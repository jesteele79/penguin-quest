# Penguin Quest

A series of 3D open-world math adventures for grades 4 to 6, one book per grade. In each book a penguin
heals a world in trouble by solving puzzles across five regions, each built around one subject:
multiplication and division, fractions, decimals and place value, geometry and measurement, and number
sense, algebra and data.

**Play:** https://jesteele79.github.io/penguin-quest/ (in Chrome, use the install icon in the address
bar to add it as an app; it then works offline and updates itself after each push).

## The books

| Book | Grade | World | Status |
|---|---|---|---|
| 1. Aurora Rescue | 4 | Glacier Bay: bring the fading aurora back to a snowy island | Playable |
| 2. The Ember Isles | 5 | A warm volcanic archipelago whose Heart-Ember is cooling | Playable |
| 3. Skyreach | 6 | Floating islands above the clouds, where a great shy cloud has hushed the stars | Playable |

A book opens when the one before it is finished and 80% of its grade's skills are mastered (a grown-up can
open one early). Captain Flipper sails the penguin to the Ember Isles from the dock, and Cinder flies the
airship up to Skyreach; both take the penguin back again any time, and the title screen's shelf switches
books too. Each book keeps its own story progress, while coins, gear
and the tutor's record belong to the child.

## What's in a book

- A prologue and seven story chapters. By default one new chapter opens per day; a grown-up can change
  this under *For grown-ups*.
- Nine side quests, treasure chests, thirty hidden collectibles (snowflakes, sea glass, sky feathers), a daily patrol
  with streaks, replayable medal games, lost little ones to bring home, and a wardrobe of unlockable gear
  and buddies.
- Action games where the answers are in the world: fishing, floe hopping and lava hopping, a snorkel
  trail of answer rings, gliding off a tower through the right ring, a balloon lift that rides up to the
  answer and down into the clouds, a slalom, a market stall, a builder that turns answers into 3D builds,
  and a cheer-up battle.
- Its own look, music and sounds: Book 1's music box and wind, Book 2's steel drums, marimba and surf,
  Book 3's harp, glass celesta and flute over a high breeze with wind chimes (and strings while gliding).
  One hero theme runs through the series, played in each book's own voice at its big moments and in all
  three voices at once on Skyreach's last night.
- An adaptive tutor with 100 Common Core aligned skills (grades 3 to 6). It gives a hint after a first
  wrong answer, a worked solution after a second, rests a skill that was missed twice in a row, and
  brings missed skills back later. Word problems use the names and things of the book being played.
- 72 lessons for new ideas: a friend explains, the child explores a hands-on model (fraction strips,
  number lines, area grids, place-value slides, unit cubes, a balance scale, ratio tables, number cards,
  histogram bins, box nets and more), sees a picture, watches a worked example, then finishes one alone. They start by themselves the first time an idea above the child's
  grade comes up, and can be replayed from the Skill Book.
- A progress report for grown-ups: mastery by subject, every skill with its standard code, recent
  mistakes, and what opens the next book.

Controls: W or arrow keys walk, A and D turn, Space jumps (hold it while falling to glide, in Skyreach), Shift belly-slides (and swims faster), E talks
and uses things, J opens the journal, M the map, Esc the menu. Touchscreens get an on-screen joystick and
buttons, game controllers work everywhere (A jump or confirm, B back, X use, Y journal, Start menu),
and typed answers get an on-screen keypad on both.

Settings include text size (100 to 150%), Easy Reading (wider spacing, cream pages), read-aloud for
questions and story lines, story text speed, and reduced motion (follows the ChromeOS setting).

## Working on it

Requires Node 22.

```bash
npm install
npm test          # math engine, lessons, all three books' stories, and the Book 2 and Book 3 maps
npm run build     # dist/PenguinQuest.html (single file), dist/pwa (installable), dist/artifact
npm run dev       # unminified build with the playtest helpers on window.T and G.dev
npm run check     # quest sites on sensible terrain and not crowding each other
node tools/shoot.mjs <plan.mjs> --size 1366x768 [--query book=book2]   # drive the dev build in headless Chrome
node tools/mapdump.mjs book2 .cache/map-book2.ppm                        # top-down map of a book's terrain
node tools/shoot.mjs tools/plans/overlaps.mjs --query book=book3          # things inside something solid, blocked roads
node tools/shoot.mjs tools/plans/bridges.mjs --query book=book3           # walk across every sky bridge both ways
node tools/shoot.mjs tools/plans/trailwalk.mjs --query book=book2         # follow the gold trail on foot to every place
```

A shoot plan exports `default async (page) => {...}` and uses `page.eval(js)`, `page.shot(name)` and
`page.wait(ms)`; screenshots land in `.cache/shots`. `--query book=book2` opens Book 2 (and `book3` Book 3).

`npx http-server dist` (or any static server) serves the build locally; the dev build is at
`/PenguinQuest.html` and the installable version at `/pwa/`.

Pushing to `master` runs the tests, builds, and publishes `dist/pwa` to GitHub Pages.

## Layout

- `src/books` the series: which book this page is (`active.js`), each book's layout, terrain shape, cast,
  story, hooks and its own games and places (`book1/`, `book2/`, `book3/`), and the shared terms and unlock rules
- `src/world` terrain, sky, water, effects and the builders, which read the active book
- `src/actors` the player, penguins, critters (turtles, crabs, puffins), Glooms, Sootlings and Hushlings, buddies and fish
- `src/math` fractions, answer checking, the skill generators, lessons, word-problem themes and the
  adaptive tutor
- `src/game` the quest engine, shared mini-games, screens, lessons and saving
- `src/ui` HUD, dialog, quiz panel, hands-on lesson models and toasts
- `tools` content checks, the layout map, the icon generator and the headless screenshot runner
- `docs/superpowers/specs` design documents, including the plan for the trilogy
