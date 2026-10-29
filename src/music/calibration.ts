import type { PitchSample } from './pitch';

export const CALIBRATION_STRINGS = [40, 45, 50, 55, 59, 64];
export interface CalibrationState {
  phase: 'idle' | 'noise' | 'strings' | 'complete';
  progress: number;
  noiseFloor: number;
  gate: number | null;
  strings: number[];
  message: string | null;
}
export const EMPTY_CALIBRATION: CalibrationState = {
  phase: 'idle', progress: 0, noiseFloor: 0, gate: null, strings: [], message: null,
};

const percentile = (values: number[], fraction: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * fraction)] ?? 0;
};

/** Measures levels only; expected strings never influence pitch detection. */
export class InputCalibration {
  state = EMPTY_CALIBRATION;
  private previous = EMPTY_CALIBRATION;
  private background: number[] = [];
  private levels = new Map<number, number[]>();
  private expected: readonly number[] = CALIBRATION_STRINGS;

  setStrings(strings: readonly number[]) {
    if (strings.join(',') === this.expected.join(',')) return;
    this.reset();
    this.expected = [...strings];
  }

  get active() { return this.state.phase === 'noise' || this.state.phase === 'strings'; }
  get gate() { return this.active ? this.previous.gate : this.state.gate; }

  start() {
    if (this.active) return;
    this.previous = this.state;
    this.background = [];
    this.levels.clear();
    this.state = { ...EMPTY_CALIBRATION, phase: 'noise' };
  }

  cancel() { if (this.active) this.state = this.previous; }
  reset() { this.state = this.previous = EMPTY_CALIBRATION; }

  analysisGate(fallback: number) {
    return this.state.phase === 'strings'
      ? Math.max(.000005, this.state.noiseFloor * 1.2)
      : this.gate ?? fallback;
  }

  update(sample: PitchSample) {
    if (!this.active || sample.appSound) return;
    if (this.state.phase === 'noise') {
      this.background.push(sample.level);
      // About two seconds of actual audio frames, also in a throttled tab.
      const progress = Math.min(1, this.background.length / 50);
      this.state = { ...this.state, progress };
      if (progress === 1) this.state = { ...this.state, phase: 'strings', progress: 0,
        noiseFloor: percentile(this.background.slice(5), .9) };
      return;
    }
    const reading = sample.reading;
    if (!sample.stable || !reading || Math.abs(reading.cents) > 45
      || !this.expected.includes(reading.midi)) return;
    if (sample.level < Math.max(.00001, this.state.noiseFloor * 2)) return;
    const levels = this.levels.get(reading.midi) ?? [];
    if (levels.length >= 6) return;
    levels.push(sample.level);
    this.levels.set(reading.midi, levels);
    if (levels.length === 6) {
      const strings = this.expected.filter(midi => (this.levels.get(midi)?.length ?? 0) >= 6);
      this.state = { ...this.state, strings, progress: strings.length / this.expected.length };
      if (strings.length === this.expected.length) this.finish();
    }
  }

  finish() {
    if (this.state.phase !== 'strings' || !this.state.strings.length) return;
    const weakest = Math.min(...this.state.strings.map(midi => percentile(this.levels.get(midi)!, .25)));
    const noise = this.state.noiseFloor;
    const gate = Math.max(.000005, noise * 1.2,
      Math.min(Math.max(noise * 1.5, weakest * .12), weakest * .45));
    this.state = { ...this.state, phase: 'complete', gate,
      message: weakest < noise * 4
        ? 'Der er kun lidt afstand mellem instrumentet og baggrundsstøj. Øg indgangsniveauet, og kalibrer igen.'
        : null };
    this.previous = this.state;
  }
}
