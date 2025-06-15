<!-- App.svelte - TypeScript Migration Phase 11.2 -->
<script lang="ts">
  import * as THREE from 'three';
  import FpsCounter from './components/FpsCounter.svelte';
  import PopulationCounter from './components/PopulationCounter.svelte';
  import EntityLinks from './components/EntityLinks.svelte';
  import ToastNotification from './components/ToastNotification.svelte';
  import BottomLinks from './components/BottomLinks.svelte';
  import EquilibriumInfo from './components/EquilibriumInfo.svelte';
  import ThreeContainer from './components/ThreeContainer.svelte';
  import SceneManager from './components/simulation/SceneManager.svelte';
  import SimulationManager from './components/simulation/SimulationManager.svelte';
  import './lib/ai-test-bridge';

  import {
    setContainer,
    setToastNotification,
    setFpsCounter,
    setMousePosition,
  } from './lib/stores/simulationState.svelte';

  console.log('App: Initializing main application, version 1');

  // TypeScript interfaces
  interface MouseMoveEvent {
    mouseX: number;
    mouseY: number;
  }

  interface SceneReadyEvent {
    detail: {
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
      controls: any; // ArcballControls
    };
  }

  // Component references with TypeScript typing
  let localContainer = $state<HTMLElement | undefined>();
  let localToastNotification = $state<ToastNotification | undefined>();
  let localFpsCounter = $state<FpsCounter | undefined>();
  let simulationManager = $state<SimulationManager | undefined>();

  $effect(() => {
    if (localContainer) setContainer(localContainer);
  });

  $effect(() => {
    if (localToastNotification) setToastNotification(localToastNotification);
  });

  $effect(() => {
    if (localFpsCounter) setFpsCounter(localFpsCounter);
  });

  function handleMouseMove(event: MouseMoveEvent): void {
    const { mouseX, mouseY } = event;
    setMousePosition(mouseX, mouseY);
  }

  function handleSceneReady(event: SceneReadyEvent): void {
    if (simulationManager) {
      simulationManager.handleSceneReady(event.detail);
    }
  }
</script>

<ThreeContainer bind:container={localContainer} onmousemove={handleMouseMove} />

<SceneManager on:sceneReady={handleSceneReady} />

<SimulationManager bind:this={simulationManager} />

<!-- UI Components -->
<FpsCounter bind:this={localFpsCounter} />
<PopulationCounter />
<EntityLinks />
<EquilibriumInfo />
<BottomLinks />
<ToastNotification bind:this={localToastNotification} />
