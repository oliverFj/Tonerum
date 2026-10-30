export type Instrument = 'guitar' | 'violin';

export interface NoteEvent {
  type: 'note';
  midi: number;
  /** Duration in quarter-note beats, independent of tempo. */
  duration: number;
  phraseStart?: string;
  /** Optional written name for generated scales (e.g. E-sharp in C-sharp major). */
  spelling?: { step: number; alter: number; octave: number };
}

export interface RestEvent {
  type: 'rest';
  duration: number;
  phraseStart?: string;
}

export type MelodyEvent = NoteEvent | RestEvent;

export interface Melody {
  category: 'Børnesange' | 'Salmer' | 'Traditionals' | 'Civilization VI' | 'Skalaer';
  id: string;
  title: string;
  subtitle: string;
  composer: string;
  key: { tonic: number; mode: 'major' | 'minor'; label: string; intervals?: number[] };
  timeSignature: [number, number];
  tempo: number;
  events: MelodyEvent[];
  source: { title: string; url: string; edition: string; license: string; licenseUrl: string };
}

export interface Position {
  /** One-based string number: 1 is the high E string. */
  string: number;
  fret: number;
  midi: number;
}

export type MatchMode = 'exact' | 'pitchClass';
export interface PlayingRegion { center: number; radius: number; enabled?: boolean }
export interface OptimizationOptions extends PlayingRegion { matchMode: MatchMode }

export interface PathStep {
  eventIndex: number;
  position: Position | null;
  substituted: boolean;
}
