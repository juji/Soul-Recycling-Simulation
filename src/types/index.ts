// Global type exports for the Soul Recycling Simulation
// This file provides a centralized export of all type definitions

// Re-export all types from individual modules
export type * from './performance';
export type * from './simulation';
export type * from './svelte';
export type * from './three';

// Re-export rendering constants types
export type {
  CameraSettings,
  ControlsSettings,
  GeometrySettings,
  LightSettings,
  LightingSettings,
  LineSettings,
  MaterialOpacity,
  Position3D,
  SegmentSettings,
} from '../lib/constants/rendering';

// Additional global types that don't fit in specific modules
export interface StorageKeys {
  SPAWN_RATE: string;
  MIN_LIFESPAN: string;
  MAX_LIFESPAN: string;
}

export interface Constants {
  DEFAULT_SOUL_COUNT: number;
  MATERIAL_POOL_SIZE: number;
  DEWA_SPAWN_CHANCE: number;
  DEWA_BASE_SPEED: number;
}

// Global window augmentations for development/testing
declare global {
  interface Window {
    performanceManager?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getPerformanceReport(): any; // Returns various performance data structures
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      forceQuality(quality: string): any; // Returns quality settings object
      enableDebugMode(): void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getModelInsights?(): any; // Optional method for AI insights
    };
    currentFPS?: number;
    averageFPS?: number;
    currentQuality?: string;
    soulCount?: number;
    memoryUsage?: number;
    hardwareProfile?: unknown;
    aiTestBridge?: unknown;
    __wheelEventPatched?: boolean;
  }

  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

export {};
