import * as THREE from 'three';
import {
  createRoundedRectShape,
  createRoundedFrameShape,
  createGeminiStarShape,
  createGlyphA,
  createGlyphE,
  createGlyphP,
  createGlyphR,
  createGlyphS,
  createGlyphIStem,
  createFigmaTileShape,
  createClaudeRayShape,
  createBlenderArmShape,
  createCrescentArcShape,
} from './glyphShapes';
import type { ProceduralTextureSet } from './proceduralTextures';
import type { ToolSpec } from './showcaseLogic';

export interface BuiltIconEntry {
  spec: ToolSpec;
  /** Unique orbital instance identifier (e.g. 'chatgpt' or 'chatgpt__dup') */
  instanceId?: string;
  /** Outer anchor group positioned on the orbital ring */
  anchorGroup: THREE.Group;
  /** Inner animated group that floats, rotates, and pulls forward along Z on hover */
  bodyGroup: THREE.Group;
  /** Invisible raycast proxy mesh */
  hitProxy: THREE.Mesh;
  /** Materials whose emissiveIntensity is modulated on hover/bloom */
  glowTargets: {
    material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
    baseEmissive: number;
    isWhite?: boolean;
  }[];
  /** Optional secondary rotating sub-group (rings, satellites, etc.) */
  spinSubGroup?: THREE.Object3D;
}

const DEFAULT_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.24,
  bevelEnabled: true,
  bevelThickness: 0.045,
  bevelSize: 0.04,
  bevelSegments: 4,
  curveSegments: 24,
};

function makeMetalMaterial(
  color: number | string,
  textures: ProceduralTextureSet,
  opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.88,
    roughness: 0.24,
    bumpMap: textures.brushedBump,
    bumpScale: 0.008,
    roughnessMap: textures.brushedRoughness,
    clearcoat: 0.25,
    clearcoatRoughness: 0.25,
    ...opts,
  });
}

function createAdobeMonolith(
  spec: ToolSpec,
  textures: ProceduralTextureSet,
  bgColor: number,
  accentColor: number,
  glyphShapes: { shape: THREE.Shape; x: number; y: number; scale?: number }[],
  extraAccents?: (group: THREE.Group, accentMat: THREE.MeshPhysicalMaterial, metalMat: THREE.MeshPhysicalMaterial) => void
): {
  group: THREE.Group;
  glowTargets: BuiltIconEntry['glowTargets'];
} {
  const group = new THREE.Group();
  const glowTargets: BuiltIconEntry['glowTargets'] = [];

  // 1. Primary beveled chassis
  const bodyShape = createRoundedRectShape(1.42, 1.42, 0.26);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.05,
    bevelSegments: 4,
    curveSegments: 20,
  });
  bodyGeo.center();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: bgColor,
    metalness: 0.25,
    roughness: 0.42,
    clearcoat: 0.7,
    clearcoatRoughness: 0.16,
    envMapIntensity: 0.75,
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Brushed titanium outer bezel collar
  const frameShape = createRoundedFrameShape(1.5, 1.5, 0.29, 0.065);
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 3,
    curveSegments: 20,
  });
  frameGeo.center();
  const metalMat = makeMetalMaterial(0x94a3b8, textures, {
    metalness: 0.92,
    roughness: 0.2,
    envMapIntensity: 1.1,
  });
  const frameMesh = new THREE.Mesh(frameGeo, metalMat);
  frameMesh.castShadow = true;
  group.add(frameMesh);

  // 3. Glowing neon inlay border channel
  const inlayShape = createRoundedFrameShape(1.32, 1.32, 0.22, 0.036);
  const inlayGeo = new THREE.ExtrudeGeometry(inlayShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    curveSegments: 18,
  });
  inlayGeo.center();
  const accentMat = new THREE.MeshPhysicalMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.65,
    metalness: 0.25,
    roughness: 0.2,
    clearcoat: 0.9,
    envMapIntensity: 0.7,
  });
  glowTargets.push({ material: accentMat, baseEmissive: 0.65 });
  const inlayMesh = new THREE.Mesh(inlayGeo, accentMat);
  inlayMesh.position.z = 0.165;
  group.add(inlayMesh);

  // 4. Extruded 3D bevel typography glyphs
  const glyphMat = new THREE.MeshPhysicalMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.52,
    metalness: 0.3,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.72,
  });
  glowTargets.push({ material: glyphMat, baseEmissive: 0.52 });

  for (const g of glyphShapes) {
    const gGeo = new THREE.ExtrudeGeometry(g.shape, {
      depth: 0.085,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.012,
      bevelSegments: 3,
      curveSegments: 18,
    });
    const gMesh = new THREE.Mesh(gGeo, glyphMat);
    const sc = g.scale ?? 1.0;
    gMesh.scale.set(sc, sc, 1);
    gMesh.position.set(g.x, g.y, 0.155);
    gMesh.castShadow = true;
    group.add(gMesh);
  }

  // 5. Rear brushed aluminum cooling fins (adds 360-degree sculptural depth)
  for (let i = -1; i <= 1; i++) {
    const finGeo = new THREE.BoxGeometry(0.95, 0.06, 0.07);
    const fin = new THREE.Mesh(finGeo, metalMat);
    fin.position.set(0, i * 0.22, -0.19);
    group.add(fin);
  }

  if (extraAccents) {
    extraAccents(group, accentMat, metalMat);
  }

  // Ensure spec is referenced for cleanliness
  group.name = `icon-${spec.id}`;
  return { group, glowTargets };
}

function buildGeminiIcon(
  spec: ToolSpec,
  textures: ProceduralTextureSet
): { group: THREE.Group; glowTargets: BuiltIconEntry['glowTargets']; spinSubGroup: THREE.Object3D } {
  const group = new THREE.Group();
  const glowTargets: BuiltIconEntry['glowTargets'] = [];

  // 1. Primary 4-point beveled crystal star
  const starShape = createGeminiStarShape(0.86, 0.14);
  const starGeo = new THREE.ExtrudeGeometry(starShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.065,
    bevelSegments: 5,
    curveSegments: 32,
  });
  starGeo.center();

  const starMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: textures.geminiGradient,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.32,
    metalness: 0.18,
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    iridescence: 0.85,
    iridescenceIOR: 1.35,
  });
  glowTargets.push({ material: starMat, baseEmissive: 0.32 });

  const starMesh = new THREE.Mesh(starGeo, starMat);
  starMesh.castShadow = true;
  group.add(starMesh);

  // 2. Faceted inner diamond core
  const coreGeo = new THREE.OctahedronGeometry(0.28, 0);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    emissive: 0x60a5fa,
    emissiveIntensity: 0.75,
    metalness: 0.1,
    roughness: 0.05,
    clearcoat: 1.0,
  });
  glowTargets.push({ material: coreMat, baseEmissive: 0.75 });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.scale.set(0.85, 0.85, 1.35);
  group.add(coreMesh);

  // 3. Tilted orbital brushed-silver gimbal ring + twin satellite sparks
  const spinSubGroup = new THREE.Group();
  const ringGeo = new THREE.TorusGeometry(0.92, 0.026, 16, 72);
  const ringMat = makeMetalMaterial(0xcbd5e1, textures, { metalness: 0.94, roughness: 0.16 });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.set(Math.PI * 0.34, Math.PI * 0.18, 0);
  spinSubGroup.add(ringMesh);

  const sparkGeo = new THREE.OctahedronGeometry(0.11, 0);
  const sparkMat = new THREE.MeshPhysicalMaterial({
    color: 0xc4b5fd,
    emissive: 0x8b5cf6,
    emissiveIntensity: 0.7,
    roughness: 0.1,
    metalness: 0.25,
  });
  glowTargets.push({ material: sparkMat, baseEmissive: 0.7 });

  const spark1 = new THREE.Mesh(sparkGeo, sparkMat);
  spark1.position.set(0.68, 0.62, 0.18);
  spinSubGroup.add(spark1);

  const spark2 = new THREE.Mesh(sparkGeo, sparkMat);
  spark2.scale.setScalar(0.75);
  spark2.position.set(-0.66, -0.58, -0.18);
  spinSubGroup.add(spark2);

  group.add(spinSubGroup);
  group.name = `icon-${spec.id}`;
  return { group, glowTargets, spinSubGroup };
}

function buildFigmaIcon(
  spec: ToolSpec,
  textures: ProceduralTextureSet
): { group: THREE.Group; glowTargets: BuiltIconEntry['glowTargets'] } {
  const group = new THREE.Group();
  const glowTargets: BuiltIconEntry['glowTargets'] = [];

  // 1. Smoked obsidian backing plinth + brushed titanium bezel
  const plinthShape = createRoundedRectShape(1.36, 1.72, 0.28);
  const plinthGeo = new THREE.ExtrudeGeometry(plinthShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 3,
    curveSegments: 20,
  });
  plinthGeo.center();
  const plinthMat = new THREE.MeshPhysicalMaterial({
    color: 0x111622,
    metalness: 0.35,
    roughness: 0.38,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
  });
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
  plinthMesh.position.z = -0.04;
  plinthMesh.castShadow = true;
  group.add(plinthMesh);

  const rimShape = createRoundedFrameShape(1.44, 1.8, 0.31, 0.05);
  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 20,
  });
  rimGeo.center();
  const metalMat = makeMetalMaterial(0x94a3b8, textures);
  const rimMesh = new THREE.Mesh(rimGeo, metalMat);
  rimMesh.position.z = -0.04;
  group.add(rimMesh);

  // 2. Five authentic 3D extruded Figma tiles with staggered Z-depth
  const tileExtrude: THREE.ExtrudeGeometryOptions = {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 4,
    curveSegments: 24,
  };

  const s = 0.42;
  const dx = 0.225;
  const dy = 0.44;

  const tiles: {
    shape: THREE.Shape | 'circle';
    color: number;
    x: number;
    y: number;
    z: number;
  }[] = [
    { shape: createFigmaTileShape('leftCap', s), color: 0xf24e1e, x: -dx, y: dy, z: 0.13 },
    { shape: createFigmaTileShape('rightCap', s), color: 0xff7262, x: dx, y: dy, z: 0.16 },
    { shape: createFigmaTileShape('leftCap', s), color: 0xa259ff, x: -dx, y: 0, z: 0.19 },
    { shape: 'circle', color: 0x1abcfe, x: dx, y: 0, z: 0.22 },
    { shape: createFigmaTileShape('teardrop', s), color: 0x0acf83, x: -dx, y: -dy, z: 0.15 },
  ];

  for (const t of tiles) {
    let geo: THREE.BufferGeometry;
    if (t.shape === 'circle') {
      const circleShape = new THREE.Shape();
      circleShape.absarc(0, 0, s / 2, 0, Math.PI * 2, false);
      geo = new THREE.ExtrudeGeometry(circleShape, tileExtrude);
    } else {
      geo = new THREE.ExtrudeGeometry(t.shape, tileExtrude);
    }
    geo.center();

    const mat = new THREE.MeshPhysicalMaterial({
      color: t.color,
      emissive: t.color,
      emissiveIntensity: 0.18,
      metalness: 0.08,
      roughness: 0.24,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.55,
    });
    glowTargets.push({ material: mat, baseEmissive: 0.18 });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(t.x, t.y, t.z);
    mesh.castShadow = true;
    group.add(mesh);
  }

  // 3. Tiny corner chrome mounting pins
  const pinGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.06, 12);
  pinGeo.rotateX(Math.PI / 2);
  for (const [px, py] of [
    [-0.54, 0.72],
    [0.54, 0.72],
    [-0.54, -0.72],
    [0.54, -0.72],
  ]) {
    const pin = new THREE.Mesh(pinGeo, metalMat);
    pin.position.set(px, py, 0.05);
    group.add(pin);
  }

  group.name = `icon-${spec.id}`;
  return { group, glowTargets };
}

function buildClaudeIcon(
  spec: ToolSpec,
  textures: ProceduralTextureSet
): { group: THREE.Group; glowTargets: BuiltIconEntry['glowTargets']; spinSubGroup: THREE.Object3D } {
  const group = new THREE.Group();
  const glowTargets: BuiltIconEntry['glowTargets'] = [];

  // 1. Matte dark obsidian base disc
  const baseGeo = new THREE.CylinderGeometry(0.88, 0.92, 0.16, 48);
  baseGeo.rotateX(Math.PI / 2);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x161210,
    metalness: 0.22,
    roughness: 0.68,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.z = -0.06;
  baseMesh.castShadow = true;
  group.add(baseMesh);

  // 2. Warm brushed bronze bezel ring
  const ringGeo = new THREE.TorusGeometry(0.9, 0.045, 20, 64);
  const bronzeMat = makeMetalMaterial(0xd99b78, textures, { metalness: 0.86, roughness: 0.25 });
  const ringMesh = new THREE.Mesh(ringGeo, bronzeMat);
  ringMesh.position.z = -0.02;
  group.add(ringMesh);

  // 3. Twelve precision-tapered terracotta rays
  const rayGroup = new THREE.Group();
  const rayMat = new THREE.MeshPhysicalMaterial({
    color: 0xd97757,
    emissive: 0xa84324,
    emissiveIntensity: 0.35,
    metalness: 0.18,
    roughness: 0.26,
    clearcoat: 0.8,
    envMapIntensity: 0.58,
  });
  glowTargets.push({ material: rayMat, baseEmissive: 0.35 });

  const rayCount = 12;
  for (let i = 0; i < rayCount; i++) {
    // Organic asymmetry subtly echoing Claude's hand-crafted sunburst
    const len = i % 3 === 0 ? 0.72 : i % 2 === 0 ? 0.64 : 0.58;
    const shape = createClaudeRayShape(len, 0.048, 0.078);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.022,
      bevelSize: 0.018,
      bevelSegments: 3,
      curveSegments: 12,
    });
    const ray = new THREE.Mesh(geo, rayMat);
    const angle = (i / rayCount) * Math.PI * 2 + (i % 2 === 0 ? 0.04 : -0.03);
    ray.rotation.z = angle;
    ray.position.z = i % 2 === 0 ? 0.04 : 0.07;
    ray.castShadow = true;
    rayGroup.add(ray);
  }
  group.add(rayGroup);

  // 4. Sculpted center dome hub
  const hubGeo = new THREE.SphereGeometry(0.24, 32, 24);
  hubGeo.scale(1, 1, 0.65);
  const hubMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4a688,
    emissive: 0xd97757,
    emissiveIntensity: 0.55,
    metalness: 0.45,
    roughness: 0.18,
    clearcoat: 1.0,
  });
  glowTargets.push({ material: hubMat, baseEmissive: 0.55 });
  const hubMesh = new THREE.Mesh(hubGeo, hubMat);
  hubMesh.position.z = 0.13;
  group.add(hubMesh);

  group.name = `icon-${spec.id}`;
  return { group, glowTargets, spinSubGroup: rayGroup };
}

function buildChatGptIcon(
  spec: ToolSpec,
  textures: ProceduralTextureSet
): { group: THREE.Group; glowTargets: BuiltIconEntry['glowTargets']; spinSubGroup: THREE.Object3D } {
  const group = new THREE.Group();
  const glowTargets: BuiltIconEntry['glowTargets'] = [];

  // 1. Satin dark-graphite rear chassis disc
  const backGeo = new THREE.CylinderGeometry(0.86, 0.9, 0.12, 48);
  backGeo.rotateX(Math.PI / 2);
  const backMat = new THREE.MeshStandardMaterial({
    color: 0x0c1917,
    metalness: 0.3,
    roughness: 0.58,
  });
  const backMesh = new THREE.Mesh(backGeo, backMat);
  backMesh.position.z = -0.1;
  group.add(backMesh);

  // 2. Six interlocking sculpted emerald-teal knot petals
  const knotGroup = new THREE.Group();
  const petalShape = createRoundedRectShape(0.46, 0.78, 0.22);
  const innerHole = new THREE.Path();
  // Hollow center of each petal loop
  const hw = 0.11;
  const hh = 0.25;
  const r = 0.09;
  innerHole.moveTo(-hw + r, -hh);
  innerHole.quadraticCurveTo(-hw, -hh, -hw, -hh + r);
  innerHole.lineTo(-hw, hh - r);
  innerHole.quadraticCurveTo(-hw, hh, -hw + r, hh);
  innerHole.lineTo(hw - r, hh);
  innerHole.quadraticCurveTo(hw, hh, hw, hh - r);
  innerHole.lineTo(hw, -hh + r);
  innerHole.quadraticCurveTo(hw, -hh, hw - r, -hh);
  innerHole.closePath();
  petalShape.holes.push(innerHole);

  const petalGeo = new THREE.ExtrudeGeometry(petalShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 3,
    curveSegments: 20,
  });
  petalGeo.center();

  const emeraldMat = new THREE.MeshPhysicalMaterial({
    color: 0x10a37f,
    emissive: 0x059669,
    emissiveIntensity: 0.45,
    metalness: 0.22,
    roughness: 0.2,
    clearcoat: 0.9,
  });
  glowTargets.push({ material: emeraldMat, baseEmissive: 0.45 });

  const silverMat = makeMetalMaterial(0xe2e8f0, textures, { metalness: 0.9, roughness: 0.18 });

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, i % 2 === 0 ? emeraldMat : silverMat);
    const orbitR = 0.34;
    petal.position.set(
      Math.cos(angle) * orbitR,
      Math.sin(angle) * orbitR,
      i % 2 === 0 ? 0.08 : 0.02
    );
    petal.rotation.z = angle + Math.PI / 6;
    petal.castShadow = true;
    knotGroup.add(petal);
  }
  group.add(knotGroup);

  // 3. Inner luminous hexagonal jewel ring
  const hexRingGeo = new THREE.TorusGeometry(0.22, 0.028, 12, 6);
  const hexMat = new THREE.MeshPhysicalMaterial({
    color: 0x6ee7b7,
    emissive: 0x10b981,
    emissiveIntensity: 0.8,
    roughness: 0.1,
  });
  glowTargets.push({ material: hexMat, baseEmissive: 0.8 });
  const hexRing = new THREE.Mesh(hexRingGeo, hexMat);
  hexRing.position.z = 0.12;
  group.add(hexRing);

  group.name = `icon-${spec.id}`;
  return { group, glowTargets, spinSubGroup: knotGroup };
}

function buildBlenderIcon(
  spec: ToolSpec,
  textures: ProceduralTextureSet
): { group: THREE.Group; glowTargets: BuiltIconEntry['glowTargets']; spinSubGroup: THREE.Object3D } {
  const group = new THREE.Group();
  const glowTargets: BuiltIconEntry['glowTargets'] = [];

  const orangeMat = new THREE.MeshPhysicalMaterial({
    color: 0xea7600,
    emissive: 0x9a3412,
    emissiveIntensity: 0.28,
    metalness: 0.24,
    roughness: 0.24,
    clearcoat: 0.92,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.62,
  });
  glowTargets.push({ material: orangeMat, baseEmissive: 0.28 });

  // 1. Primary orange sculpted torus body
  const outerRingGeo = new THREE.TorusGeometry(0.52, 0.13, 24, 64);
  const outerRing = new THREE.Mesh(outerRingGeo, orangeMat);
  outerRing.castShadow = true;
  group.add(outerRing);

  // 2. Three radial sculpted Blender arms at iconic top-right, left, bottom-left angles
  const armGeo = new THREE.ExtrudeGeometry(createBlenderArmShape(), {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.036,
    bevelSize: 0.032,
    bevelSegments: 4,
    curveSegments: 16,
  });
  armGeo.translate(0, 0, -0.09);

  for (const deg of [38, 166, 214]) {
    const arm = new THREE.Mesh(armGeo, orangeMat);
    arm.rotation.z = (deg * Math.PI) / 180;
    arm.castShadow = true;
    group.add(arm);
  }

  // 3. White/platinum inner optical bezel collar
  const bezelGeo = new THREE.TorusGeometry(0.32, 0.055, 20, 48);
  const silverMat = makeMetalMaterial(0xf1f5f9, textures, { metalness: 0.85, roughness: 0.16 });
  const bezel = new THREE.Mesh(bezelGeo, silverMat);
  bezel.position.z = 0.06;
  group.add(bezel);

  // 4. Deep sapphire cobalt optical eye core
  const eyeGeo = new THREE.SphereGeometry(0.28, 32, 24);
  eyeGeo.scale(1, 1, 0.6);
  const eyeMat = new THREE.MeshPhysicalMaterial({
    color: 0x265787,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.55,
    metalness: 0.2,
    roughness: 0.06,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  });
  glowTargets.push({ material: eyeMat, baseEmissive: 0.55 });
  const eye = new THREE.Mesh(eyeGeo, eyeMat);
  eye.position.z = 0.05;
  group.add(eye);

  // 5. Sleek outer orbital wireframe gimbal ring
  const spinSubGroup = new THREE.Group();
  const gimbalGeo = new THREE.TorusGeometry(0.95, 0.018, 12, 64);
  const gimbalMat = makeMetalMaterial(0x94a3b8, textures);
  const gimbal = new THREE.Mesh(gimbalGeo, gimbalMat);
  gimbal.rotation.set(Math.PI * 0.38, -Math.PI * 0.15, 0);
  spinSubGroup.add(gimbal);
  group.add(spinSubGroup);

  group.name = `icon-${spec.id}`;
  return { group, glowTargets, spinSubGroup };
}

function buildCinema4dIcon(
  spec: ToolSpec,
  textures: ProceduralTextureSet
): { group: THREE.Group; glowTargets: BuiltIconEntry['glowTargets']; spinSubGroup: THREE.Object3D } {
  const group = new THREE.Group();
  const glowTargets: BuiltIconEntry['glowTargets'] = [];

  // 1. High-gloss anodized sapphire sphere core
  const sphereGeo = new THREE.SphereGeometry(0.54, 40, 32);
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e40af,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.4,
    metalness: 0.35,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  glowTargets.push({ material: sphereMat, baseEmissive: 0.4 });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.castShadow = true;
  group.add(sphere);

  // 2. Sculpted beveled C-crescent shell cradling the sphere
  const crescentShape = createCrescentArcShape(0.84, 0.5, 0.52, Math.PI * 2 - 0.52);
  const crescentGeo = new THREE.ExtrudeGeometry(crescentShape, {
    depth: 0.32,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.045,
    bevelSegments: 4,
    curveSegments: 36,
  });
  crescentGeo.center();
  const crescentMat = new THREE.MeshPhysicalMaterial({
    color: 0x3b82f6,
    emissive: 0x2563eb,
    emissiveIntensity: 0.35,
    metalness: 0.45,
    roughness: 0.2,
    clearcoat: 0.9,
  });
  glowTargets.push({ material: crescentMat, baseEmissive: 0.35 });
  const crescent = new THREE.Mesh(crescentGeo, crescentMat);
  crescent.rotation.z = -0.25;
  crescent.castShadow = true;
  group.add(crescent);

  // 3. Brushed titanium equatorial collar + glowing cyan accent band
  const spinSubGroup = new THREE.Group();
  const collarGeo = new THREE.TorusGeometry(0.64, 0.032, 16, 64);
  const silverMat = makeMetalMaterial(0xe2e8f0, textures);
  const collar = new THREE.Mesh(collarGeo, silverMat);
  collar.rotation.set(Math.PI * 0.42, 0.2, 0);
  spinSubGroup.add(collar);

  const neonBandGeo = new THREE.TorusGeometry(0.555, 0.018, 12, 48);
  const neonMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    emissive: 0x60a5fa,
    emissiveIntensity: 0.85,
    roughness: 0.1,
  });
  glowTargets.push({ material: neonMat, baseEmissive: 0.85 });
  const neonBand = new THREE.Mesh(neonBandGeo, neonMat);
  neonBand.rotation.x = Math.PI / 2;
  spinSubGroup.add(neonBand);

  group.add(spinSubGroup);
  group.name = `icon-${spec.id}`;
  return { group, glowTargets, spinSubGroup };
}

/**
 * Builds all 10 composite 3D software/AI tool icons as multi-part THREE.Group sculptures.
 */
export function buildToolIcon(spec: ToolSpec, textures: ProceduralTextureSet): BuiltIconEntry {
  const anchorGroup = new THREE.Group();
  const bodyGroup = new THREE.Group();
  anchorGroup.add(bodyGroup);

  let built: {
    group: THREE.Group;
    glowTargets: BuiltIconEntry['glowTargets'];
    spinSubGroup?: THREE.Object3D;
  };

  switch (spec.id) {
    case 'after-effects':
      built = createAdobeMonolith(spec, textures, 0x060438, 0x9999ff, [
        { shape: createGlyphA(), x: -0.23, y: 0.04, scale: 0.92 },
        { shape: createGlyphE(), x: 0.27, y: 0.06, scale: 0.92 },
      ]);
      break;

    case 'premiere':
      built = createAdobeMonolith(
        spec,
        textures,
        0x18023b,
        0xea77ff,
        [
          { shape: createGlyphP(), x: -0.22, y: 0.08, scale: 0.9 },
          { shape: createGlyphR(), x: 0.26, y: 0.08, scale: 0.9 },
        ],
        (grp, accentMat, metalMat) => {
          // Bottom timeline playhead bar accent
          const barGeo = new THREE.BoxGeometry(0.84, 0.045, 0.04);
          const bar = new THREE.Mesh(barGeo, metalMat);
          bar.position.set(0, -0.5, 0.17);
          grp.add(bar);

          const headGeo = new THREE.BoxGeometry(0.16, 0.06, 0.055);
          const head = new THREE.Mesh(headGeo, accentMat);
          head.position.set(-0.18, -0.5, 0.18);
          grp.add(head);
        }
      );
      break;

    case 'photoshop':
      built = createAdobeMonolith(spec, textures, 0x001e36, 0x31a8ff, [
        { shape: createGlyphP(), x: -0.21, y: 0.04, scale: 0.92 },
        { shape: createGlyphS(), x: 0.25, y: 0.06, scale: 0.92 },
      ]);
      break;

    case 'illustrator':
      built = createAdobeMonolith(
        spec,
        textures,
        0x301002,
        0xff9a00,
        [
          { shape: createGlyphA(), x: -0.18, y: 0.04, scale: 0.92 },
          { shape: createGlyphIStem(), x: 0.28, y: 0.04, scale: 0.92 },
        ],
        (grp, accentMat) => {
          // Extruded dot above 'i'
          const dotGeo = new THREE.CylinderGeometry(0.072, 0.072, 0.1, 20);
          dotGeo.rotateX(Math.PI / 2);
          const dot = new THREE.Mesh(dotGeo, accentMat);
          dot.position.set(0.28, 0.31, 0.205);
          grp.add(dot);
        }
      );
      break;

    case 'gemini':
      built = buildGeminiIcon(spec, textures);
      break;

    case 'figma':
      built = buildFigmaIcon(spec, textures);
      break;

    case 'claude':
      built = buildClaudeIcon(spec, textures);
      break;

    case 'chatgpt':
      built = buildChatGptIcon(spec, textures);
      break;

    case 'blender':
      built = buildBlenderIcon(spec, textures);
      break;

    case 'cinema4d':
    default:
      built = buildCinema4dIcon(spec, textures);
      break;
  }

  bodyGroup.add(built.group);
  bodyGroup.scale.setScalar(spec.baseScale);

  // Invisible simplified proxy collision box for fast zero-jitter hover/click raycasting
  const proxyGeo = new THREE.BoxGeometry(1.75, 1.85, 0.85);
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitProxy = new THREE.Mesh(proxyGeo, proxyMat);
  hitProxy.userData.toolId = spec.id;
  bodyGroup.add(hitProxy);

  return {
    spec,
    anchorGroup,
    bodyGroup,
    hitProxy,
    glowTargets: built.glowTargets,
    spinSubGroup: built.spinSubGroup,
  };
}

/**
 * Builds the central Orbital Prism Core sculpture that anchors the entire constellation.
 */
export function buildCentralFocalCore(textures: ProceduralTextureSet): {
  group: THREE.Group;
  innerCrystal: THREE.Mesh;
  ringA: THREE.Mesh;
  ringB: THREE.Mesh;
  ringC: THREE.Mesh;
  coreMaterial: THREE.MeshPhysicalMaterial;
  haloMaterial: THREE.SpriteMaterial;
} {
  const group = new THREE.Group();
  group.name = 'central-focal-core';

  // 1. Faceted refractive crystal core
  const crystalGeo = new THREE.IcosahedronGeometry(0.95, 0);
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.65,
    metalness: 0.15,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    iridescence: 0.9,
    iridescenceIOR: 1.4,
  });
  const innerCrystal = new THREE.Mesh(crystalGeo, coreMaterial);
  innerCrystal.castShadow = true;
  group.add(innerCrystal);

  // 2. Wireframe architectural lattice around crystal
  const cageGeo = new THREE.IcosahedronGeometry(1.16, 1);
  const cageWire = new THREE.WireframeGeometry(cageGeo);
  const cageMat = new THREE.LineBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.28,
  });
  const cageLines = new THREE.LineSegments(cageWire, cageMat);
  group.add(cageLines);

  // 3. Three nested brushed-titanium gyroscopic orbital rings
  const ringMatA = makeMetalMaterial(0xcbd5e1, textures, { metalness: 0.95, roughness: 0.16 });
  const ringMatB = makeMetalMaterial(0x64748b, textures, { metalness: 0.9, roughness: 0.24 });

  const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.032, 16, 96), ringMatA);
  ringA.rotation.set(Math.PI * 0.28, Math.PI * 0.12, 0);
  group.add(ringA);

  const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.88, 0.024, 16, 96), ringMatB);
  ringB.rotation.set(-Math.PI * 0.32, Math.PI * 0.42, 0);
  group.add(ringB);

  const ringC = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.016, 12, 110), ringMatA);
  ringC.rotation.set(Math.PI * 0.48, 0.08, 0);
  group.add(ringC);

  // 4. Soft volumetric glow halo sprite behind core
  const haloMaterial = new THREE.SpriteMaterial({
    map: textures.glowSprite,
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.48,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const haloSprite = new THREE.Sprite(haloMaterial);
  haloSprite.scale.set(7.2, 7.2, 1);
  group.add(haloSprite);

  return {
    group,
    innerCrystal,
    ringA,
    ringB,
    ringC,
    coreMaterial,
    haloMaterial,
  };
}
