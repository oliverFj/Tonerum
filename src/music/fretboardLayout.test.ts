import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fretboardLayout } from './fretboardLayout';
import Fretboard from '../components/Fretboard';
import { noteRepetitions } from './repetitions';

test('physical frets shrink by the equal-temperament ratio and keep fret 12 at half the scale length', () => {
  const cells = fretboardLayout('realistic');
  assert.equal(cells.length, 17);
  assert.ok(Math.abs(cells.reduce((sum, cell) => sum + cell.width, 0) - 1) < 1e-12);
  for (let fret = 2; fret <= 16; fret++) {
    assert.ok(Math.abs(cells[fret].width / cells[fret - 1].width - 2 ** (-1 / 12)) < 1e-12);
    assert.ok(Math.abs(cells[fret].left - cells[fret - 1].left - cells[fret - 1].width) < 1e-12);
  }
  const nut = cells[0].width;
  const fret12 = cells[12].left + cells[12].width;
  const scaleLength = (1 - nut) / (1 - 2 ** (-16 / 12));
  assert.ok(Math.abs((fret12 - nut) / scaleLength - .5) < 1e-12);
  assert.ok(fretboardLayout('even').every(cell => cell.width === 1 / 17));
});

test('hiding background notes preserves finger positions, upcoming notes, detected notes and practice hints', () => {
  const props: Parameters<typeof Fretboard>[0] = {
    region: { center: 3, radius: 2, enabled: false }, colorMode: 'none', fretSpacing: 'realistic',
    showLabels: true, melodyOnly: false, melodyPitches: [60], matchMode: 'exact', patternPitches: null,
    selectedPitch: null, currentMidi: 60, heardMidi: 60, inputLevel: 0, inputGate: .000015, targetMidi: 60,
    currentPosition: { midi: 60, string: 2, fret: 1 }, upcoming: [{ midi: 62, string: 2, fret: 3 }],
    recommended: [], sequence: true, onCenterChange: () => {}, onSelect: () => {},
  };
  const bare = renderToStaticMarkup(createElement(Fretboard, props));
  assert.equal((bare.match(/class="note-hit-area /g) ?? []).length, 97);
  assert.equal((bare.match(/class="note /g) ?? []).length, 5);
  assert.match(bare, /id="note-2-1" class="note [^"]*current[^"]*heard/);
  assert.match(bare, /id="note-2-3" class="note [^"]*upcoming/);
  assert.match(bare, /id="note-1-0" class="note-hit-area /);
  assert.ok(bare.includes('class="path-overlay"'));
  assert.ok(bare.includes('<sup'));
  assert.ok(bare.includes('class="inlay double"'));
  const empty = renderToStaticMarkup(createElement(Fretboard, { ...props, sequence: false,
    currentPosition: null, currentMidi: null, upcoming: [], heardMidi: null, targetMidi: null }));
  assert.equal((empty.match(/class="note-hit-area /g) ?? []).length, 102);
  assert.ok(!empty.includes('class="note '));
  const hint = renderToStaticMarkup(createElement(Fretboard, { ...props, sequence: false, heardMidi: null }));
  assert.match(hint, /id="note-2-1" class="note [^"]*practice-target/);
  const piano = renderToStaticMarkup(createElement(Fretboard, { ...props, colorMode: 'piano' }));
  assert.ok(piano.includes('class="note natural piano'));
  assert.ok(piano.includes('class="note accidental piano'));
  assert.ok(piano.includes('class="path-overlay"'));
  const cells = fretboardLayout('realistic');
  assert.ok(piano.includes(`left:${cells[12].center * 100}%`));
  assert.ok(piano.includes(`${cells[1].center * 1700},150`));
  const repetitions = noteRepetitions(Array.from({ length: 4 }, () => ({ type: 'note', midi: 60, duration: 1 })), 0)!;
  const repeated = renderToStaticMarkup(createElement(Fretboard, { ...props, repetitions }));
  assert.equal((repeated.match(/class="note-repetitions"/g) ?? []).length, 1, 'only the recommended dot gets spokes');
  assert.equal((repeated.match(/class="repetition-spoke"/g) ?? []).length, 4);
  assert.ok(repeated.includes('data-remaining="4"'));
  assert.ok(repeated.includes('4 anslag tilbage på tonen'));
  assert.ok(repeated.includes('transform:rotate(270deg);opacity:1'));
});
