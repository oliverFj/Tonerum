import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_TRAINER, melodyTimeline, trainerReducer } from './trainer';
import type { TrainerAction, TrainingMode } from './trainer';
import type { MelodyEvent } from './types';

const note = (midi: number, duration = 1): MelodyEvent => ({ type: 'note', midi, duration });
function session(events: MelodyEvent[], mode: TrainingMode = 'wait') {
  const timeline = melodyTimeline(events);
  let state = trainerReducer(EMPTY_TRAINER, { type: 'start', mode, bpm: 120, now: 0, attack: 0 }, timeline);
  return (action: TrainerAction) => (state = trainerReducer(state, action, timeline));
}

test('waiting never skips an unanswered note, preserves octaves and requires fresh attacks for repetitions', () => {
  const act = session([note(60), note(60)]);
  assert.equal(act({ type: 'tick', now: 10000 }).beat, 0);
  const wrong = act({ type: 'answer', midi: 72, attack: 1, now: 10000 });
  assert.equal(wrong.results[0], 'pending');
  assert.equal(wrong.lastHit, null);
  const hit = act({ type: 'answer', midi: 60, attack: 2, now: 10040 });
  assert.equal(hit.results[0], 'correct');
  assert.deepEqual(hit.lastHit, { index: 0, at: 10040 });
  assert.equal(act({ type: 'tick', now: 30000 }).beat, 1);
  const held = act({ type: 'answer', midi: 60, attack: 2, now: 30000 });
  assert.equal(held.results[1], 'pending');
  assert.deepEqual(held.lastHit, hit.lastHit);
  assert.equal(act({ type: 'answer', midi: 60, attack: 3, now: 30040 }).results[1], 'correct');
  assert.equal(act({ type: 'tick', now: 30540 }).phase, 'complete');
});

test('free practice advances immediately after a hit, keeps rests and stops at the following note after a late frame', () => {
  const act = session([note(60), { type: 'rest', duration: 1 }, note(62, .5)]);
  assert.equal(act({ type: 'answer', midi: 60, attack: 1, now: 0 }).beat, 1);
  const rest = act({ type: 'tick', now: 250 });
  assert.equal(rest.beat, 1.5);
  assert.equal(rest.results[1], 'rest');
  assert.equal(act({ type: 'tick', now: 2000 }).beat, 2);
  act({ type: 'answer', midi: 62, attack: 2, now: 2040 });
  assert.equal(act({ type: 'tick', now: 2290 }).phase, 'complete');
});

test('rhythm has a four-beat count-in, consumes early held notes and marks missed notes', () => {
  const act = session([note(60), note(62)], 'rhythm');
  assert.equal(act({ type: 'answer', midi: 60, attack: 1, now: 1900 }).phase, 'countin');
  assert.equal(act({ type: 'answer', midi: 60, attack: 1, now: 2010 }).results[0], 'pending');
  assert.equal(act({ type: 'answer', midi: 60, attack: 2, now: 2040 }).results[0], 'correct');
  const end = act({ type: 'tick', now: 3190 });
  assert.equal(end.phase, 'complete');
  assert.deepEqual(end.results, ['correct', 'missed']);
});

test('rhythm accepts a late detected note across a boundary, but does not accept arbitrary future notes', () => {
  const act = session([note(60), note(62), note(64)], 'rhythm');
  assert.equal(act({ type: 'answer', midi: 64, attack: 1, now: 2010 }).results[2], 'pending');
  assert.equal(act({ type: 'answer', midi: 60, attack: 2, now: 2590 }).results[0], 'correct');
  assert.equal(act({ type: 'answer', midi: 62, attack: 3, now: 2640 }).results[1], 'correct');
  assert.equal(act({ type: 'tick', now: 3700 }).phase, 'complete');
});

test('tempo changes preserve elapsed progress, and pause/resume cannot spend hidden time or held notes', () => {
  const act = session([note(60, 8)], 'rhythm');
  assert.equal(act({ type: 'tempo', now: 1000, bpm: 60 }).beat, -2);
  assert.equal(act({ type: 'pause', now: 2000 }).beat, -1);
  assert.equal(act({ type: 'tick', now: 100000 }).beat, -1);
  act({ type: 'resume', now: 100000, attack: 5 });
  const first = act({ type: 'tick', now: 101000 });
  assert.equal(first.phase, 'playing');
  assert.equal(first.beat, 0);
  assert.equal(act({ type: 'answer', midi: 60, attack: 5, now: 101000 }).results[0], 'pending');
  assert.equal(act({ type: 'answer', midi: 60, attack: 6, now: 101040 }).results[0], 'correct');
});

test('a background jump records missed notes once, and stopping clears the session', () => {
  const act = session([note(60), note(62), { type: 'rest', duration: 1 }, note(64)], 'rhythm');
  const done = act({ type: 'tick', now: 50000 });
  assert.deepEqual(done.results, ['missed', 'missed', 'rest', 'missed']);
  assert.equal(act({ type: 'answer', midi: 64, attack: 1, now: 50010 }).results[3], 'missed');
  assert.deepEqual(act({ type: 'stop' }), EMPTY_TRAINER);
});

test('the correct first note starts the session and counts the starting pluck once in both modes', () => {
  const timeline = melodyTimeline([note(60), note(60), note(62)]);
  for (const mode of ['wait', 'rhythm'] as const) {
    const start = { type: 'start-note', mode, bpm: 120, now: 1000, midi: 60, attack: 3 } as const;
    const wrong = trainerReducer(EMPTY_TRAINER, { ...start, midi: 72 }, timeline);
    assert.equal(wrong, EMPTY_TRAINER, 'the first note must have the right octave');
    const started = trainerReducer(EMPTY_TRAINER, start, timeline);
    assert.equal(started.phase, 'playing');
    assert.equal(started.beat, mode === 'wait' ? 1 : 0);
    assert.deepEqual(started.results, ['correct', 'pending', 'pending']);
    assert.deepEqual(started.lastHit, { index: 0, at: 1000 });
    const held = trainerReducer(started, { type: 'answer', midi: 60, now: 1500, attack: 3 }, timeline);
    assert.equal(held.results[1], 'pending', 'the starting pluck cannot also answer a repeated second note');
    const paused = trainerReducer(started, { type: 'pause', now: 1000 }, timeline);
    assert.equal(trainerReducer(paused, { ...start, attack: 4 }, timeline), paused, 'a paused exercise must not restart');
    assert.equal(trainerReducer(started, { ...start, attack: 4 }, timeline), started, 'normal playing must not restart');
  }
});

test('playing the first note retries a completed song but its last held note cannot restart it', () => {
  const timeline = melodyTimeline([note(60)]);
  const start = { type: 'start-note', mode: 'wait', bpm: 120, now: 1000, midi: 60, attack: 1 } as const;
  const done = trainerReducer(EMPTY_TRAINER, start, timeline);
  assert.equal(done.phase, 'complete');
  assert.equal(trainerReducer(done, { ...start, now: 2000 }, timeline), done);
  const retried = trainerReducer(done, { ...start, attack: 2, now: 2500 }, timeline);
  assert.deepEqual(retried.results, ['correct']);
  assert.deepEqual(retried.lastHit, { index: 0, at: 2500 });
});

test('starting with the first played note anchors the rhythm after any leading rests', () => {
  const timeline = melodyTimeline([{ type: 'rest', duration: 2 }, note(60, 2), note(62)]);
  const started = trainerReducer(EMPTY_TRAINER, { type: 'start-note', mode: 'rhythm', bpm: 120, now: 1000, midi: 60, attack: 1 }, timeline);
  assert.equal(started.beat, 2);
  assert.deepEqual(started.results, ['rest', 'correct', 'pending']);
  assert.equal(trainerReducer(started, { type: 'tick', now: 2000 }, timeline).beat, 4);
});
