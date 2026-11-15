import React, { useEffect, useRef } from 'react';
import { FinalDecisionModal } from '../components/FinalDecisionModal';
import { GameplayHud } from '../components/GameplayHud';
import { PlaygroundEngine } from '../scene/PlaygroundEngine';
import { useGame } from '../state/GameContext';
import { createInitialSave } from '../state/gameRules';
import { isLocationUnlocked } from '../state/storyProgression';

export const GameplayScreen: React.FC = () => {
  const {
    hudState,
    settings,
    saveData,
    forestGateStatus,
    toggleFlashlight,
    setInteractionPrompt,
    discoverEvidenceById,
    updateDuckGaze,
    reportLocationChange,
    triggerForestClimax,
    registerInteractionHandler,
    triggerEvidenceToast,
    navigateTo,
  } = useGame();

  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<PlaygroundEngine | null>(null);

  const effectiveSave = saveData ?? createInitialSave();
  const progressionSnapshot = {
    shedUnlocked: isLocationUnlocked('maintenance-shed', effectiveSave),
    caretakerUnlocked: isLocationUnlocked('caretakers-house', effectiveSave),
    tunnelsUnlocked: isLocationUnlocked('drainage-tunnels', effectiveSave),
    forestGateUnlocked: forestGateStatus.unlocked,
    evidenceCount: effectiveSave.discoveredEvidenceIds.length,
    paranoia: hudState.paranoia,
    forestClimaxActive: hudState.forestClimaxActive,
  };

  const callbacksRef = useRef({
    discoverEvidenceById,
    setInteractionPrompt,
    updateDuckGaze,
    triggerEvidenceToast,
    reportLocationChange,
    triggerForestClimax,
    forestGateStatus,
  });
  callbacksRef.current = {
    discoverEvidenceById,
    setInteractionPrompt,
    updateDuckGaze,
    triggerEvidenceToast,
    reportLocationChange,
    triggerForestClimax,
    forestGateStatus,
  };

  // Mount Three.js WebGL scene once on screen entry without tearing down on HUD state ticks
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new PlaygroundEngine(
      container,
      {
        flashlightOn: hudState.flashlightOn,
        mouseSensitivity: settings.mouseSensitivity,
        invertY: settings.invertY,
        reducedMotion: settings.reducedMotion,
      },
      saveData?.discoveredEvidenceIds ?? [],
      {
        onEvidenceDiscovered: (id) => callbacksRef.current.discoverEvidenceById(id),
        onEnvironmentalInspect: (_id, subtitle, message) =>
          callbacksRef.current.triggerEvidenceToast({
            subtitle,
            message,
            tone: 'info',
          }),
        onPromptChange: (prompt) => callbacksRef.current.setInteractionPrompt(prompt),
        onGazeUpdate: (isLooking, dt) => callbacksRef.current.updateDuckGaze(isLooking, dt),
        onLocationChange: (loc) => callbacksRef.current.reportLocationChange(loc),
        onForestClimaxReached: () => callbacksRef.current.triggerForestClimax(),
        onGateBlockedInspect: () => {
          const gate = callbacksRef.current.forestGateStatus;
          callbacksRef.current.triggerEvidenceToast({
            subtitle: 'NORTH FOREST GATE PADLOCKED',
            message:
              gate.missingSummary[0] ??
              'Examine all 8 core clues, decode Julian’s tapes, and solve the Final Deduction in Notebook [TAB].',
            tone: 'warning',
          });
        },
      },
      progressionSnapshot,
    );

    engineRef.current = engine;
    registerInteractionHandler(() => engine.triggerActiveInteraction());

    return () => {
      registerInteractionHandler(null);
      engine.dispose();
      engineRef.current = null;
    };
    // Intentionally mounted once per GameplayScreen lifecycle; dynamic settings & progression sync below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync flashlight and user calibration settings live without recreating WebGLRenderer
  useEffect(() => {
    engineRef.current?.updateSettings({
      flashlightOn: hudState.flashlightOn,
      mouseSensitivity: settings.mouseSensitivity,
      invertY: settings.invertY,
      reducedMotion: settings.reducedMotion,
    });
  }, [
    hudState.flashlightOn,
    settings.mouseSensitivity,
    settings.invertY,
    settings.reducedMotion,
  ]);

  // Sync discovered evidence IDs to 3D raycaster prompt labels
  useEffect(() => {
    engineRef.current?.updateDiscoveredEvidence(saveData?.discoveredEvidenceIds ?? []);
  }, [saveData?.discoveredEvidenceIds]);

  // Sync progression unlocks (Shed door, Forest Gate, paranoia, climax state)
  useEffect(() => {
    engineRef.current?.updateProgressionState({
      shedUnlocked: progressionSnapshot.shedUnlocked,
      caretakerUnlocked: progressionSnapshot.caretakerUnlocked,
      tunnelsUnlocked: progressionSnapshot.tunnelsUnlocked,
      forestGateUnlocked: progressionSnapshot.forestGateUnlocked,
      evidenceCount: progressionSnapshot.evidenceCount,
      paranoia: progressionSnapshot.paranoia,
      forestClimaxActive: progressionSnapshot.forestClimaxActive,
    });
  }, [
    progressionSnapshot.caretakerUnlocked,
    progressionSnapshot.evidenceCount,
    progressionSnapshot.forestClimaxActive,
    progressionSnapshot.forestGateUnlocked,
    progressionSnapshot.paranoia,
    progressionSnapshot.shedUnlocked,
    progressionSnapshot.tunnelsUnlocked,
  ]);

  // Global gameplay action keys ([F] flashlight, [E] interact, [Tab] notebook, [Esc] pause)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (hudState.forestClimaxActive) {
        if (e.key === 'Escape') {
          e.preventDefault();
          navigateTo('pause-and-system');
        }
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFlashlight();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        engineRef.current?.triggerActiveInteraction();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        document.exitPointerLock?.();
        navigateTo('investigation-notebook');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        document.exitPointerLock?.();
        navigateTo('pause-and-system');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hudState.forestClimaxActive, navigateTo, toggleFlashlight]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-surface-container-lowest cursor-crosshair select-none"
      data-testid="playground-viewport"
    >
      {/* Isolated Live 3D Three.js WebGL Canvas Container */}
      <div
        ref={mountRef}
        data-testid="three-scene-mount"
        className="absolute inset-0"
      />

      {/* Minimal Gameplay HUD Overlay (zero backdrop-blur) */}
      <GameplayHud />

      {/* Final Forest Clearing Decision Overlay (zero backdrop-blur) */}
      <FinalDecisionModal />
    </div>
  );
};
