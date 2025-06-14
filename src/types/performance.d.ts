// Performance management types

export interface PerformanceMetrics {
  renderingMode: 'individual' | 'instanced';
  drawCalls: number;
  instancedUpdateTime: number;
  individualUpdateTime: number;
  soulsUpdated: number;
}

export interface QualitySettings {
  maxSouls: number;
  maxConnectionChecks: number;
  connectionLimit: number;
  geometryDetail: { sphere: [number, number]; human: [number, number] };
  updateRate: number;
  enableAdvancedEffects: boolean;
  spatialGridSize: number;
  maxLines: number;
  lodDistances: { medium: number; low: number; culled: number };
  lodGeometryDetail: { high: number; medium: number; low: number };
  lodPhysicsRates: { high: number; medium: number; low: number };
  lodConnectionMultipliers: { high: number; medium: number; low: number };
  physicsLOD: boolean;
  aggressiveCulling: boolean;
}

export type QualityLevel = 'ultra' | 'high' | 'medium' | 'low' | 'minimal';

export interface HardwareProfile {
  cpuCores: number;
  memory: {
    total: number | 'unknown';
    category: 'low' | 'medium' | 'high';
  };
  gpu: {
    renderer: string;
    category: 'low' | 'medium' | 'high';
    webgl2: boolean;
  };
  deviceType: 'mobile' | 'desktop-mac' | 'desktop-windows' | 'desktop-linux' | 'desktop-unknown';
  performance: 'unknown' | 'low' | 'medium' | 'high' | 'ultra';
}

export interface MemoryInfo {
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
}

export interface GPUInfo {
  renderer: string;
  category: 'low' | 'medium' | 'high' | 'ultra';
  webgl2: boolean;
}

export interface AdaptiveConfig {
  targetFPS: number;
  minAcceptableFPS: number;
  maxAcceptableFPS: number;
  learningRate: number;
  adaptationSpeed: 'conservative' | 'moderate' | 'aggressive';
  metricsWindowSize: number;
  fpsStabilityThreshold: number;
  memoryPressureThreshold: number;
  adaptationCooldown: number;
  qualityLevels: Record<QualityLevel, QualitySettings>;
}

export interface AdaptivePerformanceOptions {
  debug?: boolean;
  enableLearning?: boolean;
  adaptationAggression?: 'conservative' | 'moderate' | 'aggressive';
  learningRate?: number;
  metricsWindowSize?: number;
}

export interface AdaptationMetrics {
  fps: number[];
  frameTime: number[];
  memory: number[];
  workerTime: number[];
  renderTime: number[];
  soulCount: number;
}

export interface AdaptationHistory {
  timestamp: number;
  from: QualityLevel;
  to: QualityLevel;
  reason: string;
  metrics: {
    avgFPS: number;
    fpsStability: number;
    memoryPressure: number;
    performanceScore: number;
    soulCount: number;
  };
}

export interface PerformanceTracker {
  fpsHistory: Array<{
    fps: number;
    soulCount: number;
    quality: QualityLevel;
    memory: number;
    timestamp: number;
  }>;
  performanceMaps: Map<number, number>;
  qualityBenchmarks: Map<QualityLevel, Array<{
    soulCount: number;
    fps: number;
    timestamp: number;
  }>>;
  adaptationSuccess: any[];
  hardwareBaseline: any;
}

export interface AdaptationThresholds {
  critical: {
    fps: number;
    memory: number;
  };
  target: {
    fps: number;
    stability: number;
  };
  headroom: {
    fps: number;
    stability: number;
    memory: number;
  };
  performanceScore: {
    low: number;
    high: number;
  };
}

export interface FPSMetrics {
  fps: number;
  averageFPS: number;
  frameTime: number;
  memory: number;
  workerTime: number;
  renderTime: number;
}

export interface PerformanceReport {
  currentQuality: QualityLevel;
  avgFPS: number;
  fpsStability: number;
  memoryPressure: number;
  performanceScore: number;
  adaptationHistory: AdaptationHistory[];
  hardwareProfile: HardwareProfile;
  measurementCount: number;
  qualityBenchmarks: Record<QualityLevel, {
    avgFPS: number;
    sampleCount: number;
  }>;
}

export interface AdaptationMetrics {
  fps: number[];
  frameTime: number[];
  memory: number[];
  workerTime: number[];
  renderTime: number[];
  soulCount: number;
}

// LOD specific performance types
export interface LODPerformanceData {
  high: number;
  medium: number;
  low: number;
  culled: number;
  totalProcessed: number;
  calculationTime: number;
}

// FPS Counter specific types
export interface FPSCounterMetrics {
  fps: number;
  averageFPS: number;
  memoryUsage: number;
  frameTime: number;
}
