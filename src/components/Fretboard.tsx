import type { CSSProperties, KeyboardEvent } from 'react';
import { FRETBOARD, MAX_FRET, NATURALS, NOTE_NAMES, STANDARD_TUNING, isInRegion, noteName, pitchClass, pitchColor, regionBounds, samePosition } from '../music/theory';
import type { MatchMode, PlayingRegion, Position } from '../music/types';
import { fretboardLayout } from '../music/fretboardLayout';
import type { FretSpacing } from '../music/fretboardLayout';
import type { NoteRepetitions } from '../music/repetitions';
import RepetitionSpokes from './RepetitionSpokes';
import type { PitchReading } from '../music/pitch';

interface Props {
  region: PlayingRegion;
  colorMode: 'none' | 'piano' | 'gradient';
  fretSpacing: FretSpacing;
  showLabels: boolean;
  melodyOnly: boolean;
  melodyPitches: number[];
  matchMode: MatchMode;
  patternPitches: number[] | null;
  selectedPitch: number | null;
  currentMidi: number | null;
  heardMidi: number | null;
  inputLevel: number;
  inputGate: number;
  inputReading?: PitchReading | null;
  targetMidi: number | null;
  currentPosition: Position | null;
  noteFlight?: { id: number; from: Position; to: Position } | null;
  repetitions?: NoteRepetitions | null;
  upcoming: Position[];
  recommended: Position[];
  sequence: boolean;
  onCenterChange: (center: number) => void;
  onSelect: (position: Position) => void;
}

export default function Fretboard(props: Props) {
  const { region, colorMode, fretSpacing, showLabels, melodyOnly, melodyPitches, matchMode, patternPitches,
    selectedPitch, currentMidi, heardMidi, inputLevel, inputGate, targetMidi, currentPosition, noteFlight, repetitions, upcoming, recommended, sequence, onCenterChange, onSelect } = props;
  const [low, high] = regionBounds(region);
  const activePitches = new Set(melodyPitches);
  const activeClasses = new Set(melodyPitches.map(pitchClass));
  const cells = fretboardLayout(fretSpacing);
  const showAllNotes = colorMode !== 'none';
  const columns = cells.map(cell => `${cell.width}fr`).join(' ');
  // Use level above the input's noise threshold so quiet microphones and
  // direct guitar inputs both produce a visible response to stronger plucks.
  const volume = inputLevel > 0
    ? Math.max(0, Math.min(1, 20 * Math.log10(inputLevel / Math.max(inputGate, .000005)) / 36)) : 0;

  function navigate(event: KeyboardEvent<HTMLButtonElement>, p: Position) {
    const offset = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[event.key];
    if (!offset) return;
    event.preventDefault();
    const string = Math.min(6, Math.max(1, p.string + offset[0]));
    const fret = Math.min(MAX_FRET, Math.max(0, p.fret + offset[1]));
    document.getElementById(`note-${string}-${fret}`)?.focus();
  }

  return <div className="fretboard-scroll" tabIndex={0} role="region" aria-label="Gribebræt. Rul vandret for at se alle bånd. Brug piletaster mellem tonerne.">
    <div className={`fretboard ${fretSpacing}`} style={{ '--fret-columns': columns } as CSSProperties}>
      <div className="fret-numbers">
        <span className="fret-label">BÅND</span>
        {Array.from({ length: MAX_FRET + 1 }, (_, fret) => <button key={fret}
          className={`fret-number ${region.enabled !== false && fret === region.center ? 'is-center' : ''} ${region.enabled !== false && fret >= low && fret <= high ? 'in-window' : ''}`}
          aria-label={`Bånd ${fret}${fret === 0 ? ', åben streng' : ''}${region.enabled !== false ? ', vælg som centrum' : ''}`}
          disabled={region.enabled === false} aria-pressed={region.enabled !== false && fret === region.center} onClick={() => onCenterChange(fret)}>{fret === 0 ? '0' : fret}</button>)}
      </div>
      <div className="neck">
        {noteFlight && <i key={noteFlight.id} className="note-flight" aria-hidden="true" style={{
          '--flight-from-x': `${cells[noteFlight.from.fret].center * 100}%`,
          '--flight-from-y': `${(noteFlight.from.string - .5) / 6 * 100}%`,
          '--flight-to-x': `${cells[noteFlight.to.fret].center * 100}%`,
          '--flight-to-y': `${(noteFlight.to.string - .5) / 6 * 100}%`,
          '--flight-mid-x': `${(cells[noteFlight.from.fret].center + cells[noteFlight.to.fret].center) / 2 * 100}%`,
          '--flight-mid-y': `${(noteFlight.from.string + noteFlight.to.string - 1) / 12 * 100}%`,
        } as CSSProperties} />}
        {region.enabled !== false && <div className="position-window" style={{ left: `${cells[low].left * 100}%`, width: `${(cells[high].left + cells[high].width - cells[low].left) * 100}%` }} />}
        <div className="inlays" aria-hidden="true">
          {[3, 5, 7, 9, 12, 15].map(fret => <div className={`inlay ${fret === 12 ? 'double' : ''}`} key={fret} style={{ left: `${cells[fret].center * 100}%` }}><i />{fret === 12 && <i />}</div>)}
        </div>
        {STANDARD_TUNING.map((openMidi, index) => <div className="string-row" key={index} style={{ '--string-size': `${.8 + index * .35}px` } as CSSProperties}>
          <div className="string-label"><strong>{noteName(openMidi)}</strong><span>{index + 1}</span></div>
          {FRETBOARD.filter(p => p.string === index + 1).map(position => {
            const pc = pitchClass(position.midi);
            const isMelody = matchMode === 'exact' ? activePitches.has(position.midi) : activeClasses.has(pc);
            const currentMatch = sequence && currentMidi !== null && (matchMode === 'exact' ? position.midi === currentMidi : pc === pitchClass(currentMidi));
            const current = sequence && samePosition(position, currentPosition);
            const next = sequence ? upcoming.findIndex(p => samePosition(p, position)) : -1;
            const selected = selectedPitch === pc;
            const pattern = patternPitches === null || patternPitches.includes(pc);
            const inRegion = isInRegion(position, region);
            const preferred = !sequence && recommended.some(p => samePosition(p, position));
            const heard = position.midi === heardMidi;
            const target = position.midi === targetMidi;
            const repetitionLabel = current && repetitions ? `, ${repetitions.remaining} anslag tilbage på tonen` : '';
            const visible = showAllNotes || current || currentMatch || next >= 0 || preferred || selected || heard || target;
            const dim = (melodyOnly && !isMelody) || !pattern;
            const classes = [visible ? 'note' : 'note-hit-area', NATURALS.has(pc) ? 'natural' : 'accidental', colorMode,
              !inRegion && 'outside', dim && 'filtered', current && 'current', currentMatch && !current && 'alternative',
              selected && 'selected', preferred && 'preferred', next >= 0 && !current && 'upcoming',
              heard && 'heard', target && 'practice-target'].filter(Boolean).join(' ');
            return <div key={position.fret} className={`fret-cell ${position.fret === 0 ? 'open-string' : ''}`}>
              {heard && inputLevel > 0 && <i className="played-string" aria-hidden="true"
                style={{ '--played-string-width': `${2 + 8 * volume}px` } as CSSProperties} />}
              <button id={`note-${position.string}-${position.fret}`} className={classes}
                style={{ '--pitch-color': pitchColor(position.midi) } as CSSProperties}
                aria-label={`${noteName(position.midi, true)}, streng ${position.string}, ${position.fret === 0 ? 'åben streng' : `bånd ${position.fret}`}${current ? ', anbefalet position' : ''}${repetitionLabel}`}
                aria-pressed={selected}
                title={`${noteName(position.midi, true)} · streng ${position.string} · bånd ${position.fret}${repetitionLabel}`}
                onKeyDown={event => navigate(event, position)} onClick={() => onSelect(position)}>
                {visible && <span aria-hidden="true">{showLabels ? NOTE_NAMES[pc] : ''}</span>}
                {current && repetitions && <RepetitionSpokes key={repetitions.start} repetitions={repetitions} />}
                {visible && next >= 0 && !current && <sup aria-hidden="true">{next + 1}</sup>}
              </button>
            </div>;
          })}
        </div>)}
        {sequence && currentPosition && upcoming.length > 0 && <svg className="path-overlay" viewBox="0 0 1700 600" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={[currentPosition, ...upcoming].map(p => `${cells[p.fret].center * 1700},${(p.string - .5) * 100}`).join(' ')} />
        </svg>}
      </div>
      <div className="fret-bottom"><span>ÅBEN</span><span>Høj E øverst · lav E nederst</span></div>
    </div>
  </div>;
}
