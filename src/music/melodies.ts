import type { Melody, MelodyEvent, NoteEvent } from './types';
import { FOLK_MELODIES } from './folkMelodies';
import { CIVILIZATION_MELODIES } from './civilizationMelodies';
import { DANISH_HYMNS } from './danishHymns';

const n = (midi: number, duration = 1): NoteEvent => ({ type: 'note', midi, duration });
const r = (duration: number): MelodyEvent => ({ type: 'rest', duration });
const phrase = (label: string, notes: MelodyEvent[]): MelodyEvent[] =>
  notes.map((note, i) => i === 0 ? { ...note, phraseStart: label } : { ...note });

// Wikisource, Krøyer's complete LilyPond melody, revision 9898.
// German h → international B. Engraving-only spacer notes (`s`) are omitted;
// real rests (`r`) and both passes of the volta are retained. No transposition.
const anthemOpening = phrase('A · Første del', [
  n(62, .5),
  n(69, 1.5), n(69, .5), n(66), n(62),
  n(71, 2), r(1), r(.5), n(62, .5),
  n(74, 1.5), n(74, .5), n(73), n(71),
  n(71), n(69), r(1), n(69),
  n(61, 1.5), n(61, .5), n(62), n(64),
  n(66), n(68), n(69), n(71),
  n(69, 2), n(68, 2),
  n(69, 2), r(1), r(.5),
]);

const anthemEnding: MelodyEvent[] = [
  n(69, .5),
  n(73, 1.5), n(73, .5), n(71), n(69),
  n(69, 1.5), n(74, .5), n(74), n(66),
  n(71, 1.5), n(71, .5), n(71), n(71),
  n(71, 2), n(70), r(.5), n(69, .5),
  n(69), n(68), n(67), n(66),
  n(71), n(74, 1.5), n(74, .5), n(73, .75), n(71, .25),
  n(71), n(69, 2), n(61),
  n(62, 2), r(1), r(.5),
];

// Full 12-bar A–B–A form, matching yuuki7's CC0 score in C4, 4/4.
const twinkleA = [
  n(60), n(60), n(67), n(67), n(69), n(69), n(67, 2),
  n(65), n(65), n(64), n(64), n(62), n(62), n(60, 2),
];
const twinkleB = [
  n(67), n(67), n(65), n(65), n(64), n(64), n(62, 2),
  n(67), n(67), n(65), n(65), n(64), n(64), n(62, 2),
];

const folkSource = {
  title: 'yuuki7 · LilyPond sheet music',
  url: 'https://wikinder.org/LilyPond-sheet-music',
  license: 'CC0 1.0 (nodekilde)',
  licenseUrl: 'https://github.com/yuuki7/sheetmusic/blob/main/LICENSE-CC0-1.0',
};

export const MELODIES: Melody[] = [
  {
    id: 'yndigt-land',
    category: 'Traditionals',
    title: 'Der er et yndigt land',
    subtitle: 'Dansk nationalmelodi',
    composer: 'Hans Ernst Krøyer',
    key: { tonic: 2, mode: 'major', label: 'D-dur' },
    timeSignature: [4, 4], tempo: 92,
    events: [
      ...anthemOpening,
      ...phrase('B · Anden del', anthemEnding),
      ...phrase('B · Gentagelse', anthemEnding),
    ],
    source: {
      title: 'Wikisource · Krøyers LilyPond-noder',
      url: 'https://da.wikisource.org/w/index.php?title=Der_er_et_yndigt_land/Lilypond&oldid=9898',
      edition: 'Hele den noterede melodi: A + B + B, med optakter og pauser. Kildens gentagelsestegn er foldet ud. Tonehøjderne følger kilden uden transponering.',
      license: 'Public domain-komposition · Wikisource CC BY-SA',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
  },
  {
    id: 'twinkle', title: 'Lille stjerne', subtitle: 'Twinkle, Twinkle, Little Star',
    category: 'Børnesange',
    composer: 'Traditionel fransk melodi',
    key: { tonic: 0, mode: 'major', label: 'C-dur' },
    timeSignature: [4, 4], tempo: 100,
    events: [...phrase('A · Første del', twinkleA), ...phrase('B · Mellemstykke', twinkleB), ...phrase('A · Tilbage til starten', twinkleA)],
    source: { ...folkSource, edition: 'Hele melodien i C-dur, 12 takter (A–B–A). Titel i kilden: Twinkle, Twinkle, Little Star. Nodefilen er udgivet under CC0 i transskribentens repository.' },
  },
  {
    id: 'row', title: 'Ro, ro, ro din båd', subtitle: 'Row, Row, Row Your Boat',
    category: 'Børnesange',
    composer: 'Traditionel amerikansk melodi',
    key: { tonic: 0, mode: 'major', label: 'C-dur' },
    timeSignature: [4, 4], tempo: 80,
    events: [
      ...phrase('A · Ro din båd', [n(60), n(60), n(60, .75), n(62, .25), n(64)]),
      ...phrase('B · Ned ad åen', [n(64, .75), n(62, .25), n(64, .75), n(65, .25), n(67, 2)]),
      ...phrase('C · Trioler', [
        ...[72, 67, 64, 60].flatMap(midi => [n(midi, 1 / 3), n(midi, 1 / 3), n(midi, 1 / 3)]),
      ]),
      ...phrase('D · Slutning', [n(67, .75), n(65, .25), n(64, .75), n(62, .25), n(60, 2)]),
    ],
    source: { ...folkSource, edition: 'Hele den noterede melodi i C-dur, 4 takter i 4/4 med punkterede rytmer og trioler, som i kilden. Ingen udeladte gentagelsestegn.' },
  },
  ...FOLK_MELODIES,
  ...DANISH_HYMNS,
  ...CIVILIZATION_MELODIES,
];
