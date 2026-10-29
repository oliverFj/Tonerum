import { useEffect, useRef, useState } from 'react';
import { GuitarControlTracker } from '../music/guitarControls';
import type { GuitarCommand } from '../music/guitarControls';
import type { PitchSample } from '../music/pitch';

export function useGuitarControls(sample: PitchSample, enabled: boolean, onCommand: (command: GuitarCommand) => void) {
  const [tracker] = useState(() => new GuitarControlTracker());
  const handler = useRef(onCommand);
  handler.current = onCommand;
  useEffect(() => {
    const command = tracker.update(sample, performance.now(), enabled && !document.hidden);
    if (command) handler.current(command);
  }, [sample, enabled, tracker]);
}
