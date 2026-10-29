import { useEffect, useRef } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { FRETBOARD, NATURALS, noteName, octave, pitchClass } from '../music/theory';

const KEYS = Array.from({ length: 49 }, (_, i) => 36 + i); // C2–C6, including the guitar's full range.
const WHITE_KEYS = KEYS.filter(midi => NATURALS.has(pitchClass(midi)));
const BLACK_KEYS = KEYS.filter(midi => !NATURALS.has(pitchClass(midi)));
const GUITAR_PITCHES = new Set(FRETBOARD.map(p => p.midi));

interface Props {
  currentMidi: number | null;
  heardMidi: number | null;
  currentLabel?: string;
  selectedMidi: number | null;
  selectedPitch: number | null;
  melodyPitches: number[];
  upcoming: number[];
  showLabels: boolean;
  onSelect: (midi: number) => void;
}

export default function Piano({ currentMidi, heardMidi, currentLabel = 'Meloditone', selectedMidi, selectedPitch, melodyPitches, upcoming, showLabels, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const midi = heardMidi ?? selectedMidi ?? currentMidi;
    const container = scrollRef.current;
    if (midi === null || !container) return;
    const key = container.querySelector<HTMLElement>(`[data-midi="${midi}"]`);
    if (key) container.scrollLeft = key.offsetLeft - (container.clientWidth - key.clientWidth) / 2;
  }, [selectedMidi, currentMidi, heardMidi]);

  function navigate(event: KeyboardEvent<HTMLButtonElement>, midi: number) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = midi + (event.key === 'ArrowRight' ? 1 : -1);
    scrollRef.current?.querySelector<HTMLButtonElement>(`[data-midi="${next}"]:not(:disabled)`)?.focus();
  }

  function renderKey(midi: number, black: boolean) {
    const current = currentMidi === midi;
    const selected = selectedMidi === midi;
    const sameClass = selectedPitch === pitchClass(midi);
    const playable = GUITAR_PITCHES.has(midi);
    const melody = melodyPitches.includes(midi);
    const next = upcoming.includes(midi);
    const style: CSSProperties | undefined = black ? {
      left: `${(WHITE_KEYS.filter(white => white < midi).length / WHITE_KEYS.length) * 100}%`,
      width: `${62 / WHITE_KEYS.length}%`,
    } : undefined;

    return <button key={midi} data-midi={midi}
      className={['piano-key', black ? 'black-key' : 'white-key', melody && 'melody-key',
        sameClass && 'pitch-class-key', next && 'upcoming-key', selected && 'selected-key', current && 'current-key', heardMidi === midi && 'heard-key'].filter(Boolean).join(' ')}
      style={style} disabled={!playable} aria-pressed={selected || current || heardMidi === midi}
      aria-label={`${noteName(midi, true)}${current ? `, ${currentLabel.toLowerCase()}` : ''}${heardMidi === midi ? ', registreret fra guitaren' : ''}${selected ? ', valgt på gribebrættet' : ''}${!playable ? ', uden for guitarens toneomfang' : ''}`}
      title={`${noteName(midi, true)}${!playable ? ' · uden for guitarens toneomfang' : ''}`}
      onKeyDown={event => navigate(event, midi)} onClick={() => onSelect(midi)}>
      {(melody || current || selected || next || heardMidi === midi) && <i className="piano-key-dot" aria-hidden="true" />}
      {showLabels && <span className="piano-key-label">{noteName(midi)}<small>{octave(midi)}</small></span>}
    </button>;
  }

  return <section className="piano-section" aria-label="Klaviatur synkroniseret med gribebrættet">
    <div className="piano-heading"><div><h2>Samme tone. På tangenter.</h2><p>Klik på guitaren eller klaveret for at finde forbindelsen.</p></div>
      <div className="legend"><span><i className="legend-current" />{currentLabel}</span><span><i className="legend-heard" />Din guitar</span><span><i className="legend-selected" />Valgt tone</span><span><i className="legend-preferred" />Bruges i melodien</span></div>
    </div>
    <div className="piano-scroll" ref={scrollRef} tabIndex={0} role="region" aria-label="Klavertangenter fra C2 til C6. Rul vandret på små skærme.">
      <div className="piano-keys">
        <div className="white-keys">{WHITE_KEYS.map(midi => renderKey(midi, false))}</div>
        {BLACK_KEYS.map(midi => renderKey(midi, true))}
      </div>
    </div>
    <div className="piano-caption"><span>Præcis samme tonehøjde og oktav som på guitaren</span><strong aria-live="polite">{heardMidi !== null ? `Du spiller: ${noteName(heardMidi, true)}` : selectedMidi !== null ? `Valgt: ${noteName(selectedMidi, true)}` : currentMidi !== null ? `${currentLabel}: ${noteName(currentMidi, true)}` : 'Vælg en tone, eller følg melodien'}</strong></div>
  </section>;
}
