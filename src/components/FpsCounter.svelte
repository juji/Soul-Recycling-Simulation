<!-- FPS Counter Component - Extracted from App.svelte -->
<script>
  // Props
  let { 
    showCounter = true,
    updateInterval = 1000,
    averageWindowSize = 10 
  } = $props();
  
  // State variables for FPS tracking
  let fps = $state(0);
  let frameCount = $state(0);
  let lastTime = $state(performance.now());
  let averageFPS = $state(0);
  let fpsHistory = $state([]);
  let memoryUsage = $state(0);
  
  // Animation frame tracking
  let animationFrameId = $state(null);
  
  // FPS calculation function
  function updateFPS() {
    frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - lastTime;
    
    if (elapsed >= updateInterval) {
      fps = frameCount;
      frameCount = 0;
      lastTime = currentTime;
      
      // Track FPS history for average calculation
      fpsHistory.push(fps);
      if (fpsHistory.length > averageWindowSize) {
        fpsHistory.shift();
      }
      
      // Calculate average FPS
      if (fpsHistory.length > 0) {
        averageFPS = Math.round(fpsHistory.reduce((a, b) => a + b) / fpsHistory.length);
      }
      
      // Memory usage tracking (if available)
      if (performance.memory) {
        memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      }
    }
    
    // Continue the animation loop
    if (showCounter) {
      animationFrameId = requestAnimationFrame(updateFPS);
    }
  }
  
  // Start FPS tracking when component mounts
  $effect(() => {
    if (showCounter) {
      animationFrameId = requestAnimationFrame(updateFPS);
    }
    
    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  });
  
  // Export current metrics for parent components
  export function getMetrics() {
    return {
      fps,
      averageFPS,
      memoryUsage,
      fpsHistory: [...fpsHistory]
    };
  }
  
  // Expose FPS values to global scope for AI test bridge compatibility
  $effect(() => {
    if (typeof window !== 'undefined') {
      window.currentFPS = fps;
      window.averageFPS = averageFPS;
      window.memoryUsage = memoryUsage;
    }
  });
</script>

{#if showCounter}
<div class="fps-counter">
  FPS: {fps}
</div>
{/if}

<style>
  .fps-counter {
    position: fixed;
    top: 10px;
    right: 10px;
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
</style>
