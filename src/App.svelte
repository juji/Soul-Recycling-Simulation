<!-- App.svelte - Simplified for Phase 4 -->
<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { InstancedSoulRenderer } from './lib/InstancedSoulRenderer.js';
  import { LODManager } from './lib/LODManager.js';
  import { AdaptivePerformanceManager } from './lib/adaptive-performance.js';
  import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './lib/localStorage.js';
  import { FEATURE_FLAGS, DEFAULT_SOUL_COUNT, MATERIAL_POOL_SIZE, DEWA_SPAWN_CHANCE, DEWA_BASE_SPEED, DEFAULT_PARAMETERS } from './lib/constants/config.js';
  import { CAMERA_SETTINGS, LIGHTING_SETTINGS, LINE_SETTINGS, GEOMETRY_SETTINGS, CONTROLS_SETTINGS } from './lib/constants/rendering.js';
  import { CONNECTION_SETTINGS, POINTER_INTERACTION_RADIUS, POINTER_INFLUENCE_STRENGTH, NEIGHBOR_SPEED_INFLUENCE_RADIUS, NEIGHBOR_SPEED_INFLUENCE_STRENGTH, SEPARATION_DISTANCE, SEPARATION_STRENGTH, DEWA_ATTRACTION_RADIUS, DEWA_ATTRACTION_STRENGTH, DEWA_ENHANCEMENT_RADIUS, ENHANCEMENT_SATURATION_BOOST, ENHANCEMENT_LIGHTNESS_BOOST } from './lib/constants/physics.js';
  
  import FpsCounter from './components/FpsCounter.svelte';
  import PopulationCounter from './components/PopulationCounter.svelte';
  import EntityLinks from './components/EntityLinks.svelte';
  import ToastNotification from './components/ToastNotification.svelte';
  import BottomLinks from './components/BottomLinks.svelte';
  import EquilibriumInfo from './components/EquilibriumInfo.svelte';
  import ThreeContainer from './components/ThreeContainer.svelte';
  import SceneManager from './components/simulation/SceneManager.svelte';
  import './lib/ai-test-bridge.js';
  
  // Import soul management utilities
  import { 
    initializeSoulManager, 
    createSoul, 
    createNewSoul, 
    createInitialSouls,
    disposeSoulManager,
    handleSoulRemoval,
    updateSoulFromWorker,
    initializeConnectionLines,
    updateConnectionLines,
    disposeConnectionLines
  } from './lib/utils/soulManager.js';
  
  // Import state management store
  import { 
    souls as getSouls, 
    soulLookupMap as getSoulLookupMap, 
    renderingMode as getRenderingMode, 
    currentQuality as getCurrentQuality, 
    isAutomaticSoulCount as getIsAutomaticSoulCount,
    performanceMetrics as getPerformanceMetrics,
    container as getContainer,
    mouse as getMouse,
    NEW_SOUL_SPAWN_RATE as getNEW_SOUL_SPAWN_RATE,
    MIN_LIFESPAN as getMIN_LIFESPAN,
    MAX_LIFESPAN as getMAX_LIFESPAN,
    AVG_LIFESPAN as getAVG_LIFESPAN,
    EQUILIBRIUM_POPULATION as getEQUILIBRIUM_POPULATION,
    toastNotification as getToastNotification,
    fpsCounter as getFpsCounter,
    instancedRenderer as getInstancedRenderer,
    lodManager as getLodManager,
    adaptivePerformanceManager as getAdaptivePerformanceManager,
    resetParameters,
    updateCurrentQuality,
    showToastMessage,
    adjustQualityBasedOnFPS,
    setSpawnRate,
    setMinLifespan,
    setMaxLifespan,
    setAutomaticSoulCount,
    setInstancedRenderer,
    setLodManager,
    setAdaptivePerformanceManager,
    setRenderingMode,
    setContainer,
    setToastNotification,
    setFpsCounter,
    addSoul,
    removeSoulById,
    clearSouls
  } from './lib/stores/simulationState.svelte.js';

  // Local reactive variables that call the getter functions
  let souls = $derived(getSouls());
  let soulLookupMap = $derived(getSoulLookupMap());
  let renderingMode = $derived(getRenderingMode());
  let currentQuality = $derived(getCurrentQuality());
  let isAutomaticSoulCount = $derived(getIsAutomaticSoulCount());
  let performanceMetrics = $derived(getPerformanceMetrics());
  let container = $derived(getContainer());
  let mouse = $derived(getMouse());
  let NEW_SOUL_SPAWN_RATE = $derived(getNEW_SOUL_SPAWN_RATE());
  let MIN_LIFESPAN = $derived(getMIN_LIFESPAN());
  let MAX_LIFESPAN = $derived(getMAX_LIFESPAN());
  let AVG_LIFESPAN = $derived(getAVG_LIFESPAN());
  let EQUILIBRIUM_POPULATION = $derived(getEQUILIBRIUM_POPULATION());
  let toastNotification = $derived(getToastNotification());
  let fpsCounter = $derived(getFpsCounter());
  let instancedRenderer = $derived(getInstancedRenderer());
  let lodManager = $derived(getLodManager());
  let adaptivePerformanceManager = $derived(getAdaptivePerformanceManager());

  // Local variable for container binding (cannot bind to imports)
  let localContainer = $state();
  let localToastNotification = $state();
  let localFpsCounter = $state();

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

  // Local state for Three.js objects (from SceneManager)
  let scene = $state(null);
  let camera = $state(null);
  let renderer = $state(null);
  let controls = $state(null);

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

  // Helper function to get entity count from URL parameter
  function getEntityCountFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const val = urlParams.get('val');
    
    if (val === null || val === '') {
      if (adaptivePerformanceManager) {
        const currentQualitySettings = adaptivePerformanceManager.getQualitySettings();
        setAutomaticSoulCount(currentQualitySettings.maxSouls);
        return currentQualitySettings.maxSouls;
      }
      return DEFAULT_SOUL_COUNT;
    }
    
    const parsedVal = parseInt(val, 10);
    
    if (isNaN(parsedVal)) {
      if (adaptivePerformanceManager) {
        const currentQualitySettings = adaptivePerformanceManager.getQualitySettings();
        return currentQualitySettings.maxSouls;
      }
      return DEFAULT_SOUL_COUNT;
    }
    
    return parsedVal;
  }

  // Handler for when SceneManager has initialized the scene
  function handleSceneReady(event) {
    const sceneObjects = event.detail;
    scene = sceneObjects.scene;
    camera = sceneObjects.camera;
    renderer = sceneObjects.renderer;
    controls = sceneObjects.controls;
    

    
    // Initialize the simulation once the scene is ready
    initializeSimulation();
  }

  // Handler for resize events from SceneManager
  function handleSceneResize(event) {
    const dimensions = event.detail;
    // SceneManager handles the camera and renderer resize
    // This is just for any additional logic we might need
  }

  // Initialize the simulation once the scene is ready
  function initializeSimulation() {
    if (!scene || !camera || !renderer) {
      console.warn('Scene not ready for simulation initialization');
      return;
    }

    // Check if values were loaded from localStorage and show notification
    const hasStoredValues = 
      (typeof window !== 'undefined' && window.localStorage) &&
      (localStorage.getItem(STORAGE_KEYS.SPAWN_RATE) ||
       localStorage.getItem(STORAGE_KEYS.MIN_LIFESPAN) ||
       localStorage.getItem(STORAGE_KEYS.MAX_LIFESPAN));
    
    if (hasStoredValues) {
      setTimeout(() => {
        showToastMessage('Settings loaded from storage');
      }, 1000);
    }

    // Check URL parameters for rendering mode override (for testing)
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    
    // Override feature flag if mode parameter is provided
    let useInstancedRendering = FEATURE_FLAGS.USE_INSTANCED_RENDERING;
    if (modeParam === 'individual') {
      useInstancedRendering = false;
    } else if (modeParam === 'instanced') {
      useInstancedRendering = true;
    }

    // Initialize Instanced Rendering
    setRenderingMode(useInstancedRendering ? 'instanced' : 'individual');

    // Setup the core simulation logic
    setupSimulationCore();
  }

  // Setup the core simulation logic (souls, workers, etc.)
  function setupSimulationCore() {
    const recycledSoulCount = getEntityCountFromURL();
    const interactionDistance = CONNECTION_SETTINGS.INTERACTION_DISTANCE;
    let lineSegments;
    const MAX_LINES = recycledSoulCount * CONNECTION_SETTINGS.MAX_LINES_MULTIPLIER;

    // Initialize line segments for connections using soulManager
    lineSegments = initializeConnectionLines(scene, MAX_LINES);

    // Initialize soul manager with shared geometries and materials
    initializeSoulManager();

    // Pointer interaction variables
    const raycaster = new THREE.Raycaster();
    let pointerPosition3D = null;
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    let simulationWorker;

    // Initialize the Web Worker
    simulationWorker = new Worker(new URL('./lib/simulation.worker.js', import.meta.url), { type: 'module' });

    // Create initial souls using soulManager
    const initialSoulsForWorkerInit = createInitialSouls(
      recycledSoulCount, 
      scene, 
      renderingMode, 
      MIN_LIFESPAN, 
      MAX_LIFESPAN, 
      simulationWorker
    );
    
    // Initialize instanced renderer AFTER souls are created
    if (renderingMode === 'instanced') {
      try {
        // Dynamic buffer size based on URL parameter with 2x safety margin
        const dynamicMaxSouls = recycledSoulCount * 2;
        setInstancedRenderer(new InstancedSoulRenderer(scene, dynamicMaxSouls));
        
        // Hide individual meshes from scene since we'll use instanced rendering
        souls.forEach(soul => {
          if (soul.parent === scene) {
            scene.remove(soul);
          }
        });
        
        // Perform initial instanced update with existing souls
        instancedRenderer.updateInstances(souls);
        
      } catch (error) {
        setRenderingMode('individual');
        
        // Show individual meshes again on fallback
        souls.forEach(soul => {
          if (soul.parent !== scene) {
            scene.add(soul);
          }
        });
      }
    }
    
    // Initialize worker with souls and constants
    simulationWorker.postMessage({
        type: 'init',
        data: {
            souls: initialSoulsForWorkerInit, 
            constants: {
                POINTER_INTERACTION_RADIUS, 
                POINTER_INFLUENCE_STRENGTH, 
                NEIGHBOR_SPEED_INFLUENCE_RADIUS,
                NEIGHBOR_SPEED_INFLUENCE_STRENGTH,
                SEPARATION_DISTANCE,
                SEPARATION_STRENGTH,
                DEWA_ATTRACTION_RADIUS, 
                DEWA_ATTRACTION_STRENGTH,
                DEWA_ENHANCEMENT_RADIUS,
                ENHANCEMENT_SATURATION_BOOST,
                ENHANCEMENT_LIGHTNESS_BOOST
            }
        }
    });

    // Worker message handling
    simulationWorker.onmessage = function(e) {
        const { type, data } = e.data;
        if (type === 'soulsUpdated') {
            const updateStartTime = performance.now();
            performanceMetrics.soulsUpdated = data.length;
            
            // Dual rendering path - instanced vs individual meshes
            if (renderingMode === 'instanced' && instancedRenderer) {
                // Update individual soul mesh positions for compatibility using soulManager
                data.forEach(updatedSoulData => {
                    updateSoulFromWorker(updatedSoulData, renderingMode);
                });
                
                // Update all souls through instanced renderer with updated mesh data
                instancedRenderer.updateInstances(souls);
                
                // Track instanced performance
                const instancedTime = performance.now() - updateStartTime;
                performanceMetrics.instancedUpdateTime += instancedTime;
                performanceMetrics.renderingMode = 'instanced';
            } else {
                // Individual mesh rendering (fallback) using soulManager
                data.forEach(updatedSoulData => {
                    updateSoulFromWorker(updatedSoulData, renderingMode);
                });
                
                // Track individual mesh performance
                const individualTime = performance.now() - updateStartTime;
                performanceMetrics.individualUpdateTime += individualTime;
                performanceMetrics.renderingMode = 'individual';
            }
        } else if (type === 'soulRemoved') {
            // Handle soul removal using soulManager
            const soulIdToRemove = data.soulId;
            handleSoulRemoval(soulIdToRemove, scene, renderingMode);
        } else if (type === 'connectionsUpdated') {
            // Handle connections calculated in worker using soulManager
            updateConnectionLines(lineSegments, data, MAX_LINES);
        }
    };

    function createNewSoulWrapper() {
      createNewSoul(scene, renderingMode, MIN_LIFESPAN, MAX_LIFESPAN, simulationWorker);
    }

    // Helper function to track draw calls for performance metrics
    function trackDrawCalls(renderer) {
      if (renderer && renderer.info && renderer.info.render) {
        return renderer.info.render.calls;
      }
      // Fallback estimation based on rendering mode
      return renderingMode === 'instanced' ? 3 : souls.length;
    }

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Update pointer position in 3D space for main thread (raycasting)
      raycaster.setFromCamera(mouse, camera);
      const intersectionPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(interactionPlane, intersectionPoint)) {
        pointerPosition3D = intersectionPoint;
      } else {
        pointerPosition3D = null;
      }

      // Send necessary data to worker for update
      if (simulationWorker) {
        simulationWorker.postMessage({
            type: 'update',
            data: {
                pointerPosition3D: null, // Dewa is everywhere, not tied to a specific mouse-derived point
                lodData: null // LOD data would go here if implemented
            }
        });
      }

      let spawnRate = NEW_SOUL_SPAWN_RATE;
      while (spawnRate > 1) {
        createNewSoulWrapper(); 
        spawnRate--;
      }
      if (Math.random() < spawnRate) {
        createNewSoulWrapper(); 
      }

      controls.update();
      
      // Track draw calls before render
      renderer.render(scene, camera);
      performanceMetrics.drawCalls = trackDrawCalls(renderer);
      
      // Get FPS metrics from FpsCounter component
      const fpsMetrics = fpsCounter ? fpsCounter.getMetrics() : { fps: 60, averageFPS: 60, memoryUsage: 0 };
      const { fps, averageFPS, memoryUsage } = fpsMetrics;
      
      // Update global variables for AI test bridge
      if (typeof window !== 'undefined') {
        window.currentQuality = currentQuality;
        window.soulCount = souls.length;
      }
      
      // Adjust quality based on performance every second
      adjustQualityBasedOnFPS(fps);
    }

    animate();
  }

  onMount(() => {
    // onMount now only handles basic setup
    // Everything else is handled by SceneManager and initializeSimulation
  });
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

<!-- UI Components -->
<FpsCounter bind:this={localFpsCounter} />
<PopulationCounter soulCount={souls.length} />
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
