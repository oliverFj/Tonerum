import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChallenge, EMPTY_PRACTICE, melodyChallenge, practiceReducer } from './practice';
import { MELODIES } from './melodies';
import { analyzeMelody, optimizeMelody, positionCost } from './optimizer';
import { FRETBOARD, isInRegion, regionBounds } from './theory';

test('no hand position gives equal access to every fret and ignores the remembered center', () => {
  const first = { center: 0, radius: 1, enabled: false, matchMode: 'exact' as const };
  const second = { ...first, center: 16, radius: 4 };
  assert.deepEqual(regionBounds(first), [0, 16]);
  assert.ok(FRETBOARD.every(p => isInRegion(p, first)));
  assert.equal(positionCost({ midi: 64, string: 1, fret: 0 }, 64, first), 0);
  assert.equal(positionCost({ midi: 64, string: 4, fret: 14 }, 64, first), 0);
  for (const melody of MELODIES) {
    assert.deepEqual(optimizeMelody(melody.events, first), optimizeMelody(melody.events, second));
    const analysis = analyzeMelody(melody.events, first, 'exact');
    assert.equal(analysis.inRange.length, analysis.pitches.length);
    assert.deepEqual(analysis.outside, []);
  }
});

test('tone hunts use only the provided pool and avoid adjacent repeats where possible', () => {
  assert.deepEqual(createChallenge([]), []);
  assert.deepEqual(createChallenge([60], 3), [60, 60, 60]);
  const challenge = createChallenge([60, 62, 64, 60], 10, () => .3);
  assert.equal(challenge.length, 10);
  assert.ok(challenge.every(midi => [60, 62, 64].includes(midi)));
  assert.ok(challenge.slice(1).every((midi, i) => midi !== challenge[i]));
});

test('melody practice retains actual pitches and repeated notes, omitting only rests', () => {
  assert.deepEqual(melodyChallenge([
    { type: 'note', midi: 60, duration: 1 },
    { type: 'rest', duration: 1 },
    { type: 'note', midi: 60, duration: 1 },
    { type: 'note', midi: 72, duration: 1 },
  ]), [60, 60, 72]);
  assert.equal(melodyChallenge(MELODIES[0].events).length, 83);
});

test('practice requires exact octaves, locks after a hit, and completes the last note once', () => {
  let state = practiceReducer(EMPTY_PRACTICE, { type: 'start', queue: [60, 60] });
  state = practiceReducer(state, { type: 'answer', midi: 72 });
  assert.equal(state.phase, 'playing');
  assert.equal(state.index, 0);
  assert.equal(state.mistakes, 1);
  state = practiceReducer(state, { type: 'answer', midi: 60 });
  assert.equal(state.phase, 'correct');
  const locked = practiceReducer(state, { type: 'answer', midi: 60 });
  assert.deepEqual(locked, state);
  state = practiceReducer(state, { type: 'next' });
  assert.equal(state.phase, 'playing');
  assert.equal(state.index, 1);
  state = practiceReducer(state, { type: 'answer', midi: 60 });
  state = practiceReducer(state, { type: 'next' });
  assert.equal(state.phase, 'complete');
  assert.equal(state.mistakes, 1);
  assert.deepEqual(practiceReducer(state, { type: 'answer', midi: 60 }), state);
  assert.deepEqual(practiceReducer(state, { type: 'stop' }), EMPTY_PRACTICE);
  assert.deepEqual(practiceReducer(state, { type: 'start', queue: [] }), EMPTY_PRACTICE);
});
