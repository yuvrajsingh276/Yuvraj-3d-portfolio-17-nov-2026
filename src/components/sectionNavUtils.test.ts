import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOLDEN_RATIO,
  GOLDEN_TYPE_SCALE,
  PAGE_SECTIONS,
  SECTION_THEMES,
  resolveActiveSection,
} from './sectionNavUtils';

const vh = 900;

test('PAGE_SECTIONS lists all five sections in scroll order with distinct colors', () => {
  assert.deepEqual(
    PAGE_SECTIONS.map((s) => s.id),
    ['home', 'video', 'work', 'experience', 'about']
  );

  const uniqueAccents = new Set(PAGE_SECTIONS.map((s) => s.accentHex));
  const uniqueBackgrounds = new Set(PAGE_SECTIONS.map((s) => s.surfaceBg));
  assert.equal(uniqueAccents.size, 5, 'Every section must have a distinct accent color');
  assert.equal(uniqueBackgrounds.size, 5, 'Every section must have a distinct background surface color');
  assert.equal(SECTION_THEMES.work.accentHex, '#38bdf8');
});

test('GOLDEN_TYPE_SCALE follows phi = 1.618 progression across every tier', () => {
  assert.ok(Math.abs(GOLDEN_TYPE_SCALE.titleMd / GOLDEN_TYPE_SCALE.body - GOLDEN_RATIO) < 0.01);
  assert.ok(Math.abs(GOLDEN_TYPE_SCALE.titleLg / GOLDEN_TYPE_SCALE.titleMd - GOLDEN_RATIO) < 0.01);
  assert.ok(Math.abs(GOLDEN_TYPE_SCALE.displayXl / GOLDEN_TYPE_SCALE.titleLg - GOLDEN_RATIO) < 0.01);
  assert.ok(Math.abs(GOLDEN_TYPE_SCALE.display2Xl / GOLDEN_TYPE_SCALE.displayXl - GOLDEN_RATIO) < 0.01);
  assert.ok(Math.abs(GOLDEN_TYPE_SCALE.body / GOLDEN_TYPE_SCALE.micro - GOLDEN_RATIO) < 0.01);
  assert.ok(Math.abs(GOLDEN_TYPE_SCALE.bodyLeading - GOLDEN_RATIO) < 0.01);
});

test('resolveActiveSection transitions cleanly across home, video, work, experience, and about', () => {
  assert.equal(
    resolveActiveSection({ videoTop: 900, workTop: 2070, experienceTop: 3240, aboutTop: 5940 }, vh),
    'home'
  );

  assert.equal(
    resolveActiveSection({ videoTop: 300, workTop: 1470, experienceTop: 2640, aboutTop: 5340 }, vh),
    'video'
  );

  assert.equal(
    resolveActiveSection({ videoTop: 0, workTop: 350, experienceTop: 1520, aboutTop: 4220 }, vh),
    'work'
  );

  assert.equal(
    resolveActiveSection({ videoTop: 0, workTop: 0, experienceTop: 280, aboutTop: 2980 }, vh),
    'experience'
  );

  assert.equal(
    resolveActiveSection({ videoTop: 0, workTop: 0, experienceTop: 0, aboutTop: 450 }, vh),
    'about'
  );
});
