import type { Melody, NoteEvent } from './types';

export const SCALE_TYPES = [
  { id: 'major', label: 'Dur', intervals: [0, 2, 4, 5, 7, 9, 11], degrees: [0, 1, 2, 3, 4, 5, 6], minor: false },
  { id: 'minor', label: 'Naturlig mol', intervals: [0, 2, 3, 5, 7, 8, 10], degrees: [0, 1, 2, 3, 4, 5, 6], minor: true },
  { id: 'major-pentatonic', label: 'Durpentaton', intervals: [0, 2, 4, 7, 9], degrees: [0, 1, 2, 4, 5], minor: false },
  { id: 'minor-pentatonic', label: 'Molpentaton', intervals: [0, 3, 5, 7, 10], degrees: [0, 2, 3, 4, 6], minor: true },
  { id: 'chromatic', label: 'Kromatisk', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], degrees: [], minor: false },
] as const;
export type ScaleType = typeof SCALE_TYPES[number]['id'];
export type ScaleDirection = 'up' | 'down' | 'both';
export interface ScaleOptions { type: ScaleType; tonic: number; direction: ScaleDirection }
export const SCALE_ROOTS = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const ROOT_STEPS = [0, 0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6];
const NATURAL_PITCHES = [0, 2, 4, 5, 7, 9, 11];

export function createScale(options: ScaleOptions): Melody {
  const type = SCALE_TYPES.find(type => type.id === options.type)!;
  const base = 48 + options.tonic; // C3–B3; one octave remains within the displayed guitar and below command notes.
  const ascent: NoteEvent[] = [...type.intervals, 12].map((interval, index) => {
    const midi = base + interval;
    if (!type.degrees.length) return { type: 'note', midi, duration: 1 };
    const degree = index === type.intervals.length ? 7 : type.degrees[index];
    const writtenStep = ROOT_STEPS[options.tonic] + degree;
    const step = writtenStep % 7, octave = 3 + Math.floor(writtenStep / 7);
    return { type: 'note', midi, duration: 1,
      spelling: { step, octave, alter: midi - ((octave + 1) * 12 + NATURAL_PITCHES[step]) } };
  });
  const descent = [...ascent].reverse();
  const events = (options.direction === 'up' ? ascent : options.direction === 'down' ? descent : [...ascent, ...descent.slice(1)])
    .map((event, index, sequence) => ({ ...event, duration: index === sequence.length - 1 ? 2 : 1 }));
  const label = `${SCALE_ROOTS[options.tonic]} · ${type.label.toLowerCase()}`;
  return {
    id: `scale-${options.type}-${options.tonic}-${options.direction}`, category: 'Skalaer', title: label,
    subtitle: 'Én oktav · ét anslag pr. node', composer: 'Genereret skalaøvelse',
    key: { tonic: options.tonic, mode: type.minor ? 'minor' : 'major', label }, timeSignature: [4, 4], tempo: 80, events,
    source: {
      title: 'Skalatrin · musictheory.net / Fender',
      url: options.type.includes('pentatonic') ? 'https://www.fender.com/articles/scales/a-minor-pentatonic-guitar-scale'
        : `https://www.musictheory.net/lessons/${type.minor ? 22 : 21}`,
      edition: 'Genereret øvelse over én oktav. Op og ned deler topnoten, så den kun skal anslås én gang. Sluttonen varer to slag. Grebsforslagene følger dit valgte spilleområde.',
      license: 'Egen genereret øvelse', licenseUrl: 'https://www.musictheory.net/lessons',
    },
  };
}
