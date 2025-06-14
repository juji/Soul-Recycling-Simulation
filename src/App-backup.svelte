<script>

  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls';
  import { InstancedSoulRenderer } from './lib/InstancedSoulRenderer.js';
  import { LODManager } from './lib/LODManager.js';  // Phase 4: LOD System
  import { AdaptivePerformanceManager } from './lib/adaptive-performance.js';  // Phase 4: Adaptive Performance
  import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './lib/localStorage.js'; // Import from new module
  import { FEATURE_FLAGS, DEFAULT_SOUL_COUNT, MATERIAL_POOL_SIZE, DEWA_SPAWN_CHANCE, DEWA_BASE_SPEED, DEFAULT_PARAMETERS } from './lib/constants/config.js';
  import { CAMERA_SETTINGS, LIGHTING_SETTINGS, LINE_SETTINGS, GEOMETRY_SETTINGS, CONTROLS_SETTINGS } from './lib/constants/rendering.js';
  import { CONNECTION_SETTINGS, POINTER_INTERACTION_RADIUS, POINTER_INFLUENCE_STRENGTH, NEIGHBOR_SPEED_INFLUENCE_RADIUS, NEIGHBOR_SPEED_INFLUENCE_STRENGTH, SEPARATION_DISTANCE, SEPARATION_STRENGTH, DEWA_ATTRACTION_RADIUS, DEWA_ATTRACTION_STRENGTH, DEWA_ENHANCEMENT_RADIUS, ENHANCEMENT_SATURATION_BOOST, ENHANCEMENT_LIGHTNESS_BOOST } from './lib/constants/physics.js';
  import SliderControls from './components/SliderControls.svelte';
  import FpsCounter from './components/FpsCounter.svelte';
  import PopulationCounter from './components/PopulationCounter.svelte';
  import EntityLinks from './components/EntityLinks.svelte';
  import ToastNotification from './components/ToastNotification.svelte';
  import BottomLinks from './components/BottomLinks.svelte';
  import EquilibriumInfo from './components/EquilibriumInfo.svelte';
  import ThreeContainer from './components/ThreeContainer.svelte';
  import SceneManager from './components/simulation/SceneManager.svelte';
  import './lib/ai-test-bridge.js';  // Import AI test bridge for performance testing
  
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
  
  // Note: Effects for localStorage sync are now handled in the state store
  
  // POPULATION EQUILIBRIUM NOTE:
  // The soul population tends towards an equilibrium.
  // This equilibrium is determined by:
  // 1. `NEW_SOUL_SPAWN_RATE` (currently ${NEW_SOUL_SPAWN_RATE}): The average number of new souls created per frame.
  // 2. Soul Lifespan (defined in `createSoul` as ${MIN_LIFESPAN}-${MAX_LIFESPAN} frames, averaging ${AVG_LIFESPAN}): How long souls live before being removed.
  //
  // Equilibrium occurs when: Average Birth Rate = Average Death Rate
  // Average Birth Rate = NEW_SOUL_SPAWN_RATE
  // Average Death Rate = CurrentPopulation / AverageLifespan
  // So, `NEW_SOUL_SPAWN_RATE = CurrentPopulation / AverageLifespan`
  // `CurrentPopulation = NEW_SOUL_SPAWN_RATE * AverageLifespan`
  // With current values: `CurrentPopulation = ${NEW_SOUL_SPAWN_RATE} * ${AVG_LIFESPAN} = ${NEW_SOUL_SPAWN_RATE * AVG_LIFESPAN}` (approximately)
  //
  // If the initial population is above this, it will decrease towards equilibrium.
  // If the initial population is below this, it will increase towards equilibrium.

  // Local state for Three.js objects (from SceneManager)
  let scene = $state(null);
  let camera = $state(null);
  let renderer = $state(null);
  let controls = $state(null);
  
  // Phase 3: Performance tracking functions
  function trackDrawCalls(renderer) {
    // Track draw calls for Phase 3 performance validation
    if (renderer && renderer.info && renderer.info.render) {
      return renderer.info.render.calls;
    }
    // Fallback estimation based on rendering mode
    return renderingMode === 'instanced' ? 3 : souls.length;
  }

  // Functions now reference the store imports
  // Note: showToastMessage and adjustQualityBasedOnFPS are now imported from store
  
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
  
  // Helper function to determine the active count for UI highlighting
  function getActiveCount() {
    const urlParams = new URLSearchParams(window.location.search);
    const val = urlParams.get('val');
    
    if (val === null || val === '') {
      return DEFAULT_SOUL_COUNT; // Default value
    }
    
    const parsedVal = parseInt(val, 10);
    
    if (isNaN(parsedVal)) {
      return DEFAULT_SOUL_COUNT; // Default for invalid values
    }
    
    return parsedVal;
  }

  // Helper function to get entity count from URL parameter
  // Uses adaptive performance management to determine optimal soul count when no URL parameter is provided
  function getEntityCountFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const val = urlParams.get('val');
    
    if (val === null || val === '') {
      // Use adaptive performance manager to determine optimal soul count
      if (adaptivePerformanceManager) {
        const currentQualitySettings = adaptivePerformanceManager.getQualitySettings();
        setAutomaticSoulCount(currentQualitySettings.maxSouls);
        return currentQualitySettings.maxSouls;
      }
      return DEFAULT_SOUL_COUNT; // Fallback if adaptive performance manager not available
    }
    
    const parsedVal = parseInt(val, 10);
    
    // Check if it's a valid number
    if (isNaN(parsedVal)) {
      // Use adaptive performance manager for invalid values too
      if (adaptivePerformanceManager) {
        const currentQualitySettings = adaptivePerformanceManager.getQualitySettings();
        return currentQualitySettings.maxSouls;
      }
      return DEFAULT_SOUL_COUNT; // Fallback for invalid values
    }
    
    return parsedVal;
  }

  // Handler for when SceneManager has initialized the scene
  function handleSceneReady(sceneObjects) {
    scene = sceneObjects.scene;
    camera = sceneObjects.camera;
    renderer = sceneObjects.renderer;
    controls = sceneObjects.controls;
    
    // Continue with the rest of the initialization that was in onMount
    initializeSimulation();
  }

  // Handler for resize events from SceneManager
  function handleSceneResize(dimensions) {
    // SceneManager handles the camera and renderer resize
    // This is just for any additional logic we might need
  }

  // Initialize the simulation once the scene is ready
  function initializeSimulation() {
    if (!scene || !camera || !renderer) {
      console.warn('Scene not ready for simulation initialization');
      return;
    }

    // Now continue with the simulation setup that doesn't involve scene creation
    // Phase 3: Check URL parameters for rendering mode override (for testing)
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    
    // Override feature flag if mode parameter is provided
    let useInstancedRendering = FEATURE_FLAGS.USE_INSTANCED_RENDERING;
    if (modeParam === 'individual') {
      useInstancedRendering = false;
    } else if (modeParam === 'instanced') {
      useInstancedRendering = true;
    }

    // Phase 3: Initialize Instanced Rendering
    setRenderingMode(useInstancedRendering ? 'instanced' : 'individual');

    // Continue with the rest of the simulation setup
    setupSimulationCore();
  }

  // Setup the core simulation logic (souls, workers, etc.)
  function setupSimulationCore() {
    function initLineSegments() {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(
        MAX_LINES * LINE_SETTINGS.VERTICES_PER_LINE * LINE_SETTINGS.VERTEX_COORDS
      );
      const colors = new Float32Array(
        MAX_LINES * LINE_SETTINGS.VERTICES_PER_LINE * LINE_SETTINGS.VERTEX_COORDS
      );

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, LINE_SETTINGS.VERTEX_COORDS));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, LINE_SETTINGS.VERTEX_COORDS));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: LINE_SETTINGS.OPACITY
      });

      lineSegments = new THREE.LineSegments(geometry, material);
      scene.add(lineSegments);
    }

    // Function to handle connections calculated in Web Worker
    function updateConnectionsFromWorker(connections) {
      if (!lineSegments || !connections || connections.length === 0) {
        if (lineSegments) lineSegments.geometry.setDrawRange(0, 0);
        return;
      }

      const positions = lineSegments.geometry.attributes.position.array;
      const colors = lineSegments.geometry.attributes.color.array;
      
      let lineIdx = 0;
      const maxLines = Math.min(connections.length, MAX_LINES);

      // Apply pre-calculated connection data from worker
      for (let i = 0; i < maxLines; i++) {
        const connection = connections[i];
        
        // Vertex 1 (start)
        positions[lineIdx * 6 + 0] = connection.start[0];
        positions[lineIdx * 6 + 1] = connection.start[1];
        positions[lineIdx * 6 + 2] = connection.start[2];
        colors[lineIdx * 6 + 0] = connection.color[0];
        colors[lineIdx * 6 + 1] = connection.color[1];
        colors[lineIdx * 6 + 2] = connection.color[2];

        // Vertex 2 (end)
        positions[lineIdx * 6 + 3] = connection.end[0];
        positions[lineIdx * 6 + 4] = connection.end[1];
        positions[lineIdx * 6 + 5] = connection.end[2];
        colors[lineIdx * 6 + 3] = connection.color[0];
        colors[lineIdx * 6 + 4] = connection.color[1];
        colors[lineIdx * 6 + 5] = connection.color[2];
        
        lineIdx++;
      }

      // Hide unused lines by setting them to zero
      for (let i = lineIdx; i < MAX_LINES; i++) {
        positions[i * 6 + 0] = 0; positions[i * 6 + 1] = 0; positions[i * 6 + 2] = 0;
        positions[i * 6 + 3] = 0; positions[i * 6 + 4] = 0; positions[i * 6 + 5] = 0;
      }

      // Update the geometry
      lineSegments.geometry.setDrawRange(0, lineIdx * 2);
      lineSegments.geometry.attributes.position.needsUpdate = true;
      lineSegments.geometry.attributes.color.needsUpdate = true;
    }

    const recycledSoulCount = getEntityCountFromURL();
    
    const interactionDistance = CONNECTION_SETTINGS.INTERACTION_DISTANCE;
    let lineSegments;
    const MAX_LINES = recycledSoulCount * CONNECTION_SETTINGS.MAX_LINES_MULTIPLIER;

    const humanGeometry = new THREE.SphereGeometry(
      GEOMETRY_SETTINGS.HUMAN_RADIUS, 
      GEOMETRY_SETTINGS.HUMAN_SEGMENTS.width, 
      GEOMETRY_SETTINGS.HUMAN_SEGMENTS.height
    );
    const gptGeometry = new THREE.BoxGeometry(
      GEOMETRY_SETTINGS.GPT_SIZE, 
      GEOMETRY_SETTINGS.GPT_SIZE, 
      GEOMETRY_SETTINGS.GPT_SIZE
    );
    const dewaGeometry = new THREE.SphereGeometry(
      GEOMETRY_SETTINGS.DEWA_RADIUS, 
      GEOMETRY_SETTINGS.DEWA_SEGMENTS.width, 
      GEOMETRY_SETTINGS.DEWA_SEGMENTS.height
    );

    // Shared materials for better memory efficiency
    const sharedHumanMaterial = new THREE.MeshBasicMaterial({ 
      transparent: true, 
      opacity: GEOMETRY_SETTINGS.MATERIAL_OPACITY.DEFAULT 
    });
    const sharedGptMaterial = new THREE.MeshBasicMaterial({ 
      transparent: true, 
      opacity: GEOMETRY_SETTINGS.MATERIAL_OPACITY.DEFAULT 
    });
    const sharedDewaMaterial = new THREE.MeshLambertMaterial({ 
      transparent: true, 
      opacity: GEOMETRY_SETTINGS.MATERIAL_OPACITY.DEWA 
    });
    
    // Material pool for reuse
    const materialPool = {
      human: [],
      gpt: [],
      dewa: []
    };
    
    function getOrCreateMaterial(type) {
      const pool = materialPool[type];
      if (pool.length > 0) {
        return pool.pop();
      }
      
      // Create new material based on type
      switch(type) {
        case 'human':
          return sharedHumanMaterial.clone();
        case 'gpt':
          return sharedGptMaterial.clone();
        case 'dewa':
          return sharedDewaMaterial.clone();
        default:
          return new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: GEOMETRY_SETTINGS.MATERIAL_OPACITY.DEFAULT 
          });
      }
    }
    
    function returnMaterial(material, type) {
      if (materialPool[type].length < MATERIAL_POOL_SIZE) {
        materialPool[type].push(material);
      } else {
        material.dispose();
      }
    }

    const humanBaseHue = Math.random();
    const gptBaseHue = (humanBaseHue + 0.5) % 1;

    // Pointer interaction variables
    const raycaster = new THREE.Raycaster();
    let pointerPosition3D = null;
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    let simulationWorker;
    let nextSoulId = 0;

    function createSoul(isHuman, isDewa = false, angle = 0, speed = 0) {
      let geometry;
      if (isDewa) {
        geometry = dewaGeometry;
      } else {
        geometry = isHuman ? humanGeometry : gptGeometry;
      }
      // const geometry = (isHuman || isDewa) ? humanGeometry : gptGeometry; // Old logic
      let material;
      let h_val, s_val, l_val; 

      if (isDewa) {
        h_val = Math.random(); // Random hue
        s_val = 1;             // Max saturation
        l_val = 0.5;           // Max brightness (standard for HSL)
        material = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color().setHSL(h_val, s_val, l_val), // Set color using HSL
            transparent: false,
            opacity: 1.0
        });
        // For baseHSL, update with the new random color
        // h_val is already set above
        // s_val is already set above
        // l_val is already set above
      } else {
        material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8 });
        const baseHue = isHuman ? humanBaseHue : gptBaseHue;
        const hueOffset = Math.random() * 0.3 - 0.15;
        h_val = (baseHue + hueOffset + angle / (2 * Math.PI)) % 1;
        s_val = 1;
        l_val = 0.56;
        material.color.setHSL(h_val, s_val, l_val);
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.id = nextSoulId++; 

      const radius = 10 + Math.random() * 10;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      mesh.position.set(x, y, z);

      const currentSpeed = isDewa ? DEWA_BASE_SPEED : (speed === 0 ? (0.05 + (Math.random() * .03)) : speed);
      const initialVelocity = new THREE.Vector3(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5)
      ).normalize().multiplyScalar(currentSpeed);

      mesh.userData.speed = currentSpeed;
      mesh.userData.isHuman = isHuman;
      mesh.userData.isDewa = isDewa; 
      mesh.userData.flickerPhase = Math.random() * Math.PI * 2;
      // mesh.userData.life = 600; // Initialize life to 600 ticks - Old fixed value
      mesh.userData.life = MIN_LIFESPAN + Math.random() * (MAX_LIFESPAN - MIN_LIFESPAN); // Random lifespan between MIN_LIFESPAN and MAX_LIFESPAN
      mesh.userData.baseHSL = { h: h_val, s: s_val, l: l_val }; 
      mesh.userData.velocity = { x: initialVelocity.x, y: initialVelocity.y, z: initialVelocity.z }; 

      const soulDataForWorker = {
        id: mesh.userData.id,
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        velocity: { x: initialVelocity.x, y: initialVelocity.y, z: initialVelocity.z },
        speed: currentSpeed,
        isHuman,
        isDewa, 
        flickerPhase: mesh.userData.flickerPhase,
        life: mesh.userData.life, // Pass the initialized life
        baseHSL: mesh.userData.baseHSL, 
      };

      if (simulationWorker) {
        simulationWorker.postMessage({ type: 'addSoul', data: { soul: soulDataForWorker } });
      }

      // Phase 3: Only add individual meshes to scene when not using instanced rendering
      if (renderingMode !== 'instanced') {
        scene.add(mesh);
      }
      souls.push(mesh); 
      soulLookupMap.set(mesh.userData.id, mesh); // Add to O(1) lookup map
      return mesh; 
    }

    // Initialize the Web Worker
    simulationWorker = new Worker(new URL('./lib/simulation.worker.js', import.meta.url), { type: 'module' });

    // Create initial souls and collect their data for the worker's init message
    const initialSoulsForWorkerInit = [];
    for (let i = 0; i < recycledSoulCount; i++) {
      const angle = (i / recycledSoulCount) * Math.PI * 2;
      const isDewa = Math.random() < DEWA_SPAWN_CHANCE;
      const isHuman = isDewa ? true : Math.random() < 0.6; 
      const speed = Math.random() < 0.1 ?  0.05 + Math.random() * 0.25 : 0.05 + Math.random() * 0.025;
      const mesh = createSoul(isHuman, isDewa, angle, speed); 
      initialSoulsForWorkerInit.push({
        id: mesh.userData.id,
        position: {x: mesh.position.x, y: mesh.position.y, z: mesh.position.z},
        velocity: mesh.userData.velocity, 
        speed: mesh.userData.speed, 
        isHuman: mesh.userData.isHuman,
        isDewa: mesh.userData.isDewa, 
        flickerPhase: mesh.userData.flickerPhase,
        life: mesh.userData.life, // Ensure life is passed for initial souls too
        baseHSL: mesh.userData.baseHSL
      });
    }
    
    // Phase 3: Initialize instanced renderer AFTER souls are created
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
                DEWA_ENHANCEMENT_RADIUS, // Added
                ENHANCEMENT_SATURATION_BOOST, // Added
                ENHANCEMENT_LIGHTNESS_BOOST // Added
            }
        }
    });

    simulationWorker.onmessage = function(e) {
        const { type, data } = e.data;
        if (type === 'soulsUpdated') {
            // Phase 3: Performance tracking start
            const updateStartTime = performance.now();
            performanceMetrics.soulsUpdated = data.length;
            
            // Phase 3: Dual rendering path - instanced vs individual meshes
            if (renderingMode === 'instanced' && instancedRenderer) {
                // Update individual soul mesh positions for compatibility first
                // (needed for connections, raycasting, etc.)
                data.forEach(updatedSoulData => {
                    const soulMesh = soulLookupMap.get(updatedSoulData.id); // O(1) lookup
                    if (soulMesh) {
                        // Only update position if it was sent (moved significantly)
                        if (updatedSoulData.pos && Array.isArray(updatedSoulData.pos) && updatedSoulData.pos.length === 3) {
                            soulMesh.position.set(updatedSoulData.pos[0], updatedSoulData.pos[1], updatedSoulData.pos[2]);
                        }
                        
                        // Update userData for instanced renderer access
                        if (updatedSoulData.rgb) {
                          soulMesh.userData.finalRGB = updatedSoulData.rgb;
                        }
                        if (updatedSoulData.opacity !== undefined) {
                          soulMesh.userData.finalOpacity = updatedSoulData.opacity;
                        }
                    }
                });
                
                // NEW: Update all souls through instanced renderer with updated mesh data
                instancedRenderer.updateInstances(souls);
                
                // Track instanced performance
                const instancedTime = performance.now() - updateStartTime;
                performanceMetrics.instancedUpdateTime += instancedTime;
                performanceMetrics.renderingMode = 'instanced';            } else {
                // EXISTING: Individual mesh rendering (fallback)
                data.forEach(updatedSoulData => {
                    const soulMesh = soulLookupMap.get(updatedSoulData.id); // O(1) lookup
                    if (soulMesh) {
                        // Only update position if it was sent (moved significantly)
                        if (updatedSoulData.pos && Array.isArray(updatedSoulData.pos) && updatedSoulData.pos.length === 3) {
                            soulMesh.position.set(updatedSoulData.pos[0], updatedSoulData.pos[1], updatedSoulData.pos[2]);
                        }
                        
                        // Ensure material exists before trying to set properties
                        if (soulMesh.material) {
                          let materialNeedsUpdate = false;
                          
                          // Only update RGB color if it actually changed (delta optimization)
                          // Use setRGB instead of setHSL to avoid conversion overhead
                          if (updatedSoulData.rgb && Array.isArray(updatedSoulData.rgb) && updatedSoulData.rgb.length === 3 && 
                              soulMesh.material.color && typeof soulMesh.material.color.setRGB === 'function') {
                            // Validate RGB values before applying
                            const [r, g, b] = updatedSoulData.rgb;
                            if (typeof r === 'number' && typeof g === 'number' && typeof b === 'number' &&
                                !isNaN(r) && !isNaN(g) && !isNaN(b)) {
                              soulMesh.material.color.setRGB(r, g, b);
                              materialNeedsUpdate = true;
                            }
                          }
                          
                          // Only update opacity if it actually changed (delta optimization)
                          if (updatedSoulData.opacity !== undefined && typeof updatedSoulData.opacity === 'number' && 
                              !isNaN(updatedSoulData.opacity) && soulMesh.material.opacity !== undefined) {
                            soulMesh.material.opacity = Math.max(0, Math.min(1, updatedSoulData.opacity));
                            materialNeedsUpdate = true;
                          }
                          
                          // Only mark material for update if we actually changed something
                          if (materialNeedsUpdate && soulMesh.material.needsUpdate !== undefined) {
                            soulMesh.material.needsUpdate = true;
                          }
                        }
                    }
                });
                
                // Track individual mesh performance
                const individualTime = performance.now() - updateStartTime;
                performanceMetrics.individualUpdateTime += individualTime;
                performanceMetrics.renderingMode = 'individual';
            }
        } else if (type === 'soulRemoved') {
            const soulIdToRemove = data.soulId;
            const soulMeshToRemove = soulLookupMap.get(soulIdToRemove); // O(1) lookup
            if (soulMeshToRemove) {
                // Phase 3: Handle soul removal for both rendering modes
                if (renderingMode === 'instanced') {
                    // In instanced mode, remove from scene but don't dispose shared resources
                    scene.remove(soulMeshToRemove);
                    // Instanced renderer will handle the update in next frame
                } else {
                    // Individual mesh mode: dispose resources as before
                    scene.remove(soulMeshToRemove);
                    if (soulMeshToRemove.geometry) {
                        soulMeshToRemove.geometry.dispose();
                    }
                    if (soulMeshToRemove.material) {
                        // If material is an array (e.g. multi-material), dispose each
                        if (Array.isArray(soulMeshToRemove.material)) {
                          soulMeshToRemove.material.forEach(material => material.dispose());
                        } else {
                          soulMeshToRemove.material.dispose();
                        }
                    }
                }
                removeSoulById(soulIdToRemove);
            }
        } else if (type === 'connectionsUpdated') {
            // Handle connections calculated in worker
            updateConnectionsFromWorker(data);
        }
    };

    initLineSegments(); // Call init function

    function createNewSoul() {
      const isDewa = Math.random() < DEWA_SPAWN_CHANCE;
      const isHuman = isDewa ? true : Math.random() < 0.5;
      createSoul(isHuman, isDewa); 
    }

    // Connections are now handled by the Web Worker for optimal performance

    function animate() {
      requestAnimationFrame(animate);

      // Phase 4: LOD calculations (before worker update for physics scaling)
      let lodData = null;
      if (FEATURE_FLAGS.USE_LOD_SYSTEM && lodManager && souls.length > 0) {
        // Update LOD levels for all souls
        lodData = lodManager.updateSoulLOD(souls);
      }

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
                lodData: lodData // Pass LOD data for physics and connection optimization
            }
        });
      }

      let spawnRate = NEW_SOUL_SPAWN_RATE
      while (spawnRate > 1) {
        createNewSoul(); 
        spawnRate--;
      }
      if (Math.random() < spawnRate) {
        createNewSoul(); 
      }

      controls.update();
      
      // Phase 3: Track draw calls before render
      renderer.render(scene, camera);
      performanceMetrics.drawCalls = trackDrawCalls(renderer);
      
      // Get FPS metrics from FpsCounter component
      const fpsMetrics = fpsCounter ? fpsCounter.getMetrics() : { fps: 60, averageFPS: 60, memoryUsage: 0 };
      const { fps, averageFPS, memoryUsage } = fpsMetrics;
      
      // Phase 4: Update adaptive performance manager with current metrics (every second)
      if (FEATURE_FLAGS.USE_LOD_SYSTEM && adaptivePerformanceManager && fps > 0) {
        const frameTime = 1000 / fps; // Calculate frame time from fps
        const workerTime = 0; // TODO: Track worker time
        const renderTime = 0; // TODO: Track render time
        
        adaptivePerformanceManager.updateMetrics(
          fps, 
          frameTime, 
          memoryUsage, 
          workerTime, 
          renderTime, 
          souls.length
        );
        
        // Update current quality from adaptive manager using the helper function
        if (adaptivePerformanceManager) {
          const newQualityValue = adaptivePerformanceManager.getCurrentQuality();
          updateCurrentQuality(newQualityValue);
        }
        
        // Update LOD distances if quality changed
        if (lodManager) {
          lodManager.configureForQuality(currentQuality);
        }
      }
      
      // Update global variables for AI test bridge (handled by FpsCounter component)
      if (typeof window !== 'undefined') {
        window.currentQuality = currentQuality;
        window.soulCount = souls.length;
      }
      
      // Adjust quality based on performance every second
      adjustQualityBasedOnFPS(fps);
    }

    animate();

    function handleResize(event) {
      const { width, height } = event?.detail || { 
        width: container.clientWidth, 
        height: container.clientHeight 
      };
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    return () => {
      if (renderer && renderer.domElement) {
        // Remove renderer from container if it's still there
        let threeContainerRef = document.querySelector('#container');
        if (threeContainerRef && threeContainerRef.contains(renderer.domElement)) {
          threeContainerRef.removeChild(renderer.domElement);
        }
      }
      if (renderer) renderer.dispose();
      souls.forEach(soul => {
        soul.geometry?.dispose();
        soul.material?.dispose();
        scene.remove(soul);
      });
      // MODIFIED cleanup for lineSegments
      if (lineSegments) {
        scene.remove(lineSegments);
        lineSegments.geometry.dispose();
        lineSegments.material.dispose();
      }
      // REMOVED old linesGroup cleanup
      if (simulationWorker) {
        simulationWorker.terminate();
      }
      
      // Phase 4: Cleanup LOD and Performance managers
      if (lodManager) {
        setLodManager(null);
      }
      if (adaptivePerformanceManager) {
        setAdaptivePerformanceManager(null);
      }
    };
  });

</script>

<ThreeContainer 
  bind:container={localContainer} 
  on:mousemove={handleMouseMove} 
  on:resize={handleResize} 
/>

<SceneManager 
  onSceneReady={handleSceneReady}
  onResize={handleSceneResize}
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