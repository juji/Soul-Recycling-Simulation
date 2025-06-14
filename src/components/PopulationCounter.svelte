<!-- Population Counter Component - TypeScript Migration Phase 10.1 -->
<script lang="ts">
  // Import state store to get soul count directly
  import { souls as getSouls } from '../lib/stores/simulationState.svelte';

  // TypeScript interface for component props
  interface PopulationCounterProps {
    showCounter?: boolean;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  }

  // Props for configuration with TypeScript typing
  let {
    showCounter = true,
    position = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  }: PopulationCounterProps = $props();

  // Get soul count directly from state store with proper typing
  let souls = $derived(getSouls());
  let soulCount = $derived(souls.length);

  // Reactive calculation for display using runes with type safety
  let displayCount = $derived(Math.max(0, soulCount));

  // CSS classes based on position using runes with proper typing
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
