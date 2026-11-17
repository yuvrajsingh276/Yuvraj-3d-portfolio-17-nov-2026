export type ToolCategory = 'Motion & Video' | 'Design & Illustration' | '3D & CGI' | 'AI Frontier';

export type LightingPresetId = 'obsidian' | 'aurora' | 'amber';

export interface ToolSpec {
  id: string;
  glbNodeName: string;
  name: string;
  shortLabel: string;
  category: ToolCategory;
  accentHex: string;
  secondaryHex: string;
  summary: string;
  craftNote: string;
  /** Orbital ring radius on X/Z plane */
  orbitRadius: number;
  /** Initial orbital azimuth angle in degrees */
  angleDeg: number;
  /** Vertical elevation offset */
  yOffset: number;
  /** Extra Z-axis depth bias to stage foreground, midground, and background layers */
  zDepthBias: number;
  /** Individual scale multiplier */
  baseScale: number;
  /** Float phase offset in radians */
  phase: number;
}

export interface HoverKinematicsState {
  zPull: number;
  scale: number;
  glowBoost: number;
}

export interface LightingPreset {
  id: LightingPresetId;
  label: string;
  bgHex: string;
  fogHex: string;
  fogDensity: number;
  keyColor: string;
  keyIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;
  hemiIntensity: number;
  rimColor: string;
  rimIntensity: number;
  accentColor: string;
  coreColor: string;
  exposure: number;
  /** Seconds per full subtle breathing cycle */
  breathCycleSec: number;
  /** Fractional rim light pulse amplitude (e.g. 0.12 = +/-12%) */
  rimPulseAmount: number;
  /** Fractional ambient hemisphere pulse amplitude */
  hemiPulseAmount: number;
}

export const LIGHTING_PRESETS: Record<LightingPresetId, LightingPreset> = {
  obsidian: {
    id: 'obsidian',
    label: 'Obsidian Studio',
    bgHex: '#05060c',
    fogHex: '#05060c',
    fogDensity: 0.02,
    keyColor: '#dbe4ff',
    keyIntensity: 1.05,
    hemiSkyColor: '#6366f1',
    hemiGroundColor: '#090b16',
    hemiIntensity: 0.62,
    rimColor: '#4f46e5',
    rimIntensity: 1.15,
    accentColor: '#818cf8',
    coreColor: '#6366f1',
    exposure: 0.84,
    breathCycleSec: 8.5,
    rimPulseAmount: 0.09,
    hemiPulseAmount: 0.04,
  },
  aurora: {
    id: 'aurora',
    label: 'Aurora Rim',
    bgHex: '#050b12',
    fogHex: '#050b12',
    fogDensity: 0.024,
    keyColor: '#e6fbff',
    keyIntensity: 2.35,
    hemiSkyColor: '#34d399',
    hemiGroundColor: '#091526',
    hemiIntensity: 1.15,
    rimColor: '#22d3ee',
    rimIntensity: 2.7,
    accentColor: '#10b981',
    coreColor: '#2dd4bf',
    exposure: 1.15,
    breathCycleSec: 6.8,
    rimPulseAmount: 0.16,
    hemiPulseAmount: 0.08,
  },
  amber: {
    id: 'amber',
    label: 'Warm Amber',
    bgHex: '#0d0908',
    fogHex: '#0d0908',
    fogDensity: 0.025,
    keyColor: '#ffd9b3',
    keyIntensity: 2.75,
    hemiSkyColor: '#f59e0b',
    hemiGroundColor: '#1a1110',
    hemiIntensity: 0.95,
    rimColor: '#fb7185',
    rimIntensity: 2.2,
    accentColor: '#f97316',
    coreColor: '#fb923c',
    exposure: 1.1,
    breathCycleSec: 9.2,
    rimPulseAmount: 0.11,
    hemiPulseAmount: 0.05,
  },
};

export const TOOLS_CATALOG: readonly ToolSpec[] = [
  {
    id: 'chatgpt',
    glbNodeName: 'ChatGpt',
    name: 'ChatGPT',
    shortLabel: 'ChatGPT',
    category: 'AI Frontier',
    accentHex: '#10A37F',
    secondaryHex: '#E5E7EB',
    summary: 'Conversational intelligence and synthesis framed on a sculpted obsidian clearcoat tile.',
    craftNote: 'Precision 3D OpenAI knot emblem nested over a luminous rimmed studio monolith.',
    orbitRadius: 5.2,
    angleDeg: 90,
    yOffset: 2.35,
    zDepthBias: 1.5,
    baseScale: 0.95,
    phase: 4.2,
  },
  {
    id: 'dreamweaver',
    glbNodeName: 'Dreamweaver',
    name: 'Adobe Dreamweaver',
    shortLabel: 'Dw',
    category: 'Design & Illustration',
    accentHex: '#C84BFF',
    secondaryHex: '#28083B',
    summary: 'Responsive web authoring, visual code architecture, and live layout composition.',
    craftNote: 'Deep plum clearcoat chassis with violet neon rim trim and dimensional Dw emblem.',
    orbitRadius: 5.4,
    angleDeg: 54,
    yOffset: 1.9,
    zDepthBias: -1.6,
    baseScale: 0.95,
    phase: 5.5,
  },
  {
    id: 'gemini',
    glbNodeName: 'Gemini',
    name: 'Google Gemini',
    shortLabel: 'Gemini',
    category: 'AI Frontier',
    accentHex: '#4285F4',
    secondaryHex: '#9B72CB',
    summary: 'Multimodal reasoning and generative intelligence sculpted as a luminous 4-point star.',
    craftNote: 'Multi-spectrum vertex-shaded Gemini emblem mounted on a white-rimmed studio tile.',
    orbitRadius: 5.5,
    angleDeg: 18,
    yOffset: 0.95,
    zDepthBias: 1.6,
    baseScale: 0.95,
    phase: 0.0,
  },
  {
    id: 'illustrator',
    glbNodeName: 'Illustrator',
    name: 'Adobe Illustrator',
    shortLabel: 'Ai',
    category: 'Design & Illustration',
    accentHex: '#FF9A00',
    secondaryHex: '#330000',
    summary: 'Precision vector typography, geometric brand systems, and scalable illustration.',
    craftNote: 'Deep umber metallic slab with warm amber trim and extruded Ai letterforms.',
    orbitRadius: 5.6,
    angleDeg: 342,
    yOffset: -0.95,
    zDepthBias: -1.6,
    baseScale: 0.95,
    phase: 6.1,
  },
  {
    id: 'after-effects',
    glbNodeName: 'After Effect',
    name: 'Adobe After Effects',
    shortLabel: 'Ae',
    category: 'Motion & Video',
    accentHex: '#9999FF',
    secondaryHex: '#00005B',
    summary: 'Motion graphics, compositing, and cinematic visual effects workstation.',
    craftNote: 'Deep indigo anodized monolith with extruded bevel typography and neon rim inlay.',
    orbitRadius: 5.3,
    angleDeg: 306,
    yOffset: -2.0,
    zDepthBias: 1.6,
    baseScale: 0.95,
    phase: 0.7,
  },
  {
    id: 'premiere',
    glbNodeName: 'Premiere Pro',
    name: 'Adobe Premiere Pro',
    shortLabel: 'Pr',
    category: 'Motion & Video',
    accentHex: '#EA77FF',
    secondaryHex: '#00005B',
    summary: 'Non-linear editorial storytelling, color finishing, and broadcast audio mixing.',
    craftNote: 'Plum-violet sculpted frame with extruded Pr emblem and illuminated rim edge.',
    orbitRadius: 5.1,
    angleDeg: 270,
    yOffset: -2.4,
    zDepthBias: -1.6,
    baseScale: 0.95,
    phase: 4.9,
  },
  {
    id: 'blender',
    glbNodeName: 'Blender',
    name: 'Blender',
    shortLabel: 'Blender',
    category: '3D & CGI',
    accentHex: '#EA7600',
    secondaryHex: '#265787',
    summary: 'Procedural 3D modeling, cycles ray-tracing, sculpting, and real-time animation.',
    craftNote: 'Tangerine-amber sculpted emblem mounted on a deep-slate neon-rimmed tile.',
    orbitRadius: 5.4,
    angleDeg: 234,
    yOffset: -2.0,
    zDepthBias: 1.6,
    baseScale: 0.95,
    phase: 2.1,
  },
  {
    id: 'photoshop',
    glbNodeName: 'Photoshop',
    name: 'Adobe Photoshop',
    shortLabel: 'Ps',
    category: 'Design & Illustration',
    accentHex: '#31A8FF',
    secondaryHex: '#001E36',
    summary: 'Pixel-level imaging, retouching, matte painting, and digital composition.',
    craftNote: 'Ocean-navy alloy housing with electric cyan bevel rim and extruded Ps emblem.',
    orbitRadius: 5.5,
    angleDeg: 198,
    yOffset: -0.9,
    zDepthBias: -1.6,
    baseScale: 0.95,
    phase: 3.5,
  },
  {
    id: 'claude',
    glbNodeName: 'Claude',
    name: 'Claude AI',
    shortLabel: 'Claude',
    category: 'AI Frontier',
    accentHex: '#D97757',
    secondaryHex: '#F3C6B4',
    summary: 'Thoughtful frontier language model crafted for coding, synthesis, and creative iteration.',
    craftNote: 'Tangerine radial sunburst emblem framed on a dark obsidian glowing tile.',
    orbitRadius: 5.6,
    angleDeg: 162,
    yOffset: 1.0,
    zDepthBias: 1.6,
    baseScale: 0.95,
    phase: 2.8,
  },
  {
    id: 'figma',
    glbNodeName: 'Figma',
    name: 'Figma',
    shortLabel: 'Figma',
    category: 'Design & Illustration',
    accentHex: '#A259FF',
    secondaryHex: '#0ACF83',
    summary: 'Collaborative spatial interface design, prototyping, and component systems.',
    craftNote: 'Vibrant multi-color 3D Figma mark layered on a violet-trimmed dark glass tile.',
    orbitRadius: 5.3,
    angleDeg: 126,
    yOffset: 1.95,
    zDepthBias: -1.6,
    baseScale: 0.95,
    phase: 1.4,
  },
];

/**
 * Computes responsive camera orbit distance so the full constellation frames
 * comfortably on ultrawide, standard desktop, tablet, and narrow mobile screens.
 */
export function computeResponsiveCameraDistance(aspect: number): number {
  const safeAspect = Math.max(0.4, Math.min(2.6, aspect || 1.6));
  if (safeAspect < 0.75) {
    return 39.5;
  }
  if (safeAspect < 1.15) {
    return 25.4;
  }
  return 18.6;
}

/**
 * Compensates for perspective foreshortening across orbital Z depths so every icon
 * around the ring renders with identical apparent visual size on screen.
 */
export function computeUniformScreenScaleFactor(cameraDist: number, slotZ: number): number {
  const safeDist = Math.max(1, cameraDist);
  return Math.max(0.62, Math.min(1.48, (safeDist - slotZ) / safeDist));
}

export interface OrbitalSlot {
  id: string;
  position: [number, number, number];
  baseRotationY: number;
  baseRotationX: number;
  baseRotationZ: number;
}

export function computeOrbitalLayout(
  tools: readonly ToolSpec[],
  aspect = 1.6,
  angleOffsetDeg = 0
): OrbitalSlot[] {
  const isPortrait = aspect < 0.85;
  // One shared, fixed 3D oval. Its plane is tilted 20 degrees around X.
  // Every icon uses the same radii and evenly spaced catalog angles.
  const radiusX = isPortrait ? 5.0 : 8.55;
  const radiusY = isPortrait ? 5.45 : 3.72;
  const tilt = (20 * Math.PI) / 180;

  return tools.map((tool, index) => {
    const rad = ((tool.angleDeg + angleOffsetDeg) * Math.PI) / 180;
    const x = Math.cos(rad) * radiusX;
    const orbitY = Math.sin(rad) * radiusY;
    const y = orbitY * Math.cos(tilt);
    const z = orbitY * Math.sin(tilt);

    const baseRotationY = Math.atan2(-x, 15 - z) * 0.48;
    const baseRotationX = Math.sin(rad) * 0.12 + (index % 2 === 0 ? 0.06 : -0.05);
    const baseRotationZ = Math.cos(rad) * -0.14;

    return {
      id: tool.id,
      position: [x, y, z],
      baseRotationY,
      baseRotationX,
      baseRotationZ,
    };
  });
}

/**
 * Computes the minimum Euclidean 3D distance between any two tool anchor positions.
 */
export function computeMinPairwiseDistance(slots: readonly OrbitalSlot[]): number {
  let minDist = Infinity;
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i].position;
      const b = slots[j].position;
      const dx = a[0] - b[0];
      const dy = a[1] - b[1];
      const dz = a[2] - b[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDist) {
        minDist = dist;
      }
    }
  }
  return minDist;
}

/**
 * Frame-rate-independent exponential damping step.
 */
export function dampValue(current: number, target: number, lambda: number, dt: number): number {
  const clampedDt = Math.min(Math.max(dt, 0), 0.15);
  const alpha = 1 - Math.exp(-lambda * clampedDt);
  return current + (target - current) * alpha;
}

/**
 * Updates hover/selection kinematics smoothly:
 * - Hovered or selected icons glide forward along Z (+0.78 / +0.95),
 *   scale up (+14% / +18%), and boost rim/emissive illumination.
 */
export function stepHoverKinematics(
  current: HoverKinematicsState,
  isHovered: boolean,
  isSelected: boolean,
  dt: number,
  hasOtherFocus = false
): HoverKinematicsState {
  const targetZ = isSelected ? 0.95 : isHovered ? 0.78 : hasOtherFocus ? -0.45 : 0;
  const targetScale = isSelected ? 1.18 : isHovered ? 1.14 : hasOtherFocus ? 0.9 : 1.0;
  const targetGlow = isSelected ? 1.0 : isHovered ? 0.85 : hasOtherFocus ? -0.25 : 0;

  return {
    zPull: dampValue(current.zPull, targetZ, 7.5, dt),
    scale: dampValue(current.scale, targetScale, 8.0, dt),
    glowBoost: dampValue(current.glowBoost, targetGlow, 7.0, dt),
  };
}

/**
 * Computes a well-framed front-facing inspection camera position and look-at target
 * for a selected 3D icon at `worldPos`.
 */
export function computeCameraFocusTarget(
  worldPos: readonly [number, number, number],
  aspect = 1.6
): {
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
} {
  const [tx, ty, tz] = worldPos;
  const dist = aspect < 0.85 ? 5.2 : 4.0;

  // Frame the front face cleanly with a gentle three-quarter sculptural angle
  const dirX = Math.sin(Math.atan2(tx, 15)) * 0.45;
  const dirY = 0.14;
  const dirZ = 1.0;
  const len = Math.hypot(dirX, dirY, dirZ) || 1;

  return {
    cameraPos: [
      tx + (dirX / len) * dist,
      ty + (dirY / len) * dist,
      tz + (dirZ / len) * dist,
    ],
    lookAt: [tx, ty, tz],
  };
}

export interface AmbientBreathingSample {
  rimIntensity: number;
  hemiIntensity: number;
  rimFactor: number;
  hemiFactor: number;
}

/**
 * Computes a very subtle, slow breathing pulse for the studio rim and ambient
 * hemisphere lights, reacting to the active lighting mood and inspection state.
 */
export function computeAmbientBreathing(
  elapsedSec: number,
  preset: LightingPreset,
  amplitudeScale = 1.0
): AmbientBreathingSample {
  const safeScale = Math.max(0, Math.min(1, amplitudeScale));
  const omega = (Math.PI * 2) / Math.max(1, preset.breathCycleSec);
  // Blend primary studio breath with a slow secondary harmonic for an organic cadence
  const wave = Math.sin(elapsedSec * omega) * 0.8 + Math.sin(elapsedSec * omega * 0.5 + 0.9) * 0.2;

  const rimFactor = 1 + wave * preset.rimPulseAmount * safeScale;
  const hemiFactor = 1 + wave * preset.hemiPulseAmount * safeScale;

  return {
    rimIntensity: preset.rimIntensity * rimFactor,
    hemiIntensity: preset.hemiIntensity * hemiFactor,
    rimFactor,
    hemiFactor,
  };
}

export interface BloomConfig {
  intensity: number;
  strength: number;
  radius: number;
  threshold: number;
  haloOpacity: number;
  coloredEmissiveScale: number;
  exposureTrim: number;
}

/**
 * Maps normalized user bloom intensity [0, 1] to calibrated UnrealBloomPass parameters,
 * icon halo opacity, and subtle tone-mapping exposure compensation so colored icon rims
 * glow softly without over-saturating white icon surfaces.
 */
export function computeBloomConfig(intensity: number): BloomConfig {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(intensity) ? intensity : 0.42));
  return {
    intensity: clamped,
    strength: clamped * 0.58,
    radius: 0.52 + clamped * 0.34,
    threshold: 0.86 - clamped * 0.14,
    haloOpacity: clamped * 0.56,
    coloredEmissiveScale: 0.35 + clamped * 1.15,
    exposureTrim: clamped * 0.05,
  };
}

export interface DofConfig {
  strength: number;
  enabled: boolean;
  focus: number;
  aperture: number;
  maxblur: number;
}

/**
 * Computes calibrated Depth-of-Field (BokehPass) parameters from camera distance,
 * target world Z focal plane, and normalized DOF strength [0, 1].
 */
export function computeDofConfig(
  cameraDist: number,
  focusWorldZ = 0,
  strength = 0.55
): DofConfig {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(strength) ? strength : 0.55));
  const safeDist = Math.max(2.5, Number.isFinite(cameraDist) ? cameraDist : 18.6);
  const focus = Math.max(2.0, safeDist - focusWorldZ);

  return {
    strength: clamped,
    enabled: clamped > 0.005,
    focus,
    aperture: clamped * 0.0024,
    maxblur: clamped * 0.014,
  };
}

export interface HorizontalWaveLayout {
  floorY: number;
  rowCount: number;
  colsPerRow: number;
  xHalfSpan: number;
  zStart: number;
  zEnd: number;
}

/**
 * Computes responsive horizontal particle wave grid dimensions beneath the orbital showcase.
 */
export function computeHorizontalWaveLayout(aspect = 1.6): HorizontalWaveLayout {
  const isPortrait = aspect < 0.85;
  return {
    floorY: isPortrait ? -7.8 : -4.85,
    rowCount: 14,
    colsPerRow: 100,
    xHalfSpan: isPortrait ? 8.4 : 13.5,
    zStart: -4.6,
    zEnd: 3.2,
  };
}

/**
 * Computes a calm, slow undulating horizontal particle position across X and Z.
 */
export function computeHorizontalWavePoint(
  rowIndex: number,
  rowCount: number,
  colNorm: number,
  timeSec: number,
  floorY: number,
  xHalfSpan: number,
  zStart: number,
  zEnd: number
): [number, number, number] {
  const rowNorm = rowCount > 1 ? rowIndex / (rowCount - 1) : 0;
  const x = (colNorm * 2 - 1) * xHalfSpan;
  const z = zStart + (zEnd - zStart) * rowNorm;
  const wave =
    Math.sin(x * 0.38 - timeSec * 0.35 + rowNorm * 2.6) * 0.28 +
    Math.cos(x * 0.22 + timeSec * 0.22 - rowNorm * 2.1) * 0.16;
  return [x, floorY + wave, z];
}

/**
 * Samples a seamless multi-stop gradient across Yellow, Red, Orange, and Blue
 * for the horizontal undulating particle waves.
 */
export function sampleYellowRedOrangeBlueGradient(t: number): [number, number, number] {
  const wrapped = ((t % 1) + 1) % 1;
  const yellow: [number, number, number] = [1.0, 0.86, 0.05];
  const red: [number, number, number] = [1.0, 0.12, 0.16];
  const orange: [number, number, number] = [1.0, 0.46, 0.04];
  const blue: [number, number, number] = [0.1, 0.48, 1.0];

  const lerpRgb = (
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    u: number
  ): [number, number, number] => [
    a[0] + (b[0] - a[0]) * u,
    a[1] + (b[1] - a[1]) * u,
    a[2] + (b[2] - a[2]) * u,
  ];

  if (wrapped < 0.25) {
    return lerpRgb(yellow, red, wrapped * 4);
  }
  if (wrapped < 0.5) {
    return lerpRgb(red, orange, (wrapped - 0.25) * 4);
  }
  if (wrapped < 0.75) {
    return lerpRgb(orange, blue, (wrapped - 0.5) * 4);
  }
  return lerpRgb(blue, yellow, (wrapped - 0.75) * 4);
}

export interface ScatterImpulse {
  offset: [number, number, number];
  rotKick: [number, number, number];
}

/**
 * Computes an individual 3D kinetic scatter impulse strictly for the clicked icon
 * (outward burst + playful 3D spin tumble) while sibling icons stay steady in orbit.
 */
export function computeIndividualScatterImpulse(
  iconPos: readonly [number, number, number],
  clickIndex: number
): ScatterImpulse {
  const radialLen = Math.hypot(iconPos[0], iconPos[1]) || 1;
  const nx = iconPos[0] / radialLen;
  const ny = iconPos[1] / radialLen;
  const spinDir = clickIndex % 2 === 0 ? 1 : -1;

  return {
    offset: [nx * 1.45, ny * 1.15 + 0.25, 1.55],
    rotKick: [0.32 * spinDir, -0.45 * spinDir, 0.26 * spinDir],
  };
}

export interface IconScatterState {
  active: boolean;
  elapsedSec: number;
  holdDurationSec: number;
  targetOffset: [number, number, number];
  targetRotKick: [number, number, number];
  offset: [number, number, number];
  rotKick: [number, number, number];
}

export function createIdleScatterState(holdDurationSec = 2.0): IconScatterState {
  return {
    active: false,
    elapsedSec: 0,
    holdDurationSec,
    targetOffset: [0, 0, 0],
    targetRotKick: [0, 0, 0],
    offset: [0, 0, 0],
    rotKick: [0, 0, 0],
  };
}

export function triggerScatterState(
  prev: IconScatterState,
  iconPos: readonly [number, number, number],
  clickIndex: number,
  holdDurationSec = 2.0
): IconScatterState {
  const impulse = computeIndividualScatterImpulse(iconPos, clickIndex);
  return {
    active: true,
    elapsedSec: 0,
    holdDurationSec,
    targetOffset: impulse.offset,
    targetRotKick: impulse.rotKick,
    offset: [...prev.offset] as [number, number, number],
    rotKick: [...prev.rotKick] as [number, number, number],
  };
}

/**
 * Steps slow, smooth outward scatter on click, holds for `holdDurationSec` (default 2s),
 * and then smoothly returns the icon back to its exact original orbital position.
 */
export function stepIconScatterState(state: IconScatterState, dt: number): IconScatterState {
  if (!state.active) return state;

  const clampedDt = Math.min(Math.max(dt, 0), 0.15);
  const nextElapsed = state.elapsedSec + clampedDt;
  const returning = nextElapsed >= state.holdDurationSec;

  const goalOffset = returning ? ([0, 0, 0] as const) : state.targetOffset;
  const goalRot = returning ? ([0, 0, 0] as const) : state.targetRotKick;
  const posLambda = returning ? 2.6 : 3.2;
  const rotLambda = returning ? 2.8 : 3.0;

  const nx = dampValue(state.offset[0], goalOffset[0], posLambda, clampedDt);
  const ny = dampValue(state.offset[1], goalOffset[1], posLambda, clampedDt);
  const nz = dampValue(state.offset[2], goalOffset[2], posLambda, clampedDt);

  const rx = dampValue(state.rotKick[0], goalRot[0], rotLambda, clampedDt);
  const ry = dampValue(state.rotKick[1], goalRot[1], rotLambda, clampedDt);
  const rz = dampValue(state.rotKick[2], goalRot[2], rotLambda, clampedDt);

  if (
    returning &&
    Math.abs(nx) < 0.004 &&
    Math.abs(ny) < 0.004 &&
    Math.abs(nz) < 0.004 &&
    Math.abs(rx) < 0.004 &&
    Math.abs(ry) < 0.004 &&
    Math.abs(rz) < 0.004
  ) {
    return createIdleScatterState(state.holdDurationSec);
  }

  return {
    ...state,
    active: true,
    elapsedSec: nextElapsed,
    offset: [nx, ny, nz],
    rotKick: [rx, ry, rz],
  };
}

export interface MagneticRotationState {
  angleDeg: number;
  velocityDeg: number;
  snappedTargetDeg: number;
  isSnapping: boolean;
}

/**
 * Computes the nearest structured orbital detent angle (default 36 deg = 360 / 10 icons)
 * so top and bottom icons align cleanly along the central vertical axis.
 */
export function computeMagneticSnapAngle(angleDeg: number, stepDeg = 36): number {
  return Math.round(angleDeg / stepDeg) * stepDeg;
}

/**
 * Steps orbital rotation with brief release inertia, smooth optional auto-scrolling,
 * and gentle magnetic snapping onto 36-degree alignment detents when auto-scroll is paused.
 */
export function stepMagneticRotation(
  state: MagneticRotationState,
  isDragging: boolean,
  dt: number,
  stepDeg = 36,
  autoScrollDegPerSec = 0
): MagneticRotationState {
  const clampedDt = Math.min(Math.max(dt, 0), 0.15);
  if (isDragging) {
    return {
      angleDeg: state.angleDeg,
      velocityDeg: state.velocityDeg,
      snappedTargetDeg: computeMagneticSnapAngle(state.angleDeg, stepDeg),
      isSnapping: false,
    };
  }

  if (Math.abs(autoScrollDegPerSec) > 0.01) {
    const nextVel = dampValue(state.velocityDeg, autoScrollDegPerSec, 3.8, clampedDt);
    const nextAngle = state.angleDeg + nextVel * clampedDt;
    return {
      angleDeg: nextAngle,
      velocityDeg: nextVel,
      snappedTargetDeg: computeMagneticSnapAngle(nextAngle, stepDeg),
      isSnapping: false,
    };
  }

  let nextAngle = state.angleDeg + state.velocityDeg * clampedDt;
  let nextVel = state.velocityDeg * Math.exp(-7.5 * clampedDt);

  if (Math.abs(nextVel) < 22) {
    nextVel = 0;
    const target = computeMagneticSnapAngle(nextAngle, stepDeg);
    nextAngle = dampValue(nextAngle, target, 7.5, clampedDt);
    const settled = Math.abs(target - nextAngle) < 0.04;
    return {
      angleDeg: settled ? target : nextAngle,
      velocityDeg: 0,
      snappedTargetDeg: target,
      isSnapping: !settled,
    };
  }

  return {
    angleDeg: nextAngle,
    velocityDeg: nextVel,
    snappedTargetDeg: computeMagneticSnapAngle(nextAngle, stepDeg),
    isSnapping: false,
  };
}

export interface DecorativePropSlot {
  nodeName: string;
  position: [number, number, number];
  rotation: [number, number, number];
  targetSize: number;
  phase: number;
  isSparkle: boolean;
}

export const DECORATIVE_PROP_NODES = [
  'bubble_right',
  'deco_triangle',
  'exclaim_left_dot',
  'exclaim_right_dot',
  'sparkle_1',
  'sparkle_2',
  'sparkle_3',
  'sparkle_4',
  'sparkle_5',
] as const;

/**
 * Computes balanced outer/interstitial 3D positions for the 9 decorative GLB props
 * (chat bubble, geometric triangle, exclamation accents, and 5 glowing sparkles)
 * around the central 'Yuvraj Sing' text and 10-icon orbital ring.
 */
export function computeDecorativePropsLayout(aspect = 1.6): DecorativePropSlot[] {
  const isPortrait = aspect < 0.85;

  return [
    {
      nodeName: 'bubble_right',
      position: isPortrait ? [5.45, 4.75, 0.85] : [7.85, 4.85, 0.85],
      rotation: [0.06, -0.18, 0.04],
      targetSize: 0.9,
      phase: 0.5,
      isSparkle: false,
    },
    {
      nodeName: 'deco_triangle',
      position: isPortrait ? [6.25, 0.85, -0.6] : [9.35, 1.45, -0.6],
      rotation: [0.15, -0.35, 0.25],
      targetSize: 0.44,
      phase: 1.6,
      isSparkle: false,
    },
    {
      nodeName: 'exclaim_left_dot',
      position: isPortrait ? [-6.25, -0.55, 0.7] : [-9.35, -1.15, 0.7],
      rotation: [0.05, 0.2, -0.22],
      targetSize: 0.56,
      phase: 2.3,
      isSparkle: false,
    },
    {
      nodeName: 'exclaim_right_dot',
      position: isPortrait ? [-5.45, 4.15, 0.5] : [-6.85, 3.65, 0.5],
      rotation: [0.04, 0.14, 0.18],
      targetSize: 0.52,
      phase: 3.1,
      isSparkle: false,
    },
    {
      nodeName: 'sparkle_1',
      position: isPortrait ? [-5.25, -4.45, 0.95] : [-6.65, -3.55, 0.95],
      rotation: [0, 0, 0.15],
      targetSize: 0.36,
      phase: 0.9,
      isSparkle: true,
    },
    {
      nodeName: 'sparkle_2',
      position: isPortrait ? [-1.95, 6.45, -0.4] : [-2.35, 4.05, -0.4],
      rotation: [0, 0, -0.12],
      targetSize: 0.28,
      phase: 1.9,
      isSparkle: true,
    },
    {
      nodeName: 'sparkle_3',
      position: isPortrait ? [1.95, 6.75, 0.65] : [2.35, 4.45, 0.65],
      rotation: [0, 0, 0.22],
      targetSize: 0.32,
      phase: 2.8,
      isSparkle: true,
    },
    {
      nodeName: 'sparkle_4',
      position: isPortrait ? [-1.95, -6.55, 0.55] : [-2.35, -4.05, 0.55],
      rotation: [0, 0, 0.08],
      targetSize: 0.26,
      phase: 3.7,
      isSparkle: true,
    },
    {
      nodeName: 'sparkle_5',
      position: isPortrait ? [5.25, -3.85, 0.75] : [6.65, -2.55, 0.75],
      rotation: [0, 0, -0.18],
      targetSize: 0.3,
      phase: 4.5,
      isSparkle: true,
    },
  ];
}
