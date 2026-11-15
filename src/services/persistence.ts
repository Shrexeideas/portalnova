import { EndingId, GameSaveData, GameSettings, LocationId } from '../types/game';
import { createDefaultSettings, createInitialSave } from '../state/gameRules';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface PersistenceRepository {
  loadSave(): GameSaveData | null;
  saveProgress(save: GameSaveData): void;
  clearSave(): void;
  loadSettings(): GameSettings;
  saveSettings(settings: GameSettings): void;
  unlockEnding(endingId: EndingId): GameSaveData;
}

const SAVE_STORAGE_KEY = 'dlatd.save.v1';
const SETTINGS_STORAGE_KEY = 'dlatd.settings.v1';

const VALID_LOCATIONS = new Set<LocationId>([
  'playground',
  'maintenance-shed',
  'caretakers-house',
  'drainage-tunnels',
  'forest',
]);

function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export class LocalPersistenceRepository implements PersistenceRepository {
  private readonly storage: StorageLike | null;

  constructor(storage?: StorageLike | null) {
    this.storage = storage === undefined ? getBrowserStorage() : storage;
  }

  loadSave(): GameSaveData | null {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<GameSaveData>;
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        typeof parsed.version !== 'number' ||
        typeof parsed.remainingSeconds !== 'number' ||
        !Array.isArray(parsed.discoveredEvidenceIds)
      ) {
        return null;
      }
      const baseline = createInitialSave();
      const unlockedLocations = sanitizeStringArray(parsed.unlockedLocations).filter((loc): loc is LocationId =>
        VALID_LOCATIONS.has(loc as LocationId),
      );
      const currentLocation =
        typeof parsed.currentLocation === 'string' && VALID_LOCATIONS.has(parsed.currentLocation as LocationId)
          ? (parsed.currentLocation as LocationId)
          : baseline.currentLocation;

      return {
        ...baseline,
        ...parsed,
        version: Math.max(2, parsed.version),
        discoveredEvidenceIds: sanitizeStringArray(parsed.discoveredEvidenceIds),
        examinedEvidenceIds: sanitizeStringArray(parsed.examinedEvidenceIds),
        listenedAudioIds: sanitizeStringArray(parsed.listenedAudioIds),
        discoveredAudioClueIds: sanitizeStringArray(parsed.discoveredAudioClueIds),
        completedDeductionIds: sanitizeStringArray(parsed.completedDeductionIds),
        unlockedLocations: unlockedLocations.length > 0 ? unlockedLocations : baseline.unlockedLocations,
        currentLocation,
        forestGateUnlocked: Boolean(parsed.forestGateUnlocked),
        forestEncounterTriggered: Boolean(parsed.forestEncounterTriggered),
        finalDecision: parsed.finalDecision ?? null,
        activeEnding: parsed.activeEnding ?? null,
        duckEncounterCount:
          typeof parsed.duckEncounterCount === 'number' ? parsed.duckEncounterCount : 0,
        gazeCollapseCount:
          typeof parsed.gazeCollapseCount === 'number' ? parsed.gazeCollapseCount : 0,
        unlockedEndings: Array.isArray(parsed.unlockedEndings)
          ? parsed.unlockedEndings.filter((e): e is EndingId => typeof e === 'string')
          : baseline.unlockedEndings,
      };
    } catch {
      return null;
    }
  }

  saveProgress(save: GameSaveData): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
    } catch {
      // Storage quota or private-mode restriction; ignore gracefully
    }
  }

  clearSave(): void {
    if (!this.storage) return;
    try {
      this.storage.removeItem(SAVE_STORAGE_KEY);
    } catch {
      // Ignore storage removal failures
    }
  }

  loadSettings(): GameSettings {
    const defaults = createDefaultSettings();
    if (!this.storage) return defaults;
    try {
      const raw = this.storage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      if (typeof parsed !== 'object' || parsed === null) return defaults;
      return {
        masterVolume:
          typeof parsed.masterVolume === 'number'
            ? Math.min(1, Math.max(0, parsed.masterVolume))
            : defaults.masterVolume,
        binauralAudio:
          typeof parsed.binauralAudio === 'boolean'
            ? parsed.binauralAudio
            : defaults.binauralAudio,
        crtScanlines:
          typeof parsed.crtScanlines === 'boolean'
            ? parsed.crtScanlines
            : defaults.crtScanlines,
        mouseSensitivity:
          typeof parsed.mouseSensitivity === 'number'
            ? Math.min(2.5, Math.max(0.3, parsed.mouseSensitivity))
            : defaults.mouseSensitivity,
        invertY:
          typeof parsed.invertY === 'boolean' ? parsed.invertY : defaults.invertY,
        reducedMotion:
          typeof parsed.reducedMotion === 'boolean'
            ? parsed.reducedMotion
            : defaults.reducedMotion,
      };
    } catch {
      return defaults;
    }
  }

  saveSettings(settings: GameSettings): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage write errors
    }
  }

  unlockEnding(endingId: EndingId): GameSaveData {
    const current = this.loadSave() ?? createInitialSave();
    const updated: GameSaveData = current.unlockedEndings.includes(endingId)
      ? { ...current, activeEnding: endingId, lastUpdatedIso: new Date().toISOString() }
      : {
          ...current,
          activeEnding: endingId,
          unlockedEndings: [...current.unlockedEndings, endingId],
          lastUpdatedIso: new Date().toISOString(),
        };
    this.saveProgress(updated);
    return updated;
  }
}

export const defaultPersistenceRepository = new LocalPersistenceRepository();
