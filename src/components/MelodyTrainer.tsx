import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { useMelodyTrainer } from '../hooks/useMelodyTrainer';
import type { useMicrophone } from '../hooks/useMicrophone';
import type { Instrument, Melody, Position } from '../music/types';
import { positionDescription } from '../music/instruments';
import { noteName } from '../music/theory';
import { signalPercent } from '../music/pitch';
import { GUITAR_CONTROLS } from '../music/guitarControls';
import { Icon } from './Icon';

interface Props {
  instrument?: Instrument;
  trainer: ReturnType<typeof useMelodyTrainer>;
  microphone: ReturnType<typeof useMicrophone>;
  melody: Melody;
  tempo: number;
  position: Position | null;
  onTempo: (tempo: number) => void;
  onStart: () => Promise<void>;
  onMicrophone: () => void;
  onSettings: () => void;
  onDemo: () => void;
  demoPlaying: boolean;
  demoIndex: number;
  metronomeOn: boolean;
  metronomePulse: number;
  onMetronome: () => void;
  guitarShortcuts: boolean;
  onGuitarShortcuts: (enabled: boolean) => void;
  showLane: boolean;
}

export default function MelodyTrainer({ instrument = 'guitar', trainer, microphone, melody, tempo, position, onTempo, onStart, onMicrophone, onSettings, onDemo, demoPlaying, demoIndex, metronomeOn, metronomePulse, onMetronome, guitarShortcuts, onGuitarShortcuts, showLane }: Props) {
  const { state, mode, timeline, started, active } = trainer;
  const isScale = melody.category === 'Skalaer';
  const laneRef = useRef<HTMLDivElement>(null);
  const index = demoPlaying ? demoIndex : trainer.index;
  useEffect(() => {
    const lane = laneRef.current;
    const token = lane?.querySelector<HTMLElement>('[aria-current="step"]');
    if (lane && token) lane.scrollLeft = Math.max(0, token.offsetLeft - token.offsetWidth - 7);
  }, [index, timeline, showLane]);
  const current = timeline[index];
  const correct = state.results.filter(result => result === 'correct').length;
  const total = timeline.filter(item => item.event.type === 'note').length;
  const missed = state.results.filter(result => result === 'missed').length;
  const waiting = active && mode === 'wait' && current?.event.type === 'note' && state.results[index] === 'pending';
  const done = state.phase === 'complete';
  const paused = state.phase === 'paused';
  const countin = state.phase === 'countin';
  const reading = microphone.sample.stable ? microphone.sample.reading : null;
  const nextIndex = timeline.findIndex((item, i) => i > index && item.event.type === 'note');
  const next = timeline[nextIndex];
  const seconds = Math.max(0, ((countin ? current.start : next?.start ?? current.end) - state.beat) * 60 / tempo);
  const progress = started ? Math.max(0, Math.min(1, state.beat / (timeline.at(-1)?.end || 1))) : 0;
  const currentCorrect = state.results[index] === 'correct';
  const firstNote = melody.events.find(event => event.type === 'note');
  const startHint = guitarShortcuts && firstNote?.type === 'note'
    ? `Spil ${noteName(firstNote.midi, true)} for at ${done ? 'øve igen' : 'starte'}. Anslaget tæller som første tone.${mode === 'rhythm' ? ' Tempoet starter med dit anslag.' : ''}` : '';
  return <section className="trainer-card" aria-label={isScale ? 'Øv skala' : 'Følg melodien'}>
    <div className="trainer-options">
      <div className="segmented training-modes" aria-label="Øvemåde">
        <button className={mode === 'wait' ? 'active' : ''} aria-pressed={mode === 'wait'} onClick={() => trainer.setMode('wait')}>Vent på korrekt tone</button>
        <button className={mode === 'rhythm' ? 'active' : ''} aria-pressed={mode === 'rhythm'} onClick={() => trainer.setMode('rhythm')}>Følg tempoet</button>
      </div>
      <div className="trainer-tempo"><button className={`metronome-toggle ${metronomeOn ? 'on' : ''}`} aria-pressed={metronomeOn} aria-label={metronomeOn ? 'Stop metronom' : 'Start metronom'} disabled={microphone.calibrating} onClick={onMetronome}><i key={metronomePulse} className={metronomeOn && metronomePulse > 0 ? 'tick' : ''} aria-hidden="true" />Metronom</button><label htmlFor="practice-speed">Hastighed <strong>{Math.round(tempo / melody.tempo * 100)} %</strong></label><input id="practice-speed" type="range" min="25" max="150" step="5" value={Math.round(tempo / melody.tempo * 100)} onChange={e => onTempo(Math.round(melody.tempo * +e.target.value / 100))} /><label><input type="number" aria-label="Tempo i slag per minut" min="20" max="240" value={tempo} onChange={e => onTempo(Math.max(20, Math.min(240, +e.target.value || 20)))} /> BPM</label></div>
    </div>
    <div className="trainer-main">
      <div className={`trainer-target ${currentCorrect || done ? 'hit' : ''}`} aria-live="polite">
        <div className="trainer-note">{done ? '✓' : countin ? Math.ceil(-state.beat) : current?.event.type === 'note' ? noteName(current.event.midi, true) : '𝄽'}</div>
        <div><p className="eyebrow">{demoPlaying ? isScale ? 'LYT TIL SKALAEN' : 'LYT TIL MELODIEN' : done ? isScale ? 'SKALAEN ER FÆRDIG' : 'MELODIEN ER FÆRDIG' : countin ? 'TÆL MED' : paused ? 'PAUSE' : currentCorrect ? '✓ KORREKT TONE' : isScale ? 'ØV SKALAEN' : 'FØLG MELODIEN'}</p>
          <h2>{done ? `${correct} af ${total} toner ramt` : countin ? 'Gør dig klar…' : current?.event.type === 'rest' ? 'Pause i melodien' : position ? positionDescription(position, instrument) : 'Se tonen på gribebrættet'}</h2>
          <p>{demoPlaying ? 'Lyt og følg markeringerne. Start øvelsen, når du selv vil spille.' : done ? missed ? `${missed} ikke ramt · prøv et langsommere tempo, eller øv med ventefunktion. ${startHint}` : `Alle toner ramt! ${startHint || 'Øv igen, når du er klar.'}` : paused ? instrument === 'violin' ? 'Fortsæt, når du er klar. Brug et nyt strøg.' : 'Fortsæt, når du er klar. Slå tonen an igen.' : waiting ? reading && reading.midi !== trainer.target ? `Du spiller ${noteName(reading.midi, true)}. Vi venter på ${noteName(trainer.target!, true)}.` : 'Øvelsen venter på dit anslag i den rigtige oktav.' : countin ? 'Første tone kommer, når nedtællingen når nul.' : active ? next?.event.type === 'note' ? `Næste tone: ${noteName(next.event.midi, true)} om ${seconds.toFixed(1)} sek.` : 'Sidste tone — lad den klinge.' : startHint || 'Spil på dit instrument. Tonerne bliver markeret, når du rammer dem.'}</p>
        </div>
      </div>
      <div className="trainer-live"><span className="live-label">{instrument === 'violin' ? 'DIN VIOLIN' : 'DIN GUITAR'}</span><strong>{reading ? noteName(reading.midi, true) : '–'}</strong><span>{microphone.sample.appSound ? 'Afventer guidetone' : reading ? `${Math.round(reading.cents) > 0 ? '+' : ''}${Math.round(reading.cents)} cent` : microphone.status === 'listening' ? 'Lytter…' : 'Lydindgang slukket'}</span><div className="live-level" role="meter" aria-label={instrument === 'violin' ? 'Violinens lydniveau' : 'Guitarens lydniveau'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(signalPercent(microphone.sample.level))}><i style={{ width: `${signalPercent(microphone.sample.level)}%` }} /></div></div>
      <div className="trainer-transport">
        {active ? <button className="learning-primary" onClick={trainer.pause}><Icon name="pause" size={15} />Pause</button> : <button className="learning-primary" disabled={microphone.calibrating || microphone.status === 'requesting'} onClick={() => void onStart()}><Icon name="play" size={15} />{paused ? 'Fortsæt' : done ? 'Øv igen' : 'Start øvelse'}</button>}
        {started && !done && <button className="learning-text-button" onClick={trainer.stop}>Stop</button>}
        <button className="learning-text-button" onClick={onDemo} disabled={microphone.calibrating}><Icon name={demoPlaying ? 'pause' : 'sound'} size={14} />{demoPlaying ? 'Stop gennemlytning' : isScale ? 'Hør skalaen' : 'Hør melodien'}</button>
      </div>
    </div>
    {showLane && <div ref={laneRef} className="trainer-lane" tabIndex={0} role="region" aria-label="Melodiens toner. Rul vandret for at se tidligere og kommende toner.">
      {timeline.map((item, eventIndex) => {
        const result = state.results[eventIndex];
        const remaining = Math.max(0, (item.start - state.beat) * 60 / tempo);
        const fill = eventIndex === index ? countin ? (state.beat + 4) / 4 : (state.beat - item.start) / (item.end - item.start)
          : eventIndex < index ? 1 : eventIndex === nextIndex ? (state.beat - current.start) / (item.start - current.start) : 0;
        return <div key={eventIndex} className={`trainer-token ${eventIndex === index ? 'now' : ''} ${result ?? ''}`} aria-current={eventIndex === index ? 'step' : undefined}>
          <span>{item.event.type === 'note' ? noteName(item.event.midi, true) : 'Pause'}</span><small>{result === 'correct' ? '✓ Ramt' : result === 'missed' ? 'Ikke ramt' : eventIndex === index ? countin ? `${remaining.toFixed(1)} sek.` : waiting ? 'Spil nu · vi venter' : 'Nu' : !started || mode === 'wait' && waiting ? `${item.event.duration.toLocaleString('da-DK', { maximumFractionDigits: 2 })} slag` : `om ${remaining.toFixed(1)} sek.`}</small>
          <i style={{ '--token-progress': `${Math.max(0, Math.min(1, fill)) * 100}%` } as CSSProperties} />
        </div>;
      })}
    </div>}
    <div className="trainer-bottom"><div className="song-progress" role="progressbar" aria-label="Fremdrift i melodien" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><i style={{ width: `${progress * 100}%` }} /></div><span>{correct} / {total} ramt{missed > 0 ? ` · ${missed} ikke ramt` : ''}</span><button className="learning-text-button" onClick={onMicrophone}>{microphone.status === 'listening' ? 'Sluk lydindgang' : 'Tænd lydindgang'}</button><button className="learning-text-button" onClick={onSettings}>Lydvalg og kalibrering</button></div>
    <div className={`guitar-shortcuts ${guitarShortcuts ? 'enabled' : ''}`}>
      <label className="switch-control"><input type="checkbox" checked={guitarShortcuts} onChange={e => onGuitarShortcuts(e.target.checked)} /><span className="switch" /><span>{instrument === 'violin' ? 'Start med første tone' : 'Guitargenveje'}</span></label>
      {instrument === 'guitar' && <div className="guitar-shortcut-notes">{GUITAR_CONTROLS.map(control => <span key={control.midi} className={guitarShortcuts && reading?.midi === control.midi ? 'heard' : ''} title={`Tynd E-streng · bånd ${control.fret}`}><b>{control.note}</b>{control.command === 'start' ? 'Start / øv igen' : control.command === 'pause' ? 'Pause / fortsæt' : 'Stop'}</span>)}</div>}
      <small>{microphone.status !== 'listening' ? 'Tænd lydindgangen først.' : instrument === 'violin' ? 'Gentagne toner: brug et tydeligt nyt strøg eller et kort ophold.' : 'Tynd E · bånd 17 / 18 / 19 · hold ca. ½ sek. og dæmp mellem genveje.'}</small>
    </div>
    {microphone.error && <p className="inline-notice" role="alert">{microphone.error}</p>}
  </section>;
}
