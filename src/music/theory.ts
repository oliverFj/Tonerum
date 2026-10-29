import type { MatchMode, PlayingRegion, Position } from './types';

export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const STANDARD_TUNING = [64, 59, 55, 50, 45, 40] as const;
export const MAX_FRET = 16;
export const NATURALS = new Set([0, 2, 4, 5, 7, 9, 11]);
export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
export const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

export const pitchClass = (midi: number) => ((midi % 12) + 12) % 12;
export const octave = (midi: number) => Math.floor(midi / 12) - 1;
export const noteName = (midi: number, withOctave = false) =>
  NOTE_NAMES[pitchClass(midi)] + (withOctave ? octave(midi) : '');

export const FRETBOARD: Position[] = STANDARD_TUNING.flatMap((openMidi, stringIndex) =>
  Array.from({ length: MAX_FRET + 1 }, (_, fret) => ({ string: stringIndex + 1, fret, midi: openMidi + fret })),
);

export function findPositions(midi: number, mode: MatchMode = 'exact', board: readonly Position[] = FRETBOARD): Position[] {
  return board.filter(position => mode === 'exact'
    ? position.midi === midi
    : pitchClass(position.midi) === pitchClass(midi));
}

export function regionBounds(region: PlayingRegion): [number, number] {
  if (region.enabled === false) return [0, MAX_FRET];
  return [Math.max(0, region.center - region.radius), Math.min(MAX_FRET, region.center + region.radius)];
}

export function isInRegion(position: Position, region: PlayingRegion): boolean {
  const [low, high] = regionBounds(region);
  return position.fret >= low && position.fret <= high;
}

export const samePosition = (a: Position | null | undefined, b: Position | null | undefined) =>
  !!a && !!b && a.string === b.string && a.fret === b.fret;

/** A → blue, through cyan, ending at G/G♯ → green. */
export function pitchColor(midi: number): string {
  const offset = (pitchClass(midi) - 9 + 12) % 12;
  return `hsl(${220 - offset * 80 / 11} 52% 35%)`;
}
