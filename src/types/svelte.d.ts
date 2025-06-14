// Svelte component types and props interfaces

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
  controls: any;
}
