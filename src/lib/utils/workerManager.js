/**
 * Worker Communication Manager
 * 
 * Manages Web Worker communication for the Soul Recycling Simulation.
 * Handles worker initialization, message passing, and performance tracking.
 * 
 * Phase 6a: Extract Worker Communication Manager from App.svelte
 */

import { 
  performanceMetrics as getPerformanceMetrics,
  souls as getSouls,
  renderingMode as getRenderingMode,
  instancedRenderer as getInstancedRenderer
} from '../stores/simulationState.svelte.js';

import { 
  handleSoulRemoval,
  updateSoulFromWorker,
  updateConnectionLines
} from './soulManager.js';

export class WorkerManager {
  constructor() {
    this.simulationWorker = null;
    this.isInitialized = false;
    this.messageHandlers = new Map();
    
    // Setup default message handlers
    this.setupDefaultHandlers();
  }

  /**
   * Initialize the Web Worker with souls and constants
   * @param {Array} initialSouls - Initial souls for worker initialization
   * @param {Object} constants - Physics and interaction constants
   */
  initializeWorker(initialSouls, constants) {
    try {
      // Create new worker instance
      this.simulationWorker = new Worker(
        new URL('../simulation.worker.ts', import.meta.url), 
        { type: 'module' }
      );

      // Send initialization data to worker
      this.simulationWorker.postMessage({
        type: 'init',
        data: {
          souls: initialSouls,
          constants: constants
        }
      });

      // Setup message handler
      this.simulationWorker.onmessage = (e) => {
        this.handleWorkerMessage(e);
      };

      this.isInitialized = true;

    } catch (error) {
      console.error('WorkerManager: Failed to initialize worker:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Setup default message handlers for common worker message types
   */
  setupDefaultHandlers() {
    // Handler for soul updates from worker
    this.messageHandlers.set('soulsUpdated', (data) => {
      const updateStartTime = performance.now();
      const performanceMetrics = getPerformanceMetrics();
      const souls = getSouls();
      const renderingMode = getRenderingMode();
      const instancedRenderer = getInstancedRenderer();
      
      performanceMetrics.soulsUpdated = data.length;
      
      // Dual rendering path - instanced vs individual meshes
      if (renderingMode === 'instanced' && instancedRenderer) {
        // Update individual soul mesh positions for compatibility using soulManager
        data.forEach(updatedSoulData => {
          updateSoulFromWorker(updatedSoulData, renderingMode);
        });
        
        // Update all souls through instanced renderer with updated mesh data
        instancedRenderer.updateInstances(souls);
        
        // Track instanced performance
        const instancedTime = performance.now() - updateStartTime;
        performanceMetrics.instancedUpdateTime += instancedTime;
        performanceMetrics.renderingMode = 'instanced';
      } else {
        // Individual mesh rendering (fallback) using soulManager
        data.forEach(updatedSoulData => {
          updateSoulFromWorker(updatedSoulData, renderingMode);
        });
        
        // Track individual mesh performance
        const individualTime = performance.now() - updateStartTime;
        performanceMetrics.individualUpdateTime += individualTime;
        performanceMetrics.renderingMode = 'individual';
      }
    });

    // Handler for soul removal from worker
    this.messageHandlers.set('soulRemoved', (data) => {
      // Handle soul removal using soulManager
      const soulIdToRemove = data.soulId;
      const renderingMode = getRenderingMode();
      
      if (this.sceneRef) {
        handleSoulRemoval(soulIdToRemove, this.sceneRef, renderingMode);
      }
    });

    // Handler for connection updates from worker
    this.messageHandlers.set('connectionsUpdated', (data) => {
      // Handle connections calculated in worker using soulManager
      if (this.lineSegmentsRef && this.maxLinesRef) {
        updateConnectionLines(this.lineSegmentsRef, data, this.maxLinesRef);
      }
    });
  }

  /**
   * Handle incoming messages from the worker
   * @param {MessageEvent} e - Worker message event
   */
  handleWorkerMessage(e) {
    const { type, data } = e.data;
    
    const handler = this.messageHandlers.get(type);
    if (handler) {
      try {
        handler(data);
      } catch (error) {
        console.error(`WorkerManager: Error handling message type '${type}':`, error);
      }
    } else {
      console.warn(`WorkerManager: Unknown message type '${type}'`);
    }
  }

  /**
   * Register a custom message handler
   * @param {string} messageType - Type of message to handle
   * @param {Function} handler - Handler function
   */
  registerMessageHandler(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Send update data to the worker
   * @param {Object} updateData - Data to send to worker
   */
  sendUpdate(updateData) {
    if (this.simulationWorker && this.isInitialized) {
      this.simulationWorker.postMessage({
        type: 'update',
        data: updateData
      });
    } else {
      console.warn('WorkerManager: Worker not initialized, cannot send update');
    }
  }

  /**
   * Send a new soul to the worker
   * @param {Object} soulData - Soul data to add to worker
   */
  addSoulToWorker(soulData) {
    if (this.simulationWorker && this.isInitialized) {
      this.simulationWorker.postMessage({
        type: 'addSoul',
        data: { soul: soulData }
      });
    } else {
      console.warn('WorkerManager: Worker not initialized, cannot add soul');
    }
  }

  /**
   * Set references for scene-dependent operations
   * This is called from the main application to provide context
   * @param {THREE.Scene} scene - Three.js scene reference
   * @param {THREE.LineSegments} lineSegments - Connection lines reference
   * @param {number} maxLines - Maximum number of connection lines
   */
  setSceneReferences(scene, lineSegments, maxLines) {
    this.sceneRef = scene;
    this.lineSegmentsRef = lineSegments;
    this.maxLinesRef = maxLines;
  }

  /**
   * Get worker status information
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasWorker: !!this.simulationWorker,
      handlersCount: this.messageHandlers.size
    };
  }

  /**
   * Terminate the worker and cleanup resources
   */
  terminate() {
    if (this.simulationWorker) {
      this.simulationWorker.terminate();
      this.simulationWorker = null;
      this.isInitialized = false;
      console.log('WorkerManager: Worker terminated');
    }
  }

  /**
   * Restart the worker with the same initialization data
   * @param {Array} initialSouls - Initial souls for worker initialization
   * @param {Object} constants - Physics and interaction constants
   */
  restart(initialSouls, constants) {
    this.terminate();
    this.initializeWorker(initialSouls, constants);
  }
}

// Export a singleton instance for easy use
export const workerManager = new WorkerManager();
