import {readFile, writeFile, copyFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const website = path.resolve(root, '../Hjemmeside');
const source = path.join(website, 'content/projects.json');
let text = await readFile(source, 'utf8');
const projects = JSON.parse(text);
const project = projects.find(project => project.id === 'tonerum');
if (!project) throw new Error('Tonerum mangler på hjemmesiden');
const url = 'https://oliver.fjordside.dk/tonerum/';
const response = await fetch(url);
if (!response.ok || !(await response.text()).includes('Tonerum')) throw new Error('Tonerum er endnu ikke tilgængelig online');
const start = text.indexOf('"id": "tonerum"');
if (!project.url) text = text.slice(0, start) + text.slice(start).replace('"url": null', '"url": "' + url + '"');
else if (project.url !== url) throw new Error('Projektet har allerede en anden adresse');
const cover = process.argv[2];
if (cover) {
  if (!['a', 'b', 'c'].includes(cover)) throw new Error('Ukendt kort');
  const output = path.join(root, 'artifacts/product-media/tonerum');
  const destination = path.join(website, 'assets/projects/tonerum');
  await mkdir(destination, {recursive: true});
  const capture = JSON.parse(await readFile(path.join(output, 'capture.json'), 'utf8'));
  const concepts = JSON.parse(await readFile(path.join(output, 'concepts.json'), 'utf8'));
  const concept = concepts.find(c => c.id === cover);
  await copyFile(path.join(output, 'covers', cover + '.png'), path.join(destination, 'cover-' + cover + '.png'));
  const media = [{kind: 'cover', source: 'assets/projects/tonerum/cover-' + cover + '.png', alt: 'Tonerum: ' + concept.name + '. Grafisk komposition med faktiske udsnit af appen.'}];
  for (const shot of capture.screenshots) {
    await copyFile(path.join(output, 'screenshots', shot.id + '.png'), path.join(destination, shot.id + '.png'));
    media.push({kind: 'image', source: 'assets/projects/tonerum/' + shot.id + '.png', alt: shot.title});
  }
  // Replace just this project's media block, preserving the other posts' formatting.
  const mediaStart = text.indexOf('    "media": [', start);
  const mediaEnd = text.indexOf('\n    ]', mediaStart) + '\n    ]'.length;
  if (mediaStart < 0 || mediaEnd < mediaStart) throw new Error('Ukendt medieformat');
  const replacement = '    "media": [\n' + media.map(m => '      ' + JSON.stringify(m)).join(',\n') + '\n    ]';
  text = text.slice(0, mediaStart) + replacement + text.slice(mediaEnd);
  JSON.parse(text);
}
await writeFile(source, text);
console.log(cover ? 'Verificeret projektlink og valgte medier indsat.' : 'Verificeret projektlink indsat; medier afventer valg.');
