/**
 * Adaptive Performance System
 * Intelligently adapts simulation parameters based on machine's computing power
 * Learns hardware capabilities and optimizes in real-time
 */

export class AdaptivePerformanceManager {
    constructor(options = {}) {
        // Configuration options
        this.debug = options.debug || false;
        this.enableLearning = options.enableLearning !== false; // Default true
        this.adaptationAggression = options.adaptationAggression || 'moderate'; // 'conservative', 'moderate', 'aggressive'
        
        // Hardware capability detection
        this.hardwareProfile = {
            cpuCores: navigator.hardwareConcurrency || 4,
            memory: this.getMemoryInfo(),
            gpu: this.getGPUInfo(),
            deviceType: this.detectDeviceType(),
            performance: 'unknown' // will be learned
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
            // Performance targets (can be tuned based on hardware)
            targetFPS: this.getTargetFPS(),
            minAcceptableFPS: this.getMinAcceptableFPS(),
            maxAcceptableFPS: 120,
            
            // Learning parameters
            learningRate: options.learningRate || 0.05, // Reduced for stability
            adaptationSpeed: this.adaptationAggression,
            metricsWindowSize: options.metricsWindowSize || 60, // Reduced for faster adaptation
            
            // Stability thresholds
            fpsStabilityThreshold: 0.7,
            memoryPressureThreshold: 0.8,
            adaptationCooldown: 3000, // 3 seconds between adaptations
            
            // Quality levels with hardware-aware defaults
            qualityLevels: this.generateQualityLevels()
        };

        // Current state
        this.currentQuality = this.determineInitialQuality();
        this.isLearning = this.enableLearning;
        this.adaptationHistory = [];
        this.lastAdaptationTime = 0;
        
        // Performance tracking (no fake AI)
        this.performanceTracker = {
            fpsHistory: [],
            performanceMaps: new Map(), // soulCount -> typical FPS
            qualityBenchmarks: new Map(), // quality -> performance data
            adaptationSuccess: [], // track successful adaptations
            hardwareBaseline: null // measured baseline performance
        };

        if (this.debug) {
            // Debug mode enabled - performance manager initialized
        }
    }

    getMemoryInfo() {
        if (performance.memory) {
            const totalMB = performance.memory.jsHeapSizeLimit / 1024 / 1024;
            return {
                total: totalMB,
                category: totalMB > 2000 ? 'high' : totalMB > 1000 ? 'medium' : 'low'
            };
        }
        return { total: 'unknown', category: 'medium' };
    }

    getGPUInfo() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
            
            return {
                renderer: renderer,
                category: this.categorizeGPU(renderer),
                webgl2: !!canvas.getContext('webgl2')
            };
        }
        
        return { renderer: 'unknown', category: 'medium', webgl2: false };
    }

    categorizeGPU(renderer) {
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

    detectDeviceType() {
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

    getTargetFPS() {
        // Adaptive target FPS based on hardware
        const multiplier = this.getHardwareMultiplier();
        if (multiplier >= 1.5) return 60; // High-end: aim for 60 FPS
        if (multiplier >= 1.0) return 45; // Mid-range: aim for 45 FPS
        if (multiplier >= 0.7) return 30; // Low-end: aim for 30 FPS
        return 24; // Very low-end: aim for 24 FPS
    }

    getMinAcceptableFPS() {
        // Minimum acceptable FPS based on target
        return Math.max(15, this.getTargetFPS() * 0.5);
    }

    generateQualityLevels() {
        const baseQuality = {
            ultra: {
                maxSouls: 2000,
                maxConnectionChecks: 300,
                connectionLimit: 50,
                geometryDetail: { sphere: [24, 24], human: [16, 16] },
                updateRate: 60,
                enableAdvancedEffects: true,
                spatialGridSize: 2.0,
                maxLines: 1000
            },
            high: {
                maxSouls: 1500,
                maxConnectionChecks: 200,
                connectionLimit: 30,
                geometryDetail: { sphere: [20, 20], human: [12, 12] },
                updateRate: 60,
                enableAdvancedEffects: true,
                spatialGridSize: 3.0,
                maxLines: 500
            },
            medium: {
                maxSouls: 1000,
                maxConnectionChecks: 150,
                connectionLimit: 20,
                geometryDetail: { sphere: [16, 16], human: [10, 10] },
                updateRate: 45,
                enableAdvancedEffects: false,
                spatialGridSize: 4.0,
                maxLines: 300
            },
            low: {
                maxSouls: 500,
                maxConnectionChecks: 100,
                connectionLimit: 15,
                geometryDetail: { sphere: [12, 12], human: [8, 8] },
                updateRate: 30,
                enableAdvancedEffects: false,
                spatialGridSize: 5.0,
                maxLines: 150
            },
            minimal: {
                maxSouls: 200,
                maxConnectionChecks: 50,
                connectionLimit: 10,
                geometryDetail: { sphere: [8, 8], human: [6, 6] },
                updateRate: 24,
                enableAdvancedEffects: false,
                spatialGridSize: 6.0,
                maxLines: 75
            }
        };

        // Adjust based on hardware
        return this.adjustQualityForHardware(baseQuality);
    }

    adjustQualityForHardware(quality) {
        const multiplier = this.getHardwareMultiplier();
        
        Object.keys(quality).forEach(level => {
            quality[level].maxSouls = Math.floor(quality[level].maxSouls * multiplier);
            quality[level].maxConnectionChecks = Math.floor(quality[level].maxConnectionChecks * multiplier);
        });

        return quality;
    }

    getHardwareMultiplier() {
        let multiplier = 1.0;

        // CPU factor
        if (this.hardwareProfile.cpuCores >= 8) multiplier *= 1.3;
        else if (this.hardwareProfile.cpuCores >= 4) multiplier *= 1.0;
        else multiplier *= 0.7;

        // Memory factor
        if (this.hardwareProfile.memory.category === 'high') multiplier *= 1.2;
        else if (this.hardwareProfile.memory.category === 'low') multiplier *= 0.8;

        // GPU factor
        if (this.hardwareProfile.gpu.category === 'high') multiplier *= 1.4;
        else if (this.hardwareProfile.gpu.category === 'low') multiplier *= 0.6;

        // Device type factor
        if (this.hardwareProfile.deviceType === 'mobile') multiplier *= 0.5;

        return Math.max(0.3, Math.min(2.0, multiplier)); // Clamp between 0.3x and 2.0x
    }

    determineInitialQuality() {
        const multiplier = this.getHardwareMultiplier();
        
        if (multiplier >= 1.5) return 'ultra';
        if (multiplier >= 1.2) return 'high';
        if (multiplier >= 0.8) return 'medium';
        if (multiplier >= 0.5) return 'low';
        return 'minimal';
    }

    // Main adaptation logic
    updateMetrics(fps, frameTime, memory, workerTime, renderTime, soulCount) {
        // Store metrics with timestamp
        const timestamp = performance.now();
        const metric = { fps, frameTime, memory, workerTime, renderTime, soulCount, timestamp };
        
        this.metrics.fps.push(fps);
        this.metrics.frameTime.push(frameTime);
        this.metrics.memory.push(memory);
        this.metrics.workerTime.push(workerTime);
        this.metrics.renderTime.push(renderTime);
        this.metrics.soulCount = soulCount;

        // Keep only recent metrics (configurable window size)
        const windowSize = this.adaptiveConfig.metricsWindowSize || 100;
        Object.keys(this.metrics).forEach(key => {
            if (Array.isArray(this.metrics[key]) && this.metrics[key].length > windowSize) {
                this.metrics[key].shift();
            }
        });

        // Debug logging (can be toggled)
        if (this.debug && this.metrics.fps.length % 30 === 0) {
            console.log('🔍 AI Metrics Update:', {
                fps: Math.round(fps),
                quality: this.currentQuality,
                soulCount: soulCount,
                memoryMB: Math.round(memory),
                frameTimeMs: Math.round(frameTime * 100) / 100
            });
        }

        // Trigger adaptation check
        this.checkForAdaptation();
        
        // Update performance tracking (real measurements, not fake ML)
        this.updatePerformanceTracking(metric);
    }

    checkForAdaptation() {
        if (this.metrics.fps.length < 10) return; // Need enough data
        
        // Check adaptation cooldown
        const now = performance.now();
        if (now - this.lastAdaptationTime < this.adaptiveConfig.adaptationCooldown) {
            return; // Too soon since last adaptation
        }

        const avgFPS = this.getAverageFPS();
        const fpsStability = this.getFPSStability();
        const memoryPressure = this.getMemoryPressure();
        
        // Enhanced decision logic based on aggregated metrics
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

    calculatePerformanceScore(avgFPS, fpsStability, memoryPressure) {
        // Weighted performance score (0-100)
        const fpsScore = Math.min(100, (avgFPS / this.adaptiveConfig.targetFPS) * 100);
        const stabilityScore = fpsStability * 100;
        const memoryScore = Math.max(0, 100 - (memoryPressure * 100));
        
        // Weighted average: FPS (50%), Stability (30%), Memory (20%)
        return (fpsScore * 0.5) + (stabilityScore * 0.3) + (memoryScore * 0.2);
    }

    shouldAdapt(avgFPS, fpsStability, memoryPressure, performanceScore) {
        // Enhanced decision matrix based on adaptation aggression
        const thresholds = this.getAdaptationThresholds();
        
        // Critical performance issues - always adapt
        if (avgFPS < thresholds.critical.fps || memoryPressure > thresholds.critical.memory) {
            if (this.debug) console.log('🚨 Critical performance detected, forcing adaptation');
            return true;
        }
        
        // Performance below target
        if (avgFPS < thresholds.target.fps && fpsStability < thresholds.target.stability) {
            if (this.debug) console.log('📉 Performance below target, adapting down');
            return true;
        }
        
        // Performance headroom available (can increase quality)
        if (avgFPS > thresholds.headroom.fps && 
            fpsStability > thresholds.headroom.stability && 
            memoryPressure < thresholds.headroom.memory &&
            this.currentQuality !== 'ultra') {
            if (this.debug) console.log('📈 Performance headroom detected, adapting up');
            return true;
        }
        
        // Performance score based adaptation
        if (performanceScore < thresholds.performanceScore.low && this.currentQuality !== 'minimal') {
            return true;
        }
        
        if (performanceScore > thresholds.performanceScore.high && this.currentQuality !== 'ultra') {
            return true;
        }
        
        return false;
    }

    getAdaptationThresholds() {
        const baseTarget = this.adaptiveConfig.targetFPS;
        const aggression = this.adaptationAggression;
        
        // Adjust thresholds based on adaptation aggression
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

    determineOptimalQuality(avgFPS, fpsStability, memoryPressure, performanceScore) {
        const qualityLevels = ['minimal', 'low', 'medium', 'high', 'ultra'];
        const currentIndex = qualityLevels.indexOf(this.currentQuality);
        const thresholds = this.getAdaptationThresholds();
        
        // Use actual measured performance data instead of fake ML
        const measuredPerformance = this.getMeasuredPerformanceForSoulCount(this.metrics.soulCount);
        
        if (this.debug) {
            console.log('📊 Performance-Based Quality Decision:', { 
                avgFPS,
                measured: measuredPerformance,
                current: this.currentQuality,
                soulCount: this.metrics.soulCount
            });
        }
        
        // Critical performance issues
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
        
        return this.currentQuality; // No change
    }

    getMeasuredPerformanceForSoulCount(soulCount) {
        // Get actual measured performance for similar soul counts
        const range = 100; // +/- 100 souls
        const similarCounts = Array.from(this.performanceTracker.performanceMaps.entries())
            .filter(([count, _]) => Math.abs(count - soulCount) <= range)
            .map(([_, fps]) => fps);
        
        if (similarCounts.length > 0) {
            return similarCounts.reduce((a, b) => a + b) / similarCounts.length;
        }
        
        return null; // No data available
    }

    recordPerformanceData(soulCount, fps, quality) {
        // Record actual performance for this soul count
        const roundedCount = Math.round(soulCount / 50) * 50; // Round to nearest 50
        this.performanceTracker.performanceMaps.set(roundedCount, fps);
        
        // Record quality benchmark
        if (!this.performanceTracker.qualityBenchmarks.has(quality)) {
            this.performanceTracker.qualityBenchmarks.set(quality, []);
        }
        this.performanceTracker.qualityBenchmarks.get(quality).push({ soulCount, fps, timestamp: Date.now() });
        
        // Keep only recent data (last 100 entries per quality)
        const qualityData = this.performanceTracker.qualityBenchmarks.get(quality);
        if (qualityData.length > 100) {
            qualityData.splice(0, qualityData.length - 100);
        }
    }

    validateQualityChoice(quality, avgFPS, fpsStability, memoryPressure) {
        // Validate ML prediction against safety thresholds
        const qualityLevels = ['minimal', 'low', 'medium', 'high', 'ultra'];
        const targetIndex = qualityLevels.indexOf(quality);
        const currentIndex = qualityLevels.indexOf(this.currentQuality);
        
        // Don't allow drastic quality increases if performance is poor
        if (targetIndex > currentIndex + 1 && (avgFPS < this.adaptiveConfig.targetFPS * 0.9 || fpsStability < 0.7)) {
            return false;
        }
        
        // Don't allow quality increases if memory pressure is high
        if (targetIndex > currentIndex && memoryPressure > 0.8) {
            return false;
        }
        
        return true;
    }

    adaptQuality(newQuality, metrics) {
        const oldQuality = this.currentQuality;
        this.currentQuality = newQuality;
        
        const adaptation = {
            timestamp: performance.now(),
            from: oldQuality,
            to: newQuality,
            reason: this.getAdaptationReason(metrics),
            metrics: { ...metrics }
        };
        
        this.adaptationHistory.push(adaptation);
        
        console.log(`🎯 Performance Adaptation: ${oldQuality} → ${newQuality}`, {
            reason: adaptation.reason,
            metrics: metrics,
            hardware: this.hardwareProfile.performance
        });
        
        // Learn from this adaptation
        this.learnFromAdaptation(adaptation);
        
        return this.getQualitySettings(newQuality);
    }

    getAdaptationReason(metrics) {
        if (metrics.avgFPS < 20) return 'Critical FPS drop';
        if (metrics.memoryPressure > 0.9) return 'Memory pressure';
        if (metrics.avgFPS < 30) return 'Low FPS performance';
        if (metrics.fpsStability < 0.6) return 'FPS instability';
        if (metrics.avgFPS > 55 && metrics.memoryPressure < 0.6) return 'Performance headroom available';
        return 'General optimization';
    }

    learnFromAdaptation(adaptation) {
        // Simple learning: update hardware performance assessment
        if (adaptation.from === 'high' && adaptation.to === 'medium' && adaptation.reason.includes('FPS')) {
            this.hardwareProfile.performance = 'medium';
        } else if (adaptation.from === 'medium' && adaptation.to === 'high' && adaptation.metrics.avgFPS > 50) {
            this.hardwareProfile.performance = 'high';
        }
        
        // Update performance model weights
        this.updateModelWeights(adaptation);
    }

    updatePerformanceTracking(metric) {
        // Store actual FPS history
        this.performanceTracker.fpsHistory.push({
            fps: metric.fps,
            soulCount: metric.soulCount,
            quality: this.currentQuality,
            memory: metric.memory,
            timestamp: metric.timestamp
        });
        
        // Record performance data for this configuration
        this.recordPerformanceData(metric.soulCount, metric.fps, this.currentQuality);
        
        // Keep only recent history (last 200 frames)
        if (this.performanceTracker.fpsHistory.length > 200) {
            this.performanceTracker.fpsHistory.shift();
        }
        
        if (this.debug && this.performanceTracker.fpsHistory.length % 30 === 0) {
            console.log('📈 Performance Tracking Update:', {
                fps: Math.round(metric.fps),
                quality: this.currentQuality,
                soulCount: metric.soulCount,
                measurementsCount: this.performanceTracker.performanceMaps.size
            });
        }
    }

    getQualityMultiplier() {
        const qualityMap = { 'minimal': 0.2, 'low': 0.4, 'medium': 0.6, 'high': 0.8, 'ultra': 1.0 };
        return qualityMap[this.currentQuality] || 0.6;
    }

    trainModel() {
        if (this.performanceModel.predictions.length < 20) return;
        
        const trainingData = this.performanceModel.predictions.slice(-50); // Use last 50 predictions
        const learningRate = this.adaptiveConfig.learningRate;
        
        // Simple gradient descent
        trainingData.forEach(data => {
            const error = data.actual - data.predicted;
            
            // Update bias
            this.performanceModel.bias += learningRate * error;
            
            // Update weights
            data.features.forEach((feature, index) => {
                const weightKey = ['soulCount', 'memory', 'hardware', 'quality'][index];
                const currentWeight = this.performanceModel.weights.get(weightKey) || 0;
                const gradient = error * feature;
                this.performanceModel.weights.set(weightKey, currentWeight + learningRate * gradient);
            });
        });
        
        this.performanceModel.trainingCount++;
        
        if (this.debug) {
            console.log('🎓 Model Training Complete:', {
                trainingCount: this.performanceModel.trainingCount,
                accuracy: Math.round(this.performanceModel.accuracy * 100) + '%',
                bias: Math.round(this.performanceModel.bias * 100) / 100
            });
        }
    }

    predictPerformance(features) {
        let prediction = this.performanceModel.bias;
        
        const weightKeys = ['soulCount', 'memory', 'hardware', 'quality'];
        features.forEach((feature, index) => {
            const weight = this.performanceModel.weights.get(weightKeys[index]) || 0;
            prediction += feature * weight;
        });
        
        // Clamp prediction to reasonable bounds
        return Math.max(5, Math.min(120, prediction));
    }

    updateModelWeights(adaptation) {
        // Simple gradient descent-like update
        const learningRate = 0.01;
        const error = adaptation.metrics.avgFPS - this.adaptiveConfig.targetFPS;
        
        // Update bias
        this.performanceModel.bias += learningRate * error;
        
        // Update weights based on recent predictions
        if (this.performanceModel.predictions.length > 5) {
            const recentPredictions = this.performanceModel.predictions.slice(-5);
            recentPredictions.forEach(pred => {
                const predError = pred.actual - pred.predicted;
                pred.features.forEach((feature, index) => {
                    const currentWeight = this.performanceModel.weights.get(index) || 0;
                    this.performanceModel.weights.set(index, currentWeight + learningRate * predError * feature);
                });
            });
        }
    }

    // Utility methods
    getAverageFPS() {
        if (this.metrics.fps.length === 0) return 60;
        return this.metrics.fps.reduce((a, b) => a + b) / this.metrics.fps.length;
    }

    getFPSStability() {
        if (this.metrics.fps.length < 5) return 1.0;
        
        const avg = this.getAverageFPS();
        const variance = this.metrics.fps.reduce((sum, fps) => sum + Math.pow(fps - avg, 2), 0) / this.metrics.fps.length;
        const stdDev = Math.sqrt(variance);
        
        // Return stability as ratio (1.0 = perfectly stable, 0.0 = highly unstable)
        return Math.max(0, 1.0 - (stdDev / avg));
    }

    getMemoryPressure() {
        if (!performance.memory || this.metrics.memory.length === 0) return 0.5;
        
        const currentMemory = this.metrics.memory[this.metrics.memory.length - 1];
        const maxMemory = performance.memory.jsHeapSizeLimit;
        
        return Math.min(1.0, currentMemory / maxMemory);
    }

    getQualitySettings(quality = this.currentQuality) {
        return this.adaptiveConfig.qualityLevels[quality] || this.adaptiveConfig.qualityLevels.medium;
    }

    // Public API
    getCurrentQuality() {
        return this.currentQuality;
    }

    getPerformanceReport() {
        const performanceScore = this.metrics.fps.length > 0 ? 
            this.calculatePerformanceScore(this.getAverageFPS(), this.getFPSStability(), this.getMemoryPressure()) : 0;
        
        return {
            currentQuality: this.currentQuality,
            avgFPS: Math.round(this.getAverageFPS() * 10) / 10,
            fpsStability: Math.round(this.getFPSStability() * 100),
            memoryPressure: Math.round(this.getMemoryPressure() * 100),
            performanceScore: Math.round(performanceScore),
            adaptationHistory: this.adaptationHistory.slice(-5), // Last 5 adaptations
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
            )
        };
    }
            
        return {
            hardware: {
                ...this.hardwareProfile,
                multiplier: this.getHardwareMultiplier(),
                targetFPS: this.adaptiveConfig.targetFPS
            },
            currentQuality: this.currentQuality,
            metrics: {
                avgFPS: this.getAverageFPS(),
                stability: this.getFPSStability(),
                memoryPressure: this.getMemoryPressure(),
                performanceScore: Math.round(performanceScore),
                soulCount: this.metrics.soulCount
            },
            model: {
                accuracy: Math.round(this.performanceModel.accuracy * 100),
                trainingCount: this.performanceModel.trainingCount,
                predictions: this.performanceModel.predictions.length,
                weights: Object.fromEntries(this.performanceModel.weights)
            },
            adaptationHistory: this.adaptationHistory.slice(-10), // Last 10 adaptations
            config: {
                debug: this.debug,
                enableLearning: this.enableLearning,
                adaptationAggression: this.adaptationAggression,
                cooldown: this.adaptiveConfig.adaptationCooldown
            }
        };
    }

    forceQuality(quality) {
        const oldQuality = this.currentQuality;
        this.currentQuality = quality;
        console.log(`🔧 Manual quality override: ${oldQuality} → ${quality}`);
        return this.getQualitySettings(quality);
    }

    reset() {
        this.metrics = { fps: [], frameTime: [], memory: [], workerTime: [], renderTime: [], soulCount: 0 };
        this.adaptationHistory = [];
        this.performanceModel.predictions = [];
        this.performanceModel.trainingCount = 0;
        this.performanceModel.accuracy = 0.5;
        this.lastAdaptationTime = 0;
        this.isLearning = this.enableLearning;
        
        if (this.debug) console.log('🔄 Enhanced Adaptive Performance Manager reset');
    }

    // Debug and utility methods
    enableDebugMode() {
        this.debug = true;
        console.log('🔍 Debug mode enabled for Adaptive Performance Manager');
    }

    disableDebugMode() {
        this.debug = false;
        console.log('🔇 Debug mode disabled for Adaptive Performance Manager');
    }

    setAdaptationAggression(level) {
        if (['conservative', 'moderate', 'aggressive'].includes(level)) {
            this.adaptationAggression = level;
            if (this.debug) console.log(`⚡ Adaptation aggression set to: ${level}`);
        }
    }

    getModelInsights() {
        if (this.performanceModel.predictions.length < 10) {
            return { status: 'insufficient_data', message: 'Need more data for insights' };
        }

        const recentPredictions = this.performanceModel.predictions.slice(-20);
        const avgError = recentPredictions.reduce((sum, p) => sum + p.error, 0) / recentPredictions.length;
        const errorTrend = this.calculateErrorTrend(recentPredictions);
        
        return {
            status: 'ready',
            accuracy: this.performanceModel.accuracy,
            averageError: Math.round(avgError * 100) / 100,
            errorTrend: errorTrend,
            trainingCount: this.performanceModel.trainingCount,
            weights: Object.fromEntries(this.performanceModel.weights),
            recommendations: this.generateRecommendations()
        };
    }

    calculateErrorTrend(predictions) {
        if (predictions.length < 5) return 'stable';
        
        const firstHalf = predictions.slice(0, Math.floor(predictions.length / 2));
        const secondHalf = predictions.slice(Math.floor(predictions.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, p) => sum + p.error, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, p) => sum + p.error, 0) / secondHalf.length;
        
        const improvement = (firstAvg - secondAvg) / firstAvg;
        
        if (improvement > 0.1) return 'improving';
        if (improvement < -0.1) return 'degrading';
        return 'stable';
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.adaptationHistory.length > 5) {
            const recentAdaptations = this.adaptationHistory.slice(-5);
            const qualityChanges = recentAdaptations.filter(a => a.from !== a.to).length;
            if (qualityChanges > 3) {
                recommendations.push('Frequent quality changes detected - consider less aggressive adaptation');
            }
        }
        
        const avgFPS = this.getAverageFPS();
        if (avgFPS < this.adaptiveConfig.targetFPS * 0.8) {
            recommendations.push('Performance below target - consider optimizing simulation parameters');
        }
        
        const measurementCount = this.performanceTracker.performanceMaps.size;
        if (measurementCount < 10) {
            recommendations.push('Still gathering performance data - allow more time for optimization');
        }
        
        return recommendations;
    }
}
