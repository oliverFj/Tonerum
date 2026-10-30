import type { Melody, MelodyEvent } from './types';

// Absolute pitches; suffixes are durations in quarter-note beats. Source
// transpositions are explicit in each edition note, never inferred at runtime.
export function notes(text: string): MelodyEvent[] {
  return text.trim().split(/\s+/).map(token => {
    const match = /^([A-GR])([#b]?)(\d)?(?::([\d.]+))?$/.exec(token);
    if (!match) throw new Error(`Invalid melody note: ${token}`);
    const duration = Number(match[4] ?? 1);
    if (match[1] === 'R') return { type: 'rest', duration };
    const semitone = ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as Record<string, number>)[match[1]];
    return { type: 'note', duration, midi: (Number(match[3]) + 1) * 12 + semitone + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0) };
  });
}
const mutopia = (id: string, edition: string): Melody['source'] => ({
  title: 'Mutopia Project · melodistemme fra LilyPond-kilden',
  url: `https://www.mutopiaproject.org/ftp/Traditional/${id}/${id}.ly`,
  edition,
  license: 'Public domain · komposition og nodeudgave',
  licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
});

// Henrik Norbeck, hn-polka-41: B minor, 2/4, default eighth notes.
// Each line is one source bar; both repeats are unfolded below (AABB).
// All source pitches are lowered one octave for the guitar.
const ievanA = notes(`
  B3:0.75 B3:0.25 B3:0.5 C#4:0.5
  D4:0.5 B3:0.5 B3:0.5 D4:0.5
  C#4:0.5 A3:0.5 A3:0.5 C#4:0.5
  D4:0.25 C#4:0.25 B3:0.25 A3:0.25 B3:0.5 F#3:0.5
  B3:0.75 B3:0.25 B3:0.5 C#4:0.5
  D4:0.5 B3:0.5 B3
  E4:0.5 F#4:0.25 E4:0.25 D4:0.5 C#4:0.5
  B3 B3`);
const ievanB = notes(`
  F#4:0.75 D4:0.25 D4:0.5 F#4:0.5
  E4:0.5 C#4:0.5 C#4:0.5 D4:0.5
  E4:0.5 F#4:0.25 E4:0.25 D4:0.5 C#4:0.5
  B3:0.5 C#4:0.5 D4:0.5 E4:0.5
  F#4:0.75 D4:0.25 D4:0.5 F#4:0.5
  E4:0.5 C#4:0.5 C#4:0.5 D4:0.5
  E4:0.5 F#4:0.25 E4:0.25 D4:0.5 C#4:0.5
  B3 B3`);

export const FOLK_MELODIES: Melody[] = [
  {
    id: 'ievan-polkka', title: 'Ievan polkka', subtitle: 'Savitaipaleen polkka · finsk polka',
    category: 'Traditionals', composer: 'Traditionel finsk melodi',
    key: { tonic: 11, mode: 'minor', label: 'B-mol' }, timeSignature: [2, 4], tempo: 120,
    events: [ievanA, ievanA, ievanB, ievanB].flatMap((part, section) => part.map((event, index) =>
      index === 0 ? { ...event, phraseStart: ['A · Første del', 'A · Gentagelse', 'B · Anden del', 'B · Gentagelse'][section] } : event)),
    source: {
      title: 'Henrik Norbeck · Ievan polkka, hn-polka-41',
      url: 'https://www.norbeck.nu/abc/display.asp?rhythm=polka&ref=41',
      edition: 'Hele den traditionelle melodivariant fra Henrik Norbecks ABC-samling, AABB: begge otte-takters dele spilles to gange. Punkteringer og sekstendedele bevares. Lagt én oktav ned for guitaren; 120 BPM er programmets øvetempo.',
      license: 'Traditionel melodi · egen indtastning',
      licenseUrl: 'https://www.loituma.fi/en/ievan-polkka-en/',
    },
  },
  {
    id: 'mester-jakob', title: 'Mester Jakob', subtitle: 'Frère Jacques · enstemmig kanon',
    category: 'Børnesange', composer: 'Traditionel fransk melodi',
    key: { tonic: 0, mode: 'major', label: 'C-dur' }, timeSignature: [4, 4], tempo: 96,
    events: notes(`C4 D4 E4 C4 C4 D4 E4 C4
      E4 F4 G4:2 E4 F4 G4:2
      G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4
      C4 G3 C4:2 C4 G3 C4:2`),
    source: { title: 'Frère Jacques · komplet LilyPond-melodi',
      url: 'https://ichigos.com/res/forumarchive/index.php/t-17687.html',
      edition: 'Egen indtastning af hele den traditionelle melodistemme i C-dur, kontrolleret mod LilyPond-eksemplet. Én gennemspilning uden kanonstemmer.',
      license: 'Public domain-melodi', licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/' },
  },
  {
    id: 'happy-birthday', title: 'Happy Birthday', subtitle: 'Fødselsdagssang', category: 'Børnesange',
    composer: 'Patty og Mildred J. Hill', key: { tonic: 0, mode: 'major', label: 'C-dur' }, timeSignature: [3, 4], tempo: 100,
    events: notes(`G3:0.75 G3:0.25 A3 G3 C4 B3:2
      G3:0.75 G3:0.25 A3 G3 D4 C4:2
      G3:0.75 G3:0.25 G4 E4 C4 B3 A3
      F4:0.75 F4:0.25 E4 C4 D4 C4:2`),
    source: { title: 'yuuki7 · Happy Birthday to You, CC0-nodefil',
      url: 'https://github.com/yuuki7/sheetmusic/blob/main/happy/happy.ly',
      edition: 'Hele melodien med optakt. Kildens melodistemme er lagt én oktav ned for guitaren; fermaten holdes i den noterede varighed.',
      license: 'CC0 1.0 (nodekilde)', licenseUrl: 'https://github.com/yuuki7/sheetmusic/blob/main/LICENSE-CC0-1.0' },
  },
  {
    id: 'oats-and-beans', title: 'Oats and Beans', subtitle: 'Engelsk sangleg', category: 'Børnesange',
    composer: 'Traditionel engelsk melodi', key: { tonic: 0, mode: 'major', label: 'C-dur' }, timeSignature: [6, 8], tempo: 100,
    events: notes(`G3 G3:0.5 E3 C3:0.5 F3 A3:0.5 G3 G3:0.5
      G3 G3:0.5 E3 C3:0.5 F3:0.5 F3:0.5 A3:0.5 G3:1.5
      C4 C4:0.5 B3 B3:0.5 A3 A3:0.5 G3 G3:0.5
      F3 F3:0.5 E3 E3:0.5 D3:0.5 D3:0.5 D3:0.5 C3:1.5
      G3 G3:0.5 E3 C3:0.5 D3:1.5 C3:1.5`),
    source: mutopia('oatsandbeans', 'Hele sanglegens melodistemme fra English County Songs. Lagt én oktav ned; klaverledsagelse og tekst er udeladt.'),
  },
  {
    id: 'dejlig-er-jorden', title: 'Dejlig er jorden', subtitle: 'Schlesisk salmemelodi', category: 'Salmer',
    composer: 'Traditionel schlesisk melodi', key: { tonic: 5, mode: 'major', label: 'F-dur' }, timeSignature: [2, 2], tempo: 84,
    events: notes(`F3:2 F3 F3 G3 E3 F3:2 A3:1.5 A3:0.5 A3 A3 Bb3 G3 A3:2
      C4:2 F4 D4 C4:2 Bb3 A3 Bb3:2 A3:2 G3:4
      C4:2 D4 C4 C4 A3 Bb3:2 Bb3:2 C4 Bb3 Bb3 G3
      A3 A3 A3 A3 C4 Bb3 A3:2 G3:2 F3:4`),
    source: mutopia('crusaders_hymn', 'Hele melodistemmen fra Crusader’s Hymn / Fairest Lord Jesus, samme schlesiske melodi som Dejlig er jorden. Richard S. Willis-udgaven, lagt én oktav ned. Lokale rytmevarianter kan forekomme.'),
  },
  {
    id: 'first-noel', title: 'The First Noel', subtitle: 'Traditionel julesalme', category: 'Salmer',
    composer: 'Traditionel engelsk melodi', key: { tonic: 2, mode: 'major', label: 'D-dur' }, timeSignature: [3, 4], tempo: 90,
    events: notes(`F#3:0.5 E3:0.5 D3:1.5 E3:0.5 F#3:0.5 G3:0.5 A3:2 B3:0.5 C#4:0.5
      D4 C#4 B3 A3:2 B3:0.5 C#4:0.5 D4 C#4 B3 A3 B3 C#4 D4 A3 G3 F#3:2
      F#3:0.5 E3:0.5 D3:1.5 E3:0.5 F#3:0.5 G3:0.5 A3:2 B3:0.5 C#4:0.5
      D4 C#4 B3 A3:2 B3:0.5 C#4:0.5 D4 C#4 B3 A3 B3 C#4 D4 A3 G3 F#3:2
      F#3:0.5 E3:0.5 D3:1.5 E3:0.5 F#3:0.5 G3:0.5 A3:2 D4:0.5 C#4:0.5
      B3:2 B3 A3:2 A3 D4 C#4 B3 A3 B3 C#4 D4 A3 G3 F#3:2`),
    source: mutopia('first_noel', 'Hele melodistemmen inklusive gentaget versdel og omkvæd. Kilden er lagt én oktav ned for guitaren. Optakten bevares.'),
  },
  {
    id: 'greensleeves', title: 'Greensleeves', subtitle: 'Engelsk traditional', category: 'Traditionals',
    composer: 'Traditionel engelsk melodi', key: { tonic: 4, mode: 'minor', label: 'E-mol' }, timeSignature: [6, 8], tempo: 80,
    events: notes(`E3:0.5 G3 A3:0.5 B3:0.75 C4:0.25 B3:0.5 A3 F#3:0.5 D3:0.75 E3:0.25 F#3:0.5
      G3 E3:0.5 E3:0.75 D#3:0.25 E3:0.5 F#3:1.5 B2 E3:0.5
      G3 A3:0.5 B3:0.75 C4:0.25 B3:0.5 A3 F#3:0.5 D3:0.75 E3:0.25 F#3:0.5
      G3:0.75 F#3:0.25 E3:0.5 D#3:0.75 C#3:0.25 D#3:0.5 E3:1.5 E3 R:0.5
      D4:1.5 D4:0.75 C#4:0.25 B3:0.5 A3 F#3:0.5 D3:0.75 E3:0.25 F#3:0.5
      G3 E3:0.5 E3:0.75 D#3:0.25 E3:0.5 F#3 D#3:0.5 B2 R:0.5
      D4:1.5 D4:0.75 C4:0.25 B3:0.5 A3 F#3:0.5 D3:0.75 E3:0.25 F#3:0.5
      G3:0.75 F#3:0.25 E3:0.5 D#3:0.75 C#3:0.25 D#3:0.5 E3:1.5 E3`),
    source: mutopia('greensleeves', 'Hele melodistemmen i Steve Dunlops public domain-udgave. Lagt én oktav ned; optakt, punkteringer, pauser og kromatiske toner er bevaret. Kildens afsluttende usynlige afstandsnode er udeladt.'),
  },
  {
    id: 'au-clair-de-la-lune', title: 'Au clair de la lune', subtitle: 'Fransk børnesang', category: 'Børnesange',
    composer: 'Traditionel fransk melodi', key: { tonic: 0, mode: 'major', label: 'C-dur' }, timeSignature: [4, 4], tempo: 80,
    events: notes(`C4:0.5 C4:0.5 C4:0.5 D4:0.5 E4 D4 C4:0.5 E4:0.5 D4:0.5 D4:0.5 C4:2
      C4:0.5 C4:0.5 C4:0.5 D4:0.5 E4 D4 C4:0.5 E4:0.5 D4:0.5 D4:0.5 C4:2
      D4:0.5 D4:0.5 D4:0.5 D4:0.5 A3 A3 D4:0.5 C4:0.5 B3:0.5 A3:0.5 G3:2
      C4:0.5 C4:0.5 C4:0.5 D4:0.5 E4 D4 C4:0.5 E4:0.5 D4:0.5 D4:0.5 C4:2`),
    source: {
      title: 'Wikilivres · Au clair de la Lune, LilyPond-eksempel',
      url: 'https://fr.wikibooks.org/wiki/Introduction_%C3%A0_LilyPond/Partition_de_chant_et_grille_d%27accords',
      edition: 'Hele melodien i C-dur, otte takter i 4/4. Begge indledende gennemspilninger er med. Kildens tonehøjder og varigheder er bevaret; tekst og akkorder er udeladt.',
      license: 'Public domain-melodi · Wikilivres CC BY-SA', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
  },
  {
    id: 'ode-to-joy', title: 'Ode til glæden', subtitle: 'Ode to Joy · tema fra Beethovens 9. symfoni', category: 'Traditionals',
    composer: 'Ludwig van Beethoven', key: { tonic: 0, mode: 'major', label: 'C-dur' }, timeSignature: [4, 4], tempo: 100,
    events: notes(`E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:0.5 D4:2
      E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2
      D4 D4 E4 C4 D4 E4:0.5 F4:0.5 E4 C4 D4 E4:0.5 F4:0.5 E4 D4 C4 D4 G3:2
      E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2`),
    source: {
      title: 'Piano Play / Still Coding · Ode to Joy, melodistemme',
      url: 'https://piano-play.still-coding.com/en/library/ode/',
      edition: 'Det fulde, kendte tema på 16 takter i C-dur, kontrolleret mod kildens højrehåndsstemme. Dette er temaet, ikke hele symfonisatsen. Ingen ledsagelse; tonehøjder og rytmer bevares.',
      license: 'Public domain-komposition · egen indtastning af temaet', licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    },
  },
  {
    id: 'amazing-grace', title: 'Amazing Grace', subtitle: 'New Britain · amerikansk salmemelodi', category: 'Salmer',
    composer: 'Traditionel amerikansk melodi', key: { tonic: 0, mode: 'major', label: 'C-dur' }, timeSignature: [3, 4], tempo: 80,
    events: notes(`G3 C4:2 E4:0.5 C4:0.5 E4:2 D4 C4:2 A3 G3:2 G3
      C4:2 E4:0.5 C4:0.5 E4:2 D4:0.5 E4:0.5 G4:2 D4:0.5 E4:0.5
      G4:2 E4:0.5 C4:0.5 E4:2 E4:0.5 D4:0.5 C4:2 A3 G3:2 G3
      C4:2 E4:0.5 C4:0.5 E4:2 D4 C4:2`),
    source: {
      title: 'Wikipedia · Sacred Harp, nodeeksempel med den kendte Amazing Grace-melodi',
      url: 'https://en.wikipedia.org/wiki/Sacred_Harp#Origins_of_the_music',
      edition: 'Hele melodien i artiklens første Amazing Grace-nodeeksempel, inklusive optakt og ottendedele. Den øverste melodistemme er lagt én oktav ned for guitaren; harmonistemmerne er udeladt.',
      license: 'Public domain-melodi · Wikipedia CC BY-SA', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
  },
  {
    id: 'glade-jul', title: 'Glade jul', subtitle: 'Stille Nacht / Silent Night', category: 'Salmer',
    composer: 'Franz Xaver Gruber', key: { tonic: 7, mode: 'major', label: 'G-dur' }, timeSignature: [3, 4], tempo: 72,
    events: notes(`D4:1.5 E4:0.5 D4 B3:3 D4:1.5 E4:0.5 D4 B3:3
      A4:2 A4 F#4:3 G4:2 G4 D4:3 E4:2 E4 G4:1.5 F#4:0.5 E4
      D4:1.5 E4:0.5 D4 B3:3 E4:2 E4 G4:1.5 F#4:0.5 E4 D4:1.5 E4:0.5 D4 B3:3
      A4:2 A4 C5:1.5 A4:0.5 F#4 G4:2 G4 B4:3 G4 D4 B3 D4:1.5 C4:0.5 A3 G3:3`),
    source: {
      title: 'Mutopia · Stille Nacht, Daniel Widyantos guitarudgave',
      url: 'https://www.mutopiaproject.org/ftp/GruberFX/stille-nacht/stille-nacht.ly',
      edition: 'Hele melodistemmen fra Daniel Widyantos udgave, lagt én oktav ned. Det afsluttende G er hentet fra slutakkorden, hvor kildens separate melodistemme er ophørt. Ingen klaver- eller guitarledsagelse; 72 BPM er øvetempoet.',
      license: 'Public domain-komposition · nodeudgave CC BY-SA 2.0, Daniel Widyanto', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    },
  },
  {
    id: 'ingen-er-saa-tryg', title: 'Ingen er så tryg i fare', subtitle: 'Tryggare kan ingen vara', category: 'Salmer',
    composer: 'Traditionel svensk melodi', key: { tonic: 2, mode: 'major', label: 'D-dur' }, timeSignature: [3, 4], tempo: 96,
    events: notes(`D4:0.5 E4:0.5 F#4 F#4 A4:0.5 F#4:0.5 F#4 E4 E4:0.5 F#4:0.5
      G4 B4 A4:0.5 G4:0.5 G4 F#4 D4:0.5 D4:0.5
      B4 B4 D5:0.5 B4:0.5 B4 A4 F#4:0.5 A4:0.5
      A4 G4 C#4:0.5 E4:0.5 E4 D4`),
    source: mutopia('tryggare_kan_ingen_vara', 'Hele sopranens melodistemme fra Steve Dunlops udgave, samme melodi som Ingen er så tryg i fare. Optakt, tonehøjder og rytmer bevares; kildens usynlige slutafstand og harmonistemmer er udeladt. 96 BPM er øvetempoet.'),
  },
  {
    id: 'holly-and-ivy', title: 'The Holly and the Ivy', subtitle: 'Engelsk julesang', category: 'Salmer',
    composer: 'Traditionel engelsk melodi', key: { tonic: 5, mode: 'major', label: 'F-dur' }, timeSignature: [3, 4], tempo: 100,
    events: notes(`F4 F4:0.5 F4:0.5 F4 D5 C5 A4:1.5 F4:0.5
      F4:0.5 F4:0.5 F4 D5 C5:2 C5:0.5 Bb4:0.5
      A4:0.5 G4:0.5 F4 A4:0.5 A4:0.5 D4:0.5 D4:0.5 C4 F4:0.5 G4:0.5
      A4:0.5 Bb4:0.5 A4 G4 F4:2
      F4 F4:0.5 F4:0.5 F4 D5 C5 A4:1.5 F4:0.5
      F4:0.5 F4:0.5 F4 D5 C5:2 C5:0.5 Bb4:0.5
      A4:0.5 G4:0.5 F4 A4 D4:0.5 D4:0.5 C4 F4:0.5 G4:0.5
      A4:0.5 Bb4:0.5 A4 G4 F4:2`),
    source: mutopia('thehollyandtheivy', 'Et helt vers med omkvæd fra Geoffrey Lehrs nodeudgave. De oprindelige tonehøjder og optakten bevares. Sluttens gentagelsestegn henviser til flere vers; her spilles vers og omkvæd én gang uden tekst.'),
  },
  {
    id: 'terra-beata', title: "This Is My Father's World", subtitle: 'Terra Beata · engelsk salmemelodi', category: 'Salmer',
    composer: 'Traditionel engelsk melodi / Franklin L. Sheppard', key: { tonic: 3, mode: 'major', label: 'E♭-dur' }, timeSignature: [4, 4], tempo: 92,
    events: notes(`Eb4:0.5 F4:0.5 G4 Bb4 G4 F4 Eb4:3 F4:0.5 G4:0.5
      Ab4 C5 Bb4 G4 F4:3 C5 Bb4 G4 G4 F4:0.5 Eb4:0.5 G4 F4 Eb4 Bb3
      Eb4:0.5 F4:0.5 G4 Bb4 F4:0.5 G4:0.5 Eb4:3
      Bb4 Eb5 Bb4 C5 D5 Eb5:3 Eb5:0.5 D5:0.5 C5 Eb5 D5 C5 Bb4:3 C5:0.5 C5:0.5
      Bb4 G4 G4 F4:0.5 Eb4:0.5 G4 F4 Eb4 Bb3 Eb4:0.5 F4:0.5 G4:0.5 G4:0.5 Bb4 F4:0.5 G4:0.5 Eb4:3`),
    source: mutopia('terra_beata', 'Hele melodistemmen fra Steve Dunlops udgave af Terra Beata. Tonehøjder, optakt og rytmer fra LilyPond-stemmen bevares; harmonistemmer og usynlig slutafstand er udeladt. 92 BPM er øvetempoet.'),
  },
];
