import { useEffect, useReducer, useRef, useState } from 'react';
import { createChallenge, EMPTY_PRACTICE, melodyChallenge, practiceReducer } from '../music/practice';
import type { PracticeInput, PracticeMode } from '../music/practice';
import type { MelodyEvent } from '../music/types';
import type { PitchSample } from '../music/pitch';

export function usePractice(events: MelodyEvent[], pool: number[], sample: PitchSample, contextKey: string) {
  const [mode, setMode] = useState<PracticeMode>('hunt');
  const [input, setInput] = useState<PracticeInput>('click');
  const [state, dispatch] = useReducer(practiceReducer, EMPTY_PRACTICE);
  const lastAttack = useRef(-1);
  const active = state.phase === 'playing' || state.phase === 'correct';

  useEffect(() => { dispatch({ type: 'stop' }); }, [contextKey, mode, input]);

  useEffect(() => {
    if (state.phase !== 'correct') return;
    const timer = window.setTimeout(() => dispatch({ type: 'next' }), 650);
    return () => window.clearTimeout(timer);
  }, [state.phase]);

  useEffect(() => {
    if (!active || input !== 'microphone' || !sample.stable || !sample.reading || sample.appSound) return;
    if (sample.attackId === lastAttack.current) return;
    // Let a slightly unsettled attack settle before consuming the attempt.
    // Notes heard during the feedback pause still cannot answer the next task.
    if (state.phase !== 'playing' || Math.abs(sample.reading.cents) <= 40) {
      lastAttack.current = sample.attackId;
    }
    if (state.phase === 'playing' && Math.abs(sample.reading.cents) <= 40) {
      dispatch({ type: 'answer', midi: sample.reading.midi });
    }
  }, [sample, input, active, state.phase]);

  return {
    state, mode, input, active, setMode, setInput,
    target: active ? state.queue[state.index] : null,
    start: () => {
      lastAttack.current = sample.attackId; // An already-ringing note is not a new attempt.
      dispatch({ type: 'start', queue: mode === 'hunt' ? createChallenge(pool) : melodyChallenge(events) });
    },
    stop: () => dispatch({ type: 'stop' }),
    hint: () => dispatch({ type: 'hint' }),
    answerClick: (midi: number) => { if (input === 'click') dispatch({ type: 'answer', midi }); },
  };
}
