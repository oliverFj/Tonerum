# Tonerum

Tonerum er en browserapp til at øve melodier, skalaer og enkelttoner på guitar og violin. Den viser noder og fingerplaceringer, spiller melodier og kan følge de toner, du spiller via mikrofon eller USB-instrumentkabel.

## Brug appen

Åbn **Tonerum.html** direkte i en moderne browser. Den samlede fil indeholder appens kode og udseende; der kræves ingen installation eller server til visning og afspilning. Nodehenvisninger åbner eksterne hjemmesider.

1. Vælg guitar eller violin og derefter en sang eller skala.
2. Lyt til melodien, og tilpas tempoet.
3. Tænd lydindgangen, vælg din mikrofon eller dit USB-instrumentkabel, og giv browseren adgang.
4. Vælg **Vent på korrekt tone** for at øve i eget tempo eller **Følg tempoet** for at øve med en fast puls.

Gribebrættet kan vise forskellige grebsforslag, tonenavne og farver. Violinvisningen bruger første position og tilpasser melodiernes register. Rullende noder, et valgfrit klaver, metronom, stemmeværktøj og enkeltøvelsen Tonejagt supplerer meloditræningen. Brug hovedtelefoner, når appens guidetoner ellers opfanges af mikrofonen.

Browserens mikrofonregler varierer ved åbning af lokale filer. Hvis lydindgangen ikke er tilgængelig, kan appen køres på localhost som beskrevet nedenfor. Tonegenkendelsen er beregnet til enkelttoner.

## Sangkatalog

Kataloget indeholder 43 melodier fordelt på **Børnesange**, **Salmer**, **Traditionals** og **Civilization VI**. Der er 18 salmer, herunder de danske salmer:

- Altid frejdig, når du går
- Blomstre som en rosengård
- Dejlig er den himmel blå
- Dejlig er jorden
- Den signede dag med fryd vi ser
- Det er så yndigt at følges ad
- Glade jul
- Hil dig, Frelser og Forsoner
- I østen stiger solen op
- Nu falmer skoven trindt om land
- Nu titte til hinanden
- Op, al den ting, som Gud har gjort
- Se, nu stiger solen

Salmerne bruger melodistemmen til ét helt vers. Der følger ingen sangtekster eller moderne kor-/klaverarrangementer med disse nye danske indtastninger. Under **Indstillinger → Melodi og nodekilde** findes forlæg, kreditering, licens, transponering og eventuelle tilpasninger for den valgte melodi.

Civilization VI-gruppen samler 15 grundmelodier fra spillets musikalske repertoire. De er enstemmige øveudgaver af de angivne folkeviser og kompositioner. Spillets indspilninger og arrangementer er ikke inkluderet. Blandt andet følger **Hard Times Come Again No More** Fosters originale sangstemme fra 1854 med vers, omkvæd, optakter og pauser.

### Eksterne nodehenvisninger

Disse to ønskede salmer er ikke indbygget som spilbare melodier. Der er ikke dokumenteret en licens til at distribuere deres fulde melodier i dette offentlige repository:

- [Du, som har tændt millioner af stjerner – noder og guitarversioner hos MuBase](https://mubase.dk/sange/du-som-har-taendt-millioner-af-stjerner), melodi af Erik Sommer.
- [Det dufter lysegrønt af græs – nodehenvisning til Waldemar Åhléns melodi](https://jorgenellegaard.dk/onewebmedia/PDF%20Noder/DDS%20725%20Det%20dufter%20orig%20orgel.pdf).

En node, der kan ses eller downloades på nettet, giver ikke i sig selv tilladelse til at genudgive melodien her. De enkelte kilde- og bearbejdelseslicenser fremgår af musikdataene; projektet anvender ikke én fælles musiklicens.

## Lokal udvikling

Projektet bruger Node.js, npm, React, TypeScript og Vite.

```sh
npm ci
npm run dev
```

Åbn den localhost-adresse, Vite viser. Produktionspakken bygges med:

```sh
npm run build
```

Kommandoen kontrollerer TypeScript, bygger appen og opdaterer både `dist/index.html` og den selvstændige `Tonerum.html`. Den selvstændige fil versionsstyres og skal genbygges ved ændringer i app eller musikdata. `dist/` og `node_modules/` versionsstyres ikke.

## Musikdata og kontrol

- `src/music/melodies.ts` samler kataloget; `folkMelodies.ts`, `danishHymns.ts` og `civilizationMelodies.ts` indeholder de respektive melodier og kilder.
- Hver note har en klingende MIDI-tonehøjde. Varigheder er altid i fjerdedelsslag, også i eksempelvis 2/2 og 6/8, og tempoet er fjerdedele pr. minut.
- Optakter, pauser, punkteringer og gentagelser følger det angivne forlæg. Bindebuer over samme tone samles til én varighed; fraseringsbuer mellem forskellige toner bevarer tonerne.
- Uden et metronomtal i kilden er appens tempo et valgt øvetempo. Frie fermateforlængelser er ikke automatisk tilføjet.
- `danishHymns.test.ts` kontrollerer nodeværdier takt for takt, melodiform, register og katalogtilknytning. `civilizationMelodies.test.ts` sammenholder kildernes rytmer og toneforløb med faste referencer i `fixtures/civilization-source-events.json`.

Kør alle eksisterende automatiske kontroller med `npm test`. En målrettet kontrol af sangkataloget og de nye melodier kan køres med:

```sh
npx tsx --test src/music/music.test.ts src/music/danishHymns.test.ts src/music/civilizationMelodies.test.ts src/music/interface.test.ts
```
