import { FRETBOARD, findPositions, isInRegion, regionBounds } from './theory';
import type { MelodyEvent, OptimizationOptions, PathStep, PlayingRegion, Position, MatchMode } from './types';

/** Transparent preferences, not a model of individual fingers or an ideal fingering. */
export function positionCost(position: Position, wantedMidi: number, options: OptimizationOptions): number {
  const [low, high] = regionBounds(options);
  const outside = Math.max(low - position.fret, 0, position.fret - high);
  return (options.enabled === false ? 0 : Math.abs(position.fret - options.center) * .35)
    + (outside > 0 ? 10 + outside * 5 : 0)
    + Math.abs(position.midi - wantedMidi) / 12 * 12;
}

export function movementCost(from: Position, to: Position): number {
  const frets = Math.abs(to.fret - from.fret);
  return frets * 1.4 + Math.abs(to.string - from.string) * .9 + Math.max(0, frets - 3) * 2.5;
}

/** Dynamic programming over the complete ordered melody. Rests retain continuity;
 * an unavailable pitch is explicitly left empty and starts a new playable segment. */
export function optimizeMelody(events: MelodyEvent[], options: OptimizationOptions, board: readonly Position[] = FRETBOARD): PathStep[] {
  const result: PathStep[] = events.map((_, eventIndex) => ({ eventIndex, position: null, substituted: false }));
  let layers: { index: number; candidates: Position[]; costs: number[]; parents: number[] }[] = [];

  const finishSegment = () => {
    if (!layers.length) return;
    const last = layers[layers.length - 1];
    let choice = last.costs.indexOf(Math.min(...last.costs));
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const position = layer.candidates[choice];
      const event = events[layer.index];
      result[layer.index] = {
        eventIndex: layer.index, position,
        substituted: event.type === 'note' && position.midi !== event.midi,
      };
      choice = layer.parents[choice];
    }
    layers = [];
  };

  events.forEach((event, index) => {
    if (event.type === 'rest') return;
    const candidates = findPositions(event.midi, options.matchMode, board);
    if (!candidates.length) { finishSegment(); return; }
    const previous = layers.at(-1);
    const parents: number[] = [];
    const costs = candidates.map(candidate => {
      let best = 0;
      let parent = -1;
      if (previous) {
        best = Infinity;
        previous.candidates.forEach((from, i) => {
          const cost = previous.costs[i] + movementCost(from, candidate);
          if (cost < best) { best = cost; parent = i; }
        });
      }
      parents.push(parent);
      return best + positionCost(candidate, event.midi, options);
    });
    layers.push({ index, candidates, costs, parents });
  });
  finishSegment();
  return result;
}

export function analyzeMelody(events: MelodyEvent[], region: PlayingRegion, mode: MatchMode, board: readonly Position[] = FRETBOARD) {
  // Keep exact MIDI pitches as keys even when octave substitutions are allowed.
  const pitches = [...new Set(events.flatMap(e => e.type === 'note' ? [e.midi] : []))].sort((a, b) => a - b);
  const inRange = pitches.filter(midi => findPositions(midi, mode, board).some(p => isInRegion(p, region)));
  return {
    pitches, inRange,
    outside: pitches.filter(midi => !inRange.includes(midi)),
    exactInRange: pitches.filter(midi => findPositions(midi, 'exact', board).some(p => isInRegion(p, region))),
    lowest: pitches.at(0), highest: pitches.at(-1),
  };
}

export function findBestCenter(events: MelodyEvent[], radius: number, matchMode: MatchMode) {
  let best = { center: 0, cost: Infinity };
  for (let center = 0; center <= 16; center++) {
    const options = { center, radius, matchMode };
    const path = optimizeMelody(events, options);
    let previous: Position | null = null;
    let cost = 0;
    path.forEach((step, i) => {
      const event = events[i];
      if (event.type === 'rest') return;
      if (!step.position) { cost += 10000; previous = null; return; }
      cost += positionCost(step.position, event.midi, options);
      if (previous) cost += movementCost(previous, step.position);
      previous = step.position;
    });
    if (cost < best.cost) best = { center, cost };
  }
  return best.center;
}
