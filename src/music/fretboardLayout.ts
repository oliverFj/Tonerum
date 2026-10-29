import { MAX_FRET } from './theory';

export type FretSpacing = 'realistic' | 'even';
export interface FretCell { left: number; width: number; center: number }

/** Equal temperament: each fret leaves 2^(-1/12) of the previous string length.
 * Fret zero is a separate open-string gutter, to the left of the nut. The
 * physical neck from nut to fret 16 fills the rest of the displayed width. */
export function fretboardLayout(spacing: FretSpacing): FretCell[] {
  const openWidth = 1 / (MAX_FRET + 1);
  const neckLength = 1 - 2 ** (-MAX_FRET / 12);
  let left = 0;
  return Array.from({ length: MAX_FRET + 1 }, (_, fret) => {
    const width = spacing === 'even' || fret === 0 ? openWidth
      : (1 - openWidth) * (2 ** (-(fret - 1) / 12) - 2 ** (-fret / 12)) / neckLength;
    const cell = { left, width, center: left + width / 2 };
    left += width;
    return cell;
  });
}
