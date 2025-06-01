<script>

  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls';
  import { InstancedSoulRenderer } from './InstancedSoulRenderer.js';
  import { LODManager } from './LODManager.js';  // Phase 4: LOD System
  import { AdaptivePerformanceManager } from './adaptive-performance.js';  // Phase 4: Adaptive Performance
  import './ai-test-bridge.js';  // Import AI test bridge for performance testing

  // Phase 4: Feature Flags
  const FEATURE_FLAGS = {
    USE_INSTANCED_RENDERING: true, // Enable Phase 3 instanced rendering
    USE_LOD_SYSTEM: true, // Enable Phase 4 LOD system
    FALLBACK_TO_INDIVIDUAL_MESHES: true // Emergency fallback
  };

  // Global settings
  const DEFAULT_SOUL_COUNT = 9; // Fallback value when adaptive performance manager is not available
  
  // Camera and lighting settings
  const CAMERA_SETTINGS = {
    FOV: 60,
    NEAR: 0.1,
    FAR: 1000,
    POSITION: { x: 0, y: 30, z: 60 }
  };
  
  const LIGHTING_SETTINGS = {
    AMBIENT: { color: 0xffffff, intensity: 0.8 },
    DIRECTIONAL: { 
      color: 0xffffff, 
      intensity: 0.7, 
      position: { x: -8, y: 10, z: 8 } 
    },
    POINT_LIGHTS: [
      { color: 0xffccaa, intensity: 0.65, distance: 60, position: { x: 10, y: 4, z: 4 } },
      { color: 0xaaccff, intensity: 0.55, distance: 60, position: { x: -4, y: -6, z: -10 } },
      { color: 0xffffff, intensity: 0.5, distance: 25, position: { x: 0, y: 5, z: -2 } }
    ]
  };
  
  const LINE_SETTINGS = {
    OPACITY: 0.42,
    VERTEX_COORDS: 3,
    VERTICES_PER_LINE: 2
  };
  
  // Geometry settings - consolidated magic numbers
  const GEOMETRY_SETTINGS = {
    HUMAN_RADIUS: 0.15,
    HUMAN_SEGMENTS: { width: 12, height: 12 }, // Reduced from 16x16 for performance
    GPT_SIZE: 0.2,
    DEWA_RADIUS: 0.333,
    DEWA_SEGMENTS: { width: 20, height: 20 }, // Reduced from 32x32 for performance
    MATERIAL_OPACITY: {
      DEFAULT: 0.8,
      DEWA: 0.9
    }
  };
  
  // Connection settings
  const CONNECTION_SETTINGS = {
    INTERACTION_DISTANCE: 6,
    MAX_LINES_MULTIPLIER: 5 // Max lines = soul count * this multiplier
  };
  
  // Material pool settings
  const MATERIAL_POOL_SIZE = 20;
  
  // localStorage keys for parameter persistence
  const STORAGE_KEYS = {
    SPAWN_RATE: 'soul_simulation_spawn_rate',
    MIN_LIFESPAN: 'soul_simulation_min_lifespan',
    MAX_LIFESPAN: 'soul_simulation_max_lifespan'
  };
  
  // Load saved values from localStorage or use defaults
  let NEW_SOUL_SPAWN_RATE = loadFromStorage(STORAGE_KEYS.SPAWN_RATE, 0.7);
  let MIN_LIFESPAN = loadFromStorage(STORAGE_KEYS.MIN_LIFESPAN, 300);
  let MAX_LIFESPAN = loadFromStorage(STORAGE_KEYS.MAX_LIFESPAN, 900);
  
  // Helper functions for localStorage
  function loadFromStorage(key, defaultValue) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (isNaN(parsed)) return defaultValue;
        
        // Validate bounds for each parameter
        if (key === STORAGE_KEYS.SPAWN_RATE) {
          return Math.max(0.1, Math.min(2.0, parsed));
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
  
  function saveToStorage(key, value) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value.toString());
    }
  }
  
  // Reset function to restore default values
  function resetParameters() {
    NEW_SOUL_SPAWN_RATE = 0.4;
    MIN_LIFESPAN = 300;
    MAX_LIFESPAN = 900;
    showToastMessage('Parameters reset to defaults');
  }
  
  // Reactive statements to save values when they change
  $: saveToStorage(STORAGE_KEYS.SPAWN_RATE, NEW_SOUL_SPAWN_RATE);
  $: saveToStorage(STORAGE_KEYS.MIN_LIFESPAN, MIN_LIFESPAN);
  $: saveToStorage(STORAGE_KEYS.MAX_LIFESPAN, MAX_LIFESPAN);
  
  // Reactive validation to ensure MIN_LIFESPAN < MAX_LIFESPAN
  $: if (MIN_LIFESPAN >= MAX_LIFESPAN) {
    MIN_LIFESPAN = MAX_LIFESPAN - 50;
  }
  
  $: AVG_LIFESPAN = (MIN_LIFESPAN + MAX_LIFESPAN) / 2; // Average lifespan of souls in frames

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

  let souls = []; // Declare souls here to make it accessible to the template
  let container;
  
  // FPS counter variables with enhanced metrics
  let fps = 0;
  let frameCount = 0;
  let lastTime = performance.now();
  let averageFPS = 0;
  let fpsHistory = [];
  let memoryUsage = 0;
  
  // Performance tracking
  let renderTime = 0;
  let workerUpdateTime = 0;
  let lastFrameStart = 0;
  
  // Adaptive quality settings
  let currentQuality = 'high';
  let adaptiveSettings = {
    high: { maxConnectionChecks: 150, connectionLimit: 20 },
    medium: { maxConnectionChecks: 100, connectionLimit: 15 },
    low: { maxConnectionChecks: 50, connectionLimit: 10 }
  };
  
  // Expose performance variables globally for AI test bridge
  if (typeof window !== 'undefined') {
    window.currentFPS = 0;
    window.averageFPS = 0;
    window.currentQuality = currentQuality;
    window.soulCount = souls.length;
    window.memoryUsage = 0;
  }
  
  // Equilibrium info toggle for mobile
  let showEquilibriumInfo = false;
  
  // Toast notification for localStorage operations
  let showToast = false;
  let toastMessage = '';
  
  // Phase 3: Performance Metrics for Instanced Rendering
  let performanceMetrics = {
    renderingMode: 'individual',
    drawCalls: 0,
    instancedUpdateTime: 0,
    individualUpdateTime: 0,
    soulsUpdated: 0,
    framesSinceLastLog: 0,
    instancedFrameCount: 0,
    individualFrameCount: 0,
    averageInstancedTime: 0,
    averageIndividualTime: 0
  };

  // Phase 3: Declare variables needed by reactive statements
  let renderingMode = FEATURE_FLAGS.USE_INSTANCED_RENDERING ? 'instanced' : 'individual';
  let instancedRenderer = null;
  let renderer = null;
  
  // Phase 4: LOD and Performance Management
  let lodManager = null;
  let adaptivePerformanceManager = null;
  
  // Phase 3: Performance tracking functions
  function trackDrawCalls(renderer) {
    if (renderer && renderer.info && renderer.info.render) {
      return renderer.info.render.calls;
    }
    return 0;
  }
  
  function logPhase3Performance() {
    // Performance logging removed for production
  }
  
  function showToastMessage(message) {
    toastMessage = message;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, 2000);
  }
  
  function adjustQualityBasedOnFPS() {
    if (fps < 30 && currentQuality !== 'low') {
      currentQuality = 'medium';
      if (fps < 20) currentQuality = 'low';
    } else if (fps > 50 && currentQuality !== 'high') {
      if (currentQuality === 'low') currentQuality = 'medium';
      else if (currentQuality === 'medium') currentQuality = 'high';
    }
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
  let isAutomaticSoulCount = 0; // Flag to indicate if adaptive performance manager is used
  function getEntityCountFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const val = urlParams.get('val');
    
    if (val === null || val === '') {
      // Use adaptive performance manager to determine optimal soul count
      if (adaptivePerformanceManager) {
        const currentQualitySettings = adaptivePerformanceManager.getQualitySettings();
        isAutomaticSoulCount = currentQualitySettings.maxSouls
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

  onMount(() => {
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

    // Auto-open equilibrium info on wider screens
    if (window.innerWidth > 1200) {
      showEquilibriumInfo = true;
    }

    // Handle window resize to show/hide equilibrium info based on screen width
    const handleResize = () => {
      if (window.innerWidth > 1200) {
        showEquilibriumInfo = true;
      }
      // Don't auto-close on smaller screens - let user control
    };

    window.addEventListener('resize', handleResize);
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      CAMERA_SETTINGS.FOV, 
      container.clientWidth / container.clientHeight, 
      CAMERA_SETTINGS.NEAR, 
      CAMERA_SETTINGS.FAR
    );
    camera.position.set(
      CAMERA_SETTINGS.POSITION.x, 
      CAMERA_SETTINGS.POSITION.y, 
      CAMERA_SETTINGS.POSITION.z
    );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new ArcballControls(camera, renderer.domElement, scene);
    controls.enableDamping = true;
    controls.dampingFactor = 0.333;  // Much lower for smoother, more responsive feel
    controls.wMax = 1.3;             // Higher for faster rotation capability
    controls.setGizmosVisible(false);
    
    // Additional recommended ArcballControls settings
    controls.enablePan = true;      // Allow panning
    controls.enableZoom = true;     // Allow zooming
    controls.enableRotate = true;   // Allow rotation
    controls.minDistance = 10;      // Minimum zoom distance
    controls.maxDistance = 300;     // Maximum zoom distance

    // Lights
    const ambientLight = new THREE.AmbientLight(
      LIGHTING_SETTINGS.AMBIENT.color, 
      LIGHTING_SETTINGS.AMBIENT.intensity
    );
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      LIGHTING_SETTINGS.DIRECTIONAL.color, 
      LIGHTING_SETTINGS.DIRECTIONAL.intensity
    );
    directionalLight.position.set(
      LIGHTING_SETTINGS.DIRECTIONAL.position.x,
      LIGHTING_SETTINGS.DIRECTIONAL.position.y,
      LIGHTING_SETTINGS.DIRECTIONAL.position.z
    );
    scene.add(directionalLight);

    // Add point lights
    LIGHTING_SETTINGS.POINT_LIGHTS.forEach((lightConfig, index) => {
      const pointLight = new THREE.PointLight(
        lightConfig.color, 
        lightConfig.intensity, 
        lightConfig.distance
      );
      pointLight.position.set(
        lightConfig.position.x,
        lightConfig.position.y,
        lightConfig.position.z
      );
      scene.add(pointLight);
    });

    // Phase 4: Initialize Adaptive Performance Manager
    if (FEATURE_FLAGS.USE_LOD_SYSTEM) {
      adaptivePerformanceManager = new AdaptivePerformanceManager({
        debug: import.meta.env.DEV,
        enableLearning: true,
        adaptationAggression: 'moderate'
      });
      
      // Phase 4: Initialize LOD Manager with camera and performance manager
      lodManager = new LODManager(camera, adaptivePerformanceManager);
      
      // Configure LOD distances based on initial hardware quality
      const initialQuality = adaptivePerformanceManager.getCurrentQuality();
      lodManager.configureForQuality(initialQuality);
      
      // Make performance manager globally accessible for AI test bridge
      if (typeof window !== 'undefined') {
        window.performanceManager = adaptivePerformanceManager;
      }
    }

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
    renderingMode = useInstancedRendering ? 'instanced' : 'individual';

    // Phase 3: Performance tracking functions
    function trackDrawCalls(renderer) {
      // Track draw calls for Phase 3 performance validation
      if (renderer && renderer.info && renderer.info.render) {
        return renderer.info.render.calls;
      }
      // Fallback estimation based on rendering mode
      return renderingMode === 'instanced' ? 3 : souls.length;
    }

    function logPhase3Performance() {
      // Performance logging removed for production
    }

    // Instanced renderer initialization will happen after souls are created

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
    const mouse = new THREE.Vector2();
    let pointerPosition3D = null;
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const POINTER_INTERACTION_RADIUS = 10;
    const POINTER_INFLUENCE_STRENGTH = 0.05;

    // Neighbor speed influence variables
    const NEIGHBOR_SPEED_INFLUENCE_RADIUS = 5;
    const NEIGHBOR_SPEED_INFLUENCE_STRENGTH = 0.1;

    // Boids-like separation variables
    const SEPARATION_DISTANCE = 1.5;
    const SEPARATION_STRENGTH = 0.05;

    // Dewa entity properties
    const DEWA_ATTRACTION_RADIUS = 15; 
    const DEWA_ATTRACTION_STRENGTH = 0.005; 
    const DEWA_SPAWN_CHANCE = 0.05; 
    const DEWA_BASE_SPEED = 0.02; // Slower, consistent speed for dewas
    const DEWA_ENHANCEMENT_RADIUS = 10; // New: Radius within which dewas enhance other souls
    const ENHANCEMENT_SATURATION_BOOST = 0.2; // New: How much to boost saturation (0 to 1)
    const ENHANCEMENT_LIGHTNESS_BOOST = 0.15; // New: How much to boost lightness (0 to 1)

    let simulationWorker;
    let nextSoulId = 0;

    function onMouseMove(event) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    container.addEventListener('mousemove', onMouseMove);

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
      return mesh; 
    }

    // Initialize the Web Worker
    simulationWorker = new Worker(new URL('./simulation.worker.js', import.meta.url), { type: 'module' });

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
        instancedRenderer = new InstancedSoulRenderer(scene, dynamicMaxSouls);
        
        // Hide individual meshes from scene since we'll use instanced rendering
        souls.forEach(soul => {
          if (soul.parent === scene) {
            scene.remove(soul);
          }
        });
        
        // Perform initial instanced update with existing souls
        instancedRenderer.updateInstances(souls);
        
      } catch (error) {
        renderingMode = 'individual';
        
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
                    const soulMesh = souls.find(s => s.userData.id === updatedSoulData.id);
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
                performanceMetrics.instancedFrameCount++;
                performanceMetrics.averageInstancedTime = performanceMetrics.instancedUpdateTime / performanceMetrics.instancedFrameCount;
                performanceMetrics.renderingMode = 'instanced';            } else {
                // EXISTING: Individual mesh rendering (fallback)
                data.forEach(updatedSoulData => {
                    const soulMesh = souls.find(s => s.userData.id === updatedSoulData.id);
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
                performanceMetrics.individualFrameCount++;
                performanceMetrics.averageIndividualTime = performanceMetrics.individualUpdateTime / performanceMetrics.individualFrameCount;
                performanceMetrics.renderingMode = 'individual';
            }
        } else if (type === 'soulRemoved') {
            const soulIdToRemove = data.soulId;
            const soulMeshToRemove = souls.find(s => s.userData.id === soulIdToRemove);
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
                souls = souls.filter(s => s.userData.id !== soulIdToRemove);
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

      if (Math.random() < NEW_SOUL_SPAWN_RATE) {
        createNewSoul(); 
      }

      controls.update();
      
      // Phase 3: Track draw calls before render
      const drawCallsBefore = trackDrawCalls(renderer);
      renderer.render(scene, camera);
      performanceMetrics.drawCalls = trackDrawCalls(renderer);
      
      // FPS counting logic with enhanced metrics and adaptive quality adjustment
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;
      
      if (elapsed >= 1000) { // Update every second
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        // Phase 4: Update adaptive performance manager with current metrics
        if (FEATURE_FLAGS.USE_LOD_SYSTEM && adaptivePerformanceManager) {
          const frameTime = elapsed / fps;
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
          
          // Update current quality from adaptive manager
          currentQuality = adaptivePerformanceManager.getCurrentQuality();
          
          // Update LOD distances if quality changed
          if (lodManager) {
            lodManager.configureForQuality(currentQuality);
          }
        }
        
        // Update global variables for AI test bridge
        if (typeof window !== 'undefined') {
          window.currentFPS = fps;
          window.averageFPS = averageFPS;
          window.currentQuality = currentQuality;
          window.soulCount = souls.length;
          window.memoryUsage = memoryUsage;
        }
        
        // Track FPS history for average calculation
        fpsHistory.push(fps);
        if (fpsHistory.length > 10) fpsHistory.shift(); // Keep last 10 seconds
        averageFPS = Math.round(fpsHistory.reduce((a, b) => a + b) / fpsHistory.length);
        
        // Memory usage tracking (if available)
        if (performance.memory) {
          memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        
        // Adjust quality based on performance every second
        adjustQualityBasedOnFPS();
        
        // Phase 3: Log performance metrics every 5 seconds
        if (frameCount % 300 === 0) { // Every 5 seconds at 60fps
          logPhase3Performance();
        }
      }
    }

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    return () => {
      // Remove resize event listener to prevent memory leaks
      window.removeEventListener('resize', handleResize);
      
      if (container) {
        container.removeEventListener('mousemove', onMouseMove);
        if (renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
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
        lodManager = null;
      }
      if (adaptivePerformanceManager) {
        adaptivePerformanceManager = null;
      }
    };
  });

  // Phase 3: Reactive statement for performance metrics debugging
  $: if (import.meta.env.DEV && performanceMetrics && renderingMode) {
    // Update performance metrics for logging
    performanceMetrics.renderingMode = renderingMode;
    if (renderer) {
      performanceMetrics.drawCalls = trackDrawCalls(renderer);
    }
    performanceMetrics.framesSinceLastLog++;
    
    // Log metrics at regular intervals
    if (performanceMetrics.framesSinceLastLog >= 60) {
      logPhase3Performance();
      performanceMetrics.framesSinceLastLog = 0;
    }
  }
</script>

<style>
  #container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
  
  .fps-counter {
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: bold;
    z-index: 1000;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
  }

  .left-bottom-link{
    position: fixed;
    bottom: 10px;
    left: 10px;
    display: flex;
    gap: 8px;
  }

  .github-link, .jujiplay-link {
    background: rgba(0, 0, 0, 0.7);
    color: #ffffff; /* Changed to white */
    padding: 8px 12px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 14px; /* Increased font size */
    font-weight: bold;
    z-index: 1000;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    text-decoration: none;
    transition: background-color 0.3s ease;
  }

  .github-link:hover {
    background: rgba(0, 0, 0, 0.9);
    color: #ffffff;
  }
  
  .entity-links {
    position: fixed;
    top: 10px;
    left: 10px;
    display: flex;
    gap: 8px;
    z-index: 1000;
  }
  
  /* Equilibrium toggle button for all screens */
  .equilibrium-toggle {
    position: fixed;
    top: 60px;
    left: 10px;
    background: rgba(0, 0, 0, 0.85);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 8px 12px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    z-index: 1001;
    backdrop-filter: blur(8px);
    display: flex; /* Show on all screens */
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .equilibrium-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
  
  .toggle-icon {
    font-size: 16px;
    color: #ffd700;
  }
  
  .toggle-text {
    font-size: 12px;
  }
  
  /* Remove mobile-only display rule */
  
  .equilibrium-info {
    position: fixed;
    top: 110px;
    left: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.85);
    color: #ffffff;
    padding: 16px 20px;
    border-radius: 10px;
    font-family: 'Courier New', monospace;
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(8px);
    z-index: 1000;
    max-width: 320px;
    line-height: 1.5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    transform: translateY(-20px);
    opacity: 0;
    pointer-events: none;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
  }
  
  .equilibrium-info.show-mobile {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
  
  /* Desktop specific positioning */
  @media (min-width: 769px) {
    .equilibrium-info {
      top: 110px;
      max-width: 320px;
    }
  }
  
  /* Mobile responsive behavior */
  @media (max-width: 768px) {
    .equilibrium-info {
      top: 110px;
      left: 10px;
      right: 10px;
      max-width: none;
    }
  }
  
  .equilibrium-title {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 10px;
    color: #ffd700;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    letter-spacing: 0.5px;
  }
  
  .equilibrium-formula {
    font-size: 13px;
    color: #e0e0e0;
    margin-bottom: 8px;
    font-style: italic;
    background: rgba(255, 255, 255, 0.05);
    padding: 8px 10px;
    border-radius: 6px;
    border-left: 3px solid #4a90e2;
  }
  
  .equilibrium-calculation {
    font-size: 14px;
    color: #00ff88;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    background: rgba(0, 255, 136, 0.1);
    padding: 6px 10px;
    border-radius: 6px;
    border-left: 3px solid #00ff88;
  }

  .equilibrium-text{
    font-weight: bold;

    quote{
      font-style: italic;
      color: #ffcc00;
      background: rgba(255, 204, 0, 0.1);
      padding: 8px 10px;
      border-radius: 6px;
      border-left: 3px solid #ffcc00;
      margin-top: 10px; 
      display: block;
      font-size: small;
    }
  }
  
  /* Parameter Controls Styling */
  .parameter-controls {
    margin: 16px 0;
    padding: 12px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .parameter-control {
    margin-bottom: 12px;
  }
  
  .parameter-control:last-child {
    margin-bottom: 0;
  }
  
  .parameter-control label {
    display: block;
    font-size: 12px;
    color: #e0e0e0;
    margin-bottom: 6px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }
  
  .parameter-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.2);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .parameter-slider:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .parameter-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4a90e2;
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  .parameter-slider::-webkit-slider-thumb:hover {
    background: #5ba0f2;
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
  }
  
  .parameter-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4a90e2;
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  .parameter-slider::-moz-range-thumb:hover {
    background: #5ba0f2;
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
  }
  
  .reset-button {
    width: 100%;
    padding: 8px 12px;
    background: rgba(74, 144, 226, 0.2);
    color: #e0e0e0;
    border: 1px solid rgba(74, 144, 226, 0.4);
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .reset-button:hover {
    background: rgba(74, 144, 226, 0.3);
    border-color: rgba(74, 144, 226, 0.6);
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(74, 144, 226, 0.2);
  }
  
  .reset-button:active {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(74, 144, 226, 0.3);
  }
  
  .entity-link {
    background: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    padding: 6px 10px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 15px;
    font-weight: bold;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    text-decoration: none;
    transition: all 0.2s ease;
  }
  
  .entity-link:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  .entity-link.active {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
    /* animation: breathing-animation 2s ease-in-out infinite; */ /* Removed animation */
  }

  /* Removed keyframes for breathing animation */
  /* @keyframes breathing-animation {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  } */

  .population-counter {
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: bold;
    z-index: 1000;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
  }
  
  .toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: rgba(74, 144, 226, 0.9);
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    font-weight: bold;
    z-index: 2000;
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: all 0.3s ease;
    pointer-events: none;
  }
  
  .toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }

</style>

<div id="container" bind:this={container}></div>
<div class="fps-counter">
  FPS: {fps}
</div>
<div class="population-counter">Population: {souls.length}</div>

<div class="entity-links">
  <a href="?val=33" class="entity-link" class:active={getActiveCount() === 33}>33</a>
  <a href="?val=333" class="entity-link" class:active={getActiveCount() === 333}>333</a>
  <a href="?val=3333" class="entity-link" class:active={getActiveCount() === 3333}>3333</a>
  <a href="/" class="entity-link" class:active={isAutomaticSoulCount}>{isAutomaticSoulCount ? `Auto: ${isAutomaticSoulCount}` : 'Auto'}</a>
</div>

<!-- Toggle button for mobile equilibrium info -->
<button class="equilibrium-toggle" on:click={() => showEquilibriumInfo = !showEquilibriumInfo}>
  <span class="toggle-icon">{showEquilibriumInfo ? '✕' : 'ℹ'}</span>
  <span class="toggle-text">Info</span>
</button>

<div class="equilibrium-info" class:show-mobile={showEquilibriumInfo}>
  <div class="equilibrium-title">Population Equilibrium</div>
  <div class="equilibrium-formula">EquilibriumPopulation ≈ NEW_SOUL_SPAWN_RATE × AVG_LIFESPAN</div>
  <div class="equilibrium-calculation">Current: {NEW_SOUL_SPAWN_RATE} × {AVG_LIFESPAN} = ~{Math.round(NEW_SOUL_SPAWN_RATE*AVG_LIFESPAN)} souls</div>
  
  <!-- Interactive Parameter Controls -->
  <div class="parameter-controls">
    <div class="parameter-control">
      <label for="spawn-rate-slider">Soul Spawn Rate: {NEW_SOUL_SPAWN_RATE.toFixed(2)}</label>
      <input 
        id="spawn-rate-slider"
        type="range" 
        min="0.1" 
        max="2.0" 
        step="0.05" 
        bind:value={NEW_SOUL_SPAWN_RATE}
        class="parameter-slider"
      />
    </div>
    
    <div class="parameter-control">
      <label for="min-lifespan-slider">Min Lifespan: {MIN_LIFESPAN} frames</label>
      <input 
        id="min-lifespan-slider"
        type="range" 
        min="100" 
        max="800" 
        step="50" 
        bind:value={MIN_LIFESPAN}
        class="parameter-slider"
      />
    </div>
    
    <div class="parameter-control">
      <label for="max-lifespan-slider">Max Lifespan: {MAX_LIFESPAN} frames</label>
      <input 
        id="max-lifespan-slider"
        type="range" 
        min="200" 
        max="1500" 
        step="50" 
        bind:value={MAX_LIFESPAN}
        class="parameter-slider"
      />
    </div>
    
    <div class="parameter-control">
      <button class="reset-button" on:click={resetParameters}>
        Reset to Defaults
      </button>
    </div>
  </div>
  
  <div class="equilibrium-text">
    <p>A stable system.</p>
    <div>
      <quote>
        TL;DR: Thomas Malthus (conceptually, 1798) and Pierre François Verhulst (mathematically, 1838) in the 18th-19th century found out about this.
        <br /><br />Yes, this universe is explosion-proof and collapse-proof. Time heals all population wounds.
      </quote>
    </div>
  </div>
</div>

<div class="left-bottom-link">
  <a href="https://jujiplay.com" class="jujiplay-link">
    JujiPlay
  </a>
  <a href="https://github.com/juji/Soul-Recycling-Simulation" target="_blank" class="github-link">
    GitHub
  </a>
</div>

<!-- Toast notification for localStorage operations -->
<div class="toast" class:show={showToast}>
  {toastMessage}
</div>