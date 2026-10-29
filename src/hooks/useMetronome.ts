import { useEffect, useMemo, useRef, useState } from 'react';
import { playMetronomeClick, prepareAudio } from '../music/audio';
import type { TrainerState } from '../music/trainer';

export function useMetronome(enabled: boolean, bpm: number, trainer: TrainerState) {
  const [pulse, setPulse] = useState(0);
  const clock = useRef<{ origin: number; bpm: number } | null>(null);
  const synced = trainer.mode === 'rhythm' && (trainer.phase === 'countin' || trainer.phase === 'playing');
  // While rhythm practice runs at a fixed tempo, its origin stays constant.
  // Capture it again on start/resume or tempo changes, rather than every frame.
  const practiceOrigin = useMemo(() => synced ? trainer.lastAt - trainer.beat * 60000 / trainer.bpm : null,
    [synced, trainer.bpm]);

  useEffect(() => {
    if (!enabled) { clock.current = null; return; }
    let disposed = false;
    let release = () => {};
    void prepareAudio().then(audio => {
      if (disposed) return;
      const now = audio.currentTime;
      const previous = clock.current;
      const elapsedBeats = previous ? (now - previous.origin) * previous.bpm / 60 : 0;
      const period = 60 / bpm;
      const origin = practiceOrigin !== null ? now + (practiceOrigin - performance.now()) / 1000
        : previous ? now - elapsedBeats * period : now + .015;
      clock.current = { origin, bpm };
      let nextBeat = Math.ceil((now - origin - .025) / period);
      let timer: number;
      let queued: { at: number; cancel: () => void; visual: number }[] = [];
      const clearQueued = () => {
        queued.forEach(item => { item.cancel(); window.clearTimeout(item.visual); });
        queued = [];
      };
      const visibility = () => { if (document.hidden) clearQueued(); };
      const schedule = () => {
        const time = audio.currentTime;
        queued = queued.filter(item => item.at >= time - .1);
        if (!document.hidden) {
          // Never replay missed clicks after a suspended/background tab.
          if (origin + nextBeat * period < time - .03) nextBeat = Math.ceil((time - origin) / period);
          while (origin + nextBeat * period < time + .08) {
            const at = Math.max(time, origin + nextBeat * period);
            const cancel = playMetronomeClick(at);
            if (cancel) {
              const visual = window.setTimeout(() => setPulse(value => value + 1), Math.max(0, (at - time) * 1000));
              queued.push({ at, cancel, visual });
            }
            nextBeat++;
          }
        }
        timer = window.setTimeout(schedule, 25);
      };
      document.addEventListener('visibilitychange', visibility);
      schedule();
      release = () => {
        window.clearTimeout(timer);
        clearQueued();
        document.removeEventListener('visibilitychange', visibility);
      };
    }).catch(() => { /* The start button reports audio permission errors. */ });
    return () => { disposed = true; release(); };
  }, [enabled, bpm, practiceOrigin]);

  return pulse;
}
