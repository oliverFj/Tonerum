import {createRequire} from 'node:module';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require = createRequire(import.meta.url);
const {chromium} = require('playwright');
const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const website = path.resolve(root, '../Hjemmeside');
const output = path.join(root, 'artifacts/product-media/tonerum');
const projects = JSON.parse(await readFile(path.join(website, 'content/projects.json'), 'utf8'));
const project = projects.find(p => p.id === 'tonerum');
const manifest = JSON.parse(await readFile(path.join(website, 'dist/build-manifest.json'), 'utf8'));
if (process.argv.includes('--online')) {
  const html = await readFile(path.join(website, 'dist/index.html'), 'utf8');
  const names = ['index.html', 'tonerum/index.html'];
  for (const media of project.media) {
    const basename = path.basename(media.source, '.png');
    const name = Object.keys(manifest.files).find(n => n.startsWith('assets/' + basename + '-') && n.endsWith('.png'));
    if (!name || !html.includes(name)) throw new Error('Mediet er ikke med i webbuildet: ' + media.source);
    names.push(name);
  }
  await Promise.all(names.map(async name => {
    const response = await fetch('https://oliver.fjordside.dk/' + name, {signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + name);
    const data = Buffer.from(await response.arrayBuffer());
    if (createHash('sha256').update(data).digest('hex') !== manifest.files[name].sha256) throw new Error('Offentlig fil afviger fra buildet: ' + name);
  }));
  await writeFile(path.join(output, 'online-verification.json'), JSON.stringify({date: '2026-11-04', homepage: 'https://oliver.fjordside.dk/', product: project.url, filesMatchBuild: names}, null, 2));
  console.log('Offentlig hjemmeside, Tonerum og alle seks medier matcher buildet.');
} else {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  const errors = [];
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}, locale: 'da-DK', colorScheme: 'light', reducedMotion: 'reduce'});
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => {if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());});
    await page.goto('http://127.0.0.1:8765/');
    const article = page.locator('#project-tonerum');
    await article.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const slides = article.locator('.journal-gallery-slide');
    if (await slides.count() !== 6) throw new Error('Galleriet skal have ét kort og fem screenshots');
    const box = await slides.first().boundingBox();
    if (Math.abs(box.width - 400) > 1 || Math.abs(box.height - 400) > 1) throw new Error('Kortet er ikke 400 px kvadratisk på desktop');
    await article.locator('[data-project-cover]').click();
    if (!await page.locator('#project-tonerum-details').isVisible()) throw new Error('Om projektet åbner ikke');
    if (await article.locator('a[href="' + project.url + '"]').count() !== 2) throw new Error('Begge projektlinks mangler');
    await article.locator('[data-close-details]').click();
    await article.locator('[data-gallery-open="1"]').click();
    const dialog = page.locator('#journal-lightbox');
    if (!await dialog.isVisible()) throw new Error('Screenshot åbner ikke i stor visning');
    await page.locator('[data-lightbox-next]').click();
    if (!(await page.locator('#journal-lightbox-media img').getAttribute('alt')).includes('Violin')) throw new Error('Billednavigation fejler');
    await page.keyboard.press('Escape');
    if (await dialog.isVisible()) throw new Error('Escape lukker ikke');
    await article.screenshot({path: path.join(output, 'website-desktop.png')});
    await page.setViewportSize({width: 390, height: 844});
    await article.scrollIntoViewIfNeeded();
    const mobileBox = await slides.first().boundingBox();
    if (Math.abs(mobileBox.width - mobileBox.height) > 1) throw new Error('Galleriet er ikke kvadratisk på mobil');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Vandret overløb på mobil');
    await article.screenshot({path: path.join(output, 'website-mobile.png')});
    // The hosted copy is the same complete product that was checked offline.
    await page.setViewportSize({width: 1440, height: 1000});
    await page.goto('http://127.0.0.1:8765/tonerum/');
    await page.locator('.studio-signature a').waitFor();
    const broken = await page.locator('img').evaluateAll(images => images.filter(i => !i.complete || !i.naturalWidth).map(i => i.src));
    if (broken.length || errors.length) throw new Error(JSON.stringify({broken, errors}));
    await writeFile(path.join(output, 'website-verification.json'), JSON.stringify({desktop: true, mobile: true, mediaCount: 6, aboutProject: true, projectLinks: 2, lightbox: true, navigation: true, escape: true, productLoads: true, brokenImages: broken, pageErrors: errors}, null, 2));
    console.log('Tonerum-posten kontrolleret: galleri, links, Om projektet, stor visning, navigation, Escape og mobil.');
  } finally {await browser.close();}
}
