// src/lib/constants/rendering.ts
// Rendering constants extracted from App.svelte

// Type definitions for rendering configuration
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface CameraSettings {
  FOV: number;
  NEAR: number;
  FAR: number;
  POSITION: Position3D;
}

export interface LightSettings {
  color: number;
  intensity: number;
  position?: Position3D;
  distance?: number;
}

export interface LightingSettings {
  AMBIENT: LightSettings;
  DIRECTIONAL: LightSettings & { position: Position3D };
  POINT_LIGHTS: Array<LightSettings & { position: Position3D; distance: number }>;
}

export interface SegmentSettings {
  width: number;
  height: number;
}

export interface MaterialOpacity {
  DEFAULT: number;
  DEWA: number;
}

export interface GeometrySettings {
  HUMAN_RADIUS: number;
  HUMAN_SEGMENTS: SegmentSettings;
  GPT_SIZE: number;
  DEWA_RADIUS: number;
  DEWA_SEGMENTS: SegmentSettings;
  MATERIAL_OPACITY: MaterialOpacity;
}

export interface LineSettings {
  OPACITY: number;
  VERTEX_COORDS: number;
  VERTICES_PER_LINE: number;
}

export interface ControlsSettings {
  DAMPING_FACTOR: number;
  W_MAX: number;
  ENABLE_PAN: boolean;
  ENABLE_ZOOM: boolean;
  ENABLE_ROTATE: boolean;
  MIN_DISTANCE: number;
  MAX_DISTANCE: number;
}

// Camera settings
export const CAMERA_SETTINGS: CameraSettings = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,
  POSITION: { x: 0, y: 30, z: 60 },
};

// Lighting settings
export const LIGHTING_SETTINGS: LightingSettings = {
  AMBIENT: { color: 0xffffff, intensity: 0.8 },
  DIRECTIONAL: {
    color: 0xffffff,
    intensity: 0.7,
    position: { x: -8, y: 10, z: 8 },
  },
  POINT_LIGHTS: [
    { color: 0xffccaa, intensity: 0.65, distance: 60, position: { x: 10, y: 4, z: 4 } },
    { color: 0xaaccff, intensity: 0.55, distance: 60, position: { x: -4, y: -6, z: -10 } },
    { color: 0xffffff, intensity: 0.5, distance: 25, position: { x: 0, y: 5, z: -2 } },
  ],
};

// Line settings
export const LINE_SETTINGS: LineSettings = {
  OPACITY: 0.42,
  VERTEX_COORDS: 3,
  VERTICES_PER_LINE: 2,
};

// Geometry settings - consolidated magic numbers
export const GEOMETRY_SETTINGS: GeometrySettings = {
  HUMAN_RADIUS: 0.15,
  HUMAN_SEGMENTS: { width: 12, height: 12 }, // Reduced from 16x16 for performance
  GPT_SIZE: 0.2,
  DEWA_RADIUS: 0.333,
  DEWA_SEGMENTS: { width: 20, height: 20 }, // Reduced from 32x32 for performance
  MATERIAL_OPACITY: {
    DEFAULT: 0.8,
    DEWA: 0.9,
  },
};

// ArcballControls settings
export const CONTROLS_SETTINGS: ControlsSettings = {
  DAMPING_FACTOR: 0.333, // Much lower for smoother, more responsive feel
  W_MAX: 1.3, // Higher for faster rotation capability
  ENABLE_PAN: true, // Allow panning
  ENABLE_ZOOM: true, // Allow zooming
  ENABLE_ROTATE: true, // Allow rotation
  MIN_DISTANCE: 10, // Minimum zoom distance
  MAX_DISTANCE: 300, // Maximum zoom distance
};

// Type guards and validation functions
export function validateCameraSettings(settings: any): settings is CameraSettings {
  return (
    typeof settings === 'object' &&
    typeof settings.FOV === 'number' &&
    settings.FOV > 0 &&
    typeof settings.NEAR === 'number' &&
    settings.NEAR > 0 &&
    typeof settings.FAR === 'number' &&
    settings.FAR > settings.NEAR &&
    typeof settings.POSITION === 'object' &&
    typeof settings.POSITION.x === 'number' &&
    typeof settings.POSITION.y === 'number' &&
    typeof settings.POSITION.z === 'number'
  );
}

export function validateLightingSettings(settings: any): settings is LightingSettings {
  return (
    typeof settings === 'object' &&
    validateLightSettings(settings.AMBIENT) &&
    validateLightSettings(settings.DIRECTIONAL) &&
    Array.isArray(settings.POINT_LIGHTS) &&
    settings.POINT_LIGHTS.every(
      (light: any) =>
        validateLightSettings(light) && typeof light.distance === 'number' && light.distance > 0
    )
  );
}

export function validateLightSettings(settings: any): settings is LightSettings {
  return (
    typeof settings === 'object' &&
    typeof settings.color === 'number' &&
    typeof settings.intensity === 'number' &&
    settings.intensity >= 0
  );
}

export function validateGeometrySettings(settings: any): settings is GeometrySettings {
  return (
    typeof settings === 'object' &&
    typeof settings.HUMAN_RADIUS === 'number' &&
    settings.HUMAN_RADIUS > 0 &&
    typeof settings.GPT_SIZE === 'number' &&
    settings.GPT_SIZE > 0 &&
    typeof settings.DEWA_RADIUS === 'number' &&
    settings.DEWA_RADIUS > 0 &&
    validateSegmentSettings(settings.HUMAN_SEGMENTS) &&
    validateSegmentSettings(settings.DEWA_SEGMENTS) &&
    validateMaterialOpacity(settings.MATERIAL_OPACITY)
  );
}

function validateSegmentSettings(settings: any): settings is SegmentSettings {
  return (
    typeof settings === 'object' &&
    typeof settings.width === 'number' &&
    settings.width > 0 &&
    typeof settings.height === 'number' &&
    settings.height > 0
  );
}

function validateMaterialOpacity(settings: any): settings is MaterialOpacity {
  return (
    typeof settings === 'object' &&
    typeof settings.DEFAULT === 'number' &&
    settings.DEFAULT >= 0 &&
    settings.DEFAULT <= 1 &&
    typeof settings.DEWA === 'number' &&
    settings.DEWA >= 0 &&
    settings.DEWA <= 1
  );
}

export function validateControlsSettings(settings: any): settings is ControlsSettings {
  return (
    typeof settings === 'object' &&
    typeof settings.DAMPING_FACTOR === 'number' &&
    settings.DAMPING_FACTOR >= 0 &&
    typeof settings.W_MAX === 'number' &&
    settings.W_MAX > 0 &&
    typeof settings.ENABLE_PAN === 'boolean' &&
    typeof settings.ENABLE_ZOOM === 'boolean' &&
    typeof settings.ENABLE_ROTATE === 'boolean' &&
    typeof settings.MIN_DISTANCE === 'number' &&
    settings.MIN_DISTANCE > 0 &&
    typeof settings.MAX_DISTANCE === 'number' &&
    settings.MAX_DISTANCE > settings.MIN_DISTANCE
  );
}
