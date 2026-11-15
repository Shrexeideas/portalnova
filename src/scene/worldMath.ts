import { LocationId } from '../types/game';

export interface CircleCollider {
  id: string;
  x: number;
  z: number;
  radius: number;
}

export interface BoxCollider {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  disabled?: boolean;
}

export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface SwingPendulumState {
  angle: number;
  angularVelocity: number;
}

export const PLAYABLE_BOUNDS: WorldBounds = {
  minX: -19.5,
  maxX: 19.5,
  minZ: -19.5,
  maxZ: 19.5,
};

export const EXPANDED_WORLD_BOUNDS: WorldBounds = {
  minX: -33.5,
  maxX: 19.5,
  minZ: -56.0,
  maxZ: 19.5,
};

export const PLAYER_EYE_HEIGHT = 1.66;
export const PLAYER_RADIUS = 0.42;

/**
 * Deterministic terrain elevation at world (x, z).
 * Keeps central playground, Caretaker's House pad, Drainage culvert floor, and
 * Final Forest trail cleanly graded so every prop sits flush on ground.
 */
export function groundHeightAt(x: number, z: number): number {
  // West Caretaker's House pad (x < -19.5, z in [-9, 5])
  if (x < -19.5 && z > -10 && z < 6) {
    const t = Math.min(1, (-19.5 - x) / 6);
    return t * 0.14;
  }

  // NE Drainage Tunnels sunken floor (x in [5.5, 11.5], z < -19.5)
  if (x > 5.5 && x < 11.5 && z < -19.0 && z > -34.0) {
    const depthFactor = Math.min(1, (-19.0 - z) / 5.5);
    return -0.35 * depthFactor;
  }

  // Final Forest winding trail (z < -20, x < 5.5)
  if (z < -19.5 && x < 5.5) {
    const deep = Math.min(1, (-19.5 - z) / 30);
    return Math.sin(x * 0.25) * 0.08 + deep * 0.18;
  }

  const distFromCenter = Math.hypot(x, z + 1);
  // Subtle drainage depression near center puddle (x ~ 0.8, z ~ 0.8)
  const puddleDist = Math.hypot(x - 0.8, z - 0.8);
  const puddleDip = puddleDist < 3.4 ? -0.075 * Math.cos((puddleDist / 3.4) * (Math.PI / 2)) : 0;

  // Keep central play pad and entrance walkway nearly level for clean footing
  const padMask = Math.max(0, Math.min(1, (distFromCenter - 11.5) / 10));
  const rollingUndulation =
    (Math.sin(x * 0.14) * Math.cos(z * 0.12) * 0.34 +
      Math.sin((x + z) * 0.08) * 0.22) *
    padMask;

  // Gentle outer rise beyond perimeter fence
  const outerBerm = Math.max(0, distFromCenter - 21) * 0.045;

  return puddleDip + rollingUndulation + outerBerm;
}

export function detectLocationFromCoords(x: number, z: number): LocationId {
  if (x < -20.0) return 'caretakers-house';
  if (x > 5.5 && z < -19.5) return 'drainage-tunnels';
  if (z < -20.2 && x <= 5.5) return 'forest';
  if (x > 10.5 && z < -11.5) return 'maintenance-shed';
  return 'playground';
}

/**
 * Resolves player horizontal (x, z) against circular obstacles, active box obstacles,
 * and outer world bounds.
 */
export function resolvePlayerCollisions(
  x: number,
  z: number,
  playerRadius: number,
  circles: readonly CircleCollider[],
  boxes: readonly BoxCollider[],
  bounds: WorldBounds = PLAYABLE_BOUNDS,
): { x: number; z: number } {
  let px = Math.max(bounds.minX + playerRadius, Math.min(bounds.maxX - playerRadius, x));
  let pz = Math.max(bounds.minZ + playerRadius, Math.min(bounds.maxZ - playerRadius, z));

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < circles.length; i++) {
      const c = circles[i];
      const dx = px - c.x;
      const dz = pz - c.z;
      const minDist = playerRadius + c.radius;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        if (dist > 1e-5) {
          const push = minDist - dist;
          px += (dx / dist) * push;
          pz += (dz / dist) * push;
        } else {
          pz += minDist;
        }
      }
    }

    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (b.disabled) continue;
      const closestX = Math.max(b.minX, Math.min(b.maxX, px));
      const closestZ = Math.max(b.minZ, Math.min(b.maxZ, pz));
      const dx = px - closestX;
      const dz = pz - closestZ;
      const distSq = dx * dx + dz * dz;
      if (distSq < playerRadius * playerRadius) {
        const dist = Math.sqrt(distSq);
        if (dist > 1e-5) {
          const push = playerRadius - dist;
          px += (dx / dist) * push;
          pz += (dz / dist) * push;
        } else {
          const left = px - b.minX;
          const right = b.maxX - px;
          const top = pz - b.minZ;
          const bottom = b.maxZ - pz;
          const minEdge = Math.min(left, right, top, bottom);
          if (minEdge === left) px = b.minX - playerRadius;
          else if (minEdge === right) px = b.maxX + playerRadius;
          else if (minEdge === top) pz = b.minZ - playerRadius;
          else pz = b.maxZ + playerRadius;
        }
      }
    }

    px = Math.max(bounds.minX + playerRadius, Math.min(bounds.maxX - playerRadius, px));
    pz = Math.max(bounds.minZ + playerRadius, Math.min(bounds.maxZ - playerRadius, pz));
  }

  return { x: px, z: pz };
}

export function stepSwingPendulum(
  state: SwingPendulumState,
  dt: number,
  elapsedTime: number,
  phaseOffset = 0,
  chainLength = 2.65,
  damping = 0.34,
): SwingPendulumState {
  const safeDt = Math.min(0.05, Math.max(0, dt));
  const gravity = 9.81;
  const windTorque =
    Math.sin(elapsedTime * 1.15 + phaseOffset) * 0.045 +
    Math.sin(elapsedTime * 2.7 + phaseOffset * 1.7) * 0.015;
  const angularAccel = -(gravity / chainLength) * Math.sin(state.angle) - damping * state.angularVelocity + windTorque;

  const nextVel = state.angularVelocity + angularAccel * safeDt;
  const nextAngle = Math.max(-0.92, Math.min(0.92, state.angle + nextVel * safeDt));

  return {
    angle: nextAngle,
    angularVelocity: nextVel,
  };
}

export function evaluateDuckGaze(
  cameraPos: { x: number; y: number; z: number },
  cameraForward: { x: number; y: number; z: number },
  duckPos: { x: number; y: number; z: number },
  maxDistance = 18,
  cosThreshold = 0.94,
): { isLooking: boolean; distance: number; alignment: number } {
  const dx = duckPos.x - cameraPos.x;
  const dy = duckPos.y - cameraPos.y;
  const dz = duckPos.z - cameraPos.z;
  const distance = Math.hypot(dx, dy, dz);
  if (distance < 0.001 || distance > maxDistance) {
    return { isLooking: false, distance, alignment: 0 };
  }
  const fLen = Math.hypot(cameraForward.x, cameraForward.y, cameraForward.z) || 1;
  const alignment =
    (dx / distance) * (cameraForward.x / fLen) +
    (dy / distance) * (cameraForward.y / fLen) +
    (dz / distance) * (cameraForward.z / fLen);

  return {
    isLooking: alignment >= cosThreshold,
    distance,
    alignment,
  };
}
