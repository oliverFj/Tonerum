import type { MelodyEvent } from './types';

export type TrainingMode = 'wait' | 'rhythm';
export type NoteResult = 'pending' | 'correct' | 'missed' | 'rest';
export interface TimedEvent { event: MelodyEvent; start: number; end: number }
export function melodyTimeline(events: MelodyEvent[]): TimedEvent[] {
  let beat = 0;
  return events.map(event => { const start = beat; beat += event.duration; return { event, start, end: beat }; });
}
export interface TrainerState {
  phase: 'idle' | 'countin' | 'playing' | 'paused' | 'complete';
  mode: TrainingMode;
  beat: number;
  bpm: number;
  lastAt: number;
  results: NoteResult[];
  lastAttack: number;
  lastAnswer: number | null;
  lastHit: { index: number; at: number } | null;
}
export const EMPTY_TRAINER: TrainerState = {
  phase: 'idle', mode: 'wait', beat: 0, bpm: 90, lastAt: 0, results: [], lastAttack: -1, lastAnswer: null, lastHit: null,
};
export const trainerActive = (state: TrainerState) => state.phase === 'countin' || state.phase === 'playing';
export function currentEvent(state: TrainerState, timeline: TimedEvent[]) {
  const index = timeline.findIndex(item => item.end > Math.max(0, state.beat));
  return index < 0 ? Math.max(0, timeline.length - 1) : index;
}

export function advanceTrainer(state: TrainerState, timeline: TimedEvent[], now: number): TrainerState {
  if (!trainerActive(state)) return state;
  let beat = state.beat + Math.max(0, now - state.lastAt) * state.bpm / 60000;
  const results = [...state.results];
  if (state.mode === 'wait') {
    // Rests run in tempo; unanswered notes hold the clock exactly at their
    // start. Long frames cannot skip a task in free practice.
    const waiting = timeline.findIndex((item, i) => results[i] === 'pending' && item.start <= beat);
    if (waiting >= 0) beat = timeline[waiting].start;
  } else {
    const lateWindow = state.bpm * .18 / 60;
    timeline.forEach((item, index) => {
      if (results[index] === 'pending' && beat > item.end + lateWindow) results[index] = 'missed';
    });
  }
  const end = timeline.at(-1)?.end ?? 0;
  const finished = beat >= end + (state.mode === 'rhythm' ? state.bpm * .18 / 60 : 0);
  if (finished) for (let i = 0; i < results.length; i++) if (results[i] === 'pending') results[i] = 'missed';
  return { ...state, beat, results, lastAt: now,
    phase: finished ? 'complete' : beat < 0 ? 'countin' : 'playing' };
}

export type TrainerAction =
  | { type: 'start'; mode: TrainingMode; bpm: number; now: number; attack: number }
  | { type: 'start-note'; mode: TrainingMode; bpm: number; now: number; midi: number; attack: number }
  | { type: 'tick'; now: number }
  | { type: 'tempo'; now: number; bpm: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number; attack: number }
  | { type: 'answer'; now: number; midi: number; attack: number }
  | { type: 'stop' };

export function trainerReducer(state: TrainerState, action: TrainerAction, timeline: TimedEvent[]): TrainerState {
  if (action.type === 'stop') return EMPTY_TRAINER;
  if (action.type === 'start-note') {
    const first = timeline.find(item => item.event.type === 'note');
    if ((state.phase !== 'idle' && state.phase !== 'complete') || state.lastAttack === action.attack
      || first?.event.type !== 'note' || first.event.midi !== action.midi) return state;
    const started = trainerReducer(state, { ...action, type: 'start', attack: action.attack - 1 }, timeline);
    // The player's first note anchors the rhythm immediately. Button/A5 starts
    // keep their count-in; starting by playing must count this very pluck.
    return trainerReducer({ ...started, phase: 'playing', beat: first.start }, { ...action, type: 'answer' }, timeline);
  }
  if (action.type === 'start') return timeline.length ? {
    ...EMPTY_TRAINER, phase: action.mode === 'rhythm' ? 'countin' : 'playing', mode: action.mode,
    beat: action.mode === 'rhythm' ? -4 : 0, bpm: action.bpm, lastAt: action.now, lastAttack: action.attack,
    results: timeline.map(({ event }) => event.type === 'rest' ? 'rest' : 'pending'),
  } : EMPTY_TRAINER;
  if (action.type === 'resume') return state.phase === 'paused' ? { ...state,
    phase: state.beat < 0 ? 'countin' : 'playing', lastAt: action.now, lastAttack: action.attack } : state;
  const updated = advanceTrainer(state, timeline, action.now);
  if (action.type === 'tempo') return { ...updated, bpm: action.bpm };
  if (action.type === 'pause') return trainerActive(updated) ? { ...updated, phase: 'paused' } : updated;
  if (action.type === 'tick') return updated;
  if (action.attack === updated.lastAttack) return updated;
  const answered = { ...updated, lastAttack: action.attack };
  if (updated.phase !== 'playing') return answered;
  const current = currentEvent(updated, timeline);
  const early = updated.bpm * .12 / 60, late = updated.bpm * .18 / 60;
  // Prefer the current note. A little room on each side absorbs analysis
  // latency without letting a held note answer repeated notes twice.
  const candidates = updated.mode === 'wait' ? [current] : [current, current - 1, current + 1];
  const hit = candidates.find(index => {
    const item = timeline[index];
    return item?.event.type === 'note' && item.event.midi === action.midi && updated.results[index] === 'pending'
      && updated.beat >= item.start - early && updated.beat <= item.end + late;
  });
  if (hit === undefined) return { ...answered, lastAnswer: action.midi };
  const results = [...updated.results];
  results[hit] = 'correct';
  const lastHit = { index: hit, at: action.now };
  if (updated.mode === 'wait') {
    // Free practice advances as soon as the right note is heard. It never
    // requires waiting out a note's duration before the next fresh attack.
    const beat = timeline[hit].end;
    return { ...answered, results, lastAnswer: action.midi, lastHit, beat,
      phase: beat >= timeline.at(-1)!.end ? 'complete' : 'playing' };
  }
  return { ...answered, results, lastAnswer: action.midi, lastHit };
}
