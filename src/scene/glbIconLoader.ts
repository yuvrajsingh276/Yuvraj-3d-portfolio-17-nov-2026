import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import type { BuiltIconEntry } from './iconBuilders';
import {
  TOOLS_CATALOG,
  computeDecorativePropsLayout,
  type DecorativePropSlot,
  type ToolSpec,
} from './showcaseLogic';

export interface BuiltPropEntry {
  slot: DecorativePropSlot;
  anchorGroup: THREE.Group;
  bodyGroup: THREE.Group;
  baseScale: number;
  glowTargets: {
    material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
    baseEmissive: number;
  }[];
}

export interface GlbShowcaseAssets {
  icons: BuiltIconEntry[];
  props: BuiltPropEntry[];
  dispose: () => void;
}

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();

function cloneNodeWithUniqueMaterials(
  source: THREE.Object3D,
  isSoftwareGl: boolean,
  glowTargets: {
    material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
    baseEmissive: number;
    isWhite?: boolean;
  }[]
): THREE.Object3D {
  const cloned = source.clone(true);
  const materialCache = new Map<THREE.Material, THREE.Material>();

  cloned.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = !isSoftwareGl;
    mesh.receiveShadow = !isSoftwareGl;

    const handleMaterial = (mat: THREE.Material): THREE.Material => {
      const existing = materialCache.get(mat);
      if (existing) return existing;

      const copy = mat.clone();
      materialCache.set(mat, copy);

      if (
        copy instanceof THREE.MeshStandardMaterial ||
        copy instanceof THREE.MeshPhysicalMaterial
      ) {
        // Prevent white/bright icon faces from catching mirror-like studio glare
        copy.envMapIntensity = 0.16;
        copy.roughness = Math.max(copy.roughness ?? 0.45, 0.48);
        if (copy instanceof THREE.MeshPhysicalMaterial) {
          copy.clearcoat = Math.min(copy.clearcoat ?? 0, 0.22);
          copy.clearcoatRoughness = Math.max(copy.clearcoatRoughness ?? 0.35, 0.48);
          copy.specularIntensity = Math.min(copy.specularIntensity ?? 0.4, 0.2);
        }

        const colorLum =
          copy.color.r * 0.299 + copy.color.g * 0.587 + copy.color.b * 0.114;
        if (colorLum > 0.6) {
          // Cap bright white surfaces well below bloom threshold so only colored rims glow
          copy.color.multiplyScalar(0.76);
        }

        const emissiveSum = copy.emissive.r + copy.emissive.g + copy.emissive.b;
        if (emissiveSum > 0.02) {
          const isWhiteEmissive =
            copy.emissive.r > 0.52 && copy.emissive.g > 0.52 && copy.emissive.b > 0.52;
          const maxEmissive = isWhiteEmissive ? 0.06 : 0.48;
          const reducedBase = Math.min(
            maxEmissive,
            (copy.emissiveIntensity ?? 1.0) * (isWhiteEmissive ? 0.12 : 0.36)
          );
          copy.emissiveIntensity = reducedBase;
          glowTargets.push({
            material: copy,
            baseEmissive: reducedBase,
            isWhite: isWhiteEmissive || colorLum > 0.65,
          });
        }
      }
      return copy;
    };

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(handleMaterial);
    } else if (mesh.material) {
      mesh.material = handleMaterial(mesh.material);
    }
  });

  return cloned;
}

function normalizeModelGroup(
  node: THREE.Object3D,
  targetMaxDim: number
): THREE.Group {
  // Keep original Blender orientation & relative child transforms, reset root world offset
  node.position.set(0, 0, 0);

  const centerWrapper = new THREE.Group();
  centerWrapper.add(node);
  centerWrapper.updateMatrixWorld(true);

  _box.setFromObject(centerWrapper);
  _box.getCenter(_center);
  _box.getSize(_size);

  // Recenter model around local (0, 0, 0)
  node.position.sub(_center);

  const frontDim = Math.max(_size.x, _size.y, 0.001);
  const normScale = targetMaxDim / frontDim;
  centerWrapper.scale.setScalar(normScale);
  centerWrapper.updateMatrixWorld(true);

  return centerWrapper;
}

function buildGlbIconEntry(
  spec: ToolSpec,
  sourceNode: THREE.Object3D,
  isSoftwareGl: boolean,
  sharedHitGeo: THREE.SphereGeometry
): BuiltIconEntry {
  const anchorGroup = new THREE.Group();
  const bodyGroup = new THREE.Group();
  anchorGroup.add(bodyGroup);

  const glowTargets: BuiltIconEntry['glowTargets'] = [];
  const cloned = cloneNodeWithUniqueMaterials(sourceNode, isSoftwareGl, glowTargets);
  const normalizedGroup = normalizeModelGroup(cloned, 1.44);
  bodyGroup.add(normalizedGroup);

  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const hitProxy = new THREE.Mesh(sharedHitGeo, hitMat);
  hitProxy.userData.toolId = spec.id;
  bodyGroup.add(hitProxy);

  return {
    spec,
    anchorGroup,
    bodyGroup,
    hitProxy,
    glowTargets,
  };
}

function buildGlbPropEntry(
  slot: DecorativePropSlot,
  sourceNode: THREE.Object3D,
  isSoftwareGl: boolean
): BuiltPropEntry {
  const anchorGroup = new THREE.Group();
  const bodyGroup = new THREE.Group();
  anchorGroup.add(bodyGroup);

  const glowTargets: BuiltPropEntry['glowTargets'] = [];
  const cloned = cloneNodeWithUniqueMaterials(sourceNode, isSoftwareGl, glowTargets);
  const normalizedGroup = normalizeModelGroup(cloned, slot.targetSize);
  bodyGroup.add(normalizedGroup);

  anchorGroup.position.set(slot.position[0], slot.position[1], slot.position[2]);
  anchorGroup.rotation.set(slot.rotation[0], slot.rotation[1], slot.rotation[2]);

  return {
    slot,
    anchorGroup,
    bodyGroup,
    baseScale: 1.0,
    glowTargets,
  };
}

function findNodeByName(root: THREE.Object3D, name: string): THREE.Object3D | undefined {
  const exact = root.getObjectByName(name);
  if (exact) return exact;
  const sanitized = name.replace(/[\s.:/[\]]+/g, '_');
  const bySanitized = root.getObjectByName(sanitized);
  if (bySanitized) return bySanitized;

  const targetNorm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  let matched: THREE.Object3D | undefined;
  root.traverse((obj) => {
    if (!matched && obj.name.toLowerCase().replace(/[^a-z0-9]/g, '') === targetNorm) {
      matched = obj;
    }
  });
  return matched;
}

export async function loadGlbShowcaseAssets(
  modelUrl: string,
  dracoDecoderPath: string,
  isSoftwareGl: boolean,
  initialAspect = 1.6
): Promise<GlbShowcaseAssets> {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(dracoDecoderPath);

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  try {
    const gltf = await loader.loadAsync(modelUrl);
    const sharedHitGeo = new THREE.SphereGeometry(0.95, 14, 12);

    const icons: BuiltIconEntry[] = [];
    for (const spec of TOOLS_CATALOG) {
      const node = findNodeByName(gltf.scene, spec.glbNodeName);
      if (!node) {
        throw new Error(`Missing icon node "${spec.glbNodeName}" in ${modelUrl}`);
      }
      icons.push(buildGlbIconEntry(spec, node, isSoftwareGl, sharedHitGeo));
    }

    const propSlots = computeDecorativePropsLayout(initialAspect);
    const props: BuiltPropEntry[] = [];
    for (const slot of propSlots) {
      const node = findNodeByName(gltf.scene, slot.nodeName);
      if (node) {
        props.push(buildGlbPropEntry(slot, node, isSoftwareGl));
      }
    }

    // Dispose temporary original glTF scene references after cloning
    return {
      icons,
      props,
      dispose: () => {
        sharedHitGeo.dispose();
        gltf.scene.traverse((obj) => {
          const m = obj as THREE.Mesh;
          if (m.isMesh) {
            m.geometry?.dispose();
            if (Array.isArray(m.material)) {
              m.material.forEach((mat) => mat.dispose());
            } else {
              m.material?.dispose();
            }
          }
        });
      },
    };
  } finally {
    dracoLoader.dispose();
  }
}
