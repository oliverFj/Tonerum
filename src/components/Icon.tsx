type IconName = 'music' | 'arrow' | 'chevron' | 'previous' | 'next' | 'play' | 'pause' | 'reset' | 'spark' | 'sound' | 'muted' | 'external' | 'info' | 'mic';
const paths: Record<IconName, React.ReactNode> = {
  music: <><path d="M9 18V5l12-2v13M9 9l12-2" /><ellipse cx="6" cy="18" rx="3" ry="3" /><ellipse cx="18" cy="16" rx="3" ry="3" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  previous: <><path d="m15 5-7 7 7 7" /></>,
  next: <path d="m9 5 7 7-7 7" />,
  play: <path d="m9 5 11 7-11 7Z" />,
  pause: <><path d="M9 5v14M16 5v14" /></>,
  reset: <><path d="M3 11a9 9 0 1 1 3 8M3 4v7h7" /></>,
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /><path d="m20 2 .7 1.3L22 4l-1.3.7L20 6l-.7-1.3L18 4l1.3-.7Z" /></>,
  sound: <><path d="M11 5 6 9H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  muted: <><path d="M11 5 6 9H3v6h3l5 4Zm5 4 6 6m0-6-6 6" /></>,
  external: <><path d="M14 3h7v7m0-7L10 14M10 3H4v17h17v-7" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v1a7 7 0 0 0 14 0v-1m-7 8v4m-4 0h8" /></>,
};
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
