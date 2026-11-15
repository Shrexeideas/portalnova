import React, { useMemo } from 'react';
import {
  CASE_METADATA,
  ENDING_DEFINITIONS,
  TIMELINE_EVENTS,
} from '../data/caseData';
import { useGame } from '../state/GameContext';
import { createInitialSave } from '../state/gameRules';
import { evaluateForestGateStatus } from '../state/storyProgression';

export const OutcomeArchiveScreen: React.FC = () => {
  const {
    currentScreen,
    saveData,
    startNewInvestigation,
    continueInvestigation,
    navigateTo,
    clearSavedProgress,
  } = useGame();

  const effectiveSave = useMemo(() => saveData ?? createInitialSave(), [saveData]);
  const unlockedSet = useMemo(
    () => new Set(effectiveSave.unlockedEndings),
    [effectiveSave.unlockedEndings],
  );
  const gateStatus = useMemo(() => evaluateForestGateStatus(effectiveSave), [effectiveSave]);

  const activeEnding =
    ENDING_DEFINITIONS.find((e) => e.id === effectiveSave.activeEnding) ?? null;

  const isOutcomeMode = currentScreen === 'incident-outcome';

  return (
    <div className="w-full px-gutter sm:px-gutter-lg py-space-lg flex flex-col gap-space-lg">
      {/* Top Telemetry Status Bar (Stitch code_2f74692a.html) */}
      <div className="w-full bg-surface-container-low rounded-lg p-space-md shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-space-md border border-outline-variant/20">
        <div className="flex items-center gap-space-md">
          <div className="w-3 h-3 rounded-full bg-primary-container animate-rec-blink" />
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
              ARCHIVAL PROTOCOL // OUTCOME &amp; CHRONOLOGY MATRIX
            </span>
            <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight flex flex-wrap items-center gap-2">
              <span>INDEX 89-DUCK</span>
              <span className="text-primary-container font-label-md text-label-md px-2 py-0.5 bg-surface-container-high rounded">
                {isOutcomeMode && activeEnding ? activeEnding.title : 'CHRONOLOGY BRANCHES'}
              </span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm font-label-md text-label-md">
          <div className="bg-surface-container px-space-md py-space-xs rounded flex flex-col">
            <span className="text-outline font-label-sm text-label-sm">ENDINGS UNLOCKED</span>
            <span className="text-primary font-headline-sm text-headline-sm tabular-nums">
              {effectiveSave.unlockedEndings.length} / 4
            </span>
          </div>
          <div className="bg-surface-container px-space-md py-space-xs rounded flex flex-col">
            <span className="text-outline font-label-sm text-label-sm">EXHIBITS CATALOGED</span>
            <span className="text-secondary font-headline-sm text-headline-sm tabular-nums">
              {effectiveSave.discoveredEvidenceIds.length} / 14
            </span>
          </div>
          <div className="bg-surface-container px-space-md py-space-xs rounded flex flex-col">
            <span className="text-outline font-label-sm text-label-sm">AUDIO CLUES</span>
            <span className="text-tertiary font-headline-sm text-headline-sm tabular-nums">
              {gateStatus.audioCluesFoundCount} / {gateStatus.audioCluesTotal}
            </span>
          </div>
          <div className="bg-surface-container px-space-md py-space-xs rounded flex flex-col">
            <span className="text-outline font-label-sm text-label-sm">GAZE COLLAPSES</span>
            <span className="text-on-primary-container font-headline-sm text-headline-sm tabular-nums">
              {effectiveSave.gazeCollapseCount}
            </span>
          </div>
        </div>
      </div>

      {/* Active Ending Resolution Showcase (when arriving from Forest Decision or viewing latest outcome) */}
      {activeEnding && (
        <div className="bg-surface-container-lowest rounded-lg p-space-lg border-l-4 border-primary-container shadow-2xl flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded font-label-sm text-label-sm font-bold uppercase">
                {activeEnding.code}
              </span>
              <span className="font-label-sm text-label-sm text-secondary uppercase">
                {activeEnding.statusTag}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-outline">
              CASE FILE {CASE_METADATA.caseNumber}
            </span>
          </div>

          <div>
            <h2 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface uppercase tracking-tight">
              {activeEnding.title}
            </h2>
            <p className="font-label-md text-label-md text-primary uppercase mt-0.5">
              {activeEnding.subtitle}
            </p>
          </div>

          <p className="font-body-lg text-body-lg text-on-surface leading-relaxed max-w-4xl">
            {activeEnding.narrativeSummary}
          </p>

          <div className="bg-surface-container p-space-md rounded border-l-2 border-tertiary">
            <span className="font-label-sm text-label-sm text-tertiary uppercase block mb-1">
              ARCHIVAL AMBIGUITY POSTSCRIPT
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant italic">
              {activeEnding.ambiguityPostscript}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm pt-2">
            <button
              type="button"
              onClick={continueInvestigation}
              className="px-4 py-2 bg-primary-container hover:bg-inverse-primary text-on-primary-container rounded font-label-md text-label-md uppercase font-bold cursor-pointer"
            >
              RETURN TO PLAYGROUND CHECKPOINT
            </button>
            <button
              type="button"
              onClick={startNewInvestigation}
              className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded font-label-md text-label-md uppercase cursor-pointer"
            >
              START NEW INVESTIGATION
            </button>
            <button
              type="button"
              onClick={() => navigateTo('investigation-notebook')}
              className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-secondary rounded font-label-md text-label-md uppercase cursor-pointer"
            >
              OPEN EVIDENCE NOTEBOOK
            </button>
          </div>
        </div>
      )}

      {/* Dual Split: Left (Timeline & Lore Audit) | Right (4-Ending Outcome Matrix + CRT Viewport) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: 1994 -> 1996 -> 2026 Chronology & Discrepancies */}
        <div className="xl:col-span-6 flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm uppercase text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                timeline
              </span>
              <span>ESTABLISHED STORY TIMELINE (1994 – 2026)</span>
            </h2>
          </div>

          <div className="flex flex-col gap-space-sm">
            {TIMELINE_EVENTS.map((ev) => (
              <div
                key={ev.year}
                className="bg-surface-container p-space-md rounded-lg border border-outline-variant/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-sm text-label-sm text-primary font-bold uppercase">
                    {ev.code}
                  </span>
                  <span className="font-label-md text-label-md px-2 py-0.5 bg-surface-container-lowest rounded text-tertiary">
                    {ev.year}
                  </span>
                </div>
                <h3 className="font-headline-sm text-[16px] text-on-surface">{ev.heading}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                  {ev.detail}
                </p>
              </div>
            ))}
          </div>

          {/* In-Universe Forensic Chronology Audit */}
          <div className="bg-surface-container-low rounded-lg p-space-md border border-outline-variant/20 flex flex-col gap-space-sm">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">
              FORENSIC TIMELINE CROSS-CHECKS
            </span>
            <div className="bg-surface-container-lowest p-space-sm rounded">
              <div className="font-label-sm text-[10px] text-secondary uppercase">
                1994 PRECINCT FILING VS. WITNESS ANNOTATIONS
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Municipal logs closed Jimmy Mercer&apos;s case as an unrecovered disappearance in November 1994, omitting two witness claims of childlike laughter beyond the north drainage fence after midnight.
              </p>
            </div>
            <div className="bg-surface-container-lowest p-space-sm rounded">
              <div className="font-label-sm text-[10px] text-secondary uppercase">
                1996 INVESTIGATOR REELS VS. 2026 PARCEL
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Julian Vance&apos;s final 1996 tape warned against trusting voices from the forest treeline. Thirty years later, both Jimmy&apos;s photograph and Julian&apos;s reel arrived at your door with no return address.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Diegetic CRT Monitor + 4-Ending Outcome Matrix */}
        <div className="xl:col-span-6 flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm uppercase text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                emergency_recording
              </span>
              <span>OUTCOME MATRIX // DIEGETIC LOG</span>
            </h2>
            <span className="font-label-sm text-label-sm text-primary uppercase font-bold">
              {effectiveSave.unlockedEndings.length} / 4 VERIFIED
            </span>
          </div>

          <div className="relative bg-surface-container-lowest rounded-xl p-space-md shadow-2xl overflow-hidden flex flex-col gap-space-sm">
            <div className="relative w-full aspect-video bg-surface-container-lowest rounded-lg overflow-hidden">
              <img
                src="/assets/stitch/hud_playground_pov.png"
                alt="Surveillance CRT feed of Oak Park Playground at 03:47 AM"
                className="w-full h-full object-cover brightness-90 contrast-125"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 font-label-sm text-label-sm">
              <div className="flex items-center gap-2 text-on-surface">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-rec-blink" />
                <span>CAM 07: OAK-PARK PLAYGROUND</span>
              </div>
              <span className="text-secondary">
                {activeEnding ? activeEnding.title : 'AWAITING FOREST CONCLUSION'}
              </span>
              <span className="text-primary font-bold">REC ● 03:47:12 AM</span>
            </div>
          </div>

          <div className="flex flex-col gap-space-sm">
            {ENDING_DEFINITIONS.map((ending) => {
              const unlocked = unlockedSet.has(ending.id);
              const isCurrent = effectiveSave.activeEnding === ending.id;
              return (
                <div
                  key={ending.id}
                  className={`p-space-md rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-surface-container-high border-primary shadow-lg'
                      : unlocked
                        ? 'bg-surface-container border-outline-variant/30'
                        : 'bg-surface-container-low border-outline-variant/15 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-space-sm">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-label-sm text-label-sm text-primary px-1.5 py-0.5 rounded bg-surface-container-lowest font-bold">
                          {ending.code}
                        </span>
                        <span className="font-headline-sm text-headline-sm text-on-surface">
                          {ending.title}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        {unlocked
                          ? ending.narrativeSummary
                          : `${ending.subtitle} — Reach the Final Forest clearing or face the Duck to unlock this branch.`}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[22px] shrink-0 text-primary">
                      {unlocked ? 'check_circle' : 'lock'}
                    </span>
                  </div>
                  <div className="mt-space-sm pt-1 flex items-center justify-between font-label-sm text-label-sm text-outline">
                    <span>{ending.statusTag}</span>
                    <span className={unlocked ? 'text-secondary font-bold' : 'text-outline'}>
                      {unlocked ? 'UNLOCKED IN ARCHIVE' : 'LOCKED BRANCH'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={clearSavedProgress}
              className="px-3 py-2 bg-surface-container hover:bg-error-container text-outline hover:text-on-error-container rounded font-label-sm text-label-sm uppercase cursor-pointer"
            >
              PURGE LOCAL ARCHIVE
            </button>
            <button
              type="button"
              onClick={() => navigateTo('main-menu')}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-bright text-on-surface rounded font-label-sm text-label-sm uppercase cursor-pointer"
            >
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
