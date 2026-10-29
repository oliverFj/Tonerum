import type { PitchReading } from './pitch';
import type { Position } from './types';
import { VIOLIN_TUNING, violinLocation } from './instruments';

export const midiFrequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export const centsFromTarget = (frequency: number, midi: number) => 1200 * Math.log2(frequency / midiFrequency(midi));

export function tuningReading(reading: PitchReading | null, targetMidi: number | null) {
  if (!reading || !Number.isFinite(reading.frequency) || reading.frequency <= 0) return null;
  const midi = targetMidi ?? reading.midi;
  const cents = centsFromTarget(reading.frequency, midi);
  return { midi, cents, frequency: midiFrequency(midi), inTune: Math.abs(cents) <= 5,
    needle: 50 + Math.max(-50, Math.min(50, cents)),
    octaveError: Math.abs(Math.abs(cents) - 1200) < 50 };
}

/** Assumes the suggested string is being played and its open pitch is in tune.
 * Frequency alone cannot identify a string, finger or physical hand position. */
export function violinFingerEstimate(reading: PitchReading | null, target: Position | null) {
  if (!reading || !target || !Number.isFinite(reading.frequency) || reading.frequency <= 0) return null;
  const openMidi = VIOLIN_TUNING[target.string - 1];
  if (openMidi === undefined) return null;
  const semitones = 12 * Math.log2(reading.frequency / midiFrequency(openMidi));
  const open = Math.abs(semitones) < .5;
  const inRange = semitones >= -.5 && semitones <= 7.4;
  const location = open ? violinLocation(0) : violinLocation(Math.max(0, semitones));
  return { string: target.string, semitones, open, inRange,
    x: Math.max(.015, Math.min(.985, location)), cents: centsFromTarget(reading.frequency, target.midi) };
}
