import { CALIBRATION_STRINGS } from '../music/calibration';
import { noteName } from '../music/theory';
import type { useMicrophone } from '../hooks/useMicrophone';
import type { Instrument } from '../music/types';
import { VIOLIN_TUNING } from '../music/instruments';

interface Props {
  instrument?: Instrument;
  microphone: ReturnType<typeof useMicrophone>;
  onStart: () => Promise<void>;
}

export default function InputCalibration({ instrument = 'guitar', microphone, onStart }: Props) {
  const { calibration, calibrating, status } = microphone;
  const { phase, strings } = calibration;
  const complete = phase === 'complete';
  const violin = instrument === 'violin';
  const expected = violin ? [...VIOLIN_TUNING].reverse() : CALIBRATION_STRINGS;
  return <details className="input-calibration">
    <summary>Kalibrering <span>{calibrating ? 'I gang' : complete ? `${strings.length} / ${expected.length} strenge kontrolleret` : `Tilpas til din ${violin ? 'violin' : 'guitar'}`}</span></summary>
    <div className="calibration-body">
      <p role="status">{phase === 'noise'
        ? '1. Hold strengene dæmpet. Vi måler baggrunden i cirka to sekunder…'
        : phase === 'strings'
          ? violin ? '2. Spil de fire løse strenge med din normale bueføring, én ad gangen. Hold hver tone lidt.' : '2. Spil de seks løse strenge, én ad gangen, med dit normale anslag. Hold hver tone lidt, og dæmp de andre strenge.'
          : complete
            ? `Lydgrænsen er tilpasset. ${strings.length} af ${expected.length} løse strenge blev genkendt i den rigtige oktav.`
            : violin ? 'Dæmp strengene, og start målingen. Bagefter spiller du G–D–A–E med samme bueføring og indgangsniveau som i øvelserne.' : 'Dæmp alle strengene, og start målingen. Bagefter spiller du de seks løse strenge. Brug samme mikrofonplacering og anslag som i øvelserne — med plekter, hvis du spiller med det.'}</p>
      {phase === 'noise' && <progress aria-label="Måling af baggrundsstøj" value={calibration.progress} max={1} />}
      {(phase === 'strings' || complete) && <>
        <div className="calibration-strings" aria-label="Kontrol af løse strenge i standardstemning">
          {expected.map((midi, index) => <span key={midi} className={strings.includes(midi) ? 'checked' : ''}>
            <small>{expected.length - index}. streng</small><strong>{noteName(midi, true)}</strong><span>{strings.includes(midi) ? '✓ Hørt' : 'Ikke hørt'}</span>
          </span>)}
        </div>
        {phase === 'strings' && <p>Standardstemning {violin ? 'G–D–A–E' : 'E–A–D–G–B–E'}. Hvis en streng ikke bliver hørt, spil den igen, og se den målte tone ovenfor. Spil kun én streng ad gangen.</p>}
        {complete && strings.length < expected.length && <p>De øvrige strenge er endnu ikke kontrolleret.</p>}
      </>}
      {calibration.message && <p className="inline-notice">{calibration.message}</p>}
      <div className="calibration-actions">
        {calibrating ? <>
          {phase === 'strings' && <button className="learning-primary" disabled={!strings.length} onClick={microphone.finishCalibration}>Brug målingen</button>}
          <button className="learning-text-button" onClick={microphone.cancelCalibration}>Annuller</button>
        </> : <>
          <button className="learning-secondary" disabled={status === 'requesting'} onClick={() => void onStart()}>{complete ? 'Kalibrer igen' : 'Dæmp strengene · mål baggrund'}</button>
          {complete && <button className="learning-text-button" onClick={microphone.resetCalibration}>Nulstil</button>}
        </>}
      </div>
      <p className="calibration-note">Kalibreringen tilpasser lydgrænsen, ikke stemningen. Den kan ikke rette en forkert genkendt tone eller oktav. Indstillingen gælder denne lydindgang, mens programmet er åbent.</p>
    </div>
  </details>;
}
