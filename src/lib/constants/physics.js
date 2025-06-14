// src/lib/constants/physics.js
// Physics constants extracted from App.svelte

// Connection settings
export const CONNECTION_SETTINGS = {
  INTERACTION_DISTANCE: 6,
  MAX_LINES_MULTIPLIER: 5 // Max lines = soul count * this multiplier
};

// Pointer interaction parameters
export const POINTER_INTERACTION_RADIUS = 10;
export const POINTER_INFLUENCE_STRENGTH = 0.05;

// Neighbor speed influence parameters
export const NEIGHBOR_SPEED_INFLUENCE_RADIUS = 5;
export const NEIGHBOR_SPEED_INFLUENCE_STRENGTH = 0.1;

// Boids-like separation parameters
export const SEPARATION_DISTANCE = 1.5;
export const SEPARATION_STRENGTH = 0.05;

// Dewa entity physics properties
export const DEWA_ATTRACTION_RADIUS = 15;
export const DEWA_ATTRACTION_STRENGTH = 0.005;

// Dewa enhancement properties
export const DEWA_ENHANCEMENT_RADIUS = 10; // Radius within which dewas enhance other souls
export const ENHANCEMENT_SATURATION_BOOST = 0.2; // How much to boost saturation (0 to 1)
export const ENHANCEMENT_LIGHTNESS_BOOST = 0.15; // How much to boost lightness (0 to 1)