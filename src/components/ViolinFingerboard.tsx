import type { CSSProperties, KeyboardEvent } from 'react';
import type Fretboard from './Fretboard';
import { VIOLIN_TUNING, VIOLIN_FINGERBOARD, VIOLIN_FINGERS, violinLocation, positionDescription } from '../music/instruments';
import { NATURALS, NOTE_NAMES, noteName, pitchClass, pitchColor, samePosition } from '../music/theory';
import type { Position } from '../music/types';
import RepetitionSpokes from './RepetitionSpokes';
import { violinFingerEstimate } from '../music/intonation';

export default function ViolinFingerboard(props: Parameters<typeof Fretboard>[0]) {
  const { colorMode, showLabels, currentMidi, currentPosition, inputReading, inputLevel, inputGate, selectedPitch,
    targetMidi, upcoming, sequence, repetitions, noteFlight, onSelect, matchMode, recommended,
    melodyOnly, melodyPitches, patternPitches } = props;
  const volume = inputLevel > 0 ? Math.max(0, Math.min(1, 20 * Math.log10(inputLevel / Math.max(inputGate, .000005)) / 36)) : 0;
  const estimate = violinFingerEstimate(inputReading ?? null, currentPosition);
  const centLabel = estimate ? `${estimate.cents > 0 ? '+' : ''}${Math.round(estimate.cents)} cent` : '';
  const correction = !estimate ? 'Spil en tone for at se den beregnede placering.'
    : !estimate.inRange ? estimate.semitones < 0 ? 'Tonen er under den foreslåede strengs åbne tone.' : 'Tonen ligger over den viste første position.'
      : currentPosition?.fret === 0 ? `${centLabel} · åben streng — brug stemmeværktøjet ved afvigelser`
        : Math.abs(estimate.cents) <= 10 ? `${centLabel} · tonen er ren`
          : estimate.cents < 0 ? `${centLabel} · for lav — flyt mod stolen →` : `${centLabel} · for høj — ← flyt mod sneglen`;
  const x = (position: Position) => `${violinLocation(position.fret) * 100}%`;
  const y = (position: Position) => `${(position.string - .5) / 4 * 100}%`;
  function navigate(event: KeyboardEvent<HTMLButtonElement>, position: Position) {
    const offset = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[event.key];
    if (!offset) return;
    event.preventDefault();
    document.getElementById(`violin-note-${Math.max(1, Math.min(4, position.string + offset[0]))}-${Math.max(0, Math.min(7, position.fret + offset[1]))}`)?.focus();
  }
  return <div className="violin-fingerboard-scroll" tabIndex={0} role="region" aria-label="Violinens båndløse gribebræt i første position. Brug piletaster mellem tonerne.">
    <div className="violin-fingerboard">
      <div className="violin-finger-labels"><span>FINGER</span><div>{VIOLIN_FINGERS.map((finger, offset) => <span key={offset} style={{ left: `${violinLocation(offset) * 100}%` }}>{finger}</span>)}</div></div>
      <div className="violin-neck">
        <i className="violin-nut" aria-hidden="true" />
        {estimate && <div className={`violin-live-position ${estimate.inRange ? '' : 'outside-position'}`}
          role="img" aria-label={`Beregnet placering på ${noteName(VIOLIN_TUNING[estimate.string - 1])}-strengen, ${centLabel} fra måltonen`}
          title="Placeringen er beregnet ud fra tonen på øvelsens foreslåede streng og forudsætter, at strengen er stemt."
          style={{ left: `${estimate.x * 100}%`, top: `${(estimate.string - .5) / 4 * 100}%` }}>
          <i className="played-string" aria-hidden="true" style={{ '--played-string-width': `${2 + 8 * volume}px` } as CSSProperties} /><b />
        </div>}
        {noteFlight && <i key={noteFlight.id} className="note-flight" aria-hidden="true" style={{
          '--flight-from-x': x(noteFlight.from), '--flight-to-x': x(noteFlight.to),
          '--flight-from-y': y(noteFlight.from), '--flight-to-y': y(noteFlight.to),
          '--flight-mid-x': `${(violinLocation(noteFlight.from.fret) + violinLocation(noteFlight.to.fret)) * 50}%`,
          '--flight-mid-y': `${(noteFlight.from.string + noteFlight.to.string - 1) / 8 * 100}%`,
        } as CSSProperties} />}
        {VIOLIN_TUNING.map((openMidi, row) => <div className="violin-string" key={openMidi} style={{ '--string-size': `${.8 + row * .5}px` } as CSSProperties}>
          <div className="violin-string-label"><strong>{noteName(openMidi)}</strong><span>{row + 1}</span></div>
          {VIOLIN_FINGERBOARD.filter(position => position.string === row + 1).map(position => {
            const pc = pitchClass(position.midi);
            const current = sequence && samePosition(position, currentPosition);
            const alternate = sequence && !current && currentMidi !== null && (matchMode === 'exact' ? currentMidi === position.midi : pitchClass(currentMidi) === pc);
            const next = sequence ? upcoming.findIndex(item => samePosition(item, position)) : -1;
            const target = targetMidi === position.midi;
            const preferred = !sequence && recommended.some(item => samePosition(item, position));
            const selected = selectedPitch === pc;
            const isMelody = melodyPitches.some(midi => matchMode === 'exact' ? midi === position.midi : pitchClass(midi) === pc);
            const dim = melodyOnly && !isMelody || patternPitches !== null && !patternPitches.includes(pc);
            const visible = colorMode !== 'none' || current || alternate || next >= 0 || target || selected || preferred;
            const classes = [visible ? 'note' : 'note-hit-area', NATURALS.has(pc) ? 'natural' : 'accidental', colorMode,
              current && 'current', alternate && 'alternative', !current && next >= 0 && 'upcoming', target && 'practice-target', selected && 'selected', preferred && 'preferred', dim && 'filtered'].filter(Boolean).join(' ');
            return <div className="violin-stop" key={position.fret} style={{ left: x(position) }}>
              <button id={`violin-note-${position.string}-${position.fret}`} className={classes} style={{ '--pitch-color': pitchColor(position.midi) } as CSSProperties}
                aria-label={`${noteName(position.midi, true)}, ${positionDescription(position, 'violin')}${current ? ', anbefalet placering' : ''}${current && repetitions ? `, ${repetitions.remaining} anslag tilbage på tonen` : ''}`}
                aria-pressed={selected} title={`${noteName(position.midi, true)} · ${positionDescription(position, 'violin')}`}
                onKeyDown={event => navigate(event, position)} onClick={() => onSelect(position)}>
                {visible && <span aria-hidden="true">{showLabels ? NOTE_NAMES[pc] : ''}</span>}
                {current && repetitions && <RepetitionSpokes key={repetitions.start} repetitions={repetitions} />}
                {visible && next >= 0 && !current && <sup aria-hidden="true">{next + 1}</sup>}
              </button>
            </div>;
          })}
        </div>)}
        {sequence && currentPosition && upcoming.length > 0 && <svg className="path-overlay" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true"><polyline points={[currentPosition, ...upcoming].map(position => `${violinLocation(position.fret) * 1000},${(position.string - .5) * 100}`).join(' ')} /></svg>}
      </div>
      <div className="violin-board-footer violin-position-feedback"><span title="Lyden kan ikke afgøre, hvilken streng du bruger. Den blå markør følger derfor øvelsens foreslåede streng.">Blå: beregnet på foreslået streng</span><output>{correction}</output></div>
    </div>
  </div>;
}
