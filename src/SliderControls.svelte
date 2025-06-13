<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let NEW_SOUL_SPAWN_RATE = 0.7;
  export let MIN_LIFESPAN = 300;
  export let MAX_LIFESPAN = 900;
  const MAX_AGE_GAP = 600; // Maximum gap between min and max lifespan

  function resetParameters() {
    NEW_SOUL_SPAWN_RATE = 0.7;
    MIN_LIFESPAN = 300;
    MAX_LIFESPAN = 900;
    dispatch('reset');
  }

  // Handle individual parameter changes
  function handleSpawnRateChange() {
    dispatch('parameterChange', {
      type: 'SPAWN_RATE',
      value: NEW_SOUL_SPAWN_RATE
    });
  }

  function handleMinLifespanChange() {
    dispatch('parameterChange', {
      type: 'MIN_LIFESPAN', 
      value: MIN_LIFESPAN
    });

    if(MIN_LIFESPAN > MAX_LIFESPAN) {
      MAX_LIFESPAN = MIN_LIFESPAN + MAX_AGE_GAP; // Ensure max is always greater than min
    }

    // encsure age gap is maintained
    if((MAX_LIFESPAN - MIN_LIFESPAN) > MAX_AGE_GAP) {
      MAX_LIFESPAN = MIN_LIFESPAN + MAX_AGE_GAP; // Ensure gap is maintained
    }
  }

  function handleMaxLifespanChange() {
    dispatch('parameterChange', {
      type: 'MAX_LIFESPAN',
      value: MAX_LIFESPAN
    });

    if(MAX_LIFESPAN < MIN_LIFESPAN) {
      MIN_LIFESPAN = MAX_LIFESPAN - MAX_AGE_GAP; // Ensure max is always greater than min
    }

    // ensure age gap is maintained
    if((MAX_LIFESPAN - MIN_LIFESPAN) > MAX_AGE_GAP) {
      MIN_LIFESPAN = MAX_LIFESPAN - MAX_AGE_GAP; // Ensure gap is maintained
    }
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
      on:change={handleSpawnRateChange}
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
      on:change={handleMinLifespanChange}
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
      on:change={handleMaxLifespanChange}
      class="parameter-slider"
    />
  </div>
  
  <div class="parameter-control">
    <button class="reset-button" on:click={resetParameters}>
      Reset to Defaults
    </button>
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
