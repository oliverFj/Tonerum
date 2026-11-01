import { readFile, writeFile } from 'node:fs/promises';
import { generateCSS } from '../design/runtime/engine.mjs';
import { resolveThemeMode } from '../design/runtime/theme-modes.mjs';

const theme = JSON.parse(await readFile(new URL('../design/design.json', import.meta.url), 'utf8'));
const dark = generateCSS(resolveThemeMode(theme, 'dark'), { scope: '#root' })
  .replace(/@font-face\s*\{[^}]*\}/g, '')
  .replaceAll('#root', '#root[data-appearance="dark"]');
// Both appearances use the local shared library and remain fully offline.
await writeFile(new URL('../design/dark.css', import.meta.url), dark);
