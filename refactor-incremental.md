# Soul Recycling Simulation - Incremental Refactoring Plan

## Current Progress Status

- ✅ **Phase 1**: Project Setup and File Structure (COMPLETED)
- ✅ **Phase 2**: Extract Constants (COMPLETED)
- 🚧 **Phase 3**: Create State Management (NEXT)
- ⏳ **Phase 4**: Extract Scene Setup
- ⏳ **Phase 5**: Extract Soul Management
- ⏳ **Phase 6**: Create SimulationManager
- ⏳ **Phase 7**: Update UI Components
- ⏳ **Phase 8**: Clean Up App.svelte

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

## Important Note on Svelte Runes

This refactoring plan assumes the use of Svelte's runes mode. All state will be managed using `$state()`, `$derived()`, and `$effect()` instead of legacy reactive statements. We must ensure that the application never falls back to legacy mode, which would break the state management.

Key runes principles to follow:
- Use `$state()` for reactive variables
- Use `$derived()` for computed values
- Use `$effect()` for side effects
- Use `$effect.root()` when needed to create isolated effect scopes

## Incremental Refactoring Strategy

Rather than refactoring everything at once, we'll use an incremental approach with frequent testing to ensure we don't introduce regressions. Each phase should be completed and tested before moving to the next.

## Phase 1: Project Setup and File Structure ✅ COMPLETED

1. **Create directory structure**: ✅
   ```bash
   mkdir -p src/lib/stores src/lib/constants src/lib/utils src/components/simulation
   ```

2. **Create placeholder files** to establish the structure: ✅
   ```bash
   touch src/lib/stores/simulationState.svelte.js 
   touch src/lib/constants/config.js
   touch src/lib/constants/rendering.js
   touch src/lib/constants/physics.js
   touch src/components/simulation/SceneManager.svelte
   touch src/components/simulation/SimulationManager.svelte
   ```

**Status**: All files created successfully. Application tested and working correctly.

## Phase 2: Extract Constants ✅ COMPLETED

1. **Extract config constants** to `src/lib/constants/config.js`: ✅
   - Feature flags (USE_INSTANCED_RENDERING, USE_LOD_SYSTEM, FALLBACK_TO_INDIVIDUAL_MESHES)
   - Default soul count (DEFAULT_SOUL_COUNT)
   - Material pool settings (MATERIAL_POOL_SIZE)
   - Soul properties (DEWA_SPAWN_CHANCE, DEWA_BASE_SPEED)
   - Default parameters for reset functionality (DEFAULT_PARAMETERS)

2. **Extract rendering constants** to `src/lib/constants/rendering.js`: ✅
   - Camera settings (FOV, NEAR, FAR, POSITION)
   - Lighting settings (AMBIENT, DIRECTIONAL, POINT_LIGHTS)
   - Line settings (OPACITY, VERTEX_COORDS, VERTICES_PER_LINE)
   - Geometry settings (HUMAN_RADIUS, DEWA_SEGMENTS, MATERIAL_OPACITY, etc.)
   - ArcballControls settings (DAMPING_FACTOR, MIN/MAX_DISTANCE, etc.)

3. **Extract physics constants** to `src/lib/constants/physics.js`: ✅
   - Connection settings (INTERACTION_DISTANCE, MAX_LINES_MULTIPLIER)
   - Pointer interaction parameters (POINTER_INTERACTION_RADIUS, POINTER_INFLUENCE_STRENGTH)
   - Neighbor speed influence parameters (NEIGHBOR_SPEED_INFLUENCE_RADIUS, NEIGHBOR_SPEED_INFLUENCE_STRENGTH)
   - Boids-like separation parameters (SEPARATION_DISTANCE, SEPARATION_STRENGTH)
   - Dewa entity physics properties (DEWA_ATTRACTION_RADIUS, DEWA_ATTRACTION_STRENGTH)
   - Dewa enhancement properties (DEWA_ENHANCEMENT_RADIUS, ENHANCEMENT_SATURATION_BOOST, ENHANCEMENT_LIGHTNESS_BOOST)

4. **Update imports in App.svelte** to use these new constant files: ✅
   - All constants successfully imported from dedicated modules
   - Removed duplicate constant declarations from App.svelte
   - Updated resetParameters() function to use DEFAULT_PARAMETERS
   - Updated ArcballControls settings to use CONTROLS_SETTINGS

**Status**: All constants extracted and organized. Application tested and working correctly with no errors. Code is now more maintainable with centralized configuration.

## Phase 3: Create State Management (2 hours)

1. **Implement basic state store**:
   - Move state variables from App.svelte to `src/lib/stores/simulationState.svelte.js`
   - Start with core variables (souls, parameters, quality settings)
   - Implement localStorage synchronization

2. **Implement utility functions**:
   - `resetParameters()`
   - `updateCurrentQuality()`
   - `showToastMessage()`

3. **Test with minimal changes**:
   - Update App.svelte to import from state store
   - Keep existing logic flow for now
   - Ensure the application works correctly

## Phase 4: Extract Scene Setup (2 hours)

1. **Create SceneManager component**:
   - Move scene setup code from App.svelte to `src/components/simulation/SceneManager.svelte`
   - Handle camera, renderer, and lighting setup
   - Handle resize events

2. **Use SceneManager in App.svelte**:
   - Replace scene setup code with SceneManager component
   - Pass necessary props and handle events
   - Test that the scene renders correctly

## Phase 5: Extract Soul Management (2-3 hours)

1. **Create SoulManager functions**:
   - Move soul creation and management functions to `src/lib/utils/soulManager.js`
   - Extract soul rendering logic (both instanced and individual)

2. **Update App.svelte to use SoulManager**:
   - Replace inline functions with imports
   - Test that souls render and animate correctly

## Phase 6: Create SimulationManager (2-3 hours)

1. **Create SimulationManager component**:
   - Move animation loop from App.svelte to SimulationManager
   - Handle worker communication
   - Coordinate between scene and soul managers

2. **Use SimulationManager in App.svelte**:
   - Replace animation logic with SimulationManager component
   - Test that the full simulation works correctly

## Phase 7: Update UI Components (2 hours)

1. **Update UI components to use state store**:
   - Start with simpler components (FpsCounter, PopulationCounter)
   - Move to more complex components (EntityLinks, EquilibriumInfo)
   - Test each component after updating

2. **Remove direct prop passing in App.svelte**:
   - Rely on the shared state
   - Test that all UI updates correctly

## Phase 8: Clean Up App.svelte (1 hour)

1. **Simplify App.svelte**:
   - Remove all simulation logic
   - Keep only component imports and minimal layout
   - Test the fully refactored application

2. **Final optimization and cleanup**:
   - Remove any unused code
   - Ensure all components follow best practices
   - Document the new architecture

## Implementation Details

### State Store Implementation (simulationState.svelte.js)

```javascript
// src/lib/stores/simulationState.svelte.js
import { loadFromStorage, saveToStorage } from '../localStorage.js';
import { STORAGE_KEYS } from '../constants/config.js';

// Core simulation state
export const souls = $state([]);
export const soulLookupMap = $state(new Map());
export const renderingMode = $state('instanced');
export const currentQuality = $state('high');
export const isAutomaticSoulCount = $state(0);

// Simulation parameters with localStorage sync
export const NEW_SOUL_SPAWN_RATE = $state(loadFromStorage(STORAGE_KEYS.SPAWN_RATE, 0.7));
export const MIN_LIFESPAN = $state(loadFromStorage(STORAGE_KEYS.MIN_LIFESPAN, 300));
export const MAX_LIFESPAN = $state(loadFromStorage(STORAGE_KEYS.MAX_LIFESPAN, 900));

// Derived values
export const AVG_LIFESPAN = $derived((MIN_LIFESPAN + MAX_LIFESPAN) / 2);
export const EQUILIBRIUM_POPULATION = $derived(NEW_SOUL_SPAWN_RATE * AVG_LIFESPAN);

// Component references
export const toastNotification = $state(null);
export const fpsCounter = $state(null);
export const container = $state(null);

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

### SceneManager Implementation

```svelte
<!-- src/components/simulation/SceneManager.svelte -->
<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls';
  import { container } from '../../lib/stores/simulationState.svelte.js';
  import { CAMERA_SETTINGS, LIGHTING_SETTINGS } from '../../lib/constants/rendering.js';
  
  // Define reactive state variables for parent component
  let scene = $state();
  let camera = $state();
  let renderer = $state();
  let controls = $state();
  
  // Export to make accessible to parent
  $effect.root(() => ({
    scene,
    camera,
    renderer,
    controls
  }));
  
  // Using onMount with runes pattern
  onMount(() => {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera using reactive container
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
    
    // Add renderer to DOM
    const threeContainerRef = document.querySelector('#container');
    threeContainerRef.appendChild(renderer.domElement);
    
    // Fix passive event listener warning
    if (!window.__wheelEventPatched) {
      // Add wheel event patching code
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
    
    // Setup lighting
    setupLighting();
    
    return () => {
      // Cleanup
      renderer.dispose();
      controls.dispose();
    };
  });
  
  // Extract lighting setup to its own function
  function setupLighting() {
    // Add lighting setup code
  }
  
  // Handle window resize
  export  // Using a runes function to ensure reactivity
  function handleResize() {
    if (!camera || !renderer || !container) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  
  // Use effect to handle resize when container changes
  $effect(() => {
    if (container) {
      // Initial sizing and update on container change
      handleResize();
    }
  });
</script>
```

### Final App.svelte Structure

```svelte
<!-- src/App.svelte -->
<script>
  import './lib/ai-test-bridge.js';
  
  import ThreeContainer from './components/ThreeContainer.svelte';
  import SimulationManager from './components/simulation/SimulationManager.svelte';
  import FpsCounter from './components/FpsCounter.svelte';
  import PopulationCounter from './components/PopulationCounter.svelte';
  import EntityLinks from './components/EntityLinks.svelte';
  import EquilibriumInfo from './components/EquilibriumInfo.svelte';
  import BottomLinks from './components/BottomLinks.svelte';
  import ToastNotification from './components/ToastNotification.svelte';
  
  import { container } from './lib/stores/simulationState.svelte.js';
</script>

<ThreeContainer bind:container />
<SimulationManager />

<FpsCounter />
<PopulationCounter />
<EntityLinks />
<EquilibriumInfo />
<BottomLinks />
<ToastNotification />
```

## Testing Strategy

After each phase:

1. Run the application and verify rendering
2. Test user interactions
3. Ensure performance is not degraded
4. Check for console errors

## Rollback Plan

If a phase introduces problems:

1. Revert changes for that phase
2. Re-evaluate the approach
3. Break the phase into smaller steps if needed
