import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Instrument, Melody } from '../music/types';
import type { TrainerState } from '../music/trainer';
import type { PitchReading } from '../music/pitch';
import { noteShape, staffNotation, staffPitch } from '../music/notation';
import { noteName } from '../music/theory';

interface Props {
  instrument?: Instrument;
  melody: Melody;
  state: TrainerState;
  index: number;
  showLabels: boolean;
  demoPlaying: boolean;
  tempo: number;
  inputReading?: PitchReading | null;
}

const PLAY_X = 136;
const BEAT_WIDTH = 96;

export default function ScrollingStaff({ instrument = 'guitar', melody, state, index, showLabels, demoPlaying, tempo, inputReading }: Props) {
  const notes = useMemo(() => staffNotation(melody, instrument), [melody, instrument]);
  const heardPitch = inputReading
    ? notes.find(item => item.event.type === 'note' && item.event.midi === inputReading.midi)?.pitch
      ?? staffPitch({ type: 'note', midi: inputReading.midi, duration: 1 }, false, instrument)
    : null;
  const clipId = useId();
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  const [demoBeat, setDemoBeat] = useState(0);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setWidth(Math.max(280, entries[0].contentRect.width)));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!demoPlaying) return;
    const startedAt = performance.now(), item = notes[index];
    setDemoBeat(item.start);
    const timer = window.setInterval(() => setDemoBeat(Math.min(item.end, item.start + (performance.now() - startedAt) * tempo / 60000)), 40);
    return () => window.clearInterval(timer);
  }, [demoPlaying, index, notes, tempo]);
  const beat = demoPlaying ? demoBeat : state.beat;
  const moving = demoPlaying || state.phase === 'playing' || state.phase === 'countin';
  const travel = moving ? !demoPlaying && state.mode === 'wait' ? 'waiting' : 'running' : '';
  return <section className="scrolling-staff" aria-label="Rullende noder">
    <div className="staff-heading"><strong>Noder</strong><span>{demoPlaying ? 'Lyt og følg med' : state.phase === 'complete' ? 'Øvelsen er færdig' : state.mode === 'wait' ? 'Spil ved linjen · noderne venter på dig' : 'Spil, når noden rammer linjen'}</span><small title={instrument === 'violin' ? 'Violinnoder skrives i den klingende oktav.' : 'Almindelige guitarnoder skrives én oktav over deres klingende tone. Tonenavnene viser den tone, du spiller.'}>{instrument === 'violin' ? 'G-nøgle · klingende oktav' : 'G-nøgle · guitaroktav'}</small></div>
    <div ref={container} className="staff-viewport">
      <svg viewBox={`0 0 ${width} 152`} preserveAspectRatio="none" role="img" aria-label={`Noder til ${melody.title}. Den gyldne linje er spillepunktet. Grønne noder er ramt. Den blå prik viser den tone, du spiller.`}>
        <defs><clipPath id={clipId}><rect x={98} y={0} width={Math.max(0, width - 98)} height={152} /></clipPath></defs>
        {[46, 56, 66, 76, 86].map(y => <line className="staff-line" key={y} x1={22} x2={width - 12} y1={y} y2={y} />)}
        <text className="staff-clef" x={25} y={88}>𝄞</text>{instrument === 'guitar' && <text className="staff-octave" x={41} y={111}>8</text>}
        <line className="staff-play-line" x1={PLAY_X} x2={PLAY_X} y1={12} y2={128} />
        <path className="staff-play-marker" d={`M${PLAY_X - 5} 6h10l-5 6z`} />
        <g clipPath={`url(#${clipId})`}>
          <g className={`staff-travel ${travel}`} style={{ transform: `translateX(${-beat * BEAT_WIDTH}px)` } as CSSProperties}>
            {notes.map((item, noteIndex) => {
              const x = PLAY_X + item.start * BEAT_WIDTH;
              const result = demoPlaying ? '' : state.results[noteIndex] ?? '';
              const shape = noteShape(item.event.duration);
              const y = (item.pitch?.y ?? 56) + 10;
              const down = y < 66, stemX = down ? -6 : 6, stemEnd = y + (down ? 32 : -32);
              return <g key={noteIndex} className={`staff-note ${result} ${noteIndex === index ? 'current' : ''}`} transform={`translate(${x},0)`}>
                <title>{`${item.event.type === 'note' ? noteName(item.event.midi, true) : 'Pause'} · ${item.event.duration.toLocaleString('da-DK', { maximumFractionDigits: 2 })} slag${result === 'correct' ? ' · ramt' : result === 'missed' ? ' · ikke ramt' : ''}`}</title>
                {item.pitch ? <>
                  {item.pitch.ledger.map(line => <line key={line} className="staff-ledger" x1={-11} x2={11} y1={line + 10} y2={line + 10} />)}
                  {item.accidental && <text className="staff-accidental" x={-18} y={y + 5}>{item.accidental}</text>}
                  <ellipse className={`staff-notehead ${shape.hollow ? 'hollow' : ''}`} cx={0} cy={y} rx={shape.whole ? 8 : 6.5} ry={4.5} transform={`rotate(-18,0,${y})`} />
                  {!shape.whole && <line className="staff-stem" x1={stemX} x2={stemX} y1={y} y2={stemEnd} />}
                  {Array.from({ length: shape.flags }, (_, flag) => <path key={flag} className="staff-flag" d={down
                    ? `M${stemX} ${stemEnd - flag * 7}q-15 -8 -8 -20q-1 10 8 12z`
                    : `M${stemX} ${stemEnd + flag * 7}q15 8 8 20q1 -10 -8 -12z`} />)}
                  {shape.dotted && <circle className="staff-dot" cx={13} cy={y % 10 === 6 ? y - 5 : y} r={1.8} />}
                  {shape.triplet && <text className="staff-tuplet" x={0} y={stemEnd + (down ? 12 : -5)}>3</text>}
                </> : shape.whole || item.event.duration >= 2 ? <rect className="staff-rest" x={-5} y={shape.whole ? 56 : 62} width={11} height={4} />
                  : item.event.duration >= 1 ? <path className="staff-rest-stroke" d="M-3 51l7 9-8 8 7 9q-13-5-8 6" />
                    : <><circle className="staff-rest" cx={-3} cy={61} r={3} /><path className="staff-rest-stroke" d="M-3 61q10 3 10-4l-7 22" /></>}
                {showLabels && item.event.type === 'note' && <text className="staff-note-label" x={0} y={145}>{noteName(item.event.midi, true)}</text>}
              </g>;
            })}
          </g>
        </g>
        {heardPitch && inputReading && <g className="staff-live-pitch" data-midi={inputReading.midi} transform={`translate(${PLAY_X},0)`}>
          <title>{`Du spiller ${noteName(inputReading.midi, true)}`}</title>
          {heardPitch.ledger.map(line => <line key={line} className="staff-ledger" x1={-12} x2={12} y1={line + 10} y2={line + 10} />)}
          {heardPitch.alter !== 0 && <text className="staff-accidental" x={-20} y={heardPitch.y + 15}>{heardPitch.alter > 0 ? '♯'.repeat(heardPitch.alter) : '♭'.repeat(-heardPitch.alter)}</text>}
          <circle className="staff-live-halo" cx={0} cy={heardPitch.y + 10} r={10} />
          <circle className="staff-live-dot" cx={0} cy={heardPitch.y + 10} r={5.5} />
        </g>}
      </svg>
    </div>
  </section>;
}
