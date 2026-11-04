export interface PitchReading {
  midi: number;
  frequency: number;
  cents: number;
  confidence: number;
  rms: number;
}

export interface PitchSample {
  reading: PitchReading | null;
  stable: boolean;
  attackId: number;
  level: number;
  appSound: boolean;
}

export function signalLevel(samples: Float32Array): number {
  let mean = 0;
  for (const sample of samples) mean += sample;
  mean /= samples.length || 1;
  let energy = 0;
  for (const sample of samples) energy += (sample - mean) ** 2;
  return Math.sqrt(energy / (samples.length || 1));
}

export const signalDecibels = (level: number) => level > 0 ? 20 * Math.log10(level) : -Infinity;

/** A logarithmic meter keeps quiet acoustic signals visible. */
export const signalPercent = (level: number) => Math.max(0, Math.min(100, (signalDecibels(level) + 100) / 85 * 100));

/** YIN's normalized difference finds the first plausible fundamental period,
 * rather than choosing the strongest overtone of a plucked string. */
export function detectPitch(samples: Float32Array, sampleRate: number, gate = .00025): PitchReading | null {
  const rms = signalLevel(samples);
  if (rms < gate || !Number.isFinite(rms) || sampleRate <= 0) return null;
  const minLag = Math.max(2, Math.floor(sampleRate / 1400));
  const maxLag = Math.min(Math.ceil(sampleRate / 65), Math.floor(samples.length / 2) - 1);
  if (maxLag <= minLag) return null;
  const window = Math.min(2048, samples.length - maxLag);
  const difference = new Float64Array(maxLag + 1);
  let running = 0;
  difference[0] = 1;
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < window; i++) sum += (samples[i] - samples[i + lag]) ** 2;
    running += sum;
    difference[lag] = running > 0 ? sum * lag / running : 1;
  }
  for (let lag = minLag; lag < maxLag; lag++) {
    // Real microphone signals retain background noise after filtering. Three
    // agreeing frames below this limit are stronger evidence than a single
    // nearly perfect, but rarely attainable, period match.
    if (difference[lag] >= .35) continue;
    while (lag + 1 < maxLag && difference[lag + 1] < difference[lag]) lag++;
    // A strong second harmonic can also cross the noise-tolerant threshold.
    // Prefer its full fundamental period only when it is clearly better;
    // tiny improvements at repeated periods must not move a note an octave.
    if (difference[lag] > .1 && lag * 2 + 2 < maxLag) {
      let doubled = lag * 2;
      for (let candidate = lag * 2 - 2; candidate <= lag * 2 + 2; candidate++) {
        if (difference[candidate] < difference[doubled]) doubled = candidate;
      }
      if (difference[doubled] < difference[lag] * .7 && difference[lag] - difference[doubled] > .08) lag = doubled;
    }
    const left = difference[lag - 1], middle = difference[lag], right = difference[lag + 1];
    const curvature = left - 2 * middle + right;
    const offset = curvature === 0 ? 0 : Math.max(-.5, Math.min(.5, (left - right) / (2 * curvature)));
    const frequency = sampleRate / (lag + offset);
    if (frequency < 65 || frequency > 1400) return null;
    const midiFloat = 69 + 12 * Math.log2(frequency / 440);
    const midi = Math.round(midiFloat);
    return { midi, frequency, cents: (midiFloat - midi) * 100, confidence: 1 - middle, rms };
  }
  return null;
}

export interface PitchDetectionSettings {
  attackRisePercent: number;
  minAttackMs: number;
  releaseMs: number;
}

export const DEFAULT_PITCH_SETTINGS: Readonly<PitchDetectionSettings> = Object.freeze({
  attackRisePercent: 35, minAttackMs: 120, releaseMs: 120,
});

/** A sustained note is one attempt. A new pitch, silence, or a fresh attack
 * starts another, so repeated melody notes require another pluck. */
export class PitchTracker {
  constructor(public settings: Readonly<PitchDetectionSettings> = DEFAULT_PITCH_SETTINGS) {}

  // Keep the confirmed pitch separate from the current candidate. A brief
  // octave error must not rearm the original note when it returns.
  private midi: number | null = null;
  private candidateMidi: number | null = null;
  private frames = 0;
  private noteFrames = 0;
  private lastReadingAt = -Infinity;
  private interrupted = false;
  private valleyLevel = 0;
  private peakLevel = 0;
  private attackReady = true;
  private lastAttackAt = -Infinity;
  private attackId = 0;

  private trackAttack(level: number, now: number, allowed: boolean) {
    this.peakLevel = Math.max(this.peakLevel, level);
    if (level < this.peakLevel * .8) this.attackReady = true;
    this.valleyLevel = Math.min(this.valleyLevel, level);
    const attack = allowed && this.attackReady && level > this.valleyLevel * (1 + this.settings.attackRisePercent / 100)
      && level - this.valleyLevel > .00001 && now - this.lastAttackAt >= this.settings.minAttackMs;
    if (attack) {
      this.valleyLevel = this.peakLevel = level;
      this.attackReady = false;
      this.attackId++;
      this.lastAttackAt = now;
      this.noteFrames = 1;
    } else if (!this.attackReady) this.valleyLevel = level;
    return attack;
  }

  update(reading: PitchReading | null, now: number, level = reading?.rms ?? 0, appSound = false, attackLevel = level): PitchSample {
    // A missing pitch is not necessarily silence: string noise can briefly
    // hide a sustained fundamental. Only a sustained gap releases the note.
    if (appSound || (this.interrupted && now - this.lastReadingAt >= this.settings.releaseMs)) {
      this.midi = null;
      this.noteFrames = 0;
      this.valleyLevel = 0;
      this.peakLevel = 0;
      this.attackReady = true;
    }
    if (!reading || appSound || reading.confidence < .65) {
      // A real pluck may briefly obscure its pitch. Retain a rising envelope
      // during that gap, but never use an absent pitch as a zero-level trough.
      if (!appSound && this.midi !== null && attackLevel > this.valleyLevel) {
        this.trackAttack(attackLevel, now, true);
      }
      this.candidateMidi = null;
      this.frames = 0;
      this.interrupted = true;
      return { reading: null, stable: false, attackId: this.attackId, level, appSound };
    }
    this.interrupted = false;
    this.lastReadingAt = now;
    this.frames = reading.midi === this.candidateMidi ? this.frames + 1 : 1;
    this.candidateMidi = reading.midi;
    const changed = reading.midi !== this.midi && (this.midi === null || this.frames >= 3);
    // Accumulate a rise from the local trough: overlapping analysis windows
    // can spread one pluck over several frames. Require a decay before the
    // next attack so one rising envelope cannot count repeatedly.
    const attack = this.trackAttack(attackLevel, now, reading.midi === this.midi);
    if (changed) {
      this.valleyLevel = this.peakLevel = attackLevel;
      this.attackReady = true;
      this.attackId++;
      this.lastAttackAt = now;
    }
    if (changed) {
      this.midi = reading.midi;
      this.noteFrames = this.frames;
    } else if (!attack && reading.midi === this.midi) this.noteFrames++;
    return {
      reading, stable: reading.midi === this.midi && this.noteFrames >= 3,
      attackId: this.attackId, level, appSound: false,
    };
  }
}
