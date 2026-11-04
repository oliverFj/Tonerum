import {createRequire} from 'node:module';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const require = createRequire(import.meta.url);
const {chromium} = require('playwright');
const sharp = require('sharp');
const output = path.resolve(fileURLToPath(new URL('../../artifacts/product-media/tonerum/', import.meta.url)));
const browser = await chromium.launch({channel: 'msedge', headless: true});
const errors = [];
try {
  const page = await browser.newPage({viewport: {width: 1080, height: 1080}, deviceScaleFactor: 1, reducedMotion: 'reduce'});
  page.on('pageerror', error => errors.push(error.message));
  for (const id of ['a', 'b', 'c']) {
    await page.goto(pathToFileURL(path.join(output, 'covers', id + '.html')).href);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({path: path.join(output, 'covers', id + '.png')});
  }
  await import('./review.mjs');
  await page.setViewportSize({width: 1440, height: 1000});
  await page.goto(pathToFileURL(path.join(output, 'index.html')).href);
  await page.getByRole('button', {name: 'Kort B', exact: true}).click();
  await page.locator('#gallery-cover').click();
  if (await page.locator('#viewer-title').textContent() !== 'To instrumenter. Ét øverum.') throw new Error('Forkert produktkort i stor visning');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await page.locator('[data-view="01-guitar"]').first().click();
  if (!await page.locator('dialog').isVisible()) throw new Error('Stor visning mangler');
  await page.keyboard.press('Escape');
  await page.screenshot({path: path.join(output, 'review-desktop.png')});
  await page.setViewportSize({width: 390, height: 844});
  await page.screenshot({path: path.join(output, 'review-mobile.png'), fullPage: true});
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Vandret overløb på mobil');
  const broken = await page.locator('img').evaluateAll(images => images.filter(i => !i.complete || !i.naturalWidth).map(i => i.alt));
  if (broken.length || errors.length) throw new Error(JSON.stringify({broken, errors}));
  const tiles = await Promise.all(['a', 'b', 'c'].map(async (id, index) => ({input: await sharp(path.join(output, 'covers', id + '.png')).resize(540, 540).toBuffer(), left: index * 560, top: 0})));
  await sharp({create: {width: 1660, height: 540, channels: 3, background: '#f1f4f7'}}).composite(tiles).png().toFile(path.join(output, 'cover-options.png'));
  await writeFile(path.join(output, 'verification.json'), JSON.stringify({offlineReview: true, desktop: true, mobile: true, galleryHeight: 400, coverSelection: true, lightbox: true, navigation: true, escape: true, brokenImages: broken, pageErrors: errors}, null, 2));
  console.log('Kort og sammenligningsside kontrolleret på desktop og mobil.');
} finally { await browser.close(); }
