import { useEffect, useMemo, useRef, useState } from 'react';
import { MELODIES } from './music/melodies';
import { analyzeMelody, findBestCenter, optimizeMelody } from './music/optimizer';
import { FINGERING_PRESETS, fingeringRegion } from './music/fingering';
import type { FingeringPreset } from './music/fingering';
import { MAJOR_SCALE, MINOR_SCALE, findPositions, isInRegion, noteName, pitchClass, regionBounds } from './music/theory';
import { playTone, prepareAudio } from './music/audio';
import type { Instrument, MatchMode, Position } from './music/types';
import type { FretSpacing } from './music/fretboardLayout';
import Fretboard from './components/Fretboard';
import Piano from './components/Piano';
import LearningPanel from './components/LearningPanel';
import MelodyTrainer from './components/MelodyTrainer';
import { useMicrophone } from './hooks/useMicrophone';
import { usePractice } from './hooks/usePractice';
import { useMelodyTrainer } from './hooks/useMelodyTrainer';
import { useMetronome } from './hooks/useMetronome';
import { useGuitarControls } from './hooks/useGuitarControls';
import { isGuitarControl } from './music/guitarControls';
import { noteRepetitions } from './music/repetitions';
import { createScale, SCALE_ROOTS, SCALE_TYPES } from './music/scales';
import type { ScaleOptions, ScaleType, ScaleDirection } from './music/scales';
import ScrollingStaff from './components/ScrollingStaff';
import ViolinFingerboard from './components/ViolinFingerboard';
import { instrumentPositions, melodyForInstrument, positionDescription } from './music/instruments';
import { Icon } from './components/Icon';
import Tuner from './components/Tuner';

export default function App() {
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  const [melodyId, setMelodyId] = useState('twinkle');
  const [exerciseKind, setExerciseKind] = useState<'melody' | 'scale'>('melody');
  const [scale, setScale] = useState<ScaleOptions>({ type: 'minor-pentatonic', tonic: 9, direction: 'both' });
  const [workspace, setWorkspace] = useState<'practice' | 'explore'>('practice');
  const [center, setCenter] = useState(11);
  const [radius, setRadius] = useState(1);
  const [fingering, setFingering] = useState<FingeringPreset>('upper');
  const [matchMode, setMatchMode] = useState<MatchMode>('exact');
  const [colorMode, setColorMode] = useState<'none' | 'piano' | 'gradient'>('none');
  const [fretSpacing, setFretSpacing] = useState<FretSpacing>('realistic');
  const [showLabels, setShowLabels] = useState(true);
  const [showPiano, setShowPiano] = useState(false);
  const [showStaff, setShowStaff] = useState(true);
  const [melodyOnly, setMelodyOnly] = useState(false);
  const [pattern, setPattern] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState<number | null>(null);
  const [inspected, setInspected] = useState<Position | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const [tempo, setTempo] = useState(MELODIES.find(m => m.id === 'twinkle')!.tempo);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tunerOpen, setTunerOpen] = useState(false);
  const tunerRef = useRef<HTMLDialogElement>(null);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [guitarShortcuts, setGuitarShortcuts] = useState(true);
  const settingsRef = useRef<HTMLDialogElement>(null);
  const scaleExercise = useMemo(() => createScale(scale), [scale]);
  const originalMelody = exerciseKind === 'scale' ? scaleExercise : MELODIES.find(m => m.id === melodyId)!;
  const { melody, octaveShift } = useMemo(() => melodyForInstrument(originalMelody, instrument), [originalMelody, instrument]);
  const board = instrumentPositions(instrument);
  const InstrumentBoard = instrument === 'violin' ? ViolinFingerboard : Fretboard;
  // Training always shows the same octave that its scoring expects.
  const boardMatch = instrument === 'violin' || workspace === 'practice' ? 'exact' : matchMode;
  const region = useMemo(() => instrument === 'violin' ? { center: 3.5, radius: 3.5, enabled: true }
    : fingeringRegion(fingering, melody.events, boardMatch, { center, radius }),
    [instrument, fingering, melody, boardMatch, center, radius]);
  const useHandPosition = instrument === 'guitar' && region.enabled !== false;
  const fingeringDescription = FINGERING_PRESETS.find(preset => preset.id === fingering)!.description;
  const options = useMemo(() => ({ ...region, matchMode: boardMatch }), [region, boardMatch]);
  const path = useMemo(() => optimizeMelody(melody.events, options, board), [melody, options, board]);
  const analysis = useMemo(() => analyzeMelody(melody.events, region, boardMatch, board), [melody, region, boardMatch, board]);
  const microphone = useMicrophone(instrument);
  const practicePool = useMemo(() => analysis.pitches.filter(midi => board.some(p => p.midi === midi)), [analysis.pitches, board]);
  const practice = usePractice(melody.events, practicePool, microphone.sample, `${instrument}:${melody.id}:${fingering}:${region.center}:${region.radius}`);
  const trainerSample = useMemo(() => instrument === 'guitar' && guitarShortcuts && workspace === 'practice' && microphone.sample.reading
    && isGuitarControl(microphone.sample.reading.midi)
    ? { ...microphone.sample, reading: null, stable: false } : microphone.sample, [instrument, guitarShortcuts, workspace, microphone.sample]);
  const guitarControlsEnabled = guitarShortcuts && workspace === 'practice' && microphone.status === 'listening'
    && !settingsOpen && !tunerOpen && !microphone.calibrating && !playing && practice.state.phase === 'idle';
  const trainer = useMelodyTrainer(melody.events, trainerSample, tempo, guitarControlsEnabled);
  useGuitarControls(microphone.sample, instrument === 'guitar' && guitarControlsEnabled, command => {
    if (command === 'start' && !trainer.active) void startTrainer();
    if (command === 'pause') {
      if (trainer.active) trainer.pause();
      else if (trainer.state.phase === 'paused') void startTrainer();
    }
    if (command === 'stop') { trainer.stop(); setMetronomeOn(false); }
  });
  const metronomePulse = useMetronome(metronomeOn && !settingsOpen && !tunerOpen && !microphone.calibrating, tempo, trainer.state);
  const heardMidi = microphone.sample.stable ? microphone.sample.reading?.midi ?? null : null;
  const trainingView = workspace === 'practice' && !playing;
  const eventIndex = trainingView ? trainer.index : step;
  const event = melody.events[eventIndex];
  const currentPosition = path[eventIndex]?.position ?? null;
  const repetitions = trainingView && !practice.active && trainer.state.phase !== 'complete'
    ? noteRepetitions(melody.events, eventIndex, trainer.state.results) : null;
  const lastHit = trainer.state.lastHit;
  const flightFrom = lastHit ? path[lastHit.index]?.position : null;
  const flightTo = lastHit ? path.slice(lastHit.index + 1).find(item => item.position)?.position : null;
  const noteFlight = trainingView && !practice.active && lastHit && flightFrom
    ? { id: lastHit.at, from: flightFrom, to: flightTo ?? flightFrom } : null;
  const upcoming = path.slice(eventIndex + 1).flatMap(item => item.position ? [item.position] : []).slice(0, 3);
  const [low, high] = regionBounds(region);
  const outsideSuggestions = path.filter(item => item.position && !isInRegion(item.position, region)).length;
  const patternPitches = useMemo(() => !pattern ? null : exerciseKind === 'scale' ? analysis.pitches.map(pitchClass)
    : (melody.key.intervals ?? (melody.key.mode === 'major' ? MAJOR_SCALE : MINOR_SCALE)).map(interval => (melody.key.tonic + interval) % 12), [pattern, melody, exerciseKind, analysis.pitches]);

  async function enableAudio() {
    try { await prepareAudio(); setAudioError(false); return true; }
    catch { setAudioError(true); return false; }
  }
  async function selectPosition(position: Position) {
    practice.answerClick(position.midi); setSelectedPitch(pitchClass(position.midi)); setInspected(position);
    if (sound && !microphone.calibrating && !trainer.started && await enableAudio()) playTone(position.midi);
  }
  async function toggleMetronome() {
    if (metronomeOn) { setMetronomeOn(false); return; }
    if (await enableAudio()) setMetronomeOn(true);
  }
  function inspectPiano(midi: number) {
    const positions = findPositions(midi, 'exact', board).sort((a, b) => Number(isInRegion(b, region)) - Number(isInRegion(a, region)) || a.fret - b.fret);
    if (positions[0]) void selectPosition(positions[0]);
  }
  function changeMelody(id: string) {
    trainer.stop(); practice.stop(); setPlaying(false); setMelodyId(id); setStep(0); setInspected(null); setSelectedPitch(null); setTempo(MELODIES.find(m => m.id === id)!.tempo);
  }
  function changeExercise(kind: typeof exerciseKind, options = scale) {
    trainer.stop(); practice.stop(); setPlaying(false); setStep(0); setInspected(null); setSelectedPitch(null);
    setExerciseKind(kind); setScale(options);
    if (kind !== exerciseKind) setTempo(kind === 'scale' ? 80 : MELODIES.find(m => m.id === melodyId)!.tempo);
  }
  function changeInstrument(value: Instrument) {
    trainer.stop(); practice.stop(); setPlaying(false); setMetronomeOn(false); setStep(0);
    microphone.cancelCalibration(); microphone.resetCalibration();
    setTunerOpen(false); setInspected(null); setSelectedPitch(null); setInstrument(value);
  }
  function changeWorkspace(value: typeof workspace) {
    setMetronomeOn(false);
    trainer.stop(); practice.stop(); setPlaying(false); setWorkspace(value); setInspected(null); setSelectedPitch(null);
  }
  function changeFingering(value: FingeringPreset) {
    trainer.pause(); practice.stop(); setPlaying(false);
    setInspected(null); setSelectedPitch(null); setFingering(value);
  }
  function changeCenter(value: number) {
    changeFingering('custom'); setCenter(value); setRadius(region.radius);
  }
  async function startMicrophone() {
    if (microphone.status === 'listening') return true;
    return microphone.start();
  }
  function stopMicrophone() { trainer.pause(); microphone.stop(); if (practice.input === 'microphone') practice.stop(); }
  async function startTrainer() {
    if (microphone.calibrating) return;
    setPlaying(false); practice.stop(); setInspected(null); setSelectedPitch(null);
    if (!await startMicrophone()) { setSettingsOpen(true); return; }
    if (trainer.state.phase === 'paused') trainer.resume(); else trainer.start();
  }
  async function startPractice() {
    if (microphone.calibrating) return;
    setMetronomeOn(false);
    trainer.stop(); setPlaying(false);
    if (practice.input === 'microphone' && !await startMicrophone()) return;
    setSettingsOpen(false);
    practice.start();
  }
  async function playReference(midi: number) { if (!microphone.calibrating && await enableAudio()) playTone(midi); }
  async function togglePlayback() {
    microphone.cancelCalibration(); trainer.stop(); practice.stop();
    if (playing) { setPlaying(false); return; }
    if (sound) await enableAudio();
    if (workspace === 'practice' || step === melody.events.length - 1) setStep(0);
    setPlaying(true);
  }
  async function startCalibration() {
    setMetronomeOn(false);
    setPlaying(false); trainer.stop(); practice.stop();
    if (!await startMicrophone()) return;
    microphone.startCalibration();
  }
  function changeStep(index: number) { setPlaying(false); practice.stop(); setStep(index); setInspected(null); }
  function openSettings() { trainer.pause(); setPlaying(false); setTunerOpen(false); setSettingsOpen(true); }
  function openTuner() {
    trainer.pause(); practice.stop(); setPlaying(false); setMetronomeOn(false);
    microphone.cancelCalibration(); setSettingsOpen(false); setTunerOpen(true);
    void startMicrophone();
  }
  useEffect(() => {
    const dialog = tunerRef.current;
    if (tunerOpen && !dialog?.open) dialog?.showModal(); else if (!tunerOpen && dialog?.open) dialog.close();
  }, [tunerOpen]);
  useEffect(() => {
    const dialog = settingsRef.current;
    if (settingsOpen && !dialog?.open) dialog?.showModal(); else if (!settingsOpen && dialog?.open) dialog.close();
  }, [settingsOpen]);
  useEffect(() => {
    if (!playing) return;
    const item = melody.events[step];
    if (sound && item.type === 'note') playTone(item.midi, Math.max(.08, item.duration * 60 / tempo * .88));
    const timer = window.setTimeout(() => { if (step >= melody.events.length - 1) setPlaying(false); else setStep(step + 1); }, item.duration * 60000 / tempo);
    return () => window.clearTimeout(timer);
  }, [playing, step, melody, sound, tempo]);
  useEffect(() => {
    if (microphone.status !== 'listening') {
      if (trainer.active) trainer.pause();
      if (practice.active && practice.input === 'microphone') practice.stop();
    }
  }, [microphone.status, trainer.active, practice.active, practice.input]);

  return <div className={`app-shell studio-shell ${instrument}-studio`}>
    <header className="site-header studio-header">
      <a className="brand" href="#" aria-label="Tonerum start"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><b /></span>tonerum<span className="brand-dot">.</span></a>
      <label className="instrument-picker">Instrument<select aria-label="Vælg instrument" value={instrument} onChange={e => changeInstrument(e.target.value as Instrument)}><option value="guitar">Guitar</option><option value="violin">Violin</option></select></label>
      <nav className="segmented workspace-tabs" aria-label="Arbejdsområde"><button className={workspace === 'practice' ? 'active' : ''} aria-pressed={workspace === 'practice'} onClick={() => changeWorkspace('practice')}>Øv melodi og skala</button><button className={workspace === 'explore' ? 'active' : ''} aria-pressed={workspace === 'explore'} onClick={() => changeWorkspace('explore')}>{instrument === 'violin' ? 'Udforsk violinen' : 'Udforsk gribebrættet'}</button></nav>
      <button className="studio-settings-button" onClick={openSettings}><Icon name="mic" size={15} /><span>Lyd og værktøjer</span><i className={microphone.status === 'listening' ? 'connected' : ''} /></button>
    </header>
    <main>
      <div className="studio-songbar"><div className="exercise-picker">
        <div className="segmented exercise-tabs" aria-label="Vælg øvelsestype"><button className={exerciseKind === 'melody' ? 'active' : ''} aria-pressed={exerciseKind === 'melody'} onClick={() => changeExercise('melody')}>Sange</button><button className={exerciseKind === 'scale' ? 'active' : ''} aria-pressed={exerciseKind === 'scale'} onClick={() => changeExercise('scale')}>Skalaer</button></div>
        {exerciseKind === 'melody' ? <div className="melody-picker"><span className="music-tile"><Icon name="music" size={19} /></span><label><span className="field-label">VÆLG MELODI · {MELODIES.length} SANGE</span><span className="select-wrap"><select value={melodyId} onChange={e => changeMelody(e.target.value)} aria-label="Vælg melodi">{['Børnesange', 'Salmer', 'Traditionals', 'Civilization VI'].map(category => <optgroup key={category} label={category}>{MELODIES.filter(m => m.category === category).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</optgroup>)}</select><Icon name="chevron" size={16} /></span></label><span className="key-badge">{melody.key.label}<span>·</span>{melody.timeSignature.join('/')}</span></div>
          : <div className="scale-picker"><label>Grundtone<select aria-label="Skalaens grundtone" value={scale.tonic} onChange={e => changeExercise('scale', { ...scale, tonic: +e.target.value })}>{SCALE_ROOTS.map((name, tonic) => <option key={tonic} value={tonic}>{name}</option>)}</select></label><label>Skala<select aria-label="Vælg skala" value={scale.type} onChange={e => changeExercise('scale', { ...scale, type: e.target.value as ScaleType })}>{SCALE_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label><label>Retning<select aria-label="Skalaens retning" value={scale.direction} onChange={e => changeExercise('scale', { ...scale, direction: e.target.value as ScaleDirection })}><option value="both">Op og ned</option><option value="up">Op</option><option value="down">Ned</option></select></label><span className="scale-range">Én oktav · {SCALE_ROOTS[scale.tonic]}{3 + octaveShift}–{SCALE_ROOTS[scale.tonic]}{4 + octaveShift}</span></div>}
        </div>{instrument === 'violin' ? <div className="violin-profile"><strong>Violin · 1. position</strong><span>G3–D4–A4–E5 · finger 0–4</span><button className="learning-text-button" onClick={openTuner}>Stem violin</button></div> : <div className="fingering-picker"><label>Grebsforslag<select aria-label="Vælg grebsforslag" value={fingering} onChange={e => changeFingering(e.target.value as FingeringPreset)}>{FINGERING_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label><p title={fingeringDescription}>{fingeringDescription}{outsideSuggestions > 0 ? ' Nogle toner kræver andre bånd.' : ''}</p>{fingering === 'custom' && <div className="custom-fingering"><label>Centrum<input type="number" min={0} max={16} aria-label="Centrum for grebsforslag" value={center} onChange={e => changeCenter(Math.max(0, Math.min(16, +e.target.value || 0)))} /></label><label>Rækkevidde<select aria-label="Rækkevidde for grebsforslag" value={radius} onChange={e => { trainer.pause(); practice.stop(); setPlaying(false); setRadius(+e.target.value); }}>{[1, 2, 3, 4].map(value => <option key={value} value={value}>± {value} bånd</option>)}</select></label></div>}</div>}</div>
      {workspace === 'practice' ? <MelodyTrainer instrument={instrument} trainer={trainer} microphone={microphone} melody={melody} tempo={tempo} position={currentPosition} onTempo={setTempo} onStart={startTrainer} onMicrophone={() => microphone.status === 'listening' ? stopMicrophone() : void startMicrophone()} onSettings={openSettings} onDemo={() => void togglePlayback()} demoPlaying={playing} demoIndex={step} metronomeOn={metronomeOn} metronomePulse={metronomePulse} onMetronome={() => void toggleMetronome()} guitarShortcuts={guitarShortcuts} onGuitarShortcuts={setGuitarShortcuts} showLane={!showStaff} /> : <section className="explore-transport card"><div><h2>{playing ? 'Lyt til melodien' : 'Udforsk melodien'}</h2><p>{event.type === 'note' ? `${noteName(event.midi, true)} · ${currentPosition ? positionDescription(currentPosition, instrument) : ''}` : 'Pause'} · trin {step + 1} / {melody.events.length}</p></div><div className="transport"><button className="icon-button" aria-label="Forrige tone" disabled={step === 0} onClick={() => changeStep(step - 1)}><Icon name="previous" /></button><button className="play-button" aria-label={playing ? 'Pause' : 'Hør melodien'} onClick={() => void togglePlayback()}><Icon name={playing ? 'pause' : 'play'} /></button><button className="icon-button" aria-label="Næste tone" disabled={step === melody.events.length - 1} onClick={() => changeStep(step + 1)}><Icon name="next" /></button></div><input className="range" aria-label="Position i melodien" type="range" min={0} max={melody.events.length - 1} value={step} onChange={e => changeStep(+e.target.value)} /><label className="tempo-label"><input aria-label="Tempo i slag per minut" type="number" min={20} max={240} value={tempo} onChange={e => setTempo(Math.max(20, Math.min(240, +e.target.value || 20)))} /> BPM</label></section>}
      {practice.state.phase !== 'idle' && <section className="hunt-banner" aria-label="Tonejagt"><div><p className="eyebrow">TONEJAGT · {practice.state.index + (practice.state.phase === 'complete' ? 0 : 1)} / {practice.state.queue.length}</p><h2>{practice.state.phase === 'complete' ? 'Alle toner fundet!' : practice.state.phase === 'correct' ? '✓ Rigtigt!' : `Find ${noteName(practice.target!, true)}`}</h2><p>{practice.state.phase === 'complete' ? `${practice.state.mistakes} ekstra forsøg` : practice.input === 'microphone' ? instrument === 'violin' ? 'Spil tonen på din violin.' : 'Spil tonen på din guitar.' : 'Klik på gribebrættet eller klaveret.'}</p></div><div>{practice.active && <button className="learning-text-button" onClick={practice.hint}>{practice.state.hint ? 'Skjul hjælp' : 'Vis placeringer'}</button>}<button className="learning-secondary" onClick={practice.stop}>Tilbage til melodien</button></div></section>}
      <section className="explorer studio-board" aria-label={instrument === 'violin' ? 'Interaktivt violingribebræt' : 'Interaktivt gribebræt'}>
        <div className="studio-board-toolbar"><div className="legend"><span><i className="legend-current" />{workspace === 'practice' ? 'Spil her' : 'Meloditone'}</span><span><i className="legend-heard" />{instrument === 'violin' ? 'Din violin' : 'Din guitar'}{heardMidi !== null ? ` · ${noteName(heardMidi, true)}` : ''}</span>{useHandPosition && <span><i className="legend-region" />Bånd {low}–{high}</span>}</div>
          <div className="board-filters">
            <button className="piano-toggle" onClick={openTuner}>Stemmeværktøj</button>
            <label className="board-select">Toneprikker<select aria-label="Toneprikker på gribebrættet" value={colorMode} onChange={e => setColorMode(e.target.value as typeof colorMode)}><option value="none">Kun øveprikker</option><option value="piano">Sort / hvid</option><option value="gradient">Blå → grøn</option></select></label>
            {instrument === 'guitar' && <label className="board-select">Båndafstand<select aria-label="Afstand mellem båndene" value={fretSpacing} onChange={e => setFretSpacing(e.target.value as FretSpacing)}><option value="realistic">Realistisk</option><option value="even">Ens afstand</option></select></label>}
            {workspace === 'practice' && <button className={`piano-toggle ${showStaff ? 'active' : ''}`} aria-pressed={showStaff} onClick={() => setShowStaff(!showStaff)}>{showStaff ? 'Skjul noder' : 'Vis noder'}</button>}
            <label className="switch-control"><input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} /><span className="switch" /><span>Tonenavne</span></label><button className={`piano-toggle ${showPiano ? 'active' : ''}`} aria-pressed={showPiano} onClick={() => setShowPiano(!showPiano)}>{showPiano ? 'Skjul klaver' : 'Vis klaver'}</button>
          </div>
        </div>
        <InstrumentBoard region={region} colorMode={colorMode} fretSpacing={fretSpacing} showLabels={showLabels} melodyOnly={melodyOnly} melodyPitches={analysis.pitches} matchMode={boardMatch} patternPitches={patternPitches} selectedPitch={selectedPitch} currentMidi={event.type === 'note' ? event.midi : null} heardMidi={heardMidi} inputLevel={microphone.sample.level} inputGate={microphone.gate} inputReading={microphone.sample.stable && !microphone.sample.appSound ? microphone.sample.reading : null} targetMidi={practice.state.hint ? practice.target : null} currentPosition={currentPosition} noteFlight={noteFlight} repetitions={repetitions} upcoming={upcoming} recommended={workspace === 'explore' && !playing ? path.flatMap(item => item.position ? [item.position] : []) : []} sequence={!practice.active && (workspace === 'practice' || playing)} onCenterChange={changeCenter} onSelect={position => void selectPosition(position)} />
        <div className="board-caption"><span>{instrument === 'violin' ? `1. position · vejledende fingerplaceringer${octaveShift ? ' · flyttet én oktav op til violin' : ''}` : useHandPosition ? `Foretrækker bånd ${low}–${high}${outsideSuggestions ? ' · nogle toner ligger udenfor' : ''}` : 'Hele halsen · korte bånd- og strengskift'}</span><span>{inspected ? `${noteName(inspected.midi, true)} · ${positionDescription(inspected, instrument)}` : 'Klik på en tone for at undersøge den'}</span></div>
      </section>
      {workspace === 'practice' && showStaff && practice.state.phase === 'idle' && <ScrollingStaff instrument={instrument} melody={melody} state={trainer.state} index={eventIndex} showLabels={showLabels} demoPlaying={playing} tempo={tempo} inputReading={microphone.sample.stable && !microphone.sample.appSound ? microphone.sample.reading : null} />}
      {showPiano && <Piano currentMidi={event.type === 'note' ? event.midi : null} heardMidi={heardMidi} currentLabel="Meloditone" selectedMidi={inspected?.midi ?? null} selectedPitch={selectedPitch} melodyPitches={analysis.pitches} upcoming={upcoming.map(p => p.midi)} showLabels={showLabels} onSelect={inspectPiano} />}
      {audioError && <p className="inline-notice">Guidelyden kunne ikke startes. Du kan stadig øve med dit instrument.</p>}
      <div className="studio-footnote"><span>{colorMode === 'none' ? 'Baggrundstoner skjult · fingerplaceringer og spillede toner vises stadig' : workspace === 'practice' ? 'Gylden: foreslået placering · stiplet: andre placeringer · blågrøn: det du spiller' : `${analysis.pitches.length} meloditoner · håndposition ${useHandPosition ? 'til' : 'fra'}`}</span><button className="learning-text-button" onClick={openSettings}>Visning, håndposition og nodekilde</button></div>
    </main>
    <dialog ref={tunerRef} className="settings-dialog tuner-dialog" onCancel={() => setTunerOpen(false)} onClose={() => setTunerOpen(false)}>
      <div className="settings-heading"><div><p className="eyebrow">TONERUM · {instrument === 'violin' ? 'VIOLIN' : 'GUITAR'}</p><h2>Stemmeværktøj</h2></div><button className="learning-secondary" onClick={() => setTunerOpen(false)}>Tilbage til øvelsen ×</button></div>
      {tunerOpen && <Tuner key={instrument} instrument={instrument} microphone={microphone} onStart={startMicrophone} onStop={stopMicrophone} onReference={midi => void playReference(midi)} onSettings={openSettings} />}
    </dialog>
    <dialog ref={settingsRef} className="settings-dialog" onCancel={() => setSettingsOpen(false)} onClose={() => setSettingsOpen(false)}>
      <div className="settings-heading"><div><p className="eyebrow">TONERUM</p><h2>Lyd og værktøjer</h2></div><button className="learning-secondary" onClick={() => setSettingsOpen(false)}>Tilbage til {instrument === 'violin' ? 'violinen' : 'guitaren'} ×</button></div>
      <LearningPanel instrument={instrument} microphone={microphone} practice={practice} melodyTitle={melody.title} poolSize={practicePool.length} useHandPosition={useHandPosition} onStartMicrophone={startMicrophone} onStopMicrophone={stopMicrophone} onStartPractice={startPractice} onStartCalibration={startCalibration} onReference={midi => void playReference(midi)} />
      <section className="settings-display card"><h2>Visning og spilleområde</h2><div className="settings-fields">
        <label>Toneprikker<select value={colorMode} onChange={e => setColorMode(e.target.value as typeof colorMode)}><option value="none">Kun øveprikker</option><option value="gradient">Blå → grøn</option><option value="piano">Sort / hvid</option></select></label>
        <label><input type="checkbox" checked={sound} onChange={e => { setSound(e.target.checked); if (e.target.checked) void enableAudio(); }} /> Lyd ved klik og gennemlytning</label>
        <label><input type="checkbox" checked={melodyOnly} onChange={e => setMelodyOnly(e.target.checked)} /> Fremhæv kun meloditoner</label>
        <label><input type="checkbox" checked={pattern} onChange={e => setPattern(e.target.checked)} /> Fremhæv {melody.key.label}-skala</label>
        {instrument === 'guitar' && <>        <label>Grebsforslag<select aria-label="Grebsforslag i indstillinger" value={fingering} onChange={e => changeFingering(e.target.value as FingeringPreset)}>{FINGERING_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
        {fingering === 'custom' && <><label>Centrum: bånd {center}<input type="range" min={0} max={16} value={center} onChange={e => changeCenter(+e.target.value)} /></label><label>Rækkevidde<select value={radius} onChange={e => { trainer.pause(); practice.stop(); setPlaying(false); setRadius(+e.target.value); }}>{[1, 2, 3, 4].map(value => <option key={value} value={value}>± {value} bånd</option>)}</select></label><button className="learning-secondary" onClick={() => changeCenter(findBestCenter(melody.events, radius, boardMatch))}>Find et samlet område</button></>}
        <label>Forslag i andre oktaver<select value={boardMatch} disabled={workspace === 'practice'} onChange={e => setMatchMode(e.target.value as MatchMode)}><option value="exact">Bevar melodiens oktav</option><option value="pitchClass">Tillad andre oktaver ved udforskning</option></select></label></>}
      </div><p className="learning-footnote">{instrument === 'violin' ? 'Placeringerne viser første position og er vejledende. Lyden viser tone og intonation, men kan ikke afgøre streng eller finger. Lave øvelser flyttes samlet en oktav op til violin.' : 'Grebsforslagene foretrækker dit valgte område og må bruge andre bånd, når det hjælper melodien. Melodiøvelsen bevarer altid den oprindelige tone og oktav.'}</p></section>
      <details className="settings-source"><summary>Melodi og nodekilde</summary><p><strong>{melody.title}</strong> · {melody.composer}. {melody.source.edition}</p><p><a href={melody.source.url} target="_blank" rel="noreferrer">{melody.source.title}</a> · <a href={melody.source.licenseUrl} target="_blank" rel="noreferrer">{melody.source.license}</a></p></details>
    </dialog>
  </div>;
}
