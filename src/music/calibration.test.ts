import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CALIBRATION_STRINGS, InputCalibration } from './calibration';
import { detectPitch, PitchTracker } from './pitch';
import type { PitchSample } from './pitch';
import { VIOLIN_TUNING } from './instruments';

const silent: PitchSample = { reading: null, stable: false, attackId: 0, level: 0, appSound: false };
function measureBackground(calibration: InputCalibration, level = .000001) {
  calibration.start();
  for (let i = 0; i < 50; i++) calibration.update({ ...silent, level });
  assert.equal(calibration.state.phase, 'strings');
}

function play(calibration: InputCalibration, midi: number, level = .0001, extra: Partial<PitchSample> = {}) {
  for (let i = 0; i < 6; i++) calibration.update({ ...silent, stable: true, level,
    reading: { midi, rms: level, frequency: 440 * 2 ** ((midi - 69) / 12), cents: 0, confidence: .98 }, ...extra });
}

test('violin calibration checks four open strings and switching instruments clears the previous measurement', () => {
  const calibration = new InputCalibration();
  calibration.setStrings([...VIOLIN_TUNING].reverse());
  measureBackground(calibration);
  play(calibration, 40);
  assert.equal(calibration.state.strings.length, 0, 'a guitar low E is not a violin open string');
  for (const midi of [...VIOLIN_TUNING].reverse()) play(calibration, midi);
  assert.equal(calibration.state.phase, 'complete');
  assert.deepEqual(calibration.state.strings, [55, 62, 69, 76]);
  calibration.setStrings(CALIBRATION_STRINGS);
  assert.equal(calibration.state.phase, 'idle');
  assert.equal(calibration.gate, null);
});

test('calibration recovers very quiet guitar strings without changing their measured pitch or octave', () => {
  const calibration = new InputCalibration();
  measureBackground(calibration);
  const tracker = new PitchTracker();
  let now = 0;
  for (const midi of CALIBRATION_STRINGS) {
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const samples = Float32Array.from({ length: 4096 }, (_, i) => .000018 * Math.sin(2 * Math.PI * frequency * i / 48000));
    assert.equal(detectPitch(samples, 48000, .000015), null, 'below the previous minimum gate');
    for (let i = 0; i < 12; i++) {
      const reading = detectPitch(samples, 48000, calibration.analysisGate(.000015));
      assert.equal(reading?.midi, midi);
      calibration.update(tracker.update(reading, now += 40));
    }
  }
  assert.equal(calibration.state.phase, 'complete');
  assert.deepEqual(calibration.state.strings, CALIBRATION_STRINGS);
  assert.ok(calibration.gate! < .000015);
  assert.ok(calibration.gate! > calibration.state.noiseFloor);
});

test('silence, unstable notes, wrong octaves, app sounds and poor signal separation cannot verify a string', () => {
  const calibration = new InputCalibration();
  measureBackground(calibration, .001);
  for (let i = 0; i < 10; i++) calibration.update(silent);
  play(calibration, 52, .01); // E3 is not the low E2 string.
  play(calibration, 40, .01, { stable: false });
  play(calibration, 40, .01, { appSound: true });
  play(calibration, 40, .0015);
  calibration.finish();
  assert.deepEqual(calibration.state.strings, []);
  assert.equal(calibration.gate, null);
  assert.equal(calibration.state.phase, 'strings');
  play(calibration, 40, .0021);
  calibration.finish();
  assert.equal(calibration.state.phase, 'complete');
  assert.ok(calibration.gate! > .001, 'calibrated gate must stay above measured background');
  assert.ok(calibration.state.message, 'limited separation is reported');
});

test('partial calibration reports only tested strings; cancellation restores the previous profile and reset removes it', () => {
  const calibration = new InputCalibration();
  measureBackground(calibration);
  play(calibration, 45);
  calibration.finish();
  const previous = calibration.state;
  assert.deepEqual(previous.strings, [45]);
  calibration.start();
  calibration.update({ ...silent, level: .01 });
  calibration.cancel();
  assert.deepEqual(calibration.state, previous);
  assert.equal(calibration.analysisGate(.5), previous.gate);
  calibration.reset();
  assert.equal(calibration.analysisGate(.5), .5);
  assert.equal(calibration.state.phase, 'idle');
});
