import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { staffPitch, staffNotation, noteShape } from './notation';
import { createScale } from './scales';
import { MELODIES } from './melodies';
import { EMPTY_TRAINER } from './trainer';
import ScrollingStaff from '../components/ScrollingStaff';

test('guitar staff uses the octave-transposing treble clef and correct ledger lines', () => {
  const pitch = (midi: number) => staffPitch({ type: 'note', midi, duration: 1 });
  assert.equal(pitch(52).y, 76, 'sounding E3 is written E4 on the bottom line');
  assert.equal(pitch(60).y, 51, 'sounding middle C is written C5 between the middle two lines');
  assert.equal(pitch(69).y, 26, 'sounding A4 is written A5 on its first upper ledger line');
  assert.deepEqual(pitch(69).ledger, [26]);
  assert.deepEqual(pitch(40).ledger, [86, 96, 106]);
});

test('continuous notation displays explicit alterations and cancellation naturals without changing event timing', () => {
  const melody = createScale({ type: 'chromatic', tonic: 0, direction: 'up' });
  melody.events = [60, 61, 60, 62, 63].map(midi => ({ type: 'note', midi, duration: .5 }));
  const notes = staffNotation(melody);
  assert.deepEqual(notes.map(note => note.accidental), ['', '♯', '♮', '', '♯']);
  assert.deepEqual(notes.map(note => note.start), [0, .5, 1, 1.5, 2]);
  const flat = createScale({ type: 'minor', tonic: 3, direction: 'up' });
  assert.equal(staffNotation(flat)[0].accidental, '♭');
  for (const song of MELODIES) {
    const notation = staffNotation(song);
    assert.equal(notation.length, song.events.length);
    notation.forEach((note, index) => {
      assert.deepEqual(note.event, song.events[index]);
      assert.equal(note.pitch === null, song.events[index].type === 'rest');
    });
  }
});

test('half notes, dotted notes, sixteenths and triplet eighths have distinct note shapes', () => {
  assert.equal(noteShape(4).whole, true);
  assert.equal(noteShape(2).hollow, true);
  assert.equal(noteShape(1).hollow, false);
  assert.equal(noteShape(.5).flags, 1);
  assert.equal(noteShape(.25).flags, 2);
  assert.equal(noteShape(.75).dotted, true);
  assert.equal(noteShape(.75).flags, 1);
  assert.equal(noteShape(3).hollow, true);
  assert.equal(noteShape(3).dotted, true);
  assert.equal(noteShape(1 / 3).triplet, true);
});

test('the staff renders a fixed play line, five staff lines, correct hits and optional sounding note names', () => {
  const melody = createScale({ type: 'minor-pentatonic', tonic: 9, direction: 'up' });
  const props = { melody, state: { ...EMPTY_TRAINER, phase: 'playing' as const, beat: 1, results: ['correct', 'pending'] as const },
    index: 1, showLabels: true, demoPlaying: false, tempo: 80 };
  const state = { ...props.state, results: [...props.state.results] };
  const html = renderToStaticMarkup(createElement(ScrollingStaff, { ...props, state }));
  assert.equal((html.match(/class="staff-line"/g) ?? []).length, 5);
  assert.ok(html.includes('class="staff-play-line"'));
  assert.ok(html.includes('class="staff-note correct '));
  assert.ok(html.includes('class="staff-note-label"'));
  const hidden = renderToStaticMarkup(createElement(ScrollingStaff, { ...props, state, showLabels: false }));
  assert.ok(!hidden.includes('class="staff-note-label"'));
});

test('the live staff marker follows the heard note independently of the exercise and respects instrument notation', () => {
  const melody = createScale({ type: 'major', tonic: 0, direction: 'up' });
  const props = { melody, state: { ...EMPTY_TRAINER, beat: 2 }, index: 0, showLabels: false, demoPlaying: false, tempo: 80 };
  const reading = { midi: 64, frequency: 329.63, cents: 0, confidence: .99, rms: .1 };
  const render = (instrument: 'guitar' | 'violin', inputReading = reading) => renderToStaticMarkup(createElement(ScrollingStaff, { ...props, instrument, inputReading }));
  const marker = (html: string) => html.match(/<g class="staff-live-pitch"[\s\S]*?<\/g>/)?.[0] ?? '';
  const guitar = render('guitar');
  assert.match(guitar, /translateX\(-192px\)/, 'exercise notes scroll');
  assert.match(marker(guitar), /data-midi="64" transform="translate\(136,0\)"/, 'heard E4 stays at the play line even while the exercise asks for C');
  assert.match(marker(guitar), /class="staff-live-dot" cx="0" cy="51"/, 'guitar E4 is written E5');
  assert.match(marker(render('violin')), /class="staff-live-dot" cx="0" cy="86"/, 'violin E4 uses sounding pitch');
  const low = marker(render('guitar', { ...reading, midi: 40, frequency: 82.41 }));
  assert.match(low, /class="staff-ledger"/, 'low heard notes include ledger lines');
  assert.match(marker(render('guitar', { ...reading, midi: 61, frequency: 277.18 })), /♯/, 'a heard chromatic note has its own accidental');
  assert.equal(marker(renderToStaticMarkup(createElement(ScrollingStaff, { ...props, inputReading: null }))), '', 'silence removes the marker');
});
