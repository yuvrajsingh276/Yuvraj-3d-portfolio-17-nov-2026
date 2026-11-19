import * as THREE from 'three';

export interface EarthPlanetHandle {
  group: THREE.Group;
  setRadius: (radius: number) => void;
  update: (elapsedSec: number) => void;
  dispose: () => void;
}

function seededNoise2D(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = seededNoise2D(ix, iy);
  const b = seededNoise2D(ix + 1, iy);
  const c = seededNoise2D(ix, iy + 1);
  const d = seededNoise2D(ix + 1, iy + 1);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, octaves = 5): number {
  let value = 0;
  let amplitude = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * freq, y * freq);
    freq *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

function createPlanetSurfaceTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(width, height);

  for (let py = 0; py < height; py++) {
    const v = py / (height - 1);
    const phi = v * Math.PI;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    for (let px = 0; px < width; px++) {
      const u = px / width;
      const theta = u * Math.PI * 2;
      const sx = Math.cos(theta) * sinPhi * 2.3 + 10.4;
      const sy = cosPhi * 2.3 + 5.7;
      const sz = Math.sin(theta) * sinPhi * 2.3 + 3.1;

      const n1 = fbm(sx + sz * 0.45, sy + sz * 0.65, 5);
      const n2 = fbm(sx * 2.1 - sz * 0.35, sy * 2.1 + sx * 0.25, 4);
      const elevation = n1 * 0.72 + n2 * 0.28;
      const idx = (py * width + px) * 4;

      // R: continent mask, G: subtle cloud swirl, B: ocean depth
      const land = Math.max(0, Math.min(1, (elevation - 0.49) * 3.8));
      const clouds = Math.max(0, Math.min(1, (fbm(sx * 1.5 + 16.0, sy * 1.9 + sz * 0.7 + 8.0, 4) - 0.53) * 3.4));
      img.data[idx] = Math.round(land * 255);
      img.data[idx + 1] = Math.round(clouds * 255);
      img.data[idx + 2] = Math.round(elevation * 255);
      img.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createHorizonCoronaTexture(innerColor: string, midColor: string, outerColor: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.16, size / 2, size / 2, size * 0.5);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.32, midColor);
  grad.addColorStop(0.66, outerColor);
  grad.addColorStop(1, 'rgba(10, 9, 29, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the dark, back-lit cosmic indigo Earth with a lush volumetric twilight
 * bloom halo along the upper horizon crest (violet -> rose -> peach-gold crown).
 */
export function createEarthPlanet(initialRadius = 5.05, maxAnisotropy = 4): EarthPlanetHandle {
  const group = new THREE.Group();
  const unitGroup = new THREE.Group();
  unitGroup.scale.setScalar(initialRadius);
  group.add(unitGroup);

  const surfaceDataTex = createPlanetSurfaceTexture(maxAnisotropy);
  const innerBloomTex = createHorizonCoronaTexture(
    'rgba(244, 184, 152, 0.34)',
    'rgba(196, 108, 198, 0.21)',
    'rgba(116, 58, 224, 0.08)'
  );
  const outerBloomTex = createHorizonCoronaTexture(
    'rgba(154, 122, 242, 0.24)',
    'rgba(124, 82, 230, 0.13)',
    'rgba(58, 36, 150, 0.045)'
  );

  // 1. Custom backlit cosmic Earth shader (immune to bright front RoomEnvironment wash-out)
  const coreGeo = new THREE.SphereGeometry(1, 72, 56);
  const coreMat = new THREE.ShaderMaterial({
    uniforms: {
      uSurfaceMap: { value: surfaceDataTex },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      varying vec3 vObjNormal;
      void main() {
        vUv = uv;
        vObjNormal = normalize(normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform sampler2D uSurfaceMap;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      varying vec3 vObjNormal;

      void main() {
        vec2 spinUv = vec2(vUv.x + uTime * 0.008, vUv.y);
        vec2 cloudUv = vec2(vUv.x + uTime * 0.012, vUv.y);
        vec3 data = texture2D(uSurfaceMap, spinUv).rgb;
        float cloud = texture2D(uSurfaceMap, cloudUv).g;

        vec3 n = normalize(vNormalView);
        vec3 v = normalize(vViewPos);
        float ndotv = clamp(dot(n, v), 0.0, 1.0);

        // Soft silhouette feather so the top horizon blends smoothly into the outer bloom
        float edgeAntiAlias = smoothstep(0.0, 0.16, ndotv);

        // Balanced backlit eclipse gradient: dark cosmic indigo below, gentle twilight glow near top
        float topGradient = smoothstep(-0.08, 0.94, n.y);
        float horizonEdge = pow(1.0 - ndotv, 2.85) * smoothstep(0.14, 0.92, n.y);
        float crownEdge = pow(1.0 - ndotv, 3.8) * smoothstep(0.50, 0.98, n.y) * edgeAntiAlias;

        vec3 deepBelly = vec3(0.024, 0.021, 0.078);   // #060514
        vec3 oceanTone = vec3(0.074, 0.062, 0.215);   // #131037
        vec3 landTone = vec3(0.195, 0.145, 0.465);    // #322577
        vec3 cloudTint = vec3(0.30, 0.24, 0.62);

        vec3 surface = mix(oceanTone, landTone, data.r * 0.9);
        surface = mix(surface, cloudTint, cloud * 0.25);

        // Reveal subtle continents/clouds primarily toward the upper backlit hemisphere
        vec3 color = mix(deepBelly, surface, 0.14 + topGradient * 0.84);

        // Restrained atmospheric horizon rim (indigo -> muted rose -> soft peach crown)
        vec3 violetAtmo = vec3(0.48, 0.34, 0.92);
        vec3 roseAtmo = vec3(0.84, 0.44, 0.70);
        vec3 peachAtmo = vec3(0.96, 0.70, 0.54);

        vec3 rimColor = mix(violetAtmo, roseAtmo, smoothstep(0.28, 0.82, n.y));
        rimColor = mix(rimColor, peachAtmo, smoothstep(0.70, 0.98, n.y));

        float bloomPulse = 0.96 + 0.05 * sin(uTime * 0.75);
        color += rimColor * (horizonEdge * 0.44 + crownEdge * 0.50) * bloomPulse;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.renderOrder = -32;
  unitGroup.add(coreMesh);

  // 2. Subtle silky atmospheric inner glow limb that feathers smoothly to zero at its outer edge
  const atmoGeo = new THREE.SphereGeometry(1.048, 64, 48);
  const atmoMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vec3 n = normalize(vNormalView);
        vec3 v = normalize(vViewPos);
        float ndotv = clamp(dot(n, v), 0.0, 1.0);
        // Peak softly just inside the limb and feather out cleanly at ndotv -> 0 (no jagged rim)
        float outerFeather = smoothstep(0.0, 0.32, ndotv);
        float rim = pow(1.0 - ndotv, 3.1) * outerFeather;
        float topMask = smoothstep(0.24, 0.96, n.y);
        vec3 col = mix(vec3(0.50, 0.34, 0.94), vec3(0.94, 0.68, 0.54), smoothstep(0.56, 0.98, n.y));
        float pulse = 0.95 + 0.06 * sin(uTime * 0.85);
        float alpha = clamp(rim * topMask * 0.60 * pulse, 0.0, 0.48);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
  atmoMesh.renderOrder = -30;
  unitGroup.add(atmoMesh);

  // 3. Soft outer volumetric bloom aura shell radiating gently off the planet limb
  const outerBloomShellGeo = new THREE.SphereGeometry(1.20, 56, 42);
  const outerBloomShellMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vec3 n = normalize(vNormalView);
        vec3 v = normalize(vViewPos);
        // BackSide normal faces inward; smooth radial bloom radiating outward from Earth limb
        float grazing = clamp(dot(-n, v), 0.0, 1.0);
        float halo = pow(grazing, 2.7) * smoothstep(0.0, 0.90, -n.y);
        vec3 col = mix(vec3(0.42, 0.26, 0.90), vec3(0.90, 0.56, 0.66), smoothstep(0.36, 0.94, -n.y));
        float pulse = 0.94 + 0.06 * sin(uTime * 0.7 + 0.6);
        float alpha = clamp(halo * 0.40 * pulse, 0.0, 0.44);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const outerBloomShellMesh = new THREE.Mesh(outerBloomShellGeo, outerBloomShellMat);
  outerBloomShellMesh.renderOrder = -33;
  unitGroup.add(outerBloomShellMesh);

  // 4. Dual layered atmospheric bloom corona sprites behind the upper crest
  const innerCoronaMat = new THREE.SpriteMaterial({
    map: innerBloomTex,
    transparent: true,
    opacity: 0.40,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const innerCoronaSprite = new THREE.Sprite(innerCoronaMat);
  innerCoronaSprite.position.set(0, 0.52, -0.35);
  innerCoronaSprite.scale.set(2.35, 2.02, 1);
  innerCoronaSprite.renderOrder = -35;
  unitGroup.add(innerCoronaSprite);

  const outerCoronaMat = new THREE.SpriteMaterial({
    map: outerBloomTex,
    transparent: true,
    opacity: 0.46,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const outerCoronaSprite = new THREE.Sprite(outerCoronaMat);
  outerCoronaSprite.position.set(0, 0.40, -0.55);
  outerCoronaSprite.scale.set(3.2, 2.8, 1);
  outerCoronaSprite.renderOrder = -36;
  unitGroup.add(outerCoronaSprite);

  return {
    group,
    setRadius(radius: number) {
      unitGroup.scale.setScalar(Math.max(0.5, radius));
    },
    update(elapsedSec: number) {
      coreMat.uniforms.uTime.value = elapsedSec;
      atmoMat.uniforms.uTime.value = elapsedSec;
      outerBloomShellMat.uniforms.uTime.value = elapsedSec;
      const breath = 1 + 0.032 * Math.sin(elapsedSec * 0.75);
      innerCoronaMat.opacity = 0.38 * breath;
      outerCoronaMat.opacity = 0.44 * (1 + 0.036 * Math.sin(elapsedSec * 0.6 + 1.1));
    },
    dispose() {
      coreGeo.dispose();
      coreMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      outerBloomShellGeo.dispose();
      outerBloomShellMat.dispose();
      innerCoronaMat.dispose();
      outerCoronaMat.dispose();
      surfaceDataTex.dispose();
      innerBloomTex.dispose();
      outerBloomTex.dispose();
    },
  };
}
