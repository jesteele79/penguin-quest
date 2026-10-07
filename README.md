# Penguin Quest: Aurora Rescue

A 3D open-world adventure for grades 4 to 6. A penguin restores the fading aurora by solving math
puzzles across five regions, each built around one subject: multiplication and division, fractions,
decimals and money, geometry and measurement, and number sense and algebra.

**Play:** https://jesteele79.github.io/penguin-quest/ (in Chrome, use the install icon in the address
bar to add it as an app; it then works offline and updates itself after each push).

## What's in it

- A prologue and seven story chapters. By default one new chapter opens per day; a grown-up can change
  this under *For grown-ups*.
- Nine side quests, twelve treasure chests, thirty hidden snowflakes, a daily Aurora Patrol with
  streaks, replayable medal games and a wardrobe of unlockable gear.
- An adaptive tutor with 67 Common Core aligned skills. It gives a hint after a first wrong answer,
  a worked solution after a second, rests a skill that was missed twice in a row, and brings missed
  skills back later.
- A progress report for grown-ups: mastery by subject, every skill with its standard code, and
  recent mistakes.

Controls: W or arrow keys walk, A and D turn, Space jumps, Shift belly-slides, E talks and uses
things, J opens the journal, M the map, Esc the menu. Touchscreens get an on-screen joystick and
buttons, game controllers work everywhere (A jump or confirm, B back, X use, Y journal, Start menu),
and typed answers get an on-screen keypad on both.

Settings include text size (100 to 150%), Easy Reading (wider spacing, cream pages), read-aloud for
questions and story lines, story text speed, and reduced motion (follows the ChromeOS setting).

## Working on it

Requires Node 22.

```bash
npm install
npm test          # math engine: every skill, tier and answer format
npm run build     # dist/PenguinQuest.html (single file), dist/pwa (installable), dist/artifact
npm run dev       # unminified build with the playtest helpers on window.T and G.dev
npm run check     # quest sites on sensible terrain and not crowding each other
node tools/shoot.mjs <plan.mjs> --size 1366x768   # drive the dev build in headless Chrome, save screenshots
```

A shoot plan exports `default async (page) => {...}` and uses `page.eval(js)`, `page.shot(name)` and
`page.wait(ms)`; screenshots land in `.cache/shots`.

`npx http-server dist` (or any static server) serves the build locally; the dev build is at
`/PenguinQuest.html` and the installable version at `/pwa/`.

Pushing to `master` runs the tests, builds, and publishes `dist/pwa` to GitHub Pages.

## Layout

- `src/world` terrain, sky, water, landmarks and the layout that places everything
- `src/actors` the player, penguins, Glooms and camera
- `src/math` fractions, answer checking, the 61 skill generators and the adaptive tutor
- `src/game` quest data and engine, mini-games, screens and saving
- `src/ui` HUD, dialog, quiz panel and toasts
- `tools` content checks, the layout map, the icon generator and the headless screenshot runner
- `docs/superpowers/specs` design documents, including the plan for the grade 5 and 6 books
