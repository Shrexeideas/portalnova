import React, { useEffect, useState } from 'react';
import { CASE_METADATA } from '../data/caseData';
import { useGame } from '../state/GameContext';
import { createDefaultSettings, formatCountdown } from '../state/gameRules';

type SettingsTab = 'audio' | 'controls' | 'display';

export const PauseSettingsScreen: React.FC = () => {
  const {
    settings,
    hudState,
    hasContinueSave,
    returnScreen,
    updateSettings,
    saveCheckpointNow,
    continueInvestigation,
    returnFromOverlayScreen,
    clearSavedProgress,
    navigateTo,
  } = useGame();

  const [activeTab, setActiveTab] = useState<SettingsTab>('audio');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (returnScreen === 'gameplay-hud') {
          returnFromOverlayScreen();
        } else {
          navigateTo('main-menu');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigateTo, returnFromOverlayScreen, returnScreen]);

  const handleResume = () => {
    if (returnScreen === 'gameplay-hud') {
      returnFromOverlayScreen();
    } else if (hasContinueSave) {
      continueInvestigation();
    } else {
      navigateTo('case-briefing');
    }
  };

  const handleRestoreDefaults = () => {
    updateSettings(createDefaultSettings());
    setStatusNotice('Calibration reset to archival defaults.');
  };

  const handleSaveCheckpoint = () => {
    saveCheckpointNow();
    setStatusNotice('Volatile investigation state committed to local checkpoint.');
  };

  const handlePurge = () => {
    clearSavedProgress();
    setStatusNotice('Local save data cleared.');
  };

  const volumePct = Math.round(settings.masterVolume * 100);

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-gutter sm:p-gutter-lg bg-surface overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20 filter grayscale contrast-125"
        style={{ backgroundImage: "url('/assets/stitch/menu_playground.png')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(12,14,16,0.96)_100%)]"
      />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-stretch">
        {/* LEFT MODULE: Diagnostic State & Primary Execution */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-surface-container-low/95 p-gutter-lg shadow-xl border-l-2 border-primary rounded-r">
          <div>
            <div className="flex items-center gap-2 mb-space-sm">
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-primary-container text-on-primary-container font-bold uppercase">
                PAUSED
              </span>
              <span className="font-label-sm text-label-sm text-outline tracking-widest uppercase">
                {CASE_METADATA.caseNumber}
              </span>
            </div>

            <h1 className="font-headline-md text-headline-md uppercase tracking-tight text-on-surface mb-1">
              SIMULATION SUSPENDED
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg leading-relaxed">
              Temporal flow paused at perimeter node. Audio, sensitivity, and visual grain changes persist automatically.
            </p>

            {/* Live Diegetic Monitor */}
            <div className="bg-surface-container-lowest p-space-md mb-space-lg rounded">
              <div className="flex items-center justify-between font-label-sm text-label-sm text-outline mb-2">
                <span>PHYSIOLOGICAL TELEMETRY</span>
                <span className="text-primary font-bold">{hudState.horrorLevel}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-surface-container-high/60 p-2 rounded">
                  <span className="font-label-sm text-label-sm block text-outline-variant uppercase">
                    WINDOW LEFT
                  </span>
                  <span className="font-headline-sm text-headline-sm text-tertiary-fixed tabular-nums">
                    {formatCountdown(hudState.remainingSeconds)}
                  </span>
                </div>
                <div className="bg-surface-container-high/60 p-2 rounded">
                  <span className="font-label-sm text-label-sm block text-outline-variant uppercase">
                    PULSE
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary tabular-nums">
                    {hudState.heartRateBpm}{' '}
                    <span className="font-label-sm text-label-sm text-outline font-normal">BPM</span>
                  </span>
                </div>
              </div>
              <div className="flex justify-between font-label-sm text-label-sm text-outline-variant">
                <span>PARANOIA: {hudState.paranoia}%</span>
                <span>BATTERY: {Math.round(hudState.flashlightBattery)}%</span>
              </div>
            </div>
          </div>

          {/* Action Commands */}
          <div className="flex flex-col gap-2 pt-space-md border-t border-outline-variant/30">
            <button
              type="button"
              onClick={handleResume}
              className="w-full flex items-center justify-between px-space-md py-3 bg-primary-container hover:bg-inverse-primary text-on-primary-container transition-all cursor-pointer rounded"
            >
              <span className="font-label-lg text-label-lg tracking-wider uppercase flex items-center gap-2 font-bold">
                <span className="w-2 h-2 bg-on-primary-container" />
                <span>
                  {returnScreen === 'gameplay-hud'
                    ? 'RESUME PATROL'
                    : hasContinueSave
                      ? 'RESUME INVESTIGATION'
                      : 'BEGIN BRIEFING'}
                </span>
              </span>
              <span className="font-label-sm text-label-sm">[ESC]</span>
            </button>

            <button
              type="button"
              onClick={handleSaveCheckpoint}
              className="w-full flex items-center justify-between px-space-md py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface transition-all cursor-pointer rounded"
            >
              <span className="font-label-md text-label-md tracking-wider uppercase">
                SAVE CHECKPOINT NOW
              </span>
              <span className="font-label-sm text-label-sm text-outline">LOCAL</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('investigation-notebook')}
              className="w-full flex items-center justify-between px-space-md py-2.5 bg-surface-container hover:bg-surface-container-high text-secondary transition-all cursor-pointer rounded"
            >
              <span className="font-label-md text-label-md tracking-wider uppercase">
                OPEN EVIDENCE NOTEBOOK
              </span>
              <span className="font-label-sm text-label-sm text-outline">[TAB]</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('main-menu')}
              className="w-full flex items-center justify-between px-space-md py-2.5 bg-surface-container-lowest hover:bg-surface-container text-outline hover:text-primary transition-all cursor-pointer rounded mt-1"
            >
              <span className="font-label-md text-label-md tracking-wider uppercase">
                RETURN TO MAIN MENU
              </span>
              <span className="font-label-sm text-label-sm">EXIT</span>
            </button>
          </div>
        </div>

        {/* RIGHT MODULE: Calibration Deck */}
        <div className="lg:col-span-8 flex flex-col bg-surface-container/95 p-gutter-lg shadow-2xl rounded">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-gutter pb-space-md border-b border-outline-variant/30 mb-space-lg">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest block">
                FEED PROTOCOL CONFIG
              </span>
              <h2 className="font-headline-sm text-headline-sm uppercase text-on-surface">
                SYSTEM CALIBRATION DECK
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded">
              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-wider cursor-pointer rounded ${
                  activeTab === 'audio'
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                AUDIO &amp; BINAURAL
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('controls')}
                className={`px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-wider cursor-pointer rounded ${
                  activeTab === 'controls'
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                CONTROLS &amp; INPUT
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('display')}
                className={`px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-wider cursor-pointer rounded ${
                  activeTab === 'display'
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                DISPLAY &amp; ACCESSIBILITY
              </button>
            </div>
          </div>

          {activeTab === 'audio' && (
            <div className="flex flex-col gap-space-lg">
              <div className="bg-surface-container-lowest p-space-md rounded">
                <div className="flex justify-between items-center mb-1">
                  <label
                    htmlFor="master-vol-slider"
                    className="font-label-md text-label-md uppercase text-on-surface tracking-wider"
                  >
                    MASTER MONITORING GAIN
                  </label>
                  <span className="font-label-md text-label-md text-primary font-mono font-bold tabular-nums">
                    {volumePct}%
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-outline mb-3">
                  Controls ambient 03:47 AM rainfall, cassette playback, and proximity duck cues.
                </p>
                <input
                  id="master-vol-slider"
                  type="range"
                  min={0}
                  max={100}
                  value={volumePct}
                  onChange={(e) =>
                    updateSettings({ masterVolume: Number(e.target.value) / 100 })
                  }
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => updateSettings({ binauralAudio: !settings.binauralAudio })}
                className="bg-surface-container-lowest p-space-md rounded flex items-start justify-between cursor-pointer text-left hover:bg-surface-container-high transition-colors"
              >
                <div className="pr-3">
                  <span className="font-label-md text-label-md uppercase text-on-surface block">
                    BINAURAL SPATIAL PANNING
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">
                    Directional stereo panning for footsteps, swing creaks, and forest mimicry cues.
                  </span>
                </div>
                <span
                  className={`font-label-md text-label-md px-2.5 py-1 font-mono font-bold rounded ${
                    settings.binauralAudio
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  {settings.binauralAudio ? '[X]' : '[ ]'}
                </span>
              </button>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="flex flex-col gap-space-lg">
              <div className="bg-surface-container-lowest p-space-md rounded">
                <div className="flex justify-between items-center mb-1">
                  <label
                    htmlFor="mouse-sens-slider"
                    className="font-label-md text-label-md uppercase text-on-surface tracking-wider"
                  >
                    LOOK SENSITIVITY
                  </label>
                  <span className="font-label-md text-label-md text-primary font-mono font-bold tabular-nums">
                    {settings.mouseSensitivity.toFixed(1)}x
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-outline mb-3">
                  Controls pointer-lock and drag-look rotation speed across the playground.
                </p>
                <input
                  id="mouse-sens-slider"
                  type="range"
                  min={0.3}
                  max={2.5}
                  step={0.1}
                  value={settings.mouseSensitivity}
                  onChange={(e) =>
                    updateSettings({ mouseSensitivity: Number(e.target.value) })
                  }
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => updateSettings({ invertY: !settings.invertY })}
                className="bg-surface-container-lowest p-space-md rounded flex items-start justify-between cursor-pointer text-left hover:bg-surface-container-high transition-colors"
              >
                <div className="pr-3">
                  <span className="font-label-md text-label-md uppercase text-on-surface block">
                    INVERT VERTICAL LOOK (Y-AXIS)
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">
                    Reverses upward and downward camera pitch input.
                  </span>
                </div>
                <span
                  className={`font-label-md text-label-md px-2.5 py-1 font-mono font-bold rounded ${
                    settings.invertY
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  {settings.invertY ? '[X]' : '[ ]'}
                </span>
              </button>

              <div className="bg-surface-container-lowest p-space-md rounded">
                <span className="font-label-sm text-label-sm uppercase text-outline block mb-2">
                  INVESTIGATION KEYMAP
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-center">
                  <div className="bg-surface-container p-2 rounded">
                    <span className="block text-outline text-label-sm">MOVE / SPRINT</span>
                    <span className="text-on-surface font-bold text-label-md">[WASD / SHIFT]</span>
                  </div>
                  <div className="bg-surface-container p-2 rounded">
                    <span className="block text-outline text-label-sm">INSPECT CLUE</span>
                    <span className="text-on-surface font-bold text-label-md">[E]</span>
                  </div>
                  <div className="bg-surface-container p-2 rounded">
                    <span className="block text-outline text-label-sm">FLASHLIGHT</span>
                    <span className="text-primary font-bold text-label-md">[F]</span>
                  </div>
                  <div className="bg-surface-container p-2 rounded">
                    <span className="block text-outline text-label-sm">CASE NOTEBOOK</span>
                    <span className="text-secondary font-bold text-label-md">[TAB]</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="flex flex-col gap-space-lg">
              <button
                type="button"
                onClick={() => updateSettings({ crtScanlines: !settings.crtScanlines })}
                className="bg-surface-container-lowest p-space-md rounded flex items-start justify-between cursor-pointer text-left hover:bg-surface-container-high transition-colors"
              >
                <div className="pr-3">
                  <span className="font-label-md text-label-md uppercase text-on-surface block">
                    CRT SCANLINES OVERLAY
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">
                    Toggles analog surveillance raster lines over screens and camera feed.
                  </span>
                </div>
                <span
                  className={`font-label-md text-label-md px-2.5 py-1 font-mono font-bold rounded ${
                    settings.crtScanlines
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  {settings.crtScanlines ? '[X]' : '[ ]'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                className="bg-surface-container-lowest p-space-md rounded flex items-start justify-between cursor-pointer text-left hover:bg-surface-container-high transition-colors"
              >
                <div className="pr-3">
                  <span className="font-label-md text-label-md uppercase text-on-surface block">
                    REDUCED MOTION &amp; STABILIZED CAMERA
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">
                    Disables screen transitions, walk head-bob, and sodium ballast flicker.
                  </span>
                </div>
                <span
                  className={`font-label-md text-label-md px-2.5 py-1 font-mono font-bold rounded ${
                    settings.reducedMotion
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  {settings.reducedMotion ? '[X]' : '[ ]'}
                </span>
              </button>
            </div>
          )}

          {statusNotice && (
            <div className="mt-space-md p-2.5 rounded bg-surface-container-lowest border-l-2 border-primary font-body-sm text-body-sm text-primary-fixed">
              {statusNotice}
            </div>
          )}

          <div className="mt-auto pt-space-lg flex flex-wrap items-center justify-between gap-space-sm border-t border-outline-variant/30">
            <button
              type="button"
              onClick={handlePurge}
              className="px-3 py-2 bg-surface-container-lowest hover:bg-error-container text-outline hover:text-on-error-container font-label-sm text-label-sm uppercase rounded cursor-pointer"
            >
              PURGE SAVED CHECKPOINT
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="px-3 py-2 bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase rounded cursor-pointer"
              >
                RESTORE DEFAULTS
              </button>
              <button
                type="button"
                onClick={handleResume}
                className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-fixed-dim font-label-sm text-label-sm uppercase font-bold rounded cursor-pointer"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
