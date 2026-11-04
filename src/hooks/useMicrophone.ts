import { useEffect, useState } from 'react';
import { IDLE_MICROPHONE, MicrophoneListener } from '../music/microphone';
import type { MicrophoneSensitivity } from '../music/microphone';
import { VIOLIN_TUNING } from '../music/instruments';
import { CALIBRATION_STRINGS } from '../music/calibration';
import { loadPitchSettings, savePitchSettings } from '../music/pitchSettings';
import type { PitchDetectionSettings } from '../music/pitch';
import type { Instrument } from '../music/types';

export function useMicrophone(instrument: Instrument = 'guitar') {
  const [state, setState] = useState(IDLE_MICROPHONE);
  const [detectionSettings, setDetectionState] = useState(loadPitchSettings);
  const [detectionSaveStatus, setDetectionSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [listener] = useState(() => {
    const instance = new MicrophoneListener(setState);
    instance.setDetectionSettings(detectionSettings);
    return instance;
  });
  const [sensitivity, setSensitivityState] = useState<MicrophoneSensitivity>('quiet');
  const [deviceId, setDeviceId] = useState('');
  const [devices, setDevices] = useState<{ deviceId: string; label: string }[]>([]);
  useEffect(() => { listener.setCalibrationStrings(instrument === 'violin' ? [...VIOLIN_TUNING].reverse() : CALIBRATION_STRINGS); }, [instrument, listener]);
  useEffect(() => {
    const stop = () => listener.stop();
    window.addEventListener('pagehide', stop);
    return () => { window.removeEventListener('pagehide', stop); listener.stop(false); };
  }, [listener]);

  useEffect(() => {
    const media = navigator.mediaDevices;
    if (!media?.enumerateDevices) return;
    let disposed = false;
    const refresh = async () => {
      try {
        const available = await media.enumerateDevices();
        if (!disposed) setDevices(available.filter(device => device.kind === 'audioinput'
          && device.deviceId && device.deviceId !== 'default' && device.deviceId !== 'communications')
          .map(({ deviceId, label }) => ({ deviceId, label })));
      } catch {
        // The default input still works if this browser restricts enumeration.
      }
    };
    void refresh();
    media.addEventListener?.('devicechange', refresh);
    return () => { disposed = true; media.removeEventListener?.('devicechange', refresh); };
  }, [state.status]);

  const selectDevice = (value: string) => {
    listener.stop();
    setDeviceId(value);
  };
  const setSensitivity = (value: MicrophoneSensitivity) => {
    listener.setSensitivity(value);
    setSensitivityState(value);
  };
  const setDetectionSettings = (settings: Readonly<PitchDetectionSettings>) => {
    listener.setDetectionSettings(settings);
    setDetectionState(settings);
    setDetectionSaveStatus('idle');
  };
  const saveDetectionSettings = () => {
    setDetectionSaveStatus(savePitchSettings(detectionSettings) ? 'saved' : 'error');
  };
  return { ...state, sensitivity, setSensitivity, deviceId, devices, selectDevice,
    detectionSettings, setDetectionSettings, saveDetectionSettings, detectionSaveStatus,
    calibrating: state.calibration.phase === 'noise' || state.calibration.phase === 'strings',
    startCalibration: listener.startCalibration, cancelCalibration: listener.cancelCalibration,
    finishCalibration: listener.finishCalibration,
    resetCalibration: listener.resetCalibration,
    start: () => listener.start(deviceId), stop: listener.stop };
}
