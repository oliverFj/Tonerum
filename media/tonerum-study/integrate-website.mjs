import {mkdir, copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const website = path.resolve(root, '../Hjemmeside');
const product = path.join(website, 'public/tonerum');
await mkdir(product, {recursive: true});
await copyFile(path.join(root, 'Tonerum.html'), path.join(product, 'index.html'));

// The website owns build/check integration and uses this copy without this checkout.
console.log('Tonerum kopieret ind i hjemmesidens normale build.');
