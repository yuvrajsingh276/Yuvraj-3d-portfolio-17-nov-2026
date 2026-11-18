import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCursorState, parseBorderRadiusPx } from './cursorUtils';

test('computeCursorState returns circular free-tracking cursor when no target is hovered', () => {
  const idle = computeCursorState(420, 280, null);
  assert.deepEqual(idle, {
    ringX: 420,
    ringY: 280,
    dotX: 420,
    dotY: 280,
    width: 34,
    height: 34,
    borderRadius: 17,
    isMagnetic: false,
    targetKind: 'default',
    ringScale: 1,
  });

  const pressed = computeCursorState(420, 280, null, { isPressed: true });
  assert.equal(pressed.ringScale, 0.85);
});

test('computeCursorState morphs and magnetically pulls toward compact nav links and buttons', () => {
  const navRect = { left: 500, top: 12, width: 70, height: 40, borderRadius: 8 };
  // Element center is (535, 32); pointer is offset (+15, +10)
  const state = computeCursorState(550, 42, navRect);

  assert.equal(state.isMagnetic, true);
  assert.equal(state.targetKind, 'compact');
  assert.equal(state.width, 84);
  assert.equal(state.height, 48);
  assert.equal(state.borderRadius, 12);
  // Magnetic ring center stays closer to element center (535, 32) than pointer (550, 42)
  assert.ok(state.ringX > 535 && state.ringX < 540);
  assert.ok(state.ringY > 32 && state.ringY < 36);
  // Core dot tracks tighter than ring
  assert.ok(state.dotX > state.ringX && state.dotX < 550);
});

test('computeCursorState expands into a circular reticle with gentle pull on large gallery cards', () => {
  const cardRect = { left: 200, top: 300, width: 310, height: 450, borderRadius: 12 };
  const state = computeCursorState(260, 380, cardRect);

  assert.equal(state.isMagnetic, true);
  assert.equal(state.targetKind, 'card');
  assert.equal(state.width, 54);
  assert.equal(state.height, 54);
  assert.equal(state.borderRadius, 27);
  // Pulled gently toward card center (355, 525) from (260, 380)
  assert.ok(state.ringX > 260 && state.ringX < 355);
  assert.ok(state.ringY > 380 && state.ringY < 525);
});

test('computeCursorState disables magnetic pull under reducedMotion and parses border radii', () => {
  const navRect = { left: 500, top: 12, width: 70, height: 40, borderRadius: 8 };
  const reduced = computeCursorState(550, 42, navRect, { reducedMotion: true });
  assert.equal(reduced.isMagnetic, false);
  assert.equal(reduced.ringX, 550);
  assert.equal(reduced.ringY, 42);

  assert.equal(parseBorderRadiusPx('12px'), 12);
  assert.equal(parseBorderRadiusPx('9999px'), 9999);
  assert.equal(parseBorderRadiusPx('50%', 10), 10);
});
