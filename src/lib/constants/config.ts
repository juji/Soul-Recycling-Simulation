// src/lib/constants/config.ts
// Configuration constants extracted from App.svelte

// Type definitions for configuration
export interface FeatureFlags {
  USE_INSTANCED_RENDERING: boolean;
  USE_LOD_SYSTEM: boolean;
  FALLBACK_TO_INDIVIDUAL_MESHES: boolean;
}

export interface DefaultParameters {
  SPAWN_RATE: number;
  MIN_LIFESPAN: number;
  MAX_LIFESPAN: number;
}

// Feature flags with type safety
export const FEATURE_FLAGS: FeatureFlags = {
  USE_INSTANCED_RENDERING: true, // Enable Phase 3 instanced rendering
  USE_LOD_SYSTEM: true, // Enable Phase 4 LOD system
  FALLBACK_TO_INDIVIDUAL_MESHES: true // Emergency fallback
};

// Default values
export const DEFAULT_SOUL_COUNT: number = 999; // Fallback value when adaptive performance manager is not available

// Material pool settings
export const MATERIAL_POOL_SIZE: number = 20;

// Soul properties
export const DEWA_SPAWN_CHANCE: number = 0.05;
export const DEWA_BASE_SPEED: number = 0.02; // Slower, consistent speed for dewas

// Default parameter values for reset function
export const DEFAULT_PARAMETERS: DefaultParameters = {
  SPAWN_RATE: 0.7,
  MIN_LIFESPAN: 300,
  MAX_LIFESPAN: 900
};

// Type guards for runtime validation
export function isValidSpawnRate(value: number): boolean {
  return value >= 0.1 && value <= 3.0;
}

export function isValidLifespan(value: number): boolean {
  return value >= 100 && value <= 1500;
}

// Configuration validation
export function validateFeatureFlags(flags: Partial<FeatureFlags>): FeatureFlags {
  return {
    USE_INSTANCED_RENDERING: flags.USE_INSTANCED_RENDERING ?? FEATURE_FLAGS.USE_INSTANCED_RENDERING,
    USE_LOD_SYSTEM: flags.USE_LOD_SYSTEM ?? FEATURE_FLAGS.USE_LOD_SYSTEM,
    FALLBACK_TO_INDIVIDUAL_MESHES: flags.FALLBACK_TO_INDIVIDUAL_MESHES ?? FEATURE_FLAGS.FALLBACK_TO_INDIVIDUAL_MESHES
  };
}
