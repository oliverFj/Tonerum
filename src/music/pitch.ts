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

/** A sustained note is one attempt. A new pitch, silence, or a fresh attack
 * starts another, so repeated melody notes require another pluck. */
export class PitchTracker {
  private midi: number | null = null;
  private frames = 0;
  private previousLevel = 0;
  private lastAttackAt = -Infinity;
  private attackId = 0;

  update(reading: PitchReading | null, now: number, level = reading?.rms ?? 0, appSound = false): PitchSample {
    if (!reading || appSound) {
      this.midi = null;
      this.frames = 0;
      this.previousLevel = 0;
      return { reading: null, stable: false, attackId: this.attackId, level, appSound };
    }
    const changed = reading.midi !== this.midi;
    const attack = level > this.previousLevel * 1.8
      && level - this.previousLevel > Math.max(.00001, this.previousLevel * .5)
      && now - this.lastAttackAt > 180;
    if (changed || attack) { this.attackId++; this.lastAttackAt = now; this.frames = 0; }
    this.frames++;
    this.midi = reading.midi;
    this.previousLevel = level;
    return {
      reading, stable: this.frames >= 3 && reading.confidence >= .65,
      attackId: this.attackId, level, appSound: false,
    };
  }
}
