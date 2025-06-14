import * as THREE from 'three';

// Extend Three.js types with our custom properties
declare module 'three' {
  interface Object3D {
    userData: {
      id?: number;
      type?: 'human' | 'gpt' | 'dewa';
      lifespan?: number;
      currentAge?: number;
      speed?: number;
      hue?: number;
      saturation?: number;
      lightness?: number;
      isDewa?: boolean;
      isHuman?: boolean;
      flickerPhase?: number;
      life?: number;
      baseHSL?: { h: number; s: number; l: number };
      velocity?: { x: number; y: number; z: number };
      finalRGB?: number[];
      finalOpacity?: number;
    };
    visible: boolean;
    geometryDetail?: number;
    physicsUpdateRate?: number;
    connectionMultiplier?: number;
    updatePhysics?: boolean;
    lod?: 'HIGH' | 'MEDIUM' | 'LOW' | 'CULLED';
  }

  interface Mesh {
    userData: {
      id?: number;
      type?: 'human' | 'gpt' | 'dewa';
      lifespan?: number;
      currentAge?: number;
      speed?: number;
      hue?: number;
      saturation?: number;
      lightness?: number;
      isDewa?: boolean;
      isHuman?: boolean;
      flickerPhase?: number;
      life?: number;
      baseHSL?: { h: number; s: number; l: number };
      velocity?: { x: number; y: number; z: number };
      finalRGB?: number[];
      finalOpacity?: number;
    };
    geometry: THREE.BufferGeometry;
    material: THREE.Material | THREE.Material[];
  }

  interface LineSegments {
    geometry: THREE.BufferGeometry;
    material: THREE.LineBasicMaterial;
  }
}

// Additional Three.js related types
export interface CameraControls {
  update: () => void;
  enableDamping?: boolean;
  dampingFactor?: number;
  wMax?: number;
  enablePan?: boolean;
  enableZoom?: boolean;
  enableRotate?: boolean;
  minDistance?: number;
  maxDistance?: number;
  setGizmosVisible?: (visible: boolean) => void;
}

export interface ThreeJSScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls?: CameraControls; // ArcballControls
}

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface ColorHSL {
  h: number;
  s: number;
  l: number;
}

export {};
