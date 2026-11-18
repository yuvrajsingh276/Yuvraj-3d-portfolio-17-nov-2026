import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import {
  TOOLS_CATALOG,
  LIGHTING_PRESETS,
  computeOrbitalLayout,
  computeResponsiveCameraDistance,
  computeUniformScreenScaleFactor,
  computeAmbientBreathing,
  sampleYellowRedOrangeBlueGradient,
  createIdleScatterState,
  triggerScatterState,
  stepIconScatterState,
  dampValue,
  stepHoverKinematics,
  stepMagneticRotation,
  computeDecorativePropsLayout,
  computeBloomConfig,
  computeDofConfig,
  getOrbitParams,
  sampleOrbitPoint,
  computeParticleHoverDisplacement,
  type LightingPreset,
  type LightingPresetId,
  type ToolSpec,
  type HoverKinematicsState,
  type MagneticRotationState,
  type IconScatterState,
} from './showcaseLogic';
import {
  createFlutedAuroraBackground,
  type FlutedBackgroundController,
} from './flutedBackground';
import { ShowcaseBokehPass } from './dofPass';
import { createProceduralTextures, type ProceduralTextureSet } from './proceduralTextures';
import { buildToolIcon, type BuiltIconEntry } from './iconBuilders';
import {
  loadGlbShowcaseAssets,
  type BuiltPropEntry,
  type GlbShowcaseAssets,
} from './glbIconLoader';

export interface ShowcaseCallbacks {
  onHoverChange?: (tool: ToolSpec | null) => void;
  onSelectChange?: (tool: ToolSpec | null) => void;
  onContextLostChange?: (lost: boolean) => void;
}

// Pre-allocated scratch math objects (zero GC in render loop)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _colorA = new THREE.Color();
const _orbitPlane = new THREE.Plane(new THREE.Vector3(0, -Math.sin((22 * Math.PI) / 180), Math.cos((22 * Math.PI) / 180)), 0);
const _pointerWorldOnOrbit = new THREE.Vector3();
const _pointerLocalOnOrbit = new THREE.Vector3();

export class ShowcaseStage {
  private container: HTMLElement;
  private callbacks: ShowcaseCallbacks;
  private isSoftwareGl: boolean;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private composer: EffectComposer | null = null;
  private bokehPass: ShowcaseBokehPass | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private textures!: ProceduralTextureSet;

  // Lighting rig
  private activePreset: LightingPreset = LIGHTING_PRESETS.obsidian;
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private rimLight!: THREE.DirectionalLight;
  private hoverPointLight!: THREE.PointLight;
  private softboxLeft: THREE.RectAreaLight | null = null;
  private softboxRight: THREE.RectAreaLight | null = null;
  private breathAmplitudeScale = 1.0;

  // Scene hierarchy
  private constellationGroup = new THREE.Group();
  private icons: BuiltIconEntry[] = [];
  private propEntries: BuiltPropEntry[] = [];
  private glbAssets: GlbShowcaseAssets | null = null;
  private hitProxies: THREE.Mesh[] = [];
  private hoverStates = new Map<string, HoverKinematicsState>();
  private dustPoints!: THREE.Points;
  private dustBasePositions!: Float32Array;
  private dustVelocities!: Float32Array;
  private dustHoverOffsets!: Float32Array;
  private orbitParticles!: THREE.Points;
  private orbitParticleMeta: {
    baseFraction: number;
    speed: number;
    radialOffset: [number, number, number];
    phase: number;
  }[] = [];
  private orbitParticleHoverOffsets!: Float32Array;
  private orbitGlowMaterials: THREE.ShaderMaterial[] = [];
  private flutedBg!: FlutedBackgroundController;
  private orbitGuideRing!: THREE.Group;
  private scatterStates = new Map<string, IconScatterState>();
  private scatterBurstPoints!: THREE.Points;
  private scatterBurstVelocities = new Float32Array(36 * 3);
  private scatterBurstLife = 0;
  private scatterBurstDuration = 1.85;
  private clickCount = 0;

  // Interaction & animation state
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2(99, 99);
  private pointerNorm = { x: 0, y: 0 };
  private pointerUv = { x: 0.35, y: 0.55 };
  private smoothedPointerUv = { x: 0.35, y: 0.55 };
  private pointerActive = 0;
  private targetPointerActive = 0;
  private pointerSpeed = 0;
  private hoverShaderBlend = 0;
  private hoverShaderUv = { x: 0.5, y: 0.5 };
  private hoverShaderColor = new THREE.Color('#8b5cf6');
  private smoothedParallax = { x: 0, y: 0 };
  private pointerDownPos = { x: 0, y: 0 };
  private lastRaycastMs = 0;
  private currentAspect = 1.6;
  private magneticRotation: MagneticRotationState = {
    angleDeg: 0,
    velocityDeg: 0,
    snappedTargetDeg: 0,
    isSnapping: false,
  };
  private lastAppliedAngleDeg = 0;
  private isDraggingScene = false;
  private lastDragX = 0;
  private lastDragMs = 0;
  private dragMoved = false;
  private dragTilt = { x: 0, y: 0 };

  private hoveredToolId: string | null = null;
  private selectedToolId: string | null = null;
  private motionPaused = false;
  private autoOrbit = false;
  private reducedMotion = false;
  private bloomIntensity = 0;
  private dofStrength = 0;
  private currentFocusWorldZ = 0.35;
  private iconHalos = new Map<string, THREE.Sprite>();

  private frameId = 0;
  private lastTimeMs = 0;
  private elapsedSec = 0;
  private disposed = false;
  private contextLost = false;
  private pageVisible = typeof document === 'undefined' || document.visibilityState === 'visible';
  private heroVisible = typeof window === 'undefined' || window.scrollY < window.innerHeight * 0.9;

  constructor(container: HTMLElement, callbacks: ShowcaseCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    // Avoid creating and destroying a probe WebGL context; use the stage's single context only.
    this.isSoftwareGl = false;
    this.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    this.initRendererAndScene();
    this.initLighting();
    this.initEnvironmentDecor();
    void this.initGlbAssets();
    this.initOrbitParticles();
    this.initParticles();
    this.initControls();
    this.bindEvents();
    this.applyLightingPreset('obsidian');
    this.handleResize();

    // Let the first animation frame compile shaders lazily. Eager compilation can
    // stall or fail on mobile GPUs before the hero has rendered a single frame.
    this.lastTimeMs = performance.now();
    this.tick();
  }

  private initRendererAndScene() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const aspect = width / height;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: width < 768 ? 'low-power' : 'high-performance',
      preserveDrawingBuffer: false,
    });
    const glCtx = this.renderer.getContext();
    const debugExt = glCtx.getExtension('WEBGL_debug_renderer_info');
    const gpuName = String(
      glCtx.getParameter(debugExt ? debugExt.UNMASKED_RENDERER_WEBGL : glCtx.RENDERER) ?? ''
    );
    this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuName);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.84;
    const pixelRatioCap = this.isSoftwareGl ? 1 : width < 640 ? 0.85 : width < 1024 ? 1 : 1.25;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = false;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.inset = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.zIndex = '0';
    this.renderer.domElement.style.cursor = 'grab';
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D Creative Software Showcase');
    this.container.style.position = 'absolute';
    this.container.style.inset = '0';
    this.container.style.overflow = 'hidden';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.FogExp2('#080b18', 0.012);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAnisotropy);

    const camDist = computeResponsiveCameraDistance(aspect);
    this.camera = new THREE.PerspectiveCamera(44, aspect, 0.1, 120);
    this.camera.position.set(0, 0.15, camDist * (aspect >= 0.85 ? 1.08 : 1.04));

    if (!this.isSoftwareGl && (this.bloomIntensity > 0.001 || this.dofStrength > 0.001)) {
      const initDof = computeDofConfig(camDist, this.currentFocusWorldZ, this.dofStrength);
      const initBloom = computeBloomConfig(this.bloomIntensity);
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));

      this.bokehPass = new ShowcaseBokehPass(
        this.scene,
        this.camera,
        {
          focus: initDof.focus,
          aperture: initDof.aperture,
          maxblur: initDof.maxblur,
        },
        this.getDepthExcludedObjects
      );
      this.bokehPass.enabled = initDof.enabled;
      this.composer.addPass(this.bokehPass);

      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        initBloom.strength,
        initBloom.radius,
        initBloom.threshold
      );
      this.bloomPass.enabled = initBloom.strength > 0.001;
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    }
  }

  private getDepthExcludedObjects = (): THREE.Object3D[] => {
    const excluded: THREE.Object3D[] = [];
    if (this.flutedBg?.mesh) excluded.push(this.flutedBg.mesh);
    if (this.dustPoints) excluded.push(this.dustPoints);
    if (this.orbitParticles) excluded.push(this.orbitParticles);
    if (this.scatterBurstPoints) excluded.push(this.scatterBurstPoints);
    if (this.orbitGuideRing) excluded.push(this.orbitGuideRing);
    for (let i = 0; i < this.hitProxies.length; i++) {
      excluded.push(this.hitProxies[i]);
    }
    this.iconHalos.forEach((sprite) => excluded.push(sprite));
    return excluded;
  };

  private initLighting() {
    // Warm directional key light with tight shadow frustum
    this.keyLight = new THREE.DirectionalLight('#fff1e0', 2.6);
    this.keyLight.position.set(7.5, 11, 8.5);
    if (!this.isSoftwareGl) {
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.set(1024, 1024);
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 32;
      this.keyLight.shadow.camera.left = -9;
      this.keyLight.shadow.camera.right = 9;
      this.keyLight.shadow.camera.top = 9;
      this.keyLight.shadow.camera.bottom = -9;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.keyLight);

    // Cool sky/ground hemisphere fill
    this.hemiLight = new THREE.HemisphereLight('#7eb6ff', '#0e1320', 1.05);
    this.scene.add(this.hemiLight);

    // Sharp rim backlight for sculptural edge separation
    this.rimLight = new THREE.DirectionalLight('#4f8cff', 2.4);
    this.rimLight.position.set(-7, 4.5, -9);
    this.scene.add(this.rimLight);

    // Dynamic hover accent light (follows hovered/selected tool smoothly, gentle accent)
    this.hoverPointLight = new THREE.PointLight('#ffffff', 0, 5.5, 1.6);
    this.scene.add(this.hoverPointLight);

    // Studio softbox area lights on hardware GPUs (very low so white icons never clip)
    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      this.softboxLeft = new THREE.RectAreaLight(0x818cf8, 0.45, 6, 3);
      this.softboxLeft.position.set(-8, 4, 6);
      this.softboxLeft.lookAt(0, 0, 0);
      this.scene.add(this.softboxLeft);

      this.softboxRight = new THREE.RectAreaLight(0xc7d2fe, 0.35, 6, 3);
      this.softboxRight.position.set(8, 3, -5);
      this.softboxRight.lookAt(0, 0, 0);
      this.scene.add(this.softboxRight);
    }
  }

  private initEnvironmentDecor() {
    this.scene.add(this.constellationGroup);

    const aspect =
      Math.max(1, this.container.clientWidth) / Math.max(1, this.container.clientHeight);

    // Fluted violet-glass aurora backdrop with interactive cursor refraction
    this.flutedBg = createFlutedAuroraBackground();
    this.flutedBg.mesh.visible = false;
    this.scene.add(this.flutedBg.mesh);

    // Subtle thin tilted orbital guide ring around central typography
    this.initOrbitalGuideRing(aspect);

    this.initScatterBurstParticles();
  }

  private initOrbitalGuideRing(aspect: number) {
    this.orbitGuideRing = new THREE.Group();
    // Keep the orbit in the exact same coordinate space as the icon anchors.
    this.constellationGroup.add(this.orbitGuideRing);
    this.rebuildOrbitalGuideRing(aspect, this.magneticRotation.angleDeg);
  }

  /** Fixed tilted oval using the exact arc-length curve shared by icons and orbit particles. */
  private rebuildOrbitalGuideRing(aspect: number, _angleOffsetDeg: number) {
    if (!this.orbitGuideRing) return;

    this.orbitGlowMaterials = [];
    for (const child of [...this.orbitGuideRing.children]) {
      this.orbitGuideRing.remove(child);
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose();
    }

    const pointOnOrbit = (arcFraction: number, scale = 1) => {
      const [x, y, z] = sampleOrbitPoint(arcFraction, aspect, scale);
      return new THREE.Vector3(x, y, z);
    };
    const points = Array.from({ length: 256 }, (_, i) => pointOnOrbit(i / 256));
    const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.35);

    const makeGradientTube = (
      path: THREE.Curve<THREE.Vector3>,
      radius: number,
      tubularSegments: number,
      closed: boolean,
      radialSegments = 12
    ) => {
      const geometry = new THREE.TubeGeometry(path, tubularSegments, radius, radialSegments, closed);
      const colors = new Float32Array(geometry.getAttribute('position').count * 3);
      const verticesPerRing = radialSegments + 1;
      for (let i = 0; i < colors.length / 3; i++) {
        const t = Math.floor(i / verticesPerRing) / tubularSegments;
        const [r, g, b] = sampleYellowRedOrangeBlueGradient(t);
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      return geometry;
    };

    const createOrbitGlowShader = (baseOpacity: number, pulseGain: number, edgePower: number) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uBaseOpacity: { value: baseOpacity },
          uPulseGain: { value: pulseGain },
          uEdgePower: { value: edgePower },
          uPointerPos: { value: new THREE.Vector3() },
          uPointerActive: { value: 0 },
        },
        vertexShader: `
          attribute vec3 color;
          varying vec3 vColor;
          varying vec2 vUv;
          varying vec3 vLocalPos;
          varying vec3 vNormalView;
          varying vec3 vViewPos;
          void main() {
            vColor = color;
            vUv = uv;
            vLocalPos = position;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormalView = normalize(normalMatrix * normal);
            vViewPos = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uBaseOpacity;
          uniform float uPulseGain;
          uniform float uEdgePower;
          uniform vec3 uPointerPos;
          uniform float uPointerActive;
          varying vec3 vColor;
          varying vec2 vUv;
          varying vec3 vLocalPos;
          varying vec3 vNormalView;
          varying vec3 vViewPos;
          void main() {
            float wave1 = 0.5 + 0.5 * sin(vUv.x * 6.2831853 * 2.0 - uTime * 0.95);
            float wave2 = 0.5 + 0.5 * sin(vUv.x * 6.2831853 * 4.0 + uTime * 0.65);
            float shimmer = smoothstep(0.15, 0.95, wave1) * 0.65 + smoothstep(0.2, 0.95, wave2) * 0.35;

            float dPtr = distance(vLocalPos, uPointerPos);
            float hoverGlow = smoothstep(3.8, 0.0, dPtr) * uPointerActive;

            // Smooth Gaussian-like radial feathering across the tube silhouette
            float facing = clamp(abs(dot(normalize(vNormalView), normalize(vViewPos))), 0.0, 1.0);
            float radialFeather = pow(facing, uEdgePower);

            vec3 luminous = mix(vColor, vec3(0.79, 0.72, 1.0), 0.38 + hoverGlow * 0.48);
            luminous *= (0.98 + shimmer * uPulseGain + hoverGlow * 1.05);
            float alpha = clamp(uBaseOpacity * radialFeather * (0.9 + shimmer * 0.4 + hoverGlow * 0.75), 0.0, 1.0);
            gl_FragColor = vec4(luminous, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
      });
      this.orbitGlowMaterials.push(mat);
      return mat;
    };

    // Thin, crisp orbital core with richer multi-layer silky feathered glow
    const outerAura = new THREE.Mesh(
      makeGradientTube(curve, 0.135, 512, true, 12),
      createOrbitGlowShader(0.26, 0.55, 2.8)
    );
    const midGlow = new THREE.Mesh(
      makeGradientTube(curve, 0.036, 640, true, 12),
      createOrbitGlowShader(0.54, 0.75, 1.95)
    );
    const core = new THREE.Mesh(
      makeGradientTube(curve, 0.0062, 768, true, 10),
      createOrbitGlowShader(1.0, 0.95, 1.1)
    );
    outerAura.renderOrder = -22;
    midGlow.renderOrder = -21;
    core.renderOrder = -20;
    this.orbitGuideRing.add(outerAura, midGlow, core);

    // Fine harmonic accent filaments around the glowing main orbit
    const accentArcs = [
      { start: 0.035, end: 0.285, scale: 1.028, radius: 0.0022, opacity: 0.24 },
      { start: 0.365, end: 0.595, scale: 0.972, radius: 0.002, opacity: 0.22 },
      { start: 0.695, end: 0.935, scale: 1.042, radius: 0.0022, opacity: 0.23 },
    ];
    accentArcs.forEach((arc, index) => {
      const arcPoints = Array.from({ length: 52 }, (_, i) => {
        const t = arc.start + (arc.end - arc.start) * (i / 51);
        return pointOnOrbit(t, arc.scale);
      });
      const arcCurve = new THREE.CatmullRomCurve3(arcPoints, false, 'centripetal', 0.35);
      const line = new THREE.Mesh(
        makeGradientTube(arcCurve, arc.radius, 96, false, 8),
        createOrbitGlowShader(arc.opacity, 0.35, 1.4)
      );
      line.renderOrder = -18 + index;
      this.orbitGuideRing?.add(line);
    });
  }
  private initScatterBurstParticles() {
    const count = 36;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const [cr, cg, cb] = sampleYellowRedOrangeBlueGradient(i / count);
      colors[i * 3] = cr;
      colors[i * 3 + 1] = cg;
      colors[i * 3 + 2] = cb;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.1,
      map: this.textures.particleSprite,
      transparent: true,
      opacity: 0,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.scatterBurstPoints = new THREE.Points(geo, mat);
    this.scatterBurstPoints.visible = false;
    this.scene.add(this.scatterBurstPoints);
  }

  private async initGlbAssets() {
    const aspect =
      Math.max(1, this.container.clientWidth) / Math.max(1, this.container.clientHeight);
    this.currentAspect = aspect;

    try {
      const assets = await loadGlbShowcaseAssets(
        '/models/computer-v4.glb',
        '/draco/',
        this.isSoftwareGl,
        aspect
      );
      if (this.disposed) {
        assets.dispose();
        return;
      }

      this.glbAssets = assets;
      const slots = computeOrbitalLayout(
        TOOLS_CATALOG,
        this.currentAspect,
        this.magneticRotation.angleDeg
      );
      this.lastAppliedAngleDeg = this.magneticRotation.angleDeg;

      for (let i = 0; i < assets.icons.length; i++) {
        const built = assets.icons[i];
        const slot = slots[i];
        built.anchorGroup.position.set(slot.position[0], slot.position[1], slot.position[2]);
        built.anchorGroup.rotation.set(slot.baseRotationX, slot.baseRotationY, slot.baseRotationZ);
        this.attachIconHalo(built);

        this.constellationGroup.add(built.anchorGroup);
        this.icons.push(built);
        this.hitProxies.push(built.hitProxy);
        this.hoverStates.set(built.spec.id, { zPull: 0, scale: 1.0, glowBoost: 0 });
        this.scatterStates.set(built.spec.id, createIdleScatterState(2.0));
      }

      const propSlots = computeDecorativePropsLayout(this.currentAspect);
      for (let i = 0; i < assets.props.length; i++) {
        const prop = assets.props[i];
        const slot = propSlots[i];
        if (slot) {
          prop.anchorGroup.position.set(slot.position[0], slot.position[1], slot.position[2]);
          prop.anchorGroup.rotation.set(slot.rotation[0], slot.rotation[1], slot.rotation[2]);
        }
        this.constellationGroup.add(prop.anchorGroup);
        this.propEntries.push(prop);
      }

    } catch (err) {
      console.warn('GLB showcase load fallback:', err);
      if (!this.disposed && this.icons.length === 0) {
        this.initProceduralFallbackIcons();
      }
    }
  }

  private initProceduralFallbackIcons() {
    const aspect =
      Math.max(1, this.container.clientWidth) / Math.max(1, this.container.clientHeight);
    this.currentAspect = aspect;
    const slots = computeOrbitalLayout(TOOLS_CATALOG, aspect, this.magneticRotation.angleDeg);
    this.lastAppliedAngleDeg = this.magneticRotation.angleDeg;

    for (let i = 0; i < TOOLS_CATALOG.length; i++) {
      const spec = TOOLS_CATALOG[i];
      const slot = slots[i];
      const built = buildToolIcon(spec, this.textures);
      built.anchorGroup.position.set(slot.position[0], slot.position[1], slot.position[2]);
      built.anchorGroup.rotation.y = slot.baseRotationY;
      this.attachIconHalo(built);

      this.constellationGroup.add(built.anchorGroup);
      this.icons.push(built);
      this.hitProxies.push(built.hitProxy);
      this.hoverStates.set(spec.id, { zPull: 0, scale: 1.0, glowBoost: 0 });
      this.scatterStates.set(spec.id, createIdleScatterState(2.0));
    }
  }

  private attachIconHalo(entry: BuiltIconEntry) {
    // Small, local accent light makes each icon catch light at its own position.
    const localLight = new THREE.PointLight(entry.spec.accentHex, 2.6, 3.6, 2);
    localLight.position.set(0, 0, 0.32);
    entry.bodyGroup.add(localLight);

    const haloMat = new THREE.SpriteMaterial({
      map: this.textures.glowSprite,
      color: entry.spec.accentHex,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(haloMat);
    sprite.scale.set(2.55, 2.55, 1);
    sprite.position.set(0, 0, -0.18);
    sprite.visible = true;
    entry.bodyGroup.add(sprite);
    this.iconHalos.set(entry.spec.id, sprite);
  }

  private initOrbitParticles() {
    const count = 460;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.orbitParticleHoverOffsets = new Float32Array(count * 3);
    this.orbitParticleMeta = [];

    let seed = 8821;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const aspect =
      Math.max(1, this.container.clientWidth) / Math.max(1, this.container.clientHeight);

    for (let i = 0; i < count; i++) {
      const baseFraction = i / count + (rand() - 0.5) * 0.004;
      const speed = 0.011 + rand() * 0.018;
      // Blend tight core-hugging sparks with a gentle halo band around the orbit
      const bandSpread = i % 3 === 0 ? 0.52 : 0.24;
      const radialOffset: [number, number, number] = [
        (rand() - 0.5) * bandSpread,
        (rand() - 0.5) * bandSpread * 0.72,
        (rand() - 0.5) * bandSpread * 0.72,
      ];
      const phase = rand() * Math.PI * 2;
      this.orbitParticleMeta.push({ baseFraction, speed, radialOffset, phase });

      const [ox, oy, oz] = sampleOrbitPoint(baseFraction, aspect, 1);
      positions[i * 3] = ox + radialOffset[0];
      positions[i * 3 + 1] = oy + radialOffset[1];
      positions[i * 3 + 2] = oz + radialOffset[2];

      const [cr, cg, cb] = sampleYellowRedOrangeBlueGradient(baseFraction);
      // Enrich with bright violet-white luminescence for glowing orbit stardust
      colors[i * 3] = Math.min(1, cr * 0.7 + 0.36);
      colors[i * 3 + 1] = Math.min(1, cg * 0.66 + 0.32);
      colors[i * 3 + 2] = Math.min(1, cb * 0.76 + 0.42);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.27,
      map: this.textures.glowSprite,
      transparent: true,
      opacity: 0.94,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.orbitParticles = new THREE.Points(geo, mat);
    this.orbitParticles.frustumCulled = false;
    this.orbitParticles.renderOrder = -15;
    this.constellationGroup.add(this.orbitParticles);
  }

  private initParticles() {
    const count = 360;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Deterministic seeded distribution for crisp stardust field
    let seed = 4242;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const palette = [
      new THREE.Color('#60a5fa'),
      new THREE.Color('#c084fc'),
      new THREE.Color('#34d399'),
      new THREE.Color('#fbbf24'),
      new THREE.Color('#e2e8f0'),
    ];

    for (let i = 0; i < count; i++) {
      const r = 2.6 + rand() * 9.5;
      const theta = rand() * Math.PI * 2;
      const y = (rand() - 0.5) * 7.8;

      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      // Seed particles throughout real camera depth, from far background to foreground.
      positions[i * 3 + 2] = -20 + rand() * 32;

      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    this.dustBasePositions = new Float32Array(positions);
    this.dustHoverOffsets = new Float32Array(count * 3);
    this.dustVelocities = new Float32Array(count);
    for (let i = 0; i < count; i++) this.dustVelocities[i] = 1.4 + rand() * 1.5;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.11,
      map: this.textures.particleSprite,
      transparent: true,
      opacity: 0.44,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.dustPoints = new THREE.Points(geo, mat);
    this.dustPoints.frustumCulled = false;
    this.scene.add(this.dustPoints);
  }

  private initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.055;
    this.controls.enableRotate = false;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.autoRotate = false;
    this.controls.target.set(0, 0.15, 0);
    this.controls.update();
  }

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('scroll', this.handleScrollVisibility, { passive: true });
    window.addEventListener('pointermove', this.handleWindowPointerMove, { passive: true });
    document.addEventListener('visibilitychange', this.handlePageVisibility);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private unbindEvents() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScrollVisibility);
    window.removeEventListener('pointermove', this.handleWindowPointerMove);
    document.removeEventListener('visibilitychange', this.handlePageVisibility);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointerup', this.handlePointerUp);
    canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private handleWindowPointerMove = (e: PointerEvent) => {
    if (!this.heroVisible || this.isDraggingScene) return;
    this.updatePointerCoords(e);
  };

  private handleScrollVisibility = () => {
    const visible = window.scrollY < window.innerHeight * 1.05;
    if (visible === this.heroVisible) return;
    this.heroVisible = visible;
    if (visible && this.pageVisible && !this.contextLost && !this.disposed) {
      this.lastTimeMs = performance.now();
      this.tick();
    } else {
      cancelAnimationFrame(this.frameId);
      clearTimeout(this.frameId);
    }
  };

  private handlePageVisibility = () => {
    this.pageVisible = document.visibilityState === 'visible';
    if (this.pageVisible && this.heroVisible && !this.contextLost && !this.disposed) {
      this.lastTimeMs = performance.now();
      this.tick();
    } else {
      cancelAnimationFrame(this.frameId);
      clearTimeout(this.frameId);
    }
  };

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
    cancelAnimationFrame(this.frameId);
    this.callbacks.onContextLostChange?.(true);
  };

  private handleContextRestored = () => {
    if (this.disposed) return;
    this.contextLost = false;
    this.lastTimeMs = performance.now();
    this.callbacks.onContextLostChange?.(false);
    this.tick();
  };

  private handleResize = () => {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const aspect = width / height;
    this.currentAspect = aspect;

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    const pixelRatioCap = width < 640 ? 0.85 : width < 1024 ? 1 : 1.25;
    const nextPixelRatio = Math.min(window.devicePixelRatio || 1, pixelRatioCap);
    if (Math.abs(this.renderer.getPixelRatio() - nextPixelRatio) > 0.01) this.renderer.setPixelRatio(nextPixelRatio);
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }

    // Recompute responsive orbital spread and overview camera distance so mobile viewports frame cleanly
    const slots = computeOrbitalLayout(TOOLS_CATALOG, aspect, this.magneticRotation.angleDeg);
    this.lastAppliedAngleDeg = this.magneticRotation.angleDeg;
    this.rebuildOrbitalGuideRing(aspect, this.magneticRotation.angleDeg);
    for (let i = 0; i < this.icons.length; i++) {
      this.icons[i].anchorGroup.position.set(
        slots[i].position[0],
        slots[i].position[1],
        slots[i].position[2]
      );
      this.icons[i].anchorGroup.rotation.set(
        slots[i].baseRotationX,
        slots[i].baseRotationY,
        slots[i].baseRotationZ
      );
    }

    const propSlots = computeDecorativePropsLayout(aspect);
    for (let i = 0; i < this.propEntries.length; i++) {
      const propSlot = propSlots[i];
      if (propSlot) {
        this.propEntries[i].anchorGroup.position.set(
          propSlot.position[0],
          propSlot.position[1],
          propSlot.position[2]
        );
      }
    }

    const targetDist = computeResponsiveCameraDistance(aspect);
    this.camera.position.set(0, 0.15, targetDist * (aspect >= 0.85 ? 1.08 : 1.04));
    this.controls.target.set(0, 0.15, 0);
    this.controls.update();
    this.applyDofState();
    if (this.elapsedSec > 0 && this.heroVisible && !this.disposed && !this.contextLost) {
      if (this.composer && !this.isSoftwareGl) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    }
  };

  private updatePointerCoords(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const uvX = (e.clientX - rect.left) / rect.width;
    const uvY = 1 - (e.clientY - rect.top) / rect.height;
    const nx = uvX * 2 - 1;
    const ny = uvY * 2 - 1;
    this.pointerNdc.set(nx, ny);
    this.pointerNorm.x = nx;
    this.pointerNorm.y = ny;

    const dx = uvX - this.pointerUv.x;
    const dy = uvY - this.pointerUv.y;
    this.pointerUv.x = Math.max(0, Math.min(1, uvX));
    this.pointerUv.y = Math.max(0, Math.min(1, uvY));
    this.targetPointerActive = 1;
    this.pointerSpeed = Math.min(1, this.pointerSpeed + Math.hypot(dx, dy) * 8.5);
  }

  private performRaycast(): string | null {
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitProxies, false);
    if (hits.length > 0) {
      return (hits[0].object.userData.toolId as string) || null;
    }
    return null;
  }

  private handlePointerMove = (e: PointerEvent) => {
    this.updatePointerCoords(e);
    const now = performance.now();

    if (this.isDraggingScene && e.buttons === 0) {
      this.isDraggingScene = false;
    }

    if (this.isDraggingScene) {
      const dx = e.clientX - this.lastDragX;
      const dtMs = Math.max(8, now - this.lastDragMs);
      this.lastDragX = e.clientX;
      this.lastDragMs = now;

      const totalDist = Math.hypot(
        e.clientX - this.pointerDownPos.x,
        e.clientY - this.pointerDownPos.y
      );
      if (totalDist >= 5) {
        this.dragMoved = true;
        if (this.hoveredToolId !== null) {
          this.hoveredToolId = null;
          this.callbacks.onHoverChange?.(null);
        }
      }

      const widthPx = Math.max(320, this.container.clientWidth);
      const deltaDeg = (dx / widthPx) * 210;
      this.magneticRotation.angleDeg += deltaDeg;
      const instVel = (deltaDeg / dtMs) * 1000;
      this.magneticRotation.velocityDeg = Math.max(
        -240,
        Math.min(240, this.magneticRotation.velocityDeg * 0.45 + instVel * 0.55)
      );
      this.dragTilt.y = Math.max(-0.22, Math.min(0.22, this.dragTilt.y + deltaDeg * 0.0045));
      this.dragTilt.x = Math.max(-0.08, Math.min(0.08, -this.pointerNorm.y * 0.05));
      this.renderer.domElement.style.cursor = 'grabbing';
      return;
    }

    if (now - this.lastRaycastMs < 32) return;
    this.lastRaycastMs = now;

    const hitId = this.performRaycast();
    if (hitId !== this.hoveredToolId) {
      this.hoveredToolId = hitId;
      this.renderer.domElement.style.cursor = hitId ? 'pointer' : 'grab';
      const spec = hitId ? TOOLS_CATALOG.find((t) => t.id === hitId) ?? null : null;
      this.callbacks.onHoverChange?.(spec);
    }
  };

  private handlePointerDown = (e: PointerEvent) => {
    this.pointerDownPos.x = e.clientX;
    this.pointerDownPos.y = e.clientY;
    this.lastDragX = e.clientX;
    this.lastDragMs = performance.now();
    this.dragMoved = false;
    this.isDraggingScene = true;
    this.renderer.domElement.style.cursor = 'grabbing';
  };

  private handlePointerUp = (e: PointerEvent) => {
    this.updatePointerCoords(e);
    const wasDragging = this.isDraggingScene;
    this.isDraggingScene = false;
    const dist = Math.hypot(
      e.clientX - this.pointerDownPos.x,
      e.clientY - this.pointerDownPos.y
    );
    this.renderer.domElement.style.cursor = this.hoveredToolId
      ? 'pointer'
      : this.selectedToolId
        ? 'default'
        : 'grab';

    // Treat as click only if pointer didn't drag
    if (dist < 6 && !this.dragMoved) {
      const hitId = this.performRaycast();
      if (hitId) {
        this.focusTool(hitId);
      } else if (this.selectedToolId) {
        this.resetView();
      }
    } else if (wasDragging && performance.now() - this.lastDragMs > 90) {
      this.magneticRotation.velocityDeg = 0;
    }
    this.dragMoved = false;
  };

  private handlePointerLeave = () => {
    this.isDraggingScene = false;
    this.pointerNorm.x = 0;
    this.pointerNorm.y = 0;
    this.targetPointerActive = 0;
    if (this.hoveredToolId !== null) {
      this.hoveredToolId = null;
      this.callbacks.onHoverChange?.(null);
    }
    this.renderer.domElement.style.cursor = this.selectedToolId ? 'default' : 'grab';
  };

  // --- Public Control API ---

  private applyBloomState() {
    const cfg = computeBloomConfig(this.bloomIntensity);
    if (this.bloomPass) {
      this.bloomPass.enabled = cfg.strength > 0.001;
      this.bloomPass.strength = cfg.strength;
      this.bloomPass.radius = cfg.radius;
      this.bloomPass.threshold = cfg.threshold;
    }
    this.renderer.toneMappingExposure = this.activePreset.exposure - cfg.exposureTrim;
    this.iconHalos.forEach((sprite) => {
      sprite.material.opacity = Math.max(cfg.haloOpacity, 0.34);
      sprite.visible = true;
    });
  }

  public setBloomIntensity(intensity: number) {
    const cfg = computeBloomConfig(intensity);
    this.bloomIntensity = cfg.intensity;
    this.applyBloomState();
  }

  private applyDofState() {
    if (!this.bokehPass) return;
    const cfg = computeDofConfig(this.camera.position.z, this.currentFocusWorldZ, this.dofStrength);
    this.bokehPass.enabled = cfg.enabled;
    this.bokehPass.materialBokeh.uniforms['focus'].value = cfg.focus;
    this.bokehPass.materialBokeh.uniforms['aperture'].value = cfg.aperture;
    this.bokehPass.materialBokeh.uniforms['maxblur'].value = cfg.maxblur;
  }

  public setDofStrength(strength: number) {
    const cfg = computeDofConfig(this.camera.position.z, this.currentFocusWorldZ, strength);
    this.dofStrength = cfg.strength;
    this.applyDofState();
  }

  public applyLightingPreset(presetId: LightingPresetId) {
    const preset = LIGHTING_PRESETS[presetId];
    this.activePreset = preset;
    this.scene.background = null;
    this.scene.fog = new THREE.FogExp2('#080b18', 0.006);

    this.keyLight.color.set(preset.keyColor);
    this.keyLight.intensity = preset.keyIntensity;
    this.hemiLight.color.set(preset.hemiSkyColor);
    this.hemiLight.groundColor.set(preset.hemiGroundColor);
    this.hemiLight.intensity = preset.hemiIntensity;
    this.rimLight.color.set(preset.rimColor);
    this.rimLight.intensity = preset.rimIntensity;

    this.applyBloomState();
  }

  public setMotionPaused(paused: boolean) {
    this.motionPaused = paused;
  }

  public setAutoOrbit(enabled: boolean) {
    this.autoOrbit = enabled;
    this.controls.autoRotate = false;
  }

  public focusTool(toolId: string | null) {
    if (!toolId) {
      this.resetView();
      return;
    }
    const entry = this.icons.find((ic) => ic.spec.id === toolId);
    if (!entry) return;

    // Trigger slow, smooth individual 3D scatter that holds & returns after 2 seconds
    const cp = entry.anchorGroup.position;
    const prevScatter = this.scatterStates.get(entry.spec.id) ?? createIdleScatterState(2.0);
    this.scatterStates.set(
      entry.spec.id,
      triggerScatterState(prevScatter, [cp.x, cp.y, cp.z], this.clickCount++, 2.0)
    );

    // Slow, gentle localized micro-particle burst strictly at clicked icon
    if (!this.reducedMotion) {
      entry.anchorGroup.getWorldPosition(_vec3A);
      const burstAttr = this.scatterBurstPoints.geometry.attributes.position as THREE.BufferAttribute;
      const burstArr = burstAttr.array as Float32Array;
      const count = burstArr.length / 3;
      for (let i = 0; i < count; i++) {
        burstArr[i * 3] = _vec3A.x;
        burstArr[i * 3 + 1] = _vec3A.y;
        burstArr[i * 3 + 2] = _vec3A.z;

        const theta = (i / count) * Math.PI * 2 + (i % 3) * 0.35;
        const elev = ((i % 5) - 2) * 0.16;
        const speed = 1.05 + (i % 4) * 0.42;
        this.scatterBurstVelocities[i * 3] = Math.cos(theta) * speed;
        this.scatterBurstVelocities[i * 3 + 1] = Math.sin(theta) * speed * 0.8 + elev;
        this.scatterBurstVelocities[i * 3 + 2] = Math.sin(theta * 1.7) * 0.65;
      }
      burstAttr.needsUpdate = true;
      this.scatterBurstLife = this.scatterBurstDuration;
      this.scatterBurstPoints.visible = true;
    }
  }

  public resetView() {
    this.selectedToolId = null;
    this.callbacks.onSelectChange?.(null);
  }

  // --- Render Loop ---

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.ALREADY_SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.disposed || this.contextLost || !this.pageVisible || !this.heroVisible) return;

    const now = performance.now();
    const rawDt = (now - this.lastTimeMs) / 1000;
    this.lastTimeMs = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.12);

    if (!this.motionPaused && !this.reducedMotion) {
      this.elapsedSec += dt;
    }

    this.updateScene(dt);

    if (this.composer && !this.isSoftwareGl) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private updateScene(dt: number) {
    const t = this.elapsedSec;
    const orbitParams = getOrbitParams(this.currentAspect);
    _orbitPlane.normal.set(0, -Math.sin(orbitParams.tiltRad), Math.cos(orbitParams.tiltRad)).normalize();

    // Project cursor ray onto the tilted 3D orbit plane for responsive particle displacement
    let hasPointerWorld = false;
    if (this.pointerActive > 0.02 && Math.abs(this.pointerNdc.x) <= 1.2 && Math.abs(this.pointerNdc.y) <= 1.2) {
      this.raycaster.setFromCamera(this.pointerNdc, this.camera);
      if (this.raycaster.ray.intersectPlane(_orbitPlane, _pointerWorldOnOrbit)) {
        _pointerLocalOnOrbit.copy(_pointerWorldOnOrbit);
        this.constellationGroup.worldToLocal(_pointerLocalOnOrbit);
        hasPointerWorld = true;
      }
    }

    // Update orbit glow shader uniforms
    for (let i = 0; i < this.orbitGlowMaterials.length; i++) {
      const u = this.orbitGlowMaterials[i].uniforms;
      u.uTime.value = t;
      u.uPointerActive.value = hasPointerWorld ? this.pointerActive : 0;
      if (hasPointerWorld) {
        (u.uPointerPos.value as THREE.Vector3).copy(_pointerLocalOnOrbit);
      }
    }

    // Stream luminous particles along the orbit track and move them smoothly away on mouse hover
    if (this.orbitParticles) {
      const posAttr = this.orbitParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      const ptrLocal: [number, number, number] = [
        _pointerLocalOnOrbit.x,
        _pointerLocalOnOrbit.y,
        _pointerLocalOnOrbit.z,
      ];

      for (let i = 0; i < this.orbitParticleMeta.length; i++) {
        const meta = this.orbitParticleMeta[i];
        const frac = meta.baseFraction + (this.reducedMotion ? 0 : t * meta.speed);
        const [bx, by, bz] = sampleOrbitPoint(frac, this.currentAspect, 1);
        const wobble = this.reducedMotion ? 0 : Math.sin(t * 1.4 + meta.phase) * 0.055;
        const baseX = bx + meta.radialOffset[0] + wobble;
        const baseY = by + meta.radialOffset[1] + wobble * 0.7;
        const baseZ = bz + meta.radialOffset[2];

        const [tx, ty, tz] = hasPointerWorld
          ? computeParticleHoverDisplacement(
              [baseX, baseY, baseZ],
              ptrLocal,
              this.pointerActive,
              3.15,
              1.65
            )
          : ([0, 0, 0] as [number, number, number]);

        const offset = i * 3;
        const lambda = hasPointerWorld && (tx !== 0 || ty !== 0 || tz !== 0) ? 9.5 : 3.6;
        this.orbitParticleHoverOffsets[offset] = dampValue(this.orbitParticleHoverOffsets[offset], tx, lambda, dt);
        this.orbitParticleHoverOffsets[offset + 1] = dampValue(this.orbitParticleHoverOffsets[offset + 1], ty, lambda, dt);
        this.orbitParticleHoverOffsets[offset + 2] = dampValue(this.orbitParticleHoverOffsets[offset + 2], tz, lambda, dt);

        positions[offset] = baseX + this.orbitParticleHoverOffsets[offset];
        positions[offset + 1] = baseY + this.orbitParticleHoverOffsets[offset + 1];
        positions[offset + 2] = baseZ + this.orbitParticleHoverOffsets[offset + 2];
      }
      posAttr.needsUpdate = true;
    }

    // Move background stardust particles through world-space Z depth + displace on cursor hover
    if (this.dustPoints) {
      const positionAttr = this.dustPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = positionAttr.array as Float32Array;
      const ptrWorld: [number, number, number] = [
        _pointerWorldOnOrbit.x,
        _pointerWorldOnOrbit.y,
        _pointerWorldOnOrbit.z,
      ];

      for (let i = 0; i < this.dustVelocities.length; i++) {
        const offset = i * 3;
        let z = positions[offset + 2];
        if (!this.reducedMotion && !this.motionPaused) {
          z += this.dustVelocities[i] * dt;
          if (z > 12) z = -20;
        }
        const depthProgress = (z + 20) / 32;
        const perspectiveScale = 0.48 + depthProgress * 1.28;
        const baseX = this.dustBasePositions[offset] * perspectiveScale;
        const baseY =
          this.dustBasePositions[offset + 1] * perspectiveScale +
          (this.reducedMotion ? 0 : Math.sin(t * 0.4 + i * 0.17) * 0.14);

        const [tx, ty, tz] = hasPointerWorld
          ? computeParticleHoverDisplacement(
              [baseX, baseY, ptrWorld[2]],
              ptrWorld,
              this.pointerActive,
              3.4,
              1.65
            )
          : ([0, 0, 0] as [number, number, number]);

        const lambda = hasPointerWorld && (tx !== 0 || ty !== 0) ? 8.5 : 3.2;
        this.dustHoverOffsets[offset] = dampValue(this.dustHoverOffsets[offset], tx, lambda, dt);
        this.dustHoverOffsets[offset + 1] = dampValue(this.dustHoverOffsets[offset + 1], ty, lambda, dt);
        this.dustHoverOffsets[offset + 2] = dampValue(this.dustHoverOffsets[offset + 2], tz, lambda, dt);

        positions[offset] = baseX + this.dustHoverOffsets[offset];
        positions[offset + 1] = baseY + this.dustHoverOffsets[offset + 1];
        positions[offset + 2] = z + this.dustHoverOffsets[offset + 2];
      }
      positionAttr.needsUpdate = true;
    }

    // 1. Smooth continuous orbital auto-scrolling + magnetic 36-deg alignment when hovered/released
    const shouldAutoScroll =
      !this.motionPaused &&
      !this.reducedMotion &&
      !this.isDraggingScene &&
      !this.hoveredToolId &&
      !this.selectedToolId;
    const autoScrollSpeed = shouldAutoScroll ? 6.0 : 0;

    this.magneticRotation = stepMagneticRotation(
      this.magneticRotation,
      this.isDraggingScene,
      dt,
      36,
      autoScrollSpeed
    );
    if (Math.abs(this.magneticRotation.angleDeg - this.lastAppliedAngleDeg) > 1e-4) {
      this.lastAppliedAngleDeg = this.magneticRotation.angleDeg;
      const slots = computeOrbitalLayout(
        TOOLS_CATALOG,
        this.currentAspect,
        this.magneticRotation.angleDeg
      );
      for (let i = 0; i < this.icons.length; i++) {
        const slot = slots[i];
        this.icons[i].anchorGroup.position.set(
          slot.position[0],
          slot.position[1],
          slot.position[2]
        );
        this.icons[i].anchorGroup.rotation.set(
          slot.baseRotationX,
          slot.baseRotationY,
          slot.baseRotationZ
        );
      }
    }

    // 2. Smooth cursor parallax + damped drag tilt on the constellation container
    if (!this.reducedMotion) {
      this.smoothedParallax.x = dampValue(this.smoothedParallax.x, this.pointerNorm.x, 5.5, dt);
      this.smoothedParallax.y = dampValue(this.smoothedParallax.y, this.pointerNorm.y, 5.5, dt);
      if (!this.isDraggingScene) {
        this.dragTilt.x = dampValue(this.dragTilt.x, 0, 6.5, dt);
        this.dragTilt.y = dampValue(this.dragTilt.y, 0, 6.5, dt);
      }
      this.constellationGroup.rotation.y = this.smoothedParallax.x * 0.075 + this.dragTilt.y;
      this.constellationGroup.rotation.x = -this.smoothedParallax.y * 0.045 + this.dragTilt.x;
    }

    // 3. Per-icon floating, slow 2s scatter/return, uniform perspective size, and interactive hover tilt
    let activeGlowTarget: BuiltIconEntry | null = null;
    const bloomCfg = computeBloomConfig(this.bloomIntensity);
    const camDist = this.camera.position.z;

    for (let i = 0; i < this.icons.length; i++) {
      const entry = this.icons[i];
      const id = entry.spec.id;
      const isHovered = this.hoveredToolId === id;

      if (isHovered) {
        activeGlowTarget = entry;
      }

      const prevState = this.hoverStates.get(id)!;
      const nextState = stepHoverKinematics(prevState, isHovered, false, dt, false);
      this.hoverStates.set(id, nextState);

      const prevScatter = this.scatterStates.get(id) ?? createIdleScatterState(2.0);
      const nextScatter = stepIconScatterState(prevScatter, dt);
      this.scatterStates.set(id, nextScatter);

      const floatY = this.reducedMotion ? 0 : Math.sin(t * 1.05 + entry.spec.phase) * 0.035;
      const swayY = this.reducedMotion ? 0 : Math.sin(t * 0.6 + entry.spec.phase * 1.3) * 0.07;
      const swayX = this.reducedMotion ? 0 : Math.cos(t * 0.5 + entry.spec.phase) * 0.035;

      const hoverIntensity = Math.max(0, nextState.glowBoost);
      const hoverTiltX = -this.smoothedParallax.y * 0.16 * hoverIntensity;
      const hoverTiltY = this.smoothedParallax.x * 0.22 * hoverIntensity;

      entry.bodyGroup.position.set(
        nextScatter.offset[0],
        floatY + nextScatter.offset[1],
        nextState.zPull * 0.82 + nextScatter.offset[2]
      );
      entry.bodyGroup.rotation.set(
        swayX + nextScatter.rotKick[0] + hoverTiltX,
        swayY + nextScatter.rotKick[1] + hoverTiltY,
        nextScatter.rotKick[2]
      );

      // Equalize perspective depth foreshortening so all icons keep uniform screen size
      const uniformPerspectiveScale = computeUniformScreenScaleFactor(
        camDist,
        entry.anchorGroup.position.z
      );
      entry.bodyGroup.scale.setScalar(
        entry.spec.baseScale * uniformPerspectiveScale * nextState.scale
      );

      if (entry.spinSubGroup && !this.reducedMotion) {
        entry.spinSubGroup.rotation.z = t * 0.25 * (i % 2 === 0 ? 1 : -1);
      }

      // Calibrated emissive modulation: white icon faces stay strictly unclipped
      for (let g = 0; g < entry.glowTargets.length; g++) {
        const gt = entry.glowTargets[g];
        if (gt.isWhite) {
          gt.material.emissiveIntensity = gt.baseEmissive;
        } else {
          gt.material.emissiveIntensity = Math.max(
            0.02,
            gt.baseEmissive * bloomCfg.coloredEmissiveScale + Math.max(0, nextState.glowBoost) * 0.34
          );
        }
      }

      const halo = this.iconHalos.get(id);
      if (halo) {
        // Persistent soft bloom for every icon, with a subtle extra lift on hover.
        halo.material.opacity = 0.34 + Math.max(0, nextState.glowBoost) * 0.22;
        halo.visible = true;
      }
    }

    // 3b. Animate decorative GLB props (bubble, triangle, exclamation accents, sparkles)
    for (let i = 0; i < this.propEntries.length; i++) {
      const prop = this.propEntries[i];
      const phase = prop.slot.phase;
      const floatY = this.reducedMotion ? 0 : Math.sin(t * 0.95 + phase) * 0.12;
      const swayRot = this.reducedMotion ? 0 : Math.sin(t * 0.65 + phase) * 0.12;
      const sparklePulse = prop.slot.isSparkle && !this.reducedMotion
        ? 1 + Math.sin(t * 1.8 + phase) * 0.08
        : 1.0;

      prop.bodyGroup.position.set(0, floatY, 0);
      prop.bodyGroup.rotation.set(swayRot * 0.4, swayRot, prop.slot.isSparkle ? t * 0.3 : 0);
      prop.bodyGroup.scale.setScalar(prop.baseScale * sparklePulse);

      for (let g = 0; g < prop.glowTargets.length; g++) {
        const gt = prop.glowTargets[g];
        const pulse = prop.slot.isSparkle ? Math.sin(t * 1.8 + phase) * 0.08 : 0;
        gt.material.emissiveIntensity = Math.max(0.02, gt.baseEmissive + pulse);
      }
    }

    // 3c. Step slow, smooth localized scatter micro-particle burst
    if (this.scatterBurstLife > 0) {
      this.scatterBurstLife = Math.max(0, this.scatterBurstLife - dt);
      const burstAttr = this.scatterBurstPoints.geometry.attributes.position as THREE.BufferAttribute;
      const burstArr = burstAttr.array as Float32Array;
      for (let i = 0; i < burstArr.length; i += 3) {
        burstArr[i] += this.scatterBurstVelocities[i] * dt;
        burstArr[i + 1] += this.scatterBurstVelocities[i + 1] * dt;
        burstArr[i + 2] += this.scatterBurstVelocities[i + 2] * dt;
        this.scatterBurstVelocities[i] *= Math.exp(-1.5 * dt);
        this.scatterBurstVelocities[i + 1] *= Math.exp(-1.5 * dt);
        this.scatterBurstVelocities[i + 2] *= Math.exp(-1.5 * dt);
      }
      burstAttr.needsUpdate = true;
      const lifeRatio = this.scatterBurstLife / this.scatterBurstDuration;
      (this.scatterBurstPoints.material as THREE.PointsMaterial).opacity = lifeRatio * 0.58;
      if (this.scatterBurstLife <= 0) {
        this.scatterBurstPoints.visible = false;
      }
    }

    // 4. Hover accent light + interactive background fluted-glass resonance
    this.smoothedPointerUv.x = dampValue(this.smoothedPointerUv.x, this.pointerUv.x, 7.5, dt);
    this.smoothedPointerUv.y = dampValue(this.smoothedPointerUv.y, this.pointerUv.y, 7.5, dt);
    this.pointerActive = dampValue(this.pointerActive, this.targetPointerActive, 5.0, dt);
    this.pointerSpeed = dampValue(this.pointerSpeed, 0, 4.5, dt);

    if (activeGlowTarget) {
      activeGlowTarget.bodyGroup.getWorldPosition(_vec3A);
      const targetWorldZ = _vec3A.z;
      this.currentFocusWorldZ = dampValue(this.currentFocusWorldZ, targetWorldZ, 6.0, dt);

      _vec3B.copy(this.camera.position).sub(_vec3A).normalize().multiplyScalar(1.4);
      this.hoverPointLight.position.copy(_vec3A).add(_vec3B);
      _colorA.set(activeGlowTarget.spec.accentHex);
      this.hoverPointLight.color.lerp(_colorA, 1 - Math.exp(-8 * dt));
      this.hoverPointLight.intensity = dampValue(this.hoverPointLight.intensity, 1.45, 8.0, dt);

      _vec3A.project(this.camera);
      this.hoverShaderUv.x = dampValue(this.hoverShaderUv.x, _vec3A.x * 0.5 + 0.5, 10.0, dt);
      this.hoverShaderUv.y = dampValue(this.hoverShaderUv.y, _vec3A.y * 0.5 + 0.5, 10.0, dt);
      this.hoverShaderColor.lerp(_colorA, 1 - Math.exp(-8 * dt));
      this.hoverShaderBlend = dampValue(this.hoverShaderBlend, 1.0, 6.5, dt);
    } else {
      this.currentFocusWorldZ = dampValue(this.currentFocusWorldZ, 0.35, 4.5, dt);
      this.hoverPointLight.intensity = dampValue(this.hoverPointLight.intensity, 0, 8.0, dt);
      this.hoverShaderBlend = dampValue(this.hoverShaderBlend, 0.0, 5.5, dt);
    }
    this.applyDofState();

    this.flutedBg?.update({
      timeSec: t,
      width: Math.max(1, this.container.clientWidth),
      height: Math.max(1, this.container.clientHeight),
      mouseUvX: this.smoothedPointerUv.x,
      mouseUvY: this.smoothedPointerUv.y,
      mouseActive: this.pointerActive,
      mouseSpeed: this.pointerSpeed,
      hoverIconActive: this.hoverShaderBlend,
      hoverIconUvX: this.hoverShaderUv.x,
      hoverIconUvY: this.hoverShaderUv.y,
      hoverIconColor: this.hoverShaderColor,
    });

    // 5. Subtle stardust drift handled cleanly in primary particle loop above

    // 5b. Subtle studio ambient & rim light breathing pulse
    const targetBreathScale = this.reducedMotion ? 0 : 1.0;
    this.breathAmplitudeScale = dampValue(this.breathAmplitudeScale, targetBreathScale, 3.5, dt);
    const breath = computeAmbientBreathing(t, this.activePreset, this.breathAmplitudeScale);
    this.rimLight.intensity = breath.rimIntensity;
    this.hemiLight.intensity = breath.hemiIntensity;
    if (this.softboxLeft) {
      this.softboxLeft.intensity = 0.45 * breath.hemiFactor;
    }
    if (this.softboxRight) {
      this.softboxRight.intensity = 0.35 * breath.rimFactor;
    }

    this.controls.update();
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.unbindEvents();
    this.controls.dispose();
    this.bokehPass?.dispose();
    this.bloomPass?.dispose();
    this.composer?.dispose();
    this.textures.dispose();
    this.flutedBg?.dispose();
    this.glbAssets?.dispose();

    this.scene.traverse((obj) => {
      if (
        (obj as THREE.Mesh).isMesh ||
        (obj as THREE.Points).isPoints ||
        (obj as THREE.Line).isLine
      ) {
        const renderable = obj as THREE.Mesh | THREE.Points | THREE.Line;
        renderable.geometry?.dispose();
        if (Array.isArray(renderable.material)) {
          renderable.material.forEach((m) => m.dispose());
        } else {
          renderable.material?.dispose();
        }
      } else if ((obj as THREE.Sprite).isSprite) {
        (obj as THREE.Sprite).material?.dispose();
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
