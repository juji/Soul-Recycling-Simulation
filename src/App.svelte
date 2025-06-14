<!-- App.svelte - Simplified with SimulationManager (Phase 6c) -->
<script>
  import { onMount } from 'svelte';
  import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './lib/localStorage.js';
  import { DEFAULT_SOUL_COUNT } from './lib/constants/config.js';
  
  import FpsCounter from './components/FpsCounter.svelte';
  import PopulationCounter from './components/PopulationCounter.svelte';
  import EntityLinks from './components/EntityLinks.svelte';
  import ToastNotification from './components/ToastNotification.svelte';
  import BottomLinks from './components/BottomLinks.svelte';
  import EquilibriumInfo from './components/EquilibriumInfo.svelte';
  import ThreeContainer from './components/ThreeContainer.svelte';
  import SceneManager from './components/simulation/SceneManager.svelte';
  import SimulationManager from './components/simulation/SimulationManager.svelte';
  import './lib/ai-test-bridge.js';
  
  // Import state management store
  import { 
    renderingMode as getRenderingMode,
    isAutomaticSoulCount as getIsAutomaticSoulCount,
    mouse as getMouse,
    NEW_SOUL_SPAWN_RATE as getNEW_SOUL_SPAWN_RATE,
    MIN_LIFESPAN as getMIN_LIFESPAN,
    MAX_LIFESPAN as getMAX_LIFESPAN,
    AVG_LIFESPAN as getAVG_LIFESPAN,
    EQUILIBRIUM_POPULATION as getEQUILIBRIUM_POPULATION,
    resetParameters,
    setSpawnRate,
    setMinLifespan,
    setMaxLifespan,
    setContainer,
    setToastNotification,
    setFpsCounter
  } from './lib/stores/simulationState.svelte.js';

  // Local reactive variables that call the getter functions
  let renderingMode = $derived(getRenderingMode());
  let isAutomaticSoulCount = $derived(getIsAutomaticSoulCount());
  let mouse = $derived(getMouse());
  let NEW_SOUL_SPAWN_RATE = $derived(getNEW_SOUL_SPAWN_RATE());
  let MIN_LIFESPAN = $derived(getMIN_LIFESPAN());
  let MAX_LIFESPAN = $derived(getMAX_LIFESPAN());
  let AVG_LIFESPAN = $derived(getAVG_LIFESPAN());
  let EQUILIBRIUM_POPULATION = $derived(getEQUILIBRIUM_POPULATION());

  // Local variable for container binding (cannot bind to imports)
  let localContainer = $state();
  let localToastNotification = $state();
  let localFpsCounter = $state();
  let simulationManager = $state();

  // Sync local container to store when it changes
  $effect(() => {
    if (localContainer) {
      setContainer(localContainer);
    }
  });

  // Sync local component references to store
  $effect(() => {
    if (localToastNotification) {
      setToastNotification(localToastNotification);
    }
  });

  $effect(() => {
    if (localFpsCounter) {
      setFpsCounter(localFpsCounter);
    }
  });

  // Handle parameter changes from SliderControls component
  function handleParameterChange(event) {
    const { type, value } = event.detail;
    
    switch (type) {
      case 'SPAWN_RATE':
        setSpawnRate(value);
        break;
      case 'MIN_LIFESPAN':
        setMinLifespan(value);
        break;
      case 'MAX_LIFESPAN':
        setMaxLifespan(value);
        break;
    }
  }
  
  // Helper functions for parameter reset
  function handleReset() {
    resetParameters();
  }
  
  // Handler for mouse movement events from ThreeContainer
  function handleMouseMove(event) {
    const { mouseX, mouseY } = event.detail;
    mouse.x = mouseX;
    mouse.y = mouseY;
  }
  
  // Handler for resize events from ThreeContainer
  function handleResize(event) {
    // The SceneManager will handle the resize, this is just for any additional app-level logic
    const { width, height } = event?.detail || {};
    // Add any app-level resize logic here if needed
  }
  
  // Helper function to determine the active count for UI highlighting
  function getActiveCount() {
    const urlParams = new URLSearchParams(window.location.search);
    const val = urlParams.get('val');
    
    if (val === null || val === '') {
      return DEFAULT_SOUL_COUNT;
    }
    
    const parsedVal = parseInt(val, 10);
    
    if (isNaN(parsedVal)) {
      return DEFAULT_SOUL_COUNT;
    }
    
    return parsedVal;
  }

  // Handler for when SceneManager has initialized the scene
  function handleSceneReady(event) {
    const sceneObjects = event.detail;
    
    // Delegate scene ready handling to SimulationManager
    if (simulationManager) {
      simulationManager.handleSceneReady(sceneObjects);
    }
  }

  // Handler for resize events from SceneManager
  function handleSceneResize(event) {
    const dimensions = event.detail;
    // SceneManager handles the camera and renderer resize
    // This is just for any additional logic we might need
  }

  // Handler for simulation ready event from SimulationManager
  function handleSimulationReady(event) {
    const simulationObjects = event.detail;
    // Simulation is fully initialized and ready
    // Can add any app-level logic here if needed
  }
</script>

<ThreeContainer 
  bind:container={localContainer} 
  on:mousemove={handleMouseMove} 
  on:resize={handleResize} 
/>

<SceneManager 
  on:sceneReady={handleSceneReady}
  on:resize={handleSceneResize}
/>

<SimulationManager 
  bind:this={simulationManager}
  on:simulationReady={handleSimulationReady}
/>

<!-- UI Components -->
<FpsCounter bind:this={localFpsCounter} />
<PopulationCounter />
<EntityLinks 
  activeCount={getActiveCount()} 
  {isAutomaticSoulCount} 
/>

<EquilibriumInfo 
  spawnRate={NEW_SOUL_SPAWN_RATE}
  avgLifespan={AVG_LIFESPAN}
  equilibriumPopulation={EQUILIBRIUM_POPULATION}
  minLifespan={MIN_LIFESPAN}
  maxLifespan={MAX_LIFESPAN}
  onParameterChange={handleParameterChange}
  onReset={handleReset}
/>

<BottomLinks />

<ToastNotification bind:this={localToastNotification} />
