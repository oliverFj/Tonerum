import type { Instrument } from '../music/types';
import type { useMicrophone } from '../hooks/useMicrophone';
import { useState } from 'react';
import { STANDARD_TUNING, noteName } from '../music/theory';
import { VIOLIN_TUNING } from '../music/instruments';
import { midiFrequency, tuningReading } from '../music/intonation';
import { signalPercent } from '../music/pitch';

interface Props {
  instrument: Instrument;
  microphone: ReturnType<typeof useMicrophone>;
  onStart: () => Promise<boolean>;
  onStop: () => void;
  onReference: (midi: number) => void;
  onSettings: () => void;
}

export default function Tuner({ instrument, microphone, onStart, onStop, onReference, onSettings }: Props) {
  const [target, setTarget] = useState<number | null>(null);
  const tuning = [...(instrument === 'violin' ? VIOLIN_TUNING : STANDARD_TUNING)].reverse();
  const reading = microphone.sample.stable && !microphone.sample.appSound ? microphone.sample.reading : null;
  const measured = tuningReading(reading, target);
  const listening = microphone.status === 'listening';
  const shownMidi = measured?.midi ?? target;
  const direction = !measured ? 'waiting' : measured.inTune ? 'in-tune' : measured.cents < 0 ? 'flat' : 'sharp';
  const status = microphone.sample.appSound ? 'Venter på, at referencetonen klinger af…' : !measured ? target === null ? 'Spil én tone ad gangen.' : 'Spil den valgte løse streng uden at sætte en finger på.'
    : measured.inTune ? 'Rent stemt' : measured.octaveError ? `Tonen er en oktav for ${measured.cents < 0 ? 'lav' : 'høj'} · kontrollér streng og oktav`
      : Math.abs(measured.cents) > 200 ? 'Langt fra måltonen · kontrollér den valgte streng'
        : measured.cents < 0 ? 'For lav — stem strengen op' : 'For høj — stem strengen ned';
  return <section className="tuner" aria-label={`Stemmeværktøj til ${instrument === 'violin' ? 'violin' : 'guitar'}`}>
    <div className="tuner-strings" aria-label="Vælg tone eller løs streng">
      <button className={target === null ? 'selected' : ''} aria-pressed={target === null} onClick={() => setTarget(null)}>Automatisk<span>Nærmeste tone</span></button>
      {tuning.map((midi, index) => <button key={midi} className={target === midi ? 'selected' : ''} aria-pressed={target === midi} onClick={() => setTarget(midi)}>{noteName(midi, true)}<span>{tuning.length - index}. streng</span></button>)}
    </div>
    <div className={`tuner-readout ${direction}`}><strong>{shownMidi === null ? '–' : noteName(shownMidi, true)}</strong><span>{measured ? `${measured.cents > 0 ? '+' : ''}${Math.round(measured.cents)} cent` : 'Afventer tone'}</span></div>
    <p className={`tuner-status ${direction}`}>{status}</p>
    <div className={`tuner-gauge ${direction}`} role="meter" aria-label="Afvigelse fra måltonen i cent" aria-valuemin={-50} aria-valuemax={50} aria-valuenow={measured ? Math.max(-50, Math.min(50, measured.cents)) : 0} aria-valuetext={measured ? `${Math.round(measured.cents)} cent` : 'Ingen stabil tone'}>
      <i className="tuner-sweet-spot" /><i className="tuner-center" />{[-50, -25, 0, 25, 50].map(value => <span key={value} style={{ left: `${value + 50}%` }}>{value > 0 ? '+' : ''}{value}</span>)}
      {measured && <b className="tuner-needle" style={{ left: `${measured.needle}%` }} />}
    </div>
    <div className="tuner-frequencies"><span>Målt: {reading ? `${noteName(reading.midi, true)} · ${reading.frequency.toFixed(1)} Hz` : '–'}</span><span>Mål: {shownMidi !== null ? `${midiFrequency(shownMidi).toFixed(1)} Hz` : '–'}</span></div>
    <div className="tuner-actions"><button className={listening ? 'learning-secondary' : 'learning-primary'} disabled={microphone.status === 'requesting'} onClick={() => listening ? onStop() : void onStart()}>{listening ? 'Stop lytning' : microphone.status === 'requesting' ? 'Venter på tilladelse…' : 'Start lytning'}</button><button className="learning-secondary" onClick={() => onReference(target ?? measured?.midi ?? 69)}>Hør {noteName(target ?? measured?.midi ?? 69, true)}</button><button className="learning-text-button" onClick={onSettings}>Lydvalg og kalibrering</button></div>
    <div className="tuner-input"><span>Input</span><div><i style={{ width: `${signalPercent(microphone.sample.level)}%` }} /></div><span>{microphone.inputLabel ?? 'Lydindgang slukket'}</span></div>
    <p className="tuner-help">A4 = 440 Hz. Vælg en streng for at holde måltonen fast, også hvis strengen er meget ustemt. {instrument === 'violin' ? 'Spil de løse strenge med en rolig bueføring.' : 'Slå én løs streng an, og lad den klinge.'}</p>
    {microphone.error && <p className="inline-notice" role="alert">{microphone.error}</p>}
  </section>;
}
