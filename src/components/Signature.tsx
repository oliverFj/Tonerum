import { useMemo } from 'react';
import { renderComponent } from '../../design/runtime/components.mjs';
import { resolveThemeMode } from '../../design/runtime/theme-modes.mjs';
import theme from '../../design/design.json';

export function Signature({ appearance }: { appearance: 'light' | 'dark' }) {
  const markup = useMemo(() => renderComponent(resolveThemeMode(theme, appearance), 'signature', {
    identity: 'fjordside',
    variant: 'quiet',
  }), [appearance]);

  return <footer className="studio-signature" dangerouslySetInnerHTML={{ __html: markup }} />;
}
