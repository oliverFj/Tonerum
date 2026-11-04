import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const output = path.join(root, 'artifacts/product-media/tonerum');
await mkdir(path.join(output, 'covers'), {recursive: true});
const image = async (name, mime = 'image/png') => 'data:' + mime + ';base64,' + (await readFile(path.join(root, name))).toString('base64');
const fragment = name => image('artifacts/product-media/tonerum/fragments/' + name + '.png');
const font = await image('design/assets/inter-latin-wght-normal.woff2', 'font/woff2');
const light = await image('design/assets/tonerum-symbol-light.svg', 'image/svg+xml');
const dark = await image('design/assets/tonerum-symbol-dark.svg', 'image/svg+xml');
const guitar = await fragment('guitar'), violin = await fragment('violin'), staff = await fragment('staff'), circle = await fragment('circle');
const concepts = [
  {id: 'a', name: 'Fra node til greb', description: 'Noder og gribebræt som to udsnit af den samme melodi. Det tætteste på Tonerums kerne.', body: `<article class="cover a"><header><img src="${light}"><strong>tonerum<span>.</span></strong></header><div class="intro"><p class="eyebrow">SE · LYT · SPIL</p><h1>Fra node<br>til greb.</h1></div><div class="staff frame"><img src="${staff}"></div><div class="guitar frame"><img src="${guitar}"></div><p class="caption">Et øverum til guitar og violin</p></article>`},
  {id: 'b', name: 'To instrumenter. Ét øverum.', description: 'Guitar og violin i to tydelige felter med hver sit faktiske gribebræt.', body: `<article class="cover b"><header><img src="${dark}"><strong>tonerum<span>.</span></strong></header><h1>To instrumenter.<br>Ét øverum.</h1><div class="instrument guitar-part"><p>01 <strong>Guitar</strong><span>Find dit greb</span></p><div class="crop"><img src="${guitar}"></div></div><div class="instrument violin-part"><p>02 <strong>Violin</strong><span>Find din position</span></p><div class="crop"><img src="${violin}"></div></div><p class="caption">Melodier · skalaer · enkelttoner</p></article>`},
  {id: 'c', name: 'Find sammenhængen', description: 'Kvintcirklen som hovedmotiv: et visuelt øverum for toner, tonearter og skalaer.', body: `<article class="cover c"><header><img src="${light}"><strong>tonerum<span>.</span></strong></header><div class="intro"><p class="eyebrow">TONER · TONEARTER · SKALAER</p><h1>Find<br>sammenhængen.</h1></div><img class="circle" src="${circle}"><p class="caption">Lyt. Udforsk. Spil.</p></article>`},
];
const css = await readFile(new URL('./covers.css', import.meta.url), 'utf8');
for (const concept of concepts) await writeFile(path.join(output, 'covers', concept.id + '.html'), `<!doctype html><html lang="da"><meta charset="utf-8"><title>${concept.name}</title><style>@font-face{font-family:Inter;src:url(${font}) format('woff2');font-weight:100 900}${css}</style>${concept.body}</html>`);
await writeFile(path.join(output, 'concepts.json'), JSON.stringify(concepts.map(({body, ...rest}) => rest), null, 2));
console.log('Tre redigerbare kortkompositioner klar.');
