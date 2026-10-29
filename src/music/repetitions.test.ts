import { test } from 'node:test';
import assert from 'node:assert/strict';
import { noteRepetitions } from './repetitions';
import type { MelodyEvent } from './types';
import type { NoteResult } from './trainer';

const note = (midi: number): MelodyEvent => ({ type: 'note', midi, duration: 1 });

test('four repeated notes become three, two and one evenly spaced spokes with stable identities', () => {
  const events = [note(60), note(60), note(60), note(60), note(62)];
  const results: NoteResult[] = events.map(() => 'pending');
  for (let index = 0; index < 4; index++) {
    const run = noteRepetitions(events, index, results)!;
    assert.equal(run.start, 0);
    assert.equal(run.remaining, 4 - index);
    assert.deepEqual(run.spokes.filter(spoke => spoke.pending).map(spoke => [spoke.eventIndex, spoke.angle]),
      Array.from({ length: 4 - index }, (_, slot) => [index + slot, slot * 360 / (4 - index)]));
    assert.equal(run.spokes[0].eventIndex, 0, 'played spokes keep their keys while fading out');
    results[index] = 'correct';
  }
  assert.equal(noteRepetitions(events, 3, results)!.remaining, 0);
  const next = noteRepetitions(events, 4, results)!;
  assert.equal(next.start, 4);
  assert.equal(next.remaining, 1);
  assert.equal(next.spokes[0].angle, 0);
});

test('a correct answer removes a spoke immediately while the rhythm clock still stays on that note', () => {
  const events = [note(60), note(60), note(60)];
  assert.equal(noteRepetitions(events, 0, ['pending', 'pending', 'pending'])!.remaining, 3);
  const hit = noteRepetitions(events, 0, ['correct', 'pending', 'pending'])!;
  assert.equal(hit.remaining, 2);
  assert.deepEqual(hit.spokes.filter(spoke => spoke.pending).map(spoke => spoke.angle), [0, 180]);
  assert.deepEqual(noteRepetitions(events, 1, ['correct', 'pending', 'pending']), hit,
    'moving the clock to the next repeated note must not consume another spoke');
  assert.equal(noteRepetitions(events, 1, ['missed', 'pending', 'pending'])!.remaining, 2);
});

test('rests, another pitch and another octave end the group of repeated notes', () => {
  const events: MelodyEvent[] = [note(60), note(60), { type: 'rest', duration: 1 }, note(60), note(72), note(62)];
  assert.equal(noteRepetitions(events, 0)!.remaining, 2);
  assert.equal(noteRepetitions(events, 1)!.remaining, 1);
  assert.equal(noteRepetitions(events, 2), null);
  assert.equal(noteRepetitions(events, 3)!.remaining, 1);
  assert.equal(noteRepetitions(events, 4)!.remaining, 1);
  assert.equal(noteRepetitions([], 0), null);
});
