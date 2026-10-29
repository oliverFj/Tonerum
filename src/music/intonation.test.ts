import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { midiFrequency, tuningReading, violinFingerEstimate } from './intonation';
import { violinLocation } from './instruments';
import type { PitchReading } from './pitch';
import type { Position } from './types';
import ViolinFingerboard from '../components/ViolinFingerboard';

const reading = (midi: number, cents = 0): PitchReading => ({ midi, cents, confidence: .98, rms: .02,
  frequency: midiFrequency(midi) * 2 ** (cents / 1200) });

test('tuning locks to a selected open string even across the nearest-note boundary and detects wrong octaves', () => {
  assert.equal(midiFrequency(69), 440);
  assert.ok(tuningReading(reading(69), 69)!.inTune);
  const sharp = tuningReading(reading(70, -40), 69)!;
  assert.ok(Math.abs(sharp.cents - 60) < 1e-8);
  assert.equal(sharp.midi, 69, 'the selected A4 remains the goal while the nearest detected note is A-sharp');
  assert.equal(sharp.needle, 100);
  const automatic = tuningReading(reading(70, -40), null)!;
  assert.equal(automatic.midi, 70);
  assert.ok(Math.abs(automatic.cents + 40) < 1e-8);
  assert.ok(tuningReading(reading(81), 69)!.octaveError);
  assert.equal(tuningReading(null, 69), null);
  assert.equal(tuningReading({ ...reading(69), frequency: NaN }, 69), null);
});

test('the violin marker moves continuously on the suggested string for notes that are a little flat or sharp', () => {
  const target: Position = { midi: 72, string: 2, fret: 3 };
  const flat = violinFingerEstimate(reading(72, -25), target)!;
  const exact = violinFingerEstimate(reading(72), target)!;
  const sharp = violinFingerEstimate(reading(72, 25), target)!;
  assert.equal(flat.string, 2);
  assert.equal(sharp.string, 2);
  assert.ok(flat.x < exact.x && exact.x < sharp.x);
  assert.ok(Math.abs(exact.x - violinLocation(3)) < 1e-10);
  assert.ok(Math.abs(flat.cents + 25) < 1e-8);
  assert.ok(Math.abs(sharp.cents - 25) < 1e-8);
  assert.ok(flat.inRange && sharp.inRange);
});

test('unison pitches stay on the suggested string, with explicit open-string and range handling', () => {
  const open = violinFingerEstimate(reading(62, -15), { midi: 62, string: 3, fret: 0 })!;
  const fingered = violinFingerEstimate(reading(62), { midi: 62, string: 4, fret: 7 })!;
  assert.equal(open.string, 3);
  assert.ok(open.open);
  assert.equal(open.x, violinLocation(0));
  assert.equal(fingered.string, 4);
  assert.ok(!fingered.open);
  assert.ok(Math.abs(fingered.x - violinLocation(7)) < 1e-10);
  assert.ok(!violinFingerEstimate(reading(60), { midi: 64, string: 1, fret: 2 })!.inRange);
  assert.equal(violinFingerEstimate(null, { midi: 62, string: 3, fret: 0 }), null);
  assert.equal(violinFingerEstimate(reading(62), null), null);
});

test('only one continuous measured marker is rendered and a flat note points towards the bridge', () => {
  const estimate = violinFingerEstimate(reading(72, -25), { midi: 72, string: 2, fret: 3 })!;
  const html = renderToStaticMarkup(createElement(ViolinFingerboard, {
    region: { center: 3.5, radius: 3.5 }, colorMode: 'none', fretSpacing: 'realistic', showLabels: true,
    melodyOnly: false, melodyPitches: [72], matchMode: 'exact', patternPitches: null, selectedPitch: null,
    currentMidi: 72, heardMidi: 72, inputLevel: .02, inputGate: .000015, inputReading: reading(72, -25), targetMidi: null,
    currentPosition: { midi: 72, string: 2, fret: 3 }, upcoming: [], recommended: [], sequence: true,
    onCenterChange: () => {}, onSelect: () => {},
  }));
  assert.equal((html.match(/class="violin-live-position /g) ?? []).length, 1);
  assert.ok(html.includes(`left:${estimate.x * 100}%`));
  assert.ok(html.includes('Beregnet placering på A-strengen, -25 cent'));
  assert.ok(html.includes('for lav — flyt mod stolen'));
  assert.ok(!html.includes(' heard'));
});
