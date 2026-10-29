import { FRETBOARD, noteName } from './theory';
import type { Instrument, Melody, Position } from './types';

export const VIOLIN_TUNING = [76, 69, 62, 55] as const;
export const VIOLIN_FINGERBOARD: Position[] = VIOLIN_TUNING.flatMap((midi, index) =>
  Array.from({ length: 8 }, (_, fret) => ({ midi: midi + fret, string: index + 1, fret })));
export const VIOLIN_FINGERS = ['0', 'lav 1', '1', 'lav 2', 'høj 2', '3', 'høj 3', '4'];
export const instrumentPositions = (instrument: Instrument) => instrument === 'violin' ? VIOLIN_FINGERBOARD : FRETBOARD;

export function positionDescription(position: Position, instrument: Instrument) {
  if (instrument === 'guitar') return `Streng ${position.string} · ${position.fret === 0 ? 'åben streng' : `bånd ${position.fret}`}`;
  return `${noteName(VIOLIN_TUNING[position.string - 1])}-strengen · ${position.fret === 0 ? 'åben streng' : `${VIOLIN_FINGERS[position.fret]}. finger`}`;
}

/** Nut plus a continuous, fretless first-position fingerboard. */
export const violinLocation = (semitones: number) => semitones === 0 ? .035
  : .12 + .84 * (1 - 2 ** (-semitones / 12)) / (1 - 2 ** (-7 / 12));

export function melodyForInstrument(original: Melody, instrument: Instrument): { melody: Melody; octaveShift: number } {
  if (instrument === 'guitar') return { melody: original, octaveShift: 0 };
  const pitches = original.events.flatMap(event => event.type === 'note' ? [event.midi] : []);
  if (!pitches.length) return { melody: original, octaveShift: 0 };
  const shift = Math.max(0, Math.ceil((55 - Math.min(...pitches)) / 12)) * 12;
  // Never wrap individual notes into another octave or conceal an unplayable range.
  if (Math.max(...pitches) + shift > 83 || !shift) return { melody: original, octaveShift: 0 };
  return { octaveShift: shift / 12, melody: { ...original, id: `${original.id}-violin-${shift}`,
    events: original.events.map(event => event.type === 'rest' ? event : { ...event, midi: event.midi + shift,
      ...(event.spelling ? { spelling: { ...event.spelling, octave: event.spelling.octave + shift / 12 } } : {}) }),
    source: { ...original.source, edition: `${original.source.edition} Violinversion: hele øvelsen er flyttet ${shift / 12} oktav op, så den passer til violinens 1. position.` },
  } };
}
