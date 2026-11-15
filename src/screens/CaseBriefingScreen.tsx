import React, { useState } from 'react';
import { UNIFIED_SUBJECTS } from '../data/caseData';
import { useGame } from '../state/GameContext';

export const CaseBriefingScreen: React.FC = () => {
  const { enterPlayground, navigateTo } = useGame();
  const [revealedLineOne, setRevealedLineOne] = useState(false);
  const [revealedLineTwo, setRevealedLineTwo] = useState(false);

  return (
    <div className="flex flex-col w-full relative">
      {/* Diegetic Case Board Top Surveillance & Forensic Meta */}
      <div className="w-full bg-surface-container-lowest px-gutter-lg py-space-sm flex flex-wrap items-center justify-between gap-space-sm shadow-md">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-1.5 bg-primary-container px-space-sm py-0.5 rounded text-on-primary-container font-label-md text-label-md uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container animate-pulse" />
            <span>LEVEL-4 QUARANTINE DOSSIER</span>
          </div>
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest hidden sm:inline">
            ARCHIVE REF: BRF-1994-089-VANCE
          </span>
        </div>
        <div className="flex items-center gap-space-lg font-label-sm text-label-sm text-on-surface-variant">
          <span className="text-tertiary">LOCATION: WILLOW CREEK BOROUGH</span>
          <span className="hidden md:inline text-outline-variant">//</span>
          <span className="text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">warning</span>
            COGNITIVE THREAT TIER: CRITICAL
          </span>
        </div>
      </div>

      {/* Primary Interactive Evidence Pinboard */}
      <div className="relative w-full overflow-hidden bg-surface-container-low px-gutter py-space-xl sm:px-gutter-lg lg:py-margin-lg">
        {/* Directional Overhead Desk Lamp Spotlight Effect */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="pointer-events-none absolute -top-32 right-12 w-[420px] h-[420px] rounded-full bg-tertiary/5 blur-[90px]" />
        {/* Background Grid Lines */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#e2e2e5_1px,transparent_1px),linear-gradient(to_bottom,#e2e2e5_1px,transparent_1px)] bg-[size:48px_48px]" />

        {/* Diegetic Red Connecting Strings (Forensic Pushpin Web SVG Overlay) */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full z-10 opacity-70 hidden md:block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            className="text-primary-container"
            stroke="currentColor"
            strokeDasharray="3 2"
            strokeWidth="1.8"
            x1="50%"
            x2="20%"
            y1="28%"
            y2="22%"
          />
          <line
            className="text-primary-container"
            stroke="currentColor"
            strokeWidth="1.8"
            x1="50%"
            x2="80%"
            y1="28%"
            y2="26%"
          />
          <line
            className="text-primary-container"
            stroke="currentColor"
            strokeDasharray="4 2"
            strokeWidth="1.5"
            x1="50%"
            x2="24%"
            y1="46%"
            y2="68%"
          />
          <line
            className="text-primary-container"
            stroke="currentColor"
            strokeWidth="1.8"
            x1="80%"
            x2="76%"
            y1="36%"
            y2="66%"
          />
          <circle cx="50%" cy="28%" fill="#ba181b" r="4.5" stroke="#0c0e10" strokeWidth="2" />
          <circle cx="20%" cy="22%" fill="#ba181b" r="3.5" stroke="#0c0e10" strokeWidth="1.5" />
          <circle cx="80%" cy="26%" fill="#ba181b" r="3.5" stroke="#0c0e10" strokeWidth="1.5" />
          <circle cx="24%" cy="68%" fill="#ba181b" r="3.5" stroke="#0c0e10" strokeWidth="1.5" />
          <circle cx="76%" cy="66%" fill="#ba181b" r="3.5" stroke="#0c0e10" strokeWidth="1.5" />
        </svg>

        {/* Pinned Evidence Items Matrix */}
        <div className="relative z-20 max-w-7xl mx-auto flex flex-col gap-space-xl">
          {/* Upper Section: Case Dossier Title Strip & Header Meta */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-sm mb-1">
                <span className="px-space-xs py-0.5 bg-surface-container-highest text-tertiary font-label-sm text-label-sm tracking-widest uppercase">
                  EVIDENCE EXHIBIT 01
                </span>
                <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase">
                  RESTRICTED DOSSIER // DEPT. BEHAVIORAL FORENSICS
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg uppercase text-on-surface tracking-tight">
                CASE BRIEFING: <span className="text-primary">THE BOY WHO LOVED DUCKS</span>
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">
                1994 disappearance of five-year-old{' '}
                <strong className="text-on-surface">{UNIFIED_SUBJECTS.child.name}</strong> near
                Miller&apos;s Creek, the 1996 disappearance of cold-case investigator{' '}
                <strong className="text-primary">{UNIFIED_SUBJECTS.investigator.name}</strong>, and
                the anonymous 2026 parcel that brought you here tonight.
              </p>
            </div>
            <div className="bg-surface-container-high px-space-md py-space-sm rounded shadow-sm flex items-center gap-space-md self-start md:self-auto">
              <div className="w-3 h-3 rounded-full bg-primary animate-rec-blink" />
              <div className="flex flex-col font-label-sm text-label-sm">
                <span className="text-on-surface uppercase tracking-wider">
                  RETINAL GAZE STABILITY
                </span>
                <span className="text-outline">UNCOMPROMISED (0.00% DISTORTION)</span>
              </div>
            </div>
          </div>

          {/* Asymmetrical 12-Column Corkboard Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-lg items-start">
            {/* LEFT WING: Police Incident Report & Audio Transcript */}
            <div className="md:col-span-4 flex flex-col gap-space-lg">
              <div className="group relative bg-tertiary-fixed text-on-tertiary-fixed p-space-md rounded shadow-xl transform md:-rotate-1 transition-transform duration-300 hover:rotate-0">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-tertiary-fixed-dim/80 shadow-sm transform -rotate-2 pointer-events-none" />
                <div className="absolute -top-1.5 left-4 w-3.5 h-3.5 rounded-full bg-primary-container shadow-md pointer-events-none" />
                <div className="flex items-center justify-between mb-space-sm pb-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-tertiary">
                    MUNICIPAL POLICE LOG
                  </span>
                  <span className="font-label-sm text-label-sm font-bold text-primary-container">
                    #11-94-INCIDENT
                  </span>
                </div>
                <div className="font-body-sm text-body-sm leading-relaxed flex flex-col gap-space-xs text-on-tertiary">
                  <p className="font-bold uppercase tracking-wider text-on-tertiary">
                    DATE: NOV 14, 1996 - 03:42 HRS
                  </p>
                  <p>
                    Dispatch logged 4 calls concerning repetitive squeaking audible across Oak Park Playground two years after Jimmy Mercer vanished.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRevealedLineOne((v) => !v)}
                    className={`text-left px-1 rounded transition-colors duration-200 cursor-pointer ${
                      revealedLineOne
                        ? 'bg-surface-container text-on-surface'
                        : 'bg-surface-container-lowest text-surface-container-lowest hover:bg-surface-container hover:text-on-surface'
                    }`}
                    title="Click to reveal classified redaction"
                  >
                    Investigator Julian Vance [VANCE-09] unlocked the north drainage gate at 03:42.
                  </button>
                  <p>
                    His final micro-cassette warned of a voice in the forest imitating a child&apos;s laugh. Only his Maglite and reels were left behind.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRevealedLineTwo((v) => !v)}
                    className={`text-left px-1 rounded transition-colors duration-200 cursor-pointer ${
                      revealedLineTwo
                        ? 'bg-surface-container text-on-surface'
                        : 'bg-surface-container-lowest text-surface-container-lowest hover:bg-surface-container hover:text-on-surface'
                    }`}
                    title="Click to reveal classified redaction"
                  >
                    Julian Vance never returned. Case linked directly to Jimmy Mercer (Nov 12, 1994).
                  </button>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center justify-between gap-2 font-label-sm text-label-sm text-on-tertiary-fixed-variant">
                  <span>STATUS: UNRESOLVED · CLICK BLACKOUTS</span>
                  <span className="text-primary-container uppercase font-bold whitespace-nowrap">
                    [ FORENSIC LOG #02 ]
                  </span>
                </div>
              </div>

              <div className="relative bg-surface-container-high p-space-md rounded shadow-lg transform md:rotate-1">
                <div className="absolute -top-2 right-6 w-16 h-4 bg-tertiary-container/40 pointer-events-none transform rotate-3" />
                <div className="absolute -top-1 left-6 w-3 h-3 rounded-full bg-outline shadow-md" />
                <div className="flex items-center justify-between mb-space-xs">
                  <div className="flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-[15px]">graphic_eq</span>
                    <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider">
                      AUDIO TAPE 04B TRANSCRIPT
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline">REEL-SIDE B</span>
                </div>
                <blockquote className="font-body-md text-body-md text-primary-fixed italic my-space-sm pl-space-sm bg-surface-container px-space-sm py-space-sm rounded">
                  “It doesn&apos;t move when you stare at it. But if you look directly at its face... your peripheral vision turns to static.”
                </blockquote>
                <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between">
                  <span>VOICE: INVESTIGATOR J. VANCE / RECOVERED</span>
                  <span className="text-error uppercase">DECIBEL SPIKE @ 04:12</span>
                </div>
              </div>
            </div>

            {/* CENTER PIECE: FILE PHOTO #441-A (Reusing supplied screen_58ba943c.png) */}
            <div className="md:col-span-4 flex flex-col items-center">
              <div className="relative group w-full bg-tertiary-fixed text-on-tertiary p-space-md pb-space-lg rounded shadow-2xl transform md:-rotate-0.5 transition-transform duration-300 hover:scale-[1.01]">
                <div className="absolute -top-3 left-8 w-20 h-6 bg-tertiary-fixed-dim/90 shadow-sm pointer-events-none transform -rotate-3 z-30" />
                <div className="absolute -top-3 right-8 w-20 h-6 bg-tertiary-fixed-dim/90 shadow-sm pointer-events-none transform rotate-2 z-30" />
                <div className="absolute -bottom-3 left-10 w-24 h-6 bg-tertiary-fixed-dim/90 shadow-sm pointer-events-none transform rotate-1 z-30" />
                <div className="absolute -bottom-3 right-10 w-24 h-6 bg-tertiary-fixed-dim/90 shadow-sm pointer-events-none transform -rotate-2 z-30" />
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary-container shadow-lg z-40" />

                <div className="flex items-center justify-between mb-space-sm font-label-sm text-label-sm text-on-tertiary-fixed-variant">
                  <span>FILE PHOTO #441-A</span>
                  <span className="text-primary-container font-bold">MILLER&apos;S CREEK / EXHIBIT-00</span>
                </div>

                <div className="relative overflow-hidden rounded bg-surface-container-lowest shadow-inner aspect-square w-full flex flex-col justify-between p-4 border border-on-tertiary-fixed/20">
                  <img
                    src="/assets/stitch/polaroid_14b_sandbox.png"
                    alt="1994 crime-scene exhibit photograph showing a yellow rubber duck beside the Miller's Creek playground"
                    className="absolute inset-0 w-full h-full object-cover filter contrast-125 grayscale opacity-75"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface-container-lowest/35 to-surface-container-lowest/75" />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="bg-primary-container text-on-primary-container px-2 py-0.5 font-label-sm text-label-sm font-bold tracking-widest uppercase">
                      MISSING // 1994
                    </span>
                    <span className="font-label-sm text-label-sm text-tertiary uppercase">
                      PARCEL EXHIBIT
                    </span>
                  </div>
                  <div className="relative z-10 my-auto flex flex-col items-center text-center bg-surface-container-lowest/85 p-3 border border-primary/40 rounded">
                    <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-wider">
                      JIMMY MERCER
                    </span>
                    <span className="font-label-sm text-label-sm text-primary uppercase mt-0.5">
                      AGE 5 · NOV 12, 1994
                    </span>
                    <span className="font-body-sm text-[11px] text-on-surface-variant mt-1">
                      Slipped into your anonymous 2026 package with Julian&apos;s micro-cassette.
                    </span>
                  </div>
                  <div className="relative z-10 flex items-center justify-end">
                    <div className="flex items-center gap-1 bg-surface-container-lowest/90 px-space-sm py-0.5 rounded font-label-sm text-label-sm text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-rec-blink" />
                      <span>FOVEAL TRACKER: LOCKED</span>
                    </div>
                  </div>
                </div>

                <div className="mt-space-md bg-surface-container-lowest p-space-sm rounded shadow-sm text-on-surface">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-outline mb-1">
                    <span>INDEXED RECORD</span>
                    <span className="text-primary uppercase font-bold">LINKED INCIDENTS</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface leading-snug">
                    <span className="text-primary font-bold">Jimmy Mercer, age 5.</span> Vanished Nov 12, 1994 near Miller&apos;s Creek. Investigator{' '}
                    <span className="text-secondary font-bold">Julian Vance</span> reopened the file in 1996 and vanished while tracing Exhibit-00.
                  </p>
                  <div className="mt-2 pt-1.5 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>FOUND HOLDING: EXHIBIT-00</span>
                    <span className="text-tertiary">CASE #89-DUCK</span>
                  </div>
                </div>

                <div className="mt-space-sm flex justify-center">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container px-space-sm py-0.5 bg-primary-container/10 rounded">
                    EVIDENCE CLASSIFICATION: COGNITIVE VECTOR
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT WING: Crayon Drawing & Newspaper Clipping */}
            <div className="md:col-span-4 flex flex-col gap-space-lg">
              <div className="relative bg-surface-container-highest p-space-md rounded shadow-xl transform md:rotate-2 transition-transform duration-300 hover:rotate-0">
                <div className="absolute -top-3 left-10 w-20 h-5 bg-tertiary-fixed-dim/80 pointer-events-none transform -rotate-1" />
                <div className="absolute -top-1.5 right-6 w-3.5 h-3.5 rounded-full bg-primary-container shadow-md" />
                <div className="flex items-center justify-between mb-space-xs font-label-sm text-label-sm text-outline">
                  <span>ITEM RECOVERED: DESK #4</span>
                  <span className="text-primary uppercase">CRAYON ON NEWSPRINT</span>
                </div>

                <div className="relative bg-surface-container-lowest p-space-md rounded overflow-hidden shadow-inner">
                  <div className="flex flex-col items-center justify-center py-space-sm">
                    <svg
                      className="w-full h-36"
                      fill="none"
                      viewBox="0 0 240 120"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="Child crayon sketch of playground swings with a looming duck silhouette labeled HE IS WATCHING"
                    >
                      <path
                        d="M20 110L50 30L80 110"
                        stroke="#cac6bb"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                      />
                      <path d="M50 30L170 30" stroke="#cac6bb" strokeLinecap="round" strokeWidth="3" />
                      <path d="M170 30L200 110" stroke="#cac6bb" strokeLinecap="round" strokeWidth="3" />
                      <path
                        d="M30 85L60 85M35 65L65 65"
                        stroke="#605e55"
                        strokeLinecap="round"
                        strokeWidth="2"
                      />
                      <line stroke="#605e55" strokeDasharray="2 2" strokeWidth="1.5" x1="90" x2="88" y1="32" y2="80" />
                      <line stroke="#605e55" strokeDasharray="2 2" strokeWidth="1.5" x1="110" x2="108" y1="32" y2="80" />
                      <rect fill="#605e55" height="4" width="34" x="82" y="80" />
                      <path
                        d="M150 40 C145 20, 185 10, 195 28 C205 28, 215 36, 210 44 C205 50, 190 55, 175 52 C160 55, 145 50, 150 40 Z"
                        fill="#cac6bb"
                        opacity="0.9"
                      />
                      <path d="M210 38 L225 40 L212 45 Z" fill="#ffb4ab" />
                      <circle cx="192" cy="28" fill="#ba181b" r="4" />
                      <circle cx="192" cy="28" fill="#0c0e10" r="1.5" />
                      <path
                        d="M5 112 C40 108, 90 115, 140 109 C180 113, 210 110, 235 112"
                        stroke="#333537"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                    <div className="mt-space-xs text-center">
                      <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-widest uppercase">
                        HE IS WATCHING
                      </span>
                    </div>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-sm italic">
                  Recovered near the seesaw fulcrum, dated two days prior to Nov 12, 1994. Back margin reads: &ldquo;Don&apos;t look when it talks.&rdquo;
                </p>
              </div>

              <div className="relative bg-tertiary text-on-tertiary p-space-md rounded shadow-lg transform md:-rotate-1">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary shadow-md" />
                <div className="pb-space-xs mb-space-xs font-label-sm text-label-sm text-on-tertiary-fixed-variant flex items-center justify-between uppercase">
                  <span>THE VALLEY GAZETTE // NOV 19, 1994</span>
                  <span>PAGE A-4</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm uppercase font-bold leading-tight text-on-tertiary tracking-tight mb-space-sm">
                  SEARCH CALLED OFF AT WILLOW CREEK PLAYGROUND — THIRD INVESTIGATOR HOSPITALIZED FOR PSYCHOSIS
                </h2>
                <p className="font-body-sm text-body-sm leading-relaxed text-on-tertiary">
                  Federal responders established a perimeter fence around the municipal recreation area at dusk yesterday. Local precinct officials confirm all canine search units refused to cross the perimeter tree-line.
                </p>
                <div className="mt-space-sm pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-outline-variant font-bold">
                  <span>QUARANTINE ORDER #44-B</span>
                  <span className="text-primary-container uppercase">EXHIBIT CONFISCATED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Peripheral Psychosis Telemetry Sparkline Strip */}
          <div className="w-full bg-surface-container px-space-md py-space-sm rounded flex flex-col md:flex-row items-center justify-between gap-space-md shadow-md">
            <div className="flex items-center gap-space-md">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                  BASELINE NEURO-TELEMETRY
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline hidden sm:inline">
                SANITY DRIFT: 0.04% // AMBIENT STATIC: 14.2 Hz
              </span>
            </div>
            <div className="flex items-center gap-space-md w-full md:w-auto">
              <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                RETINAL EXPOSURE RATE
              </span>
              <svg
                aria-hidden="true"
                className="h-6 w-48 text-primary"
                fill="none"
                viewBox="0 0 160 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 12 L30 12 L38 4 L46 20 L54 8 L62 16 L70 12 L100 12 L110 2 L120 22 L130 10 L140 14 L160 12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                />
              </svg>
              <span className="font-label-sm text-label-sm text-tertiary">NOMINAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Command & Tactical Action Bar */}
      <div className="sticky bottom-0 z-30 w-full bg-surface-container-lowest/95 border-t border-outline-variant/25 px-gutter-lg py-space-md shadow-[0_-4px_24px_rgba(0,0,0,0.85)]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-sm max-w-xl">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
              report_problem
            </span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary">
                PHYSIOLOGICAL RISK PROTOCOL
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Direct focal gaze tracking will trigger sensory distortion. If creature manifests, break eye contact immediately and monitor via peripheral sightline only.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-space-md w-full lg:w-auto justify-end">
            <button
              type="button"
              onClick={() => navigateTo('investigation-notebook')}
              className="flex-1 sm:flex-initial px-space-lg py-space-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md uppercase tracking-wider rounded transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-tertiary">
                folder_open
              </span>
              <span>[ EXAMINE FULL DOSSIER ]</span>
            </button>
            <button
              type="button"
              data-start="true"
              onClick={enterPlayground}
              className="flex-1 sm:flex-initial relative group px-space-lg py-space-sm bg-primary-container hover:bg-inverse-primary text-on-primary-container font-label-lg text-label-lg uppercase tracking-wider rounded transition-all duration-200 shadow-xl flex items-center justify-center gap-space-sm whitespace-nowrap active:translate-y-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:scale-110">
                sensors
              </span>
              <span>START INVESTIGATION (ENTER PLAYGROUND)</span>
              <span className="w-2 h-2 rounded-full bg-on-primary-container animate-rec-blink" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
