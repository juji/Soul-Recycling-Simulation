// src/lib/constants/config.js
// Configuration constants extracted from App.svelte

// Feature flags
export const FEATURE_FLAGS = {
  USE_INSTANCED_RENDERING: true, // Enable Phase 3 instanced rendering
  USE_LOD_SYSTEM: true, // Enable Phase 4 LOD system
  FALLBACK_TO_INDIVIDUAL_MESHES: true // Emergency fallback
};

// Default values
export const DEFAULT_SOUL_COUNT = 999; // Fallback value when adaptive performance manager is not available

// Material pool settings
export const MATERIAL_POOL_SIZE = 20;

// Soul properties
export const DEWA_SPAWN_CHANCE = 0.05;
export const DEWA_BASE_SPEED = 0.02; // Slower, consistent speed for dewas

// Default parameter values for reset function
export const DEFAULT_PARAMETERS = {
  SPAWN_RATE: 0.7,
  MIN_LIFESPAN: 300,
  MAX_LIFESPAN: 900
};