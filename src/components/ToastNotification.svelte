<script lang="ts">
  // TypeScript interfaces
  interface ToastNotificationProps {
    message?: string;
    show?: boolean;
    duration?: number;
    position?: 'bottom-center' | 'top-center' | 'bottom-left' | 'bottom-right';
  }

  // Toast notification component props with TypeScript typing
  let { 
    message = $bindable<string>(''),
    show = $bindable<boolean>(false),
    duration = 2000,
    position = 'bottom-center' // 'bottom-center', 'top-center', 'bottom-left', 'bottom-right'
  }: ToastNotificationProps = $props();

  // Auto-hide toast after duration with TypeScript
  $effect(() => {
    if (show && duration > 0) {
      const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
        show = false;
      }, duration);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  });

  // Expose showToast method for parent components with TypeScript
  export function showToast(msg: string, customDuration: number = duration): void {
    message = msg;
    show = true;
    if (customDuration !== duration) {
      setTimeout(() => {
        show = false;
      }, customDuration);
    }
  }
</script>

<div class="toast {position}" class:show>
  {message}
</div>

<style>
  .toast {
    position: fixed;
    background: rgba(74, 144, 226, 0.9);
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    font-weight: bold;
    z-index: 2000;
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: all 0.3s ease;
    pointer-events: none;
  }

  .toast.show {
    opacity: 1;
  }

  /* Position variants */
  .bottom-center {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
  }

  .bottom-center.show {
    transform: translateX(-50%) translateY(0);
  }

  .top-center {
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
  }

  .top-center.show {
    transform: translateX(-50%) translateY(0);
  }

  .bottom-left {
    bottom: 20px;
    left: 20px;
    transform: translateY(100px);
  }

  .bottom-left.show {
    transform: translateY(0);
  }

  .bottom-right {
    bottom: 20px;
    right: 20px;
    transform: translateY(100px);
  }

  .bottom-right.show {
    transform: translateY(0);
  }
</style>
