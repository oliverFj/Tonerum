import { Button, Select } from './StudioControls';
import { DEFAULT_PITCH_SETTINGS } from '../music/pitch';
import { PITCH_SETTING_VALUES } from '../music/pitchSettings';
import type { PitchDetectionSettings } from '../music/pitch';
import type { useMicrophone } from '../hooks/useMicrophone';

const controls: { key: keyof PitchDetectionSettings; label: string; unit: string; help: string }[] = [
  { key: 'attackRisePercent', label: 'Lydstigning ved nyt anslag', unit: '%',
    help: 'Lavere værdi fanger blødere gentagelser. Højere værdi afviser flere små udsving.' },
  { key: 'minAttackMs', label: 'Mindste tid mellem anslag', unit: 'ms',
    help: 'Lavere værdi tillader hurtigere gentagelser. Højere værdi beskytter mere mod dobbelttælling af samme tone.' },
  { key: 'releaseMs', label: 'Tolerance for korte udfald', unit: 'ms',
    help: 'Højere værdi beskytter mod, at en tone tæller igen efter et udfald. Korte pauser mellem ens toner kan da kræve et tydeligere anslag.' },
];

export default function ToneDetectionSettings({ microphone }: { microphone: ReturnType<typeof useMicrophone> }) {
  const { detectionSettings, setDetectionSettings, saveDetectionSettings, detectionSaveStatus, calibrating } = microphone;
  return <details className="input-calibration">
    <summary>Finjustér tonegenkendelse</summary>
    <div className="calibration-body">
      {controls.map(({ key, label, unit, help }) => <div key={key}>
        <label className="microphone-sensitivity">{label}
          <Select value={detectionSettings[key]} disabled={calibrating} aria-describedby={`detection-${key}-help`}
            onChange={e => setDetectionSettings({ ...detectionSettings, [key]: Number(e.target.value) })}>
            {PITCH_SETTING_VALUES[key].map(value => <option key={value} value={value}>{value} {unit}{value === DEFAULT_PITCH_SETTINGS[key] ? ' · standard' : ''}</option>)}
          </Select>
        </label>
        <p id={`detection-${key}-help`}>{help}</p>
      </div>)}
      <div className="calibration-actions"><Button className="learning-primary" disabled={calibrating}
        onClick={saveDetectionSettings}>Gem indstillinger</Button><Button className="learning-secondary" disabled={calibrating}
        onClick={() => setDetectionSettings(DEFAULT_PITCH_SETTINGS)}>Gendan standardværdier</Button></div>
      {detectionSaveStatus === 'saved' && <p role="status">Indstillingerne er gemt i denne browser.</p>}
      {detectionSaveStatus === 'error' && <p className="inline-notice" role="alert">Browseren kunne ikke gemme indstillingerne. De virker stadig, indtil du genindlæser programmet.</p>}
      <p className="calibration-note">Valgene virker straks under lytning. Tryk Gem indstillinger for at bevare de tre værdier efter genindlæsning i samme browser. Gendannede standardværdier skal også gemmes, hvis de skal bevares.</p>
    </div>
  </details>;
}
