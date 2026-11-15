import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogEvidenceInSave, createInitialSave } from './gameRules';
import {
  evaluateEndingOutcome,
  evaluateForestGateStatus,
  getCurrentQuestDirective,
  isLocationUnlocked,
  MANDATORY_EVIDENCE_IDS,
  markEvidenceExamined,
  recordAudioPlaybackProgress,
  solveDeductionInSave,
} from './storyProgression';

function buildFullyPreparedSave() {
  let save = createInitialSave('2026-11-15T00:00:00.000Z');
  for (const id of MANDATORY_EVIDENCE_IDS) {
    save = catalogEvidenceInSave(save, id, 320, 75, 42);
    save = markEvidenceExamined(save, id);
  }
  save = recordAudioPlaybackProgress(save, 'rec-01-initial', 15).nextSave;
  save = recordAudioPlaybackProgress(save, 'rec-02-playground', 18).nextSave;
  save = recordAudioPlaybackProgress(save, 'rec-03-caretaker', 17).nextSave;
  save = recordAudioPlaybackProgress(save, 'rec-05-forest', 19).nextSave;
  return save;
}

test('area progression unlocks Shed -> Caretaker House -> Drainage Tunnels sequentially', () => {
  let save = createInitialSave('2026-11-15T00:00:00.000Z');
  assert.equal(isLocationUnlocked('playground', save), true);
  assert.equal(isLocationUnlocked('maintenance-shed', save), false);
  assert.equal(isLocationUnlocked('caretakers-house', save), false);
  assert.equal(isLocationUnlocked('drainage-tunnels', save), false);
  assert.equal(isLocationUnlocked('forest', save), false);

  save = catalogEvidenceInSave(save, 'ev-jimmy-poster', 450, 86, 22);
  assert.equal(isLocationUnlocked('maintenance-shed', save), true);
  assert.equal(isLocationUnlocked('caretakers-house', save), false);

  save = catalogEvidenceInSave(save, 'ev-surveillance-photo', 430, 82, 28);
  assert.equal(isLocationUnlocked('caretakers-house', save), true);
  assert.equal(isLocationUnlocked('drainage-tunnels', save), false);

  save = catalogEvidenceInSave(save, 'ev-caretaker-log', 410, 78, 35);
  assert.equal(isLocationUnlocked('drainage-tunnels', save), true);
  assert.equal(isLocationUnlocked('forest', save), false);
});

test('Forest Gate remains strictly locked until all 8 mandatory clues are examined, 4 audio clues found, and Final Deduction solved', () => {
  let save = buildFullyPreparedSave();
  // All 8 collected & examined and audio clues found, but Final Deduction not yet solved:
  const beforeSolve = evaluateForestGateStatus(save);
  assert.equal(beforeSolve.mandatoryFoundCount, 8);
  assert.equal(beforeSolve.mandatoryExaminedCount, 8);
  assert.equal(beforeSolve.audioCluesFoundCount, 4);
  assert.equal(beforeSolve.finalDeductionSolved, false);
  assert.equal(beforeSolve.unlocked, false);
  assert.equal(isLocationUnlocked('forest', save), false);

  // Solve Final Deduction -> Forest Gate unlocks!
  const result = solveDeductionInSave(save, 'deduction-final-bridge');
  assert.equal(result.solved, true);
  assert.equal(result.unlockedForestGate, true);
  assert.equal(result.nextSave.forestGateUnlocked, true);
  assert.equal(isLocationUnlocked('forest', result.nextSave), true);
  assert.match(getCurrentQuestDirective(result.nextSave), /Forest Gate is open/i);
});

test('cannot solve Final Deduction if an audio clue is missing', () => {
  let save = createInitialSave('2026-11-15T00:00:00.000Z');
  for (const id of MANDATORY_EVIDENCE_IDS) {
    save = catalogEvidenceInSave(save, id, 320, 75, 42);
    save = markEvidenceExamined(save, id);
  }
  // Listen only to first recording, missing 02, 03, 05
  save = recordAudioPlaybackProgress(save, 'rec-01-initial', 15).nextSave;
  const attempt = solveDeductionInSave(save, 'deduction-final-bridge');
  assert.equal(attempt.solved, false);
  assert.equal(attempt.nextSave.forestGateUnlocked, false);
});

test('audio playback unlocks hidden clue only once playback passes hiddenClueTimestampSec', () => {
  let save = createInitialSave('2026-11-15T00:00:00.000Z');
  save = catalogEvidenceInSave(save, 'ev-julian-tape-01', 420, 80, 25);

  const early = recordAudioPlaybackProgress(save, 'rec-02-playground', 5);
  assert.equal(early.newlyUnlockedClueTitle, null);
  assert.equal(early.nextSave.discoveredAudioClueIds.length, 0);

  const late = recordAudioPlaybackProgress(early.nextSave, 'rec-02-playground', 15);
  assert.equal(late.newlyUnlockedClueTitle, 'Identical Synthetic Child Laugh');
  assert.deepEqual(late.nextSave.discoveredAudioClueIds, ['audio-clue-02-double-laugh']);
});

test('evaluateEndingOutcome maps decisions and preparation cleanly across all 4 endings', () => {
  const prepared = solveDeductionInSave(buildFullyPreparedSave(), 'deduction-final-bridge').nextSave;

  assert.equal(
    evaluateEndingOutcome({ save: prepared, decision: 'escape-seal-archive' }),
    'true-closure',
  );
  assert.equal(
    evaluateEndingOutcome({ save: prepared, decision: 'confront-truth' }),
    'true-closure',
  );
  assert.equal(
    evaluateEndingOutcome({ save: prepared, decision: 'leave-yellow-token' }),
    'yellow-token',
  );
  assert.equal(
    evaluateEndingOutcome({ save: prepared, decision: 'follow-the-voice' }),
    'whispering-drain',
  );
  assert.equal(
    evaluateEndingOutcome({ save: prepared, decision: 'confront-truth', gazeCollapseTriggered: true }),
    'erased-investigator',
  );
});
