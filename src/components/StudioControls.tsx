import type { ButtonHTMLAttributes, SelectHTMLAttributes } from 'react';

// Thin React adapters for the shared native component anatomy. Styling and
// interaction states live in Design Studio; React owns values and callbacks.
export function Button({ className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const variant = className.includes('learning-primary') ? 'primary'
    : /learning-secondary|piano-toggle|studio-settings-button/.test(className) ? 'tertiary' : 'ghost';
  return <button type="button" {...props} className={`ds-button ${className}`} data-variant={variant} data-size="small">{children}</button>;
}

export function SegmentedOption({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`ds-segmented-option ${className}`} data-variant="desktop" />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`ds-select ${className}`} data-variant="desktop" />;
}
