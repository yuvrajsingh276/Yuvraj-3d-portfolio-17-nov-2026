import * as THREE from 'three';

export interface FlutedBackgroundController {
  mesh: THREE.Mesh;
  update: (params: {
    timeSec: number;
    width: number;
    height: number;
    mouseUvX: number;
    mouseUvY: number;
    mouseActive: number;
    mouseSpeed: number;
    hoverIconActive: number;
    hoverIconUvX: number;
    hoverIconUvY: number;
    hoverIconColor: THREE.Color;
  }) => void;
  dispose: () => void;
}

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform float uMouseSpeed;
uniform float uHoverIconActive;
uniform vec2 uHoverIconUv;
uniform vec3 uHoverIconColor;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  float aspect = max(0.4, uResolution.x / max(1.0, uResolution.y));
  vec2 uv = vUv;

  // Deep obsidian void matching reference
  vec3 baseDark = vec3(0.015, 0.014, 0.032);

  // Cursor delta in aspect-corrected space for smooth circular refraction & spotlight
  vec2 deltaMouse = (uv - uMouse) * vec2(aspect, 1.0);
  float distMouse = length(deltaMouse);
  float cursorField = exp(-distMouse * distMouse * 9.5) * uMouseActive;
  float cursorRipple = sin(distMouse * 14.0 - uTime * 2.8) * exp(-distMouse * 4.2) * uMouseActive;

  // Gentle cursor-driven glass bend
  float bendX = deltaMouse.x * 0.09 * cursorField + cursorRipple * 0.008;
  float curvedX = uv.x + bendX;

  // Primary diagonal violet aurora sweep matching reference (top-left -> lower-center)
  float drift = sin(uTime * 0.22) * 0.01;
  float curve1 = 0.045 * sin(curvedX * 3.0 - uTime * 0.12);
  float d1 = (curvedX * 0.74 + uv.y * 0.84) - (0.54 + drift) + curve1;
  float beam1 = exp(-d1 * d1 * 28.0)
    * smoothstep(0.92, 0.05, curvedX)
    * smoothstep(-0.06, 0.94, uv.y + 0.08);

  // Secondary lower-edge flare matching reference bottom-left streak
  float curve2 = 0.02 * cos(curvedX * 4.2 + uTime * 0.10);
  float d2 = (curvedX * 0.62 + uv.y * 0.96) - 0.21 + curve2;
  float beam2 = exp(-d2 * d2 * 64.0)
    * smoothstep(0.08, 0.30, curvedX)
    * smoothstep(0.62, 0.24, curvedX)
    * smoothstep(0.28, 0.0, uv.y);

  // Delicate fluted glass refraction seams (silky continuous glow + thin crisp vertical glints)
  float ribFreq = mix(18.0, 28.0, clamp((aspect - 0.5) / 1.3, 0.0, 1.0));
  float ribPhase = (curvedX * ribFreq + cursorField * 0.28 + uTime * 0.02) * 6.2831853;
  float ribSoft = pow(0.5 + 0.5 * cos(ribPhase), 1.4);
  float ribHairline = pow(0.5 + 0.5 * sin(ribPhase + 0.85), 14.0);
  float fluteMask = 0.76 + 0.24 * ribSoft + 0.36 * ribHairline;

  // Combine smooth diagonal beam with delicate fluted glass glints
  float intensity = (beam1 * 0.88 + beam2 * 0.86) * fluteMask;

  // Cursor spotlight illuminating glass ribs smoothly wherever the mouse hovers
  float cursorSpotlight = cursorField * (0.16 + uMouseSpeed * 0.24) * (0.72 + 0.28 * ribSoft + 0.45 * ribHairline);

  // Reference color ramp: royal indigo -> electric violet -> soft lavender-white core
  vec3 colIndigo = vec3(0.20, 0.05, 0.52);
  vec3 colViolet = vec3(0.54, 0.17, 0.94);
  vec3 colCore = vec3(0.88, 0.80, 0.98);

  vec3 beamColor = mix(colIndigo, colViolet, smoothstep(0.06, 0.44, intensity));
  beamColor = mix(beamColor, colCore, smoothstep(0.48, 1.02, intensity));

  vec3 color = baseDark + beamColor * clamp(intensity, 0.0, 0.90);

  // Interactive cursor violet-indigo glow refracted through fluted glass
  vec3 cursorTint = mix(vec3(0.42, 0.20, 0.92), vec3(0.76, 0.64, 1.0), ribHairline);
  color += cursorTint * cursorSpotlight;

  // Icon hover resonance glow behind the hovered 3D icon
  if (uHoverIconActive > 0.002) {
    vec2 deltaIcon = (uv - uHoverIconUv) * vec2(aspect, 1.0);
    float distIcon = length(deltaIcon);
    float iconGlow = exp(-distIcon * distIcon * 20.0) * uHoverIconActive;
    float iconFlute = 0.78 + 0.22 * ribSoft + 0.38 * ribHairline;
    color += uHoverIconColor * iconGlow * iconFlute * 0.45;
  }

  // Subtle matte film grain to eliminate gradient banding and match reference texture
  float grain = (hash12(gl_FragCoord.xy + fract(uTime * 13.0) * 97.0) - 0.5) * 0.024;
  color = max(vec3(0.0), color + grain);

  gl_FragColor = vec4(color, 1.0);
}
`;

export function createFlutedAuroraBackground(): FlutedBackgroundController {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1440, 900) },
    uMouse: { value: new THREE.Vector2(0.35, 0.55) },
    uMouseActive: { value: 0 },
    uMouseSpeed: { value: 0 },
    uHoverIconActive: { value: 0 },
    uHoverIconUv: { value: new THREE.Vector2(0.5, 0.5) },
    uHoverIconColor: { value: new THREE.Color('#8b5cf6') },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
    depthTest: false,
    depthWrite: false,
    fog: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'fluted-aurora-background';
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;

  return {
    mesh,
    update: (params) => {
      uniforms.uTime.value = params.timeSec;
      uniforms.uResolution.value.set(Math.max(1, params.width), Math.max(1, params.height));
      uniforms.uMouse.value.set(params.mouseUvX, params.mouseUvY);
      uniforms.uMouseActive.value = params.mouseActive;
      uniforms.uMouseSpeed.value = params.mouseSpeed;
      uniforms.uHoverIconActive.value = params.hoverIconActive;
      uniforms.uHoverIconUv.value.set(params.hoverIconUvX, params.hoverIconUvY);
      uniforms.uHoverIconColor.value.copy(params.hoverIconColor);
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}
