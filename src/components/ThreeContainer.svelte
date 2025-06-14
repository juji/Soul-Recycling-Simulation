<script>
  import { onMount } from 'svelte';
  
  // Define props using runes - container is bindable for parent access
  let { onmousemove, onresize, container = $bindable() } = $props();

  // Handle mouse movements and dispatch to parent
  function handleMouseMove(event) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    onmousemove?.({ mouseX, mouseY });
  }

  // Handle window resize events
  function handleResize() {
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
        container.removeEventListener('mousemove', handleMouseMove);
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
