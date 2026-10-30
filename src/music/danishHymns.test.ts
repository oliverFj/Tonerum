import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DANISH_HYMNS } from './danishHymns';
import { MELODIES } from './melodies';

// Rhythms read bar by bar from the linked scores, independently of pitches.
// q/e/s = quarter/eighth/sixteenth; d = dotted; h/w = half/whole;
// r = rest; t = two-and-a-half beats (a dotted quarter tied to a quarter).
const sourceRhythms: Record<string, string[]> = {
  'nu-titte-til-hinanden': [
    'e', 'de s e e', 'q e e', 'de s e e', 'q re e', 'dq e',
    'dq e', 'de s e e', 'q e e', 'de s e e', 'q e e',
    'q e e', 'q re e', 'q e e', 'e e e e', 'q q', 'q rq',
  ],
  'se-nu-stiger-solen': [
    'dq e q q', 'h q q', 'h h', 'dh rq',
    'dq e q q', 'h q q', 'h h', 'dh rq',
    'dq e q q', 'h q q', 'h q q', 'dh rq',
    'dq e q q', 'h q q', 'h q q', 'dh rq',
  ],
  'op-al-den-ting': [
    'q', 'q q h h', 'q q h rq q', 'q q h q q', 'h h rq q',
    'q q h h', 'q q h rq q', 'q q h q q', 'h h rh',
  ],
  'altid-frejdig': [
    'dq e q q', 'q q h', 'q q q q', 'h q rq',
    'dq e q q', 'q q h', 'q q q q', 'h h', 'dh rq',
  ],
  'i-oesten-stiger-solen': [
    'e', 'de s e e', 'de s e e', 'e e de s', 'q re e',
    'de s e e', 'de s e e', 'de s e e', 'dq',
  ],
  'hil-dig-frelser': [
    'h h', 'q q q q', 'h h', 'h h', 'q q q q', 'h h', 'q q q q',
    'q q q q', 'q q q q', 'q q q q', 'h h', 'dh q', 'h h', 'w',
  ],
  'den-signede-dag': [
    'h', 'h q q', 'h h', 'h h', 'h h', 'h q q', 'h h', 'w',
    'h h', 'h q q', 'h h', 'h h', 'h h', 'h q q', 'h h', 'w',
    'h h', 'h q q', 'h h', 'h h', 'h h', 'h q q', 'h h', 'w', 'h',
  ],
  'nu-falmer-skoven': [
    'q', 'q q q', 'h q', 'h q', 'q rq q', 'h q',
    'dq e q', 'dh', 'q rq q', 'h q', 'dq e q',
    'h q', 'q rq q', 'q q q', 'h q', 'dh', 'h rq',
  ],
  'det-er-saa-yndigt': [
    'e', 'q e de s e', 'de s e q e', 'q e de s e', 'q e e e e',
    'q e de s e', 'q e q e', 'q e e e e', 'e e e e e e',
    'q e e e e', 'q e e e e', 'q e de s e', 'q e e e e',
    'dq dq', 't e', 'dq dq', 'h re',
  ],
  'dejlig-er-den-himmel-blaa': [
    'q q q q', 'q q h', 'dq e q q', 'q q h', 'dq e q q', 'dq e q q',
    'dq e q q', 'dq e q q', 'q q q q', 'q q h', 'q q q q', 'h h', 'dh rq',
  ],
  'blomstre-som-en-rosengaard': [
    'de s e e', 'e e q', 'e e e e', 'q q', 'de s e e', 'e e q',
    'e e e e', 'e e q', 'de s e e', 'e e q', 'de s e e', 'q q',
    'h', 'e e e e', 'q q', 'h',
  ],
};

for (const [id, bars] of Object.entries(sourceRhythms)) {
  test(`${id}: every onset, rest and tied duration follows the written score`, () => {
    const lengths: Record<string, number> = { q: 1, e: .5, s: .25, de: .75, dq: 1.5, h: 2, dh: 3, w: 4, t: 2.5 };
    const expected = bars.join(' ').split(/\s+/).map(token => ({
      type: token.startsWith('r') ? 'rest' : 'note',
      duration: lengths[token.replace(/^r/, '')],
    }));
    const melody = DANISH_HYMNS.find(m => m.id === id)!;
    assert.deepEqual(melody.events.map(({ type, duration }) => ({ type, duration })), expected);
  });
}

test('eleven complete Danish hymn verses are catalogued as Salmer with explicit sources and practice tempos', () => {
  const references = [
    ['nu-titte-til-hinanden', 32.5, 47, 60, [55, 52, 50, 52, 53]],
    ['se-nu-stiger-solen', 64, 45, 60, [45, 45, 48, 50, 52]],
    ['op-al-den-ting', 49, 48, 60, [48, 48, 48, 53, 50]],
    ['altid-frejdig', 36, 50, 64, [59, 57, 60, 59, 52]],
    ['i-oesten-stiger-solen', 16, 47, 59, [47, 52, 51, 52, 52]],
    ['hil-dig-frelser', 56, 48, 60, [53, 48, 57, 55, 53]],
    ['den-signede-dag', 96, 48, 62, [48, 52, 52, 52, 55]],
    ['nu-falmer-skoven', 49, 51, 61, [51, 51, 60, 58, 56]],
    ['det-er-saa-yndigt', 48, 48, 64, [48, 57, 53, 58, 57]],
    ['dejlig-er-den-himmel-blaa', 52, 50, 62, [50, 52, 54, 55, 57]],
    ['blomstre-som-en-rosengaard', 32, 49, 62, [57, 57, 54, 55, 57]],
  ] as const;
  assert.equal(DANISH_HYMNS.length, 11);
  for (const [id, beats, low, high, opening] of references) {
    const melody = DANISH_HYMNS.find(m => m.id === id)!;
    const pitches = melody.events.filter(e => e.type === 'note').map(e => e.midi);
    assert.ok(MELODIES.includes(melody), id);
    assert.equal(melody.category, 'Salmer');
    assert.equal(melody.events.reduce((sum, e) => sum + e.duration, 0), beats, id);
    assert.deepEqual([Math.min(...pitches), Math.max(...pitches)], [low, high], id);
    assert.deepEqual(pitches.slice(0, opening.length), opening, id);
    assert.ok(melody.source.url.startsWith('https://'));
    assert.ok(melody.source.edition.includes('ét helt vers'));
    assert.ok(melody.source.edition.includes('øvetempo'));
  }
});

test('Ring keeps the raised sixth and Op al den ting starts directly on its pickup', () => {
  const ring = DANISH_HYMNS.find(m => m.id === 'se-nu-stiger-solen')!;
  assert.deepEqual(ring.events.slice(7, 10).map(e => [e.type === 'note' ? e.midi : null, e.duration]),
    [[52, 2], [54, 2], [55, 3]]);
  const traditional = DANISH_HYMNS.find(m => m.id === 'op-al-den-ting')!;
  assert.deepEqual(traditional.timeSignature, [3, 2]);
  assert.equal(traditional.tempo, 120);
  assert.deepEqual(traditional.events[0], { type: 'note', midi: 48, duration: 1 });
  assert.deepEqual(traditional.events.slice(-3), [
    { type: 'note', midi: 50, duration: 2 },
    { type: 'note', midi: 48, duration: 2 },
    { type: 'rest', duration: 2 },
  ]);
});

test('Meidell keeps both endings; Weyse keeps ties without losing repeated attacks', () => {
  const sky = DANISH_HYMNS.find(m => m.id === 'dejlig-er-den-himmel-blaa')!;
  assert.deepEqual(sky.events.slice(-9).map(e => [e.type === 'note' ? e.midi : null, e.duration]),
    [[54, 2], [57, 1], [62, 1], [57, 1], [54, 1], [55, 2], [52, 2], [50, 3], [null, 1]]);
  const wedding = DANISH_HYMNS.find(m => m.id === 'det-er-saa-yndigt')!;
  assert.deepEqual(wedding.events.slice(-6).map(e => [e.type === 'note' ? e.midi : null, e.duration]),
    [[60, 2.5], [53, .5], [57, 1.5], [55, 1.5], [53, 2], [null, .5]]);
  const winding = DANISH_HYMNS.find(m => m.id === 'altid-frejdig')!;
  assert.deepEqual(winding.events.slice(-4).map(e => e.type === 'note' ? e.midi : null), [59, 57, 55, null]);
});
