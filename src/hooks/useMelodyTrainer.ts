import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { currentEvent, EMPTY_TRAINER, melodyTimeline, trainerActive, trainerReducer } from '../music/trainer';
import type { TrainingMode } from '../music/trainer';
import type { MelodyEvent } from '../music/types';
import type { PitchSample } from '../music/pitch';

export function useMelodyTrainer(events: MelodyEvent[], sample: PitchSample, bpm: number, startOnFirstNote = false) {
  const timeline = useMemo(() => melodyTimeline(events), [events]);
  const [mode, setMode] = useState<TrainingMode>('wait');
  const [state, dispatch] = useReducer((state: typeof EMPTY_TRAINER, action: Parameters<typeof trainerReducer>[1]) =>
    trainerReducer(state, action, timeline), EMPTY_TRAINER);
  const active = trainerActive(state);
  const startAttack = useRef(sample.attackId);
  useEffect(() => { startAttack.current = sample.attackId; dispatch({ type: 'stop' }); }, [events, mode]);
  useEffect(() => { dispatch({ type: 'tempo', now: performance.now(), bpm }); }, [bpm]);
  useEffect(() => {
    if (!startOnFirstNote || document.hidden || (state.phase !== 'idle' && state.phase !== 'complete')) {
      startAttack.current = sample.attackId;
      return;
    }
    if (!sample.stable || !sample.reading || sample.appSound || Math.abs(sample.reading.cents) > 40
      || sample.attackId === startAttack.current) return;
    startAttack.current = sample.attackId;
    dispatch({ type: 'start-note', mode, bpm, now: performance.now(), midi: sample.reading.midi, attack: sample.attackId });
  }, [sample, startOnFirstNote, state.phase, mode, bpm]);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => dispatch({ type: 'tick', now: performance.now() }), 40);
    const hide = () => { if (document.hidden) dispatch({ type: 'pause', now: performance.now() }); };
    document.addEventListener('visibilitychange', hide);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', hide); };
  }, [active]);
  useEffect(() => {
    if ((!active && state.phase !== 'paused') || !sample.stable || !sample.reading || sample.appSound
      || Math.abs(sample.reading.cents) > 40) return;
    dispatch({ type: 'answer', now: performance.now(), midi: sample.reading.midi, attack: sample.attackId });
  }, [sample, active, state.phase]);
  const index = currentEvent(state, timeline);
  return { state, mode, setMode, timeline, index, active,
    started: state.phase !== 'idle',
    target: timeline[index]?.event.type === 'note' ? timeline[index].event.midi : null,
    start: () => dispatch({ type: 'start', mode, bpm, now: performance.now(), attack: sample.attackId }),
    stop: () => dispatch({ type: 'stop' }),
    pause: () => dispatch({ type: 'pause', now: performance.now() }),
    resume: () => dispatch({ type: 'resume', now: performance.now(), attack: sample.attackId }),
  };
}
