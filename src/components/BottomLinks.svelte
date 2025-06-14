<script>
  // Bottom links component props
  let { 
    links = [
      { href: 'https://jujiplay.com', text: 'JujiPlay', class: 'jujiplay-link' },
      { href: 'https://github.com/juji/Soul-Recycling-Simulation', text: 'GitHub', class: 'github-link', target: '_blank' }
    ],
    position = 'bottom-left' // 'bottom-left', 'bottom-right', 'top-left', 'top-right'
  } = $props();
</script>

<div class="bottom-links {position}">
  {#each links as link}
    <a 
      href={link.href} 
      class={link.class || 'default-link'}
      target={link.target || '_self'}
    >
      {link.text}
    </a>
  {/each}
</div>

<style>
  .bottom-links {
    position: fixed;
    display: flex;
    gap: 10px;
    z-index: 1000;
  }

  /* Position variants */
  .bottom-left {
    bottom: 10px;
    left: 10px;
  }

  .bottom-right {
    bottom: 10px;
    right: 10px;
  }

  .top-left {
    top: 10px;
    left: 10px;
  }

  .top-right {
    top: 10px;
    right: 10px;
  }

  /* Default link styling */
  .bottom-links a {
    background: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    padding: 6px 12px;
    border-radius: 4px;
    text-decoration: none;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    font-weight: bold;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    transition: all 0.2s ease;
  }

  .bottom-links a:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  /* Specific link styles */
  .jujiplay-link {
    border-color: rgba(255, 204, 0, 0.5) !important;
  }

  .jujiplay-link:hover {
    border-color: rgba(255, 204, 0, 0.8) !important;
    box-shadow: 0 2px 5px rgba(255, 204, 0, 0.3) !important;
  }

  .github-link {
    border-color: rgba(64, 128, 255, 0.5) !important;
  }

  .github-link:hover {
    border-color: rgba(64, 128, 255, 0.8) !important;
    box-shadow: 0 2px 5px rgba(64, 128, 255, 0.3) !important;
  }
</style>
