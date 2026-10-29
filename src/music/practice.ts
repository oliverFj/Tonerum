import type { MelodyEvent } from './types';

export type PracticeMode = 'hunt' | 'melody';
export type PracticeInput = 'click' | 'microphone';
export type PracticePhase = 'idle' | 'playing' | 'correct' | 'complete';
export interface PracticeState {
  phase: PracticePhase;
  queue: number[];
  index: number;
  mistakes: number;
  lastAnswer: number | null;
  hint: boolean;
}
export const EMPTY_PRACTICE: PracticeState = {
  phase: 'idle', queue: [], index: 0, mistakes: 0, lastAnswer: null, hint: false,
};

export function createChallenge(pool: number[], count = 10, random = Math.random): number[] {
  const pitches = [...new Set(pool)];
  if (!pitches.length) return [];
  const queue: number[] = [];
  for (let i = 0; i < count; i++) {
    const alternatives = pitches.filter(midi => midi !== queue.at(-1));
    const options = alternatives.length ? alternatives : pitches;
    queue.push(options[Math.min(options.length - 1, Math.floor(random() * options.length))]);
  }
  return queue;
}

export function melodyChallenge(events: MelodyEvent[]): number[] {
  // This is pitch practice, not rhythm assessment. Repeated notes remain separate.
  return events.flatMap(event => event.type === 'note' ? [event.midi] : []);
}

export type PracticeAction =
  | { type: 'start'; queue: number[] }
  | { type: 'answer'; midi: number }
  | { type: 'next' }
  | { type: 'hint' }
  | { type: 'stop' };

export function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  switch (action.type) {
    case 'start': return action.queue.length ? { ...EMPTY_PRACTICE, phase: 'playing', queue: action.queue } : EMPTY_PRACTICE;
    case 'stop': return EMPTY_PRACTICE;
    case 'hint': return { ...state, hint: !state.hint };
    case 'answer':
      if (state.phase !== 'playing') return state;
      return action.midi === state.queue[state.index]
        ? { ...state, phase: 'correct', lastAnswer: action.midi }
        : { ...state, mistakes: state.mistakes + 1, lastAnswer: action.midi };
    case 'next':
      if (state.phase !== 'correct') return state;
      return state.index + 1 === state.queue.length
        ? { ...state, phase: 'complete', hint: false }
        : { ...state, phase: 'playing', index: state.index + 1, lastAnswer: null, hint: false };
  }
}
