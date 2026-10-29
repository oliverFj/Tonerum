import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FRETBOARD, NATURALS, findPositions, isInRegion, noteName, pitchClass, regionBounds, samePosition } from './theory';
import { analyzeMelody, findBestCenter, movementCost, optimizeMelody, positionCost } from './optimizer';
import { MELODIES } from './melodies';
import type { MelodyEvent, NoteEvent, OptimizationOptions, PathStep, Position } from './types';

const note = (midi: number): NoteEvent => ({ type: 'note', midi, duration: 1 });
const exact: OptimizationOptions = { center: 10, radius: 2, matchMode: 'exact' };

test('standard tuning, octave boundaries and all 102 positions are calculated correctly', () => {
  assert.equal(FRETBOARD.length, 102);
  assert.deepEqual(FRETBOARD.filter(p => p.fret === 0).map(p => p.midi), [64, 59, 55, 50, 45, 40]);
  assert.equal(noteName(59, true), 'B3');
  assert.equal(noteName(60, true), 'C4');
  assert.equal(noteName(40, true), 'E2');
  assert.deepEqual(findPositions(62).map(p => [p.string, p.fret]), [[2, 3], [3, 7], [4, 12]]);
  assert.ok(findPositions(62, 'pitchClass').length > findPositions(62).length);
  assert.ok(findPositions(62, 'pitchClass').every(p => pitchClass(p.midi) === 2));
  for (const fret of [10, 12]) assert.ok(FRETBOARD.filter(p => p.fret === fret).every(p => NATURALS.has(pitchClass(p.midi))));
});

test('position windows clamp at both edges; an open string belongs only to a window containing zero', () => {
  assert.deepEqual(regionBounds({ center: 0, radius: 4 }), [0, 4]);
  assert.deepEqual(regionBounds({ center: 16, radius: 4 }), [12, 16]);
  assert.equal(isInRegion({ string: 6, fret: 0, midi: 40 }, exact), false);
  assert.equal(isInRegion({ string: 6, fret: 0, midi: 40 }, { center: 1, radius: 1 }), true);
});

test('source forms retain full note counts, source pitch ranges, rhythm and repetitions', () => {
  const expected = [
    { notes: 83, events: 94, beats: 96, low: 61, high: 74 },
    { notes: 42, events: 42, beats: 48, low: 60, high: 69 },
    { notes: 27, events: 27, beats: 16, low: 60, high: 72 },
  ];
  MELODIES.slice(0, 3).forEach((melody, i) => {
    const notes = melody.events.filter(e => e.type === 'note');
    assert.equal(notes.length, expected[i].notes, melody.title);
    assert.equal(melody.events.length, expected[i].events, melody.title);
    assert.ok(Math.abs(melody.events.reduce((sum, e) => sum + e.duration, 0) - expected[i].beats) < 1e-9, melody.title);
    assert.equal(Math.min(...notes.map(n => n.midi)), expected[i].low);
    assert.equal(Math.max(...notes.map(n => n.midi)), expected[i].high);
    assert.ok(melody.events.every(e => e.duration > 0 && Number.isFinite(e.duration)));
    assert.ok(melody.source.url.startsWith('https://'));
  });
  const anthem = MELODIES[0].events;
  assert.deepEqual(anthem.slice(0, 5).map(e => e.type === 'note' ? e.midi : null), [62, 69, 69, 66, 62]);
  assert.deepEqual(anthem.slice(30, 62).map(({ phraseStart: _, ...e }) => e), anthem.slice(62).map(({ phraseStart: _, ...e }) => e));
  assert.deepEqual(MELODIES[1].events.slice(0, 14).map(({ phraseStart: _, ...e }) => e), MELODIES[1].events.slice(28).map(({ phraseStart: _, ...e }) => e));
});

test('expanded songbook keeps complete forms, explicit sources and playable guitar ranges', () => {
  const expected = [
    ['mester-jakob', 32, 32, 55, 69], ['happy-birthday', 25, 24, 55, 67],
    ['oats-and-beans', 38, 30, 48, 60], ['dejlig-er-jorden', 42, 60, 52, 65],
    ['first-noel', 73, 72, 50, 62],
    ['ievan-polkka', 128, 64, 54, 66],
    ['au-clair-de-la-lune', 44, 32, 55, 64], ['ode-to-joy', 62, 64, 55, 67],
    ['amazing-grace', 35, 42, 55, 67], ['glade-jul', 47, 69, 55, 72],
    ['ingen-er-saa-tryg', 32, 24, 61, 74], ['holly-and-ivy', 59, 48, 60, 74],
    ['terra-beata', 63, 64, 58, 75],
  ] as const;
  assert.equal(MELODIES.length, 17);
  assert.equal(new Set(MELODIES.map(m => m.id)).size, MELODIES.length);
  for (const [id, count, beats, low, high] of expected) {
    const melody = MELODIES.find(m => m.id === id)!;
    const notes = melody.events.filter(e => e.type === 'note');
    assert.equal(notes.length, count, id);
    assert.equal(melody.events.reduce((sum, e) => sum + e.duration, 0), beats, id);
    assert.equal(Math.min(...notes.map(n => n.midi)), low, id);
    assert.equal(Math.max(...notes.map(n => n.midi)), high, id);
  }
  for (const melody of MELODIES) {
    assert.ok(melody.events.every(e => e.duration > 0 && Number.isFinite(e.duration)), melody.id);
    assert.ok(melody.events.every(e => e.type === 'rest' || findPositions(e.midi).length), melody.id);
    assert.ok(melody.source.url.startsWith('https://'));
    assert.ok(['Børnesange', 'Salmer', 'Traditionals'].includes(melody.category));
  }
});

test('every library note preserves its MIDI pitch in exact mode; rests never become notes', () => {
  for (const melody of MELODIES) {
    const path = optimizeMelody(melody.events, exact);
    assert.equal(path.length, melody.events.length);
    melody.events.forEach((event, i) => {
      assert.equal(path[i].eventIndex, i);
      assert.equal(path[i].substituted, false);
      if (event.type === 'rest') assert.equal(path[i].position, null);
      else assert.equal(path[i].position?.midi, event.midi);
    });
  }
});

test('repeated notes can keep the same position across notes and rests', () => {
  const events: MelodyEvent[] = [note(69), note(69), { type: 'rest', duration: 2 }, note(69)];
  const path = optimizeMelody(events, exact);
  assert.ok(samePosition(path[0].position, path[1].position));
  assert.equal(path[2].position, null);
  assert.ok(samePosition(path[1].position, path[3].position));
});

test('unavailable pitches are explicit, including empty and all-rest melodies', () => {
  const events = [note(60), note(100), note(62)];
  const path = optimizeMelody(events, exact);
  assert.equal(path[0].position?.midi, 60);
  assert.equal(path[1].position, null);
  assert.equal(path[2].position?.midi, 62);
  assert.deepEqual(optimizeMelody([], exact), []);
  assert.deepEqual(optimizeMelody([{ type: 'rest', duration: 1 }], exact), [{ eventIndex: 0, position: null, substituted: false }]);
});

test('pitch-class mode reports substitutions and statistics never merge original octaves', () => {
  const options: OptimizationOptions = { center: 1, radius: 1, matchMode: 'pitchClass' };
  const events = [note(60), note(72)];
  const path = optimizeMelody(events, options);
  path.forEach((step, i) => {
    assert.equal(pitchClass(step.position!.midi), 0);
    assert.equal(step.substituted, step.position!.midi !== (events[i] as NoteEvent).midi);
  });
  assert.ok(path.some(step => step.substituted));
  const analysis = analyzeMelody(events, options, 'pitchClass');
  assert.deepEqual(analysis.pitches, [60, 72]);
  assert.equal(analysis.inRange.length, 2);
  assert.equal(analysis.exactInRange.length, 1);
});

function pathCost(events: NoteEvent[], path: PathStep[], options: OptimizationOptions): number {
  return path.reduce((cost, step, i) => cost + positionCost(step.position!, events[i].midi, options)
    + (i > 0 ? movementCost(path[i - 1].position!, step.position!) : 0), 0);
}

test('melody-wide optimization matches an exhaustive search, including a case where greedy choice loses', () => {
  let foundGreedyLoss = false;
  // Enumerate actual guitar alternatives independently of the DP recurrence.
  for (const pitches of [[60, 65], [64, 69, 74], [62, 67, 66], [60, 72, 60], [71, 61, 74], [65, 64, 69]]) {
    const events = pitches.map(note);
    const options: OptimizationOptions = { center: 7, radius: 4, matchMode: 'exact' };
    let minimum = Infinity;
    const enumerate = (positions: Position[]) => {
      if (positions.length === events.length) {
        const steps = positions.map((position, eventIndex) => ({ position, eventIndex, substituted: false }));
        minimum = Math.min(minimum, pathCost(events, steps, options));
        return;
      }
      for (const position of findPositions(events[positions.length].midi)) enumerate([...positions, position]);
    };
    enumerate([]);
    const optimized = pathCost(events, optimizeMelody(events, options), options);
    assert.ok(Math.abs(optimized - minimum) < 1e-9);
    const greedy: PathStep[] = [];
    events.forEach((event, i) => {
      const position = findPositions(event.midi).sort((a, b) =>
        positionCost(a, event.midi, options) + (i ? movementCost(greedy[i - 1].position!, a) : 0)
        - positionCost(b, event.midi, options) - (i ? movementCost(greedy[i - 1].position!, b) : 0))[0];
      greedy.push({ eventIndex: i, position, substituted: false });
    });
    if (pathCost(events, greedy, options) > optimized + 1e-9) foundGreedyLoss = true;
  }
  assert.ok(foundGreedyLoss, 'at least one fixture must distinguish DP from local optimization');
});

test('center search finds a valid region that can hold the anthem in its original octaves', () => {
  const center = findBestCenter(MELODIES[0].events, 2, 'exact');
  assert.ok(center >= 0 && center <= 16);
  const analysis = analyzeMelody(MELODIES[0].events, { center, radius: 2 }, 'exact');
  assert.equal(analysis.inRange.length, analysis.pitches.length);
});
