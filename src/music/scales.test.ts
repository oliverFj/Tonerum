import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScale, SCALE_TYPES } from './scales';
import { findPositions } from './theory';
import { optimizeMelody } from './optimizer';
import { isGuitarControl } from './guitarControls';

test('major, natural minor and both pentatonics contain the expected notes', () => {
  const pitches = (type: Parameters<typeof createScale>[0]['type'], tonic: number) => createScale({ type, tonic, direction: 'up' })
    .events.map(event => event.type === 'note' ? event.midi : null);
  assert.deepEqual(pitches('major', 0), [48, 50, 52, 53, 55, 57, 59, 60]);
  assert.deepEqual(pitches('minor', 9), [57, 59, 60, 62, 64, 65, 67, 69]);
  assert.deepEqual(pitches('minor-pentatonic', 9), [57, 60, 62, 64, 67, 69]);
  assert.deepEqual(pitches('major-pentatonic', 0), [48, 50, 52, 55, 57, 60]);
});

test('all scales and directions are playable, avoid command notes and retain their octave in fingering suggestions', () => {
  for (const type of SCALE_TYPES) for (let tonic = 0; tonic < 12; tonic++) for (const direction of ['up', 'down', 'both'] as const) {
    const scale = createScale({ type: type.id, tonic, direction });
    const path = optimizeMelody(scale.events, { center: 11, radius: 1, matchMode: 'exact' });
    scale.events.forEach((event, index) => {
      assert.equal(event.type, 'note');
      if (event.type !== 'note') return;
      assert.ok(findPositions(event.midi).length);
      assert.ok(!isGuitarControl(event.midi));
      assert.equal(path[index].position?.midi, event.midi);
      assert.equal(event.duration, index === scale.events.length - 1 ? 2 : 1);
    });
    const pitches = scale.events.flatMap(event => event.type === 'note' ? [event.midi] : []);
    assert.equal(Math.max(...pitches) - Math.min(...pitches), 12);
    if (direction === 'both') {
      assert.equal(pitches.filter(pitch => pitch === Math.max(...pitches)).length, 1, 'play the turning note once');
      assert.deepEqual(pitches, [...pitches].reverse());
    }
    if (direction === 'down') assert.equal(pitches[0], 60 + tonic);
  }
});

test('scale notation spells C-sharp major with E-sharp and B-sharp and E-flat minor with flats', () => {
  const sharp = createScale({ type: 'major', tonic: 1, direction: 'up' });
  assert.deepEqual(sharp.events.map(event => event.type === 'note' ? event.spelling : null), [
    { step: 0, octave: 3, alter: 1 }, { step: 1, octave: 3, alter: 1 }, { step: 2, octave: 3, alter: 1 },
    { step: 3, octave: 3, alter: 1 }, { step: 4, octave: 3, alter: 1 }, { step: 5, octave: 3, alter: 1 },
    { step: 6, octave: 3, alter: 1 }, { step: 0, octave: 4, alter: 1 },
  ]);
  const flat = createScale({ type: 'minor', tonic: 3, direction: 'up' });
  assert.ok(flat.events.every(event => event.type === 'note' && event.spelling!.alter <= 0));
});
