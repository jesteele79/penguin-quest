// Book 1, Aurora Rescue: every chapter, side quest and line of dialogue. The quest engine interprets this data.
// Lines are [speakerId, text]; speaker '' is narration. {name} becomes the player's name.
import { BUOYS, SURVEY, BEACONS, BEDS, SEEDS, CRYSTALS, LOC, FESTIVAL } from './layout.js';

export const RESONANCE_NEED = 24;
export const CRYSTAL_GOAL = 8;

// Each site set belongs to a 'sites' step. kind picks the 3D look (see sites.js).
export const SITE_SETS = {
  buoys: { kind: 'buoy', points: BUOYS, label: 'Relight the buoy', title: 'Buoy Repair', domain: 'lake', count: 2, radius: 4.5 },
  pillars: { kind: 'pillar', label: 'Fill the Fraction Lock', title: 'Fraction Lock', picks: [{ skills: ['frac_fill'] }, { domain: 'grove' }] },
  beds: { kind: 'bed', points: BEDS, label: 'Plant a crystal seed', title: 'Crystal Garden', domain: 'grove', count: 1 },
  cocoa: {
    kind: 'npc', npcs: ['professor', 'captain', 'fern', 'pebble'], label: 'Deliver cocoa', title: 'Cocoa Delivery', story: 'cocoa',
    domain: 'huts', skills: ['money', 'dec_addsub', 'unit_rate', 'percent'], count: 1,
    greet: {
      professor: 'Hot cocoa from Mama Mittens? How thoughtful! Now, let me count my coins...',
      captain: 'Cocoa! Just what an old sailor needs. Help me with the money, matey.',
      fern: 'Oh, cocoa! My flippers were so cold. Let me pay you.',
      pebble: 'COCOA! Best delivery ever! Um, how much do I owe?',
    },
  },
  survey: { kind: 'flag', points: SURVEY, label: 'Measure the ice', title: "Pebble's Survey", domain: 'cave', count: 2 },
  mirrors: { kind: 'mirror', label: 'Turn the ice mirror', title: 'Mirror Beam', domain: 'cave', skills: ['angle_add', 'angle_type', 'convert'], count: 1 },
  beacons: { kind: 'beacon', points: BEACONS, label: 'Light the beacon', title: 'Signal Beacon', domain: 'ridge', count: 2 },
  legends: {
    kind: 'lantern', label: 'Begin the Legend Trial', title: 'Legend Trial', count: 6, hard: true,
    // Beside each crystal; in the ice cave the open floor is on the other side.
    points: ['lake', 'grove', 'huts', 'cave', 'ridge'].map((r) => (r === 'cave' ? [CRYSTALS[r].x - 4.5, CRYSTALS[r].z - 4.5] : [CRYSTALS[r].x + 4.5, CRYSTALS[r].z + 4.5])),
    domains: ['lake', 'grove', 'huts', 'cave', 'ridge'],
  },
  invites: {
    kind: 'npc', quiz: false, npcs: ['professor', 'captain', 'fern', 'mittens', 'pebble', 'skipper'], label: 'Invite to the festival', title: 'Invitation',
    greet: {
      professor: 'A festival! I shall bring my telescope so everyone can see the aurora up close.',
      captain: "A party on the beach? I'll bring the freshest fish in the bay!",
      fern: "I'll bring crystal flowers to decorate the lanterns!",
      mittens: "Cocoa for everyone! I'll start warming the pots right now.",
      pebble: 'I will be there! I might even wear my fancy helmet.',
      skipper: "I'll make sure every Glimmer on the ridge gets an invitation too.",
    },
  },
};

export const MAIN = [
  {
    id: 'ch0', type: 'main', chapter: 0, region: 'home', title: 'Prologue: A Fading Sky',
    blurb: 'The Aurora is fading. The Professor needs your help.',
    steps: [
      {
        type: 'talk', npc: 'professor', text: 'Talk to Professor Waddlesworth by the igloo',
        lines: [
          ['professor', '{name}! Oh, thank goodness you are awake. Look up at the sky...'],
          ['professor', 'The Aurora is fading! The Glooms, those grumpy little shadow critters from Gloom Ridge, pulled its light down and locked it inside five Aurora Crystals.'],
          ['professor', 'Each crystal is sealed with number magic. Only a clever penguin who can think with numbers can wake them up again.'],
          ['professor', "That's you, {name}! Keep your scarf on. Every puzzle you solve makes it glow a little brighter."],
          ['professor', 'First, let us warm up those flippers. Can you find the three golden snowflakes near the igloo?'],
          ['professor', '{How to move}'],
        ],
        onDone: 'showControls',
      },
      { type: 'count', counter: 'tutorialFlakes', need: 3, absolute: true, text: (n) => `Find the golden snowflakes near the igloo (${n}/3)`, target: 'nextTutorialFlake' },
      {
        type: 'talk', npc: 'professor', text: 'Tell the Professor you found them',
        lines: [
          ['professor', 'Splendid waddling! Now let us warm up that brain.'],
          ['professor', 'Here come a few quick puzzles from every corner of the bay. Just do your best. Every try is good practice.'],
        ],
      },
      {
        type: 'game', game: 'warmup', auto: true, at: 'professor', label: 'Warm-up puzzles', text: 'Finish the warm-up puzzles with the Professor',
        after: [
          ['professor', 'Wonderful! You are going to be great at this.'],
          ['professor', 'Take this: your very own Aurora Journal. {Press J} any time to see your quests.'],
          ['professor', 'The first crystal is at Glimmer Lake. Captain Flipper is down at the fishing dock. He will know what to do.'],
          ['professor', 'Follow the golden sparkle trail. It always points to your next goal. Off you go!'],
        ],
      },
    ],
    reward: { coins: 20 },
  },
  {
    id: 'ch1', type: 'main', chapter: 1, region: 'lake', title: 'Chapter 1: Glimmer Lake',
    blurb: 'Help Captain Flipper and wake the crystal on Shimmer Isle.',
    steps: [
      {
        type: 'talk', npc: 'captain', text: 'Find Captain Flipper at the fishing dock',
        lines: [
          ['captain', 'Ahoy, {name}! Captain Flipper at your service.'],
          ['captain', "Those Glooms stirred up my fish. Now they swim around with numbers stuck to them, and they won't bite unless you pick the right one!"],
          ['captain', 'Head to the end of my dock and help me catch 6 fish. Match each fish to the right answer.'],
        ],
      },
      {
        type: 'game', game: 'fishing', params: { count: 6 }, at: 'fishSpot', label: 'Go fishing', text: 'Catch 6 fish at the end of the dock', shard: true,
        after: [
          ['captain', "Now THAT'S a haul! You've got the sharpest fins in the bay."],
          ['captain', "But look out there: the channel buoys have gone dark. Boats can't find their way home!"],
          ['captain', "Could you swim out and relight all four? Just jump in the lake. Penguins are born swimmers! {Hold Shift} to swim faster."],
        ],
      },
      {
        type: 'sites', set: 'buoys', text: (d, t) => `Swim out and relight the channel buoys (${d}/${t})`, shard: true,
        after: [
          ['captain', 'The lake is lit up like a birthday cake! Thank you, {name}.'],
          ['captain', 'Now, the crystal. It sits on Shimmer Isle behind a Gloom barrier. Nobody can swim through it.'],
          ['captain', 'But the ice floes by the south jetty can carry you across! Only floes with the right answer will hold you up. Hop to it!'],
        ],
      },
      {
        type: 'game', game: 'floehop', at: 'jetty', label: 'Start the Floe Hop', text: 'Hop across the ice floes from the south jetty', shard: true,
        after: [['', 'You made it to Shimmer Isle! The Lake Crystal hums quietly. It needs aurora energy from multiplying and dividing.']],
      },
      { type: 'crystal', region: 'lake' },
    ],
    outro: [
      ['professor', 'I saw that beam of light all the way from my igloo! One crystal down, four to go.'],
      ['professor', 'Rest your flippers, {name}. Tonight I will watch the sky and find the next crystal.'],
    ],
    reward: { coins: 60 },
  },
  {
    id: 'ch2', type: 'main', chapter: 2, region: 'grove', title: 'Chapter 2: Crystal Grove',
    blurb: 'Fern needs help unlocking the grove crystal.',
    briefing: [
      ['professor', 'Good morning, {name}! Last night I saw a teal glimmer over Crystal Grove, west of the lake.'],
      ['professor', 'Fern the gardener lives there. I think she needs you!'],
    ],
    briefingNow: [
      ['professor', '{name}, can you hear me on the radio? I did not even need to wait for nightfall!'],
      ['professor', 'A teal glimmer just flashed over Crystal Grove, west of the lake. Fern the gardener lives there. I think she needs you!'],
    ],
    steps: [
      {
        type: 'talk', npc: 'fern', text: 'Meet Fern in Crystal Grove',
        lines: [
          ["fern", "Oh! A visitor! I'm Fern. I look after the crystals in this grove."],
          ['fern', 'The Glooms sealed the Grove Crystal with three Fraction Locks. Each lock must be filled with exactly the right amount of light.'],
          ['fern', 'Walk up to each lock and {press E}. Fill all three and the seal will break!'],
        ],
      },
      {
        type: 'sites', set: 'pillars', text: (d, t) => `Fill the Fraction Locks (${d}/${t})`, shard: true,
        after: [
          ['fern', 'All three locks are open! You have a real feel for fractions.'],
          ['fern', 'The crystal still needs strength, so I am brewing Glow Potions. Come help me measure at my cauldron!'],
        ],
      },
      {
        type: 'game', game: 'potions', at: 'cauldron', label: 'Brew Glow Potions', text: "Brew 3 Glow Potions at Fern's cauldron", shard: true,
        after: [
          ['fern', 'Perfect potions! Smell that? Like peppermint and starlight.'],
          ['fern', 'One more thing: the Glooms scattered my crystal seeds all over the woods west of the grove. Find all five!'],
        ],
      },
      { type: 'collect', set: 'seeds', text: (d, t) => `Find the crystal seeds in the west woods (${d}/${t})`, after: [['fern', 'You found them all! Now plant each seed in one of my garden beds around the grove.']] },
      {
        type: 'sites', set: 'beds', text: (d, t) => `Plant the seeds in Fern's garden beds (${d}/${t})`, shard: true,
        after: [['fern', 'Look how they sparkle! The Grove Crystal is ready. Charge it up with fraction puzzles!']],
      },
      { type: 'crystal', region: 'grove' },
    ],
    outro: [['professor', 'Two crystals! The sky has a teal shimmer now. I will look for the next one tonight. Sleep well, {name}!']],
    reward: { coins: 60 },
  },
  {
    id: 'ch3', type: 'main', chapter: 3, region: 'huts', title: 'Chapter 3: Heart Huts',
    blurb: 'Run the Snack Shack, deliver cocoa and knit with Granny Purl.',
    briefing: [
      ['professor', 'Good morning, {name}! Pink light was flickering over the Heart Huts last night, east of the lake.'],
      ['professor', 'Mama Mittens runs the Snack Shack there. Go say hello, and bring your counting flippers!'],
    ],
    briefingNow: [
      ['professor', 'You are on a roll, {name}! Pink light is flickering over the Heart Huts, east of the lake, right now.'],
      ['professor', 'Mama Mittens runs the Snack Shack there. Go say hello, and bring your counting flippers!'],
    ],
    steps: [
      {
        type: 'talk', npc: 'mittens', text: 'Meet Mama Mittens at the Heart Huts',
        lines: [
          ['mittens', "Welcome to the Heart Huts, sweetie! I'm Mama Mittens."],
          ['mittens', 'My helper ran off when the Glooms came, and now there is a line at the Snack Shack!'],
          ['mittens', 'Could you run the counter for me? Serve 5 customers, and count the money carefully!'],
        ],
      },
      {
        type: 'game', game: 'market', params: { count: 5 }, at: 'counter', label: 'Run the Snack Shack', text: 'Serve 5 customers at the Snack Shack', shard: true,
        after: [
          ["mittens", "You're a natural! Every customer left with a smile."],
          ['mittens', 'Could you do me one more favor? I made hot cocoa for four friends around the bay: the Professor, Captain Flipper, Fern and Pebble.'],
          ['mittens', 'Deliver it for me, and count their change carefully!'],
        ],
      },
      {
        type: 'sites', set: 'cocoa', text: (d, t) => `Deliver hot cocoa around the bay (${d}/${t})`, shard: true,
        after: [
          ['mittens', 'Everyone loved the cocoa! Thank you, dear.'],
          ['mittens', 'Granny Purl by the campfire wants to knit you something special. She is the best knitter in the bay!'],
        ],
      },
      {
        type: 'talk', npc: 'purl', text: 'Visit Granny Purl by the campfire',
        lines: [
          ['purl', 'Oh my, a new knitting buddy! Come sit, come sit.'],
          ['purl', 'My patterns are all about ratios and money, dear. Three red rows for every two white rows, that sort of thing.'],
          ['purl', 'Help me work out my patterns and I will knit you a scarf!'],
        ],
      },
      {
        type: 'game', game: 'knitting', at: 'purl', label: 'Knit with Granny Purl', text: 'Help Granny Purl with her knitting patterns', shard: true,
        after: [['purl', 'There! A Heart Knit scarf, just for you. You can wear it from your Wardrobe.']],
        reward: { items: ['scarf:heart'] },
      },
      { type: 'crystal', region: 'huts' },
    ],
    outro: [
      ['mittens', 'The Heart Huts are glowing pink again! My Wardrobe is open to you any time, sweetie. Talk to me to shop.'],
      ['professor', 'Three crystals! I can hardly believe my eyes. Good night, {name}!'],
    ],
    reward: { coins: 60 },
  },
  {
    id: 'ch4', type: 'main', chapter: 4, region: 'cave', title: 'Chapter 4: Glacier Cave',
    blurb: 'Rebuild the cave with Pebble and bend light with ice mirrors.',
    briefing: [
      ['professor', 'Good morning, {name}! A blue light is glowing inside the Glacier Cave, south of the Heart Huts.'],
      ['professor', 'Pebble the explorer is there. Watch your step!'],
    ],
    briefingNow: [
      ['professor', 'Still going strong, {name}? A blue light just lit up inside the Glacier Cave, south of the Heart Huts.'],
      ['professor', 'Pebble the explorer is there. Watch your step!'],
    ],
    steps: [
      {
        type: 'talk', npc: 'pebble', text: 'Meet Pebble outside the Glacier Cave',
        lines: [
          ['pebble', "Whoa, hi! I'm Pebble, cave explorer extraordinaire!"],
          ['pebble', 'The Glooms smashed the ice floor inside Glacier Cave. The crystal is stuck behind the rubble!'],
          ['pebble', "Help me rebuild it on the build pad. I'll give you the measurements, you work out the numbers!"],
        ],
      },
      {
        type: 'game', game: 'architect', params: { count: 5 }, at: 'pad', label: 'Rebuild the ice', text: 'Rebuild the cave floor with Pebble', shard: true,
        after: [
          ['pebble', 'The floor is fixed! Best. Cave. Ever.'],
          ['pebble', 'Next job: I am making a map of the four biggest ice formations in the bay. Measure them for me? They have little flags next to them.'],
        ],
      },
      {
        type: 'sites', set: 'survey', text: (d, t) => `Measure Pebble's ice formations (${d}/${t})`, shard: true,
        after: [
          ['pebble', 'My map is perfect! You are a real surveyor.'],
          ['pebble', 'Last job: the crystal is sitting in the dark. Three ice mirrors inside the cave can bounce moonlight onto it, but only if the angles are just right!'],
        ],
      },
      {
        type: 'sites', set: 'mirrors', text: (d, t) => `Turn the ice mirrors in the cave (${d}/${t})`, shard: true,
        after: [
          ['pebble', 'LOOK! The light is hitting the crystal! Now charge it up!'],
          ['pebble', 'Hey, see that scratchy drawing on the cave wall? A big Gloom wearing a crown, sitting all alone on a mountain. Weird, right?'],
        ],
      },
      { type: 'crystal', region: 'cave' },
    ],
    outro: [['professor', 'Four crystals! Only Gloom Ridge is left. Tomorrow will be a big day, {name}. Get some rest.']],
    reward: { coins: 60 },
  },
  {
    id: 'ch5', type: 'main', chapter: 5, region: 'ridge', title: 'Chapter 5: Gloom Ridge',
    blurb: 'Light the signal beacons and cheer up the Glooms.',
    briefing: [
      ['professor', 'Good morning, {name}. This is the big one: Gloom Ridge, north of the lake.'],
      ['professor', 'Scout Skipper is waiting at the bottom of the ramp. Be brave, and be kind.'],
    ],
    briefingNow: [
      ['professor', '{name}, this is the big one: Gloom Ridge, north of the lake. Only one crystal left!'],
      ['professor', 'Scout Skipper is waiting at the bottom of the ramp. Be brave, and be kind.'],
    ],
    steps: [
      {
        type: 'talk', npc: 'skipper', text: 'Find Scout Skipper below Gloom Ridge',
        lines: [
          ["skipper", "Halt! Oh, it's you, {name}. I'm Scout Skipper."],
          ['skipper', "The Glooms are all gathered up on Gloom Ridge. They're cold and grumpy, and it's making the whole ridge gloomy."],
          ['skipper', 'Before we climb, we need to light the four signal beacons on the high hills, so the whole bay can see the ridge.'],
        ],
      },
      {
        type: 'sites', set: 'beacons', text: (d, t) => `Light the signal beacons on the high hills (${d}/${t})`, shard: true,
        after: [
          ['skipper', 'The whole bay is watching! Now climb the ramp to the stone circle at the top.'],
          ['skipper', 'When a Gloom comes close, type the answer to its puzzle and {press Enter} to send it some aurora light!'],
        ],
      },
      {
        type: 'game', game: 'battle', at: 'arena', label: 'Face the Glooms', text: 'Cheer up the Glooms in the stone circle', shard: true,
        after: [
          ['skipper', 'Amazing! Did you hear the last one whisper as it floated up? "The King will be so cold without us..."'],
          ['skipper', 'A Gloom King? I have never heard of one. But a few Glooms ran off and are wandering around the bay.'],
          ['skipper', 'Find four of them and cheer them up too. Look for purple glows on your map!'],
        ],
      },
      {
        type: 'count', counter: 'glooms', need: 4, text: (n) => `Cheer up wandering Glooms around the bay (${n}/4)`, target: 'nearestGloom', shard: true,
        after: [['skipper', 'Every Gloom you cheer up makes the ridge warmer. The crystal is waiting for you up top!']],
      },
      { type: 'crystal', region: 'ridge' },
    ],
    outro: [['professor', "All five crystals, {name}! Something is happening at the Aurora Spire. I'll keep watch tonight."]],
    reward: { coins: 80 },
  },
  {
    id: 'ch6', type: 'main', chapter: 6, region: 'spire', title: 'Chapter 6: The Aurora Spire',
    blurb: 'The shield is down. Something waits at the top.',
    briefing: [
      ['professor', 'Good morning, {name}! All five crystals shone together last night, and the shield around the Aurora Spire vanished!'],
      ['professor', 'The last of the aurora light is trapped at the very top. Climb the spire mountain... and be kind to whoever you find up there.'],
    ],
    briefingNow: [
      ['professor', '{name}! Look east! The five crystals are shining together, and the shield around the Aurora Spire is flickering away!'],
      ['professor', 'The last of the aurora light is trapped at the very top. Climb the spire mountain... and be kind to whoever you find up there.'],
    ],
    steps: [
      { type: 'scene', scene: 'spireOpen', auto: true, text: 'The spire shield is falling...' },
      { type: 'reach', at: 'spireTop', radius: 11, minY: 28, text: 'Climb to the top of the Aurora Spire', run: 'boss' },
      {
        type: 'talk', npc: 'king', text: 'Talk to the Glimmer King',
        lines: [
          ['king', 'Thank you, {name}. For the first time in forever, I feel warm.'],
          ['king', 'Please, take this Aurora Crown. You are the bravest, kindest penguin in all of Glacier Bay.'],
          ['king', 'And look: the Glooms are not shadows at all. They are lost starlight, finally finding their way home.'],
          ['king', 'And... would you come back tomorrow? I have an idea. A wonderful, sparkly idea.'],
        ],
        reward: { items: ['hat:crown'] },
      },
    ],
    outro: [['professor', 'You did it, {name}! The whole aurora is back! I am so proud of you.']],
    reward: { coins: 200 },
  },
  {
    id: 'ch7', type: 'main', chapter: 7, region: 'festival', title: 'Chapter 7: The Great Aurora Festival',
    blurb: 'Light the five Festival Lanterns and throw the party of the century.',
    briefing: [
      ['professor', 'Good morning, {name}! The Glimmer King waddled all the way to my igloo last night.'],
      ['professor', 'He wants to throw the Great Aurora Festival, and he needs a true Aurora Legend to help. He is waiting at the spire!'],
    ],
    briefingNow: [
      ['professor', '{name}, the Glimmer King could not wait until tomorrow! He has his wonderful, sparkly idea ready.'],
      ['professor', 'He wants to throw the Great Aurora Festival, and he needs a true Aurora Legend to help. He is waiting at the spire!'],
    ],
    steps: [
      {
        type: 'talk', npc: 'king', text: 'Visit the Glimmer King at the spire',
        lines: [
          ['king', '{name}! Let us throw the greatest Aurora Festival Glacier Bay has ever seen!'],
          ['king', 'But every festival needs lanterns. The five Festival Lanterns can only be lit by a true Aurora Legend.'],
          ['king', 'Next to every crystal there is a Legend Trial. They are the hardest puzzles in the whole bay. Are you ready?'],
        ],
      },
      { type: 'sites', set: 'legends', text: (d, t) => `Complete the Legend Trials next to each crystal (${d}/${t})` },
      {
        type: 'talk', npc: 'king', text: 'Tell the Glimmer King the lanterns are lit',
        lines: [
          ['king', 'All five lanterns! You really are a Legend.'],
          ['king', 'Now for the best part of any party: the guests! Please invite all our friends to the south beach.'],
        ],
      },
      { type: 'sites', set: 'invites', text: (d, t) => `Invite your friends to the festival (${d}/${t})` },
      { type: 'reach', at: 'festival', radius: 9, text: 'Go to the festival on the south beach', run: 'festival' },
    ],
    reward: { coins: 300 },
  },
];

export const SIDE = [
  {
    id: 'sq_flakes', type: 'side', giver: 'mo', after: 'ch0', title: 'Snowflake Collectors',
    blurb: 'Mo, Lulu and Sunny collect golden snowflakes. There are 30 hidden around the bay.',
    offer: [
      ['mo', "We're collecting golden snowflakes! There are 30 hidden all over Glacier Bay."],
      ['mo', "Bring us 10 and we'll give you something special!"],
    ],
    steps: [
      { type: 'count', counter: 'flakes', need: 10, absolute: true, turnin: 'mo', text: (n) => `Find golden snowflakes (${n}/10)`, target: 'nearestFlake', after: [['mo', 'Ten snowflakes! Here, this Party Hat is for you! Next prize at 20!']], reward: { items: ['hat:party'] } },
      { type: 'count', counter: 'flakes', need: 20, absolute: true, turnin: 'mo', text: (n) => `Find golden snowflakes (${n}/20)`, target: 'nearestFlake', after: [['lulu', 'Twenty?! You earned the Starlight slide trail! Belly-slide to see it sparkle!']], reward: { items: ['trail:stars'] } },
      { type: 'count', counter: 'flakes', need: 30, absolute: true, turnin: 'mo', text: (n) => `Find golden snowflakes (${n}/30)`, target: 'nearestFlake', after: [['sunny', 'ALL THIRTY! You are the greatest snowflake finder in history! Here are 150 fish coins!']], reward: { coins: 150 } },
    ],
  },
  {
    id: 'sq_slalom', type: 'side', giver: 'lulu', after: 'ch0', title: 'Sledding Hill Slalom',
    blurb: 'Race down the sledding hill through answer gates. Beat your best time!',
    offer: [
      ['lulu', 'Race me down the sledding hill, south of the igloo!'],
      ['lulu', 'You zoom down all by yourself. Before each gate, pick the lane with the right answer: {pick a lane}!'],
      ['lulu', 'Right answers give you a speed boost. Wrong ones cost you 2 seconds. Ready?'],
    ],
    steps: [{ type: 'game', game: 'slalom', at: 'slalomTop', label: 'Start the slalom', text: 'Race down the sledding hill', after: [['lulu', 'Wheee! You can race again any time to win a better medal!']] }],
    reward: { coins: 30 },
  },
  {
    id: 'sq_stars', type: 'side', giver: 'professor', after: 'ch0', title: 'Star Charts',
    blurb: 'Solve a set of star chart puzzles at the easel by the igloo. New charts every day.',
    offer: [
      ['professor', 'Would you help me with my star charts? I count shooting stars and comets every night.'],
      ['professor', 'There is a fresh chart at my easel every day. Finish charts on three different days and I will give you something special.'],
      ['professor', 'Funny thing: my oldest chart has a gap in it, as if a whole piece of the sky went missing long ago. I have never solved that mystery.'],
    ],
    steps: [{ type: 'count', counter: 'chartDays', need: 3, absolute: true, turnin: 'professor', text: (n) => `Finish star charts on 3 different days (${n}/3)`, target: 'easel', after: [['professor', 'Three days of star charts! This Star Chart scarf is covered in real constellations. Wear it well!']], reward: { items: ['scarf:star'] } }],
  },
  {
    id: 'sq_chicks', type: 'side', giver: 'nestle', after: 'ch1', title: 'The Lost Chicks',
    blurb: 'Eight chicks ran off when the Glooms came. Find them and walk them home to the nursery.',
    offer: [
      ['nestle', 'Oh, thank goodness you are here! Eight of my chicks got scared by the Glooms and ran off all over the bay!'],
      ['nestle', 'They are shy. They will only follow someone who can answer their silly riddles.'],
      ['nestle', 'Please find them and walk them home to me here at the nursery. They will follow right behind you!'],
    ],
    steps: [{ type: 'chicks', text: (home, found) => `Bring the lost chicks home to Nana Nestle (${home}/8)`, after: [['nestle', 'All eight! My little family is together again. This chick insists on following you everywhere. You can take her along from your Wardrobe!']], reward: { items: ['buddy:chick'], coins: 100 } }],
  },
  {
    id: 'sq_map', type: 'side', giver: 'captain', after: 'ch1', title: "The Captain's Treasure Map",
    blurb: 'Read grid coordinates on the treasure map to dig up four treasures.',
    offer: [
      ['captain', "Arr, you've earned this: my old treasure map! Four treasures are buried around the bay."],
      ['captain', 'The map has a grid. {Press M} to open it. Count across first for x, then up for y. When you are close, you will see sparkles in the snow. {Press E} to dig!'],
    ],
    steps: [{ type: 'treasure', text: (n, clue) => `Treasure ${n + 1} of 4: ${clue}`, after: [['captain', 'All four treasures! You are a true pirate penguin. Keep this hat, matey!']], reward: { items: ['hat:pirate'] } }],
  },
  {
    id: 'sq_tourney', type: 'side', giver: 'captain', after: 'ch1', title: 'Big Fish Tournament',
    blurb: 'Catch 10 fish at the dock. Fewer misses win a better medal.',
    offer: [['captain', 'Fancy a Big Fish Tournament? Catch 10 fish. The fewer misses, the shinier your medal!']],
    steps: [{ type: 'game', game: 'fishing', params: { count: 10, tourney: true }, at: 'fishSpot', label: 'Start the tournament', text: 'Catch 10 fish in the Big Fish Tournament' }],
    reward: { coins: 40 },
  },
  {
    id: 'sq_rush', type: 'side', giver: 'mittens', after: 'ch3', title: 'Snack Shack Rush',
    blurb: 'Serve 8 customers in a row at the Snack Shack. Accurate service earns better medals.',
    offer: [['mittens', 'It is the lunch rush! Could you serve 8 customers in a row? Fewer mistakes means happier customers and a better medal.']],
    steps: [{ type: 'game', game: 'market', params: { count: 8, rush: true }, at: 'counter', label: 'Start the lunch rush', text: 'Serve 8 customers in the Snack Shack Rush' }],
    reward: { coins: 40 },
  },
  {
    id: 'sq_sculpt', type: 'side', giver: 'pebble', after: 'ch4', title: 'Snow Sculpture Contest',
    blurb: 'Build four ice sculptures for the judges on the build pad.',
    offer: [['pebble', 'The Snow Sculpture Contest is on! Build four sculptures on my build pad. The judges love exact measurements!']],
    steps: [{ type: 'game', game: 'architect', params: { count: 4, sculpture: true }, at: 'pad', label: 'Build for the contest', text: 'Build 4 sculptures for the Snow Sculpture Contest' }],
    reward: { coins: 40 },
  },
  {
    id: 'sq_glimmers', type: 'side', giver: 'skipper', after: 'ch5', title: 'Glimmer Friends',
    blurb: 'Cheer up the Gloom at every one of the 8 wandering spots around the bay.',
    offer: [['skipper', 'There are 8 spots where lonely Glooms like to wander. Cheer up a Gloom at every single one, and they will all be friends!']],
    steps: [{ type: 'count', counter: 'gloomSpots', need: 8, absolute: true, turnin: 'skipper', text: (n) => `Cheer up a Gloom at every wandering spot (${n}/8)`, target: 'nearestGloom', after: [['skipper', 'Every spot! The Glimmers want to thank you. This little one wants to float along with you!']], reward: { items: ['buddy:glimmer'], coins: 100 } }],
  },
];

// What friends say when there is nothing quest-related to talk about.
export const CHATTER = {
  professor: [
    '{Hold Shift} while you run to belly-slide. Downhill is the fastest!',
    '{Press M} to open your map. The gold star shows where to go next.',
    "The Glooms aren't bad, you know. They're just cold and grumpy.",
    'If a puzzle feels tricky, {press H} for a hint. Even great scientists ask for hints.',
    'Check the Aurora Patrol board by my igloo. There are new tasks every day!',
    'Penguins are wonderful swimmers. Jump in the lake and {hold Shift} to zoom!',
    'This cracked star badge? A souvenir from my days in the old Star Guild. A long story, for another day.',
  ],
  mo: ['There are 30 golden snowflakes hidden around the bay. Some are on top of hills!'],
  lulu: ['Did you know penguins can belly-slide really fast? {Hold Shift} while you run. Wheee!', 'The sledding hill is just south of here!'],
  sunny: ['I saw a treasure chest on top of a snowy hill! I bet more are hiding around the bay.', 'Treasure chests have puzzles inside. And coins!'],
  captain: ["A penguin can hold its breath for 20 minutes. I can do about 3.", 'The fish are biting today, matey!'],
  fern: ['Crystals grow a tiny bit every full moon.', 'Fractions are just pieces of a whole. Like slices of a crystal pie!'],
  mittens: ['Nothing warms a flipper like cocoa.', "Every coin you earn comes from a puzzle you solved. That's real treasure!"],
  purl: ['Knit one, purl two, ratios for you!', 'I once knitted a scarf so long it reached the dock.'],
  nestle: ['My chicks are growing so fast!', 'Thank you for keeping the bay safe, dear.'],
  pebble: ['Every rock has a story. This one says "I am a rock."', 'Volume is how much space something takes up. Like me in a small cave!'],
  skipper: ['Stay warm out there!', 'A true scout is kind first and brave second.'],
  king: ['The aurora looks brighter every night!', 'Being warm is much better than being grumpy.'],
};

export const FESTIVAL_SPOT = FESTIVAL;
export const SPIRE_TOP = { x: LOC.spire.x, z: LOC.spire.z + 11 };
export { SEEDS };
