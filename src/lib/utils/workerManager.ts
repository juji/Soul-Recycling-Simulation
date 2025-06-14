/**
 * Worker Communication Manager
 *
 * Manages Web Worker communication for the Soul Recycling Simulation.
 * Handles worker initialization, message passing, and performance tracking.
 *
 * Phase 6a: Extract Worker Communication Manager from App.svelte
 */

import * as THREE from 'three';
import type { ConnectionData, SoulWorkerData, WorkerMessage, WorkerSoulUpdate } from '../../types';
import {
  instancedRenderer as getInstancedRenderer,
  performanceMetrics as getPerformanceMetrics,
  renderingMode as getRenderingMode,
  souls as getSouls,
} from '../stores/simulationState.svelte';

import { handleSoulRemoval, updateConnectionLines, updateSoulFromWorker } from './soulManager';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WorkerMessageHandler = (data: any) => void; // Generic handler for various message types

export class WorkerManager {
  private simulationWorker: Worker | null = null;
  private isInitialized: boolean = false;
  private messageHandlers: Map<string, WorkerMessageHandler> = new Map();
  private sceneRef: THREE.Scene | null = null;
  private lineSegmentsRef: THREE.LineSegments | null = null;
  private maxLinesRef: number = 0;

  constructor() {
    // Setup default message handlers
    this.setupDefaultHandlers();
  }

  /**
   * Initialize the Web Worker with souls and constants
   */
  initializeWorker(initialSouls: SoulWorkerData[], constants: unknown): void {
    try {
      // Create new worker instance
      this.simulationWorker = new Worker(new URL('../simulation.worker.ts', import.meta.url), {
        type: 'module',
      });

      // Send initialization data to worker
      this.simulationWorker.postMessage({
        type: 'init',
        data: {
          souls: initialSouls,
          constants: constants,
        },
      });

      // Setup message handler
      this.simulationWorker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        this.handleWorkerMessage(e);
      };

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`WorkerManager: Failed to initialize worker: ${error}`);
    }
  }

  /**
   * Setup default message handlers for common worker message types
   */
  setupDefaultHandlers(): void {
    // Handler for soul updates from worker
    this.messageHandlers.set('soulsUpdated', (data: WorkerSoulUpdate[]) => {
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
    this.messageHandlers.set('soulRemoved', (data: { soulId: number }) => {
      // Handle soul removal using soulManager
      const soulIdToRemove = data.soulId;
      const renderingMode = getRenderingMode();

      if (this.sceneRef) {
        handleSoulRemoval(soulIdToRemove, this.sceneRef, renderingMode);
      }
    });

    // Handler for connection updates from worker
    this.messageHandlers.set('connectionsUpdated', (data: ConnectionData[]) => {
      // Handle connections calculated in worker using soulManager
      if (this.lineSegmentsRef && this.maxLinesRef) {
        updateConnectionLines(this.lineSegmentsRef, data, this.maxLinesRef);
      }
    });
  }

  /**
   * Handle incoming messages from the worker
   */
  handleWorkerMessage(e: MessageEvent<WorkerMessage>): void {
    const { type, data } = e.data;

    const handler = this.messageHandlers.get(type);
    if (handler) {
      try {
        handler(data);
      } catch (error) {
        // Error handling for message type handler
        throw new Error(`WorkerManager: Error handling message type '${type}': ${error}`);
      }
    } else {
      // Unknown message type - this is expected for some cases
    }
  }

  /**
   * Register a custom message handler
   */
  registerMessageHandler(messageType: string, handler: WorkerMessageHandler): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Send update data to the worker
   */
  sendUpdate(updateData: unknown): void {
    if (this.simulationWorker && this.isInitialized) {
      this.simulationWorker.postMessage({
        type: 'update',
        data: updateData,
      });
    } else {
      // Worker not initialized - operation ignored
    }
  }

  /**
   * Send a new soul to the worker
   */
  addSoulToWorker(soulData: SoulWorkerData): void {
    if (this.simulationWorker && this.isInitialized) {
      this.simulationWorker.postMessage({
        type: 'addSoul',
        data: { soul: soulData },
      });
    } else {
      // Worker not initialized - operation ignored
    }
  }

  /**
   * Set references for scene-dependent operations
   * This is called from the main application to provide context
   */
  setSceneReferences(scene: THREE.Scene, lineSegments: THREE.LineSegments, maxLines: number): void {
    this.sceneRef = scene;
    this.lineSegmentsRef = lineSegments;
    this.maxLinesRef = maxLines;
  }

  /**
   * Get worker status information
   */
  getStatus(): {
    isInitialized: boolean;
    hasWorker: boolean;
    handlersCount: number;
  } {
    return {
      isInitialized: this.isInitialized,
      hasWorker: !!this.simulationWorker,
      handlersCount: this.messageHandlers.size,
    };
  }

  /**
   * Terminate the worker and cleanup resources
   */
  terminate(): void {
    if (this.simulationWorker) {
      this.simulationWorker.terminate();
      this.simulationWorker = null;
      this.isInitialized = false;
      // Worker terminated successfully
    }
  }

  /**
   * Restart the worker with the same initialization data
   */
  restart(initialSouls: SoulWorkerData[], constants: unknown): void {
    this.terminate();
    this.initializeWorker(initialSouls, constants);
  }
}

// Export a singleton instance for easy use
export const workerManager = new WorkerManager();
