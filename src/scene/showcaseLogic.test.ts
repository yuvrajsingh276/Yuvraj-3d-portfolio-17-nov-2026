import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOOLS_CATALOG,
  LIGHTING_PRESETS,
  computeOrbitalLayout,
  computeMinPairwiseDistance,
  computeResponsiveCameraDistance,
  dampValue,
  stepHoverKinematics,
  computeCameraFocusTarget,
  computeAmbientBreathing,
  computeHorizontalWaveLayout,
  computeHorizontalWavePoint,
  sampleYellowRedOrangeBlueGradient,
  computeIndividualScatterImpulse,
  computeBloomConfig,
  computeMagneticSnapAngle,
  stepMagneticRotation,
  computeUniformScreenScaleFactor,
  createIdleScatterState,
  triggerScatterState,
  stepIconScatterState,
  computeDofConfig,
  DECORATIVE_PROP_NODES,
  computeDecorativePropsLayout,
} from './showcaseLogic';

test('catalog contains all required core creative and AI tools with unique IDs and GLB node names', () => {
  const ids = new Set(TOOLS_CATALOG.map((t) => t.id));
  const glbNodes = new Set(TOOLS_CATALOG.map((t) => t.glbNodeName));
  assert.equal(ids.size, TOOLS_CATALOG.length);
  assert.equal(glbNodes.size, TOOLS_CATALOG.length);
  for (const required of [
    'after-effects',
    'premiere',
    'photoshop',
    'gemini',
    'figma',
    'claude',
    'chatgpt',
    'blender',
    'dreamweaver',
    'illustrator',
  ]) {
    assert.ok(ids.has(required), `Missing required tool: ${required}`);
  }
});

test('orbital layout maintains safe non-overlapping 3D separation across every snapped angle on desktop and mobile', () => {
  for (let snapStep = 0; snapStep < 10; snapStep++) {
    const angleOffset = snapStep * 36;
    const desktopSlots = computeOrbitalLayout(TOOLS_CATALOG, 1.6, angleOffset);
    const desktopMinDist = computeMinPairwiseDistance(desktopSlots);
    assert.ok(
      desktopMinDist >= 2.15,
      `Expected desktop minimum separation >= 2.15 at ${angleOffset}deg, got ${desktopMinDist.toFixed(2)}`
    );

    const mobileSlots = computeOrbitalLayout(TOOLS_CATALOG, 0.46, angleOffset);
    const mobileMinDist = computeMinPairwiseDistance(mobileSlots);
    assert.ok(
      mobileMinDist >= 2.0,
      `Expected mobile minimum separation >= 2.0 at ${angleOffset}deg, got ${mobileMinDist.toFixed(2)}`
    );
  }
});

test('orbital layout uses varied Z depths across foreground, midground, and background', () => {
  const slots = computeOrbitalLayout(TOOLS_CATALOG, 1.6);
  const zValues = slots.map((s) => s.position[2]);
  const zSpread = Math.max(...zValues) - Math.min(...zValues);
  assert.ok(zSpread >= 8.0, `Expected wide Z-axis depth spread >= 8.0, got ${zSpread.toFixed(2)}`);
});

test('responsive camera distance pulls back smoothly on narrow mobile screens', () => {
  const desktopDist = computeResponsiveCameraDistance(1.6);
  const tabletDist = computeResponsiveCameraDistance(0.95);
  const mobileDist = computeResponsiveCameraDistance(0.46);
  assert.ok(mobileDist > tabletDist && tabletDist > desktopDist);
});

test('hover kinematics smoothly advances forward on Z, scales up, and returns to rest', () => {
  let state = { zPull: 0, scale: 1.0, glowBoost: 0 };
  for (let i = 0; i < 60; i++) {
    state = stepHoverKinematics(state, true, false, 1 / 60);
  }
  assert.ok(state.zPull > 0.74 && state.zPull <= 0.79);
  assert.ok(state.scale > 1.12 && state.scale <= 1.15);
  assert.ok(state.glowBoost > 0.8);

  for (let i = 0; i < 120; i++) {
    state = stepHoverKinematics(state, false, false, 1 / 60);
  }
  assert.ok(Math.abs(state.zPull) < 0.01);
  assert.ok(Math.abs(state.scale - 1.0) < 0.01);
  assert.ok(state.glowBoost < 0.01);
});

test('dampValue converges monotonically without overshooting', () => {
  const next = dampValue(0, 10, 8, 0.016);
  assert.ok(next > 0 && next < 10);
});

test('camera focus target places camera in front of the selected tool for clear framing', () => {
  const target: [number, number, number] = [4.0, 1.0, 2.0];
  const focus = computeCameraFocusTarget(target, 1.6);
  assert.deepEqual(focus.lookAt, target);
  assert.ok(focus.cameraPos[2] > target[2]);
});

test('lighting presets provide all three studio moods', () => {
  assert.ok(LIGHTING_PRESETS.obsidian && LIGHTING_PRESETS.aurora && LIGHTING_PRESETS.amber);
});

test('all icons surround the mid-center safe zone without overlapping center text', () => {
  for (const aspect of [1.6, 0.46]) {
    const slots = computeOrbitalLayout(TOOLS_CATALOG, aspect);
    for (const slot of slots) {
      const [x, y] = slot.position;
      const xyDistFromCenter = Math.hypot(x, y - 0.15);
      assert.ok(
        xyDistFromCenter >= 2.2,
        `Icon ${slot.id} too close to center text at aspect ${aspect}: dist=${xyDistFromCenter.toFixed(2)}`
      );
    }
  }
});

test('ambient rim breathing stays subtle around preset baseline and settles to baseline at zero amplitude', () => {
  const preset = LIGHTING_PRESETS.obsidian;
  const zeroSample = computeAmbientBreathing(2.0, preset, 0);
  assert.equal(zeroSample.rimIntensity, preset.rimIntensity);
  assert.equal(zeroSample.hemiIntensity, preset.hemiIntensity);

  let minRim = Infinity;
  let maxRim = -Infinity;
  for (let i = 0; i <= 100; i++) {
    const sample = computeAmbientBreathing(i * 0.12, preset, 1.0);
    minRim = Math.min(minRim, sample.rimIntensity);
    maxRim = Math.max(maxRim, sample.rimIntensity);
    assert.ok(
      sample.hemiFactor >= 0.9 && sample.hemiFactor <= 1.1,
      `Expected subtle hemi breathing within +/-10%, got ${sample.hemiFactor.toFixed(3)}`
    );
  }
  assert.ok(minRim < preset.rimIntensity && maxRim > preset.rimIntensity);
  assert.ok(
    minRim >= preset.rimIntensity * 0.82 && maxRim <= preset.rimIntensity * 1.18,
    `Expected subtle rim breathing within +/-18%, got [${minRim.toFixed(2)}, ${maxRim.toFixed(2)}]`
  );
});

test('horizontal wave gradient cycles seamlessly across yellow, red, orange, and blue', () => {
  const cYellow = sampleYellowRedOrangeBlueGradient(0);
  const cRed = sampleYellowRedOrangeBlueGradient(0.25);
  const cOrange = sampleYellowRedOrangeBlueGradient(0.5);
  const cBlue = sampleYellowRedOrangeBlueGradient(0.75);
  const cWrap = sampleYellowRedOrangeBlueGradient(1.0);

  assert.ok(cYellow[0] > 0.9 && cYellow[1] > 0.75, 'Expected bright yellow at t=0');
  assert.ok(cRed[0] > 0.9 && cRed[1] < 0.3, 'Expected red at t=0.25');
  assert.ok(cOrange[0] > 0.9 && cOrange[1] > 0.4 && cOrange[1] < 0.65, 'Expected orange at t=0.5');
  assert.ok(cBlue[2] > 0.9 && cBlue[0] < 0.3, 'Expected blue at t=0.75');
  assert.deepEqual(cYellow, cWrap);
});

test('horizontal particle wave spans horizontally across X and Z and undulates smoothly over time', () => {
  const desktop = computeHorizontalWaveLayout(1.6);
  const mobile = computeHorizontalWaveLayout(0.46);
  assert.ok(desktop.rowCount >= 10 && desktop.colsPerRow >= 60);
  assert.ok(mobile.floorY < desktop.floorY);

  const left = computeHorizontalWavePoint(
    0,
    desktop.rowCount,
    0,
    0,
    desktop.floorY,
    desktop.xHalfSpan,
    desktop.zStart,
    desktop.zEnd
  );
  const right = computeHorizontalWavePoint(
    0,
    desktop.rowCount,
    1,
    0,
    desktop.floorY,
    desktop.xHalfSpan,
    desktop.zStart,
    desktop.zEnd
  );
  const shifted = computeHorizontalWavePoint(
    0,
    desktop.rowCount,
    0.5,
    1.2,
    desktop.floorY,
    desktop.xHalfSpan,
    desktop.zStart,
    desktop.zEnd
  );
  const initial = computeHorizontalWavePoint(
    0,
    desktop.rowCount,
    0.5,
    0,
    desktop.floorY,
    desktop.xHalfSpan,
    desktop.zStart,
    desktop.zEnd
  );

  assert.ok(left[0] < 0 && right[0] > 0 && Math.abs(left[0] + right[0]) < 1e-6);
  assert.notEqual(shifted[1], initial[1], 'Expected wave Y to animate smoothly over time');
});

test('magnetic rotation gently snaps released angles to nearest 36-degree structured alignment', () => {
  assert.equal(computeMagneticSnapAngle(14, 36), 0);
  assert.equal(computeMagneticSnapAngle(22, 36), 36);
  assert.equal(computeMagneticSnapAngle(-25, 36), -36);

  let state = {
    angleDeg: 24,
    velocityDeg: 18,
    snappedTargetDeg: 36,
    isSnapping: false,
  };
  for (let i = 0; i < 120; i++) {
    state = stepMagneticRotation(state, false, 1 / 60, 36);
  }
  assert.equal(state.angleDeg, 36);
  assert.equal(state.isSnapping, false);
});

test('hover kinematics softly recedes sibling icons when HUD inspects another tool', () => {
  let sibling = { zPull: 0, scale: 1.0, glowBoost: 0 };
  for (let i = 0; i < 60; i++) {
    sibling = stepHoverKinematics(sibling, false, false, 1 / 60, true);
  }
  assert.ok(sibling.zPull < -0.35, `Expected sibling Z recession, got ${sibling.zPull}`);
  assert.ok(sibling.scale < 0.94 && sibling.scale >= 0.89, `Expected sibling scale ~0.9, got ${sibling.scale}`);
  assert.ok(sibling.glowBoost < -0.15, `Expected subtle sibling emissive dim, got ${sibling.glowBoost}`);
});

test('decorative GLB prop layout stages all 9 props outside the central title safe zone', () => {
  const desktopProps = computeDecorativePropsLayout(1.6);
  const mobileProps = computeDecorativePropsLayout(0.46);
  assert.equal(desktopProps.length, DECORATIVE_PROP_NODES.length);
  assert.equal(mobileProps.length, DECORATIVE_PROP_NODES.length);

  for (const aspect of [1.6, 0.46]) {
    const props = computeDecorativePropsLayout(aspect);
    const icons = computeOrbitalLayout(TOOLS_CATALOG, aspect, 0);
    for (const prop of props) {
      const distFromCenter = Math.hypot(prop.position[0], prop.position[1] - 0.15);
      assert.ok(
        distFromCenter >= 3.2,
        `Prop ${prop.nodeName} too close to center title at aspect=${aspect}: dist=${distFromCenter.toFixed(2)}`
      );
      for (const icon of icons) {
        const xyDist = Math.hypot(
          prop.position[0] - icon.position[0],
          prop.position[1] - icon.position[1]
        );
        assert.ok(
          xyDist >= 1.15,
          `Prop ${prop.nodeName} overlaps icon ${icon.id} at aspect=${aspect}: xyDist=${xyDist.toFixed(2)}`
        );
      }
    }
  }
});

test('smooth auto-scroll advances angle continuously and individual click scatter disperses clicked icon only', () => {
  let rot = { angleDeg: 0, velocityDeg: 0, snappedTargetDeg: 0, isSnapping: false };
  for (let i = 0; i < 60; i++) {
    rot = stepMagneticRotation(rot, false, 1 / 60, 36, 6.0);
  }
  assert.ok(rot.angleDeg > 4.0 && rot.angleDeg < 7.0, `Expected smooth auto-scroll progress, got ${rot.angleDeg}`);

  const evenImpulse = computeIndividualScatterImpulse([4.2, 2.6, -1.6], 0);
  const oddImpulse = computeIndividualScatterImpulse([-4.2, -2.6, 1.5], 1);
  assert.ok(evenImpulse.offset[0] > 1.0 && evenImpulse.offset[2] > 1.5, 'Expected individual radial X/Z scatter impulse');
  assert.ok(oddImpulse.offset[0] < -1.0 && oddImpulse.rotKick[0] < 0, 'Expected opposite-side radial scatter & alternating spin');
});

test('bloom config clamps intensity and protects white surfaces with high threshold and exposure trim', () => {
  const off = computeBloomConfig(-0.5);
  const mid = computeBloomConfig(0.42);
  const max = computeBloomConfig(2.0);

  assert.equal(off.strength, 0);
  assert.equal(off.haloOpacity, 0);
  assert.ok(mid.strength > 0 && mid.strength < max.strength);
  assert.ok(max.strength <= 0.6 && max.threshold >= 0.72, 'Expected controlled bloom ceiling & threshold');
  assert.ok(max.exposureTrim > off.exposureTrim);
});

test('all icons share uniform baseScale and perspective screen-scale compensation', () => {
  const uniqueScales = new Set(TOOLS_CATALOG.map((t) => t.baseScale));
  assert.equal(uniqueScales.size, 1, 'Expected identical baseScale for every icon');

  const camDist = computeResponsiveCameraDistance(1.6);
  const slots = computeOrbitalLayout(TOOLS_CATALOG, 1.6, 0);
  for (const slot of slots) {
    const factor = computeUniformScreenScaleFactor(camDist, slot.position[2]);
    const apparentRatio = factor / (camDist - slot.position[2]);
    assert.ok(
      Math.abs(apparentRatio - 1 / camDist) < 1e-6,
      `Expected uniform projected scale ratio for ${slot.id}, got ${apparentRatio}`
    );
  }
});

test('slow smooth scatter holds for 2 seconds and returns icon cleanly to original position', () => {
  let state = triggerScatterState(createIdleScatterState(2.0), [4.5, 2.2, 1.5], 0, 2.0);
  assert.equal(state.active, true);
  assert.deepEqual(state.offset, [0, 0, 0]);

  // Step 1.2s forward -> still holding in scattered position
  for (let i = 0; i < 72; i++) {
    state = stepIconScatterState(state, 1 / 60);
  }
  assert.equal(state.active, true);
  assert.ok(
    Math.hypot(...state.offset) > 1.2,
    `Expected icon to remain smoothly scattered before 2s, got offset=${state.offset.join(',')}`
  );

  // Step another 0.7s (total 1.9s) -> still scattered before 2.0s mark
  for (let i = 0; i < 42; i++) {
    state = stepIconScatterState(state, 1 / 60);
  }
  assert.ok(Math.hypot(...state.offset) > 1.2, 'Expected scatter to hold until 2.0s');

  // Step 3.0s past the 2.0s mark -> smoothly returns to original [0, 0, 0]
  for (let i = 0; i < 180; i++) {
    state = stepIconScatterState(state, 1 / 60);
  }
  assert.equal(state.active, false);
  assert.deepEqual(state.offset, [0, 0, 0]);
  assert.deepEqual(state.rotKick, [0, 0, 0]);
});

test('dof config clamps strength, tracks camera focus plane, and disables blur at zero', () => {
  const off = computeDofConfig(18.6, 0, -0.2);
  const mid = computeDofConfig(18.6, 0, 0.55);
  const racked = computeDofConfig(18.6, 3.2, 1.4);

  assert.equal(off.enabled, false);
  assert.equal(off.aperture, 0);
  assert.equal(off.maxblur, 0);

  assert.equal(mid.enabled, true);
  assert.ok(Math.abs(mid.focus - 18.6) < 1e-6);
  assert.ok(mid.aperture > 0 && mid.maxblur > 0);

  assert.equal(racked.strength, 1);
  assert.ok(Math.abs(racked.focus - 15.4) < 1e-6);
  assert.ok(racked.maxblur > mid.maxblur && racked.maxblur <= 0.015);
});


