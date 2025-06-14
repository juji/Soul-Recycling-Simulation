# Soul Recycling Simulation - App.svelte Refactoring Plan

## Current Issues

The current `App.svelte` file has several issues:

1. **Size**: The file is over 1200 lines long, making it difficult to maintain
2. **Responsibility mixture**: The file handles both UI components and complex ThreeJS simulation logic
3. **Tight coupling**: Components are tightly coupled through props, bindings, and event handlers
4. **State management**: State is scattered throughout the component rather than centralized

## Refactoring Goals

1. Make `App.svelte` clean and minimal - it should only import components and display them
2. Use Svelte's `$state` for component-to-component communication
3. Extract simulation logic into dedicated components and modules
4. Improve maintainability by separating concerns

## Implementation Plan

### 1. Create a Centralized State Store

Create a new file `src/lib/stores/simulationState.js` to manage shared state:

```javascript
// src/lib/stores/simulationState.js
// Use Svelte's $state to enable global state access

// Core simulation state
export const souls = $state([]);
export const soulLookupMap = $state(new Map());
export const renderingMode = $state('instanced');
export const currentQuality = $state('high');
export const isAutomaticSoulCount = $state(0);

// Simulation parameters with localStorage sync
export const NEW_SOUL_SPAWN_RATE = $state(0.7);
export const MIN_LIFESPAN = $state(300);
export const MAX_LIFESPAN = $state(900);

// Performance tracking
export const performanceMetrics = $state({
  renderingMode: 'individual',
  drawCalls: 0,
  instancedUpdateTime: 0,
  individualUpdateTime: 0,
  soulsUpdated: 0
});

// Derived values
export const AVG_LIFESPAN = $derived((MIN_LIFESPAN + MAX_LIFESPAN) / 2);
export const EQUILIBRIUM_POPULATION = $derived(NEW_SOUL_SPAWN_RATE * AVG_LIFESPAN);

// Reference handlers
export const toastNotification = $state(null);
export const fpsCounter = $state(null);
export const container = $state(null);

// Core functions
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../localStorage.js';

// State management functions
export function resetParameters() {
  NEW_SOUL_SPAWN_RATE = 0.7;
  MIN_LIFESPAN = 300;
  MAX_LIFESPAN = 900;
  showToastMessage('Parameters reset to defaults');
}

export function updateCurrentQuality(newValue) {
  currentQuality = newValue;
}

export function showToastMessage(message) {
  toastNotification?.showToast(message);
}

// Initialize effects for localStorage syncing
$effect(() => {
  saveToStorage(STORAGE_KEYS.SPAWN_RATE, NEW_SOUL_SPAWN_RATE);
});

$effect(() => {
  saveToStorage(STORAGE_KEYS.MIN_LIFESPAN, MIN_LIFESPAN);
});

$effect(() => {
  saveToStorage(STORAGE_KEYS.MAX_LIFESPAN, MAX_LIFESPAN);
});
```

### 2. Extract Constants to a Configuration File

Create `src/lib/config.js` to store all configuration constants:

```javascript
// src/lib/config.js

// Feature flags
export const FEATURE_FLAGS = {
  USE_INSTANCED_RENDERING: true,
  USE_LOD_SYSTEM: true,
  FALLBACK_TO_INDIVIDUAL_MESHES: true
};

// Global settings
export const DEFAULT_SOUL_COUNT = 999;

// Camera and lighting settings
export const CAMERA_SETTINGS = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,
  POSITION: { x: 0, y: 30, z: 60 }
};

export const LIGHTING_SETTINGS = {
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

export const LINE_SETTINGS = {
  OPACITY: 0.42,
  VERTEX_COORDS: 3,
  VERTICES_PER_LINE: 2
};

export const GEOMETRY_SETTINGS = {
  HUMAN_RADIUS: 0.15,
  HUMAN_SEGMENTS: { width: 12, height: 12 },
  GPT_SIZE: 0.2,
  DEWA_RADIUS: 0.333,
  DEWA_SEGMENTS: { width: 20, height: 20 },
  MATERIAL_OPACITY: {
    DEFAULT: 0.8,
    DEWA: 0.9
  }
};

export const CONNECTION_SETTINGS = {
  INTERACTION_DISTANCE: 6,
  MAX_LINES_MULTIPLIER: 5
};

export const MATERIAL_POOL_SIZE = 20;

// Physics constants
export const PHYSICS = {
  POINTER_INTERACTION_RADIUS: 10,
  POINTER_INFLUENCE_STRENGTH: 0.05,
  NEIGHBOR_SPEED_INFLUENCE_RADIUS: 5,
  NEIGHBOR_SPEED_INFLUENCE_STRENGTH: 0.1,
  SEPARATION_DISTANCE: 1.5,
  SEPARATION_STRENGTH: 0.05,
  DEWA_ATTRACTION_RADIUS: 15,
  DEWA_ATTRACTION_STRENGTH: 0.005,
  DEWA_SPAWN_CHANCE: 0.05,
  DEWA_BASE_SPEED: 0.02,
  DEWA_ENHANCEMENT_RADIUS: 10,
  ENHANCEMENT_SATURATION_BOOST: 0.2,
  ENHANCEMENT_LIGHTNESS_BOOST: 0.15
};
```

### 3. Create a Simulation Manager Component

Create `src/components/SimulationManager.svelte` to handle all the ThreeJS simulation logic:

```javascript
<!-- src/components/SimulationManager.svelte -->
<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls';
  import { InstancedSoulRenderer } from '../lib/InstancedSoulRenderer.js';
  import { LODManager } from '../lib/LODManager.js';
  import { AdaptivePerformanceManager } from '../lib/adaptive-performance.js';
  import { loadFromStorage, STORAGE_KEYS } from '../lib/localStorage.js';
  
  // Import from global state
  import {
    souls, soulLookupMap, renderingMode, currentQuality,
    performanceMetrics, NEW_SOUL_SPAWN_RATE, MIN_LIFESPAN,
    MAX_LIFESPAN, isAutomaticSoulCount, container, fpsCounter,
    updateCurrentQuality, showToastMessage
  } from '../lib/stores/simulationState.js';
  
  // Import configuration
  import {
    FEATURE_FLAGS, DEFAULT_SOUL_COUNT, CAMERA_SETTINGS,
    LIGHTING_SETTINGS, LINE_SETTINGS, GEOMETRY_SETTINGS,
    CONNECTION_SETTINGS, MATERIAL_POOL_SIZE, PHYSICS
  } from '../lib/config.js';
  
  // Define the mouse at component level
  const mouse = $state(new THREE.Vector2());
  
  // The rest of the onMount function and helper functions go here
  // (Extracted from App.svelte - the simulation core logic)
  
  // Helper function to get entity count from URL parameter
  function getEntityCountFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const val = urlParams.get('val');
    
    if (val === null || val === '') {
      // Use adaptive performance manager to determine optimal soul count
      if (adaptivePerformanceManager) {
        const currentQualitySettings = adaptivePerformanceManager.getQualitySettings();
        isAutomaticSoulCount = currentQualitySettings.maxSouls;
        return currentQualitySettings.maxSouls;
      }
      return DEFAULT_SOUL_COUNT; // Fallback
    }
    
    const parsedVal = parseInt(val, 10);
    
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
  
  function handleMouseMove(event) {
    const { mouseX, mouseY } = event.detail;
    mouse.x = mouseX;
    mouse.y = mouseY;
  }
  
  function handleResize(event) {
    // Resize handler implementation
  }
  
  // All the other simulation functions would go here...
  
  onMount(() => {
    // The entire simulation initialization and animation loop
    // Extracted from App.svelte
    
    return () => {
      // Cleanup logic
    };
  });
</script>

<!-- This component has no visible UI - it just manages the simulation -->
```

### 4. Update Component Communication

Update all components to use the shared state directly:

1. **FpsCounter.svelte**:
   ```javascript
   <!-- No need to bind using props - use $state directly -->
   <script>
     import { fpsCounter } from '../lib/stores/simulationState.js';
     
     // Set the reference when component initializes
     import { onMount } from 'svelte';
     onMount(() => {
       fpsCounter = this;
     });
     
     // Rest of component logic
   </script>
   ```

2. **PopulationCounter.svelte**:
   ```javascript
   <script>
     import { souls } from '../lib/stores/simulationState.js';
   </script>
   
   <div class="population-counter">
     {souls.length}
   </div>
   ```

3. **EntityLinks.svelte**:
   ```javascript
   <script>
     import { isAutomaticSoulCount } from '../lib/stores/simulationState.js';
     import { DEFAULT_SOUL_COUNT } from '../lib/config.js';
     
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
   </script>
   
   <!-- Component template -->
   ```

4. **EquilibriumInfo.svelte**:
   ```javascript
   <script>
     import {
       NEW_SOUL_SPAWN_RATE, MIN_LIFESPAN, MAX_LIFESPAN,
       AVG_LIFESPAN, EQUILIBRIUM_POPULATION, resetParameters
     } from '../lib/stores/simulationState.js';
     
     // Component logic
   </script>
   
   <!-- Component template -->
   ```

5. **ToastNotification.svelte**:
   ```javascript
   <script>
     import { onMount } from 'svelte';
     import { toastNotification } from '../lib/stores/simulationState.js';
     
     onMount(() => {
       toastNotification = this;
     });
     
     // Component logic
   </script>
   ```

### 5. Clean Up App.svelte

Finally, simplify App.svelte to be a clean container component:

```svelte
<!-- src/App.svelte -->
<script>
  // Import the AI test bridge for performance testing
  import './lib/ai-test-bridge.js';
  
  // Import UI components
  import SimulationManager from './components/SimulationManager.svelte';
  import ThreeContainer from './components/ThreeContainer.svelte';
  import FpsCounter from './components/FpsCounter.svelte';
  import PopulationCounter from './components/PopulationCounter.svelte';
  import EntityLinks from './components/EntityLinks.svelte';
  import SliderControls from './components/SliderControls.svelte';
  import EquilibriumInfo from './components/EquilibriumInfo.svelte';
  import BottomLinks from './components/BottomLinks.svelte';
  import ToastNotification from './components/ToastNotification.svelte';
  
  // Import the centralized state
  import { container } from './lib/stores/simulationState.js';
</script>

<!-- Main application layout -->
<div class="app-container">
  <!-- Three.js container -->
  <ThreeContainer bind:container />
  
  <!-- Simulation manager - this now handles all the ThreeJS logic -->
  <SimulationManager />
  
  <!-- UI Components -->
  <div class="ui-overlay">
    <FpsCounter />
    <PopulationCounter />
    <EntityLinks />
    <SliderControls 
      spawnRate={NEW_SOUL_SPAWN_RATE}
      minLifespan={MIN_LIFESPAN}
      maxLifespan={MAX_LIFESPAN} />
    <EquilibriumInfo />
  </div>
  
  <BottomLinks />
  <ToastNotification />
</div>

<style>
  /* Keep existing styles */
</style>
```

## Sample Implementation Schedule

Breaking the refactoring into multiple sessions can help manage complexity and reduce risk. Here's a suggested schedule:

### Session 1: Setup and Simple Components (1-2 hours)
- Create config.js
- Create simulationState.js (basic structure)
- Migrate PopulationCounter
- Migrate EntityLinks
- Test and verify

### Session 2: State Management (1-2 hours)
- Expand simulationState.js
- Implement state effects
- Migrate EquilibriumInfo
- Migrate ToastNotification
- Migrate FpsCounter
- Test and verify

### Session 3: Start Simulation Logic Migration (2-3 hours)
- Create SimulationManager skeleton
- Move ThreeJS container integration
- Move constants to use config.js
- Move Web Worker initialization
- Test and verify

### Session 4: Complete Simulation Logic Migration (2-3 hours)
- Move scene setup and rendering
- Move animation loop
- Move LOD and adaptive performance management
- Test and verify

### Session 5: Finalize and Polish (1-2 hours)
- Clean up App.svelte
- Final testing and verification
- Performance optimization if needed
- Documentation updates

This schedule breaks down the work into manageable sessions, each ending with a working application state that can be verified before proceeding to the next step.

# Detailed Implementation Steps

## Session 1: Setup and Simple Components

### 1.1. Create Config File

First, create the configuration file without changing any existing code:

```bash
mkdir -p src/lib/config
touch src/lib/config/index.js
```

Then extract all constants from App.svelte to `src/lib/config/index.js`. Start with:

```javascript
// src/lib/config/index.js

// Feature flags
export const FEATURE_FLAGS = {
  USE_INSTANCED_RENDERING: true, // Enable Phase 3 instanced rendering
  USE_LOD_SYSTEM: true, // Enable Phase 4 LOD system
  FALLBACK_TO_INDIVIDUAL_MESHES: true // Emergency fallback
};

// Global settings
export const DEFAULT_SOUL_COUNT = 999; // Fallback value when adaptive performance manager is not available

// Camera and lighting settings
export const CAMERA_SETTINGS = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,
  POSITION: { x: 0, y: 30, z: 60 }
};

// Continue extracting all constants...
```

### 1.2. Create Basic State Store

Create the state store with minimal essential state:

```bash
mkdir -p src/lib/stores
touch src/lib/stores/simulationState.js
```

Add the basic state structure:

```javascript
// src/lib/stores/simulationState.js

// Core simulation state - start with only what we need for the first components
export const souls = $state([]);
export const soulLookupMap = $state(new Map());

// Reference handlers - will be populated later
export const toastNotification = $state(null);
export const container = $state(null);
```

### 1.3. Migrate PopulationCounter Component

Update `PopulationCounter.svelte` to use the global state:

Original:
```javascript
<script>
  export let soulCount = 0;
</script>

<div class="population-counter">
  {soulCount}
</div>
```

New:
```javascript
<script>
  import { souls } from '../lib/stores/simulationState.js';
</script>

<div class="population-counter">
  {souls.length}
</div>
```

Then modify App.svelte to:
1. Import the simulation state
2. Remove the soulCount prop from PopulationCounter

```svelte
<!-- In App.svelte -->
<script>
  import { souls, soulLookupMap } from './lib/stores/simulationState.js';
  
  // When updating the souls array, use the global state
  $effect(() => {
    // Keep both in sync until fully migrated
    souls = [...soulsLocal]; // Copy local souls to global state
  });
</script>

<!-- Change this: -->
<PopulationCounter soulCount={souls.length} />
<!-- To this: -->
<PopulationCounter />
```

## Session 2: State Management

### 2.1. Expand SimulationState with Parameters

Add simulation parameters to the state file:

```javascript
// src/lib/stores/simulationState.js

// Import required dependency
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../localStorage.js';

// Add simulation parameters
export const NEW_SOUL_SPAWN_RATE = $state(loadFromStorage(STORAGE_KEYS.SPAWN_RATE, 0.7));
export const MIN_LIFESPAN = $state(loadFromStorage(STORAGE_KEYS.MIN_LIFESPAN, 300));
export const MAX_LIFESPAN = $state(loadFromStorage(STORAGE_KEYS.MAX_LIFESPAN, 900));
export const currentQuality = $state('high');

// Derived values 
export const AVG_LIFESPAN = $derived((MIN_LIFESPAN + MAX_LIFESPAN) / 2);
export const EQUILIBRIUM_POPULATION = $derived(NEW_SOUL_SPAWN_RATE * AVG_LIFESPAN);

// Helper functions
export function resetParameters() {
  NEW_SOUL_SPAWN_RATE = 0.7;
  MIN_LIFESPAN = 300;
  MAX_LIFESPAN = 900;
  showToastMessage('Parameters reset to defaults');
}

export function showToastMessage(message) {
  toastNotification?.showToast(message);
}

// Initialize effects for localStorage persistence
$effect(() => {
  saveToStorage(STORAGE_KEYS.SPAWN_RATE, NEW_SOUL_SPAWN_RATE);
});

$effect(() => {
  saveToStorage(STORAGE_KEYS.MIN_LIFESPAN, MIN_LIFESPAN);
});

$effect(() => {
  saveToStorage(STORAGE_KEYS.MAX_LIFESPAN, MAX_LIFESPAN);
});
```

### 2.2. Migrate EquilibriumInfo Component

Update `EquilibriumInfo.svelte` to use global state:

Original:
```javascript
<script>
  export let spawnRate;
  export let minLifespan;
  export let maxLifespan;
  export let avgLifespan;
  export let equilibriumPopulation;
  export let onReset;
</script>

<div class="equilibrium-info">
  <!-- Component template... -->
  <button on:click={onReset}>Reset</button>
</div>
```

New:
```javascript
<script>
  import {
    NEW_SOUL_SPAWN_RATE,
    MIN_LIFESPAN,
    MAX_LIFESPAN,
    AVG_LIFESPAN,
    EQUILIBRIUM_POPULATION,
    resetParameters
  } from '../lib/stores/simulationState.js';
</script>

<div class="equilibrium-info">
  <!-- Update template to use imported state -->
  <button on:click={resetParameters}>Reset</button>
</div>
```

Update App.svelte:
```svelte
<!-- Change this: -->
<EquilibriumInfo
  spawnRate={NEW_SOUL_SPAWN_RATE}
  minLifespan={MIN_LIFESPAN}
  maxLifespan={MAX_LIFESPAN}
  avgLifespan={AVG_LIFESPAN}
  equilibriumPopulation={EQUILIBRIUM_POPULATION}
  onReset={handleReset}
/>

<!-- To this: -->
<EquilibriumInfo />
```

### 2.3. Migrate ToastNotification Component

Update `ToastNotification.svelte`:

```javascript
<script>
  import { onMount } from 'svelte';
  import { toastNotification } from '../lib/stores/simulationState.js';
  
  // Existing component code...
  
  onMount(() => {
    // Register this component instance in the global state
    toastNotification = {
      showToast: (message) => {
        // Existing showToast implementation
      }
    };
    
    return () => {
      // Cleanup by clearing reference when component is unmounted
      if (toastNotification === this) {
        toastNotification = null;
      }
    };
  });
</script>

<!-- Existing component template -->
```

In App.svelte, remove the toast notification binding and showToastMessage function.

## Session 3: Start Simulation Logic Migration

### 3.1. Create SimulationManager Skeleton

Create the simulation manager component:

```bash
touch src/components/SimulationManager.svelte
```

Set up the basic structure:

```svelte
<!-- src/components/SimulationManager.svelte -->
<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  
  // Import from global state (just what we need for now)
  import { 
    souls, 
    soulLookupMap, 
    container 
  } from '../lib/stores/simulationState.js';
  
  // Import from config (minimal for now)
  import {
    FEATURE_FLAGS,
    DEFAULT_SOUL_COUNT
  } from '../lib/config/index.js';
  
  // Local state
  const mouse = $state(new THREE.Vector2());
  
  // Mouse handler that will connect with ThreeContainer
  function handleMouseMove(event) {
    const { mouseX, mouseY } = event.detail;
    mouse.x = mouseX;
    mouse.y = mouseY;
  }
  
  onMount(() => {
    // We'll gradually move simulation code here
    // For now, just log that we're initialized
    console.log("SimulationManager initialized");
    
    return () => {
      // Cleanup logic
    };
  });
</script>

<!-- No visible UI -->
```

Add to App.svelte without removing any existing code yet:

```svelte
<script>
  // Add import
  import SimulationManager from './components/SimulationManager.svelte';
</script>

<!-- Add component near the top of the template -->
<SimulationManager />

<!-- Keep all existing code for now -->
```

### 3.2. Move ThreeJS Container Integration

Update the `ThreeContainer.svelte` component:

```javascript
<script>
  import { onMount } from 'svelte';
  import { container } from '../lib/stores/simulationState.js';
  
  // Export container ref for backward compatibility during migration
  export let containerRef = undefined;
  
  let localContainer;
  
  onMount(() => {
    // Update both the global state and the exported prop
    container = localContainer;
    if (containerRef !== undefined) {
      containerRef = localContainer;
    }
  });
  
  // Keep existing event handlers
</script>

<div bind:this={localContainer} id="container">
  <!-- Existing content -->
</div>
```

### 3.3. Move Web Worker Setup to SimulationManager

First, expand the state store:

```javascript
// Add to simulationState.js
export const simulationWorker = $state(null);
```

Then, update SimulationManager to initialize the worker:

```javascript
// In SimulationManager.svelte
import { simulationWorker, showToastMessage } from '../lib/stores/simulationState.js';

// Add the initialization in onMount
onMount(() => {
  // Initialize the Web Worker
  simulationWorker = new Worker(
    new URL('../lib/simulation.worker.js', import.meta.url), 
    { type: 'module' }
  );
  
  // We won't handle messages yet, just set up the worker
  console.log("Worker initialized in SimulationManager");
});
```

## Session 4: Complete Simulation Logic Migration

### 4.1. Move Three.js Scene Setup

Expand SimulationManager:

```javascript
// In SimulationManager.svelte
import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls';
import { 
  container, souls, performanceMetrics 
} from '../lib/stores/simulationState.js';
import { 
  CAMERA_SETTINGS, LIGHTING_SETTINGS 
} from '../lib/config/index.js';

// Add scene and renderer state
let scene = $state(null);
let camera = $state(null);
let renderer = $state(null);
let controls = $state(null);

onMount(() => {
  // Initialize Three.js scene
  scene = new THREE.Scene();
  
  // Wait for container to be ready
  const checkContainer = setInterval(() => {
    if (container) {
      clearInterval(checkContainer);
      
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
      container.appendChild(renderer.domElement);
      
      // Setup controls
      setupControls();
      
      // Setup lights
      setupLights();
    }
  }, 100);
  
  // Cleanup
  return () => {
    clearInterval(checkContainer);
    if (renderer) {
      renderer.dispose();
    }
  };
});

function setupControls() {
  // Add wheel event fix code
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  if (!window.__wheelEventPatched) {
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'wheel' && this instanceof HTMLElement) {
        const newOptions = typeof options === 'object' ? 
          { ...options, passive: false } : { passive: false };
        return originalAddEventListener.call(this, type, listener, newOptions);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
    window.__wheelEventPatched = true;
  }

  // Create controls
  controls = new ArcballControls(camera, renderer.domElement, scene);
  controls.enableDamping = true;
  controls.dampingFactor = 0.333;
  controls.wMax = 1.3;
  controls.setGizmosVisible(false);
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.enableRotate = true;
  controls.minDistance = 10;
  controls.maxDistance = 300;
}

function setupLights() {
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
  LIGHTING_SETTINGS.POINT_LIGHTS.forEach(lightConfig => {
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
```

### 4.2. Move Animation Loop

Add the animation loop to SimulationManager:

```javascript
// In SimulationManager.svelte
import { 
  renderingMode, performanceMetrics, 
  isAutomaticSoulCount 
} from '../lib/stores/simulationState.js';
import { 
  InstancedSoulRenderer 
} from '../lib/InstancedSoulRenderer.js';

// InstancedSoulRenderer reference
let instancedRenderer = $state(null);

// Animation loop flags
let animationFrameId = $state(null);
let isAnimating = $state(false);

function animate() {
  animationFrameId = requestAnimationFrame(animate);
  
  // Skip rendering until scene is ready
  if (!scene || !camera || !renderer) return;
  
  // Update controls
  if (controls) {
    controls.update();
  }
  
  // Render scene
  renderer.render(scene, camera);
  
  // Track performance metrics
  performanceMetrics.drawCalls = renderer.info?.render?.calls || 0;
}

onMount(() => {
  // Previous initialization code...
  
  // Start animation loop once everything is set up
  isAnimating = true;
  animate();
  
  return () => {
    // Stop animation on cleanup
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    isAnimating = false;
  };
});
```

### 4.3. Implement Soul Creation and Management

Add soul management code:

```javascript
// In SimulationManager.svelte
import {
  GEOMETRY_SETTINGS, CONNECTION_SETTINGS,
  MATERIAL_POOL_SIZE, PHYSICS
} from '../lib/config/index.js';

// Soul creation variables
let nextSoulId = $state(0);
let humanGeometry, gptGeometry, dewaGeometry;
let sharedHumanMaterial, sharedGptMaterial, sharedDewaMaterial;
let materialPool = $state({ human: [], gpt: [], dewa: [] });

function initGeometriesAndMaterials() {
  // Create geometries
  humanGeometry = new THREE.SphereGeometry(
    GEOMETRY_SETTINGS.HUMAN_RADIUS,
    GEOMETRY_SETTINGS.HUMAN_SEGMENTS.width,
    GEOMETRY_SETTINGS.HUMAN_SEGMENTS.height
  );
  
  gptGeometry = new THREE.BoxGeometry(
    GEOMETRY_SETTINGS.GPT_SIZE,
    GEOMETRY_SETTINGS.GPT_SIZE,
    GEOMETRY_SETTINGS.GPT_SIZE
  );
  
  dewaGeometry = new THREE.SphereGeometry(
    GEOMETRY_SETTINGS.DEWA_RADIUS,
    GEOMETRY_SETTINGS.DEWA_SEGMENTS.width,
    GEOMETRY_SETTINGS.DEWA_SEGMENTS.height
  );
  
  // Create shared materials
  sharedHumanMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: GEOMETRY_SETTINGS.MATERIAL_OPACITY.DEFAULT
  });
  
  sharedGptMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: GEOMETRY_SETTINGS.MATERIAL_OPACITY.DEFAULT
  });
  
  sharedDewaMaterial = new THREE.MeshLambertMaterial({
    transparent: true,
    opacity: GEOMETRY_SETTINGS.MATERIAL_OPACITY.DEWA
  });
}

function createSoul(isHuman, isDewa = false, angle = 0, speed = 0) {
  // Soul creation logic from App.svelte
  // This will create the soul mesh and add it to the souls array
  // ...
}

function initInstancedRenderer(soulCount) {
  // Initialize instanced renderer with soul count
  if (renderingMode === 'instanced') {
    try {
      const dynamicMaxSouls = soulCount * 2; // Safety margin
      instancedRenderer = new InstancedSoulRenderer(scene, dynamicMaxSouls);
      
      // Hide individual meshes from scene
      souls.forEach(soul => {
        if (soul.parent === scene) {
          scene.remove(soul);
        }
      });
      
      // Perform initial instanced update
      instancedRenderer.updateInstances(souls);
      
    } catch (error) {
      console.error("Failed to initialize instanced renderer", error);
      renderingMode = 'individual';
      
      // Show individual meshes again
      souls.forEach(soul => {
        if (soul.parent !== scene) {
          scene.add(soul);
        }
      });
    }
  }
}
```

## Session 5: Finalize App.svelte

### 5.1. Clean Up App.svelte

Finally, clean up App.svelte completely:

```svelte
<!-- src/App.svelte -->
<script>
  // Import AI test bridge for performance testing
  import './lib/ai-test-bridge.js';
  
  // Import components
  import SimulationManager from './components/SimulationManager.svelte';
  import ThreeContainer from './components/ThreeContainer.svelte';
  import FpsCounter from './components/FpsCounter.svelte';
  import PopulationCounter from './components/PopulationCounter.svelte';
  import EntityLinks from './components/EntityLinks.svelte';
  import SliderControls from './components/SliderControls.svelte';
  import EquilibriumInfo from './components/EquilibriumInfo.svelte';
  import BottomLinks from './components/BottomLinks.svelte';
  import ToastNotification from './components/ToastNotification.svelte';
  
  // Import the centralized state
  import { 
    NEW_SOUL_SPAWN_RATE, MIN_LIFESPAN, MAX_LIFESPAN 
  } from './lib/stores/simulationState.js';
</script>

<!-- Main application layout -->
<div class="app-container">
  <!-- Three.js container -->
  <ThreeContainer bind:container />
  
  <!-- Simulation manager - this now handles all the ThreeJS logic -->
  <SimulationManager />
  
  <!-- UI Components -->
  <div class="ui-overlay">
    <FpsCounter />
    <PopulationCounter />
    <EntityLinks />
    <SliderControls 
      spawnRate={NEW_SOUL_SPAWN_RATE}
      minLifespan={MIN_LIFESPAN}
      maxLifespan={MAX_LIFESPAN} />
    <EquilibriumInfo />
  </div>
  
  <BottomLinks />
  <ToastNotification />
</div>

<style>
  /* Keep existing styles */
</style>
```

### 5.2. Final Testing Checklist

Before considering the refactoring complete, verify the following:

1. **Soul Simulation**
   - Souls spawn correctly
   - Souls move and interact correctly
   - Soul lifespan works correctly
   - Soul removal works properly

2. **UI Components**
   - Population counter shows correct count
   - FPS counter works
   - Equilibrium info shows correct values
   - Parameter sliders function properly
   - Reset button works
   - Toast notifications appear when expected

3. **Performance**
   - FPS is comparable to the original implementation
   - Memory usage is stable
   - No errors in console

4. **Rendering**
   - Instanced rendering works when enabled
   - Individual fallback works when needed
   - LOD system works correctly
   - Adaptive quality adjustments work

5. **Interactions**
   - Mouse interactions work correctly
   - Camera controls (pan, zoom, rotate) function properly
   - URL parameters are handled correctly

# Common Pitfalls and Solutions

## State Management Challenges

### 1. Timing Issues with Component References

**Problem**: Components like FpsCounter and ToastNotification register themselves in global state during onMount, but might be accessed before registration.

**Solution**: Always use optional chaining when accessing component references:
```javascript
// Instead of this:
toastNotification.showToast("Message");

// Do this:
toastNotification?.showToast("Message");
```

### 2. Stale State References

**Problem**: Component state might get out of sync with global state.

**Solution**: Use effects to keep them synchronized:
```javascript
// In components that need to stay in sync with global state:
$effect(() => {
  localState = globalValue;
});
```

## Three.js Specific Issues

### 1. Scene Hierarchy Issues

**Problem**: When moving meshes between components, parent-child relationships can break.

**Solution**: Always check if an object is already in the scene before adding it:
```javascript
if (mesh.parent !== scene) {
  scene.add(mesh);
}
```

### 2. Event Listener Memory Leaks

**Problem**: Event listeners can cause memory leaks if not properly cleaned up.

**Solution**: Always remove event listeners in onDestroy or in the cleanup function returned by onMount:
```javascript
onMount(() => {
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
});
```

### 3. WebGL Context Loss

**Problem**: Moving renderer initialization can sometimes cause WebGL context issues.

**Solution**: Always dispose of renderers and materials properly:
```javascript
// In cleanup function
renderer?.dispose();
material?.dispose();
geometry?.dispose();
```

## Worker Communication

### 1. Duplicate Worker Creation

**Problem**: Creating multiple workers by accident.

**Solution**: Store worker instance in global state and check before creation:
```javascript
if (!simulationWorker) {
  simulationWorker = new Worker(...);
}
```

### 2. Message Synchronization

**Problem**: Worker messages can arrive out of order.

**Solution**: Add sequence IDs to messages:
```javascript
let messageId = 0;

function sendWorkerMessage(type, data) {
  simulationWorker.postMessage({
    id: messageId++,
    type,
    data
  });
}
```

## Migration Strategy Tips

### 1. Parallel Operation

For components that are critical, consider running both old and new implementations in parallel temporarily and verify they produce the same results:

```javascript
// In App.svelte during migration
function updateSouls() {
  // Original implementation
  const originalResult = originalUpdateFunction();
  
  // New implementation (no side effects yet)
  const newResult = newUpdateFunction();
  
  // Compare results and log differences
  if (JSON.stringify(originalResult) !== JSON.stringify(newResult)) {
    console.warn('Update functions produced different results', {
      original: originalResult,
      new: newResult
    });
  }
  
  // Use original result during migration
  return originalResult;
}
```

### 2. Feature Flags for Rollback

Add temporary feature flags to easily toggle between old and new implementations:

```javascript
const USE_NEW_IMPLEMENTATION = true;

if (USE_NEW_IMPLEMENTATION) {
  // New code path
} else {
  // Original code path
}
```

### 3. Incremental DOM Updates

When changing how UI is rendered, make one small change at a time:

```svelte
<!-- Stage 1: Add new component without removing original -->
<OriginalComponent />
<NewComponent hidden />

<!-- Stage 2: Show new component, hide original -->
<OriginalComponent hidden />
<NewComponent />

<!-- Stage 3: Remove original component -->
<NewComponent />
````
