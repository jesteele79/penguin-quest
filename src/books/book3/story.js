// Book 3, Skyreach: every chapter, side quest and line of dialogue. Same format as the other books: lines are
// [speakerId, text]; speaker '' is narration; {name} becomes the player's name. Quest sites and quizzes name
// subjects (domains), while chapters name the five island slots (regions) the engine keeps.
import { CRYSTALS, LOC, FESTIVAL, PINWHEELS, GAUGES, GEARS, PRISMS, SCOPES } from './layout.js';

export const RESONANCE_NEED = 24;
export const CRYSTAL_GOAL = 8;

export const SITE_SETS = {
  pinwheels: { kind: 'pinwheel', points: PINWHEELS, label: 'Balance the pinwheel', title: 'Wind Pinwheel', domain: 'ratios', count: 2 },
  gauges: { kind: 'gauge', points: GAUGES, label: 'Read the cloud gauge', title: 'Cloud Gauge', domain: 'neg', count: 2 },
  gears: { kind: 'gear', points: GEARS, label: 'Set the gear', title: 'Clock Gear', domain: 'ridge', skills: ['one_step', 'eval_expr', 'equiv_expr', 'write_expr', 'inequality', 'var_table', 'exponents'], count: 2 },
  prisms: { kind: 'prism', points: PRISMS, label: 'Shape the prism', title: 'Crystal Prism', domain: 'cave', count: 2 },
  scopes: { kind: 'scope', points: SCOPES, label: 'Aim the telescope', title: 'Star Telescope', domain: 'stars', count: 2 },
  legends: {
    kind: 'lantern', label: 'Begin the Legend Trial', title: 'Legend Trial', count: 6, hard: true,
    points: ['lake', 'grove', 'huts', 'cave', 'ridge'].map((r) => [CRYSTALS[r].x + 5, CRYSTALS[r].z + 4]),
    regions: ['lake', 'grove', 'huts', 'cave', 'ridge'],
    domains: ['ratios', 'neg', 'ridge', 'cave', 'stars'],
  },
  invites: {
    kind: 'npc', quiz: false, npcs: ['professor', 'vela', 'swoop', 'tock', 'rocco', 'astra', 'nimbus', 'cinder'], label: 'Invite to the festival', title: 'Invitation',
    greet: {
      professor: 'The Night of a Thousand Stars! I have waited my whole life to see the Star Map with my own eyes.',
      vela: 'I will fly the lantern kite at the front of the parade. Captain Swoop says I am finally ready!',
      swoop: 'A festival? The Glider Guild will fly a loop for every star. Well, maybe not every star. A lot of stars.',
      tock: 'Tick! A celebration! I have been winding myself up all week for this. Tock!',
      rocco: 'I made a glass lantern for every penguin on the islands. Okay, I made eleven. Eleven is a lot of lanterns.',
      astra: 'For the first time in a hundred years, every star will be in its place. I would not miss it.',
      nimbus: 'Cloud candy for everyone! Pink, blue, and a brand-new flavor: starlight.',
      cinder: 'The airship has lights all over it now. And the workshop has a home again. Thanks to you.',
    },
  },
};

export const MAIN = [
  {
    id: 'ch0', type: 'main', chapter: 0, region: 'home', title: 'Prologue: Guild Town',
    blurb: 'Cinder\'s airship carries you up to the islands in the sky.',
    steps: [
      {
        type: 'talk', npc: 'professor', text: 'Talk to Professor Waddlesworth by his telescope',
        lines: [
          ['professor', '{name}! Welcome to Skyreach! Look down. Go on, look! That fluffy floor is the top of the clouds.'],
          ['professor', 'These islands float above them, and above the islands sits the Starwell, the observatory that keeps the stars in their places.'],
          ['professor', 'But the islands are drifting apart, and the stars over Glacier Bay have been going quiet, one by one.'],
          ['professor', 'Each island has a Star Anchor that holds it steady. Every one of them has gone dim.'],
          ['professor', 'First, some fresh air. Golden sky feathers drift down on the wind here. Can you catch three near the mooring?'],
          ['professor', 'And careful near the edges! If you fall into the clouds, the wind will carry you back, but it is a bumpy ride.'],
        ],
      },
      { type: 'count', counter: 'tutorialFlakes', need: 3, absolute: true, text: (n) => `Catch sky feathers near the mooring (${n}/3)`, target: 'nextTutorialFlake' },
      {
        type: 'talk', npc: 'professor', text: 'Show the Professor your sky feathers',
        lines: [
          ['professor', 'Three! Sky feathers are lost from the great kites of the Glider Guild. They float for days.'],
          ['professor', 'Now, some warm-up puzzles. The ideas up here are big ones, so new ones come with a lesson first.'],
        ],
      },
      {
        type: 'game', game: 'warmup', auto: true, at: 'professor', label: 'Warm-up puzzles', text: 'Finish the warm-up puzzles with the Professor',
        after: [
          ['professor', 'Splendid! Here is your Sky Journal. Press J any time to see your quests.'],
          ['professor', 'Vela, one of the young glider cadets, has been waiting to meet you. And the Glider Guild is at the Wind Gardens, across the bridge to the north-west.'],
          ['vela', 'Hi! You are the penguin who saved the aurora AND the volcano? Wow. Captain Swoop wants to meet you!'],
        ],
      },
    ],
    reward: { coins: 20 },
  },
  {
    id: 'ch1', type: 'main', chapter: 1, region: 'lake', title: 'Chapter 1: The Wind Gardens',
    blurb: 'Captain Swoop\'s gliders cannot fly in a crooked wind.',
    steps: [
      {
        type: 'talk', npc: 'swoop', text: 'Meet Captain Swoop at the Wind Gardens',
        lines: [
          ['swoop', 'Ha! So you are the famous {name}. Captain Swoop, leader of the Glider Guild. Most loops in one flight: forty-two.'],
          ['swoop', 'Since the Star Anchor here went dim, the wind has gone all crooked. My cadets cannot fly straight.'],
          ['swoop', 'The wind pinwheels keep the breeze in balance. Each one needs the right ratio of red blades to blue. Fix two of them?'],
        ],
      },
      {
        type: 'sites', set: 'pinwheels', text: (d, t) => `Balance the wind pinwheels (${d}/${t})`, shard: true,
        after: [
          ['swoop', 'Feel that? A straight, steady breeze! You are a natural.'],
          ['swoop', 'You know what that means: glider wings for you. Hold Space while you fall and you will glide!'],
          ['swoop', 'Now the Glider Trials. Jump off the launch tower and fly through the rings with the right answers.'],
        ],
      },
      {
        type: 'game', game: 'glider', at: 'towerTop', label: 'Start the Glider Trials', text: 'Fly the Glider Trials from the launch tower', shard: true,
        after: [
          ['swoop', 'Every ring! Not bad, cadet. Not bad at all.'],
          ['swoop', 'One more job. My kites need mixing: so many cups of sky silk for so many cups of cloud cotton. Ratios, every one.'],
        ],
      },
      {
        type: 'game', game: 'kitemix', at: 'meadow', label: 'Mix the kite silk', text: 'Mix kite silk in the meadow for Captain Swoop', shard: true,
        after: [['swoop', 'Kites ready to fly! The Star Anchor is by the old windmill. Wake it with ratio and rate puzzles.']],
      },
      { type: 'crystal', region: 'lake' },
    ],
    outro: [
      ['swoop', 'The Wind Gardens are steady again. Come back and race my cadets sometime!'],
      ['professor', 'One anchor relit, {name}! And look up: a new constellation, the Kite. The stars are coming back.'],
    ],
    reward: { coins: 60 },
  },
  {
    id: 'ch2', type: 'main', chapter: 2, region: 'grove', title: 'Chapter 2: The Cloud Valleys',
    blurb: 'Down where the clouds lap at the land, something hushes every sound.',
    briefing: [
      ['professor', 'Good morning, {name}! Vela went down to the Cloud Valleys, south-west of town, to check the cloud gauges.'],
      ['professor', 'The valleys sit right at the cloud line, so some of the land is above it and some is below. Bring a warm scarf.'],
    ],
    briefingNow: [
      ['professor', 'Ready for more, {name}? Vela went down to the Cloud Valleys, south-west of town, to check the cloud gauges.'],
      ['professor', 'The valleys sit right at the cloud line, so some of the land is above it and some is below. Bring a warm scarf.'],
    ],
    steps: [
      {
        type: 'talk', npc: 'vela', text: 'Find Vela in the Cloud Valleys',
        lines: [
          ['vela', 'Shh! Do you hear that? Nothing. Not one bird. Everything down here has gone so quiet.'],
          ['vela', 'We measure heights from the cloud line. Above it is positive, below it is negative. Minus three means three meters under the clouds!'],
          ['vela', 'The cloud gauges tell us if the valleys are sinking. Can you read two of them for me?'],
        ],
      },
      {
        type: 'sites', set: 'gauges', text: (d, t) => `Read the cloud gauges (${d}/${t})`, shard: true,
        after: [
          ['vela', 'The valleys are sinking a little every night. We have to lift the anchor stones!'],
          ['vela', 'There is an old balloon lift by the misty well. Ride it up and down to the heights the gauges show.'],
        ],
      },
      {
        type: 'game', game: 'altimeter', at: 'vale', label: 'Ride the balloon lift', text: 'Ride the balloon lift to the right heights', shard: true,
        after: [
          ['vela', 'The anchor stones are up! But look, little gray puffs are gathering by the stone circle.'],
          ['vela', 'Hushlings. Tiny pieces of the Hush, the great quiet cloud. They are not mean, just shy. Loud things scare them, so they shush everything.'],
          ['vela', 'Answer their puzzles gently and they cheer up. Will you try?'],
        ],
      },
      {
        type: 'game', game: 'battle', at: 'arena', label: 'Cheer up the Hushlings', text: 'Cheer up the Hushlings at the stone circle', shard: true,
        after: [['vela', 'They are humming! Little happy hums! The Star Anchor is on the far rim of the valley. Wake it with negative number puzzles.']],
      },
      { type: 'crystal', region: 'grove' },
    ],
    outro: [
      ['vela', 'The birds are singing again. You did that!'],
      ['professor', 'Two anchors, {name}! A tiny constellation just appeared: the Puffling. Isn\'t it sweet?'],
    ],
    reward: { coins: 60 },
  },
  {
    id: 'ch3', type: 'main', chapter: 3, region: 'huts', title: 'Chapter 3: The Clockwork Observatory',
    blurb: 'The great clock of the sky has stopped. A small owl is very worried.',
    briefing: [
      ['professor', 'Good morning, {name}. The Clockwork Observatory, east of town, keeps time for every star in the sky. It has stopped!'],
      ['professor', 'Its keeper is Tock, a clockwork owl. He is a little bit... wound up. You will see.'],
    ],
    briefingNow: [
      ['professor', 'Onward, {name}! The Clockwork Observatory, east of town, keeps time for every star in the sky. It has stopped!'],
      ['professor', 'Its keeper is Tock, a clockwork owl. He is a little bit... wound up. You will see.'],
    ],
    steps: [
      {
        type: 'talk', npc: 'tock', text: 'Meet Tock at the Clockwork Observatory',
        lines: [
          ['tock', 'Tick! A visitor! Tock! I am Tock. Keeper of the clocks. Winder of the gears. Very, very worried.'],
          ['tock', 'Every gear here turns by an equation. When the anchor went dim, the gears forgot their numbers. Tick!'],
          ['tock', 'Start with the big balance gears in the dome. Make both sides equal and they will turn again. Tock!'],
        ],
      },
      {
        type: 'game', game: 'balance', at: 'dome', label: 'Balance the great gears', text: 'Balance the great gears in the dome', shard: true,
        after: [
          ['tock', 'They turn! They turn! Do you hear that ticking? Music! Tick!'],
          ['tock', 'Four little gears around the island still need setting. Each one shows an expression. Find its value.'],
        ],
      },
      {
        type: 'sites', set: 'gears', text: (d, t) => `Set the clock gears (${d}/${t})`, shard: true,
        after: [
          ['tock', 'Every gear set. Only the clock hands are left. They point by rules: when this many hours pass, the hand moves that many steps.'],
        ],
      },
      {
        type: 'game', game: 'clockfix', at: 'clockFace', label: 'Fix the clock hands', text: 'Fix the great clock hands with Tock', shard: true,
        after: [['tock', 'Time is moving! Tock! The Star Anchor is at the top of the stairs. Wake it with puzzles of equations and expressions.']],
      },
      { type: 'crystal', region: 'huts' },
    ],
    outro: [
      ['tock', 'Tick, tock, tick, tock. Lovely. Thank you, {name}. You have a very well-wound brain.'],
      ['professor', 'Three anchors, and a constellation shaped like a gear! Tock must be thrilled.'],
    ],
    reward: { coins: 60 },
  },
  {
    id: 'ch4', type: 'main', chapter: 4, region: 'cave', title: 'Chapter 4: The Crystal Workshop',
    blurb: 'Rocco is making glass in the sky now. Of course he is.',
    briefing: [
      ['professor', 'Good morning, {name}! Guess who flew up with Cinder? Rocco! He is working at the Crystal Workshop, south-east of town.'],
      ['professor', 'The workshop makes the lenses and lanterns for the whole sky. Its anchor has gone dark too.'],
    ],
    briefingNow: [
      ['professor', 'Still flying, {name}? Guess who came up with Cinder? Rocco! He is at the Crystal Workshop, south-east of town.'],
      ['professor', 'The workshop makes the lenses and lanterns for the whole sky. Its anchor has gone dark too.'],
    ],
    steps: [
      {
        type: 'talk', npc: 'rocco', text: 'Find Rocco at the Crystal Workshop',
        lines: [
          ['rocco', 'Snow penguin! I mean, sky penguin! Ha! I knew you would show up. I got here first, by the way.'],
          ['rocco', 'Sky glass is tricky. Everything has to be measured: areas, volumes, every face of every box.'],
          ['rocco', 'The workshop crates got smashed when the island wobbled. Help me build new ones on the build stones?'],
        ],
      },
      {
        type: 'game', game: 'architect', params: { count: 5 }, at: 'pad', label: 'Build at the workshop', text: 'Build crates and frames with Rocco', shard: true,
        after: [
          ['rocco', 'Solid! Like a rockhopper. Now the prisms. Each one bends starlight, but only if it is cut to the right shape.'],
        ],
      },
      {
        type: 'sites', set: 'prisms', text: (d, t) => `Shape the crystal prisms (${d}/${t})`, shard: true,
        after: [
          ['rocco', 'Look at the rainbows! Okay, last thing: lantern patterns. You fold them flat, like a paper box. They are called nets.'],
        ],
      },
      {
        type: 'game', game: 'nets', at: 'kiln', label: 'Fold the lantern nets', text: 'Fold lantern nets at the kiln', shard: true,
        after: [['rocco', 'Lanterns for the whole sky! The Star Anchor is behind the kiln. Wake it with shape and measuring puzzles.']],
      },
      { type: 'crystal', region: 'cave' },
    ],
    outro: [
      ['rocco', 'Not bad, sky penguin. Not bad at all. Want to race across a bridge? ...Later. Definitely later.'],
      ['professor', 'Four anchors! The Lantern constellation is glowing. Only the Star Guild is left.'],
    ],
    reward: { coins: 60 },
  },
  {
    id: 'ch5', type: 'main', chapter: 5, region: 'ridge', title: 'Chapter 5: The Star Guild',
    blurb: 'Guildmaster Astra needs to find the clearest night in a hundred years.',
    briefing: [
      ['professor', 'Good morning, {name}. Today you meet my oldest friend: Guildmaster Astra of the Star Guild, on the high island to the north-east.'],
      ['professor', 'We studied the stars together when we were young. She keeps the Starwell. Cross from the Clockwork Observatory.'],
    ],
    briefingNow: [
      ['professor', '{name}, today you meet my oldest friend: Guildmaster Astra of the Star Guild, on the high island to the north-east.'],
      ['professor', 'We studied the stars together when we were young. She keeps the Starwell. Cross from the Clockwork Observatory.'],
    ],
    steps: [
      {
        type: 'talk', npc: 'astra', text: 'Meet Guildmaster Astra at the Star Guild',
        lines: [
          ['astra', 'So you are the young one the Professor writes about in every letter. Welcome, {name}.'],
          ['astra', 'The Hush has wrapped itself around the Starwell. It is not angry. It is frightened. Long ago, loud storms scared it, and now it hides every light and every sound.'],
          ['astra', 'To calm it, we need the clearest night we can find. That means data. Start with the telescopes around the guild.'],
        ],
      },
      {
        type: 'sites', set: 'scopes', text: (d, t) => `Aim the Star Guild telescopes (${d}/${t})`, shard: true,
        after: [
          ['astra', 'Good readings. Now we survey: how bright each star is, night after night. The middle and the spread will tell us which night is best.'],
        ],
      },
      {
        type: 'game', game: 'survey', at: 'scope', label: 'Start the star survey', text: 'Survey the stars with Astra', shard: true,
        after: [
          ['astra', 'Tonight is the night. But the Hushlings are scattered all over the islands, shushing the stars. Cheer up four of them.'],
        ],
      },
      {
        type: 'count', counter: 'glooms', need: 4, text: (n) => `Cheer up wandering Hushlings (${n}/4)`, target: 'nearestGloom', shard: true,
        after: [['astra', 'The sky is clearing. Our Star Anchor is by the great telescope. Wake it with statistics puzzles.']],
      },
      { type: 'crystal', region: 'ridge' },
    ],
    outro: [
      ['astra', 'Five anchors. The islands are steady. Now only the Starwell is left, and the Hush around it.'],
      ['professor', 'All five, {name}! Look at the sky. Every constellation is there, waiting to be joined. Tomorrow, the Starwell.'],
    ],
    reward: { coins: 80 },
  },
  {
    id: 'ch6', type: 'main', chapter: 6, region: 'spire', title: 'Chapter 6: The Starwell',
    blurb: 'Calm the Hush, and the Star Map will be whole.',
    briefing: [
      ['professor', 'Good morning, {name}! The Hush has drawn back from the Starwell. The bridge from the Star Guild is open!'],
      ['professor', 'Astra says the Hush does not need to be beaten. It needs to be listened to. Its hums come in patterns.'],
    ],
    briefingNow: [
      ['professor', '{name}, the Hush has drawn back from the Starwell. The bridge from the Star Guild is open!'],
      ['professor', 'Astra says the Hush does not need to be beaten. It needs to be listened to. Its hums come in patterns.'],
    ],
    steps: [
      { type: 'scene', scene: 'wellOpen', auto: true, text: 'The Hush draws back from the Starwell...' },
      { type: 'reach', at: 'wellTop', radius: 10, minY: 44, text: 'Climb to the top of the Starwell', run: 'hush' },
      { type: 'scene', scene: 'starMap', auto: true, text: 'The Star Map comes together' },
      {
        type: 'talk', npc: 'cinder', text: 'Talk to Cinder at the airship',
        lines: [
          ['cinder', 'You did it! The Star Map is whole. And look, {name}: my workshop! It drifted back beside the town in the night.'],
          ['cinder', 'I am home. After all these years, I am actually home.'],
          ['cinder', 'Here, I made you something: a star-hood, like Astra\'s. Every Wayfinder should have one.'],
        ],
        reward: { items: ['hat:starhood'] },
      },
    ],
    outro: [['professor', 'A Wayfinder, {name}! The Star Map is whole, and the stars over Glacier Bay are shining again. I am so very proud of you.']],
    reward: { coins: 200 },
  },
  {
    id: 'ch7', type: 'main', chapter: 7, region: 'festival', title: 'Chapter 7: The Night of a Thousand Stars',
    blurb: 'Light the Legend Lanterns and fly the lantern kites.',
    briefing: [
      ['professor', 'Good morning, {name}! Skyreach wants to celebrate: the Night of a Thousand Stars! And they want you to light the Legend Lanterns.'],
      ['professor', 'Vela has the details. Go and see!'],
    ],
    briefingNow: [
      ['professor', '{name}, the islanders could not wait! They want to celebrate the Night of a Thousand Stars right now.'],
      ['professor', 'Vela has the details. Go and see!'],
    ],
    steps: [
      {
        type: 'talk', npc: 'vela', text: 'Talk to Vela in Guild Town',
        lines: [
          ['vela', '{name}! The festival needs the five Legend Lanterns lit, one beside each Star Anchor.'],
          ['vela', 'They only light for a true Legend. The hardest puzzles in the sky! You can do it.'],
        ],
      },
      { type: 'sites', set: 'legends', text: (d, t) => `Complete the Legend Trials beside each anchor (${d}/${t})` },
      {
        type: 'talk', npc: 'vela', text: 'Tell Vela the lanterns are lit',
        lines: [
          ['vela', 'All five! I could see them glowing from here, like stars on the ground.'],
          ['vela', 'Now invite everyone to the town square. Every friend gets a lantern kite!'],
        ],
      },
      { type: 'sites', set: 'invites', text: (d, t) => `Invite your friends to the festival (${d}/${t})` },
      { type: 'reach', at: 'festival', radius: 9, text: 'Go to the festival in the town square', run: 'festival' },
    ],
    reward: { coins: 300 },
  },
];

export const SIDE = [
  {
    id: 'sq_flakes', type: 'side', giver: 'zephyr', after: 'ch0', title: 'Feather Catchers',
    blurb: 'Zephyr, Comet and Skye collect sky feathers. There are 30 drifting around the islands.',
    offer: [
      ['zephyr', 'We collect sky feathers! Gold ones, from the great kites. There are 30 drifting around the islands.'],
      ['zephyr', 'Bring us 10 and we will give you something that spins!'],
    ],
    steps: [
      { type: 'count', counter: 'flakes', need: 10, absolute: true, turnin: 'zephyr', text: (n) => `Catch sky feathers (${n}/10)`, target: 'nearestFlake', after: [['zephyr', 'Ten! Here, a Propeller Cap, just like mine. Next prize at 20!']], reward: { items: ['hat:propeller'] } },
      { type: 'count', counter: 'flakes', need: 20, absolute: true, turnin: 'zephyr', text: (n) => `Catch sky feathers (${n}/20)`, target: 'nearestFlake', after: [['comet', 'Twenty! You earned the Feather trail. Belly-slide on the grass to see it!']], reward: { items: ['trail:feathers'] } },
      { type: 'count', counter: 'flakes', need: 30, absolute: true, turnin: 'zephyr', text: (n) => `Catch sky feathers (${n}/30)`, target: 'nearestFlake', after: [['skye', 'ALL THIRTY! You are the best feather catcher in the whole sky! Here are 150 fish coins!']], reward: { coins: 150 } },
    ],
  },
  {
    id: 'sq_slalom', type: 'side', giver: 'comet', after: 'ch1', title: 'Meadow Kite Run',
    blurb: 'Belly-slide down the Wind Gardens meadow through answer gates.',
    offer: [
      ['comet', 'Race me down the meadow at the Wind Gardens! The grass is super slidey after rain.'],
      ['comet', 'Before each gate, pick the lane with the right answer: press 1, 2 or 3, or the arrow keys. Right answers make you zoom!'],
    ],
    steps: [{ type: 'game', game: 'slalom', at: 'slalomTop', label: 'Start the kite run', text: 'Race down the Wind Gardens meadow', after: [['comet', 'Whoosh! Race again any time for a better medal!']] }],
    reward: { coins: 30 },
  },
  {
    id: 'sq_stars', type: 'side', giver: 'professor', after: 'ch0', title: 'Sky Charts',
    blurb: 'Solve a set of sky chart puzzles at the Professor\'s table. New charts every day.',
    offer: [
      ['professor', 'Up here the stars are so close I can chart them every night. Would you help with my sky charts?'],
      ['professor', 'There is a fresh chart on my table every day. Finish charts on three different days and I will give you something special.'],
    ],
    steps: [{ type: 'count', counter: 'chartDays', need: 3, absolute: true, turnin: 'professor', text: (n) => `Finish sky charts on 3 different days (${n}/3)`, target: 'easel', after: [['professor', 'Three days of sky charts! This Constellation scarf is for you.']], reward: { items: ['scarf:constellation'] } }],
  },
  {
    id: 'sq_chicks', type: 'side', giver: 'wren', after: 'ch1', title: 'Pufflings Home',
    blurb: 'Eight pufflings wandered from the nesting cliff. Lead them home to Wren.',
    offer: [
      ['wren', 'Oh, my pufflings! Eight of them hopped off to explore, and now they are scattered all over the islands!'],
      ['wren', 'A baby puffin is called a puffling. Isn\'t that the best word? They follow anyone who answers their riddles. Bring them back to my nest, please!'],
    ],
    steps: [{ type: 'chicks', text: (home) => `Lead the pufflings home to Wren (${home}/8)`, after: [['wren', 'All eight! This little one has decided you are its best friend. Take it along from your Wardrobe!']], reward: { items: ['buddy:puffling'], coins: 100 } }],
  },
  {
    id: 'sq_map', type: 'side', giver: 'tock', after: 'ch3', title: 'Tock\'s Star Chart',
    blurb: 'Tock\'s chart has (0, 0) in the middle. Find four treasures in all four quadrants.',
    offer: [
      ['tock', 'Tick! I hid four treasures years ago and wrote down where. On a chart with zero in the MIDDLE. Very clever of me. Tock.'],
      ['tock', 'Open it with M. Left of zero is negative x, below zero is negative y. When you are close, the ground sparkles. Press E to dig!'],
    ],
    steps: [{ type: 'treasure', text: (n, clue) => `Treasure ${n + 1} of 4: ${clue}`, after: [['tock', 'All four! In all four quadrants! Keep this Stardust scarf. Tick!']], reward: { items: ['scarf:stardust'] } }],
  },
  {
    id: 'sq_tourney', type: 'side', giver: 'cinder', after: 'ch1', title: 'Cloud Fishing Derby',
    blurb: 'Fish for sky carp off the airship pier. Catch 10; fewer misses win a better medal.',
    offer: [['cinder', 'Did you know there are fish that swim in the clouds? Sky carp! I hold a little derby off the mooring pier. Catch 10!']],
    steps: [{ type: 'game', game: 'fishing', params: { count: 10, tourney: true }, at: 'fishSpot', label: 'Start the derby', text: 'Catch 10 sky carp in the Cloud Fishing Derby' }],
    reward: { coins: 40 },
  },
  {
    id: 'sq_rush', type: 'side', giver: 'nimbus', after: 'ch3', title: 'Festival Rush',
    blurb: 'Serve 8 customers in a row at Nimbus\'s cloud candy stall.',
    offer: [['nimbus', 'Everybody wants cloud candy today! Serve 8 customers in a row. Fewer mistakes, happier customers, better medal.']],
    steps: [{ type: 'game', game: 'market', params: { count: 8, rush: true }, at: 'counter', label: 'Start the rush', text: 'Serve 8 customers in the Festival Rush' }],
    reward: { coins: 40 },
  },
  {
    id: 'sq_sculpt', type: 'side', giver: 'rocco', after: 'ch4', title: 'Glass Sculpture Contest',
    blurb: 'Make four glass sculptures for the judges at the Crystal Workshop.',
    offer: [['rocco', 'The workshop holds a glass sculpture contest. I always win. Unless you enter. Then... we will see. Four sculptures, exact measures!']],
    steps: [{ type: 'game', game: 'architect', params: { count: 4, sculpture: true }, at: 'pad', label: 'Build for the contest', text: 'Make 4 glass sculptures for the contest' }],
    reward: { coins: 40 },
  },
  {
    id: 'sq_glimmers', type: 'side', giver: 'astra', after: 'ch5', title: 'Little Clouds',
    blurb: 'Cheer up a Hushling at every one of the 8 spots where they drift.',
    offer: [['astra', 'There are 8 places where Hushlings like to hide. Cheer one up at every spot, and they will never be frightened again.']],
    steps: [{ type: 'count', counter: 'gloomSpots', need: 8, absolute: true, turnin: 'astra', text: (n) => `Cheer up a Hushling at every hiding spot (${n}/8)`, target: 'nearestGloom', after: [['astra', 'Every spot. Listen: they are humming together. This little cloud would like to follow you.']], reward: { items: ['buddy:cloudlet'], coins: 100 } }],
  },
];

export const CHATTER = {
  professor: [
    'Emperor penguins are the tallest penguins in the world. Astra is very proud of that.',
    'Press M for the map. The gold star shows where to go next.',
    'If a puzzle feels new, look for the lesson. Every expert was a beginner once.',
    'Check the Sky Patrol board in town. New tasks every day!',
    'Hold Space while you fall to glide. The view from up here is wonderful.',
    'Every constellation is a picture made of points. Like a graph!',
  ],
  cinder: ['Want to fly back down to the sea? Just ask. The airship never gets tired.', 'I fix everything with gears. Up here, so does Tock.'],
  vela: ['Captain Swoop says a good glider pilot always knows how high she is. Even below zero!', 'Chinstrap penguins have a thin black line under the chin, like a helmet strap. That is me!'],
  swoop: ['Forty-two loops. One flight. Write it down.', 'A glider drops a little for every bit it flies forward. That is its glide ratio!'],
  astra: ['A hundred years I have watched these stars. Every one of them is worth it.', 'The Hush is not bad. Being scared just makes you quiet.'],
  tock: ['Tick! Tock! Sorry, I do that.', 'Every equation is a balance. Whatever you do to one side, do to the other!'],
  rocco: ['Sky glass is just sand that got really, really high. And hot.', 'I hopped across every bridge up here. Twice.'],
  nimbus: ['Cloud candy melts on your tongue like snow. Pink is my favorite.', 'Want to try something on? My wardrobe chest is open!'],
  wren: ['A baby puffin is called a puffling!', 'Puffins can flap their wings 400 times a minute. Very busy wings.'],
  zephyr: ['Feathers like high places. Look on top of things!'],
  comet: ['The meadow in the Wind Gardens is the best slide in the sky!', 'I saw a treasure chest near the windmill. I bet there are more!'],
  skye: ['Pufflings are SO fluffy. I want one.'],
};

export const FESTIVAL_SPOT = FESTIVAL;
export const SPIRE_TOP = { x: LOC.spire.x, z: LOC.spire.z + 6 };
