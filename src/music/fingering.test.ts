import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FINGERING_PRESETS, fingeringRegion } from './fingering';
import { MELODIES } from './melodies';
import { optimizeMelody } from './optimizer';
import { isInRegion, regionBounds } from './theory';

const custom = { center: 7, radius: 1 };
const polkka = MELODIES.find(m => m.id === 'ievan-polkka')!;

test('fingering presets retain every melody pitch and octave, including notes outside the preferred area', () => {
  for (const preset of FINGERING_PRESETS) {
    const region = fingeringRegion(preset.id, polkka.events, 'exact', custom);
    const path = optimizeMelody(polkka.events, { ...region, matchMode: 'exact' });
    assert.equal(path.length, polkka.events.length);
    polkka.events.forEach((event, index) => {
      if (event.type === 'note') assert.equal(path[index].position?.midi, event.midi, preset.id);
      assert.equal(path[index].substituted, false);
    });
    if (preset.id === 'open' || preset.id === 'compact') {
      assert.ok(path.every(step => !step.position || isInRegion(step.position, region)), preset.id);
    }
    if (preset.id === 'upper') {
      assert.deepEqual(regionBounds(region), [10, 12]);
      assert.ok(path.some(step => step.position && !isInRegion(step.position, region)), 'low notes may use neighbouring frets');
      assert.ok(path.filter(step => step.position && isInRegion(step.position, region)).length > path.length / 2);
    }
  }
});

test('open, free and custom choices use their specified areas without changing the custom setting', () => {
  assert.deepEqual(regionBounds(fingeringRegion('open', polkka.events, 'exact', custom)), [0, 4]);
  assert.deepEqual(regionBounds(fingeringRegion('free', polkka.events, 'exact', custom)), [0, 16]);
  assert.deepEqual(fingeringRegion('custom', polkka.events, 'exact', custom), { center: 7, radius: 1, enabled: true });
  assert.deepEqual(custom, { center: 7, radius: 1 });
});
