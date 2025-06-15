<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // TypeScript interfaces
  interface ParameterChangeEvent {
    type: 'SPAWN_RATE' | 'MIN_LIFESPAN' | 'MAX_LIFESPAN';
    value: number;
  }

  interface SliderControlsProps {
    NEW_SOUL_SPAWN_RATE: number;
    MIN_LIFESPAN: number;
    MAX_LIFESPAN: number;
  }

  // Create event dispatcher with proper typing
  const dispatch = createEventDispatcher<{
    parameterChange: ParameterChangeEvent;
    reset: void;
  }>();

  // Convert to runes with $bindable for two-way binding and TypeScript typing
  let {
    NEW_SOUL_SPAWN_RATE = $bindable<number>(),
    MIN_LIFESPAN = $bindable<number>(),
    MAX_LIFESPAN = $bindable<number>(),
  }: SliderControlsProps = $props();

  const MAX_AGE_GAP: number = 600; // Maximum gap between min and max lifespan
  const MIN_LIFESPAN_VAL: number = 100;

  // Track previous values to detect changes with TypeScript typing
  let prevSpawnRate: number = NEW_SOUL_SPAWN_RATE;
  let prevMinLifespan: number = MIN_LIFESPAN;
  let prevMaxLifespan: number = MAX_LIFESPAN;

  // Watch for changes using effects
  $effect(() => {
    if (NEW_SOUL_SPAWN_RATE !== prevSpawnRate) {
      dispatch('parameterChange', {
        type: 'SPAWN_RATE',
        value: NEW_SOUL_SPAWN_RATE,
      });
      prevSpawnRate = NEW_SOUL_SPAWN_RATE;
    }
  });

  $effect(() => {
    if (MIN_LIFESPAN !== prevMinLifespan) {
      // Ensure max is always greater than min
      if (MIN_LIFESPAN > MAX_LIFESPAN) {
        MAX_LIFESPAN = MIN_LIFESPAN + MAX_AGE_GAP;
      }

      // Ensure age gap is maintained
      if (MAX_LIFESPAN - MIN_LIFESPAN > MAX_AGE_GAP) {
        MAX_LIFESPAN = MIN_LIFESPAN + MAX_AGE_GAP;
      }

      dispatch('parameterChange', {
        type: 'MIN_LIFESPAN',
        value: MIN_LIFESPAN,
      });
      prevMinLifespan = MIN_LIFESPAN;
    }
  });

  $effect(() => {
    if (MAX_LIFESPAN !== prevMaxLifespan) {
      // Ensure max is always greater than min
      if (MAX_LIFESPAN < MIN_LIFESPAN) {
        MIN_LIFESPAN = Math.max(MIN_LIFESPAN_VAL, MAX_LIFESPAN - MAX_AGE_GAP);
      }

      // Ensure age gap is maintained
      if (MAX_LIFESPAN - MIN_LIFESPAN > MAX_AGE_GAP) {
        MIN_LIFESPAN = Math.max(MIN_LIFESPAN_VAL, MAX_LIFESPAN - MAX_AGE_GAP);
      }

      dispatch('parameterChange', {
        type: 'MAX_LIFESPAN',
        value: MAX_LIFESPAN,
      });
      prevMaxLifespan = MAX_LIFESPAN;
    }
  });

  // Reset function with TypeScript typing
  function resetParameters(): void {
    NEW_SOUL_SPAWN_RATE = 0.7;
    MIN_LIFESPAN = 300;
    MAX_LIFESPAN = 900;
    dispatch('reset');
  }
</script>

<div class="parameter-controls">
  <div class="parameter-control">
    <label for="spawn-rate-slider">
      Soul Spawn Rate: {NEW_SOUL_SPAWN_RATE.toFixed(2)} per frame
    </label>
    <input
      id="spawn-rate-slider"
      type="range"
      min="0.1"
      max="3.0"
      step="0.05"
      bind:value={NEW_SOUL_SPAWN_RATE}
      class="parameter-slider"
    />
  </div>

  <div class="parameter-control">
    <label for="min-lifespan-slider">
      Min Lifespan: {MIN_LIFESPAN} frames
    </label>
    <input
      id="min-lifespan-slider"
      type="range"
      min={100}
      max={900}
      step="50"
      bind:value={MIN_LIFESPAN}
      class="parameter-slider"
    />
  </div>

  <div class="parameter-control">
    <label for="max-lifespan-slider">
      Max Lifespan: {MAX_LIFESPAN} frames
    </label>
    <input
      id="max-lifespan-slider"
      type="range"
      min="200"
      max="1000"
      step="50"
      bind:value={MAX_LIFESPAN}
      class="parameter-slider"
    />
  </div>

  <div class="parameter-control">
    <button class="reset-button" onclick={resetParameters}> Reset to Defaults </button>
  </div>
</div>

<style>
  .parameter-controls {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .parameter-control {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .parameter-control label {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 1);
    font-weight: 600;
  }

  .parameter-slider {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.2);
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
  }

  .parameter-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }

  .parameter-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
  }

  .parameter-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }

  .parameter-slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
  }

  .reset-button {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    color: white;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
  }

  .reset-button:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .reset-button:active {
    transform: translateY(1px);
  }
</style>
