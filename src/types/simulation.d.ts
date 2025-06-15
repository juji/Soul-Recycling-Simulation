import * as THREE from 'three';

// Core simulation data types
export interface SoulData {
  id: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  speed: number;
  life: number; // Changed from lifespan to life
  isHuman: boolean;
  isDewa: boolean;
  flickerPhase: number;
  baseHSL: {
    h: number;
    s: number;
    l: number;
  };
}

export interface ConnectionData {
  start: [number, number, number];
  end: [number, number, number];
  color: [number, number, number];
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
    constants: PhysicsConstants;
  };
}

export interface WorkerAddSoulMessage extends WorkerMessage {
  type: 'addSoul';
  data: {
    soul: SoulData;
  };
}

export interface WorkerSoulUpdatedMessage {
  type: 'soulsUpdated';
  data: Array<{
    id: number;
    pos?: number[];
    vel?: number[];
    rgb?: number[];
    opacity?: number;
  }>;
  metadata: {
    messageId: number;
    totalSouls: number;
    compressionRatio: number;
    changedSouls: number;
  };
}

export interface WorkerConnectionsUpdatedMessage {
  type: 'connectionsUpdated';
  data: Array<{
    start: number[];
    end: number[];
    color: number[];
  }>;
}

export interface WorkerSoulRemovedMessage {
  type: 'soulRemoved';
  data: {
    soulId: number;
  };
}

export interface WorkerPerformanceMetrics {
  updateTime: number;
  processedSouls: number;
  connections: number;
  spatialGridCells: number;
  memoryUsage: number;
  compressionRatio?: number;
  deltaCompressionEfficiency?: number;
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

// Additional soul manager interfaces
export interface SoulWorkerData {
  id: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  speed: number;
  isHuman: boolean;
  isDewa: boolean;
  flickerPhase: number;
  life: number;
  baseHSL: { h: number; s: number; l: number };
}

export interface ConnectionData {
  start: [number, number, number];
  end: [number, number, number];
  color: [number, number, number];
}

export interface WorkerSoulUpdate {
  id: number;
  pos?: [number, number, number];
  rgb?: [number, number, number];
  opacity?: number;
}
