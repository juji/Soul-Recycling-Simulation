/**
 * Animation Controller
 * 
 * Manages the main animation loop for the Soul Recycling Simulation.
 * Handles mouse interaction, performance tracking, and rendering coordination.
 * 
 * Phase 6b: Extract Animation Loop from App.svelte
 */

import * as THREE from 'three';
import type { PerformanceMetrics, QualityLevel } from '../../types';
import { 
  performanceMetrics as getPerformanceMetrics,
  souls as getSouls,
  renderingMode as getRenderingMode,
  currentQuality as getCurrentQuality,
  fpsCounter as getFpsCounter,
  mouse as getMouse,
  NEW_SOUL_SPAWN_RATE as getNEW_SOUL_SPAWN_RATE,
  adjustQualityBasedOnFPS
} from '../stores/simulationState.svelte';

interface SceneObjects {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  controls: any; // ArcballControls or any camera controls
}

interface AnimationCallbacks {
  onSoulSpawn?: () => void;
  onWorkerUpdate?: (data: any) => void;
}

export class AnimationController {
  private isRunning: boolean = false;
  private animationId: number | null = null;
  
  // Three.js objects (set by caller)
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: any = null;
  
  // Mouse interaction
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private pointerPosition3D: THREE.Vector3 | null = null;
  private interactionPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  
  // Callbacks (set by caller)
  private onSoulSpawn: (() => void) | null = null;
  private onWorkerUpdate: ((data: any) => void) | null = null;

  constructor() {
    // Initialization handled in methods
  }

  /**
   * Initialize the animation controller with scene objects
   */
  initializeScene(sceneObjects: SceneObjects): void {
    const { scene, camera, renderer, controls } = sceneObjects;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
  }

  /**
   * Set callback functions for animation loop events
   */
  setCallbacks(callbacks: AnimationCallbacks): void {
    this.onSoulSpawn = callbacks.onSoulSpawn || null;
    this.onWorkerUpdate = callbacks.onWorkerUpdate || null;
  }

  /**
   * Start the animation loop
   */
  start(): void {
    if (this.isRunning) {
      console.warn('AnimationController: Animation loop already running');
      return;
    }

    if (!this.scene || !this.camera || !this.renderer || !this.controls) {
      console.error('AnimationController: Scene objects not initialized');
      return;
    }

    this.isRunning = true;
    this.animate();
  }

  /**
   * Stop the animation loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Main animation loop
   */
  private animate(): void {
    if (!this.isRunning) {
      return;
    }

    this.animationId = requestAnimationFrame(() => this.animate());

    // Update mouse interaction
    this.updateMouseInteraction();

    // Send updates to worker
    this.sendWorkerUpdate();

    // Handle soul spawning
    this.handleSoulSpawning();

    // Update controls and render
    if (this.controls && this.controls.update) {
      this.controls.update();
    }
    
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    // Update performance metrics
    this.updatePerformanceMetrics();

    // Update global variables for AI test bridge
    this.updateGlobalVariables();

    // Adjust quality based on performance
    this.adjustQualityBasedOnPerformance();
  }

  /**
   * Update mouse interaction and raycasting
   */
  private updateMouseInteraction(): void {
    const mouse = getMouse();
    
    // Update pointer position in 3D space for main thread (raycasting)
    if (this.camera) {
      // Convert mouse position to THREE.Vector2
      const mouseVector = new THREE.Vector2(mouse.x, mouse.y);
      this.raycaster.setFromCamera(mouseVector, this.camera);
      const intersectionPoint = new THREE.Vector3();
      
      if (this.raycaster.ray.intersectPlane(this.interactionPlane, intersectionPoint)) {
        this.pointerPosition3D = intersectionPoint;
      } else {
        this.pointerPosition3D = null;
      }
    }
  }

  /**
   * Send update data to worker
   */
  private sendWorkerUpdate(): void {
    if (this.onWorkerUpdate) {
      this.onWorkerUpdate({
        pointerPosition3D: null, // Dewa is everywhere, not tied to a specific mouse-derived point
        lodData: null // LOD data would go here if implemented
      });
    }
  }

  /**
   * Handle soul spawning logic
   */
  private handleSoulSpawning(): void {
    if (!this.onSoulSpawn) {
      return;
    }

    let spawnRate = getNEW_SOUL_SPAWN_RATE();
    
    // Spawn multiple souls if spawn rate > 1
    while (spawnRate > 1) {
      this.onSoulSpawn();
      spawnRate--;
    }
    
    // Spawn soul based on probability if spawn rate < 1
    if (Math.random() < spawnRate) {
      this.onSoulSpawn();
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const performanceMetrics = getPerformanceMetrics();
    
    // Track draw calls for performance metrics
    performanceMetrics.drawCalls = this.trackDrawCalls();
  }

  /**
   * Track draw calls for performance metrics
   */
  private trackDrawCalls(): number {
    const souls = getSouls();
    const renderingMode = getRenderingMode();
    
    if (this.renderer && this.renderer.info && this.renderer.info.render) {
      return this.renderer.info.render.calls;
    }
    
    // Fallback estimation based on rendering mode
    return renderingMode === 'instanced' ? 3 : souls.length;
  }

  /**
   * Update global variables for AI test bridge
   */
  private updateGlobalVariables(): void {
    if (typeof window !== 'undefined') {
      const currentQuality = getCurrentQuality();
      const souls = getSouls();
      
      (window as any).currentQuality = currentQuality;
      (window as any).soulCount = souls.length;
    }
  }

  /**
   * Adjust quality based on performance
   */
  private adjustQualityBasedOnPerformance(): void {
    const fpsCounter = getFpsCounter();
    
    if (fpsCounter && fpsCounter.getCurrentFPS) {
      const fps = fpsCounter.getCurrentFPS();
      
      // Adjust quality based on performance every second
      adjustQualityBasedOnFPS(fps);
    }
  }

  /**
   * Get current pointer position in 3D space
   */
  getPointerPosition3D(): THREE.Vector3 | null {
    return this.pointerPosition3D;
  }

  /**
   * Check if animation loop is running
   */
  isAnimationRunning(): boolean {
    return this.isRunning;
  }
}

// Create and export singleton instance
export const animationController = new AnimationController();
