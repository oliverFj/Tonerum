export const FIFTHS = [
  { major: 'C', minor: 'a', tonic: 0, signature: 'Ingen fortegn' },
  { major: 'G', minor: 'e', tonic: 7, signature: '1 kryds' },
  { major: 'D', minor: 'b', tonic: 2, signature: '2 krydser' },
  { major: 'A', minor: 'f♯', tonic: 9, signature: '3 krydser' },
  { major: 'E', minor: 'c♯', tonic: 4, signature: '4 krydser' },
  { major: 'B', minor: 'g♯', tonic: 11, signature: '5 krydser' },
  { major: 'F♯ / G♭', minor: 'd♯ / e♭', tonic: 6, signature: '6 krydser / 6 b’er' },
  { major: 'D♭', minor: 'b♭', tonic: 1, signature: '5 b’er' },
  { major: 'A♭', minor: 'f', tonic: 8, signature: '4 b’er' },
  { major: 'E♭', minor: 'c', tonic: 3, signature: '3 b’er' },
  { major: 'B♭', minor: 'g', tonic: 10, signature: '2 b’er' },
  { major: 'F', minor: 'd', tonic: 5, signature: '1 b' },
] as const;

export type FifthsQuiz = 'fifth' | 'fourth' | 'minor';
export function fifthsAnswer(index: number, kind: FifthsQuiz) {
  return (index + (kind === 'fifth' ? 1 : kind === 'fourth' ? 11 : 0)) % 12;
}

export function minorTonic(index: number) { return (FIFTHS[index].tonic + 9) % 12; }
