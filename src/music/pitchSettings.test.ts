import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PITCH_SETTINGS } from './pitch';
import { loadPitchSettings, savePitchSettings } from './pitchSettings';

test('saved detection settings survive a fresh load and can be replaced by defaults', () => {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); } };
  assert.deepEqual(loadPitchSettings(storage), DEFAULT_PITCH_SETTINGS);
  const selected = { attackRisePercent: 50, minAttackMs: 200, releaseMs: 160 };
  assert.equal(savePitchSettings(selected, storage), true);
  assert.deepEqual(loadPitchSettings(storage), selected);
  assert.equal(savePitchSettings(DEFAULT_PITCH_SETTINGS, storage), true);
  assert.deepEqual(loadPitchSettings(storage), DEFAULT_PITCH_SETTINGS);
});

test('malformed, incomplete and unsupported saved values fall back to current defaults', () => {
  for (const value of ['broken', 'null', '{}', '[]',
    '{"attackRisePercent":35,"minAttackMs":0,"releaseMs":120}',
    '{"attackRisePercent":"35","minAttackMs":120,"releaseMs":120}']) {
    assert.deepEqual(loadPitchSettings({ getItem: () => value }), DEFAULT_PITCH_SETTINGS);
  }
});

test('blocked browser storage keeps defaults and reports saving failure', () => {
  const storage = {
    getItem: () => { throw new Error('Storage blocked'); },
    setItem: () => { throw new Error('Storage blocked'); },
  };
  assert.deepEqual(loadPitchSettings(storage), DEFAULT_PITCH_SETTINGS);
  assert.equal(savePitchSettings(DEFAULT_PITCH_SETTINGS, storage), false);
});
