import React, { useEffect, useState } from 'react';
import { CASE_METADATA } from '../data/caseData';
import { useGame } from '../state/GameContext';

export const GameOverScreen: React.FC = () => {
  const {
    saveData,
    continueInvestigation,
    startNewInvestigation,
    navigateTo,
  } = useGame();

  const [revealedOne, setRevealedOne] = useState(false);
  const [revealedTwo, setRevealedTwo] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        continueInvestigation();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        startNewInvestigation();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        navigateTo('main-menu');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [continueInvestigation, navigateTo, startNewInvestigation]);

  const clueCount = saveData?.discoveredEvidenceIds.length ?? 0;
  const collapseCount = saveData?.gazeCollapseCount ?? 1;

  return (
    <div className="flex flex-col w-full relative overflow-hidden select-none">
      {/* Hero Bleed / Last Frame Viewport */}
      <div className="relative w-full h-[300px] md:h-[360px] overflow-hidden flex items-end">
        <div
          className="absolute inset-0 bg-cover bg-center filter grayscale contrast-125 brightness-50 scale-105"
          style={{ backgroundImage: "url('/assets/stitch/swing_playground_pov.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/85 to-surface-container-lowest/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-surface" />

        <div className="relative z-20 w-full px-gutter sm:px-gutter-lg pb-space-lg flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex flex-wrap items-center gap-space-sm font-label-md text-label-md text-primary tracking-widest">
              <span className="inline-flex w-2.5 h-2.5 bg-primary animate-ping rounded-full" />
              <span className="font-headline-sm text-headline-sm tracking-wider uppercase text-primary">
                RETINAL FIXATION FATALITY
              </span>
              <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded font-label-sm text-label-sm uppercase font-bold">
                FEED TERMINATED
              </span>
            </div>
            <p className="font-label-lg text-label-lg uppercase text-on-surface-variant max-w-2xl">
              DIRECT GAZE SUSTAINED // EXCEEDED OPTICAL THRESHOLD:{' '}
              <span className="text-primary font-bold">
                {CASE_METADATA.gazeThresholdSeconds} SECONDS
              </span>
            </p>
          </div>

          <div className="flex items-center gap-space-md bg-surface-container-lowest/90 px-space-md py-space-sm rounded border border-primary/30">
            <div className="flex flex-col text-right">
              <span className="font-label-sm text-label-sm uppercase text-outline">
                NEURAL SYNC PULSE
              </span>
              <span className="font-label-lg text-label-lg text-primary font-bold">
                0.000 Hz [FLATLINE]
              </span>
            </div>
            <div className="w-10 h-10 rounded bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">visibility_off</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Post-Mortem Workspace */}
      <div className="w-full px-gutter sm:px-gutter-lg pb-space-xl relative z-20 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
          {/* LEFT: Coroner / Incident File */}
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            <div className="bg-surface-container-low rounded p-space-lg shadow-xl relative overflow-hidden border-l-4 border-primary-container">
              <div className="flex flex-wrap items-center justify-between pb-space-md gap-space-sm">
                <div className="flex items-center gap-space-sm font-label-sm text-label-sm text-outline uppercase">
                  <span className="bg-surface-container-high px-space-sm py-1 rounded text-on-surface">
                    FORM 104-E/FATAL
                  </span>
                  <span>//</span>
                  <span>CASE #89-DUCK (2026 RE-ENTRY)</span>
                </div>
                <div className="font-label-sm text-label-sm text-primary uppercase tracking-widest">
                  SECURITY LEVEL: BLACKOUT
                </div>
              </div>

              <span className="font-label-sm text-label-sm uppercase text-primary tracking-widest block mb-1">
                PSYCHOLOGICAL POST-MORTEM CLASSIFICATION
              </span>
              <h1 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg uppercase text-on-surface tracking-tight">
                COGNITIVE COLLAPSE // THE ERASED INVESTIGATOR
              </h1>

              {/* Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-sm py-space-md">
                <div className="bg-surface-container p-space-sm rounded">
                  <div className="font-label-sm text-label-sm text-outline uppercase">
                    EXHIBITS CATALOGED
                  </div>
                  <div className="font-headline-sm text-headline-sm text-on-surface mt-0.5 tabular-nums">
                    {clueCount} CLUES
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">
                    Preserved at Checkpoint
                  </div>
                </div>
                <div className="bg-surface-container p-space-sm rounded">
                  <div className="font-label-sm text-label-sm text-outline uppercase">
                    OPTICAL FIXATIONS
                  </div>
                  <div className="font-headline-sm text-headline-sm text-primary mt-0.5 tabular-nums">
                    {collapseCount} INCIDENT{collapseCount === 1 ? '' : 'S'}
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">
                    1.45s Threshold Breached
                  </div>
                </div>
                <div className="bg-surface-container p-space-sm rounded col-span-2 sm:col-span-1">
                  <div className="font-label-sm text-label-sm text-outline uppercase">
                    LOCAL TIMESTAMP
                  </div>
                  <div className="font-headline-sm text-headline-sm text-on-surface mt-0.5">
                    03:47:12 AM
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">
                    Oak Park Periphery
                  </div>
                </div>
              </div>

              {/* Recovered Vocal Fragment */}
              <div className="bg-surface-container-lowest p-space-md rounded flex flex-col gap-2">
                <div className="flex items-center justify-between font-label-sm text-label-sm text-outline uppercase">
                  <span className="flex items-center gap-1.5 text-on-surface">
                    <span className="material-symbols-outlined text-[15px] text-primary">
                      terminal
                    </span>
                    RECOVERED BODY-CAM &amp; AUDIO TRACE
                  </span>
                  <span className="text-tertiary">14.2 Hz SPIKE</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface">
                  <span className="text-primary font-bold">[03:47:09] FIELD MIC:</span> &ldquo;It
                  wasn&apos;t on the carousel anymore. Wait—why isn&apos;t it blinking?&rdquo;
                </p>
                <p className="font-body-md text-body-md text-primary-fixed-dim bg-primary-container/20 px-space-sm py-1 rounded">
                  <span className="font-bold">[03:47:12] SYSTEM LOG:</span> Direct retinal
                  fixation sustained beyond 1.45 seconds. Feed severed as wet webbed footsteps closed
                  across the mulch.
                </p>
              </div>

              {/* Click-to-reveal Coroner Redactions */}
              <div className="mt-space-md bg-surface-container p-space-md rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-sm text-label-sm text-outline uppercase">
                    CORONER NOTE (CLICK BLACKOUTS TO DECIPHER)
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  &ldquo;When responders reached the perimeter bench, the investigator&apos;s coat was{' '}
                  <button
                    type="button"
                    onClick={() => setRevealedOne((v) => !v)}
                    className={`px-1 rounded cursor-pointer transition-colors ${
                      revealedOne
                        ? 'bg-surface-container-lowest text-primary'
                        : 'bg-surface-container-lowest text-surface-container-lowest'
                    }`}
                  >
                    soaked in creek silt despite clear pavement
                  </button>
                  . The only dry object left on the wood slats was{' '}
                  <button
                    type="button"
                    onClick={() => setRevealedTwo((v) => !v)}
                    className={`px-1 rounded cursor-pointer transition-colors ${
                      revealedTwo
                        ? 'bg-surface-container-lowest text-primary'
                        : 'bg-surface-container-lowest text-surface-container-lowest'
                    }`}
                  >
                    Jimmy Mercer&apos;s 1994 yellow duck whistle
                  </button>
                  .&rdquo;
                </p>
              </div>
            </div>

            {/* Action Deck */}
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">
                RECOVERY &amp; ARCHIVE OPTIONS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
                <button
                  type="button"
                  onClick={continueInvestigation}
                  className="sm:col-span-2 bg-primary-container hover:bg-inverse-primary text-on-primary-container px-space-lg py-space-md rounded flex items-center justify-between gap-space-md shadow-lg cursor-pointer"
                >
                  <div className="flex items-center gap-space-sm text-left">
                    <span className="material-symbols-outlined text-[22px]">history</span>
                    <div>
                      <div className="font-label-md text-label-md uppercase font-bold">
                        RE-ENTER SAFE CHECKPOINT
                      </div>
                      <div className="font-body-sm text-[11px] text-on-primary-container/80">
                        Keep all {clueCount} cataloged clues
                      </div>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm font-mono">[ENTER]</span>
                </button>

                <button
                  type="button"
                  onClick={startNewInvestigation}
                  className="bg-surface-container hover:bg-surface-container-high text-on-surface px-space-md py-space-md rounded flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="font-label-md text-label-md uppercase">NEW INVESTIGATION</span>
                  <span className="font-label-sm text-label-sm text-outline font-mono">[R]</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('chapter-archive')}
                  className="bg-surface-container hover:bg-surface-container-high text-secondary px-space-md py-space-md rounded flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="font-label-md text-label-md uppercase">VIEW OUTCOME ARCHIVE</span>
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigateTo('main-menu')}
                  className="px-4 py-2 bg-surface-container-lowest hover:bg-surface-container text-outline hover:text-primary rounded font-label-sm text-label-sm uppercase cursor-pointer"
                >
                  RETURN TO MAIN MENU [M]
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Recovered Polaroid & Survival Protocol */}
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="bg-surface-container p-space-md rounded shadow-xl flex flex-col gap-space-md">
              <div className="flex items-center justify-between font-label-sm text-label-sm text-outline">
                <span>EVIDENCE ARTIFACT #11-B</span>
                <span className="text-primary font-bold">TERMINAL FRAME</span>
              </div>
              <div className="bg-surface-container-lowest p-2 rounded flex flex-col gap-2">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded bg-surface-container-high">
                  <img
                    src="/assets/stitch/polaroid_14b_sandbox.png"
                    alt="Terminal surveillance snapshot from Oak Park Playground"
                    className="w-full h-full object-cover filter contrast-150 saturate-50"
                  />
                </div>
                <div className="font-body-sm text-body-sm text-tertiary">
                  &ldquo;Keep the entity in peripheral sightlines only.&rdquo;
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-md rounded flex items-start gap-space-xs border border-outline-variant/20">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                warning
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                <strong className="text-on-surface">SURVIVAL PROTOCOL:</strong> Do not hold the
                center reticle directly on the Duck for longer than 1.45 seconds. Turn away as soon
                as the red gaze warning rises.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
