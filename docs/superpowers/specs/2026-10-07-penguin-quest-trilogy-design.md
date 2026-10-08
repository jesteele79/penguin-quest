# Penguin Quest Trilogy: Design

Three stories, one per grade (4, 5, 6). Each unlocks only after the previous one is finished and its math
is mostly mastered. The math climbs in a continuous progression, so a child who finishes Book 1 starts Book 2
already holding the ideas it builds on, and reaches grade 6 work without a sudden jump.

Status: draft for review. Builds on `2026-09-25-penguin-quest-design.md` (Book 1 as shipped).

## Goals

1. **Three complete adventures**, each as deep as Book 1: a new world, map, cast, music, mini-games and
   story, roughly 6 to 8 hours of main story plus side content each.
2. **A real learning progression**, aligned to Common Core grades 4, 5 and 6, where every book reviews the
   previous grade's capstone skills and previews the next grade's entry skills.
3. **Teach, not only practise.** A child meets ideas he has not seen in school yet. Each new skill gets a
   short interactive lesson built on the strongest evidence for this age group.
4. **Feels like a premium console or tablet game** on a Chromebook (see Presentation quality).
5. **One continuous child profile.** Name, wardrobe and the mastery record carry across all three books.

Non-goals: multiplayer, accounts, in-app purchases, grades below 4 or above 6.

## Series structure

| | Book 1 | Book 2 | Book 3 |
|---|---|---|---|
| Title (working) | Aurora Rescue | The Ember Isles | Skyreach |
| Grade | 4 | 5 | 6 |
| Element | Ice | Fire and sea | Sky |
| World | Snowy island at night, glowing lake, aurora | Bright volcanic archipelago by day into sunset: lagoons, basalt, hot springs, rope bridges | Pastel sky islands above a cloud sea, the Starwell observatory, a sunrise finale |
| Great Light (a piece of the Star Map) | The Aurora | The Heart-Ember inside Mount Ember | The Starwell's constellation |
| Mentor | Professor Waddlesworth | Tortuga, an ancient sea-turtle navigator (the Professor has sailed ahead and only reaches you by a crackly radio) | Guildmaster Astra, a tall emperor penguin, the Professor's old partner |
| Friends | Mo, Lulu, Sunny and the bay | Isa, a Galápagos penguin; Shelldon, a hermit crab who trades shells | The kids as junior astronomers, the chick buddy |
| Rival | none | Rocco, a rockhopper with a spiky crest, racing to be Tortuga's apprentice | Rocco, now co-pilot |
| Friend-to-be | The Gloom King, lonely | Cinder, an inventor stealing volcano steam for his airship, for a sympathetic reason; escapes | The Hush, a cloud that swallows light and sound because loud things once frightened it; Cinder changes sides and his airship becomes the team's base |
| The child's role | Helper | Navigator | Leader |
| What the math does | Repairs | Navigates and builds | Designs and predicts |
| Core new math | Multi-digit ×÷, fraction equivalence, angles | Unlike fractions, decimal operations, volume, coordinate plane, expressions | Ratios and rates, negative numbers, equations, statistics |

Each book's plot is complete on its own (the *Avatar* model: one element per book, one arc running through
all three). Story stays thin and is shown through the world changing: research on learning games found thin
stories beat medium-depth ones, and several play sessions beat one
([Clark et al. 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4748544/)).

### Series mystery: "Who broke the Star Map?"

- **Book 1 clues** (cheap to add now): a gap in the Professor's telescope star chart, the Professor's cracked
  star badge, and the Glimmer King calling the Glooms "lost starlight".
- **Book 2:** the star compass is missing some of its houses, Cinder's blueprints carry the same star badge,
  and the book ends on "Find the Observatory."
- **Book 3 payoff:** long ago a quarrel in the old star guild (the Professor and Astra) shattered the Star
  Map into the aurora crystals, the volcano's Heart-Ember and the sky islands. The math from all three books
  rebuilds it, the old friends make up (echoing the Glooms), and the final constellation is a penguin. The
  child becomes the first new Wayfinder.
- The cast grows rather than resets: the Professor appears in all three, the Glimmer King and Cinder return
  as allies, Rocco goes from rival to co-pilot.

### Unlocking the next book

The next book opens when both are true:

1. The current book's final chapter is complete.
2. At least **80% of that grade's skills are mastered** (same mastery rule the tutor already uses).

If the story is done but mastery is short, the title screen shows "Almost there!" with the remaining
skills, and the Training Grounds (crystal practice and Legend Trials in Book 1) point straight at them.
A grown-up can unlock a book from *For grown-ups* (for example, after a school placement test).

### The invisible ramp

Each book has three phases of math, so grade changes happen inside a story rather than between them:

- **Opening chapters:** previous grade's capstone skills, as review (fast, confidence-building).
- **Middle chapters:** this grade's core skills.
- **Final chapters and Legend content:** first contact with the next grade's entry skills, introduced
  through lessons.

Book 1's festival Legend Trials, for example, become the first place a child meets adding unlike
fractions and decimal place value to thousandths, so Book 2's first chapter feels like familiar ground.

## Curriculum map

Existing skill ids are in `code` font; **new** marks skills to add. Grade is the Common Core grade.
"Review" rows open each book; "preview" rows close it.

### Book 1: grade 4 (existing content, tightened)

| Subject (region) | Review (grade 3) | Core (grade 4) | Preview (grade 5) |
|---|---|---|---|
| Multiply & divide (Glimmer Lake) | `mul_facts`, `div_facts` | `mul_2x1`, `mul_word`, `mul_multi1`, `mul_2x2`, `div_rem`, `div_multi`, **multistep word problems (4.OA.3)** | `mul_3x2` |
| Fractions (Crystal Grove) | `frac_identify` | `frac_equiv`, `frac_compare`, `frac_add_like`, `frac_fill`, `frac_simplify`, `frac_mixed`, `frac_times_whole`, **fraction word problems (4.NF.3d)** | `frac_add_unlike` |
| Decimals & money (Heart Huts) | | `dec_frac`, `dec_compare`, `money`, **tenths + hundredths (4.NF.5)** | `dec_place` |
| Geometry & measurement (Glacier Cave) | `perimeter`, `area_rect` | `angle_type`, `convert`, `area_missing`, `angle_add`, **measure angles with a protractor (4.MD.6)**, **lines of symmetry (4.G.3)**, **classify shapes (4.G.2)** | `volume` |
| Number sense & algebra (Gloom Ridge) | | `place_value`, `rounding`, `addsub_multi`, `factors`, `patterns` | `order_ops` |
| Data (telescope) | `read_bar` | `line_plot` | |

Change from today: Book 1 currently adapts across grades 4 to 6. In the trilogy it caps at grade 4 plus
the preview skills, and grade 5 and 6 skills move to Books 2 and 3.

### Book 2: grade 5

| Subject | Review (grade 4) | Core (grade 5) | Preview (grade 6) |
|---|---|---|---|
| Multiply & divide | `mul_2x2`, `div_multi` | `mul_3x2`, `div_2digit`, `mul_dec`, `div_dec`, **place-value patterns ×10 (5.NBT.1)** | **long division fluency (6.NS.2)** |
| Fractions | `frac_equiv`, `frac_add_like` | `frac_add_unlike`, `frac_of_whole`, `frac_mult`, `frac_div_unit`, **fraction as division (5.NF.3)**, **scaling: does it grow or shrink? (5.NF.5)**, **fraction word problems (5.NF.2, 5.NF.6)** | `frac_div` |
| Decimals & place value | `dec_compare`, `money` | `dec_place`, `pow10`, `dec_round`, `dec_addsub`, **compare to thousandths (5.NBT.3b)** | **decimal fluency, all four operations (6.NS.3)** |
| Geometry & measurement | `area_rect`, `convert` | `volume`, `coord`, **volume with unit cubes and composite boxes (5.MD.3-5c)**, **multi-step conversions (5.MD.1)**, **shape hierarchy (5.G.3-4)** | `area_tri` |
| Expressions & patterns | `patterns`, `factors` | `order_ops`, **write and read expressions (5.OA.2)**, **two patterns graphed together (5.OA.3)** | `exponents` |
| Data | `line_plot` | **line plots with fraction data, redistributing to an equal share (5.MD.2)** | `mean` |

### Book 3: grade 6

| Subject | Review (grade 5) | Core (grade 6) |
|---|---|---|
| Ratios & rates (new main subject) | `frac_of_whole`, `dec_addsub` | `ratio`, `unit_rate`, `percent`, **ratio language (6.RP.1)**, **ratio tables and double number lines (6.RP.3a)**, **rate and speed problems (6.RP.3b)**, **converting units with ratios (6.RP.3d)** |
| Number system | `div_2digit`, `frac_div_unit` | `frac_div`, `gcf_lcm`, `integers`, **long division fluency (6.NS.2)**, **decimal fluency (6.NS.3)**, **opposites and absolute value (6.NS.6-7)**, **four-quadrant coordinate plane and distance (6.NS.6c, 6.NS.8)** |
| Expressions & equations | `order_ops` | `exponents`, `write_expr`, `eval_expr`, `one_step`, **equivalent expressions and the distributive property (6.EE.3-4)**, **inequalities on a number line (6.EE.8)**, **dependent and independent variables (6.EE.9)** |
| Geometry | `volume`, `coord` | `area_tri`, `surface_area`, **area of composite polygons (6.G.1)**, **volume with fractional edges (6.G.2)**, **polygons on the coordinate plane (6.G.3)**, **nets (6.G.4)** |
| Statistics | line plots | `mean`, `median_mode_range`, **statistical questions (6.SP.1)**, **dot plots, histograms, box plots (6.SP.4)**, **spread: IQR and mean absolute deviation (6.SP.3, 6.SP.5c)** |

Totals: today 61 skills. Roughly 8 new for grade 4, 12 for grade 5 and 20 for grade 6, about 100 in all.
Every new generator follows the existing contract (three tiers, distractors with "why" feedback, hint,
worked steps, visual model where useful) and gets the same 300-seed test coverage.

## Teaching new ideas: the Lesson system

Book 1 practises. The trilogy also teaches. The first time the tutor is about to serve a skill the child has
never seen (and that is not assumed known from an earlier grade), the game runs a short **Lesson** first,
two to four minutes, led by a character in the story.

### Evidence it rests on

- **Concrete, then pictures, then numbers** (the concrete-representational-abstract sequence): the child
  handles an object, sees a picture of it, then writes the numbers.
- **Number lines for fractions, decimals and negative numbers**: a central recommendation of the What Works
  Clearinghouse guide [Developing Effective Fractions Instruction](https://ies.ed.gov/ncee/wwc/practiceguide/15).
- **Visual representations for word problems**: tape (bar) diagrams before equations, per
  [Improving Mathematical Problem Solving in Grades 4 Through 8](https://ies.ed.gov/ncee/wwc/practiceguide/16).
- **Worked examples that fade** (cognitive load research): one fully solved example, one with the last step
  blank, one with two steps blank, then independent problems.
- **Interleaved and spaced practice after the lesson**: a
  [cluster-randomized trial of 787 students](https://Www.Gwern.net/doc/psychology/spaced-repetition/2019-rohrer.pdf)
  found mixed practice beat blocked practice a month later (61% vs 38%). The tutor already mixes
  skills and schedules retries; lessons feed into that.
- **Intrinsic integration**: math is the game action, not a quiz in front of it
  ([Habgood and Ainsworth](https://eprints.nottingham.ac.uk/10385/1/Habgood_2007_Final.pdf)).

### Lesson shape

1. **Hook** (one or two dialog lines): why the story needs this idea right now.
2. **Explore** (concrete): drag, stack, fold or balance a manipulative. No wrong answers yet.
3. **See** (representational): the same situation drawn as a model that stays on screen.
4. **Watch** (worked example): the character solves one, step by step, model and numbers linked.
5. **Finish it** (faded examples): the child completes the last step, then the last two.
6. **Try** (two guided problems): instant feedback, hint on the first miss, worked solution on the second.
7. Back to the adventure. The skill joins normal practice with extra early retries.

Every lesson is replayable from a **Lesson Library** tab in the journal, and listed in the grown-ups
report so a parent can see what was taught and when.

### Manipulatives (built once, reused across books)

| Manipulative | Skills it teaches |
|---|---|
| Fraction strips (drag, split, line up) | equivalence, comparing, adding unlike fractions, fraction × fraction |
| Zoomable number line | fraction and decimal magnitude, rounding, negative numbers, inequalities |
| Area-model grid | multi-digit multiplication, fraction × fraction, distributive property |
| Place-value chart with sliding digits | ×÷ by 10s, decimal place value, thousandths |
| Base-ten blocks | regrouping, long division as sharing |
| Unit-cube builder | volume, composite volume, fractional edges |
| Tape diagram builder | word problems, ratios, percents |
| Ratio table / double number line | rates, unit rates, unit conversion |
| Balance scale | one-step equations, equivalent expressions |
| Coordinate plotter (1 and 4 quadrants) | coordinates, distance, polygons, graphing patterns |
| Dot plot / box plot builder | distributions, median, IQR, mean as fair share |
| Net folder | nets, surface area |
| Protractor | measuring and drawing angles |

## Book 2: The Ember Isles (grade 5)

**Premise.** Weeks after the festival, the bay's water turns cold out of season. The Professor follows the
warm current south to the Ember Isles and his radio calls start cutting out. The volcano's Heart-Ember is
cooling: without it the warm current stops and the islands drift apart. Someone is siphoning its steam:
Cinder, an inventor penguin powering an airship to search for his lost home. He escapes at the end, with
the child's sympathy, setting up Book 3.

**Cast.** Tortuga (ancient sea-turtle navigator, mentor; real turtles navigate by two magnetic readings,
which becomes a coordinate mechanic), the Professor (crackly radio), Isa (a Galápagos penguin, the only
penguin that lives north of the equator, who nests in rock cracks and pants to cool off), Shelldon (a hermit
crab who trades shells), Rocco (rockhopper rival), Cinder (friend-to-be), Chef Marlo (harbor cook, recipe
scaling).

**Math as the action.** Grid coordinates on the sea chart steer the boat; volume fills hot-spring pools and
sizes crab shells; adding unlike fractions mends rope-bridge planks; the star compass has 32 houses of
11.25° each (from Polynesian wayfinding, credited in the game, with no tiki or sacred imagery).

| Chapter | Region | Subject | Signature activities |
|---|---|---|---|
| Prologue | Arrival Beach | Review of grade 4 | Sail in, meet Nori, warm-up |
| 1 | Forge Volcano | Multiply & divide | **Lava Forge** (pour glass into molds sized by products), **Cart Split** (route ore with long division) |
| 2 | Coral Reef | Fractions | **Reef Restore** (grow coral with fraction strips), snorkel gates, **Recipe Scaling** with Marlo |
| 3 | Harbor Market | Decimals & place value | **Cargo Scales** (weigh to thousandths), ferry timetable puzzles |
| 4 | Sunken Temple | Volume & coordinates | **Block Temple** (build with unit cubes), coordinate dives |
| 5 | Lighthouse Cliffs | Expressions & patterns | **Signal Lamps** (expressions as light codes), graph two patterns to aim the beam |
| 6 | Ember Heart | Mixed | Race against Cinder, then rekindle the Heart *together* |
| 7 | Festival of Currents | Legend Trials (preview grade 6) | Lantern boats, ferry race, first Wayfinder map piece |

Side content: tide charts (data), sea glass collecting, ferry time trials, Cinder's challenge races,
a sea-turtle hatchling rescue, the Wardrobe (snorkel masks, sun hats, surfboards in place of sleds).

## Book 3: The Starwell (grade 6)

**Premise.** The two map pieces point up the tallest mountain to the Starwell, the observatory that keeps
the stars in their places. The sky islands around it are drifting and the stars over the bay are going
quiet. The Hush, a vast soft cloud, is swallowing light and sound because loud things once frightened it.
The child learns to navigate by ratios, altitude and data, calms the Hush, and completes the Star Map.

**Cast.** Guildmaster Astra (Starwell keeper, mentor, the Professor's old partner), the Glider Guild
(Captain Swoop and cadets), Rocco (co-pilot), Cinder (now a friend; his airship is the team's base), the
Professor and the Glimmer King (allies), Tock (a clockwork owl, comic relief), the Hush.

**Math as the action.** Glide ratio decides which island you land on; height above and below the cloud sea
and summit temperatures teach negative numbers; the star map uses all four quadrants; equations balance
floating islands; the mean, median and mean absolute deviation of star brightness pick the clearest night.

| Chapter | Region | Subject | Signature activities |
|---|---|---|---|
| Prologue | Base Camp | Review of grade 5 | Cable-car ride up, meet Vela |
| 1 | Wind Gardens | Ratios & rates | **Glider Trials** (speed and rate gates), **Kite Mix** (ratio tables) |
| 2 | Cloud Valleys | Negative numbers | **Altimeter** (rise and dive above and below the cloud line), four-quadrant sky charts |
| 3 | Clockwork Observatory | Expressions & equations | **Balance Gears** (solve to turn the gears), inequality gates |
| 4 | Crystal Workshop | Geometry | **Net Folding** (build kites and lanterns from nets), composite floor plans |
| 5 | Star Guild | Statistics | **Star Survey** (collect brightness data, build dot and box plots), find the odd star |
| 6 | The Starwell | Mixed | Calm the Hush, mostly through listening and patterns rather than battle |
| 7 | Night of a Thousand Stars | Legend Trials | Star Map complete, the child becomes a Wayfinder |

## Architecture

The engine stays; content becomes per book.

```
src/
  engine/            today's core, world, actors, ui (renamed, unchanged in spirit)
  math/              skills grouped by subject, not by Book 1 region
    subjects/        muldiv, fractions, decimals, geometry, algebra, ratios, data
    lessons/         lesson scripts (pure data) + manipulative components
  books/
    book1/  layout, biome, quests, cast, shop, minigames, music themes
    book2/  ...
    book3/  ...
  game/              quest engine, activities, screens, saves (book-aware)
```

Key changes:

- **Subjects, not regions.** Today a skill's `domain` is a Book 1 region id (`lake`, `grove`...). Domains
  become subject ids and each book maps its regions to subjects. The tutor is shared across books.
- **Biome-driven world builder.** Terrain, palette, sky, water, vegetation and landmark sets become
  parameters so each book can build a distinct world from the same systems.
- **Save v3.** One profile (name, look, wardrobe, settings, tutor mastery record) plus one block per book
  (quests, world flags, collections). Existing v2 saves migrate into Book 1 with chapter progress intact.
- **Only the active book is built in memory.** All three ship in the single offline file (they are code,
  not assets; estimated 2.5 to 3 MB total), but only one world is constructed at a time.
- **Lessons and manipulatives are DOM/SVG components** in the quiz panel style, unit-testable in Node like
  the rest of `math/`.

## Presentation quality

From three research reports (interface, art and audio, graphics and performance), applied to Book 1 first so
Books 2 and 3 inherit them.

### Art direction

- **Stylized, not realistic.** In learning games, diagram-like (effect 0.48) and cartoon (0.32) visuals beat
  realistic ones (−0.01) ([Clark et al. 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4748544/)). The
  premium feel comes from lighting, animation and "juice", not detail.
- **Constant across books:** the hero and scarf, the gold road (gold always means progress), the crystal-lock
  shape, rim-lit shading, the interface. **Per book:** fog, sky and rim colours, shape family, the
  collectible (snowflake, shell, feather), the music.

| | Book 1 | Book 2 | Book 3 |
|---|---|---|---|
| Light | Night | Saturated day into sunset | Pastels above the clouds, sunrise finale |
| Palette | navy `#1e2746`, snow `#f2f7ff`, aurora `#4dffa0` `#b483ff`, gold `#ffd166` | lagoon `#2ec4b6`, jungle `#3a9d5d`, basalt `#2b2d42`, lava `#ff6b35`, sand `#f4d6a0` | cloud sea `#a9b8ff`, lilac `#c9b6ff`, dawn `#ffb38a`, starlight `#ffd86b`, twilight `#2d2a6e` |
| Shapes | Domes and drifts; crystals are the only sharp shapes | Hexagons (basalt, shells) and S-curves (waves, rope bridges) | Spires, rings and orbits, floating inverted cones |
| Main landmark | Aurora Spire | Mount Ember (plume leans downwind, a sailing cue) | Starwell dome with a sweeping beam |

Every character must read as an all-black silhouette; hazard colours always come with a shape (about 1 in
12 boys is colour-blind).

### Characters: cute and capable

Baby-schema proportions (done): head nearly as big as the body, big low-set glossy eyes with two
catchlights, small beak, blush, heart-shaped face, short round flippers. Next:

- Plush shading (half-Lambert wrap lighting) and a warm rim on the face; a jiggling head tuft.
- Eyes lead and the head follows about 0.15 s later; pupils grow when happy; `^ ^` eyes for delight;
  occasional double blinks and eye darts.
- Toddler waddle (about ±10° roll), squash and stretch on every hop with a late head bobble, an idle sequence
  (breathe, look around, preen, yawn, sit, nap), a flipper-flap spin-hop for a correct answer.
- Idle glance toward the current objective (a wordless hint, as in *Wind Waker*).
- Witty lines, real skill, no baby talk. Children's own preferences show no drop in liking cute characters
  between ages ([Disney Research](https://studios.disneyresearch.com/2016/06/21/designing-animated-characters-for-children-of-different-ages/)).

### Interface

- **Every input reacts within a frame:** press squash, one sound family with slight pitch variation,
  separate Music, Effects and Voice volumes.
- **Motion tokens and a reduced-motion mode** that follows the ChromeOS setting and turns off shake and
  freeze-frames.
- **Cheap on the GPU:** only `transform` and `opacity` animate; no `backdrop-filter` over the 3D view; the 3D
  loop pauses behind full-screen menus.
- **Readable:** Atkinson Hyperlegible Next for body text and numbers (rounded display font for titles only),
  text sizes for 1366×768 (dialog 22 px, question 26–28 px, answers 36 px, nothing under 16 px), a Text Size
  setting (100/125/150%), an Easy Reading mode (wider spacing, cream panels). Dyslexia "fonts" are not used:
  OpenDyslexic gave dyslexic children no benefit ([Wery and Diliberto](https://pmc.ncbi.nlm.nih.gov/articles/PMC5629233)).
- **Right and wrong** shown by icon, motion and sound as well as colour, using blue/orange rather than
  red/green; no buzzers, no timers by default.
- **A quieter HUD** (BOTW's "only essential UI"): coins and stars appear when they change; the objective
  shows large when it changes, then shrinks; interaction prompts float above the thing itself.
- **One message at a time:** toasts and banners queue and never cover dialog or a quiz; a message log.
- **The answer moment:** a brief freeze on a correct answer, squash on the answer box, particles, a chime that
  climbs with a streak, coins that fly to the counter. A wrong answer gets a gentle shake and a pulsing hint
  button, and the retry is free.
- **Dialog rebuilt:** at most three lines per page, letter-by-letter text with a per-character voice blip,
  key words coloured and bold, text speed setting, a recent-chats log.
- **Read-aloud everywhere**, reading math like a teacher ("three fourths", "two and one third", "negative
  five"), preferring on-device voices so it works offline.
- **A structured math answer box:** stacked fraction and mixed-number layouts; `/` moves to the bottom
  number, a space after a whole number starts a mixed number; an on-screen keypad in tablet mode.
- **Every input device:** keyboard and trackpad, touch (a joystick that appears under the thumb, tap bubbles
  to interact), and game controllers with rumble; prompts match the device last used.
- **One Explorer's Notebook** (Map, Journal, Wardrobe, Settings, Grown-ups) replaces separate screens.

### Sound and music

- **Adaptive music:** a bar clock drives layers (pad, bass, percussion, arpeggio, lead) whose volumes follow
  intensity; mood changes land on the next downbeat with a one-bar sting.
- **Musical sound effects** in the current key: streak chimes climb the scale, a wrong answer is a soft note in
  key, music ducks under quizzes.
- **Synthesis:** FM bells and marimba, Karplus-Strong plucks rendered ahead of time, generated reverb; no
  Tone.js (it duplicates `audio.js` at 77 KB gzipped).

| | Book 1 | Book 2 | Book 3 |
|---|---|---|---|
| Mode | D major pentatonic; Lydian for aurora moments | G Mixolydian; Dorian at the volcano | E Lydian |
| Tempo | 70–80 BPM, 4/4 | 100–112 BPM, 3-3-2 | 88–96 BPM, 6/8 |
| Voices | FM music box, glassy pads | FM marimba, steel pan, plucked ukulele, log drums | Breathy flute, harp, vowel choir, chimes |
| Adapts by | Each restored aurora band adds a layer | Bridges add marimba | Altitude adds layers; gliding adds strings |

One four-bar hero theme is re-harmonised for each book; the Book 3 finale plays all three versions together.

### Graphics and performance

Measured on a dev build (1366×768): High draws 212 calls and 526k triangles, Low 117 and 319k; the shadow
pass alone is 81 draws and 207k triangles, mostly the 720 pines across the whole island. Hiding a lantern
light or changing preset recompiles 16–30 shader programs (0.16–0.7 s freezes), and those changes fire
exactly when auto-quality steps down. Target hardware runs from a UHD 600 or Mali-G52 (Low) through 24-EU
UHD or Mali-G57 (Medium) to Chromebook Plus (High); at 1080p a floor GPU has roughly 1,000 FLOPs per pixel
per frame, so the look must come from material shading rather than post passes.

- **No runtime shader compiles:** lights fade by intensity, never `visible`; shadow type and render path
  stay the same across presets; variants are pre-compiled behind the boot screen.
- **Auto-quality on real frame cost** (CPU tick time plus GPU timer queries, 90th percentile over about 3 s,
  hysteresis, steps back up after headroom), render scale in ±10% steps before preset changes, a starting tier
  from the GPU name, Low locked at 30 fps.
- **Pixel budget, not device pixel ratio:** Low 0.45 MP, Medium 0.8 MP, High 1.4 MP.
- **Static shadows baked** into the terrain colours (the moon never moves); the shadow map only carries
  characters and nearby props in a box around the player.
- **One stylized material:** wrap lighting, a soft three-to-four band ramp, blue-violet shadow sides and the
  rim light; sky-matched height fog that pools in hollows; colour grading inside tone mapping (Neutral curve,
  lift and gain, split toning, vignette) so Low and Medium get it for free; aurora-reactive mood colours.
- **High keeps antialiasing:** the bloom path renders into a multisampled target.
- **Signature surfaces:** sparkling snow with a moon sheen; water with shoreline foam and a moon glitter path.
- **Stay on WebGL** (WebGPURenderer measured about twice the CPU cost per frame in r183).

| | Low | Medium | High |
|---|---|---|---|
| Typical GPU | UHD 600/605, Mali-G52/G72 | 24-EU UHD, Mali-G57 | Chromebook Plus |
| Pixels | 0.45 MP | 0.8 MP | 1.4 MP |
| Frame rate | locked 30 | 60, fallback 30 | 60 |
| Shadows | baked + blobs | baked + 1024 character map | baked + 2048 character map |
| Post | grading in tone mapping | grading in tone mapping | bloom + grading |
| Draw calls / triangles | ≤90 / ≤150k | ≤140 / ≤300k | ≤200 / ≤500k |

## Delivery phases

Each phase ends playable, tested and deployed.

1. **Foundation**: subjects refactor, save v3 with migration, book select on the title screen, unlock rule,
   Book 1 capped to grade 4 plus previews, new grade 4 skills.
2. **Lessons**: lesson runner, the first six manipulatives (fraction strips, number line, area model,
   place-value chart, tape diagram, unit cubes), lessons for every new grade 4 and grade 5 skill,
   Lesson Library. Book 1 benefits immediately.
3. **Presentation pass**: the highest-value interface and graphics recommendations, applied to Book 1 first
   so Books 2 and 3 inherit them. The parent has approved replacing any existing screen, HUD element,
   material or effect outright when the research supports something better; nothing is kept just because
   it already exists.
4. **Grade 5 skills, then Book 2**: world, cast, story, mini-games, music.
5. **Grade 6 skills, remaining manipulatives, then Book 3.**

## Testing

- Math: every skill, tier and answer format over 300 seeds (existing harness), plus lesson scripts checked
  for consistent models and answers.
- Story: the automated playthrough used in playtest round 3 (dev harness drives each chapter, mini-game and
  cutscene) runs per book and must finish with no errors.
- Progression: simulated students (strong, average, struggling) confirm each book takes the intended
  number of problems and that unlock gates are reachable.
- Performance: frame-time budget checks per quality preset on a low-end profile.

## Decisions for the parent

1. Book settings and titles above, or other ideas he would love (he could help name things).
2. Unlock threshold: 80% of the grade's skills mastered, with grown-up override.
3. Daily pacing: keep one chapter per day as the default in Books 2 and 3?
4. If he is already strong at grade 4, allow a grown-up placement check to start Book 2 early?

## Status (October 2026)

Phases 1 to 4 are done and deployed; Book 2 is playable from start to finish.

**Built for Book 2, and where it differs from the plan above:**

- One volcanic main island (Arrival Beach, Forge Volcano, Coral Lagoon, Harbor Market, Lighthouse Cliffs)
  plus the Sunken Temple islet on a sandbar; Mount Ember's crater is the Ember Heart. Its own sky (warm
  sunset dome), sea, plants, cast models (Tortuga the turtle and Shelldon the crab are their own critters)
  and Sootlings in place of Glooms.
- Chapter games as built: Rocco's siphon valves, the **Lava Hop** (stepping stones over a lava pool to the
  forge vent's island; it stays as a bridge), Rocco's glass orders, the coral beds, the **Snorkel Trail**
  (answer rings through the lagoon; the reef fish that follow you settle at the vent), Chef Marlo's kelp
  recipe, cargo scales and deliveries, Tortuga's sea-chart dive and the Temple Builder, the signal lamps
  and the Sootling battle at the old lookout, the siphon machine on the crater rim, the Legend Trials and
  the Festival of Currents. The "Cart Split" and ferry time trials were not built; the Lava Hop and the
  snorkel trail took their place as the action games.
- Shared systems read the active book: terms (vents, sea glass, Sootlings, Island Patrol), the market,
  builder, slalom and battle titles and skill lists, word-problem and lesson wording, lesson mentors
  (Book 1's teachers hand their lessons to the island friend who looks after the same subject), the
  wardrobe's shopkeeper and the music palette (steel drum, marimba, calypso bass, surf ambience).
- Book switching is diegetic: when a book opens, a banner announces it once, the free-play objective
  points to Captain Flipper, and he sails the penguin there (and back) from the dock. The title screen's
  shelf can switch books too.
- Book 3 is named **Skyreach** in the game; Cinder's last lines in Book 2 point to it.

**Next:** grade 6 skills and lessons (ratios and rates, negative numbers, expressions and equations, area
and nets, statistics), then Book 3's world, cast, story and games.
