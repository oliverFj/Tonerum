import { findBestCenter } from './optimizer';
import type { MatchMode, MelodyEvent, PlayingRegion } from './types';

export const FINGERING_PRESETS = [
  { id: 'upper', label: 'Omkring bånd 10–12', description: 'Foretrækker bånd 10–12 og bruger nabobånd, når melodien kræver det.' },
  { id: 'compact', label: 'Få håndflytninger', description: 'Finder et samlet område til hele melodien og foretrækker at blive dér.' },
  { id: 'open', label: 'Åben position', description: 'Foretrækker løse strenge og bånd 1–4.' },
  { id: 'free', label: 'Hele halsen', description: 'Fordeler tonerne frit på halsen med korte bånd- og strengskift.' },
  { id: 'custom', label: 'Eget område', description: 'Vælg selv centrum og rækkevidde.' },
] as const;
export type FingeringPreset = typeof FINGERING_PRESETS[number]['id'];

export function fingeringRegion(preset: FingeringPreset, events: MelodyEvent[], matchMode: MatchMode,
  custom: PlayingRegion): PlayingRegion {
  switch (preset) {
    case 'upper': return { center: 11, radius: 1, enabled: true };
    case 'open': return { center: 2, radius: 2, enabled: true };
    case 'compact': return { center: findBestCenter(events, 2, matchMode), radius: 2, enabled: true };
    case 'free': return { center: 0, radius: 16, enabled: false };
    case 'custom': return { ...custom, enabled: true };
  }
}
