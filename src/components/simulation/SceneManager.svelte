<!-- src/components/simulation/SceneManager.svelte -->
<script>
  import { onMount, createEventDispatcher, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls';
  import { LODManager } from '../../lib/LODManager';
  import { AdaptivePerformanceManager } from '../../lib/adaptive-performance.js';
  import { FEATURE_FLAGS } from '../../lib/constants/config.js';
  import { CAMERA_SETTINGS, LIGHTING_SETTINGS, CONTROLS_SETTINGS } from '../../lib/constants/rendering';
  
  // Import store getters
  import { 
    container as getContainer,
    setLodManager,
    setAdaptivePerformanceManager
  } from '../../lib/stores/simulationState.svelte.js';

  const dispatch = createEventDispatcher();

  // Local Three.js objects
  let scene = null;
  let camera = null;
  let renderer = null;
  let controls = null;
  let lodManager = null;
  let adaptivePerformanceManager = null;

  // Get container reference from store - using onMount instead of $derived for compatibility
  let container = null;

  function initializeScene() {
    if (!container) {
      console.warn('SceneManager: Container not available yet');
      return;
    }

    try {
      // Create scene
      scene = new THREE.Scene();
      
      // Create camera
      camera = new THREE.PerspectiveCamera(
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

      // Create renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      
      // Add renderer to container
      container.appendChild(renderer.domElement);

      // Setup controls with passive event listener fix
      setupControls();
      
      // Setup lighting
      setupLighting();
      
      // Initialize performance managers
      initializePerformanceManagers();
      
      // Dispatch scene ready event
      dispatch('sceneReady', {
        scene,
        camera,
        renderer,
        controls
      });
      
    } catch (error) {
      console.error('❌ SceneManager: Error during initialization:', error);
    }
  }

  function setupControls() {
    // Fix passive event listener warning before creating controls
    if (!window.__wheelEventPatched) {
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'wheel' && this instanceof HTMLElement) {
          const newOptions = typeof options === 'object' ? { ...options, passive: false } : { passive: false };
          return originalAddEventListener.call(this, type, listener, newOptions);
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
      
      window.__wheelEventPatched = true;
    }

    // Create controls
    controls = new ArcballControls(camera, renderer.domElement, scene);
    controls.enableDamping = true;
    controls.dampingFactor = CONTROLS_SETTINGS.DAMPING_FACTOR;  
    controls.wMax = CONTROLS_SETTINGS.W_MAX;             
    controls.setGizmosVisible(false);
    
    // Additional control settings
    controls.enablePan = CONTROLS_SETTINGS.ENABLE_PAN;      
    controls.enableZoom = CONTROLS_SETTINGS.ENABLE_ZOOM;     
    controls.enableRotate = CONTROLS_SETTINGS.ENABLE_ROTATE;   
    controls.minDistance = CONTROLS_SETTINGS.MIN_DISTANCE;      
    controls.maxDistance = CONTROLS_SETTINGS.MAX_DISTANCE;
  }

  function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      LIGHTING_SETTINGS.AMBIENT.color, 
      LIGHTING_SETTINGS.AMBIENT.intensity
    );
    scene.add(ambientLight);

    // Directional light
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

    // Point lights
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
  }

  function initializePerformanceManagers() {
    if (FEATURE_FLAGS.USE_LOD_SYSTEM) {
      // Initialize Adaptive Performance Manager
      adaptivePerformanceManager = new AdaptivePerformanceManager({
        debug: import.meta.env.DEV,
        enableLearning: true,
        adaptationAggression: 'moderate'
      });
      setAdaptivePerformanceManager(adaptivePerformanceManager);
      
      // Initialize LOD Manager
      lodManager = new LODManager(camera, adaptivePerformanceManager);
      setLodManager(lodManager);
      
      // Configure LOD distances based on initial hardware quality
      const initialQuality = adaptivePerformanceManager.getCurrentQuality();
      lodManager.configureForQuality(initialQuality);
      
      // Make performance manager globally accessible for AI test bridge
      if (typeof window !== 'undefined') {
        window.performanceManager = adaptivePerformanceManager;
      }
    }
  }

  function handleResize() {
    if (!camera || !renderer || !container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    dispatch('resize', { width, height });
  }

  // Clean up resources
  function cleanup() {
    if (renderer && renderer.domElement && container) {
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    }
    
    if (renderer) {
      renderer.dispose();
    }
    
    if (controls) {
      controls.dispose();
    }
    
    if (lodManager) {
      setLodManager(null);
    }
    
    if (adaptivePerformanceManager) {
      setAdaptivePerformanceManager(null);
    }
  }

  // Wait for container to be available, then initialize
  onMount(() => {
    // Set up a watcher for container availability
    const checkContainer = () => {
      container = getContainer();
      if (container && !scene) {
        // Small delay to ensure container is fully rendered
        setTimeout(initializeScene, 10);
      } else if (!container) {
        // Keep checking if container is not ready yet
        setTimeout(checkContainer, 50);
      }
    };
    checkContainer();

    // Handle window resize
    const handleWindowResize = () => handleResize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleWindowResize);
    }

    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleWindowResize);
      }
    };
  });

  onDestroy(() => {
    cleanup();
  });
</script>

<!-- SceneManager handles Three.js scene setup behind the scenes -->