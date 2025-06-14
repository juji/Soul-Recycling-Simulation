import type { 
  QualityLevel, 
  QualitySettings,
  HardwareProfile,
  AdaptiveConfig,
  AdaptivePerformanceOptions,
  AdaptationMetrics,
  AdaptationHistory,
  PerformanceTracker,
  AdaptationThresholds,
  PerformanceReport
} from '../types';

export class AdaptivePerformanceManager {
  private debug: boolean;
  private enableLearning: boolean;
  private adaptationAggression: 'conservative' | 'moderate' | 'aggressive';
  private hardwareProfile: HardwareProfile;
  private metrics: AdaptationMetrics;
  private adaptiveConfig: AdaptiveConfig;
  private currentQuality: QualityLevel;
  private isLearning: boolean;
  private adaptationHistory: AdaptationHistory[];
  private lastAdaptationTime: number;
  private performanceTracker: PerformanceTracker;

  constructor(options: AdaptivePerformanceOptions = {}) {
    // Configuration options
    this.debug = options.debug || false;
    this.enableLearning = options.enableLearning !== false;
    this.adaptationAggression = options.adaptationAggression || 'moderate';
    
    // Hardware capability detection
    this.hardwareProfile = {
      cpuCores: navigator.hardwareConcurrency || 4,
      memory: this.getMemoryInfo(),
      gpu: this.getGPUInfo(),
      deviceType: this.detectDeviceType(),
      performance: 'unknown'
    };

    // Performance monitoring
    this.metrics = {
      fps: [],
      frameTime: [],
      memory: [],
      workerTime: [],
      renderTime: [],
      soulCount: 0
    };

    // Enhanced adaptive settings based on hardware capability
    this.adaptiveConfig = {
      targetFPS: this.getTargetFPS(),
      minAcceptableFPS: this.getMinAcceptableFPS(),
      maxAcceptableFPS: 120,
      
      learningRate: options.learningRate || 0.05,
      adaptationSpeed: this.adaptationAggression,
      metricsWindowSize: options.metricsWindowSize || 60,
      
      fpsStabilityThreshold: 0.7,
      memoryPressureThreshold: 0.8,
      adaptationCooldown: 3000,
      
      qualityLevels: this.generateQualityLevels()
    };

    // Current state
    this.currentQuality = this.determineInitialQuality();
    this.isLearning = this.enableLearning;
    this.adaptationHistory = [];
    this.lastAdaptationTime = 0;
    
    // Performance tracking (real measurements, not fake AI)
    this.performanceTracker = {
      fpsHistory: [],
      performanceMaps: new Map(),
      qualityBenchmarks: new Map(),
      adaptationSuccess: [],
      hardwareBaseline: null
    };
  }

  private getMemoryInfo(): HardwareProfile['memory'] {
    if (performance.memory) {
      const totalMB = performance.memory.jsHeapSizeLimit / 1024 / 1024;
      return {
        total: totalMB,
        category: totalMB > 2000 ? 'high' : totalMB > 1000 ? 'medium' : 'low'
      };
    }
    return { total: 'unknown', category: 'medium' };
  }

  private getGPUInfo(): HardwareProfile['gpu'] {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo ? (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
      
      return {
        renderer: renderer,
        category: this.categorizeGPU(renderer),
        webgl2: !!canvas.getContext('webgl2')
      };
    }
    
    return { renderer: 'unknown', category: 'medium', webgl2: false };
  }

  private categorizeGPU(renderer: string): 'low' | 'medium' | 'high' {
    const lowEndGPUs = ['intel', 'integrated', 'basic'];
    const highEndGPUs = ['nvidia', 'amd', 'radeon', 'geforce', 'rtx', 'gtx'];
    
    const rendererLower = renderer.toLowerCase();
    
    if (highEndGPUs.some(gpu => rendererLower.includes(gpu))) {
      return 'high';
    } else if (lowEndGPUs.some(gpu => rendererLower.includes(gpu))) {
      return 'low';
    }
    
    return 'medium';
  }

  private detectDeviceType(): HardwareProfile['deviceType'] {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
      return 'mobile';
    } else if (/mac/.test(userAgent)) {
      return 'desktop-mac';
    } else if (/windows/.test(userAgent)) {
      return 'desktop-windows';
    } else if (/linux/.test(userAgent)) {
      return 'desktop-linux';
    }
    
    return 'desktop-unknown';
  }

  private getTargetFPS(): number {
    const multiplier = this.getHardwareMultiplier();
    if (multiplier >= 1.5) return 60;
    if (multiplier >= 1.0) return 45;
    if (multiplier >= 0.7) return 30;
    return 24;
  }

  private getMinAcceptableFPS(): number {
    return Math.max(15, this.getTargetFPS() * 0.5);
  }

  private generateQualityLevels(): Record<QualityLevel, QualitySettings> {
    const baseQuality: Record<QualityLevel, QualitySettings> = {
      ultra: {
        maxSouls: 2000,
        maxConnectionChecks: 300,
        connectionLimit: 50,
        geometryDetail: { sphere: [24, 24], human: [16, 16] },
        updateRate: 60,
        enableAdvancedEffects: true,
        spatialGridSize: 2.0,
        maxLines: 1000,
        // Phase 4: LOD System Configuration
        lodDistances: { medium: 40, low: 80, culled: 150 },
        lodGeometryDetail: { high: 1.0, medium: 0.8, low: 0.5 },
        lodPhysicsRates: { high: 1.0, medium: 0.7, low: 0.4 },
        lodConnectionMultipliers: { high: 1.0, medium: 0.8, low: 0.5 },
        physicsLOD: true,
        aggressiveCulling: false
      },
      high: {
        maxSouls: 1500,
        maxConnectionChecks: 200,
        connectionLimit: 30,
        geometryDetail: { sphere: [20, 20], human: [12, 12] },
        updateRate: 60,
        enableAdvancedEffects: true,
        spatialGridSize: 3.0,
        maxLines: 500,
        // Phase 4: LOD System Configuration
        lodDistances: { medium: 30, low: 60, culled: 120 },
        lodGeometryDetail: { high: 1.0, medium: 0.6, low: 0.3 },
        lodPhysicsRates: { high: 1.0, medium: 0.5, low: 0.25 },
        lodConnectionMultipliers: { high: 1.0, medium: 0.7, low: 0.3 },
        physicsLOD: true,
        aggressiveCulling: false
      },
      medium: {
        maxSouls: 1000,
        maxConnectionChecks: 150,
        connectionLimit: 20,
        geometryDetail: { sphere: [16, 16], human: [10, 10] },
        updateRate: 45,
        enableAdvancedEffects: false,
        spatialGridSize: 4.0,
        maxLines: 300,
        // Phase 4: LOD System Configuration
        lodDistances: { medium: 25, low: 50, culled: 100 },
        lodGeometryDetail: { high: 0.8, medium: 0.5, low: 0.25 },
        lodPhysicsRates: { high: 1.0, medium: 0.5, low: 0.25 },
        lodConnectionMultipliers: { high: 1.0, medium: 0.6, low: 0.2 },
        physicsLOD: true,
        aggressiveCulling: false
      },
      low: {
        maxSouls: 500,
        maxConnectionChecks: 100,
        connectionLimit: 15,
        geometryDetail: { sphere: [12, 12], human: [8, 8] },
        updateRate: 30,
        enableAdvancedEffects: false,
        spatialGridSize: 5.0,
        maxLines: 150,
        // Phase 4: LOD System Configuration
        lodDistances: { medium: 20, low: 40, culled: 80 },
        lodGeometryDetail: { high: 0.6, medium: 0.4, low: 0.2 },
        lodPhysicsRates: { high: 1.0, medium: 0.4, low: 0.2 },
        lodConnectionMultipliers: { high: 1.0, medium: 0.5, low: 0.1 },
        physicsLOD: true,
        aggressiveCulling: true
      },
      minimal: {
        maxSouls: 200,
        maxConnectionChecks: 50,
        connectionLimit: 10,
        geometryDetail: { sphere: [8, 8], human: [6, 6] },
        updateRate: 24,
        enableAdvancedEffects: false,
        spatialGridSize: 6.0,
        maxLines: 75,
        // Phase 4: LOD System Configuration
        lodDistances: { medium: 15, low: 30, culled: 60 },
        lodGeometryDetail: { high: 0.5, medium: 0.3, low: 0.15 },
        lodPhysicsRates: { high: 0.8, medium: 0.3, low: 0.1 },
        lodConnectionMultipliers: { high: 0.8, medium: 0.3, low: 0.05 },
        physicsLOD: false, // Disable advanced physics LOD on minimal quality
        aggressiveCulling: true
      }
    };

    return this.adjustQualityForHardware(baseQuality);
  }

  private adjustQualityForHardware(quality: Record<QualityLevel, QualitySettings>): Record<QualityLevel, QualitySettings> {
    const multiplier = this.getHardwareMultiplier();
    
    Object.keys(quality).forEach(level => {
      const qualityLevel = level as QualityLevel;
      quality[qualityLevel].maxSouls = Math.floor(quality[qualityLevel].maxSouls * multiplier);
      quality[qualityLevel].maxConnectionChecks = Math.floor(quality[qualityLevel].maxConnectionChecks * multiplier);
    });

    return quality;
  }

  private getHardwareMultiplier(): number {
    let multiplier = 1.0;

    if (this.hardwareProfile.cpuCores >= 8) multiplier *= 1.3;
    else if (this.hardwareProfile.cpuCores >= 4) multiplier *= 1.0;
    else multiplier *= 0.7;

    if (this.hardwareProfile.memory.category === 'high') multiplier *= 1.2;
    else if (this.hardwareProfile.memory.category === 'low') multiplier *= 0.8;

    if (this.hardwareProfile.gpu.category === 'high') multiplier *= 1.4;
    else if (this.hardwareProfile.gpu.category === 'low') multiplier *= 0.6;

    if (this.hardwareProfile.deviceType === 'mobile') multiplier *= 0.5;

    return Math.max(0.3, Math.min(2.0, multiplier));
  }

  private determineInitialQuality(): QualityLevel {
    const multiplier = this.getHardwareMultiplier();
    
    if (multiplier >= 1.5) return 'ultra';
    if (multiplier >= 1.2) return 'high';
    if (multiplier >= 0.8) return 'medium';
    if (multiplier >= 0.5) return 'low';
    return 'minimal';
  }

  public updateMetrics(fps: number, frameTime: number, memory: number, workerTime: number, renderTime: number, soulCount: number): void {
    const timestamp = performance.now();
    const metric = { fps, frameTime, memory, workerTime, renderTime, soulCount, timestamp };
    
    this.metrics.fps.push(fps);
    this.metrics.frameTime.push(frameTime);
    this.metrics.memory.push(memory);
    this.metrics.workerTime.push(workerTime);
    this.metrics.renderTime.push(renderTime);
    this.metrics.soulCount = soulCount;

    const windowSize = this.adaptiveConfig.metricsWindowSize || 100;
    Object.keys(this.metrics).forEach(key => {
      const metricKey = key as keyof AdaptationMetrics;
      if (Array.isArray(this.metrics[metricKey]) && (this.metrics[metricKey] as number[]).length > windowSize) {
        (this.metrics[metricKey] as number[]).shift();
      }
    });

    this.checkForAdaptation();
    this.updatePerformanceTracking(metric);
  }

  private checkForAdaptation(): void {
    if (this.metrics.fps.length < 10) return;
    
    const now = performance.now();
    if (now - this.lastAdaptationTime < this.adaptiveConfig.adaptationCooldown) {
      return;
    }

    const avgFPS = this.getAverageFPS();
    const fpsStability = this.getFPSStability();
    const memoryPressure = this.getMemoryPressure();
    
    const performanceScore = this.calculatePerformanceScore(avgFPS, fpsStability, memoryPressure);
    const shouldAdapt = this.shouldAdapt(avgFPS, fpsStability, memoryPressure, performanceScore);
    
    if (shouldAdapt) {
      const newQuality = this.determineOptimalQuality(avgFPS, fpsStability, memoryPressure, performanceScore);
      if (newQuality !== this.currentQuality) {
        this.adaptQuality(newQuality, { 
          avgFPS, 
          fpsStability, 
          memoryPressure, 
          performanceScore,
          soulCount: this.metrics.soulCount 
        });
        this.lastAdaptationTime = now;
      }
    }
  }

  private calculatePerformanceScore(avgFPS: number, fpsStability: number, memoryPressure: number): number {
    const fpsScore = Math.min(100, (avgFPS / this.adaptiveConfig.targetFPS) * 100);
    const stabilityScore = fpsStability * 100;
    const memoryScore = Math.max(0, 100 - (memoryPressure * 100));
    
    return (fpsScore * 0.5) + (stabilityScore * 0.3) + (memoryScore * 0.2);
  }

  private shouldAdapt(avgFPS: number, fpsStability: number, memoryPressure: number, performanceScore: number): boolean {
    const thresholds = this.getAdaptationThresholds();
    
    if (avgFPS < thresholds.critical.fps || memoryPressure > thresholds.critical.memory) {
      return true;
    }
    
    if (avgFPS < thresholds.target.fps && fpsStability < thresholds.target.stability) {
      return true;
    }
    
    if (avgFPS > thresholds.headroom.fps && 
        fpsStability > thresholds.headroom.stability && 
        memoryPressure < thresholds.headroom.memory &&
        this.currentQuality !== 'ultra') {
      return true;
    }
    
    if (performanceScore < thresholds.performanceScore.low && this.currentQuality !== 'minimal') {
      return true;
    }
    
    if (performanceScore > thresholds.performanceScore.high && this.currentQuality !== 'ultra') {
      return true;
    }
    
    return false;
  }

  private getAdaptationThresholds(): AdaptationThresholds {
    const baseTarget = this.adaptiveConfig.targetFPS;
    const aggression = this.adaptationAggression;
    
    const aggressionMultiplier = {
      'conservative': { up: 1.3, down: 0.8 },
      'moderate': { up: 1.2, down: 0.85 },
      'aggressive': { up: 1.1, down: 0.9 }
    }[aggression] || { up: 1.2, down: 0.85 };
    
    return {
      critical: {
        fps: Math.max(15, baseTarget * 0.4),
        memory: 0.95
      },
      target: {
        fps: baseTarget * aggressionMultiplier.down,
        stability: 0.6
      },
      headroom: {
        fps: baseTarget * aggressionMultiplier.up,
        stability: 0.8,
        memory: 0.6
      },
      performanceScore: {
        low: 40,
        high: 80
      }
    };
  }

  private determineOptimalQuality(avgFPS: number, fpsStability: number, memoryPressure: number, performanceScore: number): QualityLevel {
    const qualityLevels: QualityLevel[] = ['minimal', 'low', 'medium', 'high', 'ultra'];
    const currentIndex = qualityLevels.indexOf(this.currentQuality);
    const thresholds = this.getAdaptationThresholds();
    
    const measuredPerformance = this.getMeasuredPerformanceForSoulCount(this.metrics.soulCount);
    
    if (avgFPS < thresholds.critical.fps || memoryPressure > 0.95) {
      return 'minimal';
    } else if (avgFPS < thresholds.critical.fps * 1.5 || memoryPressure > 0.85) {
      return 'low';
    } else if (performanceScore < 40 || (fpsStability < 0.6 && avgFPS < thresholds.target.fps)) {
      return Math.max(0, currentIndex - 1) >= 0 ? qualityLevels[Math.max(0, currentIndex - 1)] : 'minimal';
    } else if (performanceScore > 80 && fpsStability > 0.8 && memoryPressure < 0.6) {
      return Math.min(qualityLevels.length - 1, currentIndex + 1) < qualityLevels.length ? 
             qualityLevels[Math.min(qualityLevels.length - 1, currentIndex + 1)] : 'ultra';
    } else if (avgFPS >= thresholds.headroom.fps && fpsStability > 0.8 && memoryPressure < 0.7) {
      return currentIndex < qualityLevels.length - 1 ? qualityLevels[currentIndex + 1] : 'ultra';
    }
    
    return this.currentQuality;
  }

  private getMeasuredPerformanceForSoulCount(soulCount: number): number | null {
    const range = 100;
    const similarCounts = Array.from(this.performanceTracker.performanceMaps.entries())
      .filter(([count, _]) => Math.abs(count - soulCount) <= range)
      .map(([_, fps]) => fps);
    
    if (similarCounts.length > 0) {
      return similarCounts.reduce((a, b) => a + b) / similarCounts.length;
    }
    
    return null;
  }

  private recordPerformanceData(soulCount: number, fps: number, quality: QualityLevel): void {
    const roundedCount = Math.round(soulCount / 50) * 50;
    this.performanceTracker.performanceMaps.set(roundedCount, fps);
    
    if (!this.performanceTracker.qualityBenchmarks.has(quality)) {
      this.performanceTracker.qualityBenchmarks.set(quality, []);
    }
    this.performanceTracker.qualityBenchmarks.get(quality)!.push({ soulCount, fps, timestamp: Date.now() });
    
    const qualityData = this.performanceTracker.qualityBenchmarks.get(quality)!;
    if (qualityData.length > 100) {
      qualityData.splice(0, qualityData.length - 100);
    }
  }

  private updatePerformanceTracking(metric: { fps: number; soulCount: number; memory: number; timestamp: number }): void {
    this.performanceTracker.fpsHistory.push({
      fps: metric.fps,
      soulCount: metric.soulCount,
      quality: this.currentQuality,
      memory: metric.memory,
      timestamp: metric.timestamp
    });
    
    this.recordPerformanceData(metric.soulCount, metric.fps, this.currentQuality);
    
    if (this.performanceTracker.fpsHistory.length > 200) {
      this.performanceTracker.fpsHistory.shift();
    }
  }

  private adaptQuality(newQuality: QualityLevel, metrics: AdaptationHistory['metrics']): QualitySettings {
    const oldQuality = this.currentQuality;
    this.currentQuality = newQuality;
    
    const adaptation: AdaptationHistory = {
      timestamp: performance.now(),
      from: oldQuality,
      to: newQuality,
      reason: this.getAdaptationReason(metrics),
      metrics: { ...metrics }
    };
    
    this.adaptationHistory.push(adaptation);
    this.learnFromAdaptation(adaptation);
    
    return this.getQualitySettings(newQuality);
  }

  private getAdaptationReason(metrics: AdaptationHistory['metrics']): string {
    if (metrics.avgFPS < 20) return 'Critical FPS drop';
    if (metrics.memoryPressure > 0.9) return 'Memory pressure';
    if (metrics.avgFPS < 30) return 'Low FPS performance';
    if (metrics.fpsStability < 0.6) return 'FPS instability';
    if (metrics.avgFPS > 55 && metrics.memoryPressure < 0.6) return 'Performance headroom available';
    return 'General optimization';
  }

  private learnFromAdaptation(adaptation: AdaptationHistory): void {
    if (adaptation.from === 'high' && adaptation.to === 'medium' && adaptation.reason.includes('FPS')) {
      this.hardwareProfile.performance = 'medium';
    } else if (adaptation.from === 'medium' && adaptation.to === 'high' && adaptation.metrics.avgFPS > 50) {
      this.hardwareProfile.performance = 'high';
    }
  }

  public getAverageFPS(): number {
    if (this.metrics.fps.length === 0) return 60;
    return this.metrics.fps.reduce((a, b) => a + b) / this.metrics.fps.length;
  }

  public getFPSStability(): number {
    if (this.metrics.fps.length < 5) return 1.0;
    
    const avg = this.getAverageFPS();
    const variance = this.metrics.fps.reduce((sum, fps) => sum + Math.pow(fps - avg, 2), 0) / this.metrics.fps.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 1.0 - (stdDev / avg));
  }

  public getMemoryPressure(): number {
    if (!performance.memory || this.metrics.memory.length === 0) return 0.5;
    
    const currentMemory = this.metrics.memory[this.metrics.memory.length - 1];
    const maxMemory = performance.memory.jsHeapSizeLimit;
    
    return Math.min(1.0, currentMemory / maxMemory);
  }

  public getQualitySettings(quality: QualityLevel = this.currentQuality): QualitySettings {
    return this.adaptiveConfig.qualityLevels[quality] || this.adaptiveConfig.qualityLevels.medium;
  }

  public getCurrentQuality(): QualityLevel {
    return this.currentQuality;
  }

  public getPerformanceReport(): PerformanceReport {
    const performanceScore = this.metrics.fps.length > 0 ? 
      this.calculatePerformanceScore(this.getAverageFPS(), this.getFPSStability(), this.getMemoryPressure()) : 0;
    
    return {
      currentQuality: this.currentQuality,
      avgFPS: Math.round(this.getAverageFPS() * 10) / 10,
      fpsStability: Math.round(this.getFPSStability() * 100),
      memoryPressure: Math.round(this.getMemoryPressure() * 100),
      performanceScore: Math.round(performanceScore),
      adaptationHistory: this.adaptationHistory.slice(-5),
      hardwareProfile: this.hardwareProfile,
      measurementCount: this.performanceTracker.performanceMaps.size,
      qualityBenchmarks: Object.fromEntries(
        Array.from(this.performanceTracker.qualityBenchmarks.entries()).map(([quality, data]) => [
          quality, 
          {
            avgFPS: data.length > 0 ? data.reduce((sum, d) => sum + d.fps, 0) / data.length : 0,
            sampleCount: data.length
          }
        ])
      ) as Record<QualityLevel, { avgFPS: number; sampleCount: number; }>
    };
  }

  public forceQuality(quality: QualityLevel): QualitySettings {
    const oldQuality = this.currentQuality;
    this.currentQuality = quality;
    return this.getQualitySettings(quality);
  }

  public reset(): void {
    this.currentQuality = this.determineInitialQuality();
    this.metrics = {
      fps: [],
      frameTime: [],
      memory: [],
      workerTime: [],
      renderTime: [],
      soulCount: 0
    };
    this.adaptationHistory = [];
    this.performanceTracker = {
      fpsHistory: [],
      performanceMaps: new Map(),
      qualityBenchmarks: new Map(),
      adaptationSuccess: [],
      hardwareBaseline: null
    };
  }

  public enableDebugMode(): void {
    this.debug = true;
  }

  public disableDebugMode(): void {
    this.debug = false;
  }

  public setAdaptationAggression(level: 'conservative' | 'moderate' | 'aggressive'): void {
    if (['conservative', 'moderate', 'aggressive'].includes(level)) {
      this.adaptationAggression = level;
      this.adaptiveConfig.adaptationSpeed = level;
    }
  }
}
