import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applySettingsPatch,
  calculateHeartRateFromParanoia,
  canContinueSave,
  catalogEvidenceInSave,
  createDefaultSettings,
  createInitialHudState,
  createInitialSave,
  formatClockTime,
  formatCountdown,
  getBodyDatasetState,
  getHorrorLevelFromParanoia,
} from './gameRules';
import { LocalPersistenceRepository, StorageLike } from '../services/persistence';

function createMemoryStorage(): StorageLike {
  const store = new Map<string, string>();
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      store.set(k, v);
    },
    removeItem: (k) => {
      store.delete(k);
    },
  };
}

test('formatCountdown formats minutes and seconds cleanly with floor', () => {
  assert.equal(formatCountdown(300), '05:00');
  assert.equal(formatCountdown(65.9), '01:05');
  assert.equal(formatCountdown(-4), '00:00');
});

test('formatClockTime advances clock cleanly from 02:14:32', () => {
  assert.equal(formatClockTime(0), '02:14:32');
  assert.equal(formatClockTime(65), '02:15:37');
});

test('paranoia thresholds map to Stitch horror states and BPM', () => {
  assert.equal(getHorrorLevelFromParanoia(0), 'CALM');
  assert.equal(getHorrorLevelFromParanoia(25), 'UNEASY');
  assert.equal(getHorrorLevelFromParanoia(55), 'THREATENING');
  assert.equal(getHorrorLevelFromParanoia(88), 'CRITICAL');
  assert.ok(calculateHeartRateFromParanoia(88) > calculateHeartRateFromParanoia(15));
});

test('canContinueSave distinguishes pristine save from active progress', () => {
  assert.equal(canContinueSave(null), false);
  const fresh = createInitialSave('2026-11-15T00:00:00.000Z');
  assert.equal(canContinueSave(fresh), false);

  const progressed = catalogEvidenceInSave(fresh, 'clue-01-beak-shard', 280, 81, 26);
  assert.equal(canContinueSave(progressed), true);
  assert.deepEqual(progressed.discoveredEvidenceIds, ['clue-01-beak-shard']);
});

test('getBodyDatasetState maps Phase 2 screens to deterministic test states', () => {
  assert.equal(getBodyDatasetState('main-menu'), 'title');
  assert.equal(getBodyDatasetState('case-briefing'), 'briefing');
  assert.equal(getBodyDatasetState('gameplay-hud'), 'playing');
  assert.equal(getBodyDatasetState('pause-and-system'), 'paused');
  assert.equal(getBodyDatasetState('incident-outcome'), 'gameover');
});

test('applySettingsPatch clamps numeric settings safely', () => {
  const base = createDefaultSettings();
  const updated = applySettingsPatch(base, {
    masterVolume: 4,
    mouseSensitivity: 0.05,
    binauralAudio: false,
  });
  assert.equal(updated.masterVolume, 1);
  assert.equal(updated.mouseSensitivity, 0.3);
  assert.equal(updated.binauralAudio, false);
});

test('LocalPersistenceRepository persists save & settings and recovers from corrupt JSON', () => {
  const storage = createMemoryStorage();
  const repo = new LocalPersistenceRepository(storage);

  assert.equal(repo.loadSave(), null);
  const save = catalogEvidenceInSave(
    createInitialSave('2026-11-15T00:00:00.000Z'),
    'clue-02-cassette-04b',
    240,
    70,
    34,
  );
  repo.saveProgress(save);
  const reloaded = repo.loadSave();
  assert.ok(reloaded);
  assert.equal(reloaded.remainingSeconds, 240);
  assert.deepEqual(reloaded.discoveredEvidenceIds, ['clue-02-cassette-04b']);

  const unlocked = repo.unlockEnding('yellow-token');
  assert.deepEqual(unlocked.unlockedEndings, ['yellow-token']);

  repo.saveSettings({ ...createDefaultSettings(), crtScanlines: false });
  assert.equal(repo.loadSettings().crtScanlines, false);

  storage.setItem('dlatd.save.v1', '{bad-json');
  assert.equal(repo.loadSave(), null);

  const hud = createInitialHudState(reloaded);
  assert.equal(hud.horrorLevel, 'UNEASY');
  assert.equal(hud.remainingSeconds, 240);
});
