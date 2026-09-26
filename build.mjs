// Bundles the game into self-contained HTML files:
//   dist/PenguinQuest.html     full document, works offline from a file (Chromebook: open in Chrome)
//   dist/artifact/index.html   body-only page for publishing as a claude.ai artifact
//   dist/pwa/                  installable web app (needs HTTPS hosting)
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const dev = process.argv.includes('--dev');
const t0 = Date.now();

const result = await esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  minify: !dev,
  write: false,
  target: ['chrome100'],
  legalComments: 'none',
  define: { __DEV__: dev ? 'true' : 'false' },
  logLevel: 'warning',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const font = (file) => fs.readFileSync(path.join('assets/fonts', file)).toString('base64');
const fontCss = `
@font-face{font-family:'Fredoka';src:url(data:font/woff2;base64,${font('fredoka-latin.woff2')}) format('woff2');font-weight:300 700;font-display:block}
@font-face{font-family:'Lilita One';src:url(data:font/woff2;base64,${font('lilita-latin.woff2')}) format('woff2');font-weight:400;font-display:block}
`;
const css = fontCss + fs.readFileSync('src/styles.css', 'utf8');
const body = fs.readFileSync('src/body.html', 'utf8');

const TITLE = 'Penguin Quest';
const head = (extra = '') => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b1033">
<meta name="description" content="An open-world 3D math adventure for grades 4 to 6.">
<title>${TITLE}</title>
${extra}
<style>${css}</style>
</head>
<body>`;

fs.mkdirSync('dist/artifact', { recursive: true });
fs.mkdirSync('dist/pwa', { recursive: true });

const full = `${head()}\n${body}\n<script>${js}</script>\n</body>\n</html>\n`;
fs.writeFileSync('dist/PenguinQuest.html', full);

const artifact = `<title>${TITLE}</title>\n<style>${css}</style>\n${body}\n<script>${js}</script>\n`;
fs.writeFileSync('dist/artifact/index.html', artifact);

const pwaHead = `<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">`;
const swReg = `<script>if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}</script>`;
fs.writeFileSync('dist/pwa/index.html', `${head(pwaHead)}\n${body}\n<script>${js}</script>\n${swReg}\n</body>\n</html>\n`);
fs.writeFileSync('dist/pwa/manifest.webmanifest', JSON.stringify({
  name: 'Penguin Quest: Aurora Rescue',
  short_name: 'Penguin Quest',
  description: 'An open-world 3D math adventure for grades 4 to 6.',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'landscape',
  background_color: '#0b1033',
  theme_color: '#0b1033',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
}, null, 2));
const version = Date.now().toString(36);
fs.writeFileSync('dist/pwa/sw.js', `const CACHE='pq-${version}';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)))});
`);
for (const size of [192, 512]) {
  const src = `assets/icon-${size}.png`;
  if (fs.existsSync(src)) fs.copyFileSync(src, `dist/pwa/icon-${size}.png`);
}

const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';
console.log(`built in ${Date.now() - t0} ms: dist/PenguinQuest.html ${kb('dist/PenguinQuest.html')}`);
