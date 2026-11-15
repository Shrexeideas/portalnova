import React from 'react';
import { CASE_METADATA, LOCATION_CATALOG } from '../data/caseData';
import { useGame } from '../state/GameContext';
import { formatCountdown } from '../state/gameRules';

export const GameplayHud: React.FC = () => {
  const {
    hudState,
    evidenceList,
    forestGateStatus,
    toggleFlashlight,
    inspectCurrentTarget,
    navigateTo,
    dismissToast,
  } = useGame();

  const discoveredCount = evidenceList.filter((item) => item.discovered).length;
  const activeSegments = Math.max(1, Math.min(6, Math.ceil((hudState.paranoia / 100) * 6)));
  const batteryPct = Math.round(hudState.flashlightBattery);
  const sectorName = LOCATION_CATALOG[hudState.currentLocation]?.name ?? '01 // Central Playground';

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-gutter sm:p-gutter-lg">
      {/* Subtle Paranoia Edge Vignette (no backdrop-blur) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 transition-opacity duration-300"
        style={{
          opacity: hudState.gazeWarningActive
            ? 0.9
            : hudState.paranoia > 35
              ? Math.min(0.75, (hudState.paranoia - 30) / 70)
              : 0.15,
          boxShadow: hudState.gazeWarningActive
            ? 'inset 0 0 180px rgba(217, 56, 41, 0.8)'
            : 'inset 0 0 150px rgba(186, 24, 27, 0.5)',
        }}
      />

      {/* TOP HUD ROW: Investigation Countdown + Current Objective (Left) | Paranoia Threat Meter (Right) */}
      <div className="relative z-10 flex items-start justify-between gap-space-md">
        {/* Top-Left Cluster */}
        <div className="flex flex-col gap-space-xs max-w-md pointer-events-auto">
          <div className="flex flex-wrap items-center gap-space-sm bg-surface-container-lowest/92 border border-outline-variant/30 px-space-md py-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-primary animate-rec-blink" />
            <span
              className="font-label-lg text-label-lg text-primary font-bold tracking-widest tabular-nums"
              data-testid="hud-countdown"
            >
              {formatCountdown(hudState.remainingSeconds)}
            </span>
            <span className="text-outline-variant font-label-sm text-label-sm">//</span>
            <span
              className="font-label-sm text-label-sm text-tertiary tracking-wider uppercase"
              data-testid="hud-location"
            >
              03:17 AM · {sectorName}
            </span>
          </div>

          <div className="bg-surface-container-lowest/92 border-l-2 border-primary px-space-md py-space-sm shadow-lg flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
              crisis_alert
            </span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                CURRENT OBJECTIVE
              </span>
              <span
                className="font-body-sm sm:font-body-md text-on-surface leading-snug"
                data-testid="hud-objective"
              >
                {hudState.currentObjective}
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right Cluster: Paranoia / Threat Indicator */}
        <div className="flex flex-col items-end gap-space-xs pointer-events-auto">
          <div className="bg-surface-container-lowest/92 border-r-2 border-primary px-space-md py-space-sm shadow-lg flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-space-sm sm:gap-space-md">
              <div className="flex items-center gap-1.5">
                <span
                  className="material-symbols-outlined text-primary animate-pulse text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
                <span
                  className="font-label-lg text-label-lg text-primary font-bold tabular-nums"
                  data-testid="hud-bpm"
                >
                  {hudState.heartRateBpm}
                </span>
                <span className="font-label-sm text-label-sm text-outline">BPM</span>
              </div>
              <div className="hidden sm:flex w-24 h-5 bg-surface-container-low px-1 items-center">
                <svg
                  aria-hidden="true"
                  className="w-full h-full text-primary"
                  fill="none"
                  viewBox="0 0 120 24"
                >
                  <path
                    className="stroke-current"
                    d="M0,12 L20,12 L26,4 L32,20 L38,2 L44,18 L48,12 L70,12 L76,6 L82,18 L88,12 L120,12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            <div className="w-full flex items-center justify-between gap-space-md">
              <span className="font-label-sm text-label-sm text-outline uppercase">
                THREAT:{' '}
                <span className="text-primary font-bold" data-testid="hud-threat-level">
                  {hudState.horrorLevel}
                </span>
              </span>
              <div className="flex items-center gap-1" aria-label={`Paranoia ${hudState.paranoia}%`}>
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-1.5 ${
                      idx <= activeSegments
                        ? idx >= 5
                          ? 'bg-primary animate-pulse'
                          : 'bg-primary'
                        : 'bg-surface-container-high'
                    }`}
                  />
                ))}
              </div>
            </div>

            {hudState.gazeWarningActive && (
              <div
                className="w-full bg-primary-container text-on-primary-container px-2 py-0.5 font-label-sm text-label-sm font-bold uppercase tracking-wider text-center animate-pulse"
                data-testid="hud-gaze-warning"
              >
                AVERT GAZE ({hudState.gazeExposureSeconds.toFixed(1)}s / {CASE_METADATA.gazeThresholdSeconds}s)
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigateTo('pause-and-system')}
            className="px-2.5 py-1 bg-surface-container-lowest/90 hover:bg-surface-container-high border border-outline-variant/30 font-label-sm text-label-sm text-on-surface-variant hover:text-primary uppercase tracking-wider cursor-pointer transition-colors"
          >
            [ESC] SYSTEM / PAUSE
          </button>
        </div>
      </div>

      {/* CENTER RETICLE & CONTEXTUAL INTERACTION PROMPT */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-10">
        <div className="relative flex items-center justify-center">
          <div className="w-9 h-9 relative flex items-center justify-center">
            <div className="absolute w-2 h-2 top-0 left-0 border-t-2 border-l-2 border-primary/80" />
            <div className="absolute w-2 h-2 top-0 right-0 border-t-2 border-r-2 border-primary/80" />
            <div className="absolute w-2 h-2 bottom-0 left-0 border-b-2 border-l-2 border-primary/80" />
            <div className="absolute w-2 h-2 bottom-0 right-0 border-b-2 border-r-2 border-primary/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>

          {hudState.interactionPrompt && (
            <button
              type="button"
              onClick={inspectCurrentTarget}
              className="pointer-events-auto absolute top-12 left-1/2 -translate-x-1/2 w-max max-w-[90vw] bg-surface-container-lowest/95 hover:bg-surface-container border border-primary/45 px-space-md py-space-sm shadow-xl flex items-center gap-space-sm cursor-pointer group transition-colors"
            >
              <span className="px-2 py-0.5 bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold tracking-widest group-hover:bg-primary group-hover:text-on-primary transition-colors">
                {hudState.interactionPrompt.keyLabel}
              </span>
              <span className="flex flex-col text-left">
                <span className="font-label-sm text-label-sm text-outline font-bold tracking-wider uppercase">
                  {hudState.interactionPrompt.verb} TARGET
                </span>
                <span className="font-body-sm sm:font-body-md text-on-surface font-semibold">
                  {hudState.interactionPrompt.label}
                  {hudState.interactionPrompt.detail && (
                    <span className="text-primary font-normal">
                      {' '}
                      ({hudState.interactionPrompt.detail})
                    </span>
                  )}
                </span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* BOTTOM HUD ROW: Flashlight Status (Left) | Temporary Evidence Toast (Center) | Minimal Keybinds (Right) */}
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-space-md">
        {/* Bottom-Left: Flashlight Status */}
        <div className="flex flex-col gap-space-xs pointer-events-auto">
          <button
            type="button"
            onClick={toggleFlashlight}
            className="flex items-center gap-space-md bg-surface-container-lowest/92 hover:bg-surface-container-low border border-outline-variant/30 px-space-md py-space-sm shadow-lg text-left cursor-pointer transition-colors"
          >
            <div className="w-7 h-7 bg-surface-container flex items-center justify-center">
              <span
                className={`material-symbols-outlined text-[18px] ${
                  hudState.flashlightOn ? 'text-primary' : 'text-outline'
                }`}
              >
                {hudState.flashlightOn ? 'flashlight_on' : 'flashlight_off'}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">
                <span className="text-primary">[F]</span>
                <span>FLASHLIGHT</span>
                <span
                  className={hudState.flashlightOn ? 'text-primary' : 'text-outline'}
                  data-testid="hud-flashlight-state"
                >
                  {hudState.flashlightOn ? '(ON)' : '(OFF)'}
                </span>
              </div>
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline tabular-nums">
                <span>BATTERY:</span>
                <span className="text-on-surface font-bold">{batteryPct}%</span>
                <div className="w-14 h-2 bg-surface-container-high overflow-hidden ml-1">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${batteryPct}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Bottom-Center: Temporary Evidence Notification Toast */}
        <div className="flex-1 flex justify-center min-w-[240px]">
          {hudState.evidenceToast && (
            <div
              role="status"
              className="pointer-events-auto bg-surface-container-lowest/95 border-l-4 border-primary px-4 py-2.5 shadow-2xl flex items-center gap-3 max-w-md"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">
                troubleshoot
              </span>
              <div className="flex flex-col flex-1">
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-bold">
                  {hudState.evidenceToast.subtitle}
                </span>
                <span className="font-body-sm text-on-surface">
                  {hudState.evidenceToast.message}
                </span>
              </div>
              <button
                type="button"
                onClick={dismissToast}
                aria-label="Dismiss notification"
                className="text-outline hover:text-on-surface font-label-sm text-label-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Bottom-Right: Single Compact Control Hint + Notebook Shortcut */}
        <div className="flex flex-col items-end gap-space-xs pointer-events-auto">
          <button
            type="button"
            onClick={() => navigateTo('investigation-notebook')}
            className="bg-surface-container-lowest/92 hover:bg-surface-container-high border border-outline-variant/30 px-space-md py-1.5 font-label-sm text-label-sm text-on-surface-variant hover:text-primary uppercase tracking-wider cursor-pointer transition-colors tabular-nums"
          >
            [TAB] CASE NOTEBOOK ({forestGateStatus.mandatoryFoundCount}/{forestGateStatus.mandatoryTotal} CORE · {discoveredCount} TOTAL)
          </button>
          <div className="font-label-sm text-label-sm text-outline tracking-wider hidden sm:block">
            [WASD] Move · [E] Inspect · [F] Flashlight · [TAB] Notebook · [ESC] Pause
          </div>
        </div>
      </div>
    </div>
  );
};
