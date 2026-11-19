import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import {
  CAMERA_BLENDER_VIEW,
  TOOLS_CATALOG,
  LIGHTING_PRESETS,
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
  getEarthOrbitConfig,
  sampleEarthRingPoint,
  computeEarthOrbitWithDuplicates,
  generateOrbitalInstanceSizes,
  alignOrbitalPointToDepthZ,
  computeParticleHoverDisplacement,
  computeOrbitAutoScrollSpeed,
  clampHoverTooltipPosition,
  type LightingPreset,
  type LightingPresetId,
  type ToolSpec,
  type DepthLayer,
  type OrbitalInstanceSlot,
  type HoverKinematicsState,
  type MagneticRotationState,
  type IconScatterState,
} from './showcaseLogic';
import {
  createFlutedAuroraBackground,
  type FlutedBackgroundController,
} from './flutedBackground';
import { createEarthPlanet, type EarthPlanetHandle } from './earthPlanet';
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
  onHoverAnchorChange?: (anchor: { x: number; y: number } | null) => void;
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
    ringIndex: number;
    baseThetaDeg: number;
    speedDeg: number;
    radialOffset: [number, number, number];
    phase: number;
  }[] = [];
  private orbitParticleHoverOffsets!: Float32Array;
  private orbitGlowMaterials: THREE.ShaderMaterial[] = [];
  private sparkleSprites: { sprite: THREE.Sprite; baseScale: number; phase: number }[] = [];
  private sparkleTextures: THREE.CanvasTexture[] = [];
  private flutedBg!: FlutedBackgroundController;
  private earthPlanet: EarthPlanetHandle | null = null;
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

  private hoveredInstanceId: string | null = null;
  private hoveredToolId: string | null = null;
  private selectedToolId: string | null = null;
  private motionPaused = false;
  private autoOrbit = false;
  private reducedMotion = false;
  private bloomIntensity = 0.22;
  private dofStrength = 0;
  private currentFocusWorldZ = 0.35;
  private hadHoverAnchor = false;
  private orbitParticleTime = 0;
  private iconHalos = new Map<string, THREE.Sprite>();
  private iconDepthMeta = new Map<
    string,
    { depthLayer: DepthLayer; depthScale: number; randomSizeScale: number; isVisibleInSky: boolean }
  >();
  private instanceSizeScales: Record<string, number> = generateOrbitalInstanceSizes(TOOLS_CATALOG);

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
    this.scene.fog = null;

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAnisotropy);

    const camDist = computeResponsiveCameraDistance(aspect);
    this.camera = new THREE.PerspectiveCamera(CAMERA_BLENDER_VIEW.fov, aspect, 0.1, 150);
    this.camera.position.set(
      CAMERA_BLENDER_VIEW.position[0],
      CAMERA_BLENDER_VIEW.position[1],
      camDist
    );
    this.camera.lookAt(
      CAMERA_BLENDER_VIEW.target[0],
      CAMERA_BLENDER_VIEW.target[1],
      CAMERA_BLENDER_VIEW.target[2]
    );

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
    const aspect =
      Math.max(1, this.container.clientWidth) / Math.max(1, this.container.clientHeight);
    const cfg = getEarthOrbitConfig(aspect);
    this.constellationGroup.position.set(0, cfg.earthCenterY, 0);
    this.scene.add(this.constellationGroup);

    // Fluted aurora backdrop stays disabled in favor of cosmic starfield background
    this.flutedBg = createFlutedAuroraBackground();
    this.flutedBg.mesh.visible = false;
    this.scene.add(this.flutedBg.mesh);

    // Central atmospheric 3D Earth emerging from lower horizon
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.earthPlanet = createEarthPlanet(cfg.earthRadius, maxAnisotropy);
    this.earthPlanet.group.position.set(0, 0, cfg.earthZ);
    this.constellationGroup.add(this.earthPlanet.group);

    // 5 crisp concentric circular orbital track lines centered on Earth
    this.initOrbitalGuideRing(aspect);

    this.initScatterBurstParticles();
  }

  private initOrbitalGuideRing(aspect: number) {
    this.orbitGuideRing = new THREE.Group();
    this.constellationGroup.add(this.orbitGuideRing);
    this.rebuildOrbitalGuideRing(aspect, this.magneticRotation.angleDeg);
    this.orbitGuideRing.visible = true;
  }

  /** Renders 5 crisp concentric circular orbital lines. */
  private rebuildOrbitalGuideRing(aspect: number, _angleOffsetDeg: number) {
    if (!this.orbitGuideRing) return;

    this.orbitGlowMaterials = [];
    for (const child of [...this.orbitGuideRing.children]) {
      this.orbitGuideRing.remove(child);
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      } else if ((child as THREE.Sprite).isSprite) {
        (child as THREE.Sprite).material?.dispose();
      }
    }

    const cfg = getEarthOrbitConfig(aspect);
    const isPortrait = aspect < 0.85;
    const halfWidth = isPortrait ? 0.022 : 0.0115;
    const lineOpacities = [0.36, 0.33, 0.29, 0.25, 0.22];

    cfg.ringRadii.forEach((radius, ringIndex) => {
      const ringZ = -0.35 + ringIndex * 0.16;
      const geo = new THREE.RingGeometry(radius - halfWidth, radius + halfWidth, 240, 1);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uBaseOpacity: { value: lineOpacities[ringIndex] ?? 0.24 },
          uRadius: { value: radius },
          uHalfW: { value: halfWidth },
          uPointerPos: { value: new THREE.Vector3() },
          uPointerActive: { value: 0 },
        },
        vertexShader: `
          varying vec3 vLocalPos;
          void main() {
            vLocalPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uBaseOpacity;
          uniform float uRadius;
          uniform float uHalfW;
          uniform vec3 uPointerPos;
          uniform float uPointerActive;
          varying vec3 vLocalPos;
          void main() {
            float angle = atan(vLocalPos.y, vLocalPos.x);
            float radialDist = abs(length(vLocalPos.xy) - uRadius);
            float aa = smoothstep(uHalfW, uHalfW * 0.12, radialDist);
            // Bright along upper celestial sky arc and gently tapering into dark horizon corners
            float skyFade = smoothstep(-0.18, 0.24, sin(angle));
            float shimmer = 0.92 + 0.08 * sin(angle * 3.0 - uTime * 0.7);
            float dPtr = distance(vec3(vLocalPos.xy, 0.0), vec3(uPointerPos.xy, 0.0));
            float hoverLift = smoothstep(3.6, 0.0, dPtr) * uPointerActive * 0.35;

            vec3 lineColor = mix(vec3(0.76, 0.80, 0.98), vec3(0.95, 0.92, 1.0), hoverLift);
            float alpha = clamp((uBaseOpacity * skyFade * shimmer + hoverLift * 0.28) * aa, 0.0, 0.88);
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(lineColor, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      this.orbitGlowMaterials.push(mat);

      const ringMesh = new THREE.Mesh(geo, mat);
      ringMesh.position.set(0, 0, ringZ);
      ringMesh.renderOrder = -20 + ringIndex;
      this.orbitGuideRing?.add(ringMesh);
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
        '/models/icon-with-orbit.glb',
        '/draco/',
        this.isSoftwareGl,
        aspect
      );
      if (this.disposed) {
        assets.dispose();
        return;
      }

      this.glbAssets = assets;
      const slots = computeEarthOrbitWithDuplicates(
        TOOLS_CATALOG,
        this.currentAspect,
        this.magneticRotation.angleDeg,
        this.instanceSizeScales
      );
      this.lastAppliedAngleDeg = this.magneticRotation.angleDeg;

      for (let i = 0; i < assets.icons.length; i++) {
        const built = assets.icons[i];
        const instId = built.instanceId ?? built.spec.id;
        this.attachIconHalo(built, instId);

        this.constellationGroup.add(built.anchorGroup);
        this.icons.push(built);
        this.hitProxies.push(built.hitProxy);
        this.hoverStates.set(instId, { zPull: 0, scale: 1.0, glowBoost: 0 });
        this.scatterStates.set(instId, createIdleScatterState(2.0));
      }
      this.applyIconSlots(slots);

      const propSlots = computeDecorativePropsLayout(this.currentAspect);
      for (let i = 0; i < assets.props.length; i++) {
        const prop = assets.props[i];
        const slot = propSlots[i];
        if (slot) {
          prop.anchorGroup.position.set(slot.position[0], slot.position[1], slot.position[2]);
          prop.anchorGroup.rotation.set(slot.rotation[0], slot.rotation[1], slot.rotation[2]);
        }
        // Render GLB star/sparkle icons in orbit, keep non-sparkle props hidden
        prop.anchorGroup.visible = slot ? slot.isSparkle : false;
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
    const slots = computeEarthOrbitWithDuplicates(
      TOOLS_CATALOG,
      aspect,
      this.magneticRotation.angleDeg,
      this.instanceSizeScales
    );
    this.lastAppliedAngleDeg = this.magneticRotation.angleDeg;

    for (let i = 0; i < TOOLS_CATALOG.length; i++) {
      const spec = TOOLS_CATALOG[i];
      for (const isDup of [false, true]) {
        const instId = isDup ? `${spec.id}__dup` : spec.id;
        const built = buildToolIcon(spec, this.textures);
        built.instanceId = instId;
        built.hitProxy.userData.instanceId = instId;
        this.attachIconHalo(built, instId);

        this.constellationGroup.add(built.anchorGroup);
        this.icons.push(built);
        this.hitProxies.push(built.hitProxy);
        this.hoverStates.set(instId, { zPull: 0, scale: 1.0, glowBoost: 0 });
        this.scatterStates.set(instId, createIdleScatterState(2.0));
      }
    }
    this.applyIconSlots(slots);
  }

  private applyIconSlots(slots: OrbitalInstanceSlot[]) {
    const earthCfg = getEarthOrbitConfig(this.currentAspect);
    const camPosZ = this.camera.position.z;

    for (let i = 0; i < this.icons.length; i++) {
      const slot = slots[i];
      if (!slot) continue;
      const entry = this.icons[i];
      const instId = entry.instanceId ?? entry.spec.id;
      const ringIdx = slot.ringIndex ?? 0;
      const ringZ = -0.35 + ringIdx * 0.16;
      const [ax, ay, az] = alignOrbitalPointToDepthZ(
        slot.position[0],
        slot.position[1],
        ringZ,
        slot.position[2],
        earthCfg.earthCenterY,
        camPosZ,
        CAMERA_BLENDER_VIEW.position[1]
      );
      entry.anchorGroup.position.set(ax, ay, az);
      entry.anchorGroup.rotation.set(
        slot.baseRotationX,
        slot.baseRotationY,
        slot.baseRotationZ
      );
      // Enforce strict single-visible-instance rule: only upper sky copy is visible at any moment
      entry.anchorGroup.visible = slot.isVisibleInSky;
      this.iconDepthMeta.set(instId, {
        depthLayer: slot.depthLayer ?? 'mid',
        depthScale: slot.depthScale ?? 0.9,
        randomSizeScale: slot.randomSizeScale,
        isVisibleInSky: slot.isVisibleInSky,
      });
    }
  }

  private attachIconHalo(entry: BuiltIconEntry, instanceId: string) {
    const sizeScale = this.instanceSizeScales[instanceId] ?? 0.78;
    const haloMat = new THREE.SpriteMaterial({
      map: this.textures.glowSprite,
      color: entry.spec.accentHex,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(haloMat);
    const haloSize = 1.87 * (0.65 + sizeScale * 0.45);
    sprite.scale.set(haloSize, haloSize, 1);
    sprite.position.set(0, 0, -0.18);
    sprite.visible = true;
    entry.bodyGroup.add(sprite);
    this.iconHalos.set(instanceId, sprite);
  }

  private initOrbitParticles() {
    const count = 260;
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
      const ringIndex = i % 5;
      const baseThetaDeg = -10 + rand() * 200;
      const speedDeg = 1.8 + rand() * 2.4;
      const bandSpread = 0.08;
      const radialOffset: [number, number, number] = [
        (rand() - 0.5) * bandSpread,
        (rand() - 0.5) * bandSpread,
        (rand() - 0.5) * 0.05,
      ];
      const phase = rand() * Math.PI * 2;
      this.orbitParticleMeta.push({ ringIndex, baseThetaDeg, speedDeg, radialOffset, phase });

      const [ox, oy, oz] = sampleEarthRingPoint(ringIndex, baseThetaDeg, aspect);
      positions[i * 3] = ox + radialOffset[0];
      positions[i * 3 + 1] = oy + radialOffset[1];
      positions[i * 3 + 2] = oz + radialOffset[2];

      // Restrained cosmic silver-lavender motes matching the planetary orbit aesthetic
      const tone = 0.72 + rand() * 0.25;
      colors[i * 3] = tone * 0.85;
      colors[i * 3 + 1] = tone * 0.88;
      colors[i * 3 + 2] = Math.min(1, tone * 1.06);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.078,
      map: this.textures.glowSprite,
      transparent: true,
      opacity: 0.45,
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
    const count = 620;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Deterministic seeded distribution for lush drifting cosmic sky stardust
    let seed = 4242;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#93c5fd'),
      new THREE.Color('#c4b5fd'),
      new THREE.Color('#e2e8f0'),
      new THREE.Color('#fde68a'),
    ];

    for (let i = 0; i < count; i++) {
      const spreadX = (rand() - 0.5) * 26;
      const spreadY = 0.5 + rand() * 14.5;

      positions[i * 3] = spreadX;
      positions[i * 3 + 1] = spreadY;
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
    for (let i = 0; i < count; i++) this.dustVelocities[i] = 1.6 + rand() * 1.9;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.115,
      map: this.textures.particleSprite,
      transparent: true,
      opacity: 0.52,
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
    this.controls.target.set(
      CAMERA_BLENDER_VIEW.target[0],
      CAMERA_BLENDER_VIEW.target[1],
      CAMERA_BLENDER_VIEW.target[2]
    );
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
    if (e.target !== this.renderer.domElement) {
      this.pointerNdc.set(99, 99);
      if (this.hoveredToolId !== null || this.hoveredInstanceId !== null) {
        this.hoveredToolId = null;
        this.hoveredInstanceId = null;
        this.renderer.domElement.style.cursor = this.selectedToolId ? 'default' : 'grab';
        if (this.hadHoverAnchor) {
          this.hadHoverAnchor = false;
          this.callbacks.onHoverAnchorChange?.(null);
        }
        this.callbacks.onHoverChange?.(null);
      }
      return;
    }
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

    // Recompute responsive concentric Earth planet scale, 5 orbit tracks, and 10 icon slots
    const earthCfg = getEarthOrbitConfig(aspect);
    this.constellationGroup.position.set(0, earthCfg.earthCenterY, 0);
    if (this.earthPlanet) {
      this.earthPlanet.setRadius(earthCfg.earthRadius);
      this.earthPlanet.group.position.set(0, 0, earthCfg.earthZ);
    }
    _vec3A.set(0, 0, 1);
    _orbitPlane.setFromNormalAndCoplanarPoint(_vec3A, this.constellationGroup.position);

    const targetDist = computeResponsiveCameraDistance(aspect);
    this.camera.fov = CAMERA_BLENDER_VIEW.fov;
    this.camera.position.set(
      CAMERA_BLENDER_VIEW.position[0],
      CAMERA_BLENDER_VIEW.position[1],
      targetDist
    );
    this.controls.target.set(
      CAMERA_BLENDER_VIEW.target[0],
      CAMERA_BLENDER_VIEW.target[1],
      CAMERA_BLENDER_VIEW.target[2]
    );
    this.controls.update();

    const slots = computeEarthOrbitWithDuplicates(
      TOOLS_CATALOG,
      aspect,
      this.magneticRotation.angleDeg,
      this.instanceSizeScales
    );
    this.lastAppliedAngleDeg = this.magneticRotation.angleDeg;
    this.rebuildOrbitalGuideRing(aspect, this.magneticRotation.angleDeg);
    this.applyIconSlots(slots);

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

  private performRaycast(): { instanceId: string; toolId: string } | null {
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const visibleProxies = this.hitProxies.filter((proxy) => {
      const parentAnchor = proxy.parent?.parent;
      return parentAnchor ? parentAnchor.visible : true;
    });
    const hits = this.raycaster.intersectObjects(visibleProxies, false);
    if (hits.length > 0) {
      const toolId = (hits[0].object.userData.toolId as string) || '';
      const instanceId = (hits[0].object.userData.instanceId as string) || toolId;
      if (toolId) return { instanceId, toolId };
    }
    return null;
  }

  private computeEntryScreenAnchor(entry: BuiltIconEntry): { x: number; y: number } {
    entry.bodyGroup.updateWorldMatrix(true, false);
    this.camera.updateMatrixWorld();
    entry.bodyGroup.getWorldPosition(_vec3A);
    _vec3A.project(this.camera);
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const rawX = (_vec3A.x * 0.5 + 0.5) * width;
    const rawY = (-_vec3A.y * 0.5 + 0.5) * height;
    const instId = entry.instanceId ?? entry.spec.id;
    const meta = this.iconDepthMeta.get(instId);
    const depthScale = (meta?.depthScale ?? 0.9) * (meta?.randomSizeScale ?? 0.8);
    const labelLift = 36 + depthScale * 24;
    return clampHoverTooltipPosition(rawX, rawY - labelLift, width, height);
  }

  private syncHoverFromRaycast(force = false) {
    if (this.isDraggingScene || !this.heroVisible) return;
    const now = performance.now();
    if (!force && now - this.lastRaycastMs < 48) return;
    this.lastRaycastMs = now;

    const hit = this.performRaycast();
    const hitInstanceId = hit?.instanceId ?? null;
    const hitToolId = hit?.toolId ?? null;
    if (hitInstanceId !== this.hoveredInstanceId) {
      this.hoveredInstanceId = hitInstanceId;
      this.hoveredToolId = hitToolId;
      this.renderer.domElement.style.cursor = hitInstanceId ? 'pointer' : 'grab';
      const spec = hitToolId ? TOOLS_CATALOG.find((t) => t.id === hitToolId) ?? null : null;
      if (hitInstanceId) {
        const entry = this.icons.find((ic) => (ic.instanceId ?? ic.spec.id) === hitInstanceId);
        if (entry) {
          this.hadHoverAnchor = true;
          this.callbacks.onHoverAnchorChange?.(this.computeEntryScreenAnchor(entry));
        }
      } else if (this.hadHoverAnchor) {
        this.hadHoverAnchor = false;
        this.callbacks.onHoverAnchorChange?.(null);
      }
      this.callbacks.onHoverChange?.(spec);
    }
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
        if (this.hoveredToolId !== null || this.hoveredInstanceId !== null) {
          this.hoveredToolId = null;
          this.hoveredInstanceId = null;
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

    this.syncHoverFromRaycast();
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
      const hit = this.performRaycast();
      if (hit) {
        this.focusTool(hit.instanceId);
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
    this.pointerNdc.set(99, 99);
    this.pointerNorm.x = 0;
    this.pointerNorm.y = 0;
    this.targetPointerActive = 0;
    if (this.hoveredToolId !== null || this.hoveredInstanceId !== null) {
      this.hoveredToolId = null;
      this.hoveredInstanceId = null;
      this.callbacks.onHoverChange?.(null);
    }
    if (this.hadHoverAnchor) {
      this.hadHoverAnchor = false;
      this.callbacks.onHoverAnchorChange?.(null);
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
    this.iconHalos.forEach((sprite, id) => {
      const depth = this.iconDepthMeta.get(id)?.depthLayer ?? 'mid';
      const baseHalo = depth === 'front' ? 0.42 : depth === 'back' ? 0.10 : 0.24;
      sprite.material.opacity = Math.max(cfg.haloOpacity * (depth === 'back' ? 0.35 : 1), baseHalo);
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
    this.scene.fog = null;

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

  public focusTool(instanceOrToolId: string | null) {
    if (!instanceOrToolId) {
      this.resetView();
      return;
    }
    const entry =
      this.icons.find((ic) => (ic.instanceId ?? ic.spec.id) === instanceOrToolId) ??
      this.icons.find((ic) => ic.spec.id === instanceOrToolId && ic.anchorGroup.visible);
    if (!entry) return;

    const instId = entry.instanceId ?? entry.spec.id;
    // Trigger slow, smooth individual 3D scatter that holds & returns after 2 seconds
    const cp = entry.anchorGroup.position;
    const prevScatter = this.scatterStates.get(instId) ?? createIdleScatterState(2.0);
    this.scatterStates.set(
      instId,
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
    _orbitPlane.normal.set(0, 0, 1);

    this.earthPlanet?.update(t);

    // Project cursor ray onto the Earth orbital plane for responsive particle & ring shimmer
    let hasPointerWorld = false;
    if (this.pointerActive > 0.02 && Math.abs(this.pointerNdc.x) <= 1.2 && Math.abs(this.pointerNdc.y) <= 1.2) {
      this.raycaster.setFromCamera(this.pointerNdc, this.camera);
      if (this.raycaster.ray.intersectPlane(_orbitPlane, _pointerWorldOnOrbit)) {
        _pointerLocalOnOrbit.copy(_pointerWorldOnOrbit);
        this.constellationGroup.worldToLocal(_pointerLocalOnOrbit);
        hasPointerWorld = true;
      }
    }

    // Update concentric orbital track shader uniforms & pulse line-connected star sparkles
    for (let i = 0; i < this.orbitGlowMaterials.length; i++) {
      const u = this.orbitGlowMaterials[i].uniforms;
      u.uTime.value = t;
      u.uPointerActive.value = hasPointerWorld ? this.pointerActive : 0;
      if (hasPointerWorld) {
        (u.uPointerPos.value as THREE.Vector3).copy(_pointerLocalOnOrbit);
      }
    }
    for (let i = 0; i < this.sparkleSprites.length; i++) {
      const sp = this.sparkleSprites[i];
      const pulse = this.reducedMotion ? 1.0 : 0.92 + 0.12 * Math.sin(t * 1.7 + sp.phase);
      sp.sprite.scale.setScalar(sp.baseScale * pulse);
    }

    if (!this.motionPaused && !this.reducedMotion) {
      this.orbitParticleTime += dt * (this.hoveredToolId ? 0.25 : 1.0);
    }

    // Stream subtle stardust particles gently along the 5 concentric Earth orbit rings
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
        const thetaDeg =
          meta.baseThetaDeg - (this.reducedMotion ? 0 : this.orbitParticleTime * meta.speedDeg);
        const [bx, by, bz] = sampleEarthRingPoint(meta.ringIndex, thetaDeg, this.currentAspect);
        const wobble = this.reducedMotion ? 0 : Math.sin(t * 1.1 + meta.phase) * 0.03;
        const baseX = bx + meta.radialOffset[0] + wobble;
        const baseY = by + meta.radialOffset[1] + wobble * 0.7;
        const baseZ = bz + meta.radialOffset[2];

        const [tx, ty, tz] = hasPointerWorld
          ? computeParticleHoverDisplacement(
              [baseX, baseY, baseZ],
              ptrLocal,
              this.pointerActive,
              2.8,
              1.3
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
      const orbitMaterial = this.orbitParticles.material as THREE.PointsMaterial;
      orbitMaterial.opacity = 0.42 + Math.sin(t * 1.4) * 0.05;
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

    // Keep hover state synchronized even when pointer stays still as icons orbit past
    if (!this.isDraggingScene && this.targetPointerActive > 0.5) {
      this.syncHoverFromRaycast();
    }

    // 1. Smooth continuous orbital auto-scrolling around Earth (slows gracefully when hovering an icon)
    const autoScrollSpeed = computeOrbitAutoScrollSpeed({
      motionPaused: this.motionPaused,
      reducedMotion: this.reducedMotion,
      isDragging: this.isDraggingScene,
      hasHoveredTool: Boolean(this.hoveredToolId),
      hasSelectedTool: Boolean(this.selectedToolId),
    });

    this.magneticRotation = stepMagneticRotation(
      this.magneticRotation,
      this.isDraggingScene,
      dt,
      36,
      autoScrollSpeed
    );
    if (Math.abs(this.magneticRotation.angleDeg - this.lastAppliedAngleDeg) > 1e-4) {
      this.lastAppliedAngleDeg = this.magneticRotation.angleDeg;
      const slots = computeEarthOrbitWithDuplicates(
        TOOLS_CATALOG,
        this.currentAspect,
        this.magneticRotation.angleDeg,
        this.instanceSizeScales
      );
      this.applyIconSlots(slots);
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

    // 3. Per-icon floating, slow 2s scatter/return, 50%-100% random size, and interactive hover tilt
    let activeGlowTarget: BuiltIconEntry | null = null;
    const bloomCfg = computeBloomConfig(this.bloomIntensity);
    const camDist = this.camera.position.z;

    for (let i = 0; i < this.icons.length; i++) {
      const entry = this.icons[i];
      const instId = entry.instanceId ?? entry.spec.id;
      const isHovered = this.hoveredInstanceId === instId;

      if (isHovered && entry.anchorGroup.visible) {
        activeGlowTarget = entry;
      }

      const prevState = this.hoverStates.get(instId)!;
      const nextState = stepHoverKinematics(prevState, isHovered, false, dt, false);
      this.hoverStates.set(instId, nextState);

      const prevScatter = this.scatterStates.get(instId) ?? createIdleScatterState(2.0);
      const nextScatter = stepIconScatterState(prevScatter, dt);
      this.scatterStates.set(instId, nextScatter);

      const floatY = this.reducedMotion ? 0 : Math.sin(t * 1.05 + entry.spec.phase + i * 0.37) * 0.035;
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

      // Apply perspective normalization + depth hierarchy + 50%-100% random per-instance size
      const uniformPerspectiveScale = computeUniformScreenScaleFactor(
        camDist,
        entry.anchorGroup.position.z
      );
      const depthMeta = this.iconDepthMeta.get(instId) ?? {
        depthLayer: 'mid' as DepthLayer,
        depthScale: 0.9,
        randomSizeScale: this.instanceSizeScales[instId] ?? 0.78,
        isVisibleInSky: true,
      };
      entry.bodyGroup.scale.setScalar(
        entry.spec.baseScale *
          uniformPerspectiveScale *
          depthMeta.depthScale *
          depthMeta.randomSizeScale *
          nextState.scale
      );

      if (entry.spinSubGroup && !this.reducedMotion) {
        entry.spinSubGroup.rotation.z = t * 0.25 * (i % 2 === 0 ? 1 : -1);
      }

      const depthEmissiveMult =
        depthMeta.depthLayer === 'front' ? 1.12 : depthMeta.depthLayer === 'back' ? 0.58 : 0.9;
      const depthHaloBase =
        depthMeta.depthLayer === 'front' ? 0.36 : depthMeta.depthLayer === 'back' ? 0.1 : 0.22;

      // Calibrated emissive modulation: white icon faces stay strictly unclipped
      for (let g = 0; g < entry.glowTargets.length; g++) {
        const gt = entry.glowTargets[g];
        if (gt.isWhite) {
          gt.material.emissiveIntensity = gt.baseEmissive * (depthMeta.depthLayer === 'back' ? 0.55 : 1.0);
        } else {
          gt.material.emissiveIntensity = Math.max(
            0.02,
            gt.baseEmissive * bloomCfg.coloredEmissiveScale * depthEmissiveMult +
              Math.max(0, nextState.glowBoost) * 0.34
          );
        }
      }

      const halo = this.iconHalos.get(instId);
      if (halo) {
        halo.material.opacity = depthHaloBase + Math.max(0, nextState.glowBoost) * 0.22;
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

      this.hadHoverAnchor = true;
      this.callbacks.onHoverAnchorChange?.(this.computeEntryScreenAnchor(activeGlowTarget));
    } else {
      this.currentFocusWorldZ = dampValue(this.currentFocusWorldZ, 0.35, 4.5, dt);
      this.hoverPointLight.intensity = dampValue(this.hoverPointLight.intensity, 0, 8.0, dt);
      this.hoverShaderBlend = dampValue(this.hoverShaderBlend, 0.0, 5.5, dt);
      if (this.hadHoverAnchor) {
        this.hadHoverAnchor = false;
        this.callbacks.onHoverAnchorChange?.(null);
      }
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
    this.earthPlanet?.dispose();
    for (const tex of this.sparkleTextures) {
      tex.dispose();
    }
    this.sparkleTextures = [];
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
