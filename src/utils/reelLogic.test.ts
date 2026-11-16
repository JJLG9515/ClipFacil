import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTimecode,
  generateOfflineReel,
  getActiveSceneAtTime,
  getSceneCountForDuration,
  normalizeScenesToDuration,
  wrapSubtitleLines,
} from './reelLogic';

test('getSceneCountForDuration maps 15/30/60s to expected scene counts', () => {
  assert.equal(getSceneCountForDuration(15), 3);
  assert.equal(getSceneCountForDuration(30), 5);
  assert.equal(getSceneCountForDuration(60), 8);
});

test('normalizeScenesToDuration preserves exact total duration and contiguous timeline', () => {
  for (const dur of [15, 30, 60] as const) {
    const scenes = normalizeScenesToDuration(
      [
        { subtitle: 'Hook inicial', durationSec: 3 },
        { subtitle: 'Punto uno', durationSec: 5 },
        { subtitle: 'Cierre final', durationSec: 4 },
      ],
      dur,
      'Educativo',
    );
    assert.equal(scenes.length, getSceneCountForDuration(dur));
    const total = Number(
      scenes.reduce((sum, s) => sum + s.durationSec, 0).toFixed(2),
    );
    assert.equal(total, dur);
    assert.equal(scenes[0].startTime, 0);
    assert.equal(scenes[scenes.length - 1].endTime, dur);
  }
});

test('getActiveSceneAtTime finds matching scene and computes transition alpha', () => {
  const reel = generateOfflineReel('Curiosidades del espacio', 30, 'Educativo');
  const first = getActiveSceneAtTime(reel.scenes, 0.1);
  assert.ok(first);
  assert.equal(first.index, 0);
  assert.ok(first.transitionAlpha > 0 && first.transitionAlpha <= 1);

  const last = getActiveSceneAtTime(reel.scenes, 29.5);
  assert.ok(last);
  assert.equal(last.index, reel.scenes.length - 1);
  assert.equal(last.scene.role, 'cierre');
});

test('generateOfflineReel validates empty topic and builds structured Spanish script', () => {
  assert.throws(() => generateOfflineReel('   ', 15, 'Motivacional'));
  const reel = generateOfflineReel('Tips de productividad', 15, 'Motivacional');
  assert.equal(reel.source, 'offline');
  assert.equal(reel.scenes.length, 3);
  assert.ok(reel.hookText.length > 0);
  assert.ok(reel.closingText.length > 0);
  assert.ok(reel.hashtags.length >= 3);
});

test('wrapSubtitleLines wraps long phrases cleanly and formatTimecode pads zeros', () => {
  const lines = wrapSubtitleLines(
    'Construye el hábito en silencio y deja que el resultado hable',
    20,
  );
  assert.ok(lines.length >= 2 && lines.length <= 4);
  for (const line of lines) {
    assert.ok(line.length <= 24);
  }
  assert.equal(formatTimecode(0), '00:00');
  assert.equal(formatTimecode(15), '00:15');
  assert.equal(formatTimecode(65), '01:05');
});
