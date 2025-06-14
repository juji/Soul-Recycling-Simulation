// src/lib/stores/simulationState.svelte.js
// Simulation state management using Svelte 5 runes
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../localStorage.js';
import { DEFAULT_PARAMETERS, FEATURE_FLAGS } from '../constants/config.js';

// Create state object that can be mutated but not reassigned
const simulationState = $state({
  // Core simulation state
  souls: [],
  soulLookupMap: new Map(),
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
  NEW_SOUL_SPAWN_RATE: loadFromStorage(STORAGE_KEYS.SPAWN_RATE, 0.7),
  MIN_LIFESPAN: loadFromStorage(STORAGE_KEYS.MIN_LIFESPAN, 300),
  MAX_LIFESPAN: loadFromStorage(STORAGE_KEYS.MAX_LIFESPAN, 900),

  // Component references
  toastNotification: null,
  fpsCounter: null,

  // Managers
  instancedRenderer: null,
  lodManager: null,
  adaptivePerformanceManager: null
});

// Export getters for state access
export const souls = () => simulationState.souls;
export const soulLookupMap = () => simulationState.soulLookupMap;
export const renderingMode = () => simulationState.renderingMode;
export const currentQuality = () => simulationState.currentQuality;
export const isAutomaticSoulCount = () => simulationState.isAutomaticSoulCount;
export const performanceMetrics = () => simulationState.performanceMetrics;
export const container = () => simulationState.container;
export const mouse = () => simulationState.mouse;
export const NEW_SOUL_SPAWN_RATE = () => simulationState.NEW_SOUL_SPAWN_RATE;
export const MIN_LIFESPAN = () => simulationState.MIN_LIFESPAN;
export const MAX_LIFESPAN = () => simulationState.MAX_LIFESPAN;
export const toastNotification = () => simulationState.toastNotification;
export const fpsCounter = () => simulationState.fpsCounter;
export const instancedRenderer = () => simulationState.instancedRenderer;
export const lodManager = () => simulationState.lodManager;
export const adaptivePerformanceManager = () => simulationState.adaptivePerformanceManager;

// Derived values as functions
export const AVG_LIFESPAN = () => (simulationState.MIN_LIFESPAN + simulationState.MAX_LIFESPAN) / 2;
export const EQUILIBRIUM_POPULATION = () => simulationState.NEW_SOUL_SPAWN_RATE * AVG_LIFESPAN();

// State management functions
export function resetParameters() {
  simulationState.NEW_SOUL_SPAWN_RATE = DEFAULT_PARAMETERS.SPAWN_RATE;
  simulationState.MIN_LIFESPAN = DEFAULT_PARAMETERS.MIN_LIFESPAN;
  simulationState.MAX_LIFESPAN = DEFAULT_PARAMETERS.MAX_LIFESPAN;
  
  // Sync to localStorage
  saveToStorage(STORAGE_KEYS.SPAWN_RATE, DEFAULT_PARAMETERS.SPAWN_RATE);
  saveToStorage(STORAGE_KEYS.MIN_LIFESPAN, DEFAULT_PARAMETERS.MIN_LIFESPAN);
  saveToStorage(STORAGE_KEYS.MAX_LIFESPAN, DEFAULT_PARAMETERS.MAX_LIFESPAN);
  
  showToastMessage('Parameters reset to defaults');
}

export function updateCurrentQuality(newValue) {
  simulationState.currentQuality = newValue;
}

export function showToastMessage(message) {
  simulationState.toastNotification?.showToast(message);
}

export function adjustQualityBasedOnFPS(currentFPS) {
  if (currentFPS < 30 && simulationState.currentQuality !== 'low') {
    simulationState.currentQuality = 'medium';
    if (currentFPS < 20) simulationState.currentQuality = 'low';
  } else if (currentFPS > 50 && simulationState.currentQuality !== 'high') {
    if (simulationState.currentQuality === 'low') simulationState.currentQuality = 'medium';
    else if (simulationState.currentQuality === 'medium') simulationState.currentQuality = 'high';
  }
}

// Parameter setter functions for external components
export function setSpawnRate(value) {
  simulationState.NEW_SOUL_SPAWN_RATE = value;
  saveToStorage(STORAGE_KEYS.SPAWN_RATE, value);
}

export function setMinLifespan(value) {
  simulationState.MIN_LIFESPAN = value;
  saveToStorage(STORAGE_KEYS.MIN_LIFESPAN, value);
}

export function setMaxLifespan(value) {
  simulationState.MAX_LIFESPAN = value;
  saveToStorage(STORAGE_KEYS.MAX_LIFESPAN, value);
}

export function setAutomaticSoulCount(value) {
  simulationState.isAutomaticSoulCount = value;
}

// Manager setter functions
export function setInstancedRenderer(renderer) {
  simulationState.instancedRenderer = renderer;
}

export function setLodManager(manager) {
  simulationState.lodManager = manager;
}

export function setAdaptivePerformanceManager(manager) {
  simulationState.adaptivePerformanceManager = manager;
}

export function setRenderingMode(mode) {
  simulationState.renderingMode = mode;
}

export function setContainer(containerElement) {
  simulationState.container = containerElement;
}

export function setToastNotification(toast) {
  simulationState.toastNotification = toast;
}

export function setFpsCounter(fps) {
  simulationState.fpsCounter = fps;
}

// Soul management functions
export function addSoul(soul) {
  simulationState.souls.push(soul);
  simulationState.soulLookupMap.set(soul.userData.id, soul);
}

export function removeSoulById(soulId) {
  simulationState.souls = simulationState.souls.filter(s => s.userData.id !== soulId);
  simulationState.soulLookupMap.delete(soulId);
}

export function clearSouls() {
  simulationState.souls.length = 0; // Clear array while maintaining reference
  simulationState.soulLookupMap.clear();
}

// localStorage sync is handled in the setter functions to avoid orphan effects