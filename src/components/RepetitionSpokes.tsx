import type { NoteRepetitions } from '../music/repetitions';

export default function RepetitionSpokes({ repetitions }: { repetitions: NoteRepetitions }) {
  return <span className="note-repetitions" data-remaining={repetitions.remaining} aria-hidden="true">
    {repetitions.spokes.map(spoke => <i key={spoke.eventIndex} className="repetition-spoke" style={{
      transform: `rotate(${spoke.angle}deg)`, opacity: spoke.pending ? 1 : 0,
    }} />)}
  </span>;
}
