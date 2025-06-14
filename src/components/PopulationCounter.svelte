<!-- Population Counter Component - Extracted from App.svelte -->
<script>
  // Props
  let { 
    soulCount = 0,
    showCounter = true,
    position = 'bottom-right' // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  } = $props();
  
  // Reactive calculation for display using runes
  let displayCount = $derived(Math.max(0, soulCount));
  
  // CSS classes based on position using runes
  let positionClass = $derived(`population-counter-${position}`);
</script>

{#if showCounter}
<div class="population-counter {positionClass}">
  Population: {displayCount}
</div>
{/if}

<style>
  .population-counter {
    position: fixed;
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
  
  .population-counter-bottom-right {
    bottom: 10px;
    right: 10px;
  }
  
  .population-counter-bottom-left {
    bottom: 10px;
    left: 10px;
  }
  
  .population-counter-top-right {
    top: 10px;
    right: 10px;
  }
  
  .population-counter-top-left {
    top: 10px;
    left: 10px;
  }
</style>
