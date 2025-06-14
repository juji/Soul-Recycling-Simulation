// Global type exports for the Soul Recycling Simulation
// This file provides a centralized export of all type definitions

// Re-export all types from individual modules
export * from './three.d.ts';
export * from './simulation.d.ts';
export * from './performance.d.ts';
export * from './svelte.d.ts';

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
    performanceManager?: any;
    currentFPS?: number;
    averageFPS?: number;
    currentQuality?: string;
    soulCount?: number;
    memoryUsage?: number;
    hardwareProfile?: any;
    aiTestBridge?: any;
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
