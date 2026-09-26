// Shared game services. Modules import G and read what they need after boot.
export const G = {
  renderer: null,
  scene: null,
  camera: null,
  terrain: null,
  world: null,
  player: null,
  cam: null,
  ui: null,
  audio: null,
  tutor: null,
  save: null,
  quests: null,
  input: null,
  effects: null,
  labels: null,
  time: 0,
  dt: 0,
  debug: false,
  paused: false,
  activities: [],
  quality: null,
  // Current top activity (explore, dialog, quiz, a mini-game...).
  get top() { return this.activities[this.activities.length - 1] || null; },
};

export function pushActivity(act) {
  const prev = G.top;
  if (prev && prev.onCover) prev.onCover(act);
  G.activities.push(act);
  if (act.enter) act.enter();
  return act;
}

export function popActivity(act) {
  const i = act ? G.activities.lastIndexOf(act) : G.activities.length - 1;
  if (i < 0) return;
  const [removed] = G.activities.splice(i, 1);
  if (removed.exit) removed.exit();
  const top = G.top;
  if (top && top.onUncover) top.onUncover(removed);
}
