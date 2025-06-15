<!-- Entity Links Component - TypeScript Migration Phase 10.1 -->
<script lang="ts">
  // Import state store and constants
  import { isAutomaticSoulCount as getIsAutomaticSoulCount } from '../lib/stores/simulationState.svelte';
  import { DEFAULT_SOUL_COUNT } from '../lib/constants/config';

  // TypeScript interfaces
  interface EntityLink {
    value: number | null;
    label: string;
    isAuto?: boolean;
  }

  interface EntityLinksProps {
    showLinks?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    links?: EntityLink[];
  }

  // Props for configuration with TypeScript typing
  let {
    showLinks = true,
    position = 'top-left', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
    links = [
      { value: 33, label: '33' },
      { value: 333, label: '333' },
      { value: 3333, label: '3333' },
      { value: null, label: 'Auto', isAuto: true },
    ],
  }: EntityLinksProps = $props();

  // Get data from state store with proper typing
  let isAutomaticSoulCount = $derived(getIsAutomaticSoulCount());

  // Get active count from URL (same logic as App.svelte) with TypeScript
  let activeCount = $derived((): number => {
    const urlParams = new URLSearchParams(window.location.search);
    const val: string | null = urlParams.get('val');

    if (val === null || val === '') {
      return DEFAULT_SOUL_COUNT;
    }

    const parsedVal: number = parseInt(val, 10);

    if (isNaN(parsedVal)) {
      return DEFAULT_SOUL_COUNT;
    }

    return parsedVal;
  });

  // CSS classes based on position using runes with typing
  let positionClass = $derived(`entity-links-${position}`);

  // Helper function to check if a link is active with TypeScript
  function isLinkActive(link: EntityLink): boolean {
    if (link.isAuto) {
      return isAutomaticSoulCount > 0;
    }
    return activeCount() === link.value;
  }

  // Helper function to get link display text with TypeScript
  function getLinkText(link: EntityLink): string {
    if (link.isAuto && isAutomaticSoulCount) {
      return `Auto: ${isAutomaticSoulCount}`;
    }
    return link.label;
  }

  // Helper function to get link href with TypeScript
  function getLinkHref(link: EntityLink): string {
    if (link.isAuto) {
      return '/';
    }
    return `?val=${link.value}`;
  }
</script>

{#if showLinks}
  <div class="entity-links {positionClass}">
    {#each links as link}
      <a href={getLinkHref(link)} class="entity-link" class:active={isLinkActive(link)}>
        {getLinkText(link)}
      </a>
    {/each}
  </div>
{/if}

<style>
  .entity-links {
    position: fixed;
    display: flex;
    gap: 8px;
    z-index: 1000;
  }

  .entity-links-top-left {
    top: 10px;
    left: 10px;
  }

  .entity-links-top-right {
    top: 10px;
    right: 10px;
  }

  .entity-links-bottom-left {
    bottom: 10px;
    left: 10px;
  }

  .entity-links-bottom-right {
    bottom: 10px;
    right: 10px;
  }

  .entity-link {
    background: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: bold;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .entity-link:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  .entity-link.active {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }
</style>
