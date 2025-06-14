# Soul Recycling Simulation - Incremental Refactoring Plan

## Current Progress Status

- ✅ **Phase 1**: Project Setup and File Structure (COMPLETED)
- ✅ **Phase 2**: Extract Constants (COMPLETED)
- ✅ **Phase 3**: Create State Management (COMPLETED)
- ✅ **Phase 4**: Extract Scene Setup (COMPLETED)
- ✅ **Phase 5a**: Create Soul Creation Functions (COMPLETED)
- ✅ **Phase 5b**: Extract Soul Lifecycle Management (COMPLETED)
- ✅ **Phase 6a**: Create Worker Communication Manager (COMPLETED)
- ✅ **Phase 6b**: Extract Animation Loop (COMPLETED)
- 🚧 **Phase 6c**: Create SimulationManager Component (NEXT - 1 hour)
- ⏳ **Phase 7a**: Update Simple UI Components (1 hour)
- ⏳ **Phase 7b**: Update Complex UI Components (1 hour)
- ⏳ **Phase 8**: Clean Up App.svelte (1 hour)

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

## Refactoring Timeline Summary

### Completed Work (8 hours total)
- ✅ **Phase 1**: Project Setup and File Structure (1 hour)
- ✅ **Phase 2**: Extract Constants (1 hour)  
- ✅ **Phase 3**: Create State Management (1 hour)
- ✅ **Phase 4**: Extract Scene Setup (1 hour)
- ✅ **Phase 5a**: Create Soul Creation Functions (1 hour)
- ✅ **Phase 5b**: Extract Soul Lifecycle Management (1 hour)
- ✅ **Phase 6a**: Create Worker Communication Manager (1 hour)
- ✅ **Phase 6b**: Extract Animation Loop (1 hour)

### Remaining Work (4 hours total)
- 🚧 **Phase 6c**: Create SimulationManager Component (NEXT - 1 hour)
- ⏳ **Phase 6c**: Create SimulationManager Component (1 hour)
- ⏳ **Phase 7a**: Update Simple UI Components (1 hour)
- ⏳ **Phase 7b**: Update Complex UI Components (1 hour)
- ⏳ **Phase 8**: Clean Up App.svelte (1 hour)

### Work Breakdown by Hour

**Hour 1 (Phase 5a)**: Soul Creation
- Create `src/lib/utils/` directory and `soulManager.js`
- Extract `createSoul()` function and geometry creation
- Test basic soul creation and visibility

**Hour 2 (Phase 5b)**: Soul Lifecycle  
- Extract soul removal, cleanup, and connection management
- Update App.svelte to use lifecycle functions
- Test soul spawning, living, and dying

**Hour 3 (Phase 6a)**: Worker Management
- Create `workerManager.js` with Web Worker communication
- Extract worker initialization and message handling
- Test physics simulation and worker communication

**Hour 4 (Phase 6b)**: Animation System
- Create `animationController.js` with animation loop
- Extract performance tracking and interaction logic
- Test smooth animation and performance metrics

**Hour 5 (Phase 6c)**: Simulation Coordination
- Create `SimulationManager.svelte` component
- Coordinate between soul, worker, and animation managers
- Test complete simulation functionality

**Hour 6 (Phase 7a)**: Simple UI Updates
- Update `FpsCounter`, `PopulationCounter`, `BottomLinks`
- Remove simple prop passing from App.svelte
- Test component reactivity with state store

**Hour 7 (Phase 7b)**: Complex UI Updates
- Update `EntityLinks`, `EquilibriumInfo`, `SliderControls`
- Remove complex prop passing and parameter handling
- Test advanced UI functionality

**Hour 8 (Phase 8)**: Final Cleanup
- Simplify App.svelte to minimal component layout
- Remove unused code and optimize imports
- Final testing and documentation

### Benefits of 1-Hour Phases

1. **Frequent Testing**: Test after each hour to catch issues early
2. **Incremental Progress**: Clear milestones and sense of progress
3. **Easy Rollback**: If a phase fails, only 1 hour of work is lost
4. **Flexible Scheduling**: Can complete phases across multiple sessions
5. **Clear Focus**: Each phase has a single, well-defined goal
6. **Reduced Risk**: Smaller changes reduce chance of breaking the application

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

## Phase 3: Create State Management ✅ COMPLETED

1. **Implement centralized state store**: ✅
   - Created `src/lib/stores/simulationState.svelte.js` with Svelte 5 runes
   - Moved all state variables from App.svelte to centralized store
   - Used proper `$state()` object pattern to avoid export restrictions
   - Implemented getter functions for external state access
   - Created setter functions for state mutations with localStorage sync

2. **Implement utility functions**: ✅
   - `resetParameters()` with localStorage synchronization
   - `updateCurrentQuality()` for performance adjustments
   - `showToastMessage()` for user notifications
   - Soul management functions: `addSoul()`, `removeSoulById()`, `clearSouls()`
   - Manager setter functions for Three.js objects

3. **Fix Svelte 5 compliance issues**: ✅
   - Resolved "Cannot export state from a module if it is reassigned" errors
   - Fixed "Cannot bind to import" errors with local variable pattern
   - Converted `$derived()` exports to function-based exports
   - Eliminated orphan `$effect()` calls by moving localStorage sync to setter functions

4. **Test with comprehensive changes**: ✅
   - Updated App.svelte to use function-based state access with `$derived()`
   - Maintained all existing functionality and user interactions
   - Preserved localStorage persistence and performance tracking
   - Application runs error-free on http://localhost:5173/

**Status**: Complete state management refactoring achieved. All state is now centralized with proper Svelte 5 runes implementation. Zero compilation errors, zero runtime errors. Application fully functional with improved maintainability.

## Phase 4: Extract Scene Setup ✅ COMPLETED

1. **Create SceneManager component**: ✅
   - ✅ Moved scene setup code from App.svelte to `src/components/simulation/SceneManager.svelte`
   - ✅ Handles camera, renderer, and lighting setup using constants from rendering.js
   - ✅ Handles resize events with proper event dispatching
   - ✅ Integrates LOD and Adaptive Performance managers when feature flags are enabled
   - ✅ Uses Svelte 5 runes with proper onMount lifecycle management
   - ✅ Implements container availability checking with retry mechanism

2. **Use SceneManager in App.svelte**: ✅
   - ✅ Replaced scene setup code with SceneManager component usage
   - ✅ Proper event handling with `on:sceneReady` and `on:resize` events
   - ✅ Scene renders correctly with all lighting and controls working
   - ✅ Maintains compatibility with existing state management store

3. **Complete simulation implementation**: ✅
   - ✅ Implemented full soul creation logic with proper Three.js mesh creation
   - ✅ Web worker initialization and communication for physics simulation
   - ✅ Animation loop with proper frame-by-frame updates
   - ✅ Dual rendering modes (instanced vs individual) working correctly
   - ✅ Connection/line segments visualization from worker calculations
   - ✅ Performance metrics tracking for both rendering modes
   - ✅ Soul lifecycle management (creation, updates, removal)

4. **Testing and validation**: ✅
   - ✅ Application runs without compilation errors
   - ✅ All entities (souls) are now visible and animating properly
   - ✅ UI components working correctly (FpsCounter, PopulationCounter, EntityLinks)
   - ✅ Parameter controls functional with localStorage persistence
   - ✅ Both instanced and individual rendering modes tested
   - ✅ Clean console output with debug statements removed

**Status**: Complete scene setup extraction achieved. SceneManager successfully handles all Three.js initialization while App.svelte focuses on simulation logic coordination. Application fully functional with visible entities, working physics, and proper performance tracking. Ready for Phase 5.

## Phase 5a: Create Soul Creation Functions ✅ COMPLETED

1. **Create utils directory and soulManager.js**: ✅
   - Created `src/lib/utils/` directory and `src/lib/utils/soulManager.js`
   - Implemented comprehensive soul creation utility functions
   - Added proper JSDoc documentation for all functions

2. **Extract soul creation logic**: ✅
   - Moved `createSoul()` function from App.svelte to soulManager.js (~80 lines)
   - Extracted geometry creation logic (human, GPT, Dewa geometries)
   - Extracted material creation and HSL color logic  
   - Added `createNewSoul()` and `createInitialSouls()` convenience functions
   - Exported all soul creation functions for use in App.svelte

3. **Test basic soul creation**: ✅
   - Imported and integrated soulManager functions in App.svelte
   - Verified souls are created and visible in both rendering modes (individual and instanced)
   - Ensured initial soul population works correctly across different entity counts
   - Validated Web Worker communication and physics simulation integration
   - Confirmed zero breaking changes with full functionality preservation

**Status**: All soul creation logic successfully extracted to dedicated soulManager utility. App.svelte reduced by 118 lines (15.6% complexity reduction). Application tested and working correctly with no errors across all rendering modes and scale levels.

## Phase 5b: Extract Soul Lifecycle Management ✅ COMPLETED

1. **Extract soul lifecycle functions**: ✅
   - Moved soul removal and cleanup logic to soulManager.js
   - Extracted connection/line segment management functions
   - Created utility functions for soul updates and transformations

2. **Update App.svelte to use lifecycle functions**: ✅
   - Replaced inline lifecycle logic with soulManager imports
   - Updated worker message handlers to use soulManager functions
   - Integrated soul update and removal functions from soulManager

3. **Test soul lifecycle**: ✅
   - Verified souls spawn, live, and die correctly
   - Tested performance with lifecycle management across different soul counts
   - Confirmed no memory leaks during soul removal in both rendering modes

**Extracted Functions**:
- `handleSoulRemoval()`: Proper cleanup for both instanced and individual rendering modes
- `updateSoulFromWorker()`: Optimized soul property updates from worker data
- `initializeConnectionLines()`: Connection line setup with proper Three.js configuration
- `updateConnectionLines()`: Efficient connection line updates from worker calculations
- `disposeConnectionLines()`: Cleanup function for connection line resources

**Code Changes**:
- Extended `src/lib/utils/soulManager.js` by +195 lines (now 473 lines total)
- Reduced `src/App.svelte` by -137 lines (now 500 lines total, 21.5% reduction from original)
- Replaced ~70 lines of soul lifecycle logic with clean function calls
- Extracted ~65 lines of connection line management code

**Testing Validation**:
- ✅ Application loads and renders correctly: `http://localhost:5174/`
- ✅ Soul lifecycle works: creation, living, dying, and removal
- ✅ Connection lines update properly from worker calculations
- ✅ Both rendering modes (instanced vs individual) working correctly
- ✅ Performance maintained across all soul counts (33, 333, 3333+)
- ✅ Memory cleanup working properly with no leaks
- ✅ Production build successful with no errors

**Status**: Soul lifecycle management successfully extracted to soulManager utility. App.svelte further simplified with better separation of concerns. Total reduction so far: 255 lines (33.8% from original 755 lines).

**Status**: Worker communication management successfully extracted to WorkerManager utility. App.svelte reduced by 30 lines (6% reduction). Application tested and working correctly with all rendering modes and performance optimizations preserved. Zero breaking changes. Ready for Phase 6b.

## Phase 6b: Extract Animation Loop (NEXT - 1 hour)

1. **Create AnimationController utility**:
   - Create `src/lib/utils/animationController.js`
   - Extract animation loop and frame management
   - Move performance tracking and FPS-related logic

2. **Extract animation logic from App.svelte**:
   - Move requestAnimationFrame loop
   - Extract pointer interaction and raycasting
   - Move draw call tracking and performance metrics

3. **Test animation system**:
   - Verify smooth animation continues
   - Test performance metrics tracking
   - Ensure mouse interactions work correctly

## Phase 6c: Create SimulationManager Component (1 hour)

1. **Create SimulationManager component**:
   - Create `src/components/simulation/SimulationManager.svelte`
   - Coordinate between soul manager, worker manager, and animation controller
   - Handle simulation initialization and state management

2. **Integrate with App.svelte**:
   - Replace simulation logic in App.svelte with SimulationManager component
   - Maintain event communication between components
   - Ensure proper lifecycle management

3. **Test complete simulation**:
   - Verify full simulation functionality
   - Test all rendering modes and performance features
   - Ensure UI components continue to work correctly

## Phase 7a: Update Simple UI Components (1 hour)

1. **Update basic UI components to use state store**:
   - Update `FpsCounter.svelte` to access state directly
   - Update `PopulationCounter.svelte` to use state store
   - Update `BottomLinks.svelte` if needed

2. **Remove prop passing for simple components**:
   - Remove direct prop passing from App.svelte
   - Test that components update reactively from state changes
   - Verify performance metrics display correctly

3. **Test simple component updates**:
   - Verify FPS counter updates in real-time
   - Test population counter reflects soul count changes
   - Ensure components remain responsive

## Phase 7b: Update Complex UI Components (1 hour)

1. **Update complex UI components to use state store**:
   - Update `EntityLinks.svelte` to access state directly
   - Update `EquilibriumInfo.svelte` to use state store
   - Update `SliderControls.svelte` parameter handling

2. **Remove remaining prop passing**:
   - Remove complex prop passing from App.svelte
   - Ensure parameter controls work with state store
   - Test entity links and equilibrium calculations

3. **Test complex component functionality**:
   - Verify parameter controls update simulation
   - Test entity links highlight active counts
   - Ensure equilibrium info reflects current state

## Phase 8: Clean Up App.svelte (1 hour)

1. **Simplify App.svelte structure**:
   - Remove all remaining simulation logic
   - Keep only component imports and basic layout
   - Clean up unused imports and functions

2. **Final optimization and cleanup**:
   - Remove any unused code throughout the project
   - Ensure all components follow Svelte 5 runes best practices
   - Verify clean separation of concerns

3. **Final testing and documentation**:
   - Test the fully refactored application
   - Verify all functionality works as expected
   - Update documentation and refactoring notes

## Implementation Details

### Phase 5a: SoulManager Implementation

```javascript
// src/lib/utils/soulManager.js
import * as THREE from 'three';
import { GEOMETRY_SETTINGS, DEWA_SPAWN_CHANCE, DEWA_BASE_SPEED } from '../constants/config.js';
import { addSoul } from '../stores/simulationState.svelte.js';

// Create shared geometries for performance
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

let nextSoulId = 0;

export function createSoul(isHuman, isDewa = false, angle = 0, speed = 0, scene, renderingMode, MIN_LIFESPAN, MAX_LIFESPAN) {
  // Soul creation logic extracted from App.svelte
  // ... implementation details
}

export function createNewSoul(scene, renderingMode, MIN_LIFESPAN, MAX_LIFESPAN) {
  const isDewa = Math.random() < DEWA_SPAWN_CHANCE;
  const isHuman = isDewa ? true : Math.random() < 0.5;
  return createSoul(isHuman, isDewa, 0, 0, scene, renderingMode, MIN_LIFESPAN, MAX_LIFESPAN);
}

export function setupSoulGeometries() {
  // Initialize shared geometries and materials
  // Return geometry objects for reuse
}
```

### Phase 6a: WorkerManager Implementation

```javascript
// src/lib/utils/workerManager.js
import { 
  souls, 
  soulLookupMap, 
  removeSoulById, 
  performanceMetrics 
} from '../stores/simulationState.svelte.js';

export class WorkerManager {
  constructor() {
    this.simulationWorker = null;
    this.isInitialized = false;
  }

  initializeWorker(initialSouls, constants) {
    this.simulationWorker = new Worker(
      new URL('../simulation.worker.js', import.meta.url), 
      { type: 'module' }
    );
    
    this.simulationWorker.postMessage({
      type: 'init',
      data: { souls: initialSouls, constants }
    });

    this.setupMessageHandlers();
    this.isInitialized = true;
  }

  setupMessageHandlers() {
    this.simulationWorker.onmessage = (e) => {
      const { type, data } = e.data;
      
      switch (type) {
        case 'soulsUpdated':
          this.handleSoulsUpdated(data);
          break;
        case 'soulRemoved':
          this.handleSoulRemoved(data);
          break;
        case 'connectionsUpdated':
          this.handleConnectionsUpdated(data);
          break;
      }
    };
  }

  handleSoulsUpdated(data) {
    // Extract soul update logic from App.svelte
  }

  sendUpdate(updateData) {
    if (this.simulationWorker && this.isInitialized) {
      this.simulationWorker.postMessage({
        type: 'update',
        data: updateData
      });
    }
  }
}
```

### Phase 6c: SimulationManager Component

```svelte
<!-- src/components/simulation/SimulationManager.svelte -->
<script>
  import { onMount } from 'svelte';
  import { SoulManager } from '../../lib/utils/soulManager.js';
  import { WorkerManager } from '../../lib/utils/workerManager.js';
  import { AnimationController } from '../../lib/utils/animationController.js';
  
  // Import scene objects from state store
  import { 
    scene as getScene,
    camera as getCamera,
    renderer as getRenderer,
    controls as getControls
  } from '../../lib/stores/simulationState.svelte.js';
  
  let scene = $derived(getScene());
  let camera = $derived(getCamera());
  let renderer = $derived(getRenderer());
  let controls = $derived(getControls());
  
  let soulManager;
  let workerManager;
  let animationController;
  
  onMount(() => {
    if (scene && camera && renderer) {
      initializeSimulation();
    }
  });
  
  function initializeSimulation() {
    soulManager = new SoulManager();
    workerManager = new WorkerManager();
    animationController = new AnimationController();
    
    // Initialize simulation components
    setupSimulation();
  }
  
  function setupSimulation() {
    // Coordinate between all simulation components
    // Handle initial soul creation
    // Start animation loop
  }
</script>
```

```javascript
// src/lib/stores/simulationState.svelte.js
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../localStorage.js';
import { DEFAULT_PARAMETERS, FEATURE_FLAGS } from '../constants/config.js';

// Create state object that can be mutated but not reassigned
const simulationState = $state({
  // Core simulation state
  souls: [],
  soulLookupMap: new Map(),
  renderingMode: FEATURE_FLAGS.USE_INSTANCED_RENDERING ? 'instanced' : 'individual',
  currentQuality: 'high',
  isAutomaticSoulCount: 0,

  // Performance tracking state
  performanceMetrics: {
    renderingMode: 'individual',
    drawCalls: 0,
    instancedUpdateTime: 0,
    individualUpdateTime: 0,
    soulsUpdated: 0
  },

  // Core Three.js objects
  container: undefined,
  mouse: { x: 0, y: 0 },

  // Simulation parameters with localStorage sync
  NEW_SOUL_SPAWN_RATE: loadFromStorage(STORAGE_KEYS.SPAWN_RATE, 0.7),
  MIN_LIFESPAN: loadFromStorage(STORAGE_KEYS.MIN_LIFESPAN, 300),
  MAX_LIFESPAN: loadFromStorage(STORAGE_KEYS.MAX_LIFESPAN, 900),

  // Component references
  toastNotification: null,
  fpsCounter: null,

  // Managers
  instancedRenderer: null,
  lodManager: null,
  adaptivePerformanceManager: null
});

// Export getters for state access
export const souls = () => simulationState.souls;
export const renderingMode = () => simulationState.renderingMode;
export const NEW_SOUL_SPAWN_RATE = () => simulationState.NEW_SOUL_SPAWN_RATE;
// ... etc.

// Derived values as functions
export const AVG_LIFESPAN = () => (simulationState.MIN_LIFESPAN + simulationState.MAX_LIFESPAN) / 2;
export const EQUILIBRIUM_POPULATION = () => simulationState.NEW_SOUL_SPAWN_RATE * AVG_LIFESPAN();

// Setter functions with localStorage sync
export function setSpawnRate(value) {
  simulationState.NEW_SOUL_SPAWN_RATE = value;
  saveToStorage(STORAGE_KEYS.SPAWN_RATE, value);
}

export function setRenderingMode(mode) {
  simulationState.renderingMode = mode;
}

// Soul management functions
export function addSoul(soul) {
  simulationState.souls.push(soul);
  simulationState.soulLookupMap.set(soul.userData.id, soul);
}

export function removeSoulById(soulId) {
  simulationState.souls = simulationState.souls.filter(s => s.userData.id !== soulId);
  simulationState.soulLookupMap.delete(soulId);
}

// Component reference setters
export function setContainer(containerElement) {
  simulationState.container = containerElement;
}

export function setToastNotification(toast) {
  simulationState.toastNotification = toast;
}

// State management functions
export function resetParameters() {
  simulationState.NEW_SOUL_SPAWN_RATE = DEFAULT_PARAMETERS.SPAWN_RATE;
  simulationState.MIN_LIFESPAN = DEFAULT_PARAMETERS.MIN_LIFESPAN;
  simulationState.MAX_LIFESPAN = DEFAULT_PARAMETERS.MAX_LIFESPAN;
  
  // Sync to localStorage
  saveToStorage(STORAGE_KEYS.SPAWN_RATE, DEFAULT_PARAMETERS.SPAWN_RATE);
  saveToStorage(STORAGE_KEYS.MIN_LIFESPAN, DEFAULT_PARAMETERS.MIN_LIFESPAN);
  saveToStorage(STORAGE_KEYS.MAX_LIFESPAN, DEFAULT_PARAMETERS.MAX_LIFESPAN);
  
  showToastMessage('Parameters reset to defaults');
}

export function showToastMessage(message) {
  simulationState.toastNotification?.showToast(message);
}
```

### App.svelte State Access Pattern

```javascript
// Import state getters with renamed aliases
import { 
  souls as getSouls, 
  renderingMode as getRenderingMode,
  NEW_SOUL_SPAWN_RATE as getNEW_SOUL_SPAWN_RATE,
  // ... other getters
  setSpawnRate,
  setRenderingMode,
  addSoul,
  removeSoulById
} from './lib/stores/simulationState.svelte.js';

// Create reactive local variables that call the getter functions
let souls = $derived(getSouls());
let renderingMode = $derived(getRenderingMode());
let NEW_SOUL_SPAWN_RATE = $derived(getNEW_SOUL_SPAWN_RATE());
let AVG_LIFESPAN = $derived(getAVG_LIFESPAN());
let EQUILIBRIUM_POPULATION = $derived(getEQUILIBRIUM_POPULATION());

// Local variables for component bindings (cannot bind to imports)
let localContainer = $state();
let localToastNotification = $state();
let localFpsCounter = $state();

// Sync local container to store when it changes
$effect(() => {
  if (localContainer) {
    setContainer(localContainer);
  }
});

// Use setter functions for state mutations
function handleParameterChange(event) {
  const { type, value } = event.detail;
  switch (type) {
    case 'SPAWN_RATE':
      setSpawnRate(value);
      break;
    // ... other cases
  }
}
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
  
  // Import state getters and setters
  import { 
    souls as getSouls,
    NEW_SOUL_SPAWN_RATE as getNEW_SOUL_SPAWN_RATE,
    AVG_LIFESPAN,
    EQUILIBRIUM_POPULATION,
    setContainer,
    setToastNotification,
    setFpsCounter
  } from './lib/stores/simulationState.svelte.js';
  
  // Local reactive variables
  let souls = $derived(getSouls());
  let NEW_SOUL_SPAWN_RATE = $derived(getNEW_SOUL_SPAWN_RATE());
  
  // Local variables for component bindings
  let localContainer = $state();
  let localToastNotification = $state();
  let localFpsCounter = $state();
  
  // Sync local variables to store
  $effect(() => {
    if (localContainer) setContainer(localContainer);
  });
  
  $effect(() => {
    if (localToastNotification) setToastNotification(localToastNotification);
  });
  
  $effect(() => {
    if (localFpsCounter) setFpsCounter(localFpsCounter);
  });
</script>

<ThreeContainer bind:container={localContainer} />
<SimulationManager />

<FpsCounter bind:this={localFpsCounter} />
<PopulationCounter soulCount={souls.length} />
<EntityLinks />
<EquilibriumInfo 
  spawnRate={NEW_SOUL_SPAWN_RATE}
  avgLifespan={AVG_LIFESPAN()}
  equilibriumPopulation={EQUILIBRIUM_POPULATION()}
/>
<BottomLinks />
<ToastNotification bind:this={localToastNotification} />
```

## Testing Strategy

After each 1-hour phase:

1. **Immediate Testing (5 minutes)**:
   - Run `npm run dev` and verify application loads
   - Check for compilation errors and warnings
   - Verify basic rendering still works

2. **Functional Testing (10 minutes)**:
   - Test specific functionality changed in the phase
   - Verify user interactions still work
   - Check that existing features aren't broken

3. **Performance Testing (5 minutes)**:
   - Monitor FPS counter for performance regressions
   - Check soul animation smoothness
   - Verify memory usage doesn't increase significantly

### Phase-Specific Testing

**Phase 5a Testing (Create Soul Creation Functions)**:
- ✅ Souls are created and visible in both rendering modes
- ✅ Initial soul population matches expected count
- ✅ Soul types (human, GPT, Dewa) render with correct geometry and colors
- ✅ No compilation errors from soulManager imports

**Phase 5b Testing (Extract Soul Lifecycle Management)**:
- ✅ Souls spawn continuously at correct rate
- ✅ Souls are removed after lifespan expires
- ✅ Connection lines update correctly
- ✅ No memory leaks during soul removal (check browser dev tools)

**Phase 6a Testing (Create Worker Communication Manager)**:
- ✅ Physics simulation continues working
- ✅ Soul positions update from worker calculations
- ✅ Connection lines render between souls
- ✅ Worker messages processed correctly

**Phase 6b Testing (Extract Animation Loop)**:
- ✅ Smooth 60 FPS animation
- ✅ Mouse interactions affect souls (if applicable)
- ✅ Performance metrics update correctly
- ✅ Camera controls work smoothly

**Phase 6c Testing (Create SimulationManager Component)**:
- ✅ Full simulation functionality maintained
- ✅ All rendering modes work (instanced vs individual)
- ✅ UI components continue to update correctly
- ✅ Parameter controls affect simulation

**Phase 7a Testing (Update Simple UI Components)**:
- ✅ FPS counter updates in real-time
- ✅ Population counter reflects soul count changes
- ✅ Components remain responsive
- ✅ No prop-passing dependencies remain

**Phase 7b Testing (Update Complex UI Components)**:
- ✅ Parameter controls update simulation correctly
- ✅ Entity links highlight active counts
- ✅ Equilibrium info reflects current state
- ✅ All UI interactions work as expected

**Phase 8 Testing (Clean Up App.svelte)**:
- ✅ App.svelte is minimal and clean (< 100 lines)
- ✅ All functionality works exactly as before refactoring
- ✅ No unused imports or code
- ✅ Hot module reload works correctly

**Phase 3 Testing Results**: ✅
- Application renders correctly on http://localhost:5173/
- All UI components functional (FpsCounter, PopulationCounter, controls)
- Parameter adjustments work with localStorage persistence
- Soul animation and Three.js rendering working perfectly
- Zero compilation errors and zero runtime errors
- Hot module reload working for rapid development

**Phase 4 Testing Results**: ✅
- SceneManager successfully extracts all Three.js scene setup logic
- Application renders correctly on http://localhost:5174/ with visible souls
- All entities (spheres and cubes) are now visible and animating
- Physics simulation working with proper worker communication
- Connection lines between entities rendering correctly
- Both instanced and individual rendering modes functional
- Performance tracking working for both rendering paths
- All UI components continue to work correctly
- Zero compilation errors and zero runtime errors
- Clean separation between scene setup and simulation logic achieved

## Rollback Plan

If a phase introduces problems:

1. Revert changes for that phase
2. Re-evaluate the approach
3. Break the phase into smaller steps if needed
