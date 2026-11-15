export type ScreenId =
  | 'main-menu'
  | 'case-briefing'
  | 'gameplay-hud'
  | 'investigation-notebook'
  | 'pause-and-system'
  | 'chapter-archive'
  | 'incident-outcome'
  | 'game-over';

export type BodyDatasetState =
  | 'title'
  | 'briefing'
  | 'playing'
  | 'paused'
  | 'gameover'
  | 'archive';

export type HorrorLevel = 'CALM' | 'UNEASY' | 'THREATENING' | 'CRITICAL';

export type EndingId =
  | 'erased-investigator'
  | 'yellow-token'
  | 'whispering-drain'
  | 'true-closure';

export type LocationId =
  | 'playground'
  | 'maintenance-shed'
  | 'caretakers-house'
  | 'drainage-tunnels'
  | 'forest';

export type DuckAiState =
  | 'HIDDEN'
  | 'OBSERVING'
  | 'PEEKING'
  | 'FOLLOWING'
  | 'RELOCATING'
  | 'INTERFERING'
  | 'APPROACHING'
  | 'ENCOUNTER';

export type EndingDecisionId =
  | 'confront-truth'
  | 'leave-yellow-token'
  | 'follow-the-voice'
  | 'escape-seal-archive';

export interface EvidenceItem {
  id: string;
  code: string;
  title: string;
  sector: string;
  locationId: LocationId;
  year: 1994 | 1996 | 2026;
  category: 'photo' | 'tape' | 'physical' | 'document';
  mandatoryForForest: boolean;
  summary: string;
  forensicNote: string;
  ambiguityNote: string;
  quote?: string;
  linkedAudioId?: string;
  discovered: boolean;
}

export interface AudioTranscriptSegment {
  atSec: number;
  speaker: string;
  text: string;
  isHiddenClue?: boolean;
}

export interface AudioRecording {
  id: string;
  code: string;
  title: string;
  recordedYear: 1996;
  recordedTimestamp: string;
  locationLabel: string;
  requiredEvidenceId: string;
  durationSec: number;
  hiddenClueTimestampSec: number;
  hiddenClueId: string;
  hiddenClueTitle: string;
  hiddenClueNote: string;
  reinterpretationRequiresEvidenceId?: string;
  reinterpretationNote?: string;
  transcript: AudioTranscriptSegment[];
}

export interface DeductionNode {
  id: string;
  title: string;
  premiseA: string;
  premiseB: string;
  requiredEvidenceIds: string[];
  requiredAudioClueIds: string[];
  conclusion: string;
  isFinalDeduction: boolean;
}

export interface LocationStatus {
  id: LocationId;
  name: string;
  subtitle: string;
  unlocked: boolean;
  unlockRequirementHint: string;
}

export interface ForestGateStatus {
  unlocked: boolean;
  mandatoryFoundCount: number;
  mandatoryExaminedCount: number;
  mandatoryTotal: number;
  audioCluesFoundCount: number;
  audioCluesTotal: number;
  finalDeductionSolved: boolean;
  missingSummary: string[];
}

export interface InteractionPromptState {
  targetId: string;
  keyLabel: string;
  verb: string;
  label: string;
  detail?: string;
}

export interface EvidenceToastState {
  id: string;
  subtitle: string;
  message: string;
  tone: 'info' | 'warning' | 'evidence';
}

export interface HudState {
  remainingSeconds: number;
  currentObjective: string;
  currentLocation: LocationId;
  flashlightOn: boolean;
  flashlightBattery: number;
  paranoia: number;
  heartRateBpm: number;
  horrorLevel: HorrorLevel;
  interactionPrompt: InteractionPromptState | null;
  evidenceToast: EvidenceToastState | null;
  gazeExposureSeconds: number;
  gazeWarningActive: boolean;
  forestGateUnlocked: boolean;
  forestClimaxActive: boolean;
}

export interface GameSettings {
  masterVolume: number;
  binauralAudio: boolean;
  crtScanlines: boolean;
  mouseSensitivity: number;
  invertY: boolean;
  reducedMotion: boolean;
}

export interface GameSaveData {
  version: number;
  caseId: string;
  investigatorId: string;
  sectorLabel: string;
  nightLabel: string;
  timestampLabel: string;
  remainingSeconds: number;
  flashlightBattery: number;
  paranoia: number;
  discoveredEvidenceIds: string[];
  examinedEvidenceIds: string[];
  listenedAudioIds: string[];
  discoveredAudioClueIds: string[];
  completedDeductionIds: string[];
  unlockedLocations: LocationId[];
  currentLocation: LocationId;
  forestGateUnlocked: boolean;
  forestEncounterTriggered: boolean;
  finalDecision: EndingDecisionId | null;
  activeEnding: EndingId | null;
  duckEncounterCount: number;
  gazeCollapseCount: number;
  unlockedEndings: EndingId[];
  lastUpdatedIso: string;
}

export interface LoreDiscrepancy {
  id: string;
  sourceFile: string;
  conflict: string;
  unifiedResolution: string;
}

export interface EndingDefinition {
  id: EndingId;
  code: string;
  title: string;
  subtitle: string;
  statusTag: string;
  narrativeSummary: string;
  ambiguityPostscript: string;
}
