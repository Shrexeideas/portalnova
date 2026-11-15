import React, { useCallback, useEffect, useState } from 'react';
import { CASE_METADATA } from '../data/caseData';
import { useGame } from '../state/GameContext';

interface MenuOption {
  id: 'new' | 'continue' | 'archive' | 'settings' | 'exit';
  title: string;
  subtitle: string;
  badge: string;
  isPrimary?: boolean;
  disabled?: boolean;
}

export const MainMenuScreen: React.FC = () => {
  const {
    hasContinueSave,
    saveData,
    startNewInvestigation,
    continueInvestigation,
    navigateTo,
    exitNoticeOpen,
    setExitNoticeOpen,
    clearSavedProgress,
  } = useGame();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liveMs, setLiveMs] = useState({ sec: 58, ms: 9 });
  const [paranoiaReadout, setParanoiaReadout] = useState('28.4% [STABLE]');

  const menuOptions: MenuOption[] = [
    {
      id: 'new',
      title: 'NEW INVESTIGATION',
      subtitle: 'Initiate fresh behavioral sequence',
      badge: 'READY',
      isPrimary: true,
    },
    {
      id: 'continue',
      title: 'CONTINUE',
      subtitle: hasContinueSave && saveData
        ? `${saveData.nightLabel} - ${saveData.timestampLabel} [${saveData.discoveredEvidenceIds.length}/${CASE_METADATA.totalCluesInPhase2} Clues]`
        : 'No active field checkpoint recorded',
      badge: hasContinueSave ? 'RESUME' : 'EMPTY',
      disabled: !hasContinueSave,
    },
    {
      id: 'archive',
      title: 'CASE ARCHIVE & EVIDENCE',
      subtitle: 'Audio Logs, Polaroid Scraps & Outcomes',
      badge: saveData ? `${saveData.unlockedEndings.length}/4 ENDINGS` : 'ARCHIVE',
    },
    {
      id: 'settings',
      title: 'CALIBRATION & AUDIO',
      subtitle: 'Binaural pan, grain filter, ocular tracking',
      badge: 'CONFIG',
    },
    {
      id: 'exit',
      title: 'EXIT SIMULATION',
      subtitle: 'Sever local neuro-feed connection',
      badge: 'DISCONNECT',
    },
  ];

  const activateOption = useCallback(
    (option: MenuOption) => {
      switch (option.id) {
        case 'new':
          startNewInvestigation();
          break;
        case 'continue':
          if (hasContinueSave) {
            continueInvestigation();
          }
          break;
        case 'archive':
          navigateTo('investigation-notebook');
          break;
        case 'settings':
          navigateTo('pause-and-system');
          break;
        case 'exit':
          setExitNoticeOpen(true);
          break;
      }
    },
    [continueInvestigation, hasContinueSave, navigateTo, setExitNoticeOpen, startNewInvestigation],
  );

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setLiveMs((prev) => {
        const nextMs = (prev.ms + 7) % 100;
        const nextSec = nextMs < prev.ms ? (prev.sec + 1) % 60 : prev.sec;
        return { sec: nextSec, ms: nextMs };
      });
    }, 85);

    const paranoiaId = window.setInterval(() => {
      const jitter = (28.1 + Math.random() * 0.9).toFixed(1);
      setParanoiaReadout(`${jitter}% [STABLE]`);
    }, 1800);

    return () => {
      window.clearInterval(timerId);
      window.clearInterval(paranoiaId);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (exitNoticeOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setExitNoticeOpen(false);
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % menuOptions.length);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + menuOptions.length) % menuOptions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const option = menuOptions[selectedIndex];
        if (option && !option.disabled) {
          activateOption(option);
        }
      } else if (e.key === ' ') {
        const activeEl = document.activeElement;
        if (!activeEl || activeEl === document.body) {
          e.preventDefault();
          startNewInvestigation();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activateOption, exitNoticeOpen, menuOptions, selectedIndex, setExitNoticeOpen, startNewInvestigation]);

  const timerText = `02:14:${String(liveMs.sec).padStart(2, '0')}:${String(liveMs.ms).padStart(2, '0')}`;

  return (
    <section className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden bg-surface-container-lowest">
      {/* BACKGROUND ATMOSPHERIC STAGING (Abandoned Playground at 03:00 AM) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-screen scale-105 filter contrast-125 brightness-90"
          style={{ backgroundImage: "url('/assets/stitch/menu_playground.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/60 to-surface-container-lowest/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-transparent to-surface-container-lowest/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_45%,rgba(186,24,27,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-75" />
        <div className="absolute inset-0 opacity-20 bg-primary-container mix-blend-color-dodge" />

        {/* Distant Eerie Duck Silhouette Marker with Reflective Pin-pricks */}
        <div className="absolute top-[41%] right-[22%] w-16 h-16 pointer-events-auto group cursor-help hidden lg:flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
          <div className="relative flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-rec-blink mx-[1px] shadow-[0_0_8px_#ffb4ab]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-rec-blink mx-[1px] shadow-[0_0_8px_#ffb4ab]" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-space-xs py-0.5 bg-surface-container-highest text-primary font-label-sm text-label-sm tracking-widest uppercase rounded shadow-lg whitespace-nowrap">
            [ TARGET DISTANCE: 42M // EYES DETECTED ]
          </div>
        </div>
      </div>

      {/* UPPER DIEGETIC TELEMETRY & TACTICAL BAR */}
      <div className="relative z-10 w-full px-gutter-lg pt-space-lg flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md">
          <div className="px-space-sm py-1 bg-surface-container-high rounded shadow-md flex items-center gap-space-xs">
            <span
              className="material-symbols-outlined text-[14px] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <span className="font-label-sm text-label-sm tracking-widest text-primary uppercase font-bold">
              PSY-HAZARD CODE 4
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
            <span>SURVEILLANCE CAM #04</span>
            <span>::</span>
            <span className="text-tertiary">OAK PARK / MILLER&apos;S CREEK</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm sm:gap-space-md">
          <div className="flex items-center gap-space-xs bg-surface-container-high px-space-md py-1 rounded shadow-sm">
            <span className="material-symbols-outlined text-[14px] text-tertiary">headphones</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              BINAURAL AUDIO REQUIRED
            </span>
          </div>
          <div className="flex items-center gap-space-xs bg-surface-container-high px-space-md py-1 rounded shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-rec-blink" />
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              PERIPHERAL VISION: <span className="text-primary font-bold">ARMED</span>
            </span>
          </div>
          <div className="font-label-md text-label-md text-tertiary bg-surface-container-lowest px-space-sm py-1 rounded tracking-widest tabular-nums">
            <span>{timerText}</span>
          </div>
        </div>
      </div>

      {/* CENTER / LOWER-LEFT HERO CONTENT ZONE */}
      <div className="relative z-10 w-full px-gutter-lg py-space-xl flex flex-col lg:flex-row items-end justify-between gap-space-xl">
        {/* LEFT COLUMN: TITLE BLOCK & MENU SELECTION */}
        <div className="w-full lg:max-w-2xl flex flex-col gap-space-lg">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm font-label-md text-label-md uppercase tracking-[0.25em] text-primary">
              <span className="w-3 h-0.5 bg-primary" />
              <span>THE PLAYGROUND FILES // 1994 · 1996 · 2026</span>
            </div>

            <h1 className="font-display-lg text-display-lg-mobile sm:text-display-lg uppercase text-on-surface tracking-tight font-extrabold leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] relative">
              DON&apos;T LOOK AT <br />
              <span className="text-primary relative inline-block">
                THE DUCK
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 text-secondary opacity-30 select-none pointer-events-none -translate-x-[2px] translate-y-[1px]"
                >
                  THE DUCK
                </span>
              </span>
            </h1>

            <p className="font-body-lg text-body-lg text-tertiary-fixed-dim italic tracking-wider max-w-lg mt-space-xs">
              “Some things are safer left unseen. If you hear wet footsteps in the mulch, do not turn your head.”
            </p>
          </div>

          {/* MAIN INTERACTIVE MENU LIST */}
          <div className="w-full flex flex-col gap-space-sm max-w-md pt-space-sm" id="interactive-menu">
            {menuOptions.map((option, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={option.id}
                  type="button"
                  data-start={option.isPrimary ? 'true' : undefined}
                  disabled={option.disabled}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => activateOption(option)}
                  className={`menu-item group relative w-full text-left px-space-md py-space-md rounded transition-all duration-150 flex items-center justify-between ${
                    option.disabled
                      ? 'bg-surface-container/60 opacity-50 cursor-not-allowed'
                      : isSelected
                        ? 'bg-surface-container-high shadow-lg shadow-black/40 border-l-2 border-primary cursor-pointer'
                        : 'bg-surface-container hover:bg-surface-container-high shadow-md cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-space-md">
                    <span
                      className={`indicator font-label-lg text-label-lg transition-transform ${
                        isSelected
                          ? 'text-primary translate-x-0.5'
                          : 'text-outline group-hover:text-primary'
                      }`}
                    >
                      {isSelected ? '[ > ]' : '[   ]'}
                    </span>
                    <div className="flex flex-col">
                      <span
                        className={`font-label-lg text-label-lg uppercase tracking-wider font-bold ${
                          isSelected
                            ? 'text-primary'
                            : 'text-on-surface-variant group-hover:text-on-surface'
                        }`}
                      >
                        {option.title}
                      </span>
                      <span className="font-body-sm text-body-sm text-outline tracking-normal">
                        {option.subtitle}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`font-label-sm text-label-sm uppercase flex items-center gap-1 ${
                      option.isPrimary
                        ? 'text-primary'
                        : option.id === 'archive'
                          ? 'text-tertiary'
                          : 'text-outline group-hover:text-on-surface-variant'
                    }`}
                  >
                    {option.isPrimary && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    )}
                    {option.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: FORENSIC DOSSIER CLIPPING & PARANOIA TELEMETRY */}
        <div className="w-full lg:max-w-md flex flex-col gap-space-md">
          <div className="bg-surface-container-high p-space-md rounded shadow-2xl relative overflow-hidden">
            <div className="absolute -top-3 left-6 w-16 h-6 bg-tertiary-fixed-dim/30 -rotate-6 pointer-events-none" />
            <div className="absolute -top-3 right-6 w-16 h-6 bg-tertiary-fixed-dim/30 rotate-3 pointer-events-none" />

            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-rec-blink" />
                MANDATORY SAFETY PROTOCOL
              </span>
              <span className="font-label-sm text-label-sm text-outline">DOC-REF: #09-D</span>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">
              The entity masquerades as ordinary playground statuary. It thrives on the focal perimeter. If direct line-of-sight is sustained for longer than{' '}
              <span className="bg-surface-container-lowest text-primary font-bold px-1 py-0.5 rounded">
                1.4 seconds
              </span>
              , rapid auditory hallucinations and acoustic distortion will occur immediately.
            </p>

            <div className="flex flex-col gap-1.5 bg-surface-container-lowest p-space-sm rounded">
              <div className="flex justify-between items-center font-label-sm text-label-sm">
                <span className="text-outline uppercase">PARANOIA RESONANCE</span>
                <span className="text-primary font-bold tabular-nums">{paranoiaReadout}</span>
              </div>
              <div className="w-full h-2 bg-surface-container flex gap-1 p-0.5 rounded-sm">
                <div className="h-full w-1/12 bg-primary rounded-sm" />
                <div className="h-full w-1/12 bg-primary rounded-sm" />
                <div className="h-full w-1/12 bg-primary rounded-sm" />
                <div className="h-full w-1/12 bg-primary/40 rounded-sm" />
                <div className="h-full w-1/12 bg-surface-bright rounded-sm" />
                <div className="h-full w-1/12 bg-surface-bright rounded-sm" />
                <div className="h-full w-1/12 bg-surface-bright rounded-sm" />
                <div className="h-full w-1/12 bg-surface-bright rounded-sm" />
                <div className="h-full w-1/12 bg-surface-bright rounded-sm" />
                <div className="h-full w-1/12 bg-surface-bright rounded-sm" />
                <div className="h-full w-1/12 bg-surface-bright rounded-sm" />
                <div className="h-full w-1/12 bg-surface-bright rounded-sm" />
              </div>
            </div>
          </div>

          <div className="bg-tertiary-fixed text-on-tertiary-fixed p-space-sm rounded shadow-2xl relative rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-tertiary-container/40 -rotate-1 pointer-events-none" />
            <div className="w-full h-36 bg-surface-container-lowest overflow-hidden rounded-sm relative">
              <img
                alt="1994 surveillance Polaroid of an empty foggy playground sandbox with a small yellow rubber duck"
                className="w-full h-full object-cover filter contrast-125 grayscale"
                src="/assets/stitch/polaroid_14b_sandbox.png"
              />
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-surface-container-lowest/85 text-primary font-label-sm text-label-sm tracking-widest uppercase rounded">
                EVIDENCE #14-B
              </div>
            </div>
            <div className="pt-space-sm flex justify-between items-center font-body-sm text-body-sm text-on-tertiary italic">
              <span>“Found near the swings, wet.”</span>
              <span className="font-label-sm text-label-sm not-italic uppercase font-bold text-outline-variant">
                NOV 1994 // ARCHIVE
              </span>
            </div>
          </div>

          <div className="bg-surface-container p-space-sm rounded shadow-md flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[18px] animate-rec-blink">
                mic
              </span>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase text-on-surface font-bold">
                  AMBIENT SOUNDSCAPE
                </span>
                <span className="font-body-sm text-body-sm text-outline">
                  Rain &amp; Rusted Chains (38 dB)
                </span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-6" aria-hidden="true">
              <span className="w-1 bg-primary/70 h-2 animate-pulse" />
              <span className="w-1 bg-primary h-5 animate-pulse" />
              <span className="w-1 bg-primary/90 h-3 animate-pulse" />
              <span className="w-1 bg-primary h-6 animate-pulse" />
              <span className="w-1 bg-primary/40 h-2" />
              <span className="w-1 bg-primary/80 h-4 animate-pulse" />
              <span className="w-1 bg-primary h-1" />
            </div>
          </div>
        </div>
      </div>

      {/* DIEGETIC CONTROLS & BOTTOM STATUS BAR */}
      <div className="relative z-10 w-full px-gutter-lg py-space-md bg-surface-container-low/95 flex flex-wrap items-center justify-between gap-space-md shadow-[0_-2px_12px_rgba(0,0,0,0.6)]">
        <div className="flex flex-wrap items-center gap-space-md font-label-sm text-label-sm text-outline">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-surface-container-highest text-on-surface rounded font-mono font-bold">
              [ W / S ]
            </span>
            <span>OR</span>
            <span className="px-1.5 py-0.5 bg-surface-container-highest text-on-surface rounded font-mono font-bold">
              [ ↑ / ↓ ]
            </span>
            <span className="uppercase">NAVIGATE</span>
          </div>
          <span className="text-outline-variant">|</span>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-surface-container-highest text-on-surface rounded font-mono font-bold">
              [ ENTER ]
            </span>
            <span className="uppercase">ENGAGE SEQUENCE</span>
          </div>
          <span className="text-outline-variant">|</span>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-surface-container-highest text-on-surface rounded font-mono font-bold">
              [ ESC ]
            </span>
            <span className="uppercase">SYSTEM HALT</span>
          </div>
        </div>

        <div className="flex items-center gap-space-md font-label-sm text-label-sm">
          <span className="text-on-surface-variant font-mono">{CASE_METADATA.buildVersion}</span>
          <span className="text-outline-variant">::</span>
          <span className="text-primary tracking-widest font-bold uppercase animate-rec-blink">
            DO NOT DISTRIBUTE
          </span>
          <span className="text-outline-variant">::</span>
          <span className="text-outline">TERMINAL #07-ONLINE</span>
        </div>
      </div>

      {exitNoticeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-dialog-title"
          className="fixed inset-0 z-50 bg-surface-container-lowest/90 flex items-center justify-center p-gutter"
        >
          <div className="max-w-md w-full bg-surface-container border border-primary/50 p-space-lg shadow-2xl flex flex-col gap-space-md">
            <div className="flex items-center gap-2 text-primary font-label-md text-label-md uppercase font-bold">
              <span className="w-2 h-2 bg-primary animate-rec-blink" />
              <span id="exit-dialog-title">NEURO-FEED DISCONNECT CONFIRMATION</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Browser sessions cannot terminate host hardware directly. You may clear your local investigation checkpoint or remain connected to Case File #89-DUCK.
            </p>
            <div className="flex flex-wrap justify-end gap-space-sm pt-2">
              <button
                type="button"
                onClick={() => {
                  clearSavedProgress();
                  setExitNoticeOpen(false);
                }}
                className="px-3 py-2 bg-error-container text-on-error-container font-label-sm text-label-sm uppercase font-bold cursor-pointer"
              >
                CLEAR LOCAL SAVE
              </button>
              <button
                type="button"
                onClick={() => setExitNoticeOpen(false)}
                className="px-4 py-2 bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase font-bold cursor-pointer"
              >
                REMAIN CONNECTED
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
