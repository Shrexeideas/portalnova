import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateDuckGaze,
  groundHeightAt,
  PLAYABLE_BOUNDS,
  PLAYER_RADIUS,
  resolvePlayerCollisions,
  stepSwingPendulum,
} from './worldMath';

test('groundHeightAt provides subtle puddle depression and keeps walkway level', () => {
  const centerPuddle = groundHeightAt(0.8, 0.8);
  const southWalkway = groundHeightAt(0, 14);
  const outerBerm = groundHeightAt(26, 26);

  assert.ok(centerPuddle < 0, 'center puddle should dip slightly below y=0');
  assert.ok(Math.abs(southWalkway) < 0.25, 'south walkway should remain gently graded');
  assert.ok(outerBerm > centerPuddle, 'outer treeline berm should rise above central basin');
});

test('resolvePlayerCollisions pushes player out of circular and box obstacles and stays inside bounds', () => {
  const circles = [{ id: 'tree-1', x: 5, z: 5, radius: 0.6 }];
  const boxes = [{ id: 'bench-1', minX: -4, maxX: -2, minZ: 4, maxZ: 5 }];

  const pushedCircle = resolvePlayerCollisions(5.1, 5.1, PLAYER_RADIUS, circles, boxes);
  const distToTree = Math.hypot(pushedCircle.x - 5, pushedCircle.z - 5);
  assert.ok(distToTree >= PLAYER_RADIUS + 0.6 - 1e-4);

  const pushedBox = resolvePlayerCollisions(-3, 4.5, PLAYER_RADIUS, circles, boxes);
  assert.ok(
    pushedBox.x <= -4 - PLAYER_RADIUS + 1e-4 ||
      pushedBox.x >= -2 + PLAYER_RADIUS - 1e-4 ||
      pushedBox.z <= 4 - PLAYER_RADIUS + 1e-4 ||
      pushedBox.z >= 5 + PLAYER_RADIUS - 1e-4,
  );

  const clampedBounds = resolvePlayerCollisions(99, -99, PLAYER_RADIUS, circles, boxes);
  assert.equal(clampedBounds.x, PLAYABLE_BOUNDS.maxX - PLAYER_RADIUS);
  assert.equal(clampedBounds.z, PLAYABLE_BOUNDS.minZ + PLAYER_RADIUS);
});

test('stepSwingPendulum oscillates and damps swing impulses cleanly', () => {
  let swing = { angle: 0.55, angularVelocity: 0 };
  for (let i = 0; i < 40; i++) {
    swing = stepSwingPendulum(swing, 0.03, i * 0.03);
  }
  assert.ok(Math.abs(swing.angle) <= 0.92);
  assert.notEqual(swing.angularVelocity, 0);
});

test('evaluateDuckGaze detects direct eye contact within range and ignores looking away', () => {
  const lookingAt = evaluateDuckGaze(
    { x: 0, y: 1.66, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 8, y: 1.66, z: 0 },
  );
  assert.equal(lookingAt.isLooking, true);

  const lookingAway = evaluateDuckGaze(
    { x: 0, y: 1.66, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 8, y: 1.66, z: 0 },
  );
  assert.equal(lookingAway.isLooking, false);
});
