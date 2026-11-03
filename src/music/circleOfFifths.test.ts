import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIFTHS, fifthsAnswer, minorTonic } from './circleOfFifths';

test('circle covers all twelve pitches; fifths, fourths and relative minors wrap correctly', () => {
  assert.equal(new Set(FIFTHS.map(key => key.tonic)).size, 12);
  FIFTHS.forEach((key, index) => {
    assert.equal(FIFTHS[fifthsAnswer(index, 'fifth')].tonic, (key.tonic + 7) % 12);
    assert.equal(FIFTHS[fifthsAnswer(index, 'fourth')].tonic, (key.tonic + 5) % 12);
    assert.equal(fifthsAnswer(index, 'minor'), index);
    assert.equal(minorTonic(index), (key.tonic + 9) % 12);
  });
  assert.equal(minorTonic(0), 9);
});
