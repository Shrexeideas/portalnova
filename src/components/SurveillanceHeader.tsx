import React from 'react';
import { CASE_METADATA } from '../data/caseData';
import { useGame } from '../state/GameContext';
import { ScreenId } from '../types/game';

const NAV_ITEMS: Array<{ id: ScreenId; label: string }> = [
  { id: 'main-menu', label: 'MAIN MENU' },
  { id: 'case-briefing', label: 'CASE BRIEFING' },
  { id: 'gameplay-hud', label: 'GAMEPLAY HUD' },
  { id: 'investigation-notebook', label: 'NOTEBOOK' },
  { id: 'pause-and-system', label: 'SYSTEM' },
  { id: 'incident-outcome', label: 'OUTCOMES' },
];

export const SurveillanceHeader: React.FC = () => {
  const { currentScreen, navigateTo } = useGame();

  return (
    <header className="fixed top-0 w-full z-40 bg-surface-container-lowest/95 border-b border-outline-variant/25 shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
      <div className="h-16 w-full max-w-full overflow-hidden px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => navigateTo('main-menu')}
          className="flex items-center gap-space-sm text-left cursor-pointer shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          aria-label="Return to Main Menu"
        >
          {/* Bespoke inline SVG Playground Files Emblem replacing auth-gated Stitch aida URL */}
          <svg
            aria-hidden="true"
            className="h-8 w-8 shrink-0"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="36" height="36" fill="#1a1c1e" stroke="#5b403d" strokeWidth="1.5" />
            <path d="M4 9V4H9M27 4H32V9M32 27V32H27M9 32H4V27" stroke="#ba181b" strokeWidth="1.5" />
            <circle cx="18" cy="17" r="7" stroke="#ffb4ab" strokeWidth="1.4" />
            <path d="M23 16L29 17.5L23 19.5Z" fill="#ffb4ab" />
            <circle cx="19.5" cy="15.5" r="1.6" fill="#ba181b" />
            <rect x="6" y="27" width="24" height="3" fill="#ba181b" opacity="0.7" />
          </svg>
          <div className="hidden sm:flex flex-col whitespace-nowrap">
            <span className="font-headline-sm text-[15px] uppercase text-on-surface tracking-wider leading-none font-bold">
              {CASE_METADATA.title}
            </span>
            <span className="font-label-sm text-label-sm uppercase text-outline tracking-widest mt-1">
              {CASE_METADATA.caseNumber} / {CASE_METADATA.classification}
            </span>
          </div>
        </button>

        <nav
          className="hidden xl:flex items-center gap-0.5 whitespace-nowrap"
          aria-label="Case terminal navigation"
        >
          {NAV_ITEMS.map((item) => {
            const active = currentScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => navigateTo(item.id)}
                className={`px-2 py-1.5 font-label-md text-[10px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low px-2.5 py-1.5 rounded whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-primary">
              <span className="w-2 h-2 rounded-full bg-primary animate-rec-blink" />
              <span>REC 00:04:18</span>
            </div>
            <span className="text-outline-variant">|</span>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-tertiary">
                graphic_eq
              </span>
              <span>PARANOIA FREQ: 14.2 Hz</span>
            </div>
            <span className="hidden 2xl:inline text-outline-variant">|</span>
            <span className="hidden 2xl:inline text-outline">{CASE_METADATA.coordinates}</span>
          </div>
          <div
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"
            title={CASE_METADATA.terminalAuth}
          >
            <span className="material-symbols-outlined text-on-primary text-[18px]">
              person
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
