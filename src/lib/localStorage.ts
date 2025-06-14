// localStorage keys for parameter persistence
import type { StorageKeys } from '../types/index.js';

export const STORAGE_KEYS: StorageKeys = {
  SPAWN_RATE: 'soul_simulation_spawn_rate',
  MIN_LIFESPAN: 'soul_simulation_min_lifespan',
  MAX_LIFESPAN: 'soul_simulation_max_lifespan'
};

// Type-safe localStorage helper functions
export function loadFromStorage<T extends number | string | boolean>(
  key: string, 
  defaultValue: T
): T {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      // Handle different types appropriately
      if (typeof defaultValue === 'number') {
        const parsed = parseFloat(saved);
        if (isNaN(parsed)) return defaultValue;

        // Validate bounds for each parameter
        if (key === STORAGE_KEYS.SPAWN_RATE) {
          return Math.max(0.1, Math.min(3.0, parsed)) as T;
        } else if (key === STORAGE_KEYS.MIN_LIFESPAN) {
          return Math.max(100, Math.min(800, parsed)) as T;
        } else if (key === STORAGE_KEYS.MAX_LIFESPAN) {
          return Math.max(200, Math.min(1500, parsed)) as T;
        }

        return parsed as T;
      } else if (typeof defaultValue === 'boolean') {
        return (saved === 'true') as T;
      } else {
        return saved as T;
      }
    }
  }
  return defaultValue;
}

export function saveToStorage<T extends number | string | boolean>(
  key: string, 
  value: T
): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value.toString());
  }
}

// Type-safe parameter validation
export function validateParameter(key: string, value: number): number {
  switch (key) {
    case STORAGE_KEYS.SPAWN_RATE:
      return Math.max(0.1, Math.min(3.0, value));
    case STORAGE_KEYS.MIN_LIFESPAN:
      return Math.max(100, Math.min(800, value));
    case STORAGE_KEYS.MAX_LIFESPAN:
      return Math.max(200, Math.min(1500, value));
    default:
      return value;
  }
}
