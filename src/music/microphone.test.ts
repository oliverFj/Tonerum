import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDirectGuitarInput, MicrophoneListener } from './microphone';
import type { MicrophoneState } from './microphone';

function environment(getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>) {
  const saved = new Map(['window', 'navigator', 'AudioContext'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  let clearedTimers = 0;
  const contexts: FakeContext[] = [];
  const outputs: { gain: { value: number } }[] = [];
  class FakeNode {
    connect(node: FakeNode) { return node; }
    disconnect() {}
  }
  class FakeContext {
    closed = false;
    sampleRate = 48000;
    destination = new FakeNode();
    constructor() { contexts.push(this); }
    async resume() {}
    async close() { this.closed = true; }
    createMediaStreamSource() { return new FakeNode(); }
    createBiquadFilter() { return Object.assign(new FakeNode(), { frequency: { value: 0 }, Q: { value: 1 }, type: '' }); }
    createAnalyser() { return Object.assign(new FakeNode(), { fftSize: 4096, getFloatTimeDomainData: (samples: Float32Array) => samples.fill(0) }); }
    createGain() {
      const node = Object.assign(new FakeNode(), { gain: { value: 1 } });
      outputs.push(node);
      return node;
    }
  }
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: FakeContext });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia } } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    setTimeout: () => 1, clearTimeout: () => { clearedTimers++; },
  } });
  return {
    contexts, outputs, get clearedTimers() { return clearedTimers; },
    restore: () => saved.forEach((descriptor, key) => {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }),
  };
}

function stream(label = '') {
  const track = { label, stopped: false, onended: null as (() => void) | null, stop() { this.stopped = true; } };
  return { track, media: { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream };
}

test('microphone runs locally through a silent output and releases tracks, timer and context on stop', async () => {
  const source = stream();
  const states: MicrophoneState[] = [];
  const env = environment(async constraints => {
    assert.deepEqual(constraints.audio, { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 });
    return source.media;
  });
  const listener = new MicrophoneListener(state => states.push(state));
  try {
    assert.equal(await listener.start(), true);
    assert.equal(states.at(-1)?.status, 'listening');
    assert.equal(env.outputs[0].gain.value, 0);
    listener.stop();
    assert.equal(source.track.stopped, true);
    assert.equal(env.contexts[0].closed, true);
    assert.equal(env.clearedTimers, 1);
    assert.equal(states.at(-1)?.status, 'idle');
  } finally { listener.stop(false); env.restore(); }
});

test('cancelling during a permission dialog stops any late-arriving stream without starting analysis', async () => {
  const source = stream();
  let grant!: (value: MediaStream) => void;
  const permission = new Promise<MediaStream>(resolve => { grant = resolve; });
  const states: MicrophoneState[] = [];
  const env = environment(() => permission);
  const listener = new MicrophoneListener(state => states.push(state));
  try {
    const starting = listener.start();
    await Promise.resolve();
    listener.stop();
    grant(source.media);
    assert.equal(await starting, false);
    assert.equal(source.track.stopped, true);
    assert.equal(env.contexts[0].closed, true);
    assert.ok(states.every(state => state.status !== 'listening'));
    assert.equal(states.at(-1)?.status, 'idle');
  } finally { listener.stop(false); env.restore(); }
});

test('denied access closes the audio context and produces a useful error', async () => {
  const states: MicrophoneState[] = [];
  const env = environment(async () => { throw new DOMException('Denied', 'NotAllowedError'); });
  const listener = new MicrophoneListener(state => states.push(state));
  try {
    assert.equal(await listener.start(), false);
    assert.equal(env.contexts[0].closed, true);
    assert.equal(states.at(-1)?.status, 'error');
    assert.match(states.at(-1)?.error ?? '', /Tillad mikrofonen/);
  } finally { listener.stop(false); env.restore(); }
});

test('disconnecting the input stops listening and releases its resources', async () => {
  const source = stream();
  const states: MicrophoneState[] = [];
  const env = environment(async () => source.media);
  const listener = new MicrophoneListener(state => states.push(state));
  try {
    await listener.start();
    source.track.onended?.();
    assert.equal(states.at(-1)?.status, 'error');
    assert.equal(env.contexts[0].closed, true);
    assert.equal(source.track.stopped, true);
  } finally { listener.stop(false); env.restore(); }
});

test('a selected USB guitar input is requested explicitly and its actual device label is displayed', async () => {
  const source = stream('Rocksmith USB Guitar Adapter');
  const states: MicrophoneState[] = [];
  const env = environment(async constraints => {
    assert.equal(typeof constraints.audio, 'object');
    assert.deepEqual((constraints.audio as MediaTrackConstraints).deviceId, { exact: 'real-tone-device' });
    return source.media;
  });
  const listener = new MicrophoneListener(state => states.push(state));
  try {
    assert.equal(await listener.start('real-tone-device'), true);
    assert.equal(states.at(-1)?.inputLabel, 'Rocksmith USB Guitar Adapter');
    assert.equal(states.at(-1)?.status, 'listening');
  } finally { listener.stop(false); env.restore(); }
});

test('an unavailable selected input reports the problem instead of silently using a microphone', async () => {
  let requests = 0;
  const states: MicrophoneState[] = [];
  const env = environment(async () => { requests++; throw new DOMException('Missing device', 'OverconstrainedError'); });
  const listener = new MicrophoneListener(state => states.push(state));
  try {
    assert.equal(await listener.start('unplugged-device'), false);
    assert.equal(requests, 1);
    assert.equal(env.contexts[0].closed, true);
    assert.equal(states.at(-1)?.status, 'error');
    assert.match(states.at(-1)?.error ?? '', /valgte lydindgang/);
  } finally { listener.stop(false); env.restore(); }
});

test('known direct guitar cables are distinguished from acoustic USB microphones', () => {
  assert.equal(isDirectGuitarInput('Rocksmith USB Guitar Adapter'), true);
  assert.equal(isDirectGuitarInput('Real Tone Cable'), true);
  assert.equal(isDirectGuitarInput('USB Guitar Interface'), true);
  assert.equal(isDirectGuitarInput('TONOR USB Condenser Microphone'), false);
  assert.equal(isDirectGuitarInput('Computerens standardindgang'), false);
});
