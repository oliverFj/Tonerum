import { DEFAULT_PITCH_SETTINGS } from './pitch';
import type { PitchDetectionSettings } from './pitch';

const STORAGE_KEY = 'tonerum.pitch-detection.v1';

export const PITCH_SETTING_VALUES = {
  attackRisePercent: [25, 35, 50, 70],
  minAttackMs: [80, 120, 160, 200, 240],
  releaseMs: [80, 120, 160, 200, 240],
};

export function loadPitchSettings(storage?: Pick<Storage, 'getItem'>): Readonly<PitchDetectionSettings> {
  try {
    const value = JSON.parse((storage ?? window.localStorage).getItem(STORAGE_KEY) ?? 'null');
    if (value && typeof value === 'object'
      && PITCH_SETTING_VALUES.attackRisePercent.includes(value.attackRisePercent)
      && PITCH_SETTING_VALUES.minAttackMs.includes(value.minAttackMs)
      && PITCH_SETTING_VALUES.releaseMs.includes(value.releaseMs)) {
      return { attackRisePercent: value.attackRisePercent, minAttackMs: value.minAttackMs, releaseMs: value.releaseMs };
    }
  } catch {
    // Invalid or unavailable browser storage must not prevent listening.
  }
  return DEFAULT_PITCH_SETTINGS;
}

export function savePitchSettings(settings: Readonly<PitchDetectionSettings>, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    (storage ?? window.localStorage).setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
