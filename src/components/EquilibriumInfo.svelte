<script>
  import { onMount } from 'svelte';
  import SliderControls from './SliderControls.svelte';

  // Equilibrium info component props
  let { 
    show = $bindable(false),
    spawnRate = 0.7,
    avgLifespan = 600,
    equilibriumPopulation = Math.round(spawnRate * avgLifespan),
    minLifespan = 300,
    maxLifespan = 900,
    position = 'top-left', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
    onParameterChange = () => {},
    onReset = () => {}
  } = $props();

  // Calculate equilibrium population reactively
  let calculatedEquilibrium = $derived(Math.round(spawnRate * avgLifespan));

  // Handle parameter changes from SliderControls
  function handleParameterChange(event) {
    onParameterChange(event);
  }

  function handleReset() {
    onReset();
  }

  // Toggle function for parent access
  export function toggle() {
    show = !show;
  }

  // Auto-open equilibrium info on wider screens and handle resize
  onMount(() => {
    const handleResize = () => {
      if (window.innerWidth > 1200) {
        show = true;
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });
</script>

<!-- Toggle button -->
<button class="equilibrium-toggle" onclick={() => show = !show}>
  <span class="toggle-icon">{show ? '✕' : 'ℹ'}</span>
  <span class="toggle-text">Info</span>
</button>

<!-- Info panel -->
<div class="equilibrium-info {position}" class:show>
  <div class="equilibrium-title">Population Equilibrium</div>
  <div class="equilibrium-formula">EquilibriumPopulation ≈ NEW_SOUL_SPAWN_RATE × AVG_LIFESPAN</div>
  <div class="equilibrium-calculation">Current: {spawnRate} × {avgLifespan} = ~{calculatedEquilibrium} souls</div>
  
  <!-- Interactive Parameter Controls -->
  <SliderControls 
    bind:NEW_SOUL_SPAWN_RATE={spawnRate}
    bind:MIN_LIFESPAN={minLifespan}
    bind:MAX_LIFESPAN={maxLifespan}
    onparameterchange={handleParameterChange}
    onreset={handleReset}
  />
  
  <div class="equilibrium-text">
    <p>A stable system.</p>
    <div>
      <quote>
        <a 
        href="https://en.wikipedia.org/wiki/Thomas_Malthus" 
        target="_blank">Thomas Malthus</a> (conceptually, 1798) and <a 
        href="https://en.wikipedia.org/wiki/Pierre-François_Verhulst" 
        target="_blank">François Verhulst</a> (mathematically, 1838) in the 18th-19th century found out about this.
        <br /><br />Yes, this universe is explosion-proof and collapse-proof. Time heals all population wounds.
      </quote>
    </div>
  </div>
</div>

<style>
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
    display: flex;
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

  .equilibrium-info {
    position: fixed;
    background: rgba(0, 0, 0, 0.85);
    color: #ffffff;
    padding: 16px 20px;
    border-radius: 10px;
    font-family: 'Courier New', monospace;
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(8px);
    z-index: 1000;
    line-height: 1.5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    transform: translateY(-20px);
    opacity: 0;
    pointer-events: none;
    max-height: calc(100vh - 160px);
    max-height: calc(100dvh - 160px);
    overflow-y: auto;
  }

  .equilibrium-info.show {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  /* Position variants */
  .top-left {
    top: 110px;
    left: 10px;
    max-width: 320px;
  }

  .top-right {
    top: 110px;
    right: 10px;
    max-width: 320px;
  }

  .bottom-left {
    bottom: 110px;
    left: 10px;
    max-width: 320px;
  }

  .bottom-right {
    bottom: 110px;
    right: 10px;
    max-width: 320px;
  }

  /* Mobile responsive behavior */
  @media (max-width: 768px) {
    .equilibrium-info {
      left: 10px !important;
      right: 10px !important;
      max-width: none !important;
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

  .equilibrium-text {
    font-weight: bold;
  }

  .equilibrium-text quote {
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

  .equilibrium-text quote a {
    color: #ffcc00;
    text-decoration: underline;
    font-weight: bold;
  }
</style>
