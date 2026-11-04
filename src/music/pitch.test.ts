import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PITCH_SETTINGS, detectPitch, PitchTracker, signalDecibels, signalLevel, signalPercent } from './pitch';
import { microphoneGate } from './microphone';
import type { PitchReading } from './pitch';

function waveform(midi: number, sampleRate: number, cents = 0, harmonics = false) {
  const frequency = 440 * 2 ** ((midi - 69 + cents / 100) / 12);
  return Float32Array.from({ length: 4096 }, (_, i) => {
    const phase = 2 * Math.PI * frequency * i / sampleRate;
    return harmonics
      ? (.1 * Math.sin(phase) + .24 * Math.sin(phase * 2) + .08 * Math.sin(phase * 3)) * Math.exp(-i / 8000)
      : .15 * Math.sin(phase);
  });
}

test('single-note detection retains guitar octaves across common sample rates', () => {
  for (const rate of [44100, 48000]) {
    for (const midi of [40, 45, 50, 55, 59, 60, 64, 69, 70, 71, 74, 80, 81, 82, 83]) {
      const pitch = detectPitch(waveform(midi, rate), rate);
      assert.equal(pitch?.midi, midi, `MIDI ${midi}, sample rate ${rate}`);
      assert.ok(Math.abs(pitch!.cents) < 3);
    }
  }
});

test('plucked signals with a stronger second harmonic keep the fundamental', () => {
  for (const rate of [44100, 48000]) {
    for (const midi of [40, 45, 55, 64, 69, 70, 71, 74, 81, 82, 83]) {
      const pitch = detectPitch(waveform(midi, rate, 0, true), rate);
      assert.equal(pitch?.midi, midi, `MIDI ${midi}, sample rate ${rate}`);
      assert.ok(Math.abs(pitch!.cents) < 5);
    }
  }
});

test('quiet guitar notes below the old input threshold are detected with low background noise', () => {
  const gate = microphoneGate('quiet', .00001);
  for (const rate of [44100, 48000]) {
    for (const midi of [40, 45, 50, 55, 59, 64, 74, 80]) {
      let seed = 123;
      const quiet = waveform(midi, rate, 0, true).map(value => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return value * .0005 + (seed / 2 ** 32 - .5) * .00001;
      });
      assert.ok(signalLevel(quiet) < .0025, 'fixture reproduces the previously rejected level');
      assert.equal(detectPitch(quiet, rate, .0025), null);
      const detected = detectPitch(quiet, rate, gate);
      assert.equal(detected?.midi, midi, `quiet MIDI ${midi}, sample rate ${rate}`);
      assert.ok(Math.abs(detected!.cents) < 6);
    }
  }
});

test('logarithmic input meter shows weak signals and sensitivity still distinguishes background levels', () => {
  assert.equal(signalPercent(0), 0);
  assert.ok(signalPercent(.0001) > 20);
  assert.ok(signalPercent(.001) > signalPercent(.0001));
  assert.equal(signalPercent(1), 100);
  assert.equal(signalDecibels(.0001), -80);
  assert.ok(microphoneGate('quiet', .00001) < microphoneGate('normal', .00001));
  assert.ok(microphoneGate('quiet', .001) > microphoneGate('quiet', .00001));
});

test('cents remain signed; silence, DC offset and low-level noise are not notes', () => {
  assert.ok(Math.abs(detectPitch(waveform(69, 48000, -25), 48000)!.cents + 25) < 2);
  assert.ok(Math.abs(detectPitch(waveform(69, 48000, 30), 48000)!.cents - 30) < 2);
  assert.equal(detectPitch(new Float32Array(4096), 48000), null);
  assert.equal(detectPitch(new Float32Array(4096).fill(.2), 48000), null);
  assert.equal(signalLevel(new Float32Array(4096).fill(.2)), 0);
  let seed = 123;
  const noise = Float32Array.from({ length: 4096 }, () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 2 ** 32 - .5) * .15;
  });
  assert.equal(detectPitch(noise, 48000), null);
  assert.equal(detectPitch(noise.map(v => v * .001), 48000), null);
  assert.equal(detectPitch(new Float32Array(8), 48000), null);
});

const reading = (midi = 60, rms = .02): PitchReading => ({ midi, rms, frequency: 261.63, cents: 0, confidence: .98 });

test('stability rejects transient notes, and a held note is just one attack', () => {
  const tracker = new PitchTracker();
  const first = tracker.update(reading(), 0);
  assert.equal(first.stable, false);
  assert.equal(tracker.update(reading(), 70).stable, false);
  const stable = tracker.update(reading(), 140);
  assert.equal(stable.stable, true);
  const held = tracker.update(reading(), 210);
  assert.equal(held.attackId, first.attackId);
  assert.equal(tracker.update(reading(61), 280).stable, false);
});

test('a new pluck or silence rearms repeated notes; app-generated sound cannot be scored', () => {
  const tracker = new PitchTracker();
  tracker.update(reading(), 0);
  tracker.update(reading(), 70);
  const held = tracker.update(reading(), 140);
  const pluck = tracker.update(reading(60, .06), 350);
  assert.ok(pluck.attackId > held.attackId);
  assert.equal(pluck.stable, false);
  tracker.update(null, 420);
  assert.ok(tracker.update(reading(), 490).attackId > pluck.attackId);
  const suppressed = tracker.update(reading(), 560, .02, true);
  assert.equal(suppressed.reading, null);
  assert.equal(suppressed.stable, false);
  assert.equal(suppressed.appSound, true);
});

test('a fresh weak pluck also rearms a repeated note without needing a loud absolute attack', () => {
  const tracker = new PitchTracker();
  tracker.update(reading(60, .00005), 0);
  tracker.update(reading(60, .00003), 70);
  const held = tracker.update(reading(60, .00002), 140);
  const pluck = tracker.update(reading(60, .00006), 350);
  assert.ok(pluck.attackId > held.attackId);
  assert.equal(pluck.stable, false);
});

test('quick repeated notes register moderate rises spread across multiple frames', () => {
  const tracker = new PitchTracker();
  const update = (time: number, level: number) => tracker.update(reading(), time, .02, false, level);
  update(0, .02);
  update(40, .018);
  const held = update(80, .017);
  assert.equal(held.stable, true);
  assert.equal(update(120, .02).attackId, held.attackId);
  const second = update(160, .024);
  assert.equal(second.attackId, held.attackId + 1);
  update(200, .019);
  assert.equal(update(240, .017).stable, true);
  update(280, .02);
  const third = update(320, .024);
  assert.equal(third.attackId, second.attackId + 1);
  update(360, .024);
  assert.equal(update(400, .024).stable, true);
});

test('small level fluctuations and a single long rise cannot create extra attacks', () => {
  const tracker = new PitchTracker();
  let time = 0;
  const update = (level: number) => tracker.update(reading(60, level), time += 40);
  const first = update(.02);
  for (const level of [.019, .021, .018, .02, .021, .019, .02]) {
    assert.equal(update(level).attackId, first.attackId);
  }
  const attack = update(.03);
  assert.equal(attack.attackId, first.attackId + 1);
  for (const level of [.034, .04, .045, .05, .055, .06, .06]) {
    assert.equal(update(level).attackId, attack.attackId);
  }
});

test('a brief unpitched dropout does not turn a held note into another attempt', () => {
  const tracker = new PitchTracker();
  tracker.update(reading(), 0);
  tracker.update(reading(), 40);
  const held = tracker.update(reading(), 80);
  assert.equal(tracker.update(null, 120, .02).stable, false);
  for (const time of [160, 200, 240]) {
    assert.equal(tracker.update(reading(), time).attackId, held.attackId);
  }
  assert.equal(tracker.update(reading(), 280).stable, true);
});

test('one or two wrong pitch frames cannot rearm the original held note', () => {
  for (const glitch of [61, 72]) for (const length of [1, 2]) {
    const tracker = new PitchTracker();
    tracker.update(reading(), 0);
    tracker.update(reading(), 40);
    const held = tracker.update(reading(), 80);
    let time = 120;
    for (let frame = 0; frame < length; frame++, time += 40) {
      const sample = tracker.update(reading(glitch), time);
      assert.equal(sample.stable, false);
      assert.equal(sample.attackId, held.attackId);
    }
    for (let frame = 0; frame < 3; frame++, time += 40) {
      assert.equal(tracker.update(reading(), time).attackId, held.attackId);
    }
    const changed = [0, 1, 2].map(frame => tracker.update(reading(62), time + frame * 40));
    assert.equal(changed[2].stable, true);
    assert.equal(changed[2].attackId, held.attackId + 1, 'a genuine legato change still counts');
  }
});

test('a sustained loss of pitch releases the note and permits a new quiet attempt', () => {
  const tracker = new PitchTracker();
  tracker.update(reading(), 0);
  tracker.update(reading(), 40);
  const held = tracker.update(reading(), 80);
  tracker.update(null, 120);
  tracker.update(null, 160);
  tracker.update(null, 200);
  const next = tracker.update(reading(60, .00005), 240);
  assert.equal(next.attackId, held.attackId + 1);
  assert.equal(next.stable, false);
  tracker.update(reading(60, .00005), 280);
  assert.equal(tracker.update(reading(60, .00005), 320).stable, true);
});

test('attack sensitivity can be changed live without rearming the held note', () => {
  const tracker = new PitchTracker({ ...DEFAULT_PITCH_SETTINGS, attackRisePercent: 70 });
  tracker.update(reading(), 0);
  tracker.update(reading(), 40);
  const held = tracker.update(reading(), 80);
  assert.equal(tracker.update(reading(60, .03), 160).attackId, held.attackId);
  tracker.settings = DEFAULT_PITCH_SETTINGS;
  const pluck = tracker.update(reading(60, .03), 200);
  assert.equal(pluck.attackId, held.attackId + 1);
  assert.equal(pluck.stable, false);
});

test('the minimum attack interval rejects close plucks until the selected time', () => {
  const tracker = new PitchTracker({ ...DEFAULT_PITCH_SETTINGS, minAttackMs: 200 });
  tracker.update(reading(), 0);
  tracker.update(reading(), 40);
  const held = tracker.update(reading(), 80);
  assert.equal(tracker.update(reading(60, .03), 160).attackId, held.attackId);
  assert.equal(tracker.update(reading(60, .03), 200).attackId, held.attackId + 1);
});

test('a longer release tolerance retains a held note across a longer dropout', () => {
  const tracker = new PitchTracker({ ...DEFAULT_PITCH_SETTINGS, releaseMs: 240 });
  tracker.update(reading(), 0);
  tracker.update(reading(), 40);
  const held = tracker.update(reading(), 80);
  tracker.update(null, 120, .02);
  tracker.update(null, 200, .02);
  assert.equal(tracker.update(reading(), 240).attackId, held.attackId);
  tracker.update(null, 280, .02);
  tracker.update(null, 400, .02);
  assert.equal(tracker.update(reading(), 480).attackId, held.attackId + 1);
});
