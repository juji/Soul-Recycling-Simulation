# TypeScript Migration Plan for Soul Recycling Simulation

## Overview

This document outlines a comprehensive plan to convert the Soul Recycling Simulation from JavaScript to TypeScript. The project currently uses Svelte 5 with modern runes, Three.js, and has undergone extensive refactoring with well-organized modular architecture.

**Current Status**: JavaScript with JSDoc annotations  
**Target**: Full TypeScript with strict type safety  
**Estimated Timeline**: 16-20 hours across 8 phases  

## Migration Strategy

The migration will follow an incremental approach, converting files in dependency order to maintain working state at each step. The project's existing modular architecture makes this migration feasible without breaking changes.

---

## Phase 1: Project Setup and Configuration (2-3 hours)

### 1.1 Update Build Configuration

**Files to modify:**
- `package.json` - Add TypeScript dependencies
- `tsconfig.json` - Create comprehensive TypeScript config (replace jsconfig.json)
- `vite.config.js` → `vite.config.ts` - Convert to TypeScript
- `svelte.config.js` → `svelte.config.ts` - Convert to TypeScript

**Dependencies to add:**
```json
{
  "devDependencies": {
    "@types/three": "^0.166.0",
    "typescript": "^5.3.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "sourceMap": true,
    "declaration": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "$lib/*": ["src/lib/*"],
      "$components/*": ["src/components/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.svelte",
    "src/**/*.d.ts"
  ],
  "exclude": ["node_modules", "dist"]
}
```

### 1.2 Create Type Declaration Files

**Create `src/types/` directory with:**

- `three.d.ts` - Extended Three.js types for custom properties
- `simulation.d.ts` - Core simulation types
- `performance.d.ts` - Performance management types  
- `svelte.d.ts` - Svelte component types

---

## Phase 2: Core Type Definitions (2-3 hours)

### 2.1 Create Simulation Types (`src/types/simulation.d.ts`)

```typescript
export interface SoulData {
  id: number;
  type: 'human' | 'gpt' | 'dewa';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifespan: number;
  currentAge: number;
  speed: number;
  hue: number;
  saturation: number;
  lightness: number;
  isDewa: boolean;
  isHuman: boolean;
}

export interface ConnectionData {
  soul1Id: number;
  soul2Id: number;
  distance: number;
  strength: number;
}

export interface LODLevel {
  distance: number;
  geometryDetail: number;
  physicsUpdateRate: number;
  culled: boolean;
  connectionMultiplier: number;
}

export interface LODConfiguration {
  HIGH: LODLevel;
  MEDIUM: LODLevel;
  LOW: LODLevel;
  CULLED: LODLevel;
}
```

### 2.2 Create Performance Types (`src/types/performance.d.ts`)

```typescript
export interface PerformanceMetrics {
  renderingMode: 'individual' | 'instanced';
  drawCalls: number;
  instancedUpdateTime: number;
  individualUpdateTime: number;
  soulsUpdated: number;
}

export interface QualitySettings {
  maxSouls: number;
  maxConnectionChecks: number;
  connectionLimit: number;
  geometryDetail: { sphere: [number, number]; human: [number, number] };
  updateRate: number;
  enableAdvancedEffects: boolean;
  spatialGridSize: number;
  maxLines: number;
  lodDistances: { medium: number; low: number; culled: number };
  lodGeometryDetail: { high: number; medium: number; low: number };
  lodPhysicsRates: { high: number; medium: number; low: number };
  lodConnectionMultipliers: { high: number; medium: number; low: number };
  physicsLOD: boolean;
  aggressiveCulling: boolean;
}

export type QualityLevel = 'ultra' | 'high' | 'medium' | 'low' | 'minimal';
```

### 2.3 Create Extended Three.js Types (`src/types/three.d.ts`)

```typescript
import * as THREE from 'three';

declare module 'three' {
  interface Object3D {
    userData: {
      id?: number;
      type?: 'human' | 'gpt' | 'dewa';
      lifespan?: number;
      currentAge?: number;
      speed?: number;
      hue?: number;
      saturation?: number;
      lightness?: number;
      isDewa?: boolean;
      isHuman?: boolean;
    };
    visible: boolean;
    geometryDetail?: number;
    physicsUpdateRate?: number;
    connectionMultiplier?: number;
    updatePhysics?: boolean;
  }
}
```

---

## Phase 3: Constants and Configuration (1-2 hours)

### 3.1 Convert Constants Files

**Files to convert:**
- `src/lib/constants/config.js` → `config.ts`
- `src/lib/constants/physics.js` → `physics.ts`  
- `src/lib/constants/rendering.js` → `rendering.ts`

**Add type exports:**
```typescript
// config.ts
export interface FeatureFlags {
  USE_INSTANCED_RENDERING: boolean;
  USE_LOD_SYSTEM: boolean;
  FALLBACK_TO_INDIVIDUAL_MESHES: boolean;
}

export interface DefaultParameters {
  SPAWN_RATE: number;
  MIN_LIFESPAN: number;
  MAX_LIFESPAN: number;
}

// physics.ts
export interface ConnectionSettings {
  INTERACTION_DISTANCE: number;
  MAX_LINES_MULTIPLIER: number;
}

// rendering.ts
export interface CameraSettings {
  FOV: number;
  NEAR: number;
  FAR: number;
  POSITION: { x: number; y: number; z: number };
}
```

### 3.2 Update localStorage Utility

**Convert:** `src/lib/localStorage.js` → `localStorage.ts`

```typescript
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  // Implementation with proper type safety
}

export function saveToStorage<T>(key: string, value: T): void {
  // Implementation
}
```

---

## Phase 4: Core Libraries and Classes (3-4 hours)

### 4.1 Convert Core Classes

**Priority order:**
1. `src/lib/LODManager.js` → `LODManager.ts`
2. `src/lib/adaptive-performance.js` → `AdaptivePerformanceManager.ts`
3. `src/lib/InstancedSoulRenderer.js` → `InstancedSoulRenderer.ts`
4. `src/lib/simulation.worker.js` → `simulation.worker.ts`

### 4.2 LODManager TypeScript Conversion

```typescript
export class LODManager {
  private camera: THREE.Camera;
  private performanceManager: AdaptivePerformanceManager | null;
  private lodLevels: LODConfiguration;
  private MEDIUM_DISTANCE_SQ: number;
  private LOW_DISTANCE_SQ: number;
  private CULLED_DISTANCE_SQ: number;
  private lodStats: LODStatistics;
  private frameCount: number;
  private tempVector: THREE.Vector3;

  constructor(camera: THREE.Camera, performanceManager?: AdaptivePerformanceManager) {
    // Implementation with proper types
  }

  public calculateLODLevel(soulPosition: THREE.Vector3): keyof LODConfiguration {
    // Implementation
  }

  public updateSoulLOD(souls: THREE.Object3D[]): Record<number, LODData> {
    // Implementation
  }
}
```

### 4.3 AdaptivePerformanceManager TypeScript Conversion

```typescript
interface AdaptivePerformanceOptions {
  debug?: boolean;
  enableLearning?: boolean;
  adaptationAggression?: 'conservative' | 'moderate' | 'aggressive';
  learningRate?: number;
}

export class AdaptivePerformanceManager {
  private debug: boolean;
  private enableLearning: boolean;
  private adaptationAggression: string;
  private hardwareProfile: HardwareProfile;
  private metrics: PerformanceMetrics;
  private adaptiveConfig: AdaptiveConfig;
  private currentQuality: QualityLevel;

  constructor(options: AdaptivePerformanceOptions = {}) {
    // Implementation
  }

  public updateMetrics(
    fps: number, 
    frameTime: number, 
    memory: number, 
    workerTime: number, 
    renderTime: number, 
    soulCount: number
  ): void {
    // Implementation
  }
}
```

---

## Phase 5: Utility Modules (2-3 hours)

### 5.1 Convert Utility Files

**Files to convert:**
- `src/lib/utils/soulManager.js` → `soulManager.ts`
- `src/lib/utils/workerManager.js` → `workerManager.ts`  
- `src/lib/utils/animationController.js` → `animationController.ts`

### 5.2 SoulManager TypeScript Conversion

```typescript
export function createSoul(
  isHuman: boolean,
  isDewa: boolean = false,
  angle: number = 0,
  speed: number = 0,
  scene: THREE.Scene,
  renderingMode: 'individual' | 'instanced',
  MIN_LIFESPAN: number,
  MAX_LIFESPAN: number,
  simulationWorker?: Worker
): THREE.Mesh {
  // Implementation
}

export function initializeSoulManager(): void {
  // Implementation
}

export function createInitialSouls(
  scene: THREE.Scene,
  soulCount: number,
  renderingMode: 'individual' | 'instanced',
  MIN_LIFESPAN: number,
  MAX_LIFESPAN: number,
  simulationWorker?: Worker
): void {
  // Implementation
}
```

### 5.3 WorkerManager TypeScript Conversion

```typescript
interface WorkerMessage {
  type: string;
  data: any;
}

interface WorkerMessageHandler {
  (data: any): void;
}

export class WorkerManager {
  private simulationWorker: Worker | null = null;
  private isInitialized: boolean = false;
  private messageHandlers: Map<string, WorkerMessageHandler> = new Map();

  public initializeWorker(): void {
    // Implementation
  }

  public sendMessage(type: string, data: any): void {
    // Implementation
  }

  public addMessageHandler(type: string, handler: WorkerMessageHandler): void {
    // Implementation
  }
}
```

---

## Phase 6: State Management (2-3 hours)

### 6.1 Convert Simulation State Store

**Convert:** `src/lib/stores/simulationState.svelte.js` → `simulationState.svelte.ts`

```typescript
interface SimulationState {
  souls: THREE.Object3D[];
  soulLookupMap: Map<number, THREE.Object3D>;
  renderingMode: 'individual' | 'instanced';
  currentQuality: QualityLevel;
  isAutomaticSoulCount: number;
  performanceMetrics: PerformanceMetrics;
  container: HTMLElement | undefined;
  mouse: { x: number; y: number };
  NEW_SOUL_SPAWN_RATE: number;
  MIN_LIFESPAN: number;
  MAX_LIFESPAN: number;
  toastNotification: any | null;
  fpsCounter: any | null;
  instancedRenderer: InstancedSoulRenderer | null;
  lodManager: LODManager | null;
  adaptivePerformanceManager: AdaptivePerformanceManager | null;
}

const simulationState = $state<SimulationState>({
  // Implementation with proper types
});

// Export typed getter functions
export const souls = (): THREE.Object3D[] => simulationState.souls;
export const soulLookupMap = (): Map<number, THREE.Object3D> => simulationState.soulLookupMap;
export const renderingMode = (): 'individual' | 'instanced' => simulationState.renderingMode;

// Export typed setter functions
export function setSpawnRate(value: number): void {
  simulationState.NEW_SOUL_SPAWN_RATE = value;
  saveToStorage(STORAGE_KEYS.SPAWN_RATE, value);
}

export function addSoul(soul: THREE.Object3D): void {
  simulationState.souls.push(soul);
  simulationState.soulLookupMap.set(soul.userData.id!, soul);
}
```

---

## Phase 7: Svelte Components (3-4 hours)

### 7.1 Convert Components to TypeScript

**Files to convert (in order):**
1. `src/components/FpsCounter.svelte` → Add `<script lang="ts">`
2. `src/components/PopulationCounter.svelte` → Add TypeScript
3. `src/components/EntityLinks.svelte` → Add TypeScript
4. `src/components/SliderControls.svelte` → Add TypeScript
5. `src/components/EquilibriumInfo.svelte` → Add TypeScript
6. `src/components/ThreeContainer.svelte` → Add TypeScript
7. `src/components/ToastNotification.svelte` → Add TypeScript
8. `src/components/BottomLinks.svelte` → Add TypeScript

### 7.2 Component Props Type Definitions

```typescript
// FpsCounter.svelte
interface FpsCounterProps {
  showCounter?: boolean;
  updateInterval?: number;
  averageWindowSize?: number;
}

let { 
  showCounter = true,
  updateInterval = 1000,
  averageWindowSize = 10 
}: FpsCounterProps = $props();

// SliderControls.svelte
interface SliderControlsProps {
  NEW_SOUL_SPAWN_RATE: number;
  MIN_LIFESPAN: number;
  MAX_LIFESPAN: number;
}

let {
  NEW_SOUL_SPAWN_RATE = $bindable<number>(),
  MIN_LIFESPAN = $bindable<number>(),
  MAX_LIFESPAN = $bindable<number>()
}: SliderControlsProps = $props();
```

### 7.3 Convert Simulation Components

**Files to convert:**
- `src/components/simulation/SceneManager.svelte` → Add TypeScript
- `src/components/simulation/SimulationManager.svelte` → Add TypeScript

```typescript
// SceneManager.svelte
<script lang="ts">
  import { onMount, createEventDispatcher, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls';
  import type { LODManager } from '../../lib/LODManager';
  import type { AdaptivePerformanceManager } from '../../lib/AdaptivePerformanceManager';

  const dispatch = createEventDispatcher<{
    sceneReady: {
      scene: THREE.Scene;
      camera: THREE.Camera;
      renderer: THREE.WebGLRenderer;
      controls: ArcballControls;
    };
    resize: { width: number; height: number };
  }>();

  let scene: THREE.Scene | null = null;
  let camera: THREE.Camera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let controls: ArcballControls | null = null;
</script>
```

---

## Phase 8: Main Application and Entry Points (1-2 hours)

### 8.1 Convert Main Files

**Files to convert:**
- `src/main.js` → `main.ts`
- `src/App.svelte` → Add TypeScript
- `src/lib/ai-test-bridge.js` → `ai-test-bridge.ts`

### 8.2 Main App Component

```typescript
// App.svelte
<script lang="ts">
  import type { FpsCounter } from './components/FpsCounter.svelte';
  import type { ToastNotification } from './components/ToastNotification.svelte';
  import type { SimulationManager } from './components/simulation/SimulationManager.svelte';
  
  let localContainer: HTMLElement | undefined = $state();
  let localToastNotification: ToastNotification | undefined = $state();
  let localFpsCounter: FpsCounter | undefined = $state();
  let simulationManager: SimulationManager | undefined = $state();

  function handleMouseMove(event: CustomEvent<{ mouseX: number; mouseY: number }>): void {
    const { mouseX, mouseY } = event.detail;
    mouse.x = mouseX;
    mouse.y = mouseY;
  }
</script>
```

### 8.3 Update Entry Point

```typescript
// main.ts
import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
```

---

## Phase 9: Final Validation and Testing (1-2 hours)

### 9.1 Type Checking and Error Resolution

**Tasks:**
- Run `tsc --noEmit` to check for type errors
- Fix any remaining type issues
- Ensure all imports have proper types
- Validate worker message types

### 9.2 Build and Runtime Testing

**Tasks:**
- Run `npm run build` to ensure TypeScript builds correctly
- Test application functionality in development mode
- Verify all component interactions work
- Test performance with TypeScript overhead

### 9.3 Documentation Updates

**Files to update:**
- Update `README.md` with TypeScript information
- Add TypeScript section to `tech-opt.md`
- Document new type interfaces and their usage

---

## Migration Checklist

### Pre-Migration
- [ ] Backup current codebase
- [ ] Ensure all tests pass in JavaScript
- [ ] Document current API interfaces

### Phase-by-Phase Completion
- [x] Phase 1: Project setup and configuration ✅ COMPLETED
- [x] Phase 2: Core type definitions ✅ COMPLETED
- [ ] Phase 3: Constants and configuration
- [ ] Phase 4: Core libraries and classes
- [ ] Phase 5: Utility modules
- [ ] Phase 6: State management
- [ ] Phase 7: Svelte components
- [ ] Phase 8: Main application files
- [ ] Phase 9: Final validation

### Post-Migration
- [ ] All TypeScript compilation passes
- [ ] Application runs without runtime errors
- [ ] Performance benchmarks match or exceed JavaScript version
- [ ] Documentation updated
- [ ] Type safety validated across all modules

---

## Expected Benefits

### 1. **Type Safety**
- Catch errors at compile time instead of runtime
- Prevent common JavaScript pitfalls (null/undefined access)
- Better IDE support with autocompletion and error detection

### 2. **Developer Experience**
- Enhanced IntelliSense and code completion
- Better refactoring capabilities
- Improved code navigation and documentation

### 3. **Maintainability**
- Self-documenting interfaces and types
- Easier onboarding for new developers
- Reduced debugging time for complex data flows

### 4. **Performance Insights**
- Type-guided optimizations
- Better tree-shaking with explicit exports
- Compile-time detection of unused code

### 5. **Future-Proofing**
- Better compatibility with modern tooling
- Easier integration with TypeScript-first libraries
- Improved support for advanced IDE features

---

## Potential Challenges and Mitigation

### 1. **Three.js Type Complexity**
**Challenge**: Complex Three.js object hierarchies and custom properties  
**Mitigation**: Create module augmentations and custom type definitions

### 2. **Worker Message Types**
**Challenge**: Untyped communication between main thread and workers  
**Mitigation**: Define strict message interfaces and validation schemas

### 3. **Svelte Runes with TypeScript**
**Challenge**: Ensuring proper type inference with Svelte 5 runes  
**Mitigation**: Use explicit type annotations where needed, leverage $bindable types

### 4. **Performance Overhead**
**Challenge**: TypeScript compilation and type checking impact  
**Mitigation**: Optimize tsconfig.json, use incremental compilation, monitor bundle size

### 5. **Dynamic Property Access**
**Challenge**: Existing code using dynamic object property access  
**Mitigation**: Use index signatures and type assertions where necessary

---

## Success Metrics

- **Zero runtime errors** after migration
- **100% type coverage** for core simulation logic
- **Build time** under 10 seconds for development
- **Bundle size** increase less than 5%
- **All existing features** working identically
- **Enhanced IDE experience** with full autocompletion

---

This migration plan provides a systematic approach to converting the Soul Recycling Simulation to TypeScript while maintaining the existing architecture and functionality. The phased approach ensures minimal risk and allows for validation at each step.