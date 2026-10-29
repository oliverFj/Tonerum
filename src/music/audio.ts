let context: AudioContext | undefined;
let soundingUntil = 0;
let clickBuffer: AudioBuffer | undefined;

// A microphone must never award a hit for a reference tone from our speakers.
export const isAppSoundActive = () => performance.now() < soundingUntil;

export async function prepareAudio() {
  context ??= new AudioContext();
  if (context.state === 'suspended') await context.resume();
  return context;
}

/** Short, unpitched click above the guitar analysis band. Unlike guide tones,
 * it must not suspend listening at the exact moment the player should pluck. */
export function playMetronomeClick(at: number): (() => void) | null {
  if (!context || context.state !== 'running') return null;
  if (!clickBuffer) {
    clickBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * .012), context.sampleRate);
    const samples = clickBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }
  const now = Math.max(at, context.currentTime);
  const voice = context.createBufferSource();
  voice.buffer = clickBuffer;
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3000;
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(.22, now + .001);
  envelope.gain.exponentialRampToValueAtTime(.0001, now + .012);
  voice.connect(filter).connect(envelope).connect(context.destination);
  voice.onended = () => { voice.disconnect(); filter.disconnect(); envelope.disconnect(); };
  voice.start(now);
  voice.stop(now + .014);
  return () => { voice.stop(); };
}

/** Small synthesized pluck, with no recordings or external audio dependencies. */
export function playTone(midi: number, duration = .7) {
  if (!context || context.state !== 'running') return;
  soundingUntil = Math.max(soundingUntil, performance.now() + duration * 1000 + 450);
  const now = context.currentTime;
  const voice = context.createOscillator();
  const envelope = context.createGain();
  const filter = context.createBiquadFilter();
  voice.type = 'triangle';
  voice.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2600, now);
  filter.frequency.exponentialRampToValueAtTime(600, now + Math.max(.08, duration));
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(.22, now + .008);
  envelope.gain.exponentialRampToValueAtTime(.001, now + Math.max(.08, duration));
  voice.connect(filter).connect(envelope).connect(context.destination);
  voice.start(now);
  voice.stop(now + duration + .05);
  voice.onended = () => { voice.disconnect(); filter.disconnect(); envelope.disconnect(); };
}
