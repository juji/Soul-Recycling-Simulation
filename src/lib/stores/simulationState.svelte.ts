// src/lib/stores/simulationState.svelte.ts
// Simulation state management using Svelte 5 runes with TypeScript
import * as THREE from 'three';
import type { 
  PerformanceMetrics, 
  QualityLevel 
} from '../../types/performance';
import type { LODManager } from '../LODManager';
import type { AdaptivePerformanceManager } from '../AdaptivePerformanceManager';
import type { InstancedSoulRenderer } from '../InstancedSoulRenderer';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../localStorage';
import { DEFAULT_PARAMETERS, FEATURE_FLAGS } from '../constants/config';

// Component interfaces for type safety
interface ToastNotificationComponent {
  showToast(message: string, duration?: number): void;
}

interface FpsCounterComponent {
  getCurrentFPS(): number;
  getAverageFPS(): number;
}

// Mouse position interface
interface MousePosition {
  x: number;
  y: number;
}

// Simulation state interface
interface SimulationState {
  // Core simulation state
  souls: THREE.Object3D[];
  soulLookupMap: Map<number, THREE.Object3D>;
  renderingMode: 'individual' | 'instanced';
  currentQuality: QualityLevel;
  isAutomaticSoulCount: number;

  // Performance tracking state
  performanceMetrics: PerformanceMetrics;

  // Core Three.js objects
  container: HTMLElement | undefined;
  mouse: MousePosition;

  // Simulation parameters with localStorage sync
  NEW_SOUL_SPAWN_RATE: number;
  MIN_LIFESPAN: number;
  MAX_LIFESPAN: number;

  // Component references
  toastNotification: ToastNotificationComponent | null;
  fpsCounter: FpsCounterComponent | null;

  // Managers
  instancedRenderer: InstancedSoulRenderer | null;
  lodManager: LODManager | null;
  adaptivePerformanceManager: AdaptivePerformanceManager | null;
}

// Create state object that can be mutated but not reassigned
const simulationState = $state<SimulationState>({
  // Core simulation state
  souls: [],
  soulLookupMap: new Map<number, THREE.Object3D>(),
  renderingMode: FEATURE_FLAGS.USE_INSTANCED_RENDERING ? 'instanced' : 'individual',
  currentQuality: 'high',
  isAutomaticSoulCount: 0,

  // Performance tracking state
  performanceMetrics: {
    renderingMode: 'individual',
    drawCalls: 0,
    instancedUpdateTime: 0,
    individualUpdateTime: 0,
    soulsUpdated: 0
  },

  // Core Three.js objects
  container: undefined,
  mouse: { x: 0, y: 0 },

  // Simulation parameters with localStorage sync
  NEW_SOUL_SPAWN_RATE: loadFromStorage(STORAGE_KEYS.SPAWN_RATE, DEFAULT_PARAMETERS.SPAWN_RATE),
  MIN_LIFESPAN: loadFromStorage(STORAGE_KEYS.MIN_LIFESPAN, DEFAULT_PARAMETERS.MIN_LIFESPAN),
  MAX_LIFESPAN: loadFromStorage(STORAGE_KEYS.MAX_LIFESPAN, DEFAULT_PARAMETERS.MAX_LIFESPAN),

  // Component references
  toastNotification: null,
  fpsCounter: null,

  // Managers
  instancedRenderer: null,
  lodManager: null,
  adaptivePerformanceManager: null
});

// Export getters for state access
export const souls = (): THREE.Object3D[] => simulationState.souls;
export const soulLookupMap = (): Map<number, THREE.Object3D> => simulationState.soulLookupMap;
export const renderingMode = (): 'individual' | 'instanced' => simulationState.renderingMode;
export const currentQuality = (): QualityLevel => simulationState.currentQuality;
export const isAutomaticSoulCount = (): number => simulationState.isAutomaticSoulCount;
export const performanceMetrics = (): PerformanceMetrics => simulationState.performanceMetrics;
export const container = (): HTMLElement | undefined => simulationState.container;
export const mouse = (): MousePosition => simulationState.mouse;
export const NEW_SOUL_SPAWN_RATE = (): number => simulationState.NEW_SOUL_SPAWN_RATE;
export const MIN_LIFESPAN = (): number => simulationState.MIN_LIFESPAN;
export const MAX_LIFESPAN = (): number => simulationState.MAX_LIFESPAN;
export const toastNotification = (): ToastNotificationComponent | null => simulationState.toastNotification;
export const fpsCounter = (): FpsCounterComponent | null => simulationState.fpsCounter;
export const instancedRenderer = (): InstancedSoulRenderer | null => simulationState.instancedRenderer;
export const lodManager = (): LODManager | null => simulationState.lodManager;
export const adaptivePerformanceManager = (): AdaptivePerformanceManager | null => simulationState.adaptivePerformanceManager;

// Derived values as functions
export const AVG_LIFESPAN = (): number => (simulationState.MIN_LIFESPAN + simulationState.MAX_LIFESPAN) / 2;
export const EQUILIBRIUM_POPULATION = (): number => simulationState.NEW_SOUL_SPAWN_RATE * AVG_LIFESPAN();

// State management functions
export function resetParameters(): void {
  simulationState.NEW_SOUL_SPAWN_RATE = DEFAULT_PARAMETERS.SPAWN_RATE;
  simulationState.MIN_LIFESPAN = DEFAULT_PARAMETERS.MIN_LIFESPAN;
  simulationState.MAX_LIFESPAN = DEFAULT_PARAMETERS.MAX_LIFESPAN;
  
  // Sync to localStorage
  saveToStorage(STORAGE_KEYS.SPAWN_RATE, DEFAULT_PARAMETERS.SPAWN_RATE);
  saveToStorage(STORAGE_KEYS.MIN_LIFESPAN, DEFAULT_PARAMETERS.MIN_LIFESPAN);
  saveToStorage(STORAGE_KEYS.MAX_LIFESPAN, DEFAULT_PARAMETERS.MAX_LIFESPAN);
  
  showToastMessage('Parameters reset to defaults');
}

export function updateCurrentQuality(newValue: QualityLevel): void {
  simulationState.currentQuality = newValue;
}

export function showToastMessage(message: string): void {
  simulationState.toastNotification?.showToast(message);
}

export function adjustQualityBasedOnFPS(currentFPS: number): void {
  if (currentFPS < 30 && simulationState.currentQuality !== 'low') {
    simulationState.currentQuality = 'medium';
    if (currentFPS < 20) simulationState.currentQuality = 'low';
  } else if (currentFPS > 50 && simulationState.currentQuality !== 'high') {
    if (simulationState.currentQuality === 'low') simulationState.currentQuality = 'medium';
    else if (simulationState.currentQuality === 'medium') simulationState.currentQuality = 'high';
  }
}

// Parameter setter functions for external components
export function setSpawnRate(value: number): void {
  simulationState.NEW_SOUL_SPAWN_RATE = value;
  saveToStorage(STORAGE_KEYS.SPAWN_RATE, value);
}

export function setMinLifespan(value: number): void {
  simulationState.MIN_LIFESPAN = value;
  saveToStorage(STORAGE_KEYS.MIN_LIFESPAN, value);
}

export function setMaxLifespan(value: number): void {
  simulationState.MAX_LIFESPAN = value;
  saveToStorage(STORAGE_KEYS.MAX_LIFESPAN, value);
}

export function setAutomaticSoulCount(value: number): void {
  simulationState.isAutomaticSoulCount = value;
}

// Manager setter functions
export function setInstancedRenderer(renderer: InstancedSoulRenderer): void {
  simulationState.instancedRenderer = renderer;
}

export function setLodManager(manager: LODManager | null): void {
  simulationState.lodManager = manager;
}

export function setAdaptivePerformanceManager(manager: AdaptivePerformanceManager | null): void {
  simulationState.adaptivePerformanceManager = manager;
}

export function setRenderingMode(mode: 'individual' | 'instanced'): void {
  simulationState.renderingMode = mode;
}

export function setContainer(containerElement: HTMLElement): void {
  simulationState.container = containerElement;
}

export function setToastNotification(toast: ToastNotificationComponent): void {
  simulationState.toastNotification = toast;
}

export function setFpsCounter(fps: FpsCounterComponent): void {
  simulationState.fpsCounter = fps;
}

// Mouse position setter
export function setMousePosition(x: number, y: number): void {
  simulationState.mouse.x = x;
  simulationState.mouse.y = y;
}

// Performance metrics setter
export function setPerformanceMetrics(metrics: PerformanceMetrics): void {
  simulationState.performanceMetrics = metrics;
}

// Soul management functions
export function addSoul(soul: THREE.Object3D): void {
  simulationState.souls.push(soul);
  if (soul.userData.id !== undefined) {
    simulationState.soulLookupMap.set(soul.userData.id, soul);
  }
}

export function removeSoulById(soulId: number): void {
  simulationState.souls = simulationState.souls.filter(s => s.userData.id !== soulId);
  simulationState.soulLookupMap.delete(soulId);
}

export function clearSouls(): void {
  simulationState.souls.length = 0; // Clear array while maintaining reference
  simulationState.soulLookupMap.clear();
}

// Get soul by ID
export function getSoulById(soulId: number): THREE.Object3D | undefined {
  return simulationState.soulLookupMap.get(soulId);
}

// Get soul count
export function getSoulCount(): number {
  return simulationState.souls.length;
}

// localStorage sync is handled in the setter functions to avoid orphan effects
