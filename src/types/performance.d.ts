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
  memory: any;
  gpu: any;
  deviceType: string;
  performance: string;
}

export interface AdaptiveConfig {
  targetFPS: number;
  minAcceptableFPS: number;
  maxAcceptableFPS: number;
  learningRate: number;
  adaptationSpeed: string;
  qualityLevels: Record<QualityLevel, QualitySettings>;
}

export interface AdaptivePerformanceOptions {
  debug?: boolean;
  enableLearning?: boolean;
  adaptationAggression?: 'conservative' | 'moderate' | 'aggressive';
  learningRate?: number;
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
  metrics: {
    avgFPS: number;
    sampleCount: number;
    memoryPressure: number;
    performanceScore: number;
  };
  hardwareProfile: HardwareProfile;
  recommendations: string[];
}
