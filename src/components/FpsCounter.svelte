<!-- FPS Counter Component - TypeScript Migration Phase 10.1 -->
<script lang="ts">
  // TypeScript interface for component props
  interface FpsCounterProps {
    showCounter?: boolean;
    updateInterval?: number;
    averageWindowSize?: number;
  }

  // Props with TypeScript typing
  let {
    showCounter = true,
    updateInterval = 1000,
    averageWindowSize = 10,
  }: FpsCounterProps = $props();

  // State variables for FPS tracking with TypeScript types
  let fps = $state<number>(0);
  let frameCount = $state<number>(0);
  let lastTime = $state<number>(performance.now());
  let averageFPS = $state<number>(0);
  let fpsHistory = $state<number[]>([]);
  let memoryUsage = $state<number>(0);

  // Animation frame tracking
  let animationFrameId = $state<number | null>(null);

  // FPS calculation function with TypeScript types
  function updateFPS(): void {
    frameCount++;
    const currentTime: number = performance.now();
    const elapsed: number = currentTime - lastTime;

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
        averageFPS = Math.round(
          fpsHistory.reduce((a: number, b: number) => a + b) / fpsHistory.length
        );
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

  // Export current metrics for parent components with TypeScript interface
  interface FpsMetrics {
    fps: number;
    averageFPS: number;
    memoryUsage: number;
    fpsHistory: number[];
  }

  export function getMetrics(): FpsMetrics {
    return {
      fps,
      averageFPS,
      memoryUsage,
      fpsHistory: [...fpsHistory],
    };
  }

  // Methods expected by simulationState store
  export function getCurrentFPS(): number {
    return fps;
  }

  export function getAverageFPS(): number {
    return averageFPS;
  }

  // Expose FPS values to global scope for AI test bridge compatibility
  $effect(() => {
    if (typeof window !== 'undefined') {
      (window as any).currentFPS = fps;
      (window as any).averageFPS = averageFPS;
      (window as any).memoryUsage = memoryUsage;
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
    bottom: 60px;
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
