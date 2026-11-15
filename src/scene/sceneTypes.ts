import * as THREE from 'three';
import { LocationId } from '../types/game';

export interface InteractableTarget {
  id: string;
  evidenceId?: string;
  keyLabel: string;
  verb: string;
  label: string;
  detail?: string;
  worldPosition: THREE.Vector3;
  maxDistance: number;
  raycastMeshes: THREE.Object3D[];
  onInteract?: () => void;
}

export interface EngineCallbacks {
  onEvidenceDiscovered: (evidenceId: string) => void;
  onEnvironmentalInspect: (targetId: string, subtitle: string, message: string) => void;
  onPromptChange: (prompt: {
    targetId: string;
    keyLabel: string;
    verb: string;
    label: string;
    detail?: string;
  } | null) => void;
  onGazeUpdate: (isLookingAtDuck: boolean, deltaSeconds: number) => void;
  onLocationChange?: (location: LocationId) => void;
  onForestClimaxReached?: () => void;
  onGateBlockedInspect?: () => void;
}

export interface EngineSettingsSnapshot {
  flashlightOn: boolean;
  mouseSensitivity: number;
  invertY: boolean;
  reducedMotion: boolean;
}
