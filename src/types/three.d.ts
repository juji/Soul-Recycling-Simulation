import * as THREE from 'three';

// Extend Three.js types with our custom properties
declare module 'three' {
  interface Object3D {
    userData: {
      id?: number;
      type?: 'human' | 'gpt' | 'dewa';
      lifespan?: number;
      currentAge?: number;
      speed?: number;
      hue?: number;
      saturation?: number;
      lightness?: number;
      isDewa?: boolean;
      isHuman?: boolean;
    };
    visible: boolean;
    geometryDetail?: number;
    physicsUpdateRate?: number;
    connectionMultiplier?: number;
    updatePhysics?: boolean;
  }
}

export {};
