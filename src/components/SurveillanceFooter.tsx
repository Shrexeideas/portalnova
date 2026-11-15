import React from 'react';
import { CASE_METADATA } from '../data/caseData';

export const SurveillanceFooter: React.FC = () => {
  return (
    <footer className="w-full bg-surface-container-lowest/95 border-t border-outline-variant/25 shadow-[0_1px_8px_rgba(0,0,0,0.5)] py-space-md">
      <div className="w-full px-gutter-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm font-label-sm text-label-sm text-outline">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-rec-blink" />
          <span>SURVEILLANCE NODE: {CASE_METADATA.nodeId}</span>
          <span>//</span>
          <span>TERMINAL AUTH: {CASE_METADATA.terminalAuth}</span>
        </div>
        <div className="font-label-sm text-label-sm text-on-surface-variant text-center">
          © 1989 FEDERAL BEHAVIORAL ANOMALY REPOSITORY. UNAUTHORIZED DISCLOSURE IS PUNISHABLE BY PERMANENT QUARANTINE.
        </div>
        <div className="font-label-sm text-label-sm text-primary tracking-widest uppercase">
          DO NOT MAINTAIN DIRECT EYE CONTACT
        </div>
      </div>
    </footer>
  );
};
