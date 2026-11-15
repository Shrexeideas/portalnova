import React, { useEffect, useMemo, useState } from 'react';
import { horrorAudioEngine } from '../audio/horrorAudioEngine';
import { CASE_METADATA, DEDUCTION_NODES, INITIAL_EVIDENCE_ITEMS } from '../data/caseData';
import { useGame } from '../state/GameContext';
import { createInitialSave } from '../state/gameRules';
import { canSolveDeduction, getUnlockedAudioRecordings } from '../state/storyProgression';
import { EvidenceItem } from '../types/game';

type FilterTab = 'all' | '1994' | 'tapes' | 'docs-photos';

export const InvestigationNotebookScreen: React.FC = () => {
  const {
    saveData,
    evidenceList,
    forestGateStatus,
    locationStatuses,
    hudState,
    returnScreen,
    examineEvidence,
    recordAudioProgress,
    solveDeduction,
    enterPlayground,
    returnFromOverlayScreen,
    navigateTo,
  } = useGame();

  const effectiveSave = useMemo(() => saveData ?? createInitialSave(), [saveData]);
  const examinedSet = useMemo(
    () => new Set(effectiveSave.examinedEvidenceIds),
    [effectiveSave.examinedEvidenceIds],
  );
  const completedDeductionSet = useMemo(
    () => new Set(effectiveSave.completedDeductionIds),
    [effectiveSave.completedDeductionIds],
  );

  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>(() => {
    const firstFound = evidenceList.find((item) => item.discovered);
    return firstFound?.id ?? INITIAL_EVIDENCE_ITEMS[0].id;
  });

  const recordings = useMemo(
    () => getUnlockedAudioRecordings(effectiveSave),
    [effectiveSave],
  );
  const [selectedRecordingId, setSelectedRecordingId] = useState<string>(recordings[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSec, setPlaybackSec] = useState(0);
  const [deductionFeedback, setDeductionFeedback] = useState<string | null>(null);

  const activeRecording = useMemo(
    () => recordings.find((r) => r.id === selectedRecordingId) ?? recordings[0],
    [recordings, selectedRecordingId],
  );

  // Stop cassette hardware audio if user navigates away or switches off tape
  useEffect(() => {
    return () => {
      horrorAudioEngine.stopCassetteAudio();
    };
  }, []);

  // Keyboard shortcut: [TAB] or [ESC] returns to previous view / playground
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Tab') {
        e.preventDefault();
        horrorAudioEngine.stopCassetteAudio();
        returnFromOverlayScreen();
      } else if (e.key === ' ') {
        if (activeRecording.unlocked) {
          e.preventDefault();
          setIsPlaying((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeRecording.unlocked, returnFromOverlayScreen]);

  // Cassette playback interval
  useEffect(() => {
    if (!isPlaying || !activeRecording.unlocked) {
      horrorAudioEngine.stopCassetteAudio();
      return;
    }
    horrorAudioEngine.startCassetteAudio(activeRecording.id, playbackSec);
    const id = window.setInterval(() => {
      setPlaybackSec((prev) => {
        const next = Math.min(activeRecording.durationSec, prev + 0.5);
        recordAudioProgress(activeRecording.id, next);
        if (next >= activeRecording.durationSec) {
          setIsPlaying(false);
        }
        return next;
      });
    }, 500);
    return () => {
      window.clearInterval(id);
      horrorAudioEngine.stopCassetteAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, activeRecording.id, activeRecording.unlocked]);

  const selectRecording = (recId: string) => {
    setIsPlaying(false);
    setPlaybackSec(0);
    setSelectedRecordingId(recId);
  };

  const seekAudio = (nextSec: number) => {
    const clamped = Math.max(0, Math.min(activeRecording.durationSec, nextSec));
    setPlaybackSec(clamped);
    if (activeRecording.unlocked) {
      recordAudioProgress(activeRecording.id, clamped);
    }
  };

  const filteredEvidence = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return evidenceList.filter((item) => {
      if (filterTab === '1994' && item.year !== 1994) return false;
      if (filterTab === 'tapes' && item.category !== 'tape') return false;
      if (filterTab === 'docs-photos' && item.category !== 'document' && item.category !== 'photo') {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.sector.toLowerCase().includes(q)
      );
    });
  }, [evidenceList, filterTab, searchQuery]);

  const activeItem: EvidenceItem =
    evidenceList.find((item) => item.id === selectedEvidenceId) ?? evidenceList[0];

  const isSelectedExamined = examinedSet.has(activeItem.id);
  const discoveredCount = evidenceList.filter((i) => i.discovered).length;
  const integrityPct = Math.min(
    100,
    Math.round(
      ((forestGateStatus.mandatoryExaminedCount +
        forestGateStatus.audioCluesFoundCount +
        (forestGateStatus.finalDeductionSolved ? 2 : 0)) /
        (forestGateStatus.mandatoryTotal + forestGateStatus.audioCluesTotal + 2)) *
        100,
    ),
  );

  const handleSolveDeduction = (deductionId: string) => {
    const res = solveDeduction(deductionId);
    if (res.unlockedForestGate) {
      setDeductionFeedback(
        'FINAL DEDUCTION VERIFIED // NORTH FOREST GATE UNLOCKED. Return to the playground and head north.',
      );
    } else if (res.solved) {
      setDeductionFeedback('DEDUCTION THREAD VERIFIED & PINNED TO CASEBOARD.');
    } else {
      setDeductionFeedback(
        'MISSING PREREQUISITES: Examine required exhibits and listen past hidden timestamps on Julian’s tapes first.',
      );
    }
  };

  const formatSec = (sec: number) => {
    const s = Math.floor(sec);
    return `00:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="w-full px-gutter sm:px-gutter-lg py-space-md flex flex-col gap-space-lg">
      {/* Top Dossier Header Strip */}
      <div className="w-full bg-surface-container-lowest rounded-lg p-space-md shadow-xl flex flex-wrap items-center justify-between gap-space-md border border-outline-variant/20">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded bg-primary-container flex items-center justify-center text-on-primary-container shadow-md shrink-0">
            <span className="material-symbols-outlined text-[22px]">folder_special</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-wide">
                EVIDENCE DOSSIER • ARCHIVE 89
              </span>
              <span className="bg-surface-container-high text-primary px-2 py-0.5 rounded font-label-sm text-label-sm uppercase">
                1994 / 1996 / 2026
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              SUB-SECTOR: {CASE_METADATA.parkName.toUpperCase()} // JIMMY MERCER &amp; JULIAN VANCE
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-md">
          <div className="flex flex-col text-right">
            <span className="font-label-sm text-label-sm uppercase text-outline">
              CASE RECONSTRUCTION
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-28 h-2 bg-surface-container-high rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-primary-container transition-all duration-300"
                  style={{ width: `${integrityPct}%` }}
                />
              </div>
              <span className="font-label-sm text-label-sm text-on-surface font-bold tabular-nums">
                {integrityPct}% COHESION
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              horrorAudioEngine.stopCassetteAudio();
              navigateTo('chapter-archive');
            }}
            className="bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md px-3 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-tertiary">history</span>
            <span>OUTCOMES ({effectiveSave.unlockedEndings.length}/4)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              horrorAudioEngine.stopCassetteAudio();
              if (returnScreen === 'gameplay-hud') {
                returnFromOverlayScreen();
              } else {
                enterPlayground();
              }
            }}
            className="bg-primary-container hover:bg-inverse-primary text-on-primary-container font-label-md text-label-md px-4 py-2 rounded flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">sports_esports</span>
            <span>{returnScreen === 'gameplay-hud' ? 'RESUME PLAYGROUND [TAB]' : 'ENTER PLAYGROUND'}</span>
          </button>
        </div>
      </div>

      {/* 5-Location Progression Strip & Forest Gate Readiness */}
      <div className="bg-surface-container-low rounded-lg p-space-md border border-outline-variant/20 flex flex-col gap-space-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest">
            SECTOR ACCESS &amp; NORTH FOREST GATE STATUS
          </span>
          <div className="flex flex-wrap items-center gap-2 font-label-sm text-label-sm">
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface">
              EXHIBITS EXAMINED: {forestGateStatus.mandatoryExaminedCount}/{forestGateStatus.mandatoryTotal}
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-secondary">
              AUDIO CLUES: {forestGateStatus.audioCluesFoundCount}/{forestGateStatus.audioCluesTotal}
            </span>
            <span
              className={`px-2 py-0.5 rounded font-bold ${
                forestGateStatus.unlocked
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-lowest text-primary'
              }`}
            >
              {forestGateStatus.unlocked ? 'FOREST GATE: UNLOCKED' : 'FOREST GATE: LOCKED'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {locationStatuses.map((loc) => {
            const isCurrent = hudState.currentLocation === loc.id;
            return (
              <div
                key={loc.id}
                className={`p-2.5 rounded border ${
                  loc.unlocked
                    ? isCurrent
                      ? 'bg-surface-container-high border-primary/60'
                      : 'bg-surface-container border-outline-variant/25'
                    : 'bg-surface-container-lowest/70 border-outline-variant/15 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-label-sm text-label-sm text-on-surface font-bold truncate">
                    {loc.name}
                  </span>
                  <span
                    className={`font-label-sm text-[9px] px-1.5 py-0.5 rounded uppercase ${
                      loc.unlocked
                        ? 'bg-secondary-container text-secondary-fixed'
                        : 'bg-surface-container-high text-outline'
                    }`}
                  >
                    {loc.unlocked ? 'OPEN' : 'LOCKED'}
                  </span>
                </div>
                <p className="font-body-sm text-[11px] text-outline mt-1 leading-snug">
                  {loc.unlocked ? loc.subtitle : loc.unlockRequirementHint}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 3-Column Forensic Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: Categorized Evidence Stack */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="bg-surface-container-low rounded-lg p-space-sm shadow-md">
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-2.5 py-2 rounded text-left font-label-sm text-label-sm uppercase flex justify-between items-center cursor-pointer transition-colors ${
                  filterTab === 'all'
                    ? 'bg-surface-container-highest text-on-surface font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>ALL EVIDENCE</span>
                <span className="bg-surface-container-lowest px-1.5 py-0.5 rounded text-primary">
                  {discoveredCount}/{evidenceList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('1994')}
                className={`px-2.5 py-2 rounded text-left font-label-sm text-label-sm uppercase flex justify-between items-center cursor-pointer transition-colors ${
                  filterTab === '1994'
                    ? 'bg-surface-container-highest text-on-surface font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>1994 EXHIBITS</span>
                <span className="bg-surface-container-lowest px-1.5 py-0.5 rounded text-tertiary">
                  {evidenceList.filter((i) => i.year === 1994).length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('tapes')}
                className={`px-2.5 py-2 rounded text-left font-label-sm text-label-sm uppercase flex justify-between items-center cursor-pointer transition-colors ${
                  filterTab === 'tapes'
                    ? 'bg-surface-container-highest text-on-surface font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>1996 TAPES</span>
                <span className="bg-surface-container-lowest px-1.5 py-0.5 rounded text-secondary">
                  {evidenceList.filter((i) => i.category === 'tape').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('docs-photos')}
                className={`px-2.5 py-2 rounded text-left font-label-sm text-label-sm uppercase flex justify-between items-center cursor-pointer transition-colors ${
                  filterTab === 'docs-photos'
                    ? 'bg-surface-container-highest text-on-surface font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>PHOTOS / DOCS</span>
                <span className="bg-surface-container-lowest px-1.5 py-0.5 rounded text-outline">
                  {evidenceList.filter((i) => i.category === 'document' || i.category === 'photo').length}
                </span>
              </button>
            </div>

            <div className="relative mt-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="QUERY LOGS BY TAG / EXHIBIT ID..."
                className="w-full bg-surface-container-lowest text-on-surface font-body-sm text-body-sm px-3 py-2 rounded pl-8 outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="material-symbols-outlined absolute left-2 top-2 text-[16px] text-outline">
                search
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredEvidence.map((item) => {
              const selected = item.id === activeItem.id;
              const examined = examinedSet.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedEvidenceId(item.id)}
                  className={`w-full text-left rounded-lg p-space-sm transition-all cursor-pointer border ${
                    selected
                      ? 'bg-surface-container-high border-primary shadow-md'
                      : item.discovered
                        ? 'bg-surface-container border-outline-variant/20 hover:bg-surface-container-high'
                        : 'bg-surface-container-lowest/70 border-outline-variant/10 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          !item.discovered
                            ? 'bg-outline'
                            : examined
                              ? 'bg-secondary'
                              : 'bg-primary animate-rec-blink'
                        }`}
                      />
                      <span className="font-label-sm text-label-sm text-primary uppercase">
                        {item.code}
                      </span>
                      {item.mandatoryForForest && (
                        <span className="font-label-sm text-[8px] px-1 py-0.5 rounded bg-surface-container-lowest text-tertiary uppercase">
                          CORE
                        </span>
                      )}
                    </div>
                    <span className="font-label-sm text-label-sm text-outline">{item.year}</span>
                  </div>

                  <h4 className="font-headline-sm text-[14px] text-on-surface mt-1 truncate">
                    {item.discovered ? item.title : `[UNRECOVERED EXHIBIT // ${item.sector}]`}
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
                    {item.discovered
                      ? item.summary
                      : `Inspect ${item.sector} in the 3D grounds to catalog this file.`}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-label-sm text-[9px] text-outline uppercase">
                      {item.sector}
                    </span>
                    <span
                      className={`font-label-sm text-[9px] px-1.5 py-0.5 rounded uppercase ${
                        !item.discovered
                          ? 'bg-surface-container text-outline'
                          : examined
                            ? 'bg-secondary-container text-secondary-fixed'
                            : 'bg-primary-container text-on-primary-container'
                      }`}
                    >
                      {!item.discovered ? 'MISSING' : examined ? 'EXAMINED' : 'NEW // EXAMINE'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER COLUMN: Active Evidence Forensic Examiner */}
        <div className="lg:col-span-4 bg-surface-container-low rounded-lg p-space-md shadow-xl border border-outline-variant/20 flex flex-col gap-space-md">
          <div className="flex items-center justify-between border-b border-surface-container-highest pb-2">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
              FORENSIC EXAMINER
            </span>
            <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded font-label-sm text-label-sm uppercase font-bold">
              {activeItem.code} · {activeItem.year}
            </span>
          </div>

          {!activeItem.discovered ? (
            <div className="bg-surface-container-lowest p-space-lg rounded flex flex-col items-center text-center gap-space-sm">
              <span className="material-symbols-outlined text-[36px] text-outline">lock</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface uppercase">
                EXHIBIT NOT YET RECOVERED
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Location: <strong className="text-tertiary">{activeItem.sector}</strong>
              </p>
              <p className="font-body-sm text-body-sm text-outline">
                Explore this area inside the 3D playground and press [E] to log this item before examining its forensic notes.
              </p>
            </div>
          ) : (
            <>
              {/* Stitch-inspired Polaroid / Document Frame */}
              <div className="bg-tertiary-fixed text-on-tertiary-fixed p-3 rounded shadow-lg relative">
                <div className="w-full h-36 bg-surface-container-lowest rounded-sm overflow-hidden relative flex items-center justify-center">
                  <img
                    src={
                      activeItem.category === 'photo'
                        ? '/assets/stitch/hud_playground_pov.png'
                        : activeItem.id === 'clue-01-beak-shard'
                          ? '/assets/stitch/swing_playground_pov.png'
                          : '/assets/stitch/polaroid_14b_sandbox.png'
                    }
                    alt={activeItem.title}
                    className="w-full h-full object-cover filter contrast-125 grayscale"
                  />
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-surface-container-lowest/90 text-primary font-label-sm text-[9px] uppercase">
                    {activeItem.sector}
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between font-label-sm text-[10px] text-on-tertiary">
                  <span className="font-bold uppercase">{activeItem.title}</span>
                  <span>{activeItem.year}</span>
                </div>
              </div>

              <div className="bg-surface-container p-space-md rounded flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-secondary uppercase">
                  FIELD SUMMARY
                </span>
                <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                  {activeItem.summary}
                </p>

                <span className="font-label-sm text-label-sm text-primary uppercase mt-2">
                  FORENSIC &amp; TIMELINE NOTE
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {activeItem.forensicNote}
                </p>

                <span className="font-label-sm text-label-sm text-tertiary uppercase mt-2">
                  UNRESOLVED AMBIGUITY
                </span>
                <p className="font-body-sm text-body-sm text-outline italic leading-relaxed">
                  {activeItem.ambiguityNote}
                </p>

                {activeItem.quote && (
                  <blockquote className="mt-2 border-l-2 border-primary pl-3 py-1 bg-surface-container-lowest text-primary-fixed italic font-body-sm text-body-sm">
                    {activeItem.quote}
                  </blockquote>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => examineEvidence(activeItem.id)}
                  disabled={isSelectedExamined}
                  className={`flex-1 px-4 py-2.5 rounded font-label-md text-label-md uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                    isSelectedExamined
                      ? 'bg-secondary-container text-secondary-fixed cursor-default'
                      : 'bg-primary-container hover:bg-inverse-primary text-on-primary-container cursor-pointer font-bold'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isSelectedExamined ? 'verified' : 'fact_check'}
                  </span>
                  <span>
                    {isSelectedExamined ? 'EXAMINED & VERIFIED' : 'MARK AS EXAMINED'}
                  </span>
                </button>

                {activeItem.linkedAudioId && (
                  <button
                    type="button"
                    onClick={() => selectRecording(activeItem.linkedAudioId!)}
                    className="px-3 py-2.5 rounded bg-surface-container-high hover:bg-surface-bright text-secondary font-label-sm text-label-sm uppercase cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
                    <span>LOAD TAPE</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Julian Vance Cassette Deck + Red-String Deduction Board */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          {/* Interactive Cassette Tape Player */}
          <div className="bg-surface-container-low rounded-lg p-space-md shadow-xl border border-outline-variant/20 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
                <span className="font-label-sm text-label-sm uppercase font-bold tracking-wider">
                  JULIAN VANCE // 1996 CASSETTE DECK
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-primary animate-rec-blink">
                {isPlaying ? 'PLAYING' : 'STANDBY'}
              </span>
            </div>

            {/* Tape Selector Pills */}
            <div className="flex flex-wrap gap-1">
              {recordings.map((rec) => {
                const selected = rec.id === activeRecording.id;
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => selectRecording(rec.id)}
                    className={`px-2 py-1 rounded font-label-sm text-[10px] uppercase cursor-pointer transition-colors ${
                      selected
                        ? 'bg-primary-container text-on-primary-container font-bold'
                        : rec.unlocked
                          ? 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                          : 'bg-surface-container-lowest text-outline opacity-60'
                    }`}
                  >
                    {rec.code} {rec.hiddenClueFound ? '✓' : rec.unlocked ? '' : '🔒'}
                  </button>
                );
              })}
            </div>

            {!activeRecording.unlocked ? (
              <div className="bg-surface-container-lowest p-space-md rounded text-center">
                <p className="font-body-sm text-body-sm text-outline">
                  Reel locked. Recover{' '}
                  <strong className="text-on-surface">
                    {evidenceList.find((e) => e.id === activeRecording.requiredEvidenceId)?.title ??
                      'the corresponding cassette in the 3D grounds'}
                  </strong>{' '}
                  in the 3D playground to unlock playback.
                </p>
              </div>
            ) : (
              <div className="bg-surface-container-lowest p-3 rounded flex flex-col gap-2">
                <div className="flex items-center justify-between text-on-surface">
                  <span className="font-headline-sm text-[14px]">{activeRecording.title}</span>
                  <span className="font-label-sm text-[10px] text-outline">
                    {activeRecording.recordedTimestamp}
                  </span>
                </div>

                {/* Scrubber */}
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-[10px] text-primary tabular-nums">
                    {formatSec(playbackSec)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={activeRecording.durationSec}
                    step={0.5}
                    value={playbackSec}
                    aria-label="Cassette playback scrubber"
                    onChange={(e) => seekAudio(Number(e.target.value))}
                    className="flex-1 accent-primary cursor-pointer"
                  />
                  <span className="font-label-sm text-[10px] text-outline tabular-nums">
                    {formatSec(activeRecording.durationSec)}
                  </span>
                </div>

                {/* Transport Controls */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => seekAudio(playbackSec - 5)}
                      className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high font-label-sm text-[10px] text-on-surface cursor-pointer"
                    >
                      -5s
                    </button>
                    <button
                      type="button"
                      onClick={() => seekAudio(playbackSec + 5)}
                      className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high font-label-sm text-[10px] text-on-surface cursor-pointer"
                    >
                      +5s
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (playbackSec >= activeRecording.durationSec) {
                        setPlaybackSec(0);
                      }
                      setIsPlaying((v) => !v);
                    }}
                    className="px-3 py-1 rounded bg-primary-container hover:bg-inverse-primary text-on-primary-container font-label-sm text-label-sm font-bold uppercase cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                    <span>{isPlaying ? 'PAUSE' : 'PLAY REEL'}</span>
                  </button>
                </div>

                {/* Synced Transcript */}
                <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pt-1 border-t border-surface-container">
                  {activeRecording.transcript.map((seg, idx) => {
                    const activeLine = playbackSec >= seg.atSec;
                    return (
                      <div
                        key={idx}
                        className={`p-1.5 rounded text-body-sm font-body-sm transition-colors ${
                          seg.isHiddenClue && activeRecording.hiddenClueFound
                            ? 'bg-primary-container/25 border-l-2 border-primary text-on-surface'
                            : activeLine
                              ? 'bg-surface-container text-on-surface'
                              : 'text-outline/75'
                        }`}
                      >
                        <span className="font-label-sm text-[9px] text-tertiary mr-1.5">
                          [{formatSec(seg.atSec)}] {seg.speaker}:
                        </span>
                        <span>{seg.text}</span>
                      </div>
                    );
                  })}
                </div>

                {activeRecording.hiddenClueFound ? (
                  <div className="bg-primary-container/20 border border-primary/40 p-2 rounded">
                    <div className="font-label-sm text-[10px] text-primary font-bold uppercase">
                      AUDIO CLUE DECODED: {activeRecording.hiddenClueTitle}
                    </div>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                      {activeRecording.hiddenClueNote}
                    </p>
                  </div>
                ) : (
                  <p className="font-label-sm text-[10px] text-outline">
                    Play or scrub past {formatSec(activeRecording.hiddenClueTimestampSec)} to isolate hidden audio anomaly.
                  </p>
                )}

                {activeRecording.reinterpretationUnlocked && activeRecording.reinterpretationNote && (
                  <div className="bg-secondary-container/30 border border-secondary/40 p-2 rounded">
                    <div className="font-label-sm text-[10px] text-secondary font-bold uppercase">
                      CROSS-EVIDENCE REINTERPRETATION
                    </div>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                      {activeRecording.reinterpretationNote}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Red-String Deduction Board */}
          <div className="bg-surface-container-low rounded-lg p-space-md shadow-xl border border-outline-variant/20 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">share</span>
                <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold tracking-wider">
                  RED-STRING DEDUCTION BOARD
                </span>
              </div>
              <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded font-label-sm text-[10px]">
                {effectiveSave.completedDeductionIds.length}/{DEDUCTION_NODES.length} SOLVED
              </span>
            </div>

            {deductionFeedback && (
              <div className="p-2 rounded bg-surface-container-lowest border-l-2 border-primary font-body-sm text-[11px] text-primary-fixed">
                {deductionFeedback}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {DEDUCTION_NODES.map((node) => {
                const solved = completedDeductionSet.has(node.id);
                const ready = canSolveDeduction(node, effectiveSave);
                const metEvidence = node.requiredEvidenceIds.filter(
                  (id) =>
                    effectiveSave.discoveredEvidenceIds.includes(id) &&
                    examinedSet.has(id),
                ).length;
                const metAudio = node.requiredAudioClueIds.filter((id) =>
                  effectiveSave.discoveredAudioClueIds.includes(id),
                ).length;

                return (
                  <div
                    key={node.id}
                    className={`p-3 rounded border ${
                      solved
                        ? 'bg-surface-container-high border-secondary/40'
                        : ready
                          ? 'bg-surface-container border-primary/60'
                          : 'bg-surface-container-lowest border-outline-variant/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-label-sm text-[11px] text-on-surface font-bold uppercase">
                        {node.title}
                      </span>
                      <span
                        className={`font-label-sm text-[9px] px-1.5 py-0.5 rounded uppercase ${
                          solved
                            ? 'bg-secondary-container text-secondary-fixed'
                            : ready
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-surface-container text-outline'
                        }`}
                      >
                        {solved ? 'VERIFIED' : ready ? 'READY' : 'LOCKED'}
                      </span>
                    </div>

                    <p className="font-body-sm text-[11px] text-outline mt-1">
                      {node.premiseA} <span className="text-primary">↔</span> {node.premiseB}
                    </p>

                    {solved ? (
                      <p className="font-body-sm text-[11px] text-on-surface-variant mt-2 border-l-2 border-secondary pl-2">
                        {node.conclusion}
                      </p>
                    ) : (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="font-label-sm text-[9px] text-outline">
                          EXHIBITS {metEvidence}/{node.requiredEvidenceIds.length} · AUDIO {metAudio}/{node.requiredAudioClueIds.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSolveDeduction(node.id)}
                          disabled={!ready}
                          className={`px-2.5 py-1 rounded font-label-sm text-[10px] uppercase font-bold ${
                            ready
                              ? 'bg-primary-container hover:bg-inverse-primary text-on-primary-container cursor-pointer'
                              : 'bg-surface-container text-outline cursor-not-allowed'
                          }`}
                        >
                          LINK EVIDENCE &amp; SOLVE
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
