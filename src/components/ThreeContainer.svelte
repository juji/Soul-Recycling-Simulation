<script lang="ts">
  import { onMount } from 'svelte';
  
  // TypeScript interfaces
  interface MouseMoveEvent {
    mouseX: number;
    mouseY: number;
  }
  
  interface ResizeEvent {
    width: number;
    height: number;
  }
  
  interface ThreeContainerProps {
    onmousemove?: (event: MouseMoveEvent) => void;
    onresize?: (event: ResizeEvent) => void;
    container?: HTMLElement;
  }
  
  // Define props using runes with TypeScript typing
  let { 
    onmousemove, 
    onresize, 
    container = $bindable<HTMLElement | undefined>() 
  }: ThreeContainerProps = $props();

  // Handle mouse movements and dispatch to parent with TypeScript
  function handleMouseMove(event: MouseEvent): void {
    if (!container) return;
    const rect: DOMRect = container.getBoundingClientRect();
    const mouseX: number = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY: number = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    onmousemove?.({ mouseX, mouseY });
  }

  // Handle window resize events with TypeScript
  function handleResize(): void {
    onresize?.({
      width: container?.clientWidth || 0,
      height: container?.clientHeight || 0
    });
  }

  onMount(() => {
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('resize', handleResize);

      return () => {
        if (container) {
          container.removeEventListener('mousemove', handleMouseMove);
        }
        window.removeEventListener('resize', handleResize);
      };
    }
  });
</script>

<style>
  #container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
</style>

<div id="container" bind:this={container}></div>
