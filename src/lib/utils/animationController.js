/**
 * Animation Controller
 * 
 * Manages the main animation loop for the Soul Recycling Simulation.
 * Handles mouse interaction, performance tracking, and rendering coordination.
 * 
 * Phase 6b: Extract Animation Loop from App.svelte
 */

import * as THREE from 'three';
import { 
  performanceMetrics as getPerformanceMetrics,
  souls as getSouls,
  renderingMode as getRenderingMode,
  currentQuality as getCurrentQuality,
  fpsCounter as getFpsCounter,
  mouse as getMouse,
  NEW_SOUL_SPAWN_RATE as getNEW_SOUL_SPAWN_RATE,
  adjustQualityBasedOnFPS
} from '../stores/simulationState.svelte.js';

export class AnimationController {
  constructor() {
    this.isRunning = false;
    this.animationId = null;
    
    // Three.js objects (set by caller)
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Mouse interaction
    this.raycaster = new THREE.Raycaster();
    this.pointerPosition3D = null;
    this.interactionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    
    // Callbacks (set by caller)
    this.onSoulSpawn = null;
    this.onWorkerUpdate = null;
  }

  /**
   * Initialize the animation controller with scene objects
   * @param {Object} sceneObjects - Three.js scene objects
   * @param {THREE.Scene} sceneObjects.scene - Three.js scene
   * @param {THREE.Camera} sceneObjects.camera - Three.js camera
   * @param {THREE.WebGLRenderer} sceneObjects.renderer - Three.js renderer
   * @param {Object} sceneObjects.controls - Camera controls
   */
  initializeScene(sceneObjects) {
    const { scene, camera, renderer, controls } = sceneObjects;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
  }

  /**
   * Set callback functions for animation loop events
   * @param {Object} callbacks - Callback functions
   * @param {Function} callbacks.onSoulSpawn - Called when new souls should be spawned
   * @param {Function} callbacks.onWorkerUpdate - Called to send updates to worker
   */
  setCallbacks(callbacks) {
    this.onSoulSpawn = callbacks.onSoulSpawn;
    this.onWorkerUpdate = callbacks.onWorkerUpdate;
  }

  /**
   * Start the animation loop
   */
  start() {
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
  stop() {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Main animation loop
   * @private
   */
  animate() {
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
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    // Update performance metrics
    this.updatePerformanceMetrics();

    // Update global variables for AI test bridge
    this.updateGlobalVariables();

    // Adjust quality based on performance
    this.adjustQualityBasedOnPerformance();
  }

  /**
   * Update mouse interaction and raycasting
   * @private
   */
  updateMouseInteraction() {
    const mouse = getMouse();
    
    // Update pointer position in 3D space for main thread (raycasting)
    this.raycaster.setFromCamera(mouse, this.camera);
    const intersectionPoint = new THREE.Vector3();
    
    if (this.raycaster.ray.intersectPlane(this.interactionPlane, intersectionPoint)) {
      this.pointerPosition3D = intersectionPoint;
    } else {
      this.pointerPosition3D = null;
    }
  }

  /**
   * Send update data to worker
   * @private
   */
  sendWorkerUpdate() {
    if (this.onWorkerUpdate) {
      this.onWorkerUpdate({
        pointerPosition3D: null, // Dewa is everywhere, not tied to a specific mouse-derived point
        lodData: null // LOD data would go here if implemented
      });
    }
  }

  /**
   * Handle soul spawning logic
   * @private
   */
  handleSoulSpawning() {
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
   * @private
   */
  updatePerformanceMetrics() {
    const performanceMetrics = getPerformanceMetrics();
    const souls = getSouls();
    const renderingMode = getRenderingMode();
    
    // Track draw calls for performance metrics
    performanceMetrics.drawCalls = this.trackDrawCalls();
  }

  /**
   * Track draw calls for performance metrics
   * @private
   * @returns {number} Number of draw calls
   */
  trackDrawCalls() {
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
   * @private
   */
  updateGlobalVariables() {
    if (typeof window !== 'undefined') {
      const currentQuality = getCurrentQuality();
      const souls = getSouls();
      
      window.currentQuality = currentQuality;
      window.soulCount = souls.length;
    }
  }

  /**
   * Adjust quality based on performance
   * @private
   */
  adjustQualityBasedOnPerformance() {
    const fpsCounter = getFpsCounter();
    
    if (fpsCounter) {
      const fpsMetrics = fpsCounter.getMetrics();
      const { fps } = fpsMetrics;
      
      // Adjust quality based on performance every second
      adjustQualityBasedOnFPS(fps);
    }
  }

  /**
   * Get current pointer position in 3D space
   * @returns {THREE.Vector3|null} 3D pointer position or null
   */
  getPointerPosition3D() {
    return this.pointerPosition3D;
  }

  /**
   * Check if animation loop is running
   * @returns {boolean} True if animation is running
   */
  isAnimationRunning() {
    return this.isRunning;
  }
}

// Create and export singleton instance
export const animationController = new AnimationController();
