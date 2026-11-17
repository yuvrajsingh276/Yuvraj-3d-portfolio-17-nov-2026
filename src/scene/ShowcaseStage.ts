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
    this.initParticles();
    this.initControls();
    this.bindEvents();
    this.applyLightingPreset('obsidian');
    this.handleResize();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

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
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.84;
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.1)
    );
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = false;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.cursor = 'grab';
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D Creative Software Showcase');
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
    this.camera.position.set(0, 0.15, camDist);

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

  /** Thin glowing orbit sampled directly from the icon anchor positions. */
  private rebuildOrbitalGuideRing(aspect: number, angleOffsetDeg: number) {
    if (!this.orbitGuideRing) return;

    for (const child of [...this.orbitGuideRing.children]) {
      this.orbitGuideRing.remove(child);
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose();
    }

    const slots = computeOrbitalLayout(TOOLS_CATALOG, aspect, angleOffsetDeg);
    if (slots.length < 3) return;

    // A slim horizontal oval sits beneath the complete upper row of evenly spaced icons.
    const centerX = slots.reduce((sum, slot) => sum + slot.position[0], 0) / slots.length;
    const lowestIconY = Math.min(...slots.map((slot) => slot.position[1]));
    const centerY = lowestIconY - 0.42;
    const centerZ = Math.min(...slots.map((slot) => slot.position[2])) - 0.22;
    const radiusX = Math.max(...slots.map((slot) => Math.abs(slot.position[0] - centerX))) * 1.06;
    const radiusY = 0.14;
    const ovalPoints = Array.from({ length: 192 }, (_, i) => {
      const angle = (i / 192) * Math.PI * 2;
      return new THREE.Vector3(
        centerX + Math.cos(angle) * radiusX,
        centerY + Math.sin(angle) * radiusY,
        centerZ
      );
    });
    const curve = new THREE.CatmullRomCurve3(ovalPoints, true, 'centripetal', 0.35);
    const tubularSegments = 640;
    const radialSegments = 4;

    const makeGradientTube = (radius: number) => {
      const geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, true);
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

    // Very slim soft aura beneath an even finer, crisp gradient core.
    const aura = new THREE.Mesh(
      makeGradientTube(0.009),
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
      })
    );
    const core = new THREE.Mesh(
      makeGradientTube(0.0025),
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
      })
    );
    aura.renderOrder = -2;
    core.renderOrder = -1;
    (aura.material as THREE.Material).depthTest = false;
    (core.material as THREE.Material).depthTest = false;
    this.orbitGuideRing.add(aura, core);
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

      if (!this.isSoftwareGl) {
        this.renderer.compile(this.scene, this.camera);
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
    const localLight = new THREE.PointLight(entry.spec.accentHex, 2.2, 3.2, 2);
    localLight.position.set(0, 0, 0.32);
    entry.bodyGroup.add(localLight);

    const haloMat = new THREE.SpriteMaterial({
      map: this.textures.glowSprite,
      color: entry.spec.accentHex,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(haloMat);
    sprite.scale.set(2.35, 2.35, 1);
    sprite.position.set(0, 0, -0.18);
    sprite.visible = true;
    entry.bodyGroup.add(sprite);
    this.iconHalos.set(entry.spec.id, sprite);
  }

  private initParticles() {
    const count = 220;
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
      positions[i * 3 + 2] = Math.sin(theta) * r;

      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    this.dustBasePositions = new Float32Array(positions);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.085,
      map: this.textures.particleSprite,
      transparent: true,
      opacity: 0.36,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.dustPoints = new THREE.Points(geo, mat);
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
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private unbindEvents() {
    window.removeEventListener('resize', this.handleResize);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointerup', this.handlePointerUp);
    canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    canvas.removeEventListener('wheel', this.handleWheel);
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.callbacks.onContextLostChange?.(true);
  };

  private handleContextRestored = () => {
    this.callbacks.onContextLostChange?.(false);
  };

  private handleResize = () => {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const aspect = width / height;
    this.currentAspect = aspect;

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
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
    this.camera.position.set(0, 0.15, targetDist);
    this.controls.target.set(0, 0.15, 0);
    this.controls.update();
    this.applyDofState();
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

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    this.magneticRotation.velocityDeg = Math.max(
      -180,
      Math.min(180, this.magneticRotation.velocityDeg + delta * 0.18)
    );
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
    if (this.disposed) return;

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
    // Orbit guide intentionally remains stationary.

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
      this.rebuildOrbitalGuideRing(this.currentAspect, this.magneticRotation.angleDeg);
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

      const floatY = this.reducedMotion ? 0 : Math.sin(t * 1.05 + entry.spec.phase) * 0.14;
      const swayY = this.reducedMotion ? 0 : Math.sin(t * 0.6 + entry.spec.phase * 1.3) * 0.12;
      const swayX = this.reducedMotion ? 0 : Math.cos(t * 0.5 + entry.spec.phase) * 0.05;

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
            gt.baseEmissive * bloomCfg.coloredEmissiveScale + Math.max(0, nextState.glowBoost) * 0.22
          );
        }
      }

      const halo = this.iconHalos.get(id);
      if (halo) {
        // Persistent soft bloom for every icon, with a subtle extra lift on hover.
        halo.material.opacity = 0.34 + Math.max(0, nextState.glowBoost) * 0.12;
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

    // 5. Gentle floating stardust drift
    if (!this.motionPaused && !this.reducedMotion) {
      const posAttr = this.dustPoints.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] = this.dustBasePositions[i + 1] + Math.sin(t * 0.4 + i * 0.17) * 0.18;
      }
      posAttr.needsUpdate = true;
      this.dustPoints.rotation.y = t * 0.02;
    }

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
