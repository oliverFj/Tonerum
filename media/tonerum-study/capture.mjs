import {createServer} from 'node:http';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {chromium} = require('playwright');
const sharp = require('sharp');
const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const output = path.join(root, 'artifacts/product-media/tonerum');
for (const folder of ['originals', 'screenshots', 'fragments', 'covers']) await mkdir(path.join(output, folder), {recursive: true});
const server = createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (name === '/' ? '/dist/index.html' : name));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    const data = await readFile(file);
    res.setHeader('Content-Type', ({'.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.css': 'text/css', '.js': 'text/javascript'})[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const errors = [];
const shots = [];
const settle = async page => {
  await page.evaluate(async () => { await document.fonts.ready; document.activeElement?.blur(); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
  await page.mouse.move(1, 1);
};
let browser;
try {
  browser = await chromium.launch({channel: 'msedge', headless: true});
  const context = await browser.newContext({viewport: {width: 1440, height: 960}, deviceScaleFactor: 2, locale: 'da-DK', colorScheme: 'light', reducedMotion: 'reduce'});
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  await context.route('**/*', route => {
    const url = route.request().url();
    return url.startsWith(base + '/') || url.startsWith('data:') || url.startsWith('file:') ? route.continue() : route.abort();
  });
  async function reset(mode = 'light') {
    await page.goto(base + '/');
    await page.evaluate(() => localStorage.clear());
    await page.emulateMedia({colorScheme: mode});
    await page.reload();
    await page.locator('.brand-wordmark').waitFor();
  }
  async function capture(id, title, choices) {
    await settle(page);
    await page.screenshot({path: path.join(output, 'originals', id + '.png'), fullPage: true});
    await page.locator('.studio-shell').screenshot({path: path.join(output, 'screenshots', id + '.png')});
    const metadata = await sharp(path.join(output, 'screenshots', id + '.png')).metadata();
    shots.push({id, title, choices, viewport: {width: 1440, height: 960}, deviceScaleFactor: 2, crop: '.studio-shell', width: metadata.width, height: metadata.height});
    console.log('Optaget: ' + title);
  }
  await reset();
  await page.getByLabel('Vælg melodi', {exact: true}).selectOption({label: 'Altid frejdig, når du går'});
  await page.getByRole('button', {name: 'Vis klaver', exact: true}).click();
  await capture('01-guitar', 'Guitar: melodi, gribebræt, noder og klaver', {instrument: 'guitar', melody: 'Altid frejdig, når du går', appearance: 'light', piano: true});
  await page.locator('.studio-board').screenshot({path: path.join(output, 'fragments/guitar.png')});
  await page.locator('.scrolling-staff').screenshot({path: path.join(output, 'fragments/staff.png')});

  await reset('dark');
  await page.getByLabel('Vælg instrument', {exact: true}).selectOption('violin');
  await page.getByLabel('Vælg melodi', {exact: true}).selectOption({label: 'Glade jul'});
  await capture('02-violin', 'Violin: første position i mørkt tema', {instrument: 'violin', melody: 'Glade jul', appearance: 'dark'});
  await page.locator('.studio-board').screenshot({path: path.join(output, 'fragments/violin.png')});

  await reset();
  await page.getByRole('button', {name: 'Skalaer', exact: true}).click();
  await page.getByRole('button', {name: 'Udforsk gribebrættet', exact: true}).click();
  await page.getByLabel('Toneprikker på gribebrættet', {exact: true}).selectOption('gradient');
  await capture('03-skalaer', 'Udforsk A-molpentaton med farvede toner', {instrument: 'guitar', exercise: 'A minor pentatonic', workspace: 'explore', dots: 'gradient', appearance: 'light'});

  await reset();
  await page.getByRole('button', {name: 'Kvintcirklen', exact: true}).click();
  await capture('04-kvintcirklen', 'Kvintcirklen forbinder tonearter og skalaer', {workspace: 'fifths', key: 'C major', appearance: 'light'});
  await page.locator('.fifths-circle').screenshot({path: path.join(output, 'fragments/circle.png')});

  await reset('dark');
  await page.getByRole('button', {name: 'Kvintcirklen', exact: true}).click();
  await page.getByRole('button', {name: 'Øv din viden', exact: true}).click();
  await page.getByRole('button', {name: 'Vis hint', exact: true}).click();
  await capture('05-toneartsoevelse', 'Øv kvinter med svarmuligheder og et visuelt hint', {workspace: 'fifths', mode: 'quiz', hint: true, appearance: 'dark'});

  await page.goto(pathToFileURL(path.join(root, 'Tonerum.html')).href);
  await settle(page);
  const broken = await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src));
  if (broken.length) throw new Error('Billeder mangler i offlineudgaven: ' + broken.join(', '));
  if (await page.locator('.studio-signature a').getAttribute('href') !== 'https://oliver.fjordside.dk/') throw new Error('Signaturlink mangler');
  await writeFile(path.join(output, 'capture.json'), JSON.stringify({date: '2026-11-04', browser: await browser.version(), source: 'Tonerum.html / dist/index.html', screenshots: shots, verification: {offline: true, brokenImages: broken, pageErrors: errors}}, null, 2));
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
