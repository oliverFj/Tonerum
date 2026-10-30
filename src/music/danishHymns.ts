import type { Melody } from './types';
import { notes } from './folkMelodies';

const source = (title: string, url: string, edition: string): Melody['source'] => ({
  title, url,
  edition: `${edition} Melodistemmen til ét helt vers, lagt én oktav ned for guitaren. Tekst og ledsagestemmer er udeladt. Tempoet er et valgt øvetempo, da kilden ikke angiver et metronomtal.`,
  license: 'Public domain-melodi · egen enstemmig indtastning',
  licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
});

// Each line follows a written bar (including incomplete pickup/end bars).
// Durations are quarter-note beats, also in 2/2 and 6/8. Slurs between
// different pitches retain both attacks; same-pitch ties are merged.
export const DANISH_HYMNS: Melody[] = [
  {
    id: 'nu-titte-til-hinanden', title: 'Nu titte til hinanden', subtitle: 'Morgensalme · DDS 750',
    category: 'Salmer', composer: 'C. E. F. Weyse',
    key: { tonic: 0, mode: 'major', label: 'C-dur' }, timeSignature: [2, 4], tempo: 72,
    events: notes(`
      G3:0.5
      E3:0.75 D3:0.25 E3:0.5 F3:0.5
      G3 C3:0.5 E3:0.5
      A3:0.75 A3:0.25 A3:0.5 A3:0.5
      G3 R:0.5 E3:0.5
      D3:1.5 F3:0.5
      E3:1.5 C3:0.5
      G3:0.75 F3:0.25 E3:0.5 E3:0.5
      E3 D3:0.5 G3:0.5
      C4:0.75 C4:0.25 B3:0.5 A3:0.5
      G3 F3:0.5 E3:0.5
      A3 A3:0.5 A3:0.5
      G3 R:0.5 C3:0.5
      F3 D3:0.5 F3:0.5
      E3:0.5 G3:0.5 F3:0.5 D3:0.5
      C3 B2
      C3 R`),
    source: {
      ...source('Erik Damskier · Nu titte til hinanden på Wikimedia Commons',
        'https://commons.wikimedia.org/wiki/File:Nu_titte_til_hinanden.png',
        'Weyses melodi fra 1837 i C-dur, med ottendedelsoptakt og 16 efterfølgende takter. Egen enstemmig bearbejdelse efter Erik Damskiers node. De indledende halvandet pauseslag før optakten er udeladt; alle efterfølgende pauser, punkteringer, sekstendedele og gentagne anslag bevares.'),
      license: 'Public domain-melodi · nodeforlæg og bearbejdelse CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    },
  },
  {
    id: 'se-nu-stiger-solen', title: 'Se, nu stiger solen', subtitle: 'Oluf Rings melodi · DDS 754',
    category: 'Salmer', composer: 'Oluf Ring',
    key: { tonic: 9, mode: 'minor', label: 'A-mol' }, timeSignature: [4, 4], tempo: 96,
    events: notes(`
      A2:1.5 A2:0.5 C3 D3
      E3:2 C3 A2
      E3:2 F#3:2
      G3:3 R
      A3:1.5 A3:0.5 G3 E3
      D3:2 E3 D3
      C3:2 D3:2
      E3:3 R
      C4:1.5 C4:0.5 B3 A3
      G3:2 E3 G3
      A3:2 G3 E3
      D3:3 R
      G3:1.5 G3:0.5 E3 D3
      C3:2 D3 D3
      E3:2 C3 B2
      A2:3 R`),
    source: source('Musikonline.dk · Se, nu stiger solen',
      'https://musikonline.dk/wp-content/uploads/2023/06/Senu-stiger-solen.pdf',
      'Oluf Rings melodi i A-mol, alle 16 takter. Det hævede sjettetrin F♯ i tredje takt, de punkterede rytmer, de gentagne anslag og pauserne efter hver frase bevares.'),
  },
  {
    id: 'op-al-den-ting', title: 'Op, al den ting, som Gud har gjort', subtitle: 'Traditionel tjekkisk melodi · DDS 15',
    category: 'Salmer', composer: 'Traditionel tjekkisk melodi',
    key: { tonic: 0, mode: 'major', label: 'C-dur' }, timeSignature: [3, 2], tempo: 120,
    events: notes(`
      C3
      C3 C3 F3:2 D3:2
      E3 F3 G3:2 R G3
      A3 B3 C4:2 B3 C4
      A3:2 G3:2 R G3
      E3 G3 A3:2 G3:2
      F3 E3 D3:2 R G3
      G3 E3 F3:2 E3 F3
      D3:2 C3:2 R:2`),
    source: {
      ...source('Erik Damskier · Op al den ting på Wikimedia Commons',
        'https://commons.wikimedia.org/wiki/File:Op_al_den_ting,_som_Gud_har_gjort.png',
        'Den traditionelle melodi i C-dur og 3/2, med kvartoptakt og otte efterfølgende takter. Egen enstemmig bearbejdelse efter Erik Damskiers node. Kildens fem indledende pauseslag før optakten er udeladt; alle efterfølgende pauser og nodeværdier bevares. 120 BPM angiver fjerdedele, svarende til 60 halvnoder i minuttet.'),
      license: 'Public domain-melodi · nodeforlæg og bearbejdelse CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    },
  },
  {
    id: 'altid-frejdig', title: 'Altid frejdig, når du går', subtitle: 'Dansk salme · DDS 784',
    category: 'Salmer', composer: 'August Winding',
    key: { tonic: 7, mode: 'major', label: 'G-dur' }, timeSignature: [4, 4], tempo: 80,
    events: notes(`
      B3:1.5 A3:0.5 C4 B3
      E3 F#3 G3:2
      D3 G3 B3 D4
      C4:2 B3 R
      A3:1.5 G3:0.5 C4 B3
      E4 E4 D4:2
      G3 G3 D4 C4
      B3:2 A3:2
      G3:3 R`),
    source: source('KORLIV · Altid frejdig, når du går',
      'https://www.nodebibliotek.dk/nodebank/altidfre.pdf',
      'Windings melodi i G-dur, ni takter. Punkteringer, frasens pauser og de to forskellige toner under slutningens fraseringsbue bevares.'),
  },
  {
    id: 'i-oesten-stiger-solen', title: 'I østen stiger solen op', subtitle: 'Morgensalme · DDS 749',
    category: 'Salmer', composer: 'C. E. F. Weyse',
    key: { tonic: 4, mode: 'major', label: 'E-dur' }, timeSignature: [2, 4], tempo: 64,
    events: notes(`
      B2:0.5
      E3:0.75 D#3:0.25 E3:0.5 E3:0.5
      F#3:0.75 F#3:0.25 G#3:0.5 B3:0.5
      G#3:0.5 F#3:0.5 E3:0.75 D#3:0.25
      B2 R:0.5 E3:0.5
      C#3:0.75 B2:0.25 C#3:0.5 D#3:0.5
      E3:0.75 G#3:0.25 F#3:0.5 B3:0.5
      B3:0.75 A3:0.25 G#3:0.5 F#3:0.5
      E3:1.5`),
    source: source('Gratis-noder.dk · Weyses I østen stiger solen op',
      'https://gratis-noder.dk/wp-content/uploads/2012/02/i_oesten_stiger_solen_op-C.E.F.WeyseogIngemann.pdf',
      'Weyses melodi fra 1837 i E-dur, otte takter inklusive optakt og afslutning. Ottendedelsoptakt, sekstendedele og pausen efter første halvdel bevares.'),
  },
  {
    id: 'hil-dig-frelser', title: 'Hil dig, Frelser og Forsoner', subtitle: 'Hoffmanns melodi · DDS 192',
    category: 'Salmer', composer: 'Caspar Christian Hoffmann',
    key: { tonic: 5, mode: 'major', label: 'F-dur' }, timeSignature: [4, 4], tempo: 96,
    events: notes(`
      F3:2 C3:2
      A3 G3 F3 E3
      E3:2 D3:2
      G3:2 D3:2
      Bb3 A3 G3 F3
      F3:2 E3:2
      E3 F3 G3 A3
      G3 F3 E3 F3
      G3 A3 Bb3 C4
      Bb3 A3 G3 A3
      Bb3:2 A3:2
      G3:3 F3
      F3:2 E3:2
      F3:4`),
    source: {
      ...source('Erik Damskier · Hoffmanns melodi på Wikimedia Commons',
        'https://commons.wikimedia.org/wiki/File:Hil_dig,_frelser_og_forsoner.png',
        'Hoffmanns melodi fra 1878 i F-dur, alle 14 takter. Egen enstemmig bearbejdelse efter Erik Damskiers node fra 2010.'),
      license: 'Public domain-melodi · nodeforlæg og bearbejdelse CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    },
  },
  {
    id: 'den-signede-dag', title: 'Den signede dag med fryd vi ser', subtitle: 'Dansk salme · DDS 402',
    category: 'Salmer', composer: 'C. E. F. Weyse',
    key: { tonic: 0, mode: 'major', label: 'C-dur' }, timeSignature: [2, 2], tempo: 112,
    events: notes(`
      C3:2
      E3:2 E3 E3
      G3:2 G3:2
      C4:2 A3:2
      G3:2 E3:2
      A3:2 G3 G3
      F3:2 D3:2
      E3:4
      D3:2 G3:2
      G3:2 G3 G3
      A3:2 A3:2
      B3:2 C4:2
      D4:2 D4:2
      G3:2 G3 G3
      B3:2 C4:2
      A3:4
      G3:2 G3:2
      E3:2 E3 E3
      F3:2 G3:2
      A3:2 A3:2
      G3:2 G3:2
      C4:2 C4 C4
      B3:2 C4:2
      D4:4
      C4:2`),
    source: source('Rosendahls · Den signede dag',
      'https://rosendahls-begravelse.dk/wp-content/uploads/noder/den-signede-dag.pdf',
      'Weyses melodi fra 1826 i C-dur og alla breve. Halvnodeoptakten og slutningens halve takt giver 24 hele takter i alt. Slutfermatens ekstra holdetid er fri; her bruges den noterede varighed.'),
  },
  {
    id: 'nu-falmer-skoven', title: 'Nu falmer skoven trindt om land', subtitle: 'Nebelongs melodi · DDS 729',
    category: 'Salmer', composer: 'Johan Henrik Nebelong',
    key: { tonic: 8, mode: 'major', label: 'A♭-dur' }, timeSignature: [3, 4], tempo: 90,
    events: notes(`
      Eb3
      Eb3 C4 Bb3
      Ab3:2 Eb3
      F3:2 Ab3
      Eb3 R Ab3
      Bb3:2 G3
      Bb3:1.5 C4:0.5 Db4
      C4:3
      Ab3 R C4
      C4:2 Bb3
      Ab3:1.5 G3:0.5 F3
      Bb3:2 Ab3
      G3 R Eb3
      Ab3 Bb3 C4
      Db4:2 Bb3
      G3:3
      Ab3:2 R`),
    source: source('Det Voxne Kammerkor · Nebelongs melodi',
      'https://www.detvoxnekammerkor.dk/wp-content/uploads/2017/noder/Nu_falmer_skoven.pdf',
      'Nebelongs melodi i A♭-dur, kontrolleret i sopranstemmen i Lena Maaløes korudgave. Kvartoptakten, alle fraseringsbuernes toner og kildens pauser bevares. Korarrangementet er ikke medtaget.'),
  },
  {
    id: 'det-er-saa-yndigt', title: 'Det er så yndigt at følges ad', subtitle: 'Bryllupssalme · DDS 703',
    category: 'Salmer', composer: 'C. E. F. Weyse',
    key: { tonic: 5, mode: 'major', label: 'F-dur' }, timeSignature: [6, 8], tempo: 66,
    events: notes(`
      C3:0.5
      A3 F3:0.5 Bb3:0.75 A3:0.25 G3:0.5
      C4:0.75 D4:0.25 C4:0.5 A3 F3:0.5
      D4 C4:0.5 C4:0.75 Bb3:0.25 A3:0.5
      G3 D3:0.5 F3:0.5 E3:0.5 C3:0.5
      A3 F3:0.5 Bb3:0.75 A3:0.25 G3:0.5
      C4 A3:0.5 G3 C4:0.5
      D4 F3:0.5 E3:0.5 G3:0.5 C4:0.5
      C4:0.5 E4:0.5 D4:0.5 D4:0.5 C4:0.5 C3:0.5
      E3 F3:0.5 A3:0.5 G3:0.5 F#3:0.5
      G3 A3:0.5 C4:0.5 Bb3:0.5 G3:0.5
      A3 A3:0.5 A3:0.75 Bb3:0.25 A3:0.5
      A3 Bb3:0.5 D4:0.5 C4:0.5 Bb3:0.5
      A3:1.5 G3:1.5
      C4:2.5 F3:0.5
      A3:1.5 G3:1.5
      F3:2 R:0.5`),
    source: source('Café Puccini · Det er så yndigt at følges ad',
      'https://www.cafe-puccini.dk/Weyse/pdf/Det_er_saa_yndigt_at_folges_ad.pdf',
      'Weyses melodistemme i F-dur, ét vers i 6/8 med optakt. Sopranstemmens punkteringer og slutningens bindebuer bevares. Kildens gentagelse bruges til næste vers og gentages derfor ikke her. Den moderne koropsætning er ikke medtaget.'),
  },
  {
    id: 'dejlig-er-den-himmel-blaa', title: 'Dejlig er den himmel blå', subtitle: 'Meidells melodi · DDS 136',
    category: 'Salmer', composer: 'J. G. Meidell',
    key: { tonic: 2, mode: 'major', label: 'D-dur' }, timeSignature: [4, 4], tempo: 112,
    events: notes(`
      D3 E3 F#3 G3
      A3 D4 A3:2
      B3:1.5 A3:0.5 G3 F#3
      A3 A3 E3:2
      E3:1.5 F#3:0.5 G3 E3
      F#3:1.5 G3:0.5 A3 F#3
      E3:1.5 F#3:0.5 G3 E3
      F#3:1.5 G3:0.5 A3 F#3
      A3 D4 A3 F#3
      G3 E3 F#3:2
      A3 D4 A3 F#3
      G3:2 E3:2
      D3:3 R`),
    source: {
      ...source('Bob Collowân · Meidells melodi på Wikimedia Commons',
        'https://commons.wikimedia.org/wiki/File:Dejlig_er_den_himmel_bl%C3%A5.jpg',
        'Meidells melodi i D-dur, alle 13 takter, inklusive den anden og længere afslutning. Egen enstemmig bearbejdelse efter Bob Collowâns node; begge afslutningslinjer og alle punkteringer er med.'),
      license: 'Public domain-melodi · nodeforlæg og bearbejdelse CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    },
  },
  {
    id: 'blomstre-som-en-rosengaard', title: 'Blomstre som en rosengård', subtitle: 'Adventssalme · DDS 78',
    category: 'Salmer', composer: 'J. P. E. Hartmann',
    key: { tonic: 2, mode: 'major', label: 'D-dur' }, timeSignature: [2, 4], tempo: 72,
    events: notes(`
      A3:0.75 A3:0.25 F#3:0.5 G3:0.5
      A3:0.5 F#3:0.5 F#3
      D3:0.5 D3:0.5 F#3:0.5 E3:0.5
      C#3 D3
      A3:0.75 A3:0.25 F#3:0.5 A3:0.5
      D4:0.5 B3:0.5 B3
      F#3:0.5 F#3:0.5 C#4:0.5 B3:0.5
      A3:0.5 G#3:0.5 A3
      E3:0.75 E3:0.25 E3:0.5 F#3:0.5
      G3:0.5 G3:0.5 A3
      B3:0.75 B3:0.25 G3:0.5 B3:0.5
      D4 B3
      A3:2
      D3:0.5 D3:0.5 A3:0.5 G3:0.5
      F#3 E3
      D3:2`),
    source: source('Københavns Universitet · Blomstre som en rosengård, side 1',
      'https://www.ku.dk/fileadmin/site-65/HUM/musikvidenskab/adgangspr_ve_-_SV_alle_21_satser.pdf',
      'Hartmanns melodi fra 1861 i D-dur, alle 16 takter fra nodehæftets side 1. Sekstendedele, fortegn og de forskellige toner under fraseringsbuerne bevares.'),
  },
];
