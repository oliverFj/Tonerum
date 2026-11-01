import { useEffect, useRef, useState } from 'react';
import { createColorModePreference } from '../../design/runtime/theme-modes.mjs';
import type { ColorMode, ColorModePreference } from '../../design/runtime/theme-modes.mjs';

export function useAppearance() {
  const [appearance, setAppearance] = useState<ColorMode>('system');
  const [resolvedAppearance, setResolvedAppearance] = useState<'light' | 'dark'>('light');
  const preference = useRef<ColorModePreference | null>(null);
  useEffect(() => {
    const apply = (resolved: 'light' | 'dark', value: ColorMode) => {
      document.getElementById('root')!.dataset.appearance = resolved;
      document.documentElement.style.colorScheme = resolved;
      setAppearance(value);
      setResolvedAppearance(resolved);
    };
    const current = createColorModePreference({ key: 'tonerum.color-mode', onChange: apply });
    preference.current = current;
    apply(current.resolved, current.value);
    return () => { current.destroy(); preference.current = null; };
  }, []);
  return { appearance, resolvedAppearance, setAppearance: (value: ColorMode) => preference.current?.set(value) };
}
