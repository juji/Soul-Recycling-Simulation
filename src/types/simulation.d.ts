import * as THREE from 'three';

// Core simulation data types
export interface SoulData {
  id: number;
  type: 'human' | 'gpt' | 'dewa';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifespan: number;
  currentAge: number;
  speed: number;
  hue: number;
  saturation: number;
  lightness: number;
  isDewa: boolean;
  isHuman: boolean;
}

export interface ConnectionData {
  soul1Id: number;
  soul2Id: number;
  distance: number;
  strength: number;
}

export interface LODLevel {
  distance: number;
  geometryDetail: number;
  physicsUpdateRate: number;
  culled: boolean;
  connectionMultiplier: number;
}

export interface LODConfiguration {
  HIGH: LODLevel;
  MEDIUM: LODLevel;
  LOW: LODLevel;
  CULLED: LODLevel;
}

export interface LODStatistics {
  high: number;
  medium: number;
  low: number;
  culled: number;
  totalSouls: number;
  performanceGain: number;
  memoryReduction: number;
  lastUpdateTime: number;
  lodCalculationTime?: number;
}

export interface LODData {
  lod: string;
  physicsUpdateRate: number;
  updatePhysics: boolean;
  connectionMultiplier: number;
}

// Worker message types
export interface WorkerMessage {
  type: string;
  data: any;
}

export interface WorkerMessageHandler {
  (data: any): void;
}

// Animation controller types
export interface AnimationCallbacks {
  onSoulSpawn?: () => void;
  onWorkerUpdate?: (data: any) => void;
}

export interface SceneObjects {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  controls: any; // ArcballControls type
}
