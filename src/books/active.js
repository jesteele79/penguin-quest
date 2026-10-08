// The book being played is fixed for the life of the page: switching books saves and reloads, so every
// module can pick its book's data once, at load. A ?book= address (for testing) wins over the save.
const SAVE_KEY = 'penguinquest.save.v2';
const IDS = ['book1', 'book2'];

function readActive() {
  try {
    const q = new URLSearchParams(globalThis.location?.search ?? '').get('book');
    if (IDS.includes(q)) return q;
    const raw = globalThis.localStorage?.getItem(SAVE_KEY);
    const id = raw ? JSON.parse(raw).active : null;
    return IDS.includes(id) ? id : 'book1';
  } catch {
    return 'book1';
  }
}

export const ACTIVE = readActive();
export const isBook2 = ACTIVE === 'book2';
