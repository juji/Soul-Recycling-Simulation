import * as THREE from 'three';
import type { PerformanceMetrics } from '../types/performance';

interface SoulCounts {
  human: number;
  gpt: number;
  dewa: number;
}

interface InstancedMeshes {
  human: THREE.InstancedMesh;
  gpt: THREE.InstancedMesh;
  dewa: THREE.InstancedMesh;
}

interface InstancedRenderingOptions {
  maxSouls?: number;
  frustumCulling?: boolean;
  enableLOD?: boolean;
  updateFrequency?: number;
}

export class InstancedSoulRenderer {
  private scene: THREE.Scene;
  private maxSouls: number;
  private soulCounts: SoulCounts;
  private instancedMeshes!: InstancedMeshes;
  private tempMatrix: THREE.Matrix4;
  private tempColor: THREE.Color;
  private frustumCulling: boolean;
  private enableLOD: boolean;
  private updateFrequency: number;
  private lastUpdateTime: number = 0;
  private renderingMetrics: Partial<PerformanceMetrics> = {};

  constructor(scene: THREE.Scene, options: InstancedRenderingOptions = {}) {
    this.scene = scene;
    this.maxSouls = options.maxSouls ?? 5000;
    this.frustumCulling = options.frustumCulling ?? true;
    this.enableLOD = options.enableLOD ?? true;
    this.updateFrequency = options.updateFrequency ?? 60;

    this.soulCounts = { human: 0, gpt: 0, dewa: 0 };

    // Pre-allocate objects to reduce garbage collection
    this.tempMatrix = new THREE.Matrix4();
    this.tempColor = new THREE.Color();

    this.initializeInstancedMeshes();
  }

  private initializeInstancedMeshes(): void {
    // Human souls - spheres (reduced poly count for performance)
    const humanMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshBasicMaterial({
        transparent: true,
        // Note: vertexColors should NOT be used with instanceColor
      }),
      this.maxSouls
    );

    // GPT souls - cubes
    const gptMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshBasicMaterial({
        transparent: true,
      }),
      this.maxSouls
    );

    // Dewa souls - larger spheres (slightly reduced poly count)
    const dewaMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.333, 12, 12),
      new THREE.MeshBasicMaterial({
        transparent: true,
      }),
      this.maxSouls
    );

    this.instancedMeshes = {
      human: humanMesh,
      gpt: gptMesh,
      dewa: dewaMesh,
    };

    // Add all instanced meshes to scene and start with no visible instances
    Object.values(this.instancedMeshes).forEach(mesh => {
      mesh.count = 0;
      // Initialize instanceColor attribute for each mesh
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(this.maxSouls * 3),
        3
      );
      this.scene.add(mesh);
    });
  }

  public updateInstances(souls: THREE.Object3D[]): void {
    const startTime = performance.now();

    // Group souls by type for efficient processing
    const soulsByType: Record<keyof SoulCounts, THREE.Object3D[]> = {
      human: [],
      gpt: [],
      dewa: [],
    };

    souls.forEach(soul => {
      const type = this.getSoulType(soul);
      soulsByType[type].push(soul);
    });

    // Update each soul type's instanced mesh
    Object.entries(soulsByType).forEach(([type, typeSouls]) => {
      this.updateInstancedMesh(type as keyof SoulCounts, typeSouls);
    });

    // Update performance metrics
    const updateTime = performance.now() - startTime;
    this.renderingMetrics = {
      ...this.renderingMetrics,
      instancedUpdateTime: updateTime,
      soulsUpdated: souls.length,
      renderingMode: 'instanced',
    };
    this.lastUpdateTime = performance.now();
  }

  private updateInstancedMesh(type: keyof SoulCounts, souls: THREE.Object3D[]): void {
    const instancedMesh = this.instancedMeshes[type];
    const matrix = this.tempMatrix;
    const color = this.tempColor;

    if (souls.length === 0) {
      instancedMesh.count = 0;
      return;
    }

    // Safety check: prevent buffer overflow
    const soulCount = Math.min(souls.length, this.maxSouls);

    souls.slice(0, soulCount).forEach((soul, index) => {
      // Set transformation matrix (position only for now)
      matrix.setPosition(soul.position.x, soul.position.y, soul.position.z);
      instancedMesh.setMatrixAt(index, matrix);

      // Set per-instance color with better fallbacks
      if (soul.userData && soul.userData.finalRGB) {
        color.setRGB(
          soul.userData.finalRGB[0],
          soul.userData.finalRGB[1],
          soul.userData.finalRGB[2]
        );
      } else if (soul.userData && soul.userData.baseHSL) {
        color.setHSL(soul.userData.baseHSL.h, soul.userData.baseHSL.s, soul.userData.baseHSL.l);
      } else {
        // Fallback to white if no color data
        color.setRGB(1, 1, 1);
      }
      instancedMesh.setColorAt(index, color);
    });

    // Update instance count and mark for GPU update
    instancedMesh.count = soulCount;
    instancedMesh.instanceMatrix.needsUpdate = true;

    // Safety check for instanceColor attribute
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    // Update soul count for this type
    this.soulCounts[type] = soulCount;
  }

  private getSoulType(soul: THREE.Object3D): keyof SoulCounts {
    if (soul.userData?.isDewa) {
      return 'dewa';
    }
    if (soul.userData?.isHuman) {
      return 'human';
    }
    return 'gpt';
  }

  public getSoulCounts(): Readonly<SoulCounts> {
    return { ...this.soulCounts };
  }

  public getInstancedMesh(type: keyof SoulCounts): THREE.InstancedMesh {
    return this.instancedMeshes[type];
  }

  public getPerformanceMetrics(): Readonly<Partial<PerformanceMetrics>> {
    return { ...this.renderingMetrics };
  }

  public setMaxSouls(maxSouls: number): void {
    if (maxSouls !== this.maxSouls) {
      this.maxSouls = maxSouls;
      // Reinitialize with new max souls count
      this.dispose();
      this.initializeInstancedMeshes();
    }
  }

  public setFrustumCulling(enabled: boolean): void {
    this.frustumCulling = enabled;
    Object.values(this.instancedMeshes).forEach(mesh => {
      mesh.frustumCulled = enabled;
    });
  }

  public dispose(): void {
    Object.values(this.instancedMeshes).forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material: THREE.Material) => material.dispose());
      } else {
        mesh.material.dispose();
      }
    });
  }
}
