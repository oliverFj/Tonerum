import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAppSoundActive, playMetronomeClick, prepareAudio } from './audio';

test('metronome schedules a short noise click outside the guitar band without suspending pitch input', async () => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  class Node {
    disconnected = false;
    connect(node: Node) { return node; }
    disconnect() { this.disconnected = true; }
  }
  const voice = Object.assign(new Node(), {
    buffer: null as { getChannelData: (channel: number) => Float32Array } | null,
    onended: null as (() => void) | null,
    starts: [] as number[], stops: [] as (number | undefined)[],
    start(at: number) { this.starts.push(at); },
    stop(at?: number) { this.stops.push(at); },
  });
  const filter = Object.assign(new Node(), { type: '', frequency: { value: 0 } });
  const envelope = Object.assign(new Node(), { gain: {
    setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {},
  } });
  class Context {
    state = 'suspended';
    currentTime = 1;
    sampleRate = 48000;
    destination = new Node();
    async resume() { this.state = 'running'; }
    createBuffer(channels: number, length: number, sampleRate: number) {
      assert.equal(channels, 1);
      assert.equal(sampleRate, this.sampleRate);
      const samples = new Float32Array(length);
      return { getChannelData: () => samples };
    }
    createBufferSource() { return voice; }
    createBiquadFilter() { return filter; }
    createGain() { return envelope; }
  }
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: Context });
  try {
    assert.equal(playMetronomeClick(1.25), null, 'a click cannot create audio before a user starts sound');
    await prepareAudio();
    const cancel = playMetronomeClick(1.25);
    assert.ok(cancel);
    assert.deepEqual(voice.starts, [1.25]);
    assert.ok(voice.stops[0]! - voice.starts[0] < .02);
    assert.equal(voice.buffer!.getChannelData(0).length, 576);
    assert.equal(filter.type, 'highpass');
    assert.ok(filter.frequency.value > 1400);
    assert.equal(isAppSoundActive(), false, 'clicks must not block the player on every beat');
    cancel();
    assert.equal(voice.stops.length, 2, 'future clicks can be cancelled immediately');
    voice.onended?.();
    assert.ok(voice.disconnected && filter.disconnected && envelope.disconnected);
  } finally {
    if (saved) Object.defineProperty(globalThis, 'AudioContext', saved);
    else Reflect.deleteProperty(globalThis, 'AudioContext');
  }
});
