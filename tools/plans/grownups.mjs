// The grown-ups' side of the game, end to end: a save from before 1.0 is cleared at start, the grown-up PIN
// (setting it, a wrong and a right try, New Adventure behind it), saving and loading a backup, and resetting.
// Run: node tools/shoot.mjs tools/plans/grownups.mjs --out .cache/shots/grownups --size 1280x720
const reload = async (page, js = '') => { await page.eval(`${js} location.reload(); return 1;`).catch(() => 0); await page.wait(4500); };
const titleButtons = `[...document.querySelectorAll('.title-screen .btn')].map((b) => b.textContent.trim().split(' ')[0])`;
const topScreen = `window.__pq.G.top.root`;
const click = (text) => `{ const b = [...${topScreen}.querySelectorAll('.btn, a.btn')].find((x) => x.textContent.trim().startsWith(${JSON.stringify(text)})); if (!b) throw new Error('no button ' + ${JSON.stringify(text)}); b.click(); window.__pq.G.dev.step(0.1); }`;
const pin = (digits) => `{ for (const d of ${JSON.stringify(digits)}) { const k = [...${topScreen}.querySelectorAll('.pin-key')].find((x) => x.textContent.trim() === d); k.click(); } window.__pq.G.dev.step(0.1); }`;
const top = `window.__pq.G.top?.constructor.name`;

export default async (page) => {
  await page.wait(800);
  const out = {};

  // A: a save from before 1.0 (and an older leftover) is cleared at start, so the game begins fresh in Book 1.
  await reload(page, `localStorage.setItem('penguinquest.save.v2', JSON.stringify({ v: 3, active: 'book2', profile: { name: 'Old' }, coins: 50 })); localStorage.setItem('penguinquest.save', 'x');`);
  out.fresh = JSON.parse(await page.eval(`return JSON.stringify({ buttons: ${titleButtons}, keys: Object.keys(localStorage).filter((k) => k.startsWith('penguinquest.')), book: document.querySelector('.logo-2')?.textContent });`));

  // B: a game in progress; the grown-ups screen shows the version; set a PIN.
  out.lock = JSON.parse(await page.eval(`const {G}=window.__pq; G.dev.newGame({name:'Sam',grade:4,scarf:'coral'}); let g = 0; while (G.top?.constructor.name !== 'ExploreActivity' && g++ < 40) { G.dev.key('Enter'); G.dev.step(0.3); }
    G.save.data.coins = 123; G.saveNow();
    G.screens.pause(); G.dev.step(0.2); ${click('For grown-ups')}
    const r = { opened: ${top}, version: document.querySelector('.gu-version')?.textContent, guide: document.querySelector('a.btn[href="parents.html"]')?.textContent };
    ${click('Set a PIN')} r.choosing = document.querySelector('.pin-panel h1')?.textContent;
    ${pin('1234')} r.again = document.querySelector('.pin-panel h1')?.textContent;
    ${pin('1234')} r.after = ${top}; r.note = ${topScreen}.querySelector('.copy-note')?.textContent;
    return JSON.stringify(r);`));

  // C: with the lock on, a wrong PIN is refused and the right one opens the screen.
  out.gate = JSON.parse(await page.eval(`const {G}=window.__pq; G.top.close(); G.dev.step(0.2); ${click('For grown-ups')}
    const r = { asked: ${top} }; ${pin('9999')} r.wrong = window.__pq.G.top.root.querySelector('.pin-msg')?.textContent; await new Promise((res) => setTimeout(res, 400));
    window.__shotPin = true; return JSON.stringify(r);`));
  await page.shot('pin-wrong');
  out.gate.opened = await page.eval(`${pin('1234')} await new Promise((res) => setTimeout(res, 400)); return ${top};`);
  await page.eval(`window.__pq.G.top.root.querySelector('.gu-panel').scrollTop = 99999; return 1;`);
  await page.wait(300);
  await page.shot('grownups-device');

  // D: save a backup (the download is caught), then load a changed copy of it.
  out.backup = JSON.parse(await page.eval(`const {G}=window.__pq;
    let grabbed = null; const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download) grabbed = { name: this.download, href: this.href }; else orig.call(this); };
    ${click('Save a backup')} HTMLAnchorElement.prototype.click = orig;
    const text = await (await fetch(grabbed.href)).text();
    const file = JSON.parse(text); file.save.coins = 777;
    window.__restoreText = JSON.stringify(file);
    const fileClick = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () { if (this.type !== 'file') return fileClick.call(this); const dt = new DataTransfer(); dt.items.add(new File([window.__restoreText], 'backup.json', { type: 'application/json' })); this.files = dt.files; this.dispatchEvent(new Event('change')); };
    ${click('Load a backup')} await new Promise((r) => setTimeout(r, 300)); G.dev.step(0.2);
    HTMLInputElement.prototype.click = fileClick;
    return JSON.stringify({ name: grabbed.name, coins: file.save.coins, hasBooks: 'books' in file.save, confirm: document.querySelector('.confirm-panel h2')?.textContent, body: document.querySelector('.confirm-panel p')?.textContent });`));
  await page.eval(`${click('Load backup')} return 1;`).catch(() => 0);
  await page.wait(4500);
  out.restored = JSON.parse(await page.eval(`return JSON.stringify({ coins: JSON.parse(localStorage.getItem('penguinquest.save.v2')).coins, lock: localStorage.getItem('penguinquest.lock'), buttons: ${titleButtons} });`));

  // E: New Adventure is behind the lock too; then reset everything from the grown-ups screen.
  out.reset = JSON.parse(await page.eval(`const {G}=window.__pq; ${click('New Adventure')} const r = { newAsks: ${top} }; G.top.close(); G.dev.step(0.2);
    ${click('For grown-ups')} ${pin('1234')} ${click('Reset all progress')} r.confirm = document.querySelector('.confirm-panel h2')?.textContent; return JSON.stringify(r);`));
  await page.eval(`${click('Erase everything')} return 1;`).catch(() => 0);
  await page.wait(4500);
  out.afterReset = JSON.parse(await page.eval(`return JSON.stringify({ buttons: ${titleButtons}, save: !!localStorage.getItem('penguinquest.save.v2'), lock: localStorage.getItem('penguinquest.lock') });`));
  await page.shot('after-reset');
  console.log(JSON.stringify(out, null, 1));
};
