import {
  AUDIO_RECORDINGS,
  DEDUCTION_NODES,
  INITIAL_EVIDENCE_ITEMS,
  LOCATION_CATALOG,
} from '../data/caseData';
import {
  DeductionNode,
  EndingDecisionId,
  EndingId,
  ForestGateStatus,
  GameSaveData,
  LocationId,
  LocationStatus,
} from '../types/game';

export const MANDATORY_EVIDENCE_IDS = INITIAL_EVIDENCE_ITEMS.filter(
  (item) => item.mandatoryForForest,
).map((item) => item.id);

export const MANDATORY_AUDIO_CLUE_IDS = [
  'audio-clue-01-contradiction',
  'audio-clue-02-double-laugh',
  'audio-clue-03-silent-boy',
  'audio-clue-05-forest-warning',
] as const;

export function isLocationUnlocked(locationId: LocationId, save: GameSaveData): boolean {
  if (locationId === 'playground') return true;
  if (save.unlockedLocations.includes(locationId)) return true;

  const discovered = new Set(save.discoveredEvidenceIds);
  if (locationId === 'maintenance-shed') {
    return (
      discovered.has('ev-jimmy-poster') ||
      discovered.has('ev-broken-duck') ||
      discovered.has('clue-01-beak-shard')
    );
  }
  if (locationId === 'caretakers-house') {
    return (
      discovered.has('ev-julian-tape-01') ||
      discovered.has('ev-surveillance-photo') ||
      discovered.has('clue-02-cassette-04b')
    );
  }
  if (locationId === 'drainage-tunnels') {
    return (
      discovered.has('ev-caretaker-log') ||
      discovered.has('ev-jimmy-photo') ||
      discovered.has('clue-03-webbed-prints')
    );
  }
  if (locationId === 'forest') {
    return save.forestGateUnlocked;
  }
  return false;
}

export function getLocationStatuses(save: GameSaveData): LocationStatus[] {
  const order: LocationId[] = [
    'playground',
    'maintenance-shed',
    'caretakers-house',
    'drainage-tunnels',
    'forest',
  ];
  return order.map((id) => ({
    id,
    name: LOCATION_CATALOG[id].name,
    subtitle: LOCATION_CATALOG[id].subtitle,
    unlocked: isLocationUnlocked(id, save),
    unlockRequirementHint: LOCATION_CATALOG[id].unlockHint,
  }));
}

export function syncUnlockedLocations(save: GameSaveData): LocationId[] {
  const all: LocationId[] = [
    'playground',
    'maintenance-shed',
    'caretakers-house',
    'drainage-tunnels',
    'forest',
  ];
  const unlocked = all.filter((id) => isLocationUnlocked(id, save));
  return unlocked.length > 0 ? unlocked : ['playground'];
}

export function canSolveDeduction(node: DeductionNode, save: GameSaveData): boolean {
  const examined = new Set(save.examinedEvidenceIds);
  const discovered = new Set(save.discoveredEvidenceIds);
  const audioClues = new Set(save.discoveredAudioClueIds);

  const hasAllEvidence = node.requiredEvidenceIds.every(
    (id) => discovered.has(id) && examined.has(id),
  );
  const hasAllAudio = node.requiredAudioClueIds.every((id) => audioClues.has(id));
  return hasAllEvidence && hasAllAudio;
}

export function evaluateForestGateStatus(save: GameSaveData): ForestGateStatus {
  const discovered = new Set(save.discoveredEvidenceIds);
  const examined = new Set(save.examinedEvidenceIds);
  const audioClues = new Set(save.discoveredAudioClueIds);
  const completedDeductions = new Set(save.completedDeductionIds);

  const mandatoryFoundCount = MANDATORY_EVIDENCE_IDS.filter((id) => discovered.has(id)).length;
  const mandatoryExaminedCount = MANDATORY_EVIDENCE_IDS.filter(
    (id) => discovered.has(id) && examined.has(id),
  ).length;
  const audioCluesFoundCount = MANDATORY_AUDIO_CLUE_IDS.filter((id) => audioClues.has(id)).length;
  const finalDeductionSolved = completedDeductions.has('deduction-final-bridge');

  const missingSummary: string[] = [];
  if (mandatoryFoundCount < MANDATORY_EVIDENCE_IDS.length) {
    missingSummary.push(
      `Collect mandatory 1994/1996 evidence (${mandatoryFoundCount}/${MANDATORY_EVIDENCE_IDS.length})`,
    );
  }
  if (mandatoryExaminedCount < MANDATORY_EVIDENCE_IDS.length) {
    missingSummary.push(
      `Examine evidence details in Notebook (${mandatoryExaminedCount}/${MANDATORY_EVIDENCE_IDS.length})`,
    );
  }
  if (audioCluesFoundCount < MANDATORY_AUDIO_CLUE_IDS.length) {
    missingSummary.push(
      `Listen to Julian's tapes to uncover hidden audio clues (${audioCluesFoundCount}/${MANDATORY_AUDIO_CLUE_IDS.length})`,
    );
  }
  if (!finalDeductionSolved) {
    missingSummary.push('Complete the Final Deduction in the Case Notebook [TAB]');
  }

  const unlocked = save.forestGateUnlocked || missingSummary.length === 0;

  return {
    unlocked,
    mandatoryFoundCount,
    mandatoryExaminedCount,
    mandatoryTotal: MANDATORY_EVIDENCE_IDS.length,
    audioCluesFoundCount,
    audioCluesTotal: MANDATORY_AUDIO_CLUE_IDS.length,
    finalDeductionSolved,
    missingSummary,
  };
}

export function markEvidenceExamined(save: GameSaveData, evidenceId: string): GameSaveData {
  if (!save.discoveredEvidenceIds.includes(evidenceId)) {
    return save;
  }
  if (save.examinedEvidenceIds.includes(evidenceId)) {
    return save;
  }
  const next: GameSaveData = {
    ...save,
    examinedEvidenceIds: [...save.examinedEvidenceIds, evidenceId],
    lastUpdatedIso: new Date().toISOString(),
  };
  return {
    ...next,
    unlockedLocations: syncUnlockedLocations(next),
  };
}

export function recordAudioPlaybackProgress(
  save: GameSaveData,
  recordingId: string,
  currentTimestampSec: number,
): { nextSave: GameSaveData; newlyUnlockedClueTitle: string | null } {
  const recording = AUDIO_RECORDINGS.find((r) => r.id === recordingId);
  if (!recording) {
    return { nextSave: save, newlyUnlockedClueTitle: null };
  }

  const listened = save.listenedAudioIds.includes(recordingId)
    ? save.listenedAudioIds
    : [...save.listenedAudioIds, recordingId];

  let audioClues = save.discoveredAudioClueIds;
  let newlyUnlockedClueTitle: string | null = null;

  if (
    currentTimestampSec >= recording.hiddenClueTimestampSec &&
    !audioClues.includes(recording.hiddenClueId)
  ) {
    audioClues = [...audioClues, recording.hiddenClueId];
    newlyUnlockedClueTitle = recording.hiddenClueTitle;
  }

  const nextSave: GameSaveData = {
    ...save,
    listenedAudioIds: listened,
    discoveredAudioClueIds: audioClues,
    lastUpdatedIso: new Date().toISOString(),
  };
  return {
    nextSave: {
      ...nextSave,
      unlockedLocations: syncUnlockedLocations(nextSave),
    },
    newlyUnlockedClueTitle,
  };
}

export function solveDeductionInSave(
  save: GameSaveData,
  deductionId: string,
): { nextSave: GameSaveData; solved: boolean; unlockedForestGate: boolean } {
  const node = DEDUCTION_NODES.find((d) => d.id === deductionId);
  if (!node) {
    return { nextSave: save, solved: false, unlockedForestGate: false };
  }
  if (save.completedDeductionIds.includes(deductionId)) {
    const gate = evaluateForestGateStatus(save);
    return {
      nextSave: { ...save, forestGateUnlocked: gate.unlocked },
      solved: true,
      unlockedForestGate: gate.unlocked && !save.forestGateUnlocked,
    };
  }
  if (!canSolveDeduction(node, save)) {
    return { nextSave: save, solved: false, unlockedForestGate: false };
  }

  const nextCompleted = [...save.completedDeductionIds, deductionId];
  const candidate: GameSaveData = {
    ...save,
    completedDeductionIds: nextCompleted,
    lastUpdatedIso: new Date().toISOString(),
  };
  const gate = evaluateForestGateStatus(candidate);
  const unlockedForestGate = gate.unlocked && !save.forestGateUnlocked;
  const finalSave: GameSaveData = {
    ...candidate,
    forestGateUnlocked: gate.unlocked,
    unlockedLocations: gate.unlocked
      ? Array.from(new Set([...syncUnlockedLocations(candidate), 'forest']))
      : syncUnlockedLocations(candidate),
  };

  return {
    nextSave: finalSave,
    solved: true,
    unlockedForestGate,
  };
}

export function getCurrentQuestDirective(save: GameSaveData): string {
  const discovered = new Set(save.discoveredEvidenceIds);
  const gate = evaluateForestGateStatus(save);

  if (save.forestGateUnlocked) {
    if (!save.forestEncounterTriggered) {
      return 'North Forest Gate is open. Follow the pine trail north past the fence to confront what waits.';
    }
    return 'Reach the final clearing at the end of the north forest trail.';
  }

  const playgroundDone =
    discovered.has('ev-jimmy-poster') &&
    discovered.has('ev-broken-duck') &&
    discovered.has('clue-01-beak-shard');
  if (!playgroundDone) {
    return `Playground (${MANDATORY_EVIDENCE_IDS.slice(0, 3).filter((id) => discovered.has(id)).length}/3): Inspect the 1994 Missing Poster, Broken Yellow Duck, and Swing #2.`;
  }

  if (!discovered.has('ev-julian-tape-01') || !discovered.has('ev-surveillance-photo')) {
    return "Maintenance Shed (NE corner): Enter the shed to recover Julian's 1996 cassettes and treeline surveillance photo.";
  }

  if (!discovered.has('ev-jimmy-photo') || !discovered.has('ev-caretaker-log')) {
    return "Caretaker's House (West breach): Cross the broken west fence to examine Jimmy's 1994 portrait and the Caretaker's log.";
  }

  if (!discovered.has('ev-julian-tape-05')) {
    return "Drainage Tunnels (NE culvert): Follow the webbed prints into the culvert to find Julian's final recordings.";
  }

  if (gate.mandatoryExaminedCount < gate.mandatoryTotal || gate.audioCluesFoundCount < gate.audioCluesTotal) {
    return `Open Case Notebook [TAB]: Examine all ${gate.mandatoryTotal} exhibits (${gate.mandatoryExaminedCount}/${gate.mandatoryTotal}) and play Julian's tapes (${gate.audioCluesFoundCount}/${gate.audioCluesTotal} audio clues).`;
  }

  return 'Open Case Notebook [TAB] -> Red-String Board: Solve the Final Deduction to unlock the North Forest Gate.';
}

export function evaluateEndingOutcome(params: {
  save: GameSaveData;
  decision: EndingDecisionId;
  gazeCollapseTriggered?: boolean;
}): EndingId {
  const { save, decision, gazeCollapseTriggered } = params;
  if (gazeCollapseTriggered) {
    return 'erased-investigator';
  }

  const gate = evaluateForestGateStatus(save);
  const hasFullCase =
    gate.mandatoryExaminedCount >= gate.mandatoryTotal &&
    gate.audioCluesFoundCount >= gate.audioCluesTotal &&
    gate.finalDeductionSolved;

  switch (decision) {
    case 'follow-the-voice':
      return 'whispering-drain';
    case 'leave-yellow-token':
      return 'yellow-token';
    case 'confront-truth':
      return save.gazeCollapseCount > 0 && !hasFullCase
        ? 'erased-investigator'
        : hasFullCase
          ? 'true-closure'
          : 'erased-investigator';
    case 'escape-seal-archive':
      return hasFullCase ? 'true-closure' : 'yellow-token';
  }
}

export function getUnlockedAudioRecordings(save: GameSaveData) {
  const discovered = new Set(save.discoveredEvidenceIds);
  return AUDIO_RECORDINGS.map((rec) => ({
    ...rec,
    unlocked: discovered.has(rec.requiredEvidenceId),
    listened: save.listenedAudioIds.includes(rec.id),
    hiddenClueFound: save.discoveredAudioClueIds.includes(rec.hiddenClueId),
    reinterpretationUnlocked: rec.reinterpretationRequiresEvidenceId
      ? discovered.has(rec.reinterpretationRequiresEvidenceId)
      : false,
  }));
}
