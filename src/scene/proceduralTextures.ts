import * as THREE from 'three';

export interface ProceduralTextureSet {
  brushedBump: THREE.CanvasTexture;
  brushedRoughness: THREE.CanvasTexture;
  glowSprite: THREE.CanvasTexture;
  particleSprite: THREE.CanvasTexture;
  indigoAura: THREE.CanvasTexture;
  floorDisc: THREE.CanvasTexture;
  geminiGradient: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Generates 100% procedural CanvasTextures (zero external URLs or 404 risks)
 * with calibrated color spaces and anisotropy.
 */
export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Tileable brushed metal bump + roughness map (linear data maps)
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 256;
  metalCanvas.height = 256;
  const mCtx = metalCanvas.getContext('2d')!;
  mCtx.fillStyle = '#808080';
  mCtx.fillRect(0, 0, 256, 256);

  // Deterministic pseudo-random horizontal micro-scratches
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let y = 0; y < 256; y++) {
    const shade = Math.floor(108 + rand() * 48);
    mCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    mCtx.fillRect(0, y, 256, 1);
  }
  for (let i = 0; i < 420; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const w = 18 + rand() * 84;
    const v = Math.floor(95 + rand() * 85);
    mCtx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    mCtx.fillRect(x, y, w, 1);
  }

  const brushedBump = new THREE.CanvasTexture(metalCanvas);
  brushedBump.wrapS = THREE.RepeatWrapping;
  brushedBump.wrapT = THREE.RepeatWrapping;
  brushedBump.repeat.set(2, 2);
  brushedBump.anisotropy = maxAnisotropy;

  const brushedRoughness = new THREE.CanvasTexture(metalCanvas);
  brushedRoughness.wrapS = THREE.RepeatWrapping;
  brushedRoughness.wrapT = THREE.RepeatWrapping;
  brushedRoughness.repeat.set(2, 2);
  brushedRoughness.anisotropy = maxAnisotropy;

  // 2. Radial soft glow / bokeh particle sprite (sRGB)
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 128;
  glowCanvas.height = 128;
  const gCtx = glowCanvas.getContext('2d')!;
  const grad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.18, 'rgba(225, 240, 255, 0.72)');
  grad.addColorStop(0.45, 'rgba(130, 180, 255, 0.22)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  gCtx.fillStyle = grad;
  gCtx.fillRect(0, 0, 128, 128);

  const glowSprite = new THREE.CanvasTexture(glowCanvas);
  glowSprite.colorSpace = THREE.SRGBColorSpace;

  // 2b. Neutral pure-white crisp dot particle sprite for saturated vertex colors
  const dotCanvas = document.createElement('canvas');
  dotCanvas.width = 64;
  dotCanvas.height = 64;
  const dCtx = dotCanvas.getContext('2d')!;
  const dotGrad = dCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  dotGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  dotGrad.addColorStop(0.42, 'rgba(255, 255, 255, 0.92)');
  dotGrad.addColorStop(0.72, 'rgba(255, 255, 255, 0.28)');
  dotGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  dCtx.fillStyle = dotGrad;
  dCtx.fillRect(0, 0, 64, 64);

  const particleSprite = new THREE.CanvasTexture(dotCanvas);
  particleSprite.colorSpace = THREE.SRGBColorSpace;

  // 2c. Deep indigo-violet atmospheric radial aura matching reference backdrop
  const auraCanvas = document.createElement('canvas');
  auraCanvas.width = 512;
  auraCanvas.height = 512;
  const aCtx = auraCanvas.getContext('2d')!;
  const aGrad = aCtx.createRadialGradient(256, 256, 20, 256, 256, 250);
  aGrad.addColorStop(0.0, 'rgba(67, 56, 202, 0.26)');
  aGrad.addColorStop(0.42, 'rgba(49, 46, 129, 0.16)');
  aGrad.addColorStop(0.75, 'rgba(24, 24, 68, 0.05)');
  aGrad.addColorStop(1.0, 'rgba(5, 6, 12, 0.0)');
  aCtx.fillStyle = aGrad;
  aCtx.fillRect(0, 0, 512, 512);

  const indigoAura = new THREE.CanvasTexture(auraCanvas);
  indigoAura.colorSpace = THREE.SRGBColorSpace;

  // 3. Calibrated studio floor disc with subtle radial falloff & concentric orbital ticks
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 1024;
  floorCanvas.height = 1024;
  const fCtx = floorCanvas.getContext('2d')!;
  fCtx.clearRect(0, 0, 1024, 1024);

  const floorGrad = fCtx.createRadialGradient(512, 512, 32, 512, 512, 500);
  floorGrad.addColorStop(0.0, 'rgba(65, 105, 185, 0.11)');
  floorGrad.addColorStop(0.38, 'rgba(32, 54, 100, 0.06)');
  floorGrad.addColorStop(0.75, 'rgba(15, 23, 42, 0.02)');
  floorGrad.addColorStop(1.0, 'rgba(7, 9, 15, 0.0)');
  fCtx.fillStyle = floorGrad;
  fCtx.fillRect(0, 0, 1024, 1024);

  const floorDisc = new THREE.CanvasTexture(floorCanvas);
  floorDisc.colorSpace = THREE.SRGBColorSpace;
  floorDisc.anisotropy = maxAnisotropy;

  // 4. Gemini iridescent gradient albedo map
  const gemCanvas = document.createElement('canvas');
  gemCanvas.width = 256;
  gemCanvas.height = 256;
  const gemCtx = gemCanvas.getContext('2d')!;
  const gemGrad = gemCtx.createLinearGradient(0, 0, 256, 256);
  gemGrad.addColorStop(0.0, '#38bdf8');
  gemGrad.addColorStop(0.35, '#4285f4');
  gemGrad.addColorStop(0.68, '#9b72cb');
  gemGrad.addColorStop(1.0, '#d96570');
  gemCtx.fillStyle = gemGrad;
  gemCtx.fillRect(0, 0, 256, 256);

  const geminiGradient = new THREE.CanvasTexture(gemCanvas);
  geminiGradient.colorSpace = THREE.SRGBColorSpace;
  geminiGradient.anisotropy = maxAnisotropy;

  return {
    brushedBump,
    brushedRoughness,
    glowSprite,
    particleSprite,
    indigoAura,
    floorDisc,
    geminiGradient,
    dispose: () => {
      brushedBump.dispose();
      brushedRoughness.dispose();
      glowSprite.dispose();
      particleSprite.dispose();
      indigoAura.dispose();
      floorDisc.dispose();
      geminiGradient.dispose();
    },
  };
}
