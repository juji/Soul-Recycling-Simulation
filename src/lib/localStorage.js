// localStorage keys for parameter persistence
export const STORAGE_KEYS = {
  SPAWN_RATE: 'soul_simulation_spawn_rate',
  MIN_LIFESPAN: 'soul_simulation_min_lifespan',
  MAX_LIFESPAN: 'soul_simulation_max_lifespan'
};

// Helper functions for localStorage
export function loadFromStorage(key, defaultValue) {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (isNaN(parsed)) return defaultValue;

      // Validate bounds for each parameter
      if (key === STORAGE_KEYS.SPAWN_RATE) {
        return Math.max(0.1, Math.min(3.0, parsed));
      } else if (key === STORAGE_KEYS.MIN_LIFESPAN) {
        return Math.max(100, Math.min(800, parsed));
      } else if (key === STORAGE_KEYS.MAX_LIFESPAN) {
        return Math.max(200, Math.min(1500, parsed));
      }

      return parsed;
    }
  }
  return defaultValue;
}

export function saveToStorage(key, value) {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value.toString());
  }
}
