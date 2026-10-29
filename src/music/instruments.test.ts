import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MELODIES } from './melodies';
import { createScale, SCALE_TYPES } from './scales';
import { VIOLIN_TUNING, VIOLIN_FINGERBOARD, melodyForInstrument, positionDescription, violinLocation } from './instruments';
import { optimizeMelody } from './optimizer';
import { findPositions, FRETBOARD } from './theory';
import { staffPitch } from './notation';
import { EMPTY_TRAINER, melodyTimeline, trainerReducer } from './trainer';
import { detectPitch } from './pitch';
import ViolinFingerboard from '../components/ViolinFingerboard';
import ScrollingStaff from '../components/ScrollingStaff';

test('violin tuning and first-position fingerings preserve real pitches and the overlaps between strings', () => {
  assert.deepEqual(VIOLIN_TUNING, [76, 69, 62, 55]);
  assert.equal(VIOLIN_FINGERBOARD.length, 32);
  assert.deepEqual(findPositions(62, 'exact', VIOLIN_FINGERBOARD).map(p => [p.string, p.fret]), [[3, 0], [4, 7]]);
  assert.equal(positionDescription({ string: 2, fret: 3, midi: 72 }, 'violin'), 'A-strengen · lav 2. finger');
  assert.equal(positionDescription({ string: 1, fret: 0, midi: 76 }, 'violin'), 'E-strengen · åben streng');
  assert.ok(violinLocation(7) < 1);
  assert.ok(violinLocation(3) - violinLocation(2) > violinLocation(7) - violinLocation(6));
});

test('the existing songbook and every scale can be adapted to violin without changing intervals or rhythms', () => {
  const originals = [...MELODIES, ...SCALE_TYPES.flatMap(type => Array.from({ length: 12 }, (_, tonic) =>
    createScale({ type: type.id, tonic, direction: 'both' })))];
  for (const original of originals) {
    assert.equal(melodyForInstrument(original, 'guitar').melody, original, 'guitar data remains unchanged');
    const { melody, octaveShift } = melodyForInstrument(original, 'violin');
    const path = optimizeMelody(melody.events, { center: 3.5, radius: 3.5, matchMode: 'exact' }, VIOLIN_FINGERBOARD);
    assert.ok(octaveShift === 0 || octaveShift === 1);
    melody.events.forEach((event, index) => {
      assert.equal(event.duration, original.events[index].duration);
      const before = original.events[index];
      if (event.type === 'note' && before.type === 'note') {
        assert.equal(event.midi - before.midi, octaveShift * 12);
        assert.equal(path[index].position?.midi, event.midi, `${original.id} event ${index}`);
        if (event.spelling && before.spelling) assert.equal(event.spelling.octave, before.spelling.octave + octaveShift);
      } else assert.equal(path[index].position, null);
    });
  }
  assert.equal(FRETBOARD.length, 102);
});

test('violin notation uses sounding pitch and does not display the guitar octave marker', () => {
  assert.equal(staffPitch({ type: 'note', midi: 64, duration: 1 }, false, 'violin').y, 76);
  assert.equal(staffPitch({ type: 'note', midi: 64, duration: 1 }, false, 'guitar').y, 41);
  const { melody } = melodyForInstrument(MELODIES[1], 'violin');
  const html = renderToStaticMarkup(createElement(ScrollingStaff, { instrument: 'violin', melody, state: EMPTY_TRAINER,
    index: 0, showLabels: true, demoPlaying: false, tempo: 80 }));
  assert.ok(html.includes('G-nøgle · klingende oktav'));
  assert.ok(!html.includes('class="staff-octave"'));
});

test('the violin fingerboard has four fretless strings, guides and no guitar frets or inlays', () => {
  const html = renderToStaticMarkup(createElement(ViolinFingerboard, {
    region: { center: 3.5, radius: 3.5 }, colorMode: 'none', fretSpacing: 'realistic', showLabels: true,
    melodyOnly: false, melodyPitches: [81], matchMode: 'exact', patternPitches: null, selectedPitch: null,
    currentMidi: 81, heardMidi: 81, inputLevel: .02, inputGate: .000015, targetMidi: null,
    inputReading: { midi: 81, frequency: 880, cents: 0, confidence: .98, rms: .02 },
    currentPosition: { midi: 81, string: 1, fret: 5 }, upcoming: [], recommended: [], sequence: true,
    onCenterChange: () => {}, onSelect: () => {},
  }));
  assert.equal((html.match(/class="violin-string"/g) ?? []).length, 4);
  assert.ok(html.includes('E-strengen · 3. finger'));
  assert.ok(html.includes('played-string'));
  assert.ok(!html.includes('fret-cell'));
  assert.ok(!html.includes('inlay'));
  assert.ok(!html.includes('bånd 5'));
});

test('A5, A-sharp5 and B5 are playable violin notes and high sustained harmonic signals retain their octave', () => {
  const events = [81, 82, 83].map(midi => ({ type: 'note' as const, midi, duration: 1 }));
  const timeline = melodyTimeline(events);
  let state = trainerReducer(EMPTY_TRAINER, { type: 'start-note', mode: 'wait', bpm: 80, now: 0, midi: 81, attack: 1 }, timeline);
  for (const [index, event] of events.entries()) {
    for (const rate of [44100, 48000]) {
      const frequency = 440 * 2 ** ((event.midi - 69) / 12);
      const samples = Float32Array.from({ length: 4096 }, (_, i) => {
        const phase = 2 * Math.PI * frequency * i / rate;
        return .1 * Math.sin(phase) + .18 * Math.sin(phase * 2) + .07 * Math.sin(phase * 3);
      });
      assert.equal(detectPitch(samples, rate)?.midi, event.midi);
    }
    state = trainerReducer(state, { type: 'answer', now: index * 1000, midi: event.midi, attack: index + 1 }, timeline);
  }
  assert.deepEqual(state.results, ['correct', 'correct', 'correct']);
  assert.equal(state.phase, 'complete');
});
