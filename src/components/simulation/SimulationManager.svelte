<!-- src/components/simulation/SimulationManager.svelte -->
<!-- Phase 6c: SimulationManager Component -->
<!-- Coordinates simulation initialization and manager interaction -->

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import * as THREE from 'three';
  import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls';
  import { InstancedSoulRenderer } from '../../lib/InstancedSoulRenderer';
  import { loadFromStorage, STORAGE_KEYS } from '../../lib/localStorage';
  import { FEATURE_FLAGS, DEFAULT_SOUL_COUNT } from '../../lib/constants/config';
  import { CONNECTION_SETTINGS, POINTER_INTERACTION_RADIUS, POINTER_INFLUENCE_STRENGTH, NEIGHBOR_SPEED_INFLUENCE_RADIUS, NEIGHBOR_SPEED_INFLUENCE_STRENGTH, SEPARATION_DISTANCE, SEPARATION_STRENGTH, DEWA_ATTRACTION_RADIUS, DEWA_ATTRACTION_STRENGTH, DEWA_ENHANCEMENT_RADIUS, ENHANCEMENT_SATURATION_BOOST, ENHANCEMENT_LIGHTNESS_BOOST } from '../../lib/constants/physics';
  
  // Import simulation utilities
  import { 
    initializeSoulManager, 
    createNewSoul, 
    createInitialSouls,
    initializeConnectionLines
  } from '../../lib/utils/soulManager';
  
  import { workerManager } from '../../lib/utils/workerManager';
  import { animationController } from '../../lib/utils/animationController';
  
  // Import state management
  import { 
    souls as getSouls,
    renderingMode as getRenderingMode,
    MIN_LIFESPAN as getMIN_LIFESPAN,
    MAX_LIFESPAN as getMAX_LIFESPAN,
    adaptivePerformanceManager as getAdaptivePerformanceManager,
    instancedRenderer as getInstancedRenderer,
    setRenderingMode,
    setInstancedRenderer,
    setAutomaticSoulCount,
    showToastMessage
  } from '../../lib/stores/simulationState.svelte.ts';

  // TypeScript interfaces
  interface SceneObjects {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: ArcballControls;
  }

  interface SoulDataForWorker {
    id: number;
    position: { x: number; y: number; z: number };
    velocity: THREE.Vector3;
    speed: number;
    isHuman: boolean;
    isDewa: boolean;
    flickerPhase: number;
    life: number;
    baseHSL: { h: number; s: number; l: number };
  }

  // Create event dispatcher with proper typing
  const dispatch = createEventDispatcher<{
    simulationReady: SceneObjects;
  }>();

  // Local reactive variables with TypeScript typing
  let souls = $derived(getSouls());
  let renderingMode = $derived(getRenderingMode());
  let MIN_LIFESPAN = $derived(getMIN_LIFESPAN());
  let MAX_LIFESPAN = $derived(getMAX_LIFESPAN());
  let adaptivePerformanceManager = $derived(getAdaptivePerformanceManager());
  let instancedRenderer = $derived(getInstancedRenderer());

  // Scene objects with TypeScript typing (will be set when scene is ready)
  let scene = $state<THREE.Scene | null>(null);
  let camera = $state<THREE.PerspectiveCamera | null>(null);
  let renderer = $state<THREE.WebGLRenderer | null>(null);
  let controls = $state<ArcballControls | null>(null);

  // Simulation state
  let isSimulationInitialized = $state<boolean>(false);

  // Export function to be called when scene is ready with TypeScript
  export function handleSceneReady(sceneObjects: SceneObjects): void {
    scene = sceneObjects.scene;
    camera = sceneObjects.camera;
    renderer = sceneObjects.renderer;
    controls = sceneObjects.controls;
    
    // Initialize simulation once scene is ready
    initializeSimulation();
  }

  /**
   * Helper function to get entity count from URL parameter
   */
  function getEntityCountFromURL(): number {
    const urlParams = new URLSearchParams(window.location.search);
    const val: string | null = urlParams.get('val');
    
    if (val === null || val === '') {
      if (adaptivePerformanceManager) {
        const currentQualitySettings = adaptivePerformanceManager.getQualitySettings();
        setAutomaticSoulCount(currentQualitySettings.maxSouls);
        return currentQualitySettings.maxSouls;
      }
      return DEFAULT_SOUL_COUNT;
    }
    
    const parsedVal: number = parseInt(val, 10);
    
    if (isNaN(parsedVal)) {
      if (adaptivePerformanceManager) {
        const currentQualitySettings = adaptivePerformanceManager.getQualitySettings();
        return currentQualitySettings.maxSouls;
      }
      return DEFAULT_SOUL_COUNT;
    }
    
    return parsedVal;
  }

  /**
   * Initialize the simulation once the scene is ready
   */
  function initializeSimulation(): void {
    if (!scene || !camera || !renderer) {
      console.warn('Scene not ready for simulation initialization');
      return;
    }

    if (isSimulationInitialized) {
      console.warn('Simulation already initialized');
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

    // Initialize rendering mode
    setRenderingMode(useInstancedRendering ? 'instanced' : 'individual');

    // Setup the core simulation logic
    setupSimulationCore();
    
    isSimulationInitialized = true;

    // Dispatch event to notify that simulation is ready
    dispatch('simulationReady', {
      scene: scene!,
      camera: camera!,
      renderer: renderer!,
      controls: controls!
    });
  }

  /**
   * Setup the core simulation logic (souls, workers, etc.)
   */
  function setupSimulationCore(): void {
    const recycledSoulCount = getEntityCountFromURL();
    const interactionDistance = CONNECTION_SETTINGS.INTERACTION_DISTANCE;
    let lineSegments;
    const MAX_LINES = recycledSoulCount * CONNECTION_SETTINGS.MAX_LINES_MULTIPLIER;

    // Initialize line segments for connections using soulManager
    lineSegments = initializeConnectionLines(scene, MAX_LINES);

    // Initialize soul manager with shared geometries and materials
    initializeSoulManager();

    // Create initial souls using soulManager (worker will be passed later)
    const initialSoulsForWorkerInit = createInitialSouls(
      recycledSoulCount, 
      scene, 
      renderingMode, 
      MIN_LIFESPAN, 
      MAX_LIFESPAN, 
      null // Worker reference not needed for initial creation
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
        if (instancedRenderer) {
          instancedRenderer.updateInstances(souls);
        }
        
      } catch (error) {
        console.warn('Instanced rendering failed, falling back to individual:', error);
        setRenderingMode('individual');
        
        // Show individual meshes again on fallback
        souls.forEach(soul => {
          if (soul.parent !== scene) {
            scene.add(soul);
          }
        });
      }
    }
    
    // Initialize worker with souls and constants using WorkerManager
    const workerConstants = {
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
    };

    // Initialize WorkerManager
    workerManager.initializeWorker(initialSoulsForWorkerInit, workerConstants);
    
    // Set scene references for WorkerManager
    workerManager.setSceneReferences(scene, lineSegments, MAX_LINES);

    // Soul creation wrapper function with TypeScript
    function createNewSoulWrapper(): void {
      const newSoul = createNewSoul(scene!, renderingMode, MIN_LIFESPAN, MAX_LIFESPAN, null);
      
      // Send the new soul to the worker via WorkerManager
      if (newSoul && newSoul.userData) {
        const soulDataForWorker: SoulDataForWorker = {
          id: newSoul.userData.id,
          position: { x: newSoul.position.x, y: newSoul.position.y, z: newSoul.position.z },
          velocity: newSoul.userData.velocity,
          speed: newSoul.userData.speed,
          isHuman: newSoul.userData.isHuman,
          isDewa: newSoul.userData.isDewa,
          flickerPhase: newSoul.userData.flickerPhase,
          life: newSoul.userData.life,
          baseHSL: newSoul.userData.baseHSL,
        };
        
        workerManager.addSoulToWorker(soulDataForWorker);
      }
    }

    // Initialize and start animation controller
    animationController.initializeScene({ scene, camera, renderer, controls });
    animationController.setCallbacks({
      onSoulSpawn: createNewSoulWrapper,
      onWorkerUpdate: (data) => workerManager.sendUpdate(data)
    });
    animationController.start();
  }

  // Cleanup function for simulation with TypeScript
  export function cleanup(): void {
    if (animationController) {
      animationController.stop();
    }
    isSimulationInitialized = false;
  }

  // Cleanup on component destroy
  onMount(() => {
    return () => {
      cleanup();
    };
  });
</script>

<!-- SimulationManager is a logic-only component, no template needed -->