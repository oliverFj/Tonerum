import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CIVILIZATION_MELODIES } from './civilizationMelodies';
import { MELODIES } from './melodies';
import { findPositions } from './theory';
import { readFileSync } from 'node:fs';

// Frozen source references, decoded independently from the cited ABC/LilyPond
// files during the score audit. They are not generated from the app melodies.
const sourceEvents = JSON.parse(readFileSync(new URL('./fixtures/civilization-source-events.json', import.meta.url), 'utf8')) as
  Record<string, { source: string; adaptation?: string; events: [number | null, number][] }>;

for (const [id, reference] of Object.entries(sourceEvents)) {
  test(`${id}: every pitch, onset and duration matches ${reference.adaptation ? 'the declared score reduction' : 'the cited score'}`, () => {
    const melody = CIVILIZATION_MELODIES.find(m => m.id === id)!;
    assert.equal(melody.events.length, reference.events.length, reference.source);
    melody.events.forEach((event, index) => {
      const [pitch, duration] = reference.events[index];
      assert.equal(event.type === 'note' ? event.midi : null, pitch, `${id} event ${index}`);
      assert.ok(Math.abs(event.duration - duration) < 1e-9, `${id} duration ${index}`);
    });
  });
}

// Written rhythm per bar, read from the five image/PDF sources. q = quarter,
// e = eighth, s = sixteenth, d = dotted, h = half, r = rest. Unlike a total
// length check, this catches misplaced onsets and incorrectly merged ties.
function checkWrittenRhythm(id: string, bars: string[]) {
  const duration: Record<string, number> = { q: 1, e: .5, s: .25, dq: 1.5, de: .75, h: 2, dh: 3 };
  const expected = bars.join(' ').split(/\s+/).map(token => ({
    type: token.startsWith('r') ? 'rest' : 'note',
    duration: duration[token.replace(/^r/, '')],
  }));
  const melody = CIVILIZATION_MELODIES.find(m => m.id === id)!;
  assert.deepEqual(melody.events.map(({ type, duration }) => ({ type, duration })), expected, id);
}

test('Mo Li Hua retains all sixteen source bars, including the 2/4 bar', () => {
  checkWrittenRhythm('civ-china', [
    'q e e e e e e', 'q e e h', 'q e e e e e e', 'q e e h',
    'q q q e e', 'q q h', 'q e e q e e', 'q e e h',
    'e e e e dq e', 'q e e h', 'q e e e e e e', 'h',
    'q e e dq e', 'e e e e h', 'q e e dq e', 'e e e e h',
  ]);
});

test('German and Hungarian folk songs retain every written note length and repeat', () => {
  const germanB = ['e', 'q e q e', 'dq q e', 'de s e de s e', 'dq rq'];
  checkWrittenRhythm('civ-germany', ['e', 'q e de s e', 'dq q e', 'de s e q e', 'dq rq', ...germanB, ...germanB]);
  checkWrittenRhythm('civ-hungary', [
    'e e e e', 'e e q', 'e e e e', 'e e q', 'e q e', 'e e q',
    'e e e e', 'e e q', 'e e e e', 'e e q', 'e q e', 'e e q',
  ]);
});

test('Itsuki keeps the Andante statement, its pickup and the short penultimate bar', () => {
  checkWrittenRhythm('civ-japan', ['e', 'dq e e e', 'dq e e e', 'dq e e e', 'q re e e e',
    'q q q', 'e e q e e', 'q e e', 'dh']);
});

test('Brejeiro retains all syncopations and the reattack before tied sixteenths', () => {
  const intro = Array(4).fill('e s s e s s');
  const run = 's e s s e s';
  const a = ['re e e e', 'de s rs e s', 'e e e e', 'de s re e',
    're e e e', 'de s rs e s', 'e e e e', 'de s re e',
    're e e e', run, 're e e e', run, 're e rs e s', run, 'de s rs e s', run];
  const b = ['e e e e', 'de e e s', 'e e e e', 'de s q',
    're e e e', 'de e e s', 'e e e e', 'de s q', 're e e e', run,
    're e e e', run, 're e rs e s', run, 're e rs e s'];
  const trio = ['s e s e e', run, 's e s e e', 'q re e', 's e s e e', run, run, run,
    's e s e e', run, 's e s e e', 'q re e', run, run, run, 'q q'];
  checkWrittenRhythm('civ-brazil', [...intro, ...a, ...b, 'q re e', ...trio, ...intro, ...a, ...b, 'q q']);
});

test('explicit source tempos use quarter-note BPM, with Tourdion practice speed documented', () => {
  const spain = CIVILIZATION_MELODIES.find(m => m.id === 'civ-spain')!;
  assert.equal(spain.tempo, 74); // LilyPond: tempo 4 = 74.
  const france = CIVILIZATION_MELODIES.find(m => m.id === 'civ-france')!;
  assert.deepEqual(france.timeSignature, [3, 2]);
  assert.equal(france.tempo, 160);
  assert.ok(france.source.edition.includes('320 fjerdedele/minut'));
  assert.ok(france.source.edition.includes('halv hastighed'));
});

test('Civilization practice editions retain their complete source forms and playable pitches', () => {
  const beats: Record<string, number> = {
    'civ-england': 57, 'civ-russia': 68, 'civ-korea': 48, 'civ-greece': 24,
    'civ-australia': 64, 'civ-france': 192, 'civ-scotland-bonnie': 48.5, 'civ-america': 65,
    'civ-brazil': 176, 'civ-china': 62, 'civ-germany': 36, 'civ-sweden-helan': 32,
    'civ-hungary': 24, 'civ-japan': 23.5, 'civ-spain': 279,
  };
  assert.equal(CIVILIZATION_MELODIES.length, 15);
  for (const melody of CIVILIZATION_MELODIES) {
    assert.ok(Math.abs(melody.events.reduce((sum, event) => sum + event.duration, 0) - beats[melody.id]) < 1e-8, melody.id);
    assert.ok(melody.events.every(event => event.duration > 0 && Number.isFinite(event.duration)));
    assert.ok(melody.events.every(event => event.type === 'rest' || findPositions(event.midi).length > 0), melody.id);
    assert.ok(MELODIES.includes(melody));
    assert.equal(melody.category, 'Civilization VI');
  }
  const england = CIVILIZATION_MELODIES.find(m => m.id === 'civ-england')!;
  assert.deepEqual(england.events.slice(0, 7).map(e => e.type === 'note' && [e.midi, e.duration]),
    [[52, 2], [52, 1], [59, 2], [59, 1], [54, 1.5], [55, .5], [54, 1]]);
  assert.ok(england.key.intervals?.includes(9), 'Dorian sixth is major');
  assert.equal(CIVILIZATION_MELODIES.find(m => m.id === 'civ-korea')!.events.filter(e => Math.abs(e.duration - 1 / 3) < 1e-8).length, 6);
});

test('Hard Times follows Foster’s vocal rhythm, pickups and rests rather than the doubled folk variant', () => {
  const melody = CIVILIZATION_MELODIES.find(m => m.id === 'civ-america')!;
  assert.deepEqual(melody.timeSignature, [4, 4]);
  assert.equal(melody.tempo, 100);
  assert.ok(melody.source.title.includes('1854'));
  assert.ok(melody.source.edition.includes('uden metronomtal'));
  const event = (e: typeof melody.events[number]) => e.type === 'note' ? [e.midi, e.duration] : ['rest', e.duration];
  assert.deepEqual(melody.events.slice(0, 8).map(event), [
    [55, .5], [57, .5], // One-beat pickup; no prefixed silence.
    [59, 1], [59, .5], [59, .5], [59, .5], [62, 1], [59, .5],
  ]);
  // The original has two distinct last notes in the second bar, not a
  // repeated fragment of the opening. This protects melody as well as time.
  assert.deepEqual(melody.events.slice(8, 15).map(event), [
    [57, .5], [55, .5], [55, .5], [57, .5], [59, 1], [62, .75], [60, .25],
  ]);
  const chorusStart = melody.events.findIndex(e => e.phraseStart?.startsWith('B ·'));
  assert.equal(melody.events.slice(0, chorusStart).reduce((sum, e) => sum + e.duration, 0), 32);
  assert.deepEqual(melody.events.slice(chorusStart - 2, chorusStart + 9).map(event), [
    [55, 2], ['rest', 1], [59, .5], [60, .5],
    [62, 1], ['rest', .5], [62, .5], [62, 1], [61, .5], [62, .5], [64, 2],
  ]);
  assert.deepEqual(melody.events.slice(-2).map(event), [[55, 3], ['rest', 1]]);
  assert.ok(melody.events.filter(e => e.duration === .25).length >= 6, 'source sixteenth notes are retained');
});

test('new editions preserve source openings, repeats, and explicit adaptation credits', () => {
  const get = (id: string) => CIVILIZATION_MELODIES.find(m => m.id === id)!;
  const pitches = (id: string) => get(id).events.flatMap(e => e.type === 'note' ? [e.midi] : []);
  assert.deepEqual(pitches('civ-china').slice(0, 7), [57, 57, 60, 62, 65, 65, 62]);
  assert.equal(get('civ-china').source.licenseUrl, 'https://creativecommons.org/licenses/by/2.5/');
  assert.ok(get('civ-china').source.title.includes('Pierre Dragicevic'));
  const german = get('civ-germany');
  const starts = german.events.flatMap((e, i) => e.phraseStart ? [i] : []);
  assert.deepEqual(german.events.slice(starts[1], starts[2]).map(({ phraseStart: _, ...e }) => e),
    german.events.slice(starts[2]).map(({ phraseStart: _, ...e }) => e));
  assert.deepEqual(pitches('civ-sweden-helan').slice(0, 4), [54, 57, 50, 54]);
  assert.deepEqual(pitches('civ-hungary').slice(0, 4), [67, 67, 65, 62]);
  assert.deepEqual(pitches('civ-japan').slice(0, 5), [52, 57, 59, 60, 64]);
  const spain = get('civ-spain');
  assert.deepEqual(spain.events.slice(0, 2).map(e => e.type === 'note' && [e.midi, e.duration]), [[64, 2], [62, 1]]);
  assert.ok(spain.subtitle.includes('uden tremolo'));
  assert.equal(spain.source.licenseUrl, 'https://creativecommons.org/licenses/by-sa/3.0/');
  const brazil = get('civ-brazil');
  assert.deepEqual(brazil.events.slice(0, 24).map(({ phraseStart: _, ...e }) => e),
    brazil.events.slice(brazil.events.findIndex(e => e.phraseStart?.startsWith('D.C.')), brazil.events.findIndex(e => e.phraseStart?.startsWith('D.C.')) + 24).map(({ phraseStart: _, ...e }) => e));
});
