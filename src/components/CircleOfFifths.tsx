import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, Select, SegmentedOption } from './StudioControls';
import { FIFTHS, fifthsAnswer, minorTonic } from '../music/circleOfFifths';
import type { FifthsQuiz } from '../music/circleOfFifths';
import { SCALE_ROOTS } from '../music/scales';
import './circle-of-fifths.css';

interface Props {
  onHear: (midi: number) => Promise<void>;
  onScale: (tonic: number, minor: boolean) => void;
}

export default function CircleOfFifths({ onHear, onScale }: Props) {
  const [mode, setMode] = useState<'explore' | 'quiz'>('explore');
  const [selected, setSelected] = useState(0);
  const [kind, setKind] = useState<FifthsQuiz>('fifth');
  const [question, setQuestion] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [hint, setHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const key = FIFTHS[selected];
  const expected = fifthsAnswer(question, kind);
  const correct = answer === expected;
  const answerLabel = (index: number) => kind === 'minor' ? `${FIFTHS[index].minor} mol` : `${FIFTHS[index].major} dur`;

  function next(reset = false) {
    setQuestion(previous => (previous + 1 + Math.floor(Math.random() * 11)) % 12);
    setAnswer(null); setAttempted(false); setHint(false);
    if (reset) setScore({ correct: 0, total: 0 });
  }
  function submit(index: number) {
    if (correct) return;
    if (!attempted) setScore(value => ({ correct: value.correct + Number(index === expected), total: value.total + 1 }));
    setAttempted(true); setAnswer(index);
  }

  return <section className="fifths-workspace ds-layout" data-layout="split" aria-labelledby="fifths-title">
    <div className="fifths-heading">
      <div><h1 id="fifths-title">Kvintcirklen</h1><p>Circle of fifths · lær tonearternes sammenhæng, og øv dem på dit instrument.</p></div>
      <div className="ds-segmented-control" role="group" aria-label="Kvintcirklens øvemåde">
        <SegmentedOption aria-pressed={mode === 'explore'} onClick={() => setMode('explore')}>Udforsk</SegmentedOption>
        <SegmentedOption aria-pressed={mode === 'quiz'} onClick={() => setMode('quiz')}>Øv din viden</SegmentedOption>
      </div>
    </div>
    {mode === 'explore' ? <div className="fifths-columns">
      <div className="fifths-circle" role="group" aria-label="Tonearter med uret i kvinter. Store bogstaver er dur, små er mol.">
        <div className="fifths-center"><strong>Dur / mol</strong><span>Med uret: kvint ↻</span><span>Mod uret: kvart ↺</span></div>
        {FIFTHS.map((item, index) => {
          const angle = index * Math.PI / 6;
          return <Button key={index} className="fifths-key" aria-pressed={selected === index}
            aria-label={`${item.major} dur, ${item.minor} mol, ${item.signature}`}
            style={{ left: `${50 + 40 * Math.sin(angle)}%`, top: `${50 - 40 * Math.cos(angle)}%` } as CSSProperties}
            onClick={() => setSelected(index)}><strong>{item.major}</strong><span>{item.minor}</span></Button>;
        })}
      </div>
      <div className="fifths-detail card">
        <p className="eyebrow">VALGT TONEART</p><h2>{key.major} dur</h2><p>{key.signature}</p>
        <dl><div><dt>Parallel mol</dt><dd>{key.minor} mol</dd></div><div><dt>En kvint op ↻</dt><dd>{FIFTHS[fifthsAnswer(selected, 'fifth')].major} dur</dd></div><div><dt>En kvart op ↺</dt><dd>{FIFTHS[fifthsAnswer(selected, 'fourth')].major} dur</dd></div></dl>
        <div className="fifths-actions"><Button className="learning-secondary" onClick={() => void onHear(48 + key.tonic)}>Hør grundtonen</Button>
          <Button className="learning-primary" onClick={() => onScale(key.tonic, false)}>Øv {SCALE_ROOTS[key.tonic]} dur-skala</Button>
          <Button onClick={() => onScale(minorTonic(selected), true)}>Øv parallel mol-skala</Button></div>
        <p>Skalaøvelsen åbner med noder, grebsforslag og den sædvanlige mikrofontræning.</p>
      </div>
    </div> : <div className="fifths-quiz card ds-layout" data-layout="form">
      <label>Hvad vil du øve?<Select value={kind} onChange={e => { setKind(e.target.value as FifthsQuiz); next(true); }}><option value="fifth">Kvinter · med uret</option><option value="fourth">Kvarter · mod uret</option><option value="minor">Parallelle moltonarter</option></Select></label>
      <p className="eyebrow">{score.correct} RIGTIGE AF {score.total} · FØRSTE FORSØG</p>
      <h2>{kind === 'minor' ? `Hvad er den parallelle moltonart til ${FIFTHS[question].major} dur?` : `Hvilken durtoneart ligger en ${kind === 'fifth' ? 'kvint' : 'kvart'} over ${FIFTHS[question].major} dur?`}</h2>
      <p>Vælg et svar. Du kan prøve igen, hvis du rammer forkert.</p>
      <div className="fifths-answers" role="group" aria-label="Svarmuligheder">
        {[...FIFTHS.keys()].sort((a, b) => FIFTHS[a].tonic - FIFTHS[b].tonic).map(index => <Button key={index} className="learning-secondary" aria-pressed={answer === index} disabled={correct} onClick={() => submit(index)}>{answerLabel(index)}</Button>)}
      </div>
      <p className="fifths-feedback" role="status">{answer === null ? 'Klar til dit svar.' : correct ? `Rigtigt! ${answerLabel(expected)}.` : `${answerLabel(answer)} er ikke svaret. Prøv igen, eller vis et hint.`}</p>
      {hint && <p>{kind === 'minor' ? 'Parallel mol har samme fortegn som dur og ligger tre halvtoner under durgrundtonen.' : `Tæl ${kind === 'fifth' ? 'syv' : 'fem'} halvtoner op fra grundtonen. På cirklen går du ét trin ${kind === 'fifth' ? 'med' : 'mod'} uret.`}</p>}
      <div className="fifths-actions"><Button onClick={() => setHint(!hint)} aria-expanded={hint}>{hint ? 'Skjul hint' : 'Vis hint'}</Button><Button className="learning-primary" disabled={!correct} onClick={() => next()}>Næste spørgsmål</Button><Button onClick={() => next(true)}>Start forfra</Button></div>
    </div>}
    <div className="fifths-explanation"><h2>Sådan læser du cirklen</h2><p>En kvint er syv halvtoner. Med uret får du C → G → D → A og videre rundt. Mod uret går du en kvart op, altså fem halvtoner. Dur og parallel mol deler fortegn: C dur og a mol har for eksempel ingen.</p><p>F♯ og G♭ lyder ens i ligesvævende stemning, men staves forskelligt. Her skifter cirklen fra krydser til b’er. Som i resten af appen bruger vi B for tonen, der også kaldes H på dansk, og B♭ for tonen en halvtone under.</p></div>
  </section>;
}
