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
  color?: THREE.Color;
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
  cullingEfficiency?: number;
}

export interface LODData {
  lod: keyof LODConfiguration;
  physicsUpdateRate: number;
  updatePhysics: boolean;
  connectionMultiplier: number;
}

export interface LODStatisticsExtended extends LODStatistics {
  visibleSouls: number;
  highDetailPercentage: number;
  cullingPercentage: number;
  lodThresholds: {
    medium: number;
    low: number;
    culled: number;
  };
}

export interface LODUpdateConfiguration {
  distances?: {
    medium?: number;
    low?: number;
    culled?: number;
  };
  geometryDetail?: {
    medium?: number;
    low?: number;
  };
  physicsRates?: {
    medium?: number;
    low?: number;
  };
}

export interface LODDebugInfo {
  lodStats: LODStatisticsExtended;
  lodLevels: LODConfiguration;
  frameCount: number;
  cameraPosition: {
    x: number;
    y: number;
    z: number;
  };
  distanceThresholds: {
    mediumSq: number;
    lowSq: number;
    culledSq: number;
  };
}

// Worker message types
export interface WorkerMessage {
  type: string;
  data: any;
}

export interface WorkerUpdateMessage extends WorkerMessage {
  type: 'UPDATE';
  data: {
    souls: Array<{
      id: number;
      position: { x: number; y: number; z: number };
      velocity: { x: number; y: number; z: number };
      hue: number;
      saturation: number;
      lightness: number;
    }>;
    connections: ConnectionData[];
    performanceData: {
      calculationTime: number;
      soulsProcessed: number;
    };
  };
}

export interface WorkerInitMessage extends WorkerMessage {
  type: 'INIT';
  data: {
    souls: SoulData[];
    constants: any;
  };
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

// Rendering mode types
export type RenderingMode = 'individual' | 'instanced';

// Soul creation parameters
export interface SoulCreationParams {
  isHuman: boolean;
  isDewa?: boolean;
  angle?: number;
  speed?: number;
  minLifespan: number;
  maxLifespan: number;
}

// Simulation state interface
export interface SimulationStateData {
  souls: THREE.Object3D[];
  soulLookupMap: Map<number, THREE.Object3D>;
  renderingMode: RenderingMode;
  currentQuality: string;
  isAutomaticSoulCount: number;
  mouse: { x: number; y: number };
  container?: HTMLElement;
}

// Physics constants types
export interface PhysicsConstants {
  INTERACTION_DISTANCE: number;
  POINTER_INTERACTION_RADIUS: number;
  POINTER_INFLUENCE_STRENGTH: number;
  NEIGHBOR_SPEED_INFLUENCE_RADIUS: number;
  NEIGHBOR_SPEED_INFLUENCE_STRENGTH: number;
  SEPARATION_DISTANCE: number;
  SEPARATION_STRENGTH: number;
  DEWA_ATTRACTION_RADIUS: number;
  DEWA_ATTRACTION_STRENGTH: number;
  DEWA_ENHANCEMENT_RADIUS: number;
  ENHANCEMENT_SATURATION_BOOST: number;
  ENHANCEMENT_LIGHTNESS_BOOST: number;
}
