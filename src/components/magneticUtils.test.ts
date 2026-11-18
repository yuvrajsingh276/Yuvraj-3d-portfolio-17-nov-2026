import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMagneticOffset } from './magneticUtils';

const sampleRect = { left: 500, top: 12, width: 80, height: 40 };

test('computeMagneticOffset returns zero when cursor is centered over the link', () => {
  const offset = computeMagneticOffset(540, 32, sampleRect);
  assert.equal(offset.x, 0);
  assert.equal(offset.y, 0);
});

test('computeMagneticOffset moves text slightly toward cursor in all quadrants', () => {
  const bottomRight = computeMagneticOffset(555, 42, sampleRect, { strength: 0.4, maxX: 12, maxY: 8 });
  assert.ok(bottomRight.x > 0 && bottomRight.x < 12);
  assert.ok(bottomRight.y > 0 && bottomRight.y < 8);

  const topLeft = computeMagneticOffset(525, 22, sampleRect, { strength: 0.4, maxX: 12, maxY: 8 });
  assert.equal(topLeft.x, -bottomRight.x);
  assert.equal(topLeft.y, -bottomRight.y);
});

test('computeMagneticOffset clamps extreme offsets and respects reduced motion', () => {
  const extreme = computeMagneticOffset(900, -400, sampleRect, { strength: 0.5, maxX: 10, maxY: 6 });
  assert.deepEqual(extreme, { x: 10, y: -6 });

  const reduced = computeMagneticOffset(560, 44, sampleRect, { reducedMotion: true });
  assert.deepEqual(reduced, { x: 0, y: 0 });

  const invalidRect = computeMagneticOffset(560, 44, { left: 0, top: 0, width: 0, height: 40 });
  assert.deepEqual(invalidRect, { x: 0, y: 0 });
});
