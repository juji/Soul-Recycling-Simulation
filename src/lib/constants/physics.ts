// src/lib/constants/physics.ts
// Physics constants extracted from App.svelte

// Type definitions for physics configuration
export interface ConnectionSettings {
  INTERACTION_DISTANCE: number;
  MAX_LINES_MULTIPLIER: number;
}

export interface PointerInteraction {
  RADIUS: number;
  STRENGTH: number;
}

export interface NeighborInfluence {
  RADIUS: number;
  STRENGTH: number;
}

export interface SeparationForce {
  DISTANCE: number;
  STRENGTH: number;
}

export interface DewaProperties {
  ATTRACTION_RADIUS: number;
  ATTRACTION_STRENGTH: number;
  ENHANCEMENT_RADIUS: number;
  ENHANCEMENT_SATURATION_BOOST: number;
  ENHANCEMENT_LIGHTNESS_BOOST: number;
}

// Physics constants from the simulation types
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

// Connection settings with type safety
export const CONNECTION_SETTINGS: ConnectionSettings = {
  INTERACTION_DISTANCE: 6,
  MAX_LINES_MULTIPLIER: 5 // Max lines = soul count * this multiplier
};

// Pointer interaction parameters
export const POINTER_INTERACTION_RADIUS: number = 10;
export const POINTER_INFLUENCE_STRENGTH: number = 0.05;

// Neighbor speed influence parameters
export const NEIGHBOR_SPEED_INFLUENCE_RADIUS: number = 5;
export const NEIGHBOR_SPEED_INFLUENCE_STRENGTH: number = 0.1;

// Boids-like separation parameters
export const SEPARATION_DISTANCE: number = 1.5;
export const SEPARATION_STRENGTH: number = 0.05;

// Dewa entity physics properties
export const DEWA_ATTRACTION_RADIUS: number = 15;
export const DEWA_ATTRACTION_STRENGTH: number = 0.005;

// Dewa enhancement properties
export const DEWA_ENHANCEMENT_RADIUS: number = 10; // Radius within which dewas enhance other souls
export const ENHANCEMENT_SATURATION_BOOST: number = 0.2; // How much to boost saturation (0 to 1)
export const ENHANCEMENT_LIGHTNESS_BOOST: number = 0.15; // How much to boost lightness (0 to 1)

// Consolidated physics constants object
export const PHYSICS_CONSTANTS: PhysicsConstants = {
  INTERACTION_DISTANCE: CONNECTION_SETTINGS.INTERACTION_DISTANCE,
  POINTER_INTERACTION_RADIUS,
  POINTER_INFLUENCE_STRENGTH,
  NEIGHBOR_SPEED_INFLUENCE_RADIUS,
  NEIGHBOR_SPEED_INFLUENCE_STRENGTH,
  SEPARATION_DISTANCE,
  SEPARATION_STRENGTH,
  DEWA_ATTRACTION_RADIUS,
  DEWA_ATTRACTION_STRENGTH,
  DEWA_ENHANCEMENT_RADIUS,
  ENHANCEMENT_SATURATION_BOOST,
  ENHANCEMENT_LIGHTNESS_BOOST
};

// Validation functions for physics parameters
export function isValidRadius(radius: number): boolean {
  return radius > 0 && radius <= 100;
}

export function isValidStrength(strength: number): boolean {
  return strength >= 0 && strength <= 1;
}

export function isValidDistance(distance: number): boolean {
  return distance > 0 && distance <= 50;
}

// Physics parameter validation
export function validatePhysicsConstants(constants: Partial<PhysicsConstants>): PhysicsConstants {
  return {
    INTERACTION_DISTANCE: Math.max(1, Math.min(20, constants.INTERACTION_DISTANCE ?? PHYSICS_CONSTANTS.INTERACTION_DISTANCE)),
    POINTER_INTERACTION_RADIUS: Math.max(1, Math.min(50, constants.POINTER_INTERACTION_RADIUS ?? PHYSICS_CONSTANTS.POINTER_INTERACTION_RADIUS)),
    POINTER_INFLUENCE_STRENGTH: Math.max(0, Math.min(1, constants.POINTER_INFLUENCE_STRENGTH ?? PHYSICS_CONSTANTS.POINTER_INFLUENCE_STRENGTH)),
    NEIGHBOR_SPEED_INFLUENCE_RADIUS: Math.max(1, Math.min(20, constants.NEIGHBOR_SPEED_INFLUENCE_RADIUS ?? PHYSICS_CONSTANTS.NEIGHBOR_SPEED_INFLUENCE_RADIUS)),
    NEIGHBOR_SPEED_INFLUENCE_STRENGTH: Math.max(0, Math.min(1, constants.NEIGHBOR_SPEED_INFLUENCE_STRENGTH ?? PHYSICS_CONSTANTS.NEIGHBOR_SPEED_INFLUENCE_STRENGTH)),
    SEPARATION_DISTANCE: Math.max(0.1, Math.min(10, constants.SEPARATION_DISTANCE ?? PHYSICS_CONSTANTS.SEPARATION_DISTANCE)),
    SEPARATION_STRENGTH: Math.max(0, Math.min(1, constants.SEPARATION_STRENGTH ?? PHYSICS_CONSTANTS.SEPARATION_STRENGTH)),
    DEWA_ATTRACTION_RADIUS: Math.max(1, Math.min(50, constants.DEWA_ATTRACTION_RADIUS ?? PHYSICS_CONSTANTS.DEWA_ATTRACTION_RADIUS)),
    DEWA_ATTRACTION_STRENGTH: Math.max(0, Math.min(1, constants.DEWA_ATTRACTION_STRENGTH ?? PHYSICS_CONSTANTS.DEWA_ATTRACTION_STRENGTH)),
    DEWA_ENHANCEMENT_RADIUS: Math.max(1, Math.min(30, constants.DEWA_ENHANCEMENT_RADIUS ?? PHYSICS_CONSTANTS.DEWA_ENHANCEMENT_RADIUS)),
    ENHANCEMENT_SATURATION_BOOST: Math.max(0, Math.min(1, constants.ENHANCEMENT_SATURATION_BOOST ?? PHYSICS_CONSTANTS.ENHANCEMENT_SATURATION_BOOST)),
    ENHANCEMENT_LIGHTNESS_BOOST: Math.max(0, Math.min(1, constants.ENHANCEMENT_LIGHTNESS_BOOST ?? PHYSICS_CONSTANTS.ENHANCEMENT_LIGHTNESS_BOOST))
  };
}
