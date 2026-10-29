import { useEffect, useState } from 'react';
import { IDLE_MICROPHONE, MicrophoneListener } from '../music/microphone';
import type { MicrophoneSensitivity } from '../music/microphone';
import { VIOLIN_TUNING } from '../music/instruments';
import { CALIBRATION_STRINGS } from '../music/calibration';
import type { Instrument } from '../music/types';

export function useMicrophone(instrument: Instrument = 'guitar') {
  const [state, setState] = useState(IDLE_MICROPHONE);
  const [listener] = useState(() => new MicrophoneListener(setState));
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
  return { ...state, sensitivity, setSensitivity, deviceId, devices, selectDevice,
    calibrating: state.calibration.phase === 'noise' || state.calibration.phase === 'strings',
    startCalibration: listener.startCalibration, cancelCalibration: listener.cancelCalibration,
    finishCalibration: listener.finishCalibration,
    resetCalibration: listener.resetCalibration,
    start: () => listener.start(deviceId), stop: listener.stop };
}
