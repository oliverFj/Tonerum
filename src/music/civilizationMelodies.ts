import type { Melody, MelodyEvent } from './types';
import { notes } from './folkMelodies';

export const MUSIC_RIGHTS_SOURCE = 'https://kum.dk/kulturomraader/ophavsret/musik';
const abc = (path: string) => `https://abcnotation.com/tunePage?a=${encodeURIComponent(path)}`;
const part = (label: string, text: string): MelodyEvent[] => notes(text).map((event, index) =>
  index ? event : { ...event, phraseStart: label });
const source = (title: string, url: string, edition: string): Melody['source'] => ({
  title, url, edition: `${edition} Enstemmig grundmelodi til øvning; ikke en transskription af spillets arrangement. Øvetempoet er målt i fjerdedele/minut.`,
  license: 'Fri grundmelodi · egen indtastning uden tekst eller akkompagnement',
  licenseUrl: MUSIC_RIGHTS_SOURCE,
});

const kalinkaA = `B3 A3 F#3:0.5 G3:0.5 A3 F#3:0.5 G3:0.5 A3 G3:0.5 F#3:0.5 E3 B3:0.5 B3:0.5
  A3:0.75 G3:0.25 F#3:0.5 G3:0.5 A3 F#3:0.5 G3:0.5 A3 G3:0.5 F#3:0.5 E3`;
const tourdionA = `E3 F#3 G3 A3 G3 F#3 E3:3 F#3 G3 A3 B3 A3 G3 G3 A3 F#3 G3:2 F#3 E3 D3:2
  E3 F#3 G3 A3 G3 F#3 E3:2 G3:2 F#3:2 E3:4 D3:2 E3:6`;
const tourdionB = `B3:3 A3 B3 C4 B3:4 B3:2 D4 C4 B3 A3 G3 F#3 G3:3 F#3 E3:2
  B3:3 A3 B3 C4 B3:2 A3 G3 F#3:2 E3:4 D3:2 E3:6`;

const germanEnding = `F3:0.5 G3 G3:0.5 E3 D3:0.5 D4:1.5 Bb3 G3:0.5
  F3:0.75 E3:0.25 D3:0.5 E3:0.75 D3:0.25 C#3:0.5 D3:1.5 R:1`;

const brejeiroIntro = `A2:0.5 E3:0.25 E2:0.25 C#3:0.5 E3:0.25 E2:0.25
  B2:0.5 E3:0.25 E2:0.25 D3:0.5 E3:0.25 E2:0.25
  A2:0.5 E3:0.25 E2:0.25 C#3:0.5 E3:0.25 E2:0.25
  B2:0.5 E3:0.25 E2:0.25 D3:0.5 E3:0.25 E2:0.25`;
const brejeiroA = `R:0.5 A3:0.5 F#3:0.5 F#3:0.5
  G#3:0.75 G#3:0.25 R:0.25 E3:0.5 E3:0.25
  F#3:0.5 F#3:0.5 C#3:0.5 C#3:0.5 E3:0.75 E3:0.25 R:0.5 E3:0.5
  R:0.5 A3:0.5 F#3:0.5 F#3:0.5 G#3:0.75 G#3:0.25 R:0.25 E3:0.5 E3:0.25
  F#3:0.5 F#3:0.5 C#3:0.5 C#3:0.5 E3:0.75 E3:0.25 R:0.5 E3:0.5
  R:0.5 C#4:0.5 G#3:0.5 G#3:0.5 B3:0.25 A3:0.5 G#3:0.25 F#3:0.25 F3:0.5 F#3:0.25
  R:0.5 B3:0.5 F#3:0.5 F#3:0.5 A3:0.25 G#3:0.5 F#3:0.25 E3:0.25 D#3:0.5 E3:0.25
  R:0.5 A3:0.5 R:0.25 G#3:0.5 F#3:0.25 E3:0.25 D3:0.5 C#3:0.25 B2:0.25 A#2:0.5 B2:0.25
  E3:0.75 E3:0.25 R:0.25 B2:0.5 C#3:0.25 A2:0.25 C#3:0.5 E3:0.25 A3:0.25 C#4:0.5 E4:0.25`;
const brejeiroB = `A4:0.5 A4:0.5 F#4:0.5 F#4:0.5 G#4:0.75 G#4:0.5 E4:0.5 E4:0.25
  F#4:0.5 F#4:0.5 C#4:0.5 C#4:0.5 E4:0.75 E3:0.25 E3
  R:0.5 A4:0.5 F#4:0.5 F#4:0.5 G#4:0.75 G#4:0.5 E4:0.5 E4:0.25
  F#4:0.5 F#4:0.5 C#4:0.5 C#4:0.5 E4:0.75 E3:0.25 E3
  R:0.5 C#5:0.5 G#4:0.5 G#4:0.5 B4:0.25 A4:0.5 G#4:0.25 F#4:0.25 F4:0.5 F#4:0.25
  R:0.5 B4:0.5 F#4:0.5 F#4:0.5 A4:0.25 G#4:0.5 F#4:0.25 E4:0.25 D#4:0.5 E4:0.25
  R:0.5 A4:0.5 R:0.25 G#4:0.5 F#4:0.25 E4:0.25 D4:0.5 C#4:0.25 B3:0.25 A#3:0.5 B3:0.25
  R:0.5 E4:0.5 R:0.25 B3:0.5 C#4:0.25`;
const brejeiroTrio = `E4:0.25 D#4:0.5 C#4:0.25 B3:0.5 C#4:0.5 D#4:0.25 C#4:0.5 B3:0.25 A3:0.25 G#3:0.5 F#3:0.25
  E3:0.25 D#3:0.5 C#3:0.25 B2:0.5 C#3:0.5 E3 R:0.5 B3:0.5
  E4:0.25 D#4:0.5 C#4:0.25 B3:0.5 C#4:0.5 D#4:0.25 D#5:0.5 C#5:0.25 B4:0.25 A#4:0.5 G#4:0.25
  G4:0.25 E4:0.5 D#4:0.25 C#4:0.25 B3:0.5 A#3:0.25
  G#3:0.25 A3:0.5 A#3:0.25 B3:0.25 C#4:0.5 D#4:0.25
  E4:0.25 D#4:0.5 C#4:0.25 B3:0.5 C#4:0.5 D#4:0.25 C#4:0.5 B3:0.25 A3:0.25 G#3:0.5 F#3:0.25
  E3:0.25 D#3:0.5 C#3:0.25 B2:0.5 C#3:0.5 E3 R:0.5 B3:0.5
  G#4:0.25 A4:0.5 G4:0.25 G#4:0.25 D4:0.5 D#4:0.25
  F#4:0.25 E4:0.5 C#4:0.25 D#4:0.25 C#4:0.5 A3:0.25
  G#3:0.25 A3:0.5 A#3:0.25 B3:0.25 C#4:0.5 D#4:0.25 E4 E5`;

// Six principal melody pitches per bar, in sounding guitar pitch. Each is
// sustained for an eighth note instead of repeating the tremolo's 32nd notes.
// Passing ornaments and the thumb accompaniment are deliberately omitted.
const alhambraA = `E4 E4 E4 E4 D4 D4 | C4 C4 C4 C4 D4 D4 | E4 E4 E4 E4 E4 E4 | E4 E4 E4 E4 F4 F4 |
  G4 G4 G4 G4 F4 F4 | E4 E4 E4 E4 F4 F4 | G4 G4 G4 G4 G4 G4 | G4 G4 G4 G4 G4 G4 |
  C5 C5 C5 C5 B4 B4 | A4 A4 A4 A4 B4 B4 | A4 A4 G#4 G#4 G#4 G#4 | G#4 G#4 G#4 G#4 G#4 G#4 |
  Bb4 Bb4 Bb4 Bb4 A4 A4 | G4 G4 G4 G4 A4 A4 | G4 G4 F4 F4 F4 F4 | F4 F4 F4 F4 F4 F4 |
  E4 E4 E4 E4 D4 D4 | C4 C4 C4 C4 D4 D4 | C4 C4 B3 B3 B3 B3 | B3 B3 B3 B3 B3 B3`;
const alhambraB = `E4 E4 E4 E4 D4 D4 | C#4 C#4 C#4 C#4 D4 D4 | E4 E4 E4 E4 E4 E4 | E4 E4 E4 E4 E4 E4 |
  F#4 F#4 F#4 F#4 F#4 F#4 | D5 D5 D5 D5 F#4 F#4 | F#4 F#4 E4 E4 E4 E4 | E4 E4 E4 E4 E4 E4 |
  A4 A4 A4 A4 A4 A4 | G#4 G#4 G#4 G#4 D#4 D#4 | F#4 F#4 E4 E4 E4 E4 | E4 E4 E4 E4 E4 E4 |
  D4 D4 D4 D4 D4 D4 | C#4 C#4 C#4 C#4 B3 B3 | B3 B3 A3 A3 A3 A3`;
const alhambraCoda = `A3 A3 A3 A3 A3 A3 | A3 A3 A3 A3 A3 A3 | B3 B3 C4 C4 D4 D4 |
  E4 E4 E4 E4 E4 E4 | E4 E4 E4 E4 E4 E4 | E4 E4 E4 E4 E4 E4 | D4 D4 C#4 C#4 B3 B3 |
  A3 A3 A3 A3 A3 A3 | A3 A3 A3 A3 A3 A3 | A3 A3 A3 A3 A3 A3 | B3 B3 C4 C4 D4 D4 |
  E4 E4 E4 E4 E4 E4 | E4 E4 E4 E4 E4 E4 | G#4 G#4 G#4 G#4 G#4 G#4 |
  F#4 F#4 E4 E4 D4 D4 | C#4 C#4 C#4 C#4 C#4 C#4 | C#4 C#4 C#4 C#4 C#4 C#4 | C#4 C#4 C#4 C#4 C#4 C#4`;
function sustainedTremolo(label: string, text: string): MelodyEvent[] {
  return text.split('|').flatMap((bar, barIndex) => {
    const events = notes(bar.trim().split(/\s+/).map(note => `${note}:0.5`).join(' '));
    const sustained: MelodyEvent[] = [];
    for (const event of events) {
      const previous = sustained.at(-1);
      if (previous?.type === 'note' && event.type === 'note' && previous.midi === event.midi) previous.duration += event.duration;
      else sustained.push({ ...event });
    }
    if (!barIndex) sustained[0].phraseStart = label;
    return sustained;
  });
}

export const CIVILIZATION_MELODIES: Melody[] = [
  {
    id: 'civ-brazil', category: 'Civilization VI', title: 'Brasilien · Brejeiro', subtitle: 'Brasiliansk tango · enstemmig melodi',
    composer: 'Ernesto Nazareth (1863–1934)', key: { tonic: 9, mode: 'major', label: 'A-dur / E-dur' }, timeSignature: [2, 4], tempo: 72,
    events: [...part('Indledning', brejeiroIntro), ...part('A · Første tema', brejeiroA), ...part('B · Højt register', brejeiroB),
      ...part('Overgang', 'A3 R:0.5 B3:0.5'), ...part('C · E-dur', brejeiroTrio),
      ...part('D.C. · Indledning igen', brejeiroIntro), ...part('A · Tilbage til første tema', brejeiroA),
      ...part('B · Tilbage til højt register', brejeiroB), ...part('Coda', 'A3 A4')],
    source: source('Instituto Moreira Salles · Ernesto Nazareth 150 anos, Brejeiro', 'https://ernestonazareth150anos.com.br/Works/view/31',
      'Hele melodiforløbet med indledning, temaer, trio, D.C. og coda. Indtastet efter melodinodearket (Paulo Aragão og Marcílio Lopes, 2012) på komponistarkivet. Lagt én oktav ned for guitaren. Kun melodistemmen; akkorder og ledsagelse er udeladt. Sammenbundne toner er samlet. E♯ og F-dobbeltkryds/C-dobbeltkryds vises som klingende F og G/D.'),
  },
  {
    id: 'civ-china', category: 'Civilization VI', title: 'Kina · Mo Li Hua', subtitle: 'Jasminblomsten · kinesisk folkemelodi',
    composer: 'Traditionel kinesisk melodi', key: { tonic: 5, mode: 'major', label: 'F-dur' }, timeSignature: [4, 4], tempo: 76,
    events: [
      ...part('A · Jasminblomsten', `A3 A3:0.5 C4:0.5 D4:0.5 F4:0.5 F4:0.5 D4:0.5 C4 C4:0.5 D4:0.5 C4:2
        A3 A3:0.5 C4:0.5 D4:0.5 F4:0.5 F4:0.5 D4:0.5 C4 C4:0.5 D4:0.5 C4:2
        C4 C4 C4 A3:0.5 C4:0.5 D4 D4 C4:2
        A3 G3:0.5 A3:0.5 C4 A3:0.5 G3:0.5 F3 F3:0.5 G3:0.5 F3:2`),
      ...part('B · Anden del', `A3:0.5 G3:0.5 F3:0.5 A3:0.5 G3:1.5 A3:0.5 C4 D4:0.5 F4:0.5 C4:2
        G3 A3:0.5 C4:0.5 G3:0.5 A3:0.5 F3:0.5 D3:0.5 C3:2`),
      ...part('C · Slutning', `D3 D3:0.5 F3:0.5 G3:1.5 A3:0.5 F3:0.5 G3:0.5 F3:0.5 D3:0.5 C3:2
        D3 D3:0.5 F3:0.5 G3:1.5 A3:0.5 F3:0.5 G3:0.5 F3:0.5 D3:0.5 F3:2`),
    ],
    source: { title: 'Pierre Dragicevic (Dragice) · Molihua, Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Molihua.png',
      edition: 'Hele den viste melodivariant: 16 takter, herunder én takt i 2/4 (62 fjerdedelsslag i alt). Egen indtastning lagt én oktav ned for guitar. Ingen tekst eller ledsagelse; buer er frasering. Grundtonen er F; kilden har ingen faste fortegn eller tempoangivelse. 76 fjerdedele/minut er det valgte øvetempo. Ikke spillets arrangement.',
      license: 'CC BY 2.5 · nodeudgave af Pierre Dragicevic; transponeret indtastning', licenseUrl: 'https://creativecommons.org/licenses/by/2.5/' },
  },
  {
    id: 'civ-germany', category: 'Civilization VI', title: 'Tyskland · Ich hab die Nacht geträumet', subtitle: 'Tysk folkevise',
    composer: 'Traditionel melodi · trykt hos C. F. Nicolai i 1777', key: { tonic: 2, mode: 'minor', label: 'D-mol' }, timeSignature: [6, 8], tempo: 76,
    events: [...part('A · Første del', `A2:0.5 D3 E3:0.5 F3:0.75 E3:0.25 D3:0.5 A3:1.5 E3 G3:0.5
      F3:0.75 E3:0.25 D3:0.5 C#3 D3:0.5 E3:1.5 R:1`),
      ...part('B · Anden del', germanEnding), ...part('B · Gentagelse', germanEnding)],
    source: source('Lieder-Archiv · Ich hab die Nacht geträumet, melodistemme', 'https://www.lieder-archiv.de/ich_hab_die_nacht_getraeumet-notenblatt_300265.html',
      'Hele den traditionelle melodistemme, A–B–B med optakter og pauser, lagt én oktav ned. Kildens akkorder og tekst er udeladt.'),
  },
  {
    id: 'civ-sweden-helan', category: 'Civilization VI', title: 'Sverige · Helan går', subtitle: 'Svensk snapsvise',
    composer: 'Traditionel svensk melodi', key: { tonic: 2, mode: 'major', label: 'D-dur' }, timeSignature: [4, 4], tempo: 100,
    events: [...part('A · Helan går', `F#3 A3 D3:1.5 F#3:0.5 E3:0.5 E3:0.25 E3:0.25 E3:0.5 E3:0.5 F#3:0.5 D3:0.5 D3
      F#3 A3 D3:1.5 F#3:0.5 E3:0.5 E3:0.25 E3:0.25 E3:0.5 E3:0.5 D3 R:0.5 D3:0.5`),
      ...part('B · Anden del', `E3:0.5 A2:0.5 A2:0.5 A2:0.5 F#3:0.5 D3:0.5 D3
        E3:0.5 A2:0.5 A2:0.5 A2:0.5 F#3:0.5 D3:0.5 D3
        F#3 A3 D4 R:0.5 D4:0.5 C#4:0.5 C#4:0.25 C#4:0.25 C#4:0.5 C#4:0.5 D4 R`)],
    source: source('Riimiriihi · Helan går, ABC og noder i D-dur', 'https://riimiriihi.kapsi.fi/data/87/Helan_g%C3%A5r.pdf',
      'Hele den traditionelle melodistemme: otte takter. Kontrolleret mod kildens ABC; lagt én oktav ned, uden akkorder og tekst. Fermaten bruger den noterede varighed.'),
  },
  {
    id: 'civ-hungary', category: 'Civilization VI', title: 'Ungarn · Hej Dunáról fúj a szél', subtitle: 'Ungarsk folkemelodi',
    composer: 'Traditionel ungarsk melodi', key: { tonic: 7, mode: 'minor', label: 'G-mol' }, timeSignature: [2, 4], tempo: 88,
    events: [...part('A · Første del', `G4:0.5 G4:0.5 F4:0.5 D4:0.5 G4:0.5 G4:0.5 F4
      G4:0.5 G4:0.5 F4:0.5 D4:0.5 G4:0.5 G4:0.5 F4
      G4:0.5 D4 C4:0.5 D4:0.5 D4:0.5 D4`),
      ...part('B · Anden del', `C4:0.5 C4:0.5 Bb3:0.5 G3:0.5 C4:0.5 C4:0.5 Bb3
        C4:0.5 C4:0.5 Bb3:0.5 G3:0.5 C4:0.5 C4:0.5 Bb3
        C4:0.5 G3 F3:0.5 G3:0.5 G3:0.5 G3`)],
    source: source('MTA Zenetudományi Intézet · Magyar népdaltípusok példatára, 17-005-00-00x', 'https://www.nepzeneipeldatar.hu/bongeszes/index.php?pid=458',
      'Hele den viste traditionelle typemelodi: seks linjer med to takter hver, lagt én oktav ned. Egen meloditransskription uden tekst, arkivindspilning eller akkompagnement.'),
  },
  {
    id: 'civ-japan', category: 'Civilization VI', title: 'Japan · Itsuki no Komoriuta', subtitle: 'Vuggevise fra Itsuki · grundmelodi',
    composer: 'Traditionel japansk melodi', key: { tonic: 9, mode: 'minor', label: 'A-mol' }, timeSignature: [3, 4], tempo: 72,
    events: part('Hele grundmelodien', `E3:0.5 A3:1.5 B3:0.5 C4:0.5 E4:0.5 A3:1.5 B3:0.5 C4:0.5 E4:0.5
      E4:1.5 C4:0.5 E4:0.5 F4:0.5 E4 R:0.5 C4:0.5 E4:0.5 F4:0.5
      A4 F4 E4 C4:0.5 B3:0.5 A3 C4:0.5 B3:0.5 A3 G3:0.5 E3:0.5 A3:3`),
    source: { ...source('Breizh Partitions · Itsuki no Komoriuta, nodeudgave H. M.', 'https://www.celticscores.com/sheet-music/458_Itsuki_no_Komoriuta_(Itsuki_Lullaby)',
      'Hele den første, uudsmykkede Andante-melodigennemspilning i A-mol, fra E-optakten til den første lange A-sluttone. Én oktav ned. Den todelte takt før slutningen bevares i varighederne. Klaverindledning, mellemspil, variationer og transponeret gentagelse er udeladt.'),
      license: 'Public domain ifølge Breizh Partitions · traditionel grundmelodi', licenseUrl: 'https://www.celticscores.com/sheet-music/458_Itsuki_no_Komoriuta_(Itsuki_Lullaby)' },
  },
  {
    id: 'civ-spain', category: 'Civilization VI', title: 'Spanien · Recuerdos de la Alhambra (uden tremolo)', subtitle: 'Forenklet melodistemme · uden tremolo og bas',
    composer: 'Francisco Tárrega (1852–1909)', key: { tonic: 9, mode: 'minor', label: 'A-mol / A-dur' }, timeSignature: [3, 4], tempo: 74,
    events: [...sustainedTremolo('A · Mol', alhambraA), ...sustainedTremolo('A · Gentagelse', alhambraA),
      ...sustainedTremolo('B · Dur', alhambraB), ...sustainedTremolo('B · Første slutning', 'A3 A3 A3 B3 C#4 D4'),
      ...sustainedTremolo('B · Gentagelse', alhambraB), ...sustainedTremolo('B · Anden slutning', 'A3 A3 A3 B3 C4 D4'),
      ...sustainedTremolo('C · Coda', alhambraCoda), ...part('Afslutning', 'A2:0.5 E3:0.5 A3:0.5 C#4:0.5 E4:0.5 A4:0.5 E5:3 A2:3')],
    source: { title: 'Stewart Holmes · Mutopia, Recuerdos de la Alhambra', url: 'https://www.mutopiaproject.org/ftp/TarregaF/recuerdos/recuerdos-lys/recuerdos-a4.ly',
      edition: 'Selvstændig forenkling af hele den melodiske form med gentagelser, begge voltaslutninger og coda. Tremoloens tre gentagne toner erstattes af én holdt meloditone pr. ottendedelsgruppe; bas, ledsagelse og korte ornamenter er udeladt. Slutakkorderne repræsenteres af deres øverste tone. Klingende guitaroktav bevares. 74 fjerdedele/minut følger kildefilens MIDI-tempo. Øvelsen er ikke det fulde klassiske guitararrangement.',
      license: 'CC BY-SA 3.0 · Stewart Holmes; forenklet melodistemme under samme licens', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  },
  {
    id: 'civ-england', category: 'Civilization VI', title: 'England · Scarborough Fair',
    subtitle: 'Traditionel melodivariant i e-dorisk', composer: 'Traditionel engelsk melodi',
    key: { tonic: 4, mode: 'minor', label: 'E-dorisk', intervals: [0, 2, 3, 5, 7, 9, 10] }, timeSignature: [3, 4], tempo: 84,
    events: [
      ...part('A · Scarborough Fair', `E3:2 E3 B3:2 B3 F#3:1.5 G3:0.5 F#3 E3:4 B3 D4 E4:2 D4 B3 C#4 A3 B3:5 E4`),
      ...part('B · Remember me', `E4:2 E4 D4:2 B3 B3 A3 G3 F#3 D3:5 E3:2 B3 A3:2 G3 F#3 E3 D3 E3:6`),
    ],
    source: source('The Session · Scarborough Fair, setting 1 (ABC)', abc('thesession.org/tunes/7522.no-ext/0001'),
      'Hele versets 19 takter i e-dorisk, én gennemspilning. Kildens melodistemme er lagt én oktav ned. Sammenbundne ens toner er samlet; frasering er vejledende. Dorisk har C♯, hvor naturlig e-mol har C.'),
  },
  {
    id: 'civ-russia', category: 'Civilization VI', title: 'Rusland · Kalinka', subtitle: 'Omkvæd og vers',
    composer: 'Ivan Larionov (1830–1889)', key: { tonic: 4, mode: 'minor', label: 'E-mol' }, timeSignature: [2, 4], tempo: 88,
    events: [
      ...part('A · Omkvæd', kalinkaA), ...part('A · Gentagelse', kalinkaA),
      ...part('Overgang', 'E4:2 D4:2'),
      ...part('B · Vers', `B3:0.5 D4:0.5 C4:0.5 B3:0.25 A3:0.25 G3 D3
        B3:0.5 D4:0.5 C4:0.5 B3:0.25 A3:0.25 G3 D3 E3 E3:0.5 F#3:0.5 A3:0.5 G3:0.5 F#3:0.5 E3:0.5 D3 D3 D3 D4
        B3:0.5 D4:0.5 A3:0.5 B3:0.5 G3 D3 B3:0.5 D4:0.5 A3:0.5 B3:0.5 G3 D3
        E3 E3:0.5 F#3:0.5 A3:0.5 G3:0.5 F#3:0.5 E3:0.5 D4 C4 B3:2`),
    ],
    source: source('John Chambers · Kalinka i e-mol (ABC)', abc('trillian.mit.edu/~jc/music/abc/song/Kalinka_Em/0000'),
      'Hele ABC-formen: omkvæd to gange, overgang og vers. Lagt én oktav ned. Fermater spilles med deres noterede varighed; ingen automatisk accelerando.'),
  },
  {
    id: 'civ-korea', category: 'Civilization VI', title: 'Korea · Arirang', subtitle: 'Traditionel koreansk sang',
    composer: 'Traditionel koreansk melodi', key: { tonic: 7, mode: 'major', label: 'G-dur' }, timeSignature: [3, 4], tempo: 72,
    events: [
      ...part('A · Arirang', `D3:1.5 E3:0.5 D3:0.5 E3:0.5 G3:1.5 A3:0.5 G3:0.5 A3:0.5 B3 A3:0.3333333333333333 B3:0.3333333333333333 A3:0.3333333333333333 G3:0.5 E3:0.5 D3:1.5 E3:0.5 D3:0.5 E3:0.5
        G3:1.5 A3:0.5 G3:0.5 A3:0.5 B3:0.5 A3:0.5 G3:0.5 E3:0.5 D3:0.5 E3:0.5 G3:1.5 A3:0.5 G3 G3:3`),
      ...part('B · Anden del', `D4:2 D4 D4 B3 A3 B3 A3:0.3333333333333333 B3:0.3333333333333333 A3:0.3333333333333333 G3:0.5 E3:0.5 D3:1.5 E3:0.5 D3:0.5 E3:0.5
        G3:1.5 A3:0.5 G3:0.5 A3:0.5 B3:0.5 A3:0.5 G3:0.5 E3:0.5 D3:0.5 E3:0.5 G3:1.5 A3:0.5 G3 G3:3`),
    ],
    source: source('John Chambers · Arirang i G (ABC)', abc('trillian.mit.edu/~jc/music/abc/Korea/Arirang_G/0000'),
      'Hele melodivarianten, 16 takter uden gentagelsestegn. Lagt én oktav ned; trioler bevares.'),
  },
  {
    id: 'civ-greece', category: 'Civilization VI', title: 'Grækenland · Seikilos-epitafiet', subtitle: 'Antik melodi · moderne notation',
    composer: 'Seikilos · antikken', key: { tonic: 2, mode: 'major', label: 'D-dur / A-mixolydisk' }, timeSignature: [6, 8], tempo: 76,
    events: part('Hele epitafiet', `A3:0.5 E4 E4:1.5 C#4:0.5 D4:0.5 E4:0.5 D4:1.5
      C#4 D4:0.5 E4:0.5 D4:0.5 C#4:0.5 B3:0.5 A3 B3:0.5 G3
      A3:0.5 C#4:0.5 E4:0.5 D4:0.5 C#4:0.5 D4:0.5 C#4:0.5 A3 B3:0.5 G3
      A3:0.5 C#4:0.5 B3:0.5 D4:0.5 E4:0.5 C#4:0.5 A3:0.5 A3 A3:0.5 F#3:0.5 E3:0.5`),
    source: { ...source('Chinasaur · Seikilos score, LilyPond på Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Seikilos_score.png',
      'Hele transskriptionen, otte takter. Lagt én oktav ned fra den viste nodeudgave. Den antikke rytme gengives gennem kildens moderne fortolkning.'),
      license: 'Public domain · melodi og Chinasaur-nodeudgave', licenseUrl: 'https://commons.wikimedia.org/wiki/File:Seikilos_score.png' },
  },
  {
    id: 'civ-australia', category: 'Civilization VI', title: 'Australien · Waltzing Matilda', subtitle: 'Udbredt melodivariant · vers og omkvæd',
    composer: 'Marie Cowans melodivariant (1903), efter Christina Macpherson', key: { tonic: 2, mode: 'major', label: 'D-dur' }, timeSignature: [4, 4], tempo: 88,
    events: [
      ...part('A · Vers', `F#3:0.5 F#3:0.5 F#3:0.5 F#3:0.5 E3 E3 D3:0.5 E3:0.5 F#3:0.5 D3:0.5 B2:0.5 C#3:0.5 D3
        A2 D3:0.5 F#3:0.5 A3 A3:0.5 A3:0.5 A3:0.5 A3:0.5 A3 F#3 D3:0.5 E3:0.5
        F#3 F#3:0.5 F#3:0.5 E3 E3 D3:0.5 E3:0.5 F#3:0.5 D3:0.5 B2:0.5 C#3:0.5 D3
        A2 D3:0.5 F#3:0.5 A3 A3:0.5 A3:0.5 A3 G3:0.5 E3:0.5 D3:2`),
      ...part('B · Omkvæd', `A3 A3:0.5 A3:0.5 A3 F#3 D4 D4:0.5 D4:0.5 C#4 B3
        A3 A3:0.5 A3:0.5 B3 A3:0.5 A3:0.5 A3 G3:0.5 F#3:0.5 E3 D3:0.5 E3:0.5
        F#3 F#3:0.5 F#3:0.5 E3 E3:0.5 E3:0.5 D3:0.5 E3:0.5 F#3:0.5 D3:0.5 B2:0.5 C#3:0.5 D3
        A2 D3:0.5 F#3:0.5 A3 G3:0.5 F#3:0.5 E3 E3:0.5 E3:0.5 D3:2`),
    ],
    source: source('Digital Tradition / John Chambers · Waltzing Matilda (ABC)', abc('trillian.mit.edu/~jc/music/abc/mirror/back.numachi.com/Waltzing_Matilda/0000'),
      'Hele ABC-melodien: 16 takter i D-dur, lagt én oktav ned. Dette er den udbredte melodivariant; den er ikke verificeret som identisk med Civ VI-versionen.'),
  },
  {
    id: 'civ-france', category: 'Civilization VI', title: 'Frankrig · Quand je bois du vin clairet', subtitle: 'Tourdion · renæssancedans',
    composer: 'Anonym · udgivet af Pierre Attaingnant i 1500-tallet', key: { tonic: 4, mode: 'minor', label: 'E-mol' }, timeSignature: [3, 2], tempo: 160,
    events: [...part('A · Første del', tourdionA), ...part('A · Gentagelse', tourdionA),
      ...part('B · Anden del', tourdionB), ...part('B · Gentagelse', tourdionB)],
    source: source('Guido Gonzato · Tourdion, AbcPlus (sopranstemme)', abc('abcplus.sourceforge.net/Choral/Tourdion/0002'),
      'Sopranmelodien i AABB-form, 32 takter à seks fjerdedele. Lagt én oktav ned; de tre ledsagestemmer er udeladt. Kildens afsluttende D.C. er udeladt, så øvelsen slutter efter AABB. Kildens halvnode = 160 svarer til 320 fjerdedele/minut; øvelsen starter ved halv hastighed, 160 fjerdedele/minut.'),
  },
  {
    id: 'civ-scotland-bonnie', category: 'Civilization VI', title: 'Skotland · Bonnie Dundee', subtitle: 'Én af det skotske temas melodier',
    composer: 'Traditionel skotsk melodi', key: { tonic: 5, mode: 'major', label: 'F-dur' }, timeSignature: [6, 8], tempo: 96,
    events: [
      ...part('A · Bonnie Dundee', `A3:0.25 Bb3:0.25 C4:0.75 D4:0.25 C4:0.5 C4:0.75 D4:0.25 C4:0.5
        F4:0.5 E4:0.5 D4:0.5 C4:0.5 C4:0.5 Bb3:0.5 A3:0.5 C4:0.5 C3:0.5 A3:0.5 C4:0.5 C3:0.5 G3:0.75 G3:0.25 G3:0.5 G3 A3:0.25 Bb3:0.25
        C4:0.5 D4:0.5 C4:0.5 C4:0.5 D4:0.5 C4:0.5 F4:0.5 E4:0.5 D4:0.5 C4:0.5 C4:0.5 Bb3:0.5
        A3:0.5 C4:0.5 C3:0.5 G3:0.25 C4:0.75 C3:0.5 F3:0.75 F3:0.25 F3:0.5 F3 C3:0.5`),
      ...part('B · Anden del', `F3:0.5 F3:0.5 F3:0.5 F3:0.5 Bb3:0.5 A3:0.5 G3:0.5 C3:0.5 C3:0.5 C3 C3:0.5
        G3:0.5 G3:0.5 G3:0.5 G3:0.5 C4:0.5 Bb3:0.5 Bb3:0.5 A3:0.5 A3:0.5 A3 F3:0.5
        A3:0.5 G3:0.5 A3:0.5 Bb3 Bb3:0.5 C4:0.5 Bb3:0.5 C4:0.5 D4:0.5 C4:0.5 Bb3:0.5
        A3:0.5 C4:0.5 C3:0.5 G3:0.25 C4:0.75 C3:0.5 F3:0.75 F3:0.25 F3:0.5 F3 R:0.5`),
    ],
    source: source('Traditional Tune Archive · The Bonnets of Bonnie Dundee', abc('tunearch.org/wiki/Bonnie_Dundee_(2).no-ext/0003'),
      'Hele sangvarianten fra Graham, Songs of Scotland, side 372: optakt og 16 takter. Lagt én oktav ned. Fermaten bruger den noterede varighed.'),
  },
  {
    id: 'civ-america', category: 'Civilization VI', title: 'USA · Hard Times Come Again No More', subtitle: 'Vers og omkvæd · Stephen Foster',
    composer: 'Stephen Collins Foster (1826–1864)', key: { tonic: 7, mode: 'major', label: 'G-dur' }, timeSignature: [4, 4], tempo: 100,
    events: [
      // Foster, 1854, printed pp. 3–4: vocal staff only. Each line after
      // the pickup is one source bar. Sounding pitches are transposed -8
      // semitones from E-flat major to a guitar-friendly G-major register.
      ...part('A · Vers · optakt', `G3:0.5 A3:0.5
        B3 B3:0.5 B3:0.5 B3:0.5 D4 B3:0.5
        A3:0.5 G3:0.5 G3:0.5 A3:0.5 B3 D4:0.75 C4:0.25
        D4 B3 B3:0.5 G3:0.5 A3:0.75 A3:0.25
        G3:2 R:1 G3:0.5 A3:0.5
        B3 B3:0.5 B3:0.5 B3:0.5 D4 B3:0.5
        A3:0.5 G3:0.5 G3:0.5 A3:0.5 B3 D4
        D4 B3 B3:0.5 G3:0.5 B3:0.75 B3:0.25
        G3:2 R:1`),
      ...part('B · Omkvæd · optakt', `B3:0.5 C4:0.5
        D4 R:0.5 D4:0.5 D4 C#4:0.5 D4:0.5
        E4:2 D4 R:1
        G4 D4 E4 D4
        B3:0.5 B3:0.5 A3:0.75 G3:0.25 A3 G3:0.5 A3:0.5
        B3 B3:0.5 B3:0.5 B3:0.5 D4 B3:0.5
        A3:0.75 G3:0.25 G3:0.5 A3:0.5 B3 D4
        D4 B3 B3:0.5 G3:0.5 B3:0.75 B3:0.25
        G3:3 R:1`),
    ],
    source: {
      title: 'Library of Congress · Stephen C. Foster, originalnoder fra 1854, trykt side 3–4',
      url: 'https://tile.loc.gov/storage-services/public/music/mussm2-sm1854-760350/mussm2-sm1854-760350.pdf',
      edition: 'Hele sangstemmen til første vers og omkvæd i originalens 4/4, med ottendedelsoptakter, pauser, punkteringer og sekstendedele. Transponeret fra Es-dur til klingende G-dur i guitarregister (otte halvtoner ned). Klaverindledning, klaverstemmer og efterspil er udeladt. Fermater bruger de noterede varigheder. Originalens tempoangivelse er Moderato uden metronomtal; 100 fjerdedele/minut er programmets valgte øvetempo. Ikke en transskription af spillets arrangement.',
      license: 'Public domain · Stephen C. Foster, 1854 · egen indtastning af sangstemmen',
      licenseUrl: 'https://www.loc.gov/item/2023809288/',
    },
  },
];
