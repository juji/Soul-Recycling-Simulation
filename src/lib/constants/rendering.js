// src/lib/constants/rendering.js
// Rendering constants extracted from App.svelte

// Camera settings
export const CAMERA_SETTINGS = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,
  POSITION: { x: 0, y: 30, z: 60 }
};

// Lighting settings
export const LIGHTING_SETTINGS = {
  AMBIENT: { color: 0xffffff, intensity: 0.8 },
  DIRECTIONAL: { 
    color: 0xffffff, 
    intensity: 0.7, 
    position: { x: -8, y: 10, z: 8 } 
  },
  POINT_LIGHTS: [
    { color: 0xffccaa, intensity: 0.65, distance: 60, position: { x: 10, y: 4, z: 4 } },
    { color: 0xaaccff, intensity: 0.55, distance: 60, position: { x: -4, y: -6, z: -10 } },
    { color: 0xffffff, intensity: 0.5, distance: 25, position: { x: 0, y: 5, z: -2 } }
  ]
};

// Line settings
export const LINE_SETTINGS = {
  OPACITY: 0.42,
  VERTEX_COORDS: 3,
  VERTICES_PER_LINE: 2
};

// Geometry settings - consolidated magic numbers
export const GEOMETRY_SETTINGS = {
  HUMAN_RADIUS: 0.15,
  HUMAN_SEGMENTS: { width: 12, height: 12 }, // Reduced from 16x16 for performance
  GPT_SIZE: 0.2,
  DEWA_RADIUS: 0.333,
  DEWA_SEGMENTS: { width: 20, height: 20 }, // Reduced from 32x32 for performance
  MATERIAL_OPACITY: {
    DEFAULT: 0.8,
    DEWA: 0.9
  }
};

// ArcballControls settings
export const CONTROLS_SETTINGS = {
  DAMPING_FACTOR: 0.333,  // Much lower for smoother, more responsive feel
  W_MAX: 1.3,             // Higher for faster rotation capability
  ENABLE_PAN: true,       // Allow panning
  ENABLE_ZOOM: true,      // Allow zooming
  ENABLE_ROTATE: true,    // Allow rotation
  MIN_DISTANCE: 10,       // Minimum zoom distance
  MAX_DISTANCE: 300       // Maximum zoom distance
};