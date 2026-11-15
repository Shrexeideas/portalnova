import React from 'react';
import { useGame } from '../state/GameContext';

export const TransitionOverlay: React.FC = () => {
  const { isTransitioning } = useGame();

  return (
    <div
      aria-hidden={!isTransitioning}
      className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-150 bg-primary-container/25 flex items-center justify-center ${
        isTransitioning ? 'opacity-100' : 'opacity-0'
      }`}
      id="screen-glitch-overlay"
    >
      <div className="font-label-lg text-label-lg uppercase tracking-widest text-on-primary-container bg-surface-container-lowest/95 border border-primary/50 px-space-md py-space-sm shadow-2xl flex items-center gap-space-sm">
        <span className="w-2 h-2 rounded-full bg-primary animate-rec-blink" />
        <span>ROUTING NEURAL FEED...</span>
      </div>
    </div>
  );
};
