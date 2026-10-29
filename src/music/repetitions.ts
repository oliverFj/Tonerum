import type { MelodyEvent } from './types';
import type { NoteResult } from './trainer';

export interface NoteRepetitions {
  start: number;
  remaining: number;
  spokes: { eventIndex: number; angle: number; pending: boolean }[];
}

/** Keep each spoke tied to its melody event so surviving spokes can rotate
 * into evenly spaced positions when the uppermost one has been played. */
export function noteRepetitions(events: MelodyEvent[], index: number, results: NoteResult[] = []): NoteRepetitions | null {
  const event = events[index];
  if (event?.type !== 'note') return null;
  const sameNote = (other: MelodyEvent | undefined) => other?.type === 'note' && other.midi === event.midi;
  let start = index, end = index + 1;
  while (sameNote(events[start - 1])) start--;
  while (sameNote(events[end])) end++;
  const pending = Array.from({ length: end - start }, (_, offset) => {
    const eventIndex = start + offset;
    return { eventIndex, pending: eventIndex >= index && results[eventIndex] !== 'correct' && results[eventIndex] !== 'missed' };
  });
  const remaining = pending.filter(spoke => spoke.pending).length;
  let slot = 0;
  return { start, remaining, spokes: pending.map(spoke => ({ ...spoke,
    angle: spoke.pending ? slot++ * 360 / remaining : 0,
  })) };
}
