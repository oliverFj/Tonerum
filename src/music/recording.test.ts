import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { detectPitch, PitchTracker, signalLevel } from './pitch';
import { microphoneGate } from './microphone';
import { GUITAR_INPUT_FILTERS, MICROPHONE_FRAME_MS } from './inputFilters';

// Offline reference for the browser's native filters, using the Audio EQ
// Cookbook coefficients: https://www.w3.org/TR/audio-eq-cookbook/ .
function filterInput(input: Float32Array, sampleRate: number) {
  let result = input;
  for (const config of GUITAR_INPUT_FILTERS) {
    const w = 2 * Math.PI * config.frequency / sampleRate;
    const c = Math.cos(w);
    const q = config.type === 'notch' ? config.q : 10 ** (config.q / 20);
    const alpha = Math.sin(w) / (2 * q);
    let b0: number, b1: number, b2: number;
    if (config.type === 'notch') { b0 = 1; b1 = -2 * c; b2 = 1; }
    else if (config.type === 'highpass') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
    else { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
    const a0 = 1 + alpha, a1 = -2 * c / a0, a2 = (1 - alpha) / a0;
    b0 /= a0; b1 /= a0; b2 /= a0;
    const out = new Float32Array(result.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < result.length; i++) {
      const x = result[i];
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      out[i] = y; x2 = x1; x1 = x; y2 = y1; y1 = y;
    }
    result = out;
  }
  return result;
}

test('the input filters retain every guitar pitch and octave with a stronger second harmonic and mains hum', () => {
  const rate = 44100;
  for (let midi = 40; midi <= 80; midi++) {
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const input = Float32Array.from({ length: rate }, (_, i) => {
      const phase = 2 * Math.PI * frequency * i / rate;
      return .001 * Math.sin(phase) + .0024 * Math.sin(2 * phase) + .0008 * Math.sin(3 * phase)
        + .008 * Math.sin(2 * Math.PI * 50.1 * i / rate);
    });
    const filtered = filterInput(input, rate);
    const frame = filtered.subarray(rate / 2, rate / 2 + 4096);
    assert.equal(detectPitch(frame, rate, .000015)?.midi, midi, `filtered MIDI ${midi}`);
  }
});

test('the real microphone recording produces stable guitar notes and no notes in its background sections', () => {
  // User-supplied guitar.wav, converted to mono without changing its level.
  const wav = readFileSync(new URL('./fixtures/guitar.wav', import.meta.url));
  assert.equal(wav.toString('ascii', 36, 40), 'data');
  assert.equal(wav.readUInt16LE(22), 1);
  const rate = wav.readUInt32LE(24);
  const original = Float32Array.from({ length: (wav.length - 44) / 2 }, (_, i) => wav.readInt16LE(44 + i * 2) / 32768);
  const filtered = filterInput(original, rate);
  const tracker = new PitchTracker();
  let noiseFloor = .00001;
  const stable: { time: number; midi: number }[] = [];
  for (let end = 4096; end <= filtered.length; end += Math.round(rate * MICROPHONE_FRAME_MS / 1000)) {
    const frame = filtered.subarray(end - 4096, end);
    const level = signalLevel(frame);
    const reading = detectPitch(frame, rate, microphoneGate('quiet', noiseFloor));
    if (!reading) noiseFloor += (level - noiseFloor) * (level < noiseFloor ? .15 : .01);
    const time = end / rate;
    if (tracker.update(reading, time * 1000, level).stable && reading) stable.push({ time, midi: reading.midi });
  }
  assert.ok(stable.length >= 40, `only ${stable.length} stable frames`);
  assert.equal(stable.filter(frame => frame.time < 1.9 || frame.time > 11.9).length, 0, 'background must not become a played note');
  // Fundamental frequencies and overtones checked independently in the recording.
  for (const [start, end, midi] of [
    [2.35, 2.95, 40], [3.0, 3.45, 51], [3.65, 4.1, 56], [4.2, 4.75, 57],
    [5.3, 5.8, 58], [6.9, 7.25, 54], [7.45, 7.8, 52], [8.3, 8.85, 49], [9.7, 11, 47],
  ]) {
    assert.ok(stable.some(frame => frame.time >= start && frame.time <= end && frame.midi === midi),
      `missing MIDI ${midi} around ${start}s; observed: ${JSON.stringify(stable.filter(frame => frame.midi === midi))}`);
  }
});
