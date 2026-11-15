import React from 'react';
import { SurveillanceFooter } from './components/SurveillanceFooter';
import { SurveillanceHeader } from './components/SurveillanceHeader';
import { TransitionOverlay } from './components/TransitionOverlay';
import { CaseBriefingScreen } from './screens/CaseBriefingScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { GameplayScreen } from './screens/GameplayScreen';
import { InvestigationNotebookScreen } from './screens/InvestigationNotebookScreen';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { OutcomeArchiveScreen } from './screens/OutcomeArchiveScreen';
import { PauseSettingsScreen } from './screens/PauseSettingsScreen';
import { GameProvider, useGame } from './state/GameContext';

const AppShell: React.FC = () => {
  const { currentScreen, settings } = useGame();
  const isGameplay = currentScreen === 'gameplay-hud';

  return (
    <div className="min-h-screen bg-surface text-on-surface relative">
      {/* CRT Scanlines & Surveillance Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]"
      />
      {settings.crtScanlines && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40 opacity-15 crt-scanlines"
        />
      )}

      {!isGameplay && <SurveillanceHeader />}

      <main
        className={
          isGameplay
            ? 'w-full min-h-screen'
            : 'w-full pt-16 bg-surface min-h-[calc(100vh-4rem)]'
        }
      >
        {currentScreen === 'main-menu' && <MainMenuScreen />}
        {currentScreen === 'case-briefing' && <CaseBriefingScreen />}
        {currentScreen === 'gameplay-hud' && <GameplayScreen />}
        {currentScreen === 'investigation-notebook' && <InvestigationNotebookScreen />}
        {currentScreen === 'pause-and-system' && <PauseSettingsScreen />}
        {(currentScreen === 'chapter-archive' || currentScreen === 'incident-outcome') && (
          <OutcomeArchiveScreen />
        )}
        {currentScreen === 'game-over' && <GameOverScreen />}
      </main>

      {!isGameplay && <SurveillanceFooter />}

      <TransitionOverlay />
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  );
}
