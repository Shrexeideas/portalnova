import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialDuckAiState,
  DUCK_ANCHORS,
  isAnchorOutsideFov,
  stepDuckAI,
  type DuckAiSnapshot,
} from './duckAI';

test('isAnchorOutsideFov strictly rejects anchors inside the player forward cone', () => {
  const aheadAnchor = { x: 0, z: -12 };
  const behindAnchor = { x: 0, z: 12 };

  // Player at (0, 0) facing North (0, -1)
  assert.equal(isAnchorOutsideFov(0, 0, 0, -1, aheadAnchor), false);
  assert.equal(isAnchorOutsideFov(0, 0, 0, -1, behindAnchor), true);
});

test('Duck retreats from PEEKING to RELOCATING when player stares directly at it', () => {
  let snap: DuckAiSnapshot = {
    ...createInitialDuckAiState(),
    state: 'PEEKING',
    anchorId: 'caretaker-window',
    x: -24.4,
    z: -2.0,
    visible: true,
    cooldownTimer: 0,
    gazeHoldTimer: 0.45,
  };

  snap = stepDuckAI(snap, {
    dt: 0.12,
    elapsed: 18,
    playerX: -14,
    playerZ: -2,
    playerForwardX: -1,
    playerForwardZ: 0,
    isPlayerLookingAtDuck: true,
    flashlightOn: true,
    currentLocation: 'playground',
    evidenceCount: 3,
    paranoia: 35,
    forestGateUnlocked: false,
    forestClimaxActive: false,
  });

  assert.equal(snap.state, 'RELOCATING');
  assert.equal(snap.visible, false);
});

test('Duck relocates only to anchors outside the player field of view', () => {
  const snap = {
    ...createInitialDuckAiState(),
    state: 'HIDDEN' as const,
    anchorId: 'carousel-rim',
    visible: false,
    stateTimer: 6.0,
    cooldownTimer: 0,
  };

  const next = stepDuckAI(snap, {
    dt: 0.1,
    elapsed: 24,
    playerX: 0,
    playerZ: 8,
    playerForwardX: 0,
    playerForwardZ: -1,
    isPlayerLookingAtDuck: false,
    flashlightOn: true,
    currentLocation: 'playground',
    evidenceCount: 5,
    paranoia: 42,
    forestGateUnlocked: false,
    forestClimaxActive: false,
  });

  if (next.visible) {
    const chosen = DUCK_ANCHORS.find((a) => a.id === next.anchorId);
    assert.ok(chosen);
    assert.equal(isAnchorOutsideFov(0, 8, 0, -1, chosen, 0.35), true);
  }
});

test('Duck transitions to ENCOUNTER at Final Forest clearing when climax is active', () => {
  const snap = createInitialDuckAiState();
  const next = stepDuckAI(snap, {
    dt: 0.05,
    elapsed: 120,
    playerX: 0,
    playerZ: -46,
    playerForwardX: 0,
    playerForwardZ: -1,
    isPlayerLookingAtDuck: false,
    flashlightOn: true,
    currentLocation: 'forest',
    evidenceCount: 8,
    paranoia: 70,
    forestGateUnlocked: true,
    forestClimaxActive: true,
  });

  assert.equal(next.state, 'ENCOUNTER');
  assert.equal(next.anchorId, 'forest-clearing');
  assert.equal(next.interferenceEvent, 'whisper-cue');
  assert.equal(next.visible, true);
});
