import * as THREE from 'three';
import { BokehPass, type BokehPassParameters } from 'three/addons/postprocessing/BokehPass.js';

/**
 * BokehPass subclass that temporarily hides screen-space backdrops, invisible raycast proxies,
 * and additive sprite/point overlays during the scene depth pre-pass so only solid 3D meshes
 * write into the depth map.
 */
export class ShowcaseBokehPass extends BokehPass {
  private getDepthExcludedObjects: () => THREE.Object3D[];

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    params: BokehPassParameters,
    getDepthExcludedObjects: () => THREE.Object3D[]
  ) {
    super(scene, camera, params);
    this.getDepthExcludedObjects = getDepthExcludedObjects;
  }

  override render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget,
    deltaTime: number,
    maskActive: boolean
  ): void {
    const excluded = this.getDepthExcludedObjects();
    const prevVisibility: boolean[] = new Array(excluded.length);
    for (let i = 0; i < excluded.length; i++) {
      prevVisibility[i] = excluded[i].visible;
      excluded[i].visible = false;
    }

    try {
      super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    } finally {
      for (let i = 0; i < excluded.length; i++) {
        excluded[i].visible = prevVisibility[i];
      }
    }
  }
}
