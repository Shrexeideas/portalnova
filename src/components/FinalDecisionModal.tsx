import React from 'react';
import { useGame } from '../state/GameContext';
import { EndingDecisionId } from '../types/game';

const DECISIONS: Array<{
  id: EndingDecisionId;
  code: string;
  label: string;
  description: string;
  primary?: boolean;
}> = [
  {
    id: 'confront-truth',
    code: 'OPTION A',
    label: "CONFRONT WITHOUT LOOKING // RECOVER JULIAN'S JOURNAL",
    description:
      'Keep your eyes lowered past the Duck and seize Julian Vance’s final field notes using the 1994/1996 contradictions.',
    primary: true,
  },
  {
    id: 'leave-yellow-token',
    code: 'OPTION B',
    label: 'LEAVE THE YELLOW DUCK TOKEN & BACK AWAY',
    description:
      'Set the 1994 toy token on the pine needles without raising your gaze and retreat toward the playground gate.',
  },
  {
    id: 'follow-the-voice',
    code: 'OPTION C',
    label: 'ANSWER THE CHILD’S VOICE IN THE MIST',
    description:
      'Step toward the mimicked whisper echoing from the trees past the fallen caution ribbon.',
  },
  {
    id: 'escape-seal-archive',
    code: 'OPTION D',
    label: 'SEAL THE ARCHIVE & FLEE BEFORE DAWN',
    description:
      'Lock the north perimeter gate behind you and carry the 1996 tapes out of Willow Creek before 04:00 AM.',
  },
];

export const FinalDecisionModal: React.FC = () => {
  const { hudState, forestGateStatus, submitFinalDecision, dismissForestClimax } = useGame();

  if (!hudState.forestClimaxActive) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="climax-voice-title"
      className="fixed inset-0 z-50 bg-surface-container-lowest/88 flex items-center justify-center p-gutter"
    >
      <div className="max-w-2xl w-full bg-surface-container-low border-2 border-primary/70 p-space-lg shadow-2xl flex flex-col gap-space-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-rec-blink" />
            <span>NORTH FOREST CLEARING // VOCAL ANOMALY</span>
          </div>
          <span className="font-label-sm text-label-sm text-outline">
            CASE INTEGRITY: {forestGateStatus.mandatoryExaminedCount}/{forestGateStatus.mandatoryTotal}
          </span>
        </div>

        <div className="bg-surface-container-lowest p-space-md border-l-4 border-primary-container">
          <p className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest mb-1">
            DISTANT CHILD-CADENCE WHISPER
          </p>
          <h2
            id="climax-voice-title"
            className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface italic"
          >
            &ldquo;You took so long.&rdquo;
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
            Wet pine needles shift ten paces ahead while the yellow shape waits just beyond your flashlight beam. According to the Caretaker&apos;s 1994 log and Julian Vance&apos;s final recording, Jimmy Mercer stopped speaking after that first week in November 1994.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {DECISIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => submitFinalDecision(item.id)}
              className={`w-full text-left p-space-md rounded border transition-colors cursor-pointer ${
                item.primary
                  ? 'bg-primary-container/25 hover:bg-primary-container/40 border-primary text-on-surface'
                  : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/30 text-on-surface'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-md text-label-md font-bold text-primary uppercase">
                  {item.label}
                </span>
                <span className="font-label-sm text-label-sm text-outline">{item.code}</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                {item.description}
              </p>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="font-label-sm text-label-sm text-outline">
            DO NOT LOOK DIRECTLY AT THE FIGURE WHILE DECIDING
          </span>
          <button
            type="button"
            onClick={dismissForestClimax}
            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high font-label-sm text-label-sm text-outline hover:text-on-surface uppercase rounded cursor-pointer"
          >
            STEP BACK
          </button>
        </div>
      </div>
    </div>
  );
};
