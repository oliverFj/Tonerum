/** Narrow mains-hum rejection, followed by the guitar's analysis bandwidth.
 * Low/high-pass Q is in dB in Web Audio; notch Q is a linear quality factor. */
export const GUITAR_INPUT_FILTERS = [
  { type: 'notch', frequency: 50, q: 10 },
  { type: 'notch', frequency: 100, q: 50 },
  { type: 'highpass', frequency: 60, q: 1 },
  { type: 'lowpass', frequency: 1800, q: 1 },
] as const;

export const MICROPHONE_FRAME_MS = 40;
