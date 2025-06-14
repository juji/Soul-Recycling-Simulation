<!-- App.svelte - Fully Refactored (Phase 8) -->
<script>
  import FpsCounter from './components/FpsCounter.svelte';
  import PopulationCounter from './components/PopulationCounter.svelte';
  import EntityLinks from './components/EntityLinks.svelte';
  import ToastNotification from './components/ToastNotification.svelte';
  import BottomLinks from './components/BottomLinks.svelte';
  import EquilibriumInfo from './components/EquilibriumInfo.svelte';
  import ThreeContainer from './components/ThreeContainer.svelte';
  import SceneManager from './components/simulation/SceneManager.svelte';
  import SimulationManager from './components/simulation/SimulationManager.svelte';
  import './lib/ai-test-bridge.js';
  
  import { 
    mouse as getMouse,
    setContainer,
    setToastNotification,
    setFpsCounter
  } from './lib/stores/simulationState.svelte.js';

  let mouse = $derived(getMouse());
  let localContainer = $state();
  let localToastNotification = $state();
  let localFpsCounter = $state();
  let simulationManager = $state();

  $effect(() => {
    if (localContainer) setContainer(localContainer);
  });

  $effect(() => {
    if (localToastNotification) setToastNotification(localToastNotification);
  });

  $effect(() => {
    if (localFpsCounter) setFpsCounter(localFpsCounter);
  });

  function handleMouseMove(event) {
    const { mouseX, mouseY } = event.detail;
    mouse.x = mouseX;
    mouse.y = mouseY;
  }
  
  function handleSceneReady(event) {
    if (simulationManager) {
      simulationManager.handleSceneReady(event.detail);
    }
  }
</script>

<ThreeContainer 
  bind:container={localContainer} 
  on:mousemove={handleMouseMove} 
/>

<SceneManager on:sceneReady={handleSceneReady} />

<SimulationManager bind:this={simulationManager} />

<!-- UI Components -->
<FpsCounter bind:this={localFpsCounter} />
<PopulationCounter />
<EntityLinks />
<EquilibriumInfo />
<BottomLinks />
<ToastNotification bind:this={localToastNotification} />
