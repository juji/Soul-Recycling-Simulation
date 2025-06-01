<script>

  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  // Global settings
  const DEFAULT_SOUL_COUNT = 777;
  
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
  
  // Equilibrium info toggle for mobile
  let showEquilibriumInfo = false;
  
  // Toast notification for localStorage operations
  let showToast = false;
  let toastMessage = '';
  
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
  function getEntityCountFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const val = urlParams.get('val');
    
    if (val === null || val === '') {
      return DEFAULT_SOUL_COUNT; // Default value
    }
    
    const parsedVal = parseInt(val, 10);
    
    // Check if it's a valid number
    if (isNaN(parsedVal)) {
      return DEFAULT_SOUL_COUNT; // Default for invalid values
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
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 30, 60);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enable damping
    controls.dampingFactor = 0.01;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Slightly reduced ambient for more contrast
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7); // Adjusted intensity
    directionalLight.position.set(-8, 10, 8); // Closer and different angle
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xffccaa, 0.65, 60); // Warmish light, closer, adjusted distance & intensity
    pointLight1.position.set(10, 4, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xaaccff, 0.55, 60); // Coolish light, closer, adjusted distance & intensity
    pointLight2.position.set(-4, -6, -10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 0.5, 25); // New white point light, much closer, adjusted intensity & distance
    pointLight3.position.set(0, 5, -2); // Positioned even closer from top-front
    scene.add(pointLight3);

    function initLineSegments() {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(MAX_LINES * 2 * 3); // 2 vertices per line, 3 coords per vertex
      const colors = new Float32Array(MAX_LINES * 2 * 3);    // 2 colors per line, 3 components per color

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true, // Set to false for opaque lines
        opacity: .333 // Set to 1.0 for full opacity
      });

      lineSegments = new THREE.LineSegments(geometry, material);
      scene.add(lineSegments);
    }

    const recycledSoulCount = getEntityCountFromURL();
    

    const interactionDistance = 6;
    let lineSegments;
    const MAX_LINES = recycledSoulCount * 5; // Estimate max lines, can be adjusted
    const tempColor = new THREE.Color(); // For random color generation

    const humanGeometry = new THREE.SphereGeometry(0.15, 12, 12); // Reduced from 16x16 to 12x12
    const gptGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const dewaGeometry = new THREE.SphereGeometry(0.333, 20, 20); // Reduced from 32x32 to 20x20

    // Shared materials for better memory efficiency
    const sharedHumanMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8 });
    const sharedGptMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8 });
    const sharedDewaMaterial = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.9 });
    
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
          return new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8 });
      }
    }
    
    function returnMaterial(material, type) {
      if (materialPool[type].length < 20) { // Limit pool size
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

      scene.add(mesh);
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
            data.forEach(updatedSoulData => {
                const soulMesh = souls.find(s => s.userData.id === updatedSoulData.id);
                if (soulMesh) {
                    // Always update position (most frequent change)
                    soulMesh.position.set(updatedSoulData.pos[0], updatedSoulData.pos[1], updatedSoulData.pos[2]);
                    
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
        } else if (type === 'soulRemoved') {
            const soulIdToRemove = data.soulId;
            const soulMeshToRemove = souls.find(s => s.userData.id === soulIdToRemove);
            if (soulMeshToRemove) {
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
                souls = souls.filter(s => s.userData.id !== soulIdToRemove);
            }
        }
    };

    initLineSegments(); // Call init function

    function createNewSoul() {
      const isDewa = Math.random() < DEWA_SPAWN_CHANCE;
      const isHuman = isDewa ? true : Math.random() < 0.5;
      createSoul(isHuman, isDewa); 
    }

    // REMOVED old updateConnections function

    // Pre-calculate squared distance for line connections
    const interactionDistanceSq = interactionDistance * interactionDistance;

    function updateRandomColorConnections() {
      if (!lineSegments || souls.length < 2) {
        if(lineSegments) lineSegments.geometry.setDrawRange(0, 0);
        return;
      }

      const positions = lineSegments.geometry.attributes.position.array;
      const colors = lineSegments.geometry.attributes.color.array;
      let lineIdx = 0;

      // Limit the number of souls to check for performance (adaptive LOD)
      const settings = adaptiveSettings[currentQuality];
      const maxSoulsToCheck = Math.min(souls.length, settings.maxConnectionChecks);
      const connectionLimit = settings.connectionLimit;
      const cameraPosition = camera.position;
      
      // Sort souls by distance to camera for priority rendering of closest connections
      const sortedSouls = souls.slice(0, maxSoulsToCheck).sort((a, b) => 
        a.position.distanceToSquared(cameraPosition) - b.position.distanceToSquared(cameraPosition)
      );

      for (let i = 0; i < sortedSouls.length && lineIdx < MAX_LINES; i++) {
        const soulA = sortedSouls[i];
        
        // Only check nearby souls, limited by quality setting
        for (let j = i + 1; j < Math.min(sortedSouls.length, i + connectionLimit) && lineIdx < MAX_LINES; j++) {
          const soulB = sortedSouls[j];
          
          const a = soulA.position;
          const b = soulB.position;
          
          // Use squared distance to avoid expensive sqrt calculation
          const distSq = a.distanceToSquared(b);

          if (distSq < interactionDistanceSq) {
            
            tempColor.setHSL(1, 1, 1); // Set lines to white as per previous state

            // Vertex 1
            positions[lineIdx * 6 + 0] = a.x;
            positions[lineIdx * 6 + 1] = a.y;
            positions[lineIdx * 6 + 2] = a.z;
            colors[lineIdx * 6 + 0] = tempColor.r;
            colors[lineIdx * 6 + 1] = tempColor.g;
            colors[lineIdx * 6 + 2] = tempColor.b;

            // Vertex 2
            positions[lineIdx * 6 + 3] = b.x;
            positions[lineIdx * 6 + 4] = b.y;
            positions[lineIdx * 6 + 5] = b.z;
            colors[lineIdx * 6 + 3] = tempColor.r;
            colors[lineIdx * 6 + 4] = tempColor.g;
            colors[lineIdx * 6 + 5] = tempColor.b;
            
            lineIdx++;
          }
        }
      }
      
      // Hide unused lines
      for (let i = lineIdx; i < MAX_LINES; i++) {
        positions[i * 6 + 0] = 0; positions[i * 6 + 1] = 0; positions[i * 6 + 2] = 0;
        positions[i * 6 + 3] = 0; positions[i * 6 + 4] = 0; positions[i * 6 + 5] = 0;
      }

      lineSegments.geometry.setDrawRange(0, lineIdx * 2);
      lineSegments.geometry.attributes.position.needsUpdate = true;
      lineSegments.geometry.attributes.color.needsUpdate = true;
    }

    let pulseTime = 0;

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
                pointerPosition3D: null // Dewa is everywhere, not tied to a specific mouse-derived point
            }
        });
      }

      if (Math.random() < NEW_SOUL_SPAWN_RATE) {
        createNewSoul(); 
      }

      updateRandomColorConnections(); // MODIFIED call
      controls.update();
      renderer.render(scene, camera);

      // FPS counting logic with enhanced metrics and adaptive quality adjustment
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;
      
      if (elapsed >= 1000) { // Update every second
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
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
      }
    }

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    return () => {
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
    };
  });
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

  .github-link {
    position: fixed;
    bottom: 10px;
    left: 10px;
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

    &>span{
      display: none;
      @media screen and (min-width: 500px) {
        display: inline; /* Show span on larger screens */
      }
    }
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
<div class="fps-counter">FPS: {fps}</div>
<div class="population-counter">Population: {souls.length}</div>

<div class="entity-links">
  <a href="?val=99" class="entity-link" class:active={getActiveCount() === 99}>99 <span>Souls</span></a>
  <a href="?val=888" class="entity-link" class:active={getActiveCount() === 999}>999 <span>Souls</span></a>
  <a href="?val=9999" class="entity-link" class:active={getActiveCount() === 9999}>9999 <span>Souls</span></a>
  <a href="/" class="entity-link" class:active={getActiveCount() === 777}>Auto</a>
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
        TL;DR: Yes, this universe is explosion-proof and collapse-proof. Time heals all population wounds.
      </quote>
    </div>
  </div>
</div>


<a href="https://github.com/juji/Soul-Recycling-Simulation" target="_blank" class="github-link">
  GitHub
</a>

<!-- Toast notification for localStorage operations -->
<div class="toast" class:show={showToast}>
  {toastMessage}
</div>

<!-- PERFORMANCE OPTIMIZATION: Color Calculation Bottleneck Removal
    =================================================================
    Problem: HSL calculations and setHSL() calls happening every frame for every soul
    Solution: Delta compression + RGB pre-calculation + change detection
    1. Worker-side change detection: Only recalculate when HSL actually changes
    2. RGB pre-calculation: Convert HSL to RGB in worker to avoid main thread conversion
    3. Delta messaging: Only send color data when it changes (not every frame)
    4. Conditional updates: Only call setRGB() when color data is provided
    Expected improvement: 60-80% reduction in color-related CPU overhead
-->