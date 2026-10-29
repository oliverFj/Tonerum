import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GuitarControlTracker, isGuitarControl } from './guitarControls';
import type { GuitarCommand } from './guitarControls';
import type { PitchSample } from './pitch';

const sample = (midi: number | null, overrides: Partial<PitchSample> = {}): PitchSample => ({
  reading: midi === null ? null : { midi, frequency: 440 * 2 ** ((midi - 69) / 12), rms: .02, confidence: .98, cents: 0 },
  stable: midi !== null, attackId: 1, level: .02, appSound: false, ...overrides,
});

function feed(tracker: GuitarControlTracker, midi: number | null, from: number, to: number, enabled = true, overrides: Partial<PitchSample> = {}) {
  const commands: GuitarCommand[] = [];
  for (let now = from; now <= to; now += 40) {
    // Different attack IDs must not turn a sustained tone into repeated presses.
    const command = tracker.update(sample(midi, { attackId: now, ...overrides }), now, enabled);
    if (command) commands.push(command);
  }
  return commands;
}

test('each exact high note fires its command once after a deliberate hold', () => {
  for (const [midi, command] of [[81, 'start'], [82, 'pause'], [83, 'stop']] as const) {
    const tracker = new GuitarControlTracker();
    assert.deepEqual(feed(tracker, midi, 0, 480), []);
    assert.deepEqual(feed(tracker, midi, 520, 2000), [command]);
    assert.ok(isGuitarControl(midi));
    assert.ok(!isGuitarControl(midi - 12));
  }
});

test('a command needs release before another command; brief detection dropouts do not rearm it', () => {
  const tracker = new GuitarControlTracker();
  assert.deepEqual(feed(tracker, 81, 0, 600), ['start']);
  feed(tracker, null, 640, 720);
  assert.deepEqual(feed(tracker, 81, 760, 1400), []);
  assert.deepEqual(feed(tracker, 82, 1440, 2080), [], 'sliding between shortcut notes is still one gesture');
  feed(tracker, null, 2120, 2440);
  assert.deepEqual(feed(tracker, 82, 2480, 3040), ['pause']);
});

test('normal notes, brief high notes, unstable readings and guide sounds cannot become commands', () => {
  for (const midi of [40, 69, 70, 71, 80]) assert.deepEqual(feed(new GuitarControlTracker(), midi, 0, 1200), []);
  const tracker = new GuitarControlTracker();
  feed(tracker, 81, 0, 240);
  feed(tracker, null, 280, 400);
  assert.deepEqual(feed(tracker, 81, 440, 680), []);
  assert.deepEqual(feed(new GuitarControlTracker(), 81, 0, 1200, true, { stable: false }), []);
  assert.deepEqual(feed(new GuitarControlTracker(), 81, 0, 1200, true, { appSound: true }), []);
  for (const reading of [{ ...sample(81).reading!, cents: 45 }, { ...sample(81).reading!, confidence: .7 }]) {
    assert.deepEqual(feed(new GuitarControlTracker(), 81, 0, 1200, true, { reading }), []);
  }
});

test('disabled contexts require a fresh release and hold when returning to the exercise', () => {
  const tracker = new GuitarControlTracker();
  assert.deepEqual(feed(tracker, 81, 0, 600, false), []);
  assert.deepEqual(feed(tracker, 81, 640, 1240), []);
  feed(tracker, 60, 1280, 1600);
  assert.deepEqual(feed(tracker, 81, 1640, 2200), ['start']);
});

test('a stalled audio stream cannot complete a hold using an old reading', () => {
  const tracker = new GuitarControlTracker();
  assert.equal(tracker.update(sample(81), 0), null);
  assert.equal(tracker.update(sample(81), 1000), null);
  assert.deepEqual(feed(tracker, 81, 1040, 1520), ['start']);
});
