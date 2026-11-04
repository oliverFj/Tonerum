import { Button, Select } from './StudioControls';
import { findPositions, noteName, octave } from '../music/theory';
import { signalDecibels, signalPercent } from '../music/pitch';
import { isDirectGuitarInput } from '../music/microphone';
import type { useMicrophone } from '../hooks/useMicrophone';
import { Icon } from './Icon';
import InputCalibration from './InputCalibration';
import ToneDetectionSettings from './ToneDetectionSettings';
import type { Instrument } from '../music/types';
import { instrumentPositions } from '../music/instruments';

interface Props {
  instrument?: Instrument;
  microphone: ReturnType<typeof useMicrophone>;
  onStartMicrophone: () => Promise<boolean>;
  onStopMicrophone: () => void;
  onStartCalibration: () => Promise<void>;
}

export default function LearningPanel({ instrument = 'guitar', microphone, onStartMicrophone, onStopMicrophone, onStartCalibration }: Props) {
  const { sample, status } = microphone;
  const violin = instrument === 'violin';
  const ownInstrument = violin ? 'violin' : 'guitar';
  const { reading, stable, appSound } = sample;
  const listening = status === 'listening';
  const cents = reading ? Math.round(reading.cents) : 0;
  const level = Math.round(signalPercent(sample.level));
  const decibels = signalDecibels(sample.level);
  const directInput = isDirectGuitarInput(microphone.inputLabel ?? '');
  const missingDevice = microphone.deviceId && !microphone.devices.some(device => device.deviceId === microphone.deviceId);

  return <section className="learning-section" aria-label={`Lydindstillinger til din ${ownInstrument}`}>
    <div className="learning-heading"><div><p className="eyebrow">{violin ? 'LÆR MED VIOLINEN' : 'LÆR MED GUITAREN'}</p><h2>Spil en tone. Se hvor den bor.</h2></div><span>Enkelttoner · i dit eget tempo</span></div>
    <div className="learning-tools">
      <section className="card microphone-card" aria-label="Lydindgang og tonegenkendelse">
        <div className="section-heading"><h2><Icon name="mic" size={17} />Lyt til min {ownInstrument}</h2><span className={`mic-status ${listening ? 'on' : ''}`}>{listening ? directInput ? 'USB-instrument tilsluttet' : 'Lydindgang tændt' : status === 'requesting' ? 'Venter på tilladelse' : 'Lydindgang slukket'}</span></div>
        <label className="microphone-source">Lydindgang<Select aria-label="Vælg mikrofon eller USB-instrumentkabel" value={microphone.deviceId} disabled={status === 'requesting'} onChange={e => microphone.selectDevice(e.target.value)}><option value="">Computerens standardindgang</option>{microphone.devices.map((device, index) => <option value={device.deviceId} key={device.deviceId}>{device.label || `Lydindgang ${index + 1}`}</option>)}{missingDevice && <option value={microphone.deviceId} disabled>Den valgte indgang er ikke tilgængelig</option>}</Select></label>
        {!microphone.devices.some(device => device.label) && <p className="learning-footnote input-permission-help">Start lytning og tillad mikrofonadgang for at vise indgangenes navne. Det gælder også Rocksmith-kablet.</p>}
        <div className="microphone-readout"><div className={`heard-note-tile ${stable ? 'stable' : ''}`} aria-live="polite">{stable && reading ? <>{noteName(reading.midi)}<sub>{octave(reading.midi)}</sub></> : '–'}</div><div><strong>{appSound ? 'Venter på, at guidetonen klinger af' : stable && reading ? 'Det er tonen, du spiller' : reading ? 'Hold tonen et øjeblik…' : listening ? 'Spil én streng ad gangen' : `Find tonerne med din egen ${ownInstrument}`}</strong><p>{stable && reading ? `${reading.frequency.toFixed(1)} Hz · ${cents > 0 ? '+' : ''}${cents} cent · ${Math.abs(cents) <= 10 ? 'ren tone' : cents < 0 ? 'lidt lav' : 'lidt høj'}` : 'Tonehøjde og oktav vises på begge instrumenter.'}</p></div></div>
        <div className="tuning-meter" aria-label={reading ? `Afvigelse ${cents} cent fra nærmeste tone` : 'Ingen tone registreret'}><span>Lav</span><div className="tuning-track"><i className="tuning-center" />{reading && <i className={`tuning-needle ${stable ? 'stable' : ''}`} style={{ left: `${Math.max(0, Math.min(100, 50 + cents))}%` }} />}</div><span>Høj</span></div>
        <div className="microphone-controls"><Button className={listening || status === 'requesting' ? 'learning-secondary' : 'learning-primary'} onClick={() => listening || status === 'requesting' ? onStopMicrophone() : void onStartMicrophone()}><Icon name="mic" size={15} />{listening ? 'Stop lytning' : status === 'requesting' ? 'Annuller' : 'Start lytning'}</Button><div className="input-level" role="meter" aria-label="Lydindgangens niveau" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level} aria-valuetext={Number.isFinite(decibels) ? `${Math.round(decibels)} dB` : 'Intet målbart signal'}><span>Input</span><div><i style={{ width: `${level}%` }} /></div><output>{Number.isFinite(decibels) ? `${Math.round(decibels)} dB` : '–'}</output></div></div>
        <label className="microphone-sensitivity">Følsomhed<Select value={microphone.calibration.phase === 'complete' ? 'calibrated' : microphone.sensitivity} disabled={microphone.calibrating} aria-label="Mikrofonfølsomhed" onChange={e => { if (e.target.value !== 'calibrated') microphone.setSensitivity(e.target.value as 'quiet' | 'normal'); }}>{microphone.calibration.phase === 'complete' && <option value="calibrated">Kalibreret til din {ownInstrument}</option>}<option value="quiet">Svagt signal · høj følsomhed</option><option value="normal">Normal · mere støjafvisning</option></Select></label>
        {listening && <p className="microphone-diagnostics">{microphone.inputLabel}<span>{appSound ? 'Afventer guidetonen' : sample.level === 0 ? 'Intet lydsignal modtaget' : sample.level < microphone.gate ? directInput ? 'Signal under lydgrænsen · kontrollér instrumentets volumen' : 'Signal under lydgrænsen · flyt mikrofonen tættere på instrumentet' : !reading ? 'Der kommer lyd ind · venter på en tydelig tone' : stable ? 'Tone registreret' : 'Tonen stabiliseres…'}</span></p>}
        {microphone.error && <p className="inline-notice" role="alert">{microphone.error}</p>}
        {reading && stable && !findPositions(reading.midi, 'exact', instrumentPositions(instrument)).length && <p className="inline-notice">Tonen ligger uden for det viste gribebræt.</p>}
        <InputCalibration instrument={instrument} microphone={microphone} onStart={onStartCalibration} />
        <ToneDetectionSettings microphone={microphone} />
        <p className="learning-footnote">Lyden analyseres kun her og gemmes ikke. Indgangen afspilles ikke gennem højttalerne. Vi genkender tone og oktav, men ikke den streng eller finger, du bruger.</p>
      </section>

    </div>
  </section>;
}
