import { CASE_METADATA } from '../data/caseData';
import {
  BodyDatasetState,
  GameSaveData,
  GameSettings,
  HorrorLevel,
  HudState,
  LocationId,
  ScreenId,
} from '../types/game';

export function createDefaultSettings(): GameSettings {
  return {
    masterVolume: 0.75,
    binauralAudio: true,
    crtScanlines: true,
    mouseSensitivity: 1.0,
    invertY: false,
    reducedMotion: false,
  };
}

export function createInitialSave(nowIso: string = new Date().toISOString()): GameSaveData {
  return {
    version: 2,
    caseId: CASE_METADATA.caseNumber,
    investigatorId: CASE_METADATA.terminalAuth,
    sectorLabel: 'Oak Park — Central Playground',
    nightLabel: 'Night 1 (2026)',
    timestampLabel: '03:17 AM',
    remainingSeconds: CASE_METADATA.investigationDurationSeconds,
    flashlightBattery: 88,
    paranoia: 18,
    discoveredEvidenceIds: [],
    examinedEvidenceIds: [],
    listenedAudioIds: [],
    discoveredAudioClueIds: [],
    completedDeductionIds: [],
    unlockedLocations: ['playground'],
    currentLocation: 'playground',
    forestGateUnlocked: false,
    forestEncounterTriggered: false,
    finalDecision: null,
    activeEnding: null,
    duckEncounterCount: 0,
    gazeCollapseCount: 0,
    unlockedEndings: [],
    lastUpdatedIso: nowIso,
  };
}

export function createInitialHudState(save?: GameSaveData | null): HudState {
  const paranoia = save?.paranoia ?? 18;
  const unlockedForest = save?.forestGateUnlocked ?? false;
  return {
    remainingSeconds: save?.remainingSeconds ?? CASE_METADATA.investigationDurationSeconds,
    currentObjective: unlockedForest
      ? 'North Forest Gate unlocked. Enter the Forest beyond the north fence.'
      : 'Inspect the 1994 Missing Poster, Broken Duck Toy, and Swing #2 inside the playground.',
    currentLocation: (save?.currentLocation ?? 'playground') as LocationId,
    flashlightOn: true,
    flashlightBattery: save?.flashlightBattery ?? 88,
    paranoia,
    heartRateBpm: calculateHeartRateFromParanoia(paranoia),
    horrorLevel: getHorrorLevelFromParanoia(paranoia),
    interactionPrompt: {
      targetId: 'missing-poster-board',
      keyLabel: 'E',
      verb: 'READ',
      label: '1994 MISSING POSTER: JIMMY MERCER',
      detail: 'Nov 1994 // Notice Board',
    },
    evidenceToast: null,
    gazeExposureSeconds: 0,
    gazeWarningActive: false,
    forestGateUnlocked: unlockedForest,
    forestClimaxActive: false,
  };
}

export function getHorrorLevelFromParanoia(paranoia: number): HorrorLevel {
  const clamped = Math.max(0, Math.min(100, paranoia));
  if (clamped >= 75) return 'CRITICAL';
  if (clamped >= 50) return 'THREATENING';
  if (clamped >= 25) return 'UNEASY';
  return 'CALM';
}

export function calculateHeartRateFromParanoia(paranoia: number): number {
  const clamped = Math.max(0, Math.min(100, paranoia));
  return Math.round(74 + clamped * 0.95);
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatClockTime(elapsedSeconds: number): string {
  const baseSeconds = 2 * 3600 + 14 * 60 + 32;
  const total = baseSeconds + Math.max(0, Math.floor(elapsedSeconds));
  const hrs = Math.floor(total / 3600) % 24;
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function canContinueSave(save: GameSaveData | null): boolean {
  if (!save) return false;
  return (
    save.discoveredEvidenceIds.length > 0 ||
    save.examinedEvidenceIds.length > 0 ||
    save.listenedAudioIds.length > 0 ||
    save.remainingSeconds < CASE_METADATA.investigationDurationSeconds ||
    save.unlockedEndings.length > 0
  );
}

export function getBodyDatasetState(screen: ScreenId): BodyDatasetState {
  switch (screen) {
    case 'main-menu':
      return 'title';
    case 'case-briefing':
      return 'briefing';
    case 'gameplay-hud':
      return 'playing';
    case 'pause-and-system':
    case 'investigation-notebook':
      return 'paused';
    case 'chapter-archive':
      return 'archive';
    case 'incident-outcome':
    case 'game-over':
      return 'gameover';
  }
}

export function applySettingsPatch(
  current: GameSettings,
  patch: Partial<GameSettings>,
): GameSettings {
  return {
    masterVolume:
      patch.masterVolume !== undefined
        ? Math.min(1, Math.max(0, patch.masterVolume))
        : current.masterVolume,
    binauralAudio: patch.binauralAudio ?? current.binauralAudio,
    crtScanlines: patch.crtScanlines ?? current.crtScanlines,
    mouseSensitivity:
      patch.mouseSensitivity !== undefined
        ? Math.min(2.5, Math.max(0.3, patch.mouseSensitivity))
        : current.mouseSensitivity,
    invertY: patch.invertY ?? current.invertY,
    reducedMotion: patch.reducedMotion ?? current.reducedMotion,
  };
}

export function catalogEvidenceInSave(
  save: GameSaveData,
  evidenceId: string,
  remainingSeconds: number,
  flashlightBattery: number,
  paranoia: number,
): GameSaveData {
  const discovered = save.discoveredEvidenceIds.includes(evidenceId)
    ? save.discoveredEvidenceIds
    : [...save.discoveredEvidenceIds, evidenceId];

  return {
    ...save,
    remainingSeconds: Math.max(0, Math.round(remainingSeconds)),
    flashlightBattery: Math.max(0, Math.min(100, Math.round(flashlightBattery))),
    paranoia: Math.max(0, Math.min(100, Math.round(paranoia))),
    discoveredEvidenceIds: discovered,
    lastUpdatedIso: new Date().toISOString(),
  };
}

export function resolveNavigationTarget(
  requested: ScreenId,
  save: GameSaveData | null,
): ScreenId {
  if (requested === 'gameplay-hud' && !save) {
    return 'gameplay-hud';
  }
  return requested;
}
