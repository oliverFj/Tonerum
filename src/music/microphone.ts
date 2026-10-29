import { isAppSoundActive } from './audio';
import { detectPitch, PitchTracker, signalLevel } from './pitch';
import type { PitchSample } from './pitch';
import { GUITAR_INPUT_FILTERS, MICROPHONE_FRAME_MS } from './inputFilters';
import { EMPTY_CALIBRATION, InputCalibration } from './calibration';
import type { CalibrationState } from './calibration';

export type MicrophoneSensitivity = 'quiet' | 'normal';

export const isDirectGuitarInput = (label: string) => /rocksmith|real[\s-]*tone|usb.*guitar/i.test(label);

export function microphoneGate(sensitivity: MicrophoneSensitivity, noiseFloor: number) {
  return sensitivity === 'quiet'
    ? Math.max(.000015, Math.min(.003, noiseFloor * 1.35))
    : Math.max(.00025, Math.min(.02, noiseFloor * 2.2));
}

export interface MicrophoneState {
  status: 'idle' | 'requesting' | 'listening' | 'error';
  error: string | null;
  sample: PitchSample;
  gate: number;
  inputLabel: string | null;
  calibration: CalibrationState;
}
export const EMPTY_SAMPLE: PitchSample = { reading: null, stable: false, attackId: 0, level: 0, appSound: false };
export const IDLE_MICROPHONE: MicrophoneState = { status: 'idle', error: null, sample: EMPTY_SAMPLE, gate: 0, inputLabel: null, calibration: EMPTY_CALIBRATION };

function microphoneError(error: unknown) {
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Mikrofonadgang blev afvist. Tillad mikrofonen i browserens sideindstillinger, og prøv igen.';
  if (name === 'NotFoundError') return 'Der blev ikke fundet en lydindgang. Tilslut mikrofonen eller USB-guitarkablet, og prøv igen.';
  if (name === 'NotReadableError') return 'Lydindgangen kunne ikke åbnes. Kontrollér, om et andet program bruger den.';
  if (name === 'OverconstrainedError') return 'Den valgte lydindgang er ikke tilgængelig. Tilslut USB-kablet igen, eller vælg en anden indgang.';
  return error instanceof Error ? error.message : 'Mikrofonen kunne ikke startes.';
}

/** Local analysis only. No recording, upload, or microphone monitoring. */
export class MicrophoneListener {
  private generation = 0;
  private resources: { context: AudioContext; stream: MediaStream | null; nodes: AudioNode[]; timer: number | null } | null = null;
  private pending = false;
  private sensitivity: MicrophoneSensitivity = 'quiet';
  private calibration = new InputCalibration();
  private calibratedInput = '';

  setSensitivity = (sensitivity: MicrophoneSensitivity) => { this.sensitivity = sensitivity; this.calibration.reset(); };
  startCalibration = () => { if (this.resources && !this.pending) this.calibration.start(); };
  cancelCalibration = () => { this.calibration.cancel(); };
  finishCalibration = () => { this.calibration.finish(); };
  resetCalibration = () => { this.calibration.reset(); };
  setCalibrationStrings = (strings: readonly number[]) => { this.calibration.setStrings(strings); };

  constructor(private onChange: (state: MicrophoneState) => void) {}

  stop = (notify = true) => {
    this.generation++;
    this.pending = false;
    this.calibration.cancel();
    const resources = this.resources;
    this.resources = null;
    if (resources) {
      if (resources.timer !== null) window.clearTimeout(resources.timer);
      resources.stream?.getTracks().forEach(track => track.stop());
      resources.nodes.forEach(node => node.disconnect());
      void resources.context.close().catch(() => {});
    }
    if (notify) this.onChange(IDLE_MICROPHONE);
  };

  start = async (deviceId = ''): Promise<boolean> => {
    if (this.resources || this.pending) return false;
    this.stop(false);
    const generation = this.generation;
    this.pending = true;
    this.onChange({ ...IDLE_MICROPHONE, status: 'requesting' });
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === 'undefined') {
        throw new Error('Denne browser giver ikke adgang til mikrofonen her. Prøv at åbne Tonerum.html i Chrome eller Edge og tillad mikrofonen.');
      }
      const context = new AudioContext();
      const resources = { context, stream: null as MediaStream | null, nodes: [] as AudioNode[], timer: null as number | null };
      this.resources = resources;
      await context.resume();
      if (generation !== this.generation) return false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1,
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      } });
      // A user may cancel or leave while the browser's permission dialog is open.
      if (generation !== this.generation) { stream.getTracks().forEach(track => track.stop()); return false; }
      resources.stream = stream;
      const input = context.createMediaStreamSource(stream);
      const filters = GUITAR_INPUT_FILTERS.map(config => {
        const filter = context.createBiquadFilter();
        filter.type = config.type;
        filter.frequency.value = config.frequency;
        filter.Q.value = config.q;
        return filter;
      });
      const analyser = context.createAnalyser();
      analyser.fftSize = 4096;
      const sink = context.createGain();
      sink.gain.value = 0;
      resources.nodes = [input, ...filters, analyser, sink];
      input.connect(filters[0]);
      filters.forEach((filter, index) => filter.connect(filters[index + 1] ?? analyser));
      analyser.connect(sink).connect(context.destination);
      stream.getAudioTracks().forEach(track => { track.onended = () => {
        if (generation !== this.generation) return;
        this.stop(false);
        this.onChange({ ...IDLE_MICROPHONE, status: 'error', error: 'Forbindelsen til lydindgangen blev afbrudt. Tilslut den og start lytning igen for at fortsætte.' });
      }; });
      this.pending = false;
      const samples = new Float32Array(analyser.fftSize);
      const tracker = new PitchTracker();
      const inputLabel = stream.getAudioTracks()[0]?.label || 'Browserens valgte lydindgang';
      const inputKey = `${deviceId}:${stream.getAudioTracks()[0]?.getSettings?.().deviceId ?? inputLabel}`;
      if (inputKey !== this.calibratedInput) this.calibration.reset();
      this.calibratedInput = inputKey;
      const directInput = isDirectGuitarInput(inputLabel);
      let noiseFloor = .00001;
      const tick = () => {
        if (generation !== this.generation) return;
        analyser.getFloatTimeDomainData(samples);
        const level = signalLevel(samples);
        const gate = this.calibration.analysisGate(microphoneGate(this.sensitivity, noiseFloor));
        // A direct guitar cable cannot hear our speaker playback. Keep listening
        // during reference tones; acoustic microphones still need suppression.
        const appSound = !directInput && isAppSoundActive();
        const reading = appSound ? null : detectPitch(samples, context.sampleRate, gate);
        // Learn the background from unpitched sound. Quiet, sustained guitar
        // notes must not raise their own threshold until they disappear.
        if (!this.calibration.active && !appSound && !reading) noiseFloor += (level - noiseFloor) * (level < noiseFloor ? .15 : .01);
        const sample = tracker.update(reading, performance.now(), level, appSound);
        this.calibration.update(sample);
        this.onChange({ status: 'listening', error: null, sample, gate,
          inputLabel, calibration: this.calibration.state });
        resources.timer = window.setTimeout(tick, MICROPHONE_FRAME_MS);
      };
      tick();
      return true;
    } catch (error) {
      if (generation !== this.generation) return false;
      this.stop(false);
      this.onChange({ ...IDLE_MICROPHONE, status: 'error', error: microphoneError(error) });
      return false;
    }
  };
}
