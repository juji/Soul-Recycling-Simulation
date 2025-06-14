// Svelte component types and props interfaces
import type * as THREE from 'three';
import type { CameraControls } from './three';

export interface FpsCounterProps {
  showCounter?: boolean;
  updateInterval?: number;
  averageWindowSize?: number;
}

export interface SliderControlsProps {
  NEW_SOUL_SPAWN_RATE: number;
  MIN_LIFESPAN: number;
  MAX_LIFESPAN: number;
}

export interface EntityLinksProps {
  showLinks?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  links?: Array<{
    value: number | null;
    label: string;
    isAuto?: boolean;
  }>;
}

export interface EquilibriumInfoProps {
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface ThreeContainerProps {
  onmousemove?: (event: { detail: { mouseX: number; mouseY: number } }) => void;
  onresize?: (event: { detail: { width: number; height: number } }) => void;
  container?: HTMLElement;
}

export interface ToastNotificationProps {
  duration?: number;
  position?: 'top' | 'bottom';
}

export interface PopulationCounterProps {
  showCounter?: boolean;
}

export interface BottomLinksProps {
  showLinks?: boolean;
}

// Scene Manager props
export interface SceneManagerProps {
  onsceneready?: (event: CustomEvent<SceneReadyEvent>) => void;
  onresize?: (event: CustomEvent<ResizeEvent>) => void;
}

// Simulation Manager props
export interface SimulationManagerProps {
  // No external props, but has bindable instance
}

// Event types for components
export interface MouseMoveEvent {
  mouseX: number;
  mouseY: number;
}

export interface ResizeEvent {
  width: number;
  height: number;
}

export interface ParameterChangeEvent {
  type: 'SPAWN_RATE' | 'MIN_LIFESPAN' | 'MAX_LIFESPAN';
  value: number;
}

export interface SceneReadyEvent {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  controls: CameraControls; // ArcballControls
}

// Component instance types
export interface FpsCounterInstance {
  getMetrics(): {
    fps: number;
    averageFPS: number;
    memoryUsage: number;
    frameTime: number;
  };
}

export interface ToastNotificationInstance {
  showToast(message: string): void;
}

export interface SimulationManagerInstance {
  handleSceneReady(sceneObjects: SceneReadyEvent): void;
}

// Custom event types for Svelte
export interface CustomEventMap {
  mousemove: CustomEvent<MouseMoveEvent>;
  resize: CustomEvent<ResizeEvent>;
  parameterChange: CustomEvent<ParameterChangeEvent>;
  sceneReady: CustomEvent<SceneReadyEvent>;
  reset: CustomEvent<void>;
  simulationReady: CustomEvent<{
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
    controls: CameraControls;
  }>;
}

// Type-safe event dispatcher
export interface TypedEventDispatcher<T extends Record<string, unknown>> {
  <K extends keyof T>(type: K, detail: T[K]): boolean;
}
