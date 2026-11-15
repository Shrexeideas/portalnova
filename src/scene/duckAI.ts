import { DuckAiState, LocationId } from '../types/game';

export interface DuckAnchor {
  id: string;
  locationId: LocationId;
  x: number;
  z: number;
  yaw: number;
  kind: 'window' | 'bush' | 'structure' | 'gate' | 'forest' | 'carousel';
}

export interface DuckAiSnapshot {
  state: DuckAiState;
  anchorId: string;
  x: number;
  z: number;
  yaw: number;
  visible: boolean;
  stateTimer: number;
  cooldownTimer: number;
  gazeHoldTimer: number;
  interferenceEvent: 'none' | 'swing-push' | 'lamp-flicker' | 'whisper-cue';
  encounterCount: number;
}

export interface StepDuckAiInput {
  dt: number;
  elapsed: number;
  playerX: number;
  playerZ: number;
  playerForwardX: number;
  playerForwardZ: number;
  isPlayerLookingAtDuck: boolean;
  flashlightOn: boolean;
  currentLocation: LocationId;
  evidenceCount: number;
  paranoia: number;
  forestGateUnlocked: boolean;
  forestClimaxActive: boolean;
}

export const DUCK_ANCHORS: DuckAnchor[] = [
  { id: 'carousel-rim', locationId: 'playground', x: 7.45, z: -5.55, yaw: -0.78, kind: 'carousel' },
  { id: 'seesaw-bush', locationId: 'playground', x: -13.6, z: 5.4, yaw: 0.95, kind: 'bush' },
  { id: 'slide-shadow', locationId: 'playground', x: -12.4, z: -11.2, yaw: 0.55, kind: 'structure' },
  { id: 'shed-corner', locationId: 'maintenance-shed', x: 11.4, z: -14.2, yaw: -2.2, kind: 'structure' },
  { id: 'caretaker-window', locationId: 'caretakers-house', x: -24.4, z: -2.0, yaw: 1.57, kind: 'window' },
  { id: 'drain-mouth', locationId: 'drainage-tunnels', x: 8.5, z: -20.2, yaw: 0.0, kind: 'structure' },
  { id: 'forest-gate-mist', locationId: 'playground', x: 1.9, z: -21.6, yaw: -0.25, kind: 'gate' },
  { id: 'forest-pine-east', locationId: 'forest', x: 3.6, z: -31.0, yaw: -0.85, kind: 'forest' },
  { id: 'forest-pine-west', locationId: 'forest', x: -3.4, z: -40.5, yaw: 0.72, kind: 'forest' },
  { id: 'forest-clearing', locationId: 'forest', x: 0.0, z: -52.2, yaw: 0.0, kind: 'forest' },
];

export function createInitialDuckAiState(): DuckAiSnapshot {
  const first = DUCK_ANCHORS[0];
  return {
    state: 'OBSERVING',
    anchorId: first.id,
    x: first.x,
    z: first.z,
    yaw: first.yaw,
    visible: true,
    stateTimer: 0,
    cooldownTimer: 3.5,
    gazeHoldTimer: 0,
    interferenceEvent: 'none',
    encounterCount: 0,
  };
}

export function isAnchorOutsideFov(
  playerX: number,
  playerZ: number,
  forwardX: number,
  forwardZ: number,
  anchor: { x: number; z: number },
  maxAllowedDot = 0.35,
): boolean {
  const dx = anchor.x - playerX;
  const dz = anchor.z - playerZ;
  const dist = Math.hypot(dx, dz);
  if (dist < 4.5) return false;
  const fLen = Math.hypot(forwardX, forwardZ) || 1;
  const dot = (dx / dist) * (forwardX / fLen) + (dz / dist) * (forwardZ / fLen);
  return dot < maxAllowedDot;
}

function selectConcealedAnchor(input: StepDuckAiInput, currentAnchorId: string): DuckAnchor | null {
  const candidates = DUCK_ANCHORS.filter((anchor) => {
    if (anchor.id === currentAnchorId) return false;
    if (input.currentLocation === 'forest') {
      if (anchor.locationId !== 'forest') return false;
    } else if (anchor.locationId === 'forest') {
      return false;
    } else if (anchor.id === 'forest-gate-mist' && input.forestGateUnlocked) {
      return false;
    }

    const dist = Math.hypot(anchor.x - input.playerX, anchor.z - input.playerZ);
    if (dist < 6.0 || dist > 29.0) return false;

    return isAnchorOutsideFov(
      input.playerX,
      input.playerZ,
      input.playerForwardX,
      input.playerForwardZ,
      anchor,
      0.32,
    );
  });

  if (candidates.length === 0) return null;

  // Deterministic pseudo-selection from elapsed time + evidence count
  const idx = Math.floor((input.elapsed * 13 + input.evidenceCount * 7) % candidates.length);
  return candidates[Math.abs(idx) % candidates.length];
}

export function stepDuckAI(prev: DuckAiSnapshot, input: StepDuckAiInput): DuckAiSnapshot {
  const dt = Math.min(0.15, Math.max(0.001, input.dt));
  let state = prev.state;
  let anchorId = prev.anchorId;
  let x = prev.x;
  let z = prev.z;
  let yaw = prev.yaw;
  let visible = prev.visible;
  let stateTimer = prev.stateTimer + dt;
  let cooldownTimer = Math.max(0, prev.cooldownTimer - dt);
  let gazeHoldTimer = prev.gazeHoldTimer;
  let interferenceEvent: DuckAiSnapshot['interferenceEvent'] = 'none';
  let encounterCount = prev.encounterCount;

  // Climax Forest Encounter locks onto the clearing manifestation calmly without erratic chases
  if (input.forestClimaxActive) {
    const clearing = DUCK_ANCHORS[DUCK_ANCHORS.length - 1];
    const targetYaw = Math.atan2(input.playerX - clearing.x, input.playerZ - clearing.z);
    return {
      state: 'ENCOUNTER',
      anchorId: clearing.id,
      x: clearing.x,
      z: clearing.z,
      yaw: targetYaw,
      visible: true,
      stateTimer: prev.state === 'ENCOUNTER' ? stateTimer : 0,
      cooldownTimer: 0,
      gazeHoldTimer: input.isPlayerLookingAtDuck ? gazeHoldTimer + dt : 0,
      interferenceEvent: prev.state !== 'ENCOUNTER' ? 'whisper-cue' : 'none',
      encounterCount: prev.state !== 'ENCOUNTER' ? encounterCount + 1 : encounterCount,
    };
  }

  // Track direct gaze reaction (peeking / observing retreats into shadow when caught)
  if (input.isPlayerLookingAtDuck && visible) {
    gazeHoldTimer += dt * (input.flashlightOn ? 1.35 : 1.0);
    if (
      (state === 'PEEKING' || state === 'FOLLOWING' || state === 'OBSERVING') &&
      gazeHoldTimer > 0.52 &&
      cooldownTimer <= 0
    ) {
      state = 'RELOCATING';
      stateTimer = 0;
      cooldownTimer = 4.2;
      gazeHoldTimer = 0;
      // Only vanish abruptly if far enough or peeking from cover; carousel statue stays grounded until relocating behind cover
      if (anchorId !== 'carousel-rim') {
        visible = false;
      }
    }
  } else {
    gazeHoldTimer = Math.max(0, gazeHoldTimer - dt * 1.4);
  }

  const distToPlayer = Math.hypot(x - input.playerX, z - input.playerZ);
  const escalation = Math.min(1, input.evidenceCount / 8 + input.paranoia / 200);

  switch (state) {
    case 'HIDDEN': {
      visible = false;
      if (stateTimer > Math.max(2.6, 5.5 - escalation * 2.4) && cooldownTimer <= 0) {
        const nextAnchor = selectConcealedAnchor(input, anchorId);
        if (nextAnchor) {
          anchorId = nextAnchor.id;
          x = nextAnchor.x;
          z = nextAnchor.z;
          yaw = Math.atan2(input.playerX - x, input.playerZ - z);
          visible = true;
          state = nextAnchor.kind === 'window' || nextAnchor.kind === 'bush' ? 'PEEKING' : 'OBSERVING';
          stateTimer = 0;
          cooldownTimer = 3.0;
        }
      }
      break;
    }

    case 'RELOCATING': {
      // Wait until player turns away before vanishing or sliding to new concealed anchor
      if (!input.isPlayerLookingAtDuck || stateTimer > 1.3) {
        const nextAnchor = selectConcealedAnchor(input, anchorId);
        if (nextAnchor) {
          anchorId = nextAnchor.id;
          x = nextAnchor.x;
          z = nextAnchor.z;
          yaw = Math.atan2(input.playerX - x, input.playerZ - z);
          visible = true;
          state = input.evidenceCount >= 4 && distToPlayer > 14 ? 'FOLLOWING' : 'PEEKING';
        } else {
          state = 'HIDDEN';
          visible = false;
        }
        stateTimer = 0;
        cooldownTimer = 3.5;
      }
      break;
    }

    case 'OBSERVING': {
      visible = true;
      if (!input.isPlayerLookingAtDuck) {
        yaw = Math.atan2(input.playerX - x, input.playerZ - z);
      }
      if (stateTimer > 6.5 && !input.isPlayerLookingAtDuck && cooldownTimer <= 0) {
        if (input.evidenceCount >= 2 && (Math.floor(input.elapsed) % 2 === 0)) {
          state = 'INTERFERING';
          interferenceEvent = input.paranoia > 45 ? 'lamp-flicker' : 'swing-push';
        } else {
          state = 'RELOCATING';
        }
        stateTimer = 0;
        cooldownTimer = 4.5;
      }
      break;
    }

    case 'PEEKING': {
      visible = true;
      if (!input.isPlayerLookingAtDuck) {
        yaw = Math.atan2(input.playerX - x, input.playerZ - z);
      }
      if (stateTimer > 5.0 && !input.isPlayerLookingAtDuck) {
        state = input.evidenceCount >= 5 ? 'FOLLOWING' : 'HIDDEN';
        visible = state !== 'HIDDEN';
        stateTimer = 0;
        cooldownTimer = 3.0;
      }
      break;
    }

    case 'FOLLOWING': {
      visible = true;
      // Gently edge closer ONLY while outside direct look & never closer than 6.5m
      if (!input.isPlayerLookingAtDuck && distToPlayer > 7.5) {
        const dirX = (input.playerX - x) / distToPlayer;
        const dirZ = (input.playerZ - z) / distToPlayer;
        const step = (0.38 + escalation * 0.25) * dt;
        x += dirX * step;
        z += dirZ * step;
        yaw = Math.atan2(dirX, dirZ);
      }
      if (distToPlayer <= 8.2 && input.evidenceCount >= 6) {
        state = 'APPROACHING';
        stateTimer = 0;
        interferenceEvent = 'whisper-cue';
      } else if (stateTimer > 7.5 && !input.isPlayerLookingAtDuck) {
        state = 'INTERFERING';
        interferenceEvent = 'swing-push';
        stateTimer = 0;
      }
      break;
    }

    case 'INTERFERING': {
      visible = true;
      if (stateTimer > 1.8) {
        state = 'RELOCATING';
        stateTimer = 0;
        cooldownTimer = 4.0;
      }
      break;
    }

    case 'APPROACHING': {
      visible = true;
      if (!input.isPlayerLookingAtDuck && distToPlayer > 6.2) {
        const dirX = (input.playerX - x) / distToPlayer;
        const dirZ = (input.playerZ - z) / distToPlayer;
        x += dirX * 0.48 * dt;
        z += dirZ * 0.48 * dt;
        yaw = Math.atan2(dirX, dirZ);
      }
      if (stateTimer > 5.2) {
        state = 'HIDDEN';
        visible = false;
        stateTimer = 0;
        cooldownTimer = 5.0;
        encounterCount += 1;
      }
      break;
    }

    case 'ENCOUNTER': {
      visible = true;
      yaw = Math.atan2(input.playerX - x, input.playerZ - z);
      break;
    }
  }

  return {
    state,
    anchorId,
    x,
    z,
    yaw,
    visible,
    stateTimer,
    cooldownTimer,
    gazeHoldTimer,
    interferenceEvent,
    encounterCount,
  };
}
