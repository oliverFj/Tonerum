import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
let html = await readFile(resolve(dist, 'index.html'), 'utf8');

// Inline Vite's compiled assets so file:// needs neither a server nor imports.
for (const match of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/g)) {
  const code = await readFile(resolve(dist, match[1].replace(/^\/+/, '')), 'utf8');
  html = html.replace(match[0], () => `<script type="module">${code.replace(/<\/script/gi, '<\\/script')}</script>`);
}
for (const match of html.matchAll(/<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="([^"]+)")[^>]*>/g)) {
  const css = await readFile(resolve(dist, match[1].replace(/^\/+/, '')), 'utf8');
  html = html.replace(match[0], () => `<style>${css}</style>`);
}

// The source entry redirects double-clicks here; the standalone file is final.
html = html.replace(/<script>\s*if \(location\.protocol === 'file:'\) location\.replace\('\.\/Tonerum\.html'\);\s*<\/script>/, '');

if (/<script\b[^>]*\bsrc=|<link\b[^>]*rel="stylesheet"|@import\b/.test(html)) {
  throw new Error('The standalone app still depends on external scripts or styles.');
}

await writeFile(resolve(dist, 'index.html'), html);
await writeFile(resolve(root, 'Tonerum.html'), html);
console.log('Standalone app ready: Tonerum.html (open directly in a browser).');
