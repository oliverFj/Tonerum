import type { PitchSample } from './pitch';

export type GuitarCommand = 'start' | 'pause' | 'stop';

export const GUITAR_CONTROLS = [
  { midi: 81, note: 'A5', fret: 17, command: 'start' },
  { midi: 82, note: 'A♯5', fret: 18, command: 'pause' },
  { midi: 83, note: 'B5', fret: 19, command: 'stop' },
] as const;

export const isGuitarControl = (midi: number) => GUITAR_CONTROLS.some(control => control.midi === midi);

/** A deliberate held tone is one command, even if its attack ID changes.
 * Mute or play a normal note before another command can be accepted. */
export class GuitarControlTracker {
  private candidate: number | null = null;
  private since = 0;
  private latched = false;
  private releasedAt: number | null = null;
  private lastAt = -Infinity;

  update(sample: PitchSample, now: number, enabled = true): GuitarCommand | null {
    const gap = now - this.lastAt > 160;
    this.lastAt = now;
    if (!enabled) {
      this.candidate = null;
      this.latched = true;
      this.releasedAt = null;
      return null;
    }
    if (gap) { this.candidate = null; this.releasedAt = null; }
    const reading = sample.reading;
    const control = reading && !sample.appSound ? GUITAR_CONTROLS.find(item => item.midi === reading.midi) : undefined;
    if (this.latched) {
      if (control) this.releasedAt = null;
      else this.releasedAt ??= now;
      if (this.releasedAt !== null && now - this.releasedAt >= 280) this.latched = false;
      return null;
    }
    if (!control || !sample.stable || reading!.confidence < .8 || Math.abs(reading!.cents) > 40) {
      this.candidate = null;
      return null;
    }
    if (this.candidate !== control.midi) { this.candidate = control.midi; this.since = now; }
    if (now - this.since < 500) return null;
    this.candidate = null;
    this.latched = true;
    this.releasedAt = null;
    return control.command;
  }
}
