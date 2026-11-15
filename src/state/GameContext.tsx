import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { horrorAudioEngine } from '../audio/horrorAudioEngine';
import {
  CASE_METADATA,
  INITIAL_EVIDENCE_ITEMS,
  LOCATION_CATALOG,
  SAMPLE_INTERACTION_PROMPTS,
} from '../data/caseData';
import { defaultPersistenceRepository } from '../services/persistence';
import {
  EndingDecisionId,
  EvidenceItem,
  EvidenceToastState,
  ForestGateStatus,
  GameSaveData,
  GameSettings,
  HudState,
  InteractionPromptState,
  LocationId,
  LocationStatus,
  ScreenId,
} from '../types/game';
import {
  applySettingsPatch,
  calculateHeartRateFromParanoia,
  canContinueSave,
  catalogEvidenceInSave,
  createInitialHudState,
  createInitialSave,
  getBodyDatasetState,
  getHorrorLevelFromParanoia,
} from './gameRules';
import {
  evaluateEndingOutcome,
  evaluateForestGateStatus,
  getCurrentQuestDirective,
  getLocationStatuses,
  markEvidenceExamined,
  recordAudioPlaybackProgress,
  solveDeductionInSave,
  syncUnlockedLocations,
} from './storyProgression';

interface GameContextValue {
  currentScreen: ScreenId;
  returnScreen: ScreenId;
  isTransitioning: boolean;
  saveData: GameSaveData | null;
  hasContinueSave: boolean;
  settings: GameSettings;
  hudState: HudState;
  evidenceList: EvidenceItem[];
  forestGateStatus: ForestGateStatus;
  locationStatuses: LocationStatus[];
  exitNoticeOpen: boolean;
  navigateTo: (screen: ScreenId, options?: { skipTransition?: boolean }) => void;
  startNewInvestigation: () => void;
  continueInvestigation: () => void;
  enterPlayground: () => void;
  returnFromOverlayScreen: () => void;
  toggleFlashlight: () => void;
  setInteractionPrompt: (prompt: InteractionPromptState | null) => void;
  inspectCurrentTarget: () => void;
  discoverEvidenceById: (evidenceId: string) => void;
  examineEvidence: (evidenceId: string) => void;
  recordAudioProgress: (recordingId: string, timestampSec: number) => string | null;
  solveDeduction: (deductionId: string) => { solved: boolean; unlockedForestGate: boolean };
  reportLocationChange: (location: LocationId) => void;
  triggerForestClimax: () => void;
  dismissForestClimax: () => void;
  submitFinalDecision: (decision: EndingDecisionId) => void;
  triggerGazeCollapse: () => void;
  saveCheckpointNow: () => void;
  updateDuckGaze: (isLookingAtDuck: boolean, deltaSeconds: number) => void;
  registerInteractionHandler: (handler: (() => void) | null) => void;
  triggerEvidenceToast: (toast: Omit<EvidenceToastState, 'id'>) => void;
  dismissToast: () => void;
  updateSettings: (patch: Partial<GameSettings>) => void;
  clearSavedProgress: () => void;
  setExitNoticeOpen: (open: boolean) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function detectAutostart(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('autostart') === '1';
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const autostart = useMemo(() => detectAutostart(), []);
  const initialSave = useMemo(() => defaultPersistenceRepository.loadSave(), []);
  const initialSettings = useMemo(() => defaultPersistenceRepository.loadSettings(), []);

  const [currentScreen, setCurrentScreen] = useState<ScreenId>(
    autostart ? 'gameplay-hud' : 'main-menu',
  );
  const [returnScreen, setReturnScreen] = useState<ScreenId>('main-menu');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [saveData, setSaveData] = useState<GameSaveData | null>(initialSave);
  const [settings, setSettings] = useState<GameSettings>(initialSettings);
  const [hudState, setHudState] = useState<HudState>(() => {
    const base = createInitialHudState(initialSave);
    if (initialSave) {
      base.currentObjective = getCurrentQuestDirective(initialSave);
    }
    return base;
  });
  const [exitNoticeOpen, setExitNoticeOpen] = useState(false);

  const transitionTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const interactionHandlerRef = useRef<(() => void) | null>(null);
  const gazeExposureRef = useRef<number>(0);
  const lastGazeSyncRef = useRef<number>(0);
  const collapseTriggeredRef = useRef<boolean>(false);
  const forestClimaxActiveRef = useRef<boolean>(false);

  forestClimaxActiveRef.current = hudState.forestClimaxActive;

  useEffect(() => {
    document.body.dataset.state = getBodyDatasetState(currentScreen);
  }, [currentScreen]);

  // Sync audio preferences & ambient soundscape lifecycle
  useEffect(() => {
    horrorAudioEngine.setMasterVolume(settings.masterVolume);
    horrorAudioEngine.setBinauralEnabled(settings.binauralAudio);
  }, [settings.binauralAudio, settings.masterVolume]);

  useEffect(() => {
    if (currentScreen === 'gameplay-hud') {
      horrorAudioEngine.startAmbientNight();
    } else {
      horrorAudioEngine.stopAmbientNight();
    }
  }, [currentScreen]);

  useEffect(() => {
    if (currentScreen === 'gameplay-hud') {
      horrorAudioEngine.updateParanoiaIntensity(hudState.paranoia, hudState.gazeWarningActive);
    }
  }, [currentScreen, hudState.gazeWarningActive, hudState.paranoia]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      horrorAudioEngine.stopAmbientNight();
      horrorAudioEngine.stopCassetteAudio();
    };
  }, []);

  const triggerEvidenceToast = useCallback((toast: Omit<EvidenceToastState, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setHudState((prev) => ({
      ...prev,
      evidenceToast: { ...toast, id },
    }));
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setHudState((prev) => ({
        ...prev,
        evidenceToast: prev.evidenceToast?.id === id ? null : prev.evidenceToast,
      }));
    }, 3800);
  }, []);

  const dismissToast = useCallback(() => {
    setHudState((prev) => ({ ...prev, evidenceToast: null }));
  }, []);

  const navigateTo = useCallback(
    (nextScreen: ScreenId, options?: { skipTransition?: boolean }) => {
      setExitNoticeOpen(false);
      if (nextScreen === currentScreen) return;

      if (
        currentScreen === 'main-menu' ||
        currentScreen === 'case-briefing' ||
        currentScreen === 'gameplay-hud'
      ) {
        setReturnScreen(currentScreen);
      }

      if (options?.skipTransition || settings.reducedMotion) {
        setCurrentScreen(nextScreen);
        return;
      }

      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
      setIsTransitioning(true);
      transitionTimerRef.current = window.setTimeout(() => {
        setCurrentScreen(nextScreen);
        setIsTransitioning(false);
      }, 180);
    },
    [currentScreen, settings.reducedMotion],
  );

  const startNewInvestigation = useCallback(() => {
    const freshSave = createInitialSave();
    defaultPersistenceRepository.saveProgress(freshSave);
    setSaveData(freshSave);
    gazeExposureRef.current = 0;
    collapseTriggeredRef.current = false;
    const nextHud = createInitialHudState(freshSave);
    nextHud.currentObjective = getCurrentQuestDirective(freshSave);
    setHudState(nextHud);
    navigateTo('case-briefing');
  }, [navigateTo]);

  const continueInvestigation = useCallback(() => {
    const activeSave = saveData ?? createInitialSave();
    if (!saveData) {
      defaultPersistenceRepository.saveProgress(activeSave);
      setSaveData(activeSave);
    }
    gazeExposureRef.current = 0;
    collapseTriggeredRef.current = false;
    const nextHud = createInitialHudState(activeSave);
    nextHud.currentObjective = getCurrentQuestDirective(activeSave);
    setHudState(nextHud);
    navigateTo('gameplay-hud');
  }, [navigateTo, saveData]);

  const enterPlayground = useCallback(() => {
    const activeSave = saveData ?? createInitialSave();
    defaultPersistenceRepository.saveProgress(activeSave);
    setSaveData(activeSave);
    gazeExposureRef.current = 0;
    collapseTriggeredRef.current = false;
    const nextHud = createInitialHudState(activeSave);
    nextHud.currentObjective = getCurrentQuestDirective(activeSave);
    setHudState(nextHud);
    navigateTo('gameplay-hud');
  }, [navigateTo, saveData]);

  const returnFromOverlayScreen = useCallback(() => {
    navigateTo(returnScreen === currentScreen ? 'main-menu' : returnScreen);
  }, [currentScreen, navigateTo, returnScreen]);

  const toggleFlashlight = useCallback(() => {
    setHudState((prev) => {
      if (!prev.flashlightOn && prev.flashlightBattery <= 0) {
        return prev;
      }
      return {
        ...prev,
        flashlightOn: !prev.flashlightOn,
      };
    });
  }, []);

  const setInteractionPrompt = useCallback((prompt: InteractionPromptState | null) => {
    setHudState((prev) => ({
      ...prev,
      interactionPrompt: prompt,
    }));
  }, []);

  const discoverEvidenceById = useCallback(
    (evidenceId: string) => {
      const targetItem =
        INITIAL_EVIDENCE_ITEMS.find((item) => item.id === evidenceId) ?? INITIAL_EVIDENCE_ITEMS[0];
      const activeSave = saveData ?? createInitialSave();
      const alreadyFound = activeSave.discoveredEvidenceIds.includes(targetItem.id);
      const prevUnlocked = new Set(syncUnlockedLocations(activeSave));

      const nextParanoia = alreadyFound
        ? hudState.paranoia
        : Math.min(92, hudState.paranoia + 7);

      const cataloged = catalogEvidenceInSave(
        activeSave,
        targetItem.id,
        hudState.remainingSeconds,
        hudState.flashlightBattery,
        nextParanoia,
      );
      const unlockedLocations = syncUnlockedLocations(cataloged);
      const updatedSave: GameSaveData = {
        ...cataloged,
        unlockedLocations,
      };

      defaultPersistenceRepository.saveProgress(updatedSave);
      setSaveData(updatedSave);

      const newlyUnlockedSector = unlockedLocations.find((loc) => !prevUnlocked.has(loc));
      const nextDirective = getCurrentQuestDirective(updatedSave);

      setHudState((prev) => ({
        ...prev,
        paranoia: nextParanoia,
        heartRateBpm: calculateHeartRateFromParanoia(nextParanoia),
        horrorLevel: getHorrorLevelFromParanoia(nextParanoia),
        forestGateUnlocked: updatedSave.forestGateUnlocked,
        currentObjective: nextDirective,
      }));

      if (newlyUnlockedSector && newlyUnlockedSector !== 'forest') {
        triggerEvidenceToast({
          subtitle: `${targetItem.code} // SECTOR UNLOCKED`,
          message: `${targetItem.title} — ${LOCATION_CATALOG[newlyUnlockedSector].name} is now accessible.`,
          tone: 'evidence',
        });
      } else {
        triggerEvidenceToast({
          subtitle: alreadyFound ? `${targetItem.code} // REVIEWED` : `${targetItem.code} // LOGGED`,
          message: `${targetItem.title} — ${targetItem.summary}`,
          tone: 'evidence',
        });
      }
    },
    [
      hudState.flashlightBattery,
      hudState.paranoia,
      hudState.remainingSeconds,
      saveData,
      triggerEvidenceToast,
    ],
  );

  const examineEvidence = useCallback(
    (evidenceId: string) => {
      const activeSave = saveData ?? createInitialSave();
      const updated = markEvidenceExamined(activeSave, evidenceId);
      if (updated === activeSave) return;
      defaultPersistenceRepository.saveProgress(updated);
      setSaveData(updated);
      setHudState((prev) => ({
        ...prev,
        currentObjective: getCurrentQuestDirective(updated),
      }));
    },
    [saveData],
  );

  const recordAudioProgress = useCallback(
    (recordingId: string, timestampSec: number): string | null => {
      const activeSave = saveData ?? createInitialSave();
      const { nextSave, newlyUnlockedClueTitle } = recordAudioPlaybackProgress(
        activeSave,
        recordingId,
        timestampSec,
      );
      if (nextSave !== activeSave) {
        defaultPersistenceRepository.saveProgress(nextSave);
        setSaveData(nextSave);
        setHudState((prev) => ({
          ...prev,
          currentObjective: getCurrentQuestDirective(nextSave),
        }));
      }
      if (newlyUnlockedClueTitle) {
        triggerEvidenceToast({
          subtitle: 'AUDIO ANOMALY DECODED',
          message: `${newlyUnlockedClueTitle} logged in Case Notebook.`,
          tone: 'evidence',
        });
      }
      return newlyUnlockedClueTitle;
    },
    [saveData, triggerEvidenceToast],
  );

  const solveDeduction = useCallback(
    (deductionId: string): { solved: boolean; unlockedForestGate: boolean } => {
      const activeSave = saveData ?? createInitialSave();
      const result = solveDeductionInSave(activeSave, deductionId);
      if (!result.solved) {
        return { solved: false, unlockedForestGate: false };
      }
      defaultPersistenceRepository.saveProgress(result.nextSave);
      setSaveData(result.nextSave);
      setHudState((prev) => ({
        ...prev,
        forestGateUnlocked: result.nextSave.forestGateUnlocked,
        currentObjective: getCurrentQuestDirective(result.nextSave),
      }));

      if (result.unlockedForestGate) {
        horrorAudioEngine.playGateLockClank(true);
        triggerEvidenceToast({
          subtitle: 'NORTH FOREST GATE UNLOCKED',
          message: 'Final deduction complete. The iron lock beyond the north fence has released.',
          tone: 'evidence',
        });
      }
      return {
        solved: true,
        unlockedForestGate: result.unlockedForestGate,
      };
    },
    [saveData, triggerEvidenceToast],
  );

  const reportLocationChange = useCallback(
    (location: LocationId) => {
      setHudState((prev) => {
        if (prev.currentLocation === location) return prev;
        return {
          ...prev,
          currentLocation: location,
        };
      });
      setSaveData((prev) => {
        if (!prev || prev.currentLocation === location) return prev;
        const next: GameSaveData = {
          ...prev,
          currentLocation: location,
          sectorLabel: LOCATION_CATALOG[location].name,
          lastUpdatedIso: new Date().toISOString(),
        };
        defaultPersistenceRepository.saveProgress(next);
        return next;
      });
      if (location !== 'playground') {
        triggerEvidenceToast({
          subtitle: 'SECTOR ENTERED',
          message: `${LOCATION_CATALOG[location].name} — ${LOCATION_CATALOG[location].subtitle}`,
          tone: 'info',
        });
      }
    },
    [triggerEvidenceToast],
  );

  const triggerForestClimax = useCallback(() => {
    setHudState((prev) => ({
      ...prev,
      forestClimaxActive: true,
      paranoia: Math.max(prev.paranoia, 78),
      heartRateBpm: calculateHeartRateFromParanoia(Math.max(prev.paranoia, 78)),
      horrorLevel: 'CRITICAL',
    }));
    setSaveData((prev) => {
      if (!prev) return prev;
      const next: GameSaveData = {
        ...prev,
        forestEncounterTriggered: true,
        duckEncounterCount: prev.duckEncounterCount + 1,
        lastUpdatedIso: new Date().toISOString(),
      };
      defaultPersistenceRepository.saveProgress(next);
      return next;
    });
  }, []);

  const dismissForestClimax = useCallback(() => {
    setHudState((prev) => ({
      ...prev,
      forestClimaxActive: false,
    }));
  }, []);

  const submitFinalDecision = useCallback(
    (decision: EndingDecisionId) => {
      const activeSave = saveData ?? createInitialSave();
      const endingId = evaluateEndingOutcome({
        save: activeSave,
        decision,
      });
      const unlockedEndings = activeSave.unlockedEndings.includes(endingId)
        ? activeSave.unlockedEndings
        : [...activeSave.unlockedEndings, endingId];

      const nextSave: GameSaveData = {
        ...activeSave,
        finalDecision: decision,
        activeEnding: endingId,
        unlockedEndings,
        remainingSeconds: hudState.remainingSeconds,
        flashlightBattery: Math.round(hudState.flashlightBattery),
        paranoia: hudState.paranoia,
        lastUpdatedIso: new Date().toISOString(),
      };
      defaultPersistenceRepository.saveProgress(nextSave);
      setSaveData(nextSave);
      setHudState((prev) => ({
        ...prev,
        forestClimaxActive: false,
      }));
      navigateTo('incident-outcome');
    },
    [hudState.flashlightBattery, hudState.paranoia, hudState.remainingSeconds, navigateTo, saveData],
  );

  const triggerGazeCollapse = useCallback(() => {
    if (collapseTriggeredRef.current) return;
    collapseTriggeredRef.current = true;
    document.exitPointerLock?.();

    const activeSave = saveData ?? createInitialSave();
    const unlockedEndings = activeSave.unlockedEndings.includes('erased-investigator')
      ? activeSave.unlockedEndings
      : [...activeSave.unlockedEndings, 'erased-investigator' as const];

    const nextSave: GameSaveData = {
      ...activeSave,
      gazeCollapseCount: activeSave.gazeCollapseCount + 1,
      duckEncounterCount: activeSave.duckEncounterCount + 1,
      activeEnding: 'erased-investigator',
      unlockedEndings,
      paranoia: 96,
      lastUpdatedIso: new Date().toISOString(),
    };
    defaultPersistenceRepository.saveProgress(nextSave);
    setSaveData(nextSave);
    setHudState((prev) => ({
      ...prev,
      forestClimaxActive: false,
      gazeWarningActive: false,
    }));
    navigateTo('game-over');
  }, [navigateTo, saveData]);

  const saveCheckpointNow = useCallback(() => {
    const activeSave = saveData ?? createInitialSave();
    const nextSave: GameSaveData = {
      ...activeSave,
      remainingSeconds: Math.max(0, Math.round(hudState.remainingSeconds)),
      flashlightBattery: Math.max(0, Math.min(100, Math.round(hudState.flashlightBattery))),
      paranoia: Math.max(0, Math.min(100, Math.round(hudState.paranoia))),
      currentLocation: hudState.currentLocation,
      sectorLabel: LOCATION_CATALOG[hudState.currentLocation].name,
      lastUpdatedIso: new Date().toISOString(),
    };
    defaultPersistenceRepository.saveProgress(nextSave);
    setSaveData(nextSave);
    triggerEvidenceToast({
      subtitle: 'CHECKPOINT COMMITTED',
      message: 'Investigation telemetry saved to local archive.',
      tone: 'info',
    });
  }, [
    hudState.currentLocation,
    hudState.flashlightBattery,
    hudState.paranoia,
    hudState.remainingSeconds,
    saveData,
    triggerEvidenceToast,
  ]);

  const registerInteractionHandler = useCallback((handler: (() => void) | null) => {
    interactionHandlerRef.current = handler;
  }, []);

  const updateDuckGaze = useCallback(
    (isLookingAtDuck: boolean, deltaSeconds: number) => {
      const prevExp = gazeExposureRef.current;
      const nextExp = isLookingAtDuck
        ? Math.min(2.2, prevExp + deltaSeconds)
        : Math.max(0, prevExp - deltaSeconds * 0.9);
      gazeExposureRef.current = nextExp;

      if (
        nextExp >= CASE_METADATA.gazeThresholdSeconds &&
        !collapseTriggeredRef.current &&
        !forestClimaxActiveRef.current
      ) {
        horrorAudioEngine.playDuckCue('gaze-sting');
        triggerGazeCollapse();
        return;
      }

      const now = performance.now();
      const warningNow = nextExp > 0.35;
      if (now - lastGazeSyncRef.current < 280 && !warningNow) return;
      if (now - lastGazeSyncRef.current < 240) return;
      lastGazeSyncRef.current = now;

      setHudState((prev) => {
        const paranoiaDelta = isLookingAtDuck ? 1.8 : 0;
        const nextParanoia = Math.min(96, Math.max(12, Math.round(prev.paranoia + paranoiaDelta)));
        if (
          prev.gazeWarningActive === warningNow &&
          Math.abs(prev.gazeExposureSeconds - nextExp) < 0.15 &&
          nextParanoia === prev.paranoia
        ) {
          return prev;
        }
        return {
          ...prev,
          paranoia: nextParanoia,
          heartRateBpm: calculateHeartRateFromParanoia(nextParanoia),
          horrorLevel: getHorrorLevelFromParanoia(nextParanoia),
          gazeExposureSeconds: Number(nextExp.toFixed(2)),
          gazeWarningActive: warningNow,
        };
      });
    },
    [triggerGazeCollapse],
  );

  const inspectCurrentTarget = useCallback(() => {
    if (interactionHandlerRef.current) {
      interactionHandlerRef.current();
      return;
    }
    const activeSave = saveData ?? createInitialSave();
    const undiscovered = INITIAL_EVIDENCE_ITEMS.filter(
      (item) => !activeSave.discoveredEvidenceIds.includes(item.id),
    );
    const nextItem = undiscovered[0] ?? INITIAL_EVIDENCE_ITEMS[0];

    const nextParanoia = Math.min(92, hudState.paranoia + 7);
    const cataloged = catalogEvidenceInSave(
      activeSave,
      nextItem.id,
      hudState.remainingSeconds,
      hudState.flashlightBattery,
      nextParanoia,
    );
    const updatedSave: GameSaveData = {
      ...cataloged,
      unlockedLocations: syncUnlockedLocations(cataloged),
    };
    defaultPersistenceRepository.saveProgress(updatedSave);
    setSaveData(updatedSave);

    const nextPromptIndex =
      updatedSave.discoveredEvidenceIds.length % SAMPLE_INTERACTION_PROMPTS.length;

    setHudState((prev) => ({
      ...prev,
      paranoia: nextParanoia,
      heartRateBpm: calculateHeartRateFromParanoia(nextParanoia),
      horrorLevel: getHorrorLevelFromParanoia(nextParanoia),
      currentObjective: getCurrentQuestDirective(updatedSave),
      interactionPrompt: { ...SAMPLE_INTERACTION_PROMPTS[nextPromptIndex] },
    }));

    triggerEvidenceToast({
      subtitle: `${nextItem.code} // LOGGED`,
      message: `${nextItem.title} — ${nextItem.summary}`,
      tone: 'evidence',
    });
  }, [
    hudState.flashlightBattery,
    hudState.paranoia,
    hudState.remainingSeconds,
    saveData,
    triggerEvidenceToast,
  ]);

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = applySettingsPatch(prev, patch);
      defaultPersistenceRepository.saveSettings(next);
      return next;
    });
  }, []);

  const clearSavedProgress = useCallback(() => {
    defaultPersistenceRepository.clearSave();
    setSaveData(null);
    gazeExposureRef.current = 0;
    collapseTriggeredRef.current = false;
    setHudState(createInitialHudState(null));
    triggerEvidenceToast({
      subtitle: 'ARCHIVE PURGED',
      message: 'Local investigation checkpoint cleared.',
      tone: 'info',
    });
  }, [triggerEvidenceToast]);

  // 1 Hz countdown & ambient biometric loop strictly during active gameplay
  useEffect(() => {
    if (currentScreen !== 'gameplay-hud') return;

    const interval = window.setInterval(() => {
      setHudState((prev) => {
        if (prev.forestClimaxActive) return prev;
        const nextRemaining = Math.max(0, prev.remainingSeconds - 1);
        const batteryDrain = prev.flashlightOn ? 0.15 : 0;
        const nextBattery = Math.max(0, Number((prev.flashlightBattery - batteryDrain).toFixed(2)));
        const nextFlashlightOn = nextBattery <= 0 ? false : prev.flashlightOn;
        const jitter = Math.round((Math.random() - 0.5) * 3);
        const nextBpm = Math.max(
          72,
          Math.min(180, calculateHeartRateFromParanoia(prev.paranoia) + jitter),
        );
        return {
          ...prev,
          remainingSeconds: nextRemaining,
          flashlightBattery: nextBattery,
          flashlightOn: nextFlashlightOn,
          heartRateBpm: nextBpm,
          horrorLevel: getHorrorLevelFromParanoia(prev.paranoia),
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentScreen]);

  const effectiveSave = useMemo(() => saveData ?? createInitialSave(), [saveData]);

  const evidenceList = useMemo(() => {
    const ids = new Set(effectiveSave.discoveredEvidenceIds);
    return INITIAL_EVIDENCE_ITEMS.map((item) => ({
      ...item,
      discovered: ids.has(item.id),
    }));
  }, [effectiveSave.discoveredEvidenceIds]);

  const forestGateStatus = useMemo(() => evaluateForestGateStatus(effectiveSave), [effectiveSave]);
  const locationStatuses = useMemo(() => getLocationStatuses(effectiveSave), [effectiveSave]);

  const value: GameContextValue = {
    currentScreen,
    returnScreen,
    isTransitioning,
    saveData,
    hasContinueSave: canContinueSave(saveData),
    settings,
    hudState,
    evidenceList,
    forestGateStatus,
    locationStatuses,
    exitNoticeOpen,
    navigateTo,
    startNewInvestigation,
    continueInvestigation,
    enterPlayground,
    returnFromOverlayScreen,
    toggleFlashlight,
    setInteractionPrompt,
    inspectCurrentTarget,
    discoverEvidenceById,
    examineEvidence,
    recordAudioProgress,
    solveDeduction,
    reportLocationChange,
    triggerForestClimax,
    dismissForestClimax,
    submitFinalDecision,
    triggerGazeCollapse,
    saveCheckpointNow,
    updateDuckGaze,
    registerInteractionHandler,
    triggerEvidenceToast,
    dismissToast,
    updateSettings,
    clearSavedProgress,
    setExitNoticeOpen,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return ctx;
}
