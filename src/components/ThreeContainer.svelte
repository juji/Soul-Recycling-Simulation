<script>
  import { onMount, createEventDispatcher } from 'svelte';
  
  // Define props
  export let container;

  const dispatch = createEventDispatcher();

  // Handle mouse movements and dispatch to parent
  function onMouseMove(event) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    dispatch('mousemove', { mouseX, mouseY });
  }

  // Handle window resize events
  function handleResize() {
    dispatch('resize', {
      width: container?.clientWidth || 0,
      height: container?.clientHeight || 0
    });
  }

  onMount(() => {
    container?.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      container?.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
    };
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
