import test from 'node:test';
import assert from 'node:assert/strict';
import { computePreloadProgress, dedupeImageUrls } from './galleryPreloaderUtils';

test('dedupeImageUrls strips undefined/empty entries and preserves unique order', () => {
  const result = dedupeImageUrls([
    '/assets/hero.png',
    undefined,
    '',
    '   ',
    '/assets/poster.png',
    '/assets/hero.png',
  ]);
  assert.deepEqual(result, ['/assets/hero.png', '/assets/poster.png']);
});

test('computePreloadProgress reports bounded percentages and completion state', () => {
  assert.deepEqual(computePreloadProgress(0, 0), { percent: 100, isComplete: true });
  assert.deepEqual(computePreloadProgress(0, 4), { percent: 0, isComplete: false });
  assert.deepEqual(computePreloadProgress(2, 4), { percent: 50, isComplete: false });
  assert.deepEqual(computePreloadProgress(4, 4), { percent: 100, isComplete: true });
  assert.deepEqual(computePreloadProgress(7, 4), { percent: 100, isComplete: true });
  assert.deepEqual(computePreloadProgress(-2, 4), { percent: 0, isComplete: false });
});
