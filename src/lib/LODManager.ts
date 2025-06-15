// Phase 4: Level-of-Detail (LOD) System
// LODManager.ts - Core LOD management and distance-based quality scaling

import * as THREE from 'three';
import type {
  LODConfiguration,
  LODData,
  LODDebugInfo,
  LODStatistics,
  LODStatisticsExtended,
  LODUpdateConfiguration,
} from '../types/simulation';

// Forward declaration for AdaptivePerformanceManager to avoid circular import
export type AdaptivePerformanceManager = unknown;

export class LODManager {
  private camera: THREE.Camera;
  private performanceManager: AdaptivePerformanceManager | null;
  private lodLevels: LODConfiguration;
  private MEDIUM_DISTANCE_SQ!: number;
  private LOW_DISTANCE_SQ!: number;
  private CULLED_DISTANCE_SQ!: number;
  private lodStats: LODStatistics;
  private frameCount: number;
  private tempVector: THREE.Vector3;

  constructor(camera: THREE.Camera, performanceManager: AdaptivePerformanceManager | null = null) {
    this.camera = camera;
    this.performanceManager = performanceManager;

    // LOD Configuration - configurable thresholds
    this.lodLevels = {
      HIGH: {
        distance: 0,
        geometryDetail: 1.0,
        physicsUpdateRate: 1.0,
        culled: false,
        connectionMultiplier: 1.0,
      },
      MEDIUM: {
        distance: 30,
        geometryDetail: 0.6,
        physicsUpdateRate: 0.5,
        culled: false,
        connectionMultiplier: 0.7,
      },
      LOW: {
        distance: 60,
        geometryDetail: 0.3,
        physicsUpdateRate: 0.25,
        culled: false,
        connectionMultiplier: 0.3,
      },
      CULLED: {
        distance: 100,
        geometryDetail: 0,
        physicsUpdateRate: 0,
        culled: true,
        connectionMultiplier: 0,
      },
    };

    // Pre-calculated squared distances for performance optimization
    this.updateDistanceThresholds();

    // Performance tracking and statistics
    this.lodStats = {
      high: 0,
      medium: 0,
      low: 0,
      culled: 0,
      totalSouls: 0,
      performanceGain: 0,
      memoryReduction: 0,
      lastUpdateTime: 0,
    };

    // Frame counter for physics update rate calculations
    this.frameCount = 0;

    // Temporary vectors for calculations (reused to reduce GC)
    this.tempVector = new THREE.Vector3();
  }

  /**
   * Pre-calculate squared distance thresholds to avoid sqrt() calls
   */
  private updateDistanceThresholds(): void {
    this.MEDIUM_DISTANCE_SQ = this.lodLevels.MEDIUM.distance * this.lodLevels.MEDIUM.distance;
    this.LOW_DISTANCE_SQ = this.lodLevels.LOW.distance * this.lodLevels.LOW.distance;
    this.CULLED_DISTANCE_SQ = this.lodLevels.CULLED.distance * this.lodLevels.CULLED.distance;
  }

  /**
   * Configure LOD distances based on hardware performance tier
   * @param qualityLevel - Current adaptive performance quality level
   */
  public configureForQuality(qualityLevel: string): void {
    const qualityConfigs: Record<string, { medium: number; low: number; culled: number }> = {
      ultra: {
        medium: 40,
        low: 80,
        culled: 150,
      },
      high: {
        medium: 30,
        low: 60,
        culled: 120,
      },
      medium: {
        medium: 25,
        low: 50,
        culled: 100,
      },
      low: {
        medium: 20,
        low: 40,
        culled: 80,
      },
      minimal: {
        medium: 15,
        low: 30,
        culled: 60,
      },
    };

    const config = qualityConfigs[qualityLevel] || qualityConfigs.medium;

    this.lodLevels.MEDIUM.distance = config.medium;
    this.lodLevels.LOW.distance = config.low;
    this.lodLevels.CULLED.distance = config.culled;

    // Update pre-calculated squared distances
    this.updateDistanceThresholds();
  }

  /**
   * Calculate LOD level for a soul based on camera distance
   * Uses squared distance to avoid expensive sqrt() calls
   * @param soulPosition - Position of the soul
   * @returns LOD level ('HIGH', 'MEDIUM', 'LOW', 'CULLED')
   */
  public calculateLODLevel(soulPosition: THREE.Vector3): keyof LODConfiguration {
    // Calculate squared distance manually for performance
    const deltaX = soulPosition.x - this.camera.position.x;
    const deltaY = soulPosition.y - this.camera.position.y;
    const deltaZ = soulPosition.z - this.camera.position.z;

    const distanceSquared = deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;

    // Compare against pre-calculated squared thresholds
    if (distanceSquared < this.MEDIUM_DISTANCE_SQ) {
      return 'HIGH';
    }
    if (distanceSquared < this.LOW_DISTANCE_SQ) {
      return 'MEDIUM';
    }
    if (distanceSquared < this.CULLED_DISTANCE_SQ) {
      return 'LOW';
    }
    return 'CULLED';
  }

  /**
   * Update LOD levels for all souls
   * @param souls - Array of soul objects
   * @returns LOD data for worker communication
   */
  public updateSoulLOD(souls: THREE.Object3D[]): Record<number, LODData> {
    this.frameCount++;
    const startTime = performance.now();

    // Reset statistics
    this.lodStats = {
      high: 0,
      medium: 0,
      low: 0,
      culled: 0,
      totalSouls: souls.length,
      performanceGain: 0,
      memoryReduction: 0,
      lastUpdateTime: startTime,
    };

    // LOD data for worker communication
    const lodData: Record<number, LODData> = {};

    // Process each soul
    souls.forEach(soul => {
      // Calculate LOD level
      const lodLevel = this.calculateLODLevel(soul.position);
      const lodConfig = this.lodLevels[lodLevel];

      // Update soul LOD properties
      soul.lod = lodLevel;
      soul.visible = !lodConfig.culled;
      soul.geometryDetail = lodConfig.geometryDetail;
      soul.physicsUpdateRate = lodConfig.physicsUpdateRate;
      soul.connectionMultiplier = lodConfig.connectionMultiplier;

      // Determine if physics should update this frame
      soul.updatePhysics = this.shouldUpdatePhysics(lodConfig.physicsUpdateRate);

      // Store LOD data for worker
      const soulId = soul.userData.id;
      if (soulId !== undefined) {
        lodData[soulId] = {
          lod: lodLevel,
          physicsUpdateRate: lodConfig.physicsUpdateRate,
          updatePhysics: soul.updatePhysics,
          connectionMultiplier: lodConfig.connectionMultiplier,
        };
      }

      // Update statistics
      const statKey = lodLevel.toLowerCase() as 'high' | 'medium' | 'low' | 'culled';
      this.lodStats[statKey]++;
    });

    // Calculate performance metrics
    this.calculatePerformanceMetrics();

    const endTime = performance.now();
    this.lodStats.lodCalculationTime = endTime - startTime;

    return lodData;
  }

  /**
   * Determine if physics should update for this soul this frame
   * @param updateRate - Physics update rate (0-1)
   * @returns Whether to update physics this frame
   */
  private shouldUpdatePhysics(updateRate: number): boolean {
    if (updateRate === 0) {
      return false;
    }
    if (updateRate >= 1.0) {
      return true;
    }

    // Use frame count to distribute physics updates
    const interval = Math.round(1 / updateRate);
    return this.frameCount % interval === 0;
  }

  /**
   * Calculate performance gain metrics
   */
  private calculatePerformanceMetrics(): void {
    const totalSouls = this.lodStats.totalSouls;
    if (totalSouls === 0) {
      return;
    }

    // Calculate rendering efficiency gain
    const highDetailSouls = this.lodStats.high;
    const mediumDetailSouls = this.lodStats.medium;
    const lowDetailSouls = this.lodStats.low;
    const culledSouls = this.lodStats.culled;

    // Estimate performance gain based on LOD distribution
    const renderingLoad =
      highDetailSouls * 1.0 + mediumDetailSouls * 0.6 + lowDetailSouls * 0.3 + culledSouls * 0.0;

    // Performance gain compared to rendering all at full detail
    this.lodStats.performanceGain = 1 - renderingLoad / totalSouls;

    // Memory reduction estimate (culled souls save the most memory)
    const memoryLoad =
      highDetailSouls * 1.0 + mediumDetailSouls * 0.8 + lowDetailSouls * 0.5 + culledSouls * 0.1; // Still consume some memory for position data

    this.lodStats.memoryReduction = 1 - memoryLoad / totalSouls;

    // Culling efficiency
    this.lodStats.cullingEfficiency = culledSouls / totalSouls;
  }

  /**
   * Get current LOD statistics for performance monitoring
   * @returns Current LOD statistics
   */
  public getLODStatistics(): LODStatisticsExtended {
    return {
      ...this.lodStats,
      // Additional computed metrics
      visibleSouls: this.lodStats.totalSouls - this.lodStats.culled,
      highDetailPercentage: (this.lodStats.high / this.lodStats.totalSouls) * 100,
      cullingPercentage: (this.lodStats.culled / this.lodStats.totalSouls) * 100,
      // Current LOD configuration
      lodThresholds: {
        medium: Math.sqrt(this.MEDIUM_DISTANCE_SQ),
        low: Math.sqrt(this.LOW_DISTANCE_SQ),
        culled: Math.sqrt(this.CULLED_DISTANCE_SQ),
      },
    };
  }

  /**
   * Update LOD configuration dynamically
   * @param newConfig - New LOD configuration
   */
  public updateLODConfiguration(newConfig: LODUpdateConfiguration): void {
    if (newConfig.distances) {
      this.lodLevels.MEDIUM.distance = newConfig.distances.medium ?? this.lodLevels.MEDIUM.distance;
      this.lodLevels.LOW.distance = newConfig.distances.low ?? this.lodLevels.LOW.distance;
      this.lodLevels.CULLED.distance = newConfig.distances.culled ?? this.lodLevels.CULLED.distance;
      this.updateDistanceThresholds();
    }

    if (newConfig.geometryDetail) {
      this.lodLevels.MEDIUM.geometryDetail =
        newConfig.geometryDetail.medium ?? this.lodLevels.MEDIUM.geometryDetail;
      this.lodLevels.LOW.geometryDetail =
        newConfig.geometryDetail.low ?? this.lodLevels.LOW.geometryDetail;
    }

    if (newConfig.physicsRates) {
      this.lodLevels.MEDIUM.physicsUpdateRate =
        newConfig.physicsRates.medium ?? this.lodLevels.MEDIUM.physicsUpdateRate;
      this.lodLevels.LOW.physicsUpdateRate =
        newConfig.physicsRates.low ?? this.lodLevels.LOW.physicsUpdateRate;
    }
  }

  /**
   * Reset LOD statistics
   */
  public resetStatistics(): void {
    this.lodStats = {
      high: 0,
      medium: 0,
      low: 0,
      culled: 0,
      totalSouls: 0,
      performanceGain: 0,
      memoryReduction: 0,
      lastUpdateTime: performance.now(),
    };
    this.frameCount = 0;
  }

  /**
   * Get debug information for development
   * @returns Debug information
   */
  public getDebugInfo(): LODDebugInfo {
    return {
      lodStats: this.getLODStatistics(),
      lodLevels: this.lodLevels,
      frameCount: this.frameCount,
      cameraPosition: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      distanceThresholds: {
        mediumSq: this.MEDIUM_DISTANCE_SQ,
        lowSq: this.LOW_DISTANCE_SQ,
        culledSq: this.CULLED_DISTANCE_SQ,
      },
    };
  }
}
