import type { Instrument, Melody, NoteEvent } from './types';
import { melodyTimeline } from './trainer';

const SHARP_STEPS = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
const FLAT_STEPS = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
const NATURAL_PITCHES = [0, 2, 4, 5, 7, 9, 11];

/** Guitar treble clef is written one octave above its sounding MIDI pitch. */
export function staffPitch(event: NoteEvent, flats = false, instrument: Instrument = 'guitar') {
  const octave = Math.floor(event.midi / 12) - 1;
  const step = (flats ? FLAT_STEPS : SHARP_STEPS)[event.midi % 12];
  const spelling = event.spelling ?? { step, octave, alter: event.midi % 12 - NATURAL_PITCHES[step] };
  const writtenDegree = (spelling.octave + (instrument === 'guitar' ? 1 : 0)) * 7 + spelling.step;
  const y = 76 - (writtenDegree - (4 * 7 + 2)) * 5;
  const ledger: number[] = [];
  for (let line = 26; line >= y; line -= 10) ledger.push(line);
  for (let line = 86; line <= y; line += 10) ledger.push(line);
  return { ...spelling, y, ledger };
}

export function noteShape(duration: number) {
  const triplet = Math.abs(duration - 1 / 3) < .00001;
  const dotted = [.375, .75, 1.5, 3, 6].includes(duration);
  const base = triplet ? .5 : dotted ? duration / 1.5 : duration;
  return { hollow: base >= 2, whole: base >= 4, flags: base < .5 ? 2 : base < 1 ? 1 : 0, dotted, triplet };
}

export function staffNotation(melody: Melody, instrument: Instrument = 'guitar') {
  const flats = (melody.key.mode === 'major' ? [1, 3, 5, 8, 10] : [0, 2, 3, 5, 7, 8, 10]).includes(melody.key.tonic);
  const accidentals = new Map<string, number>();
  return melodyTimeline(melody.events).map(item => {
    if (item.event.type !== 'note') return { ...item, pitch: null, accidental: '' };
    const pitch = staffPitch(item.event, flats, instrument);
    const key = `${pitch.octave}:${pitch.step}`;
    // This continuous practice staff uses explicit accidentals, without bar
    // lines or a key signature. Show naturals when a prior alteration changes.
    const previous = accidentals.get(key) ?? 0;
    const accidental = pitch.alter > 0 ? '♯'.repeat(pitch.alter) : pitch.alter < 0 ? '♭'.repeat(-pitch.alter) : previous ? '♮' : '';
    accidentals.set(key, pitch.alter);
    return { ...item, pitch, accidental };
  });
}
