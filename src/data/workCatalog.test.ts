import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  projects,
  getProjectById,
  getMediaGridClasses,
  SIDEBAR_CATEGORY_TARGETS,
  filterWorkProjects,
  WORK_NAV_CATEGORIES,
  collectGalleryPreloadKeys,
} from './workCatalog';

test('Vitanic is the 1st work and Pulse 360 is the 2nd work', () => {
  assert.equal(projects[0].id, '01');
  assert.match(projects[0].title, /Vitanic/i);
  assert.equal(projects[1].id, '02');
  assert.match(projects[1].title, /Pulse 360/i);
});

test('Vitanic and Pulse 360 include all uploaded images and videos without raw filenames in captions', () => {
  const vitanic = getProjectById('01');
  const pulse = getProjectById('02');

  assert.equal(vitanic.media.length, 14);
  assert.equal(
    vitanic.media.filter((item) => item.kind === 'video').length,
    2
  );
  assert.equal(pulse.media.length, 20);

  for (const project of [vitanic, pulse]) {
    assert.ok(project.cardCoverKey, `${project.title} needs a card cover`);
    assert.ok(project.heroCoverKey, `${project.title} needs a hero cover`);
    const ids = new Set<string>();
    const assetKeys = new Set<string>();
    for (const item of project.media) {
      assert.ok(!ids.has(item.id), `Duplicate media id: ${item.id}`);
      assert.ok(!assetKeys.has(item.assetKey), `Duplicate asset key: ${item.assetKey}`);
      ids.add(item.id);
      assetKeys.add(item.assetKey);
      assert.ok(!/magnific_/i.test(item.caption), `Raw filename leaked: ${item.caption}`);
    }
  }
});

test('every asset key in workCatalog is mapped in workAssets.ts', () => {
  const assetsSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/data/workAssets.ts'),
    'utf8'
  );

  for (const project of projects) {
    const keys = [
      project.logoKey,
      project.cardCoverKey,
      project.heroCoverKey,
      project.workSectionHeroKey,
      ...project.media.map((m) => m.assetKey),
    ].filter((k): k is string => Boolean(k));

    for (const key of keys) {
      assert.ok(
        assetsSource.includes(`'${key}':`),
        `Missing asset key '${key}' in src/data/workAssets.ts`
      );
    }
  }
});

test('grid span helpers, category filters, preload keys, and sidebar targets return valid results', () => {
  assert.match(getMediaGridClasses('panoramic').wrapper, /lg:col-span-12/);
  assert.match(getMediaGridClasses('landscape').wrapper, /lg:col-span-6/);
  assert.match(getMediaGridClasses('portrait').wrapper, /lg:col-span-4/);
  assert.equal(SIDEBAR_CATEGORY_TARGETS['3D / CGI'], 0);
  assert.equal(SIDEBAR_CATEGORY_TARGETS.BRANDING, 1);

  assert.equal(WORK_NAV_CATEGORIES.length, 4);
  assert.equal(filterWorkProjects('ALL WORK').length, projects.length);
  assert.ok(filterWorkProjects('3D / CGI').some((p) => p.id === '01'));
  assert.ok(filterWorkProjects('BRANDING').some((p) => p.id === '02'));
  assert.equal(filterWorkProjects('ALL WORK', 'vitanic')[0].id, '01');
  assert.equal(filterWorkProjects('ALL WORK', 'pulse')[0].id, '02');

  const preloadKeys = collectGalleryPreloadKeys(projects);
  assert.equal(new Set(preloadKeys).size, preloadKeys.length);
  assert.ok(preloadKeys.includes('vitanic-floating-citrus'));
  assert.ok(preloadKeys.includes('vitanic-lightning-poster'));
  assert.ok(preloadKeys.includes('pulse-conference-stage'));
  assert.ok(preloadKeys.includes('pulse-vertical-poster'));
});
