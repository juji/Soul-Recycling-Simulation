// Phase 3: GPU Instanced Rendering Performance Validation
// This script validates the expected performance improvements from Phase 3

class Phase3PerformanceValidator {
    constructor() {
        this.metrics = {
            baseline: {
                mode: 'individual',
                drawCalls: 0,
                averageUpdateTime: 0,
                peakUpdateTime: 0,
                samples: 0
            },
            instanced: {
                mode: 'instanced',
                drawCalls: 0,
                averageUpdateTime: 0,
                peakUpdateTime: 0,
                samples: 0
            },
            comparison: {
                drawCallReduction: 0,
                updateTimeImprovement: 0,
                validated: false
            }
        };
        this.testStartTime = null;
        this.expectedDrawCalls = {
            individual: null, // Will be set based on soul count
            instanced: 3      // Expected: 3 draw calls (human, gpt, dewa)
        };
    }

    startValidation(soulCount) {
        this.testStartTime = performance.now();
        this.expectedDrawCalls.individual = soulCount;
        
        console.log('🔬 Phase 3 Performance Validation Started');
        console.log(`📊 Testing with ${soulCount} souls`);
        console.log(`🎯 Expected reduction: ${soulCount}+ → 3 draw calls (${Math.round((1 - 3/soulCount) * 100)}% reduction)`);
        
        return this;
    }

    recordMetrics(mode, drawCalls, updateTime) {
        if (!this.metrics[mode]) return;
        
        const metric = this.metrics[mode];
        metric.drawCalls = drawCalls;
        metric.samples++;
        
        // Calculate running average
        metric.averageUpdateTime = ((metric.averageUpdateTime * (metric.samples - 1)) + updateTime) / metric.samples;
        metric.peakUpdateTime = Math.max(metric.peakUpdateTime, updateTime);
        
        // Log significant deviations
        if (mode === 'instanced' && drawCalls > 10) {
            console.warn(`⚠️ Instanced mode using ${drawCalls} draw calls (expected ≤3)`);
        }
        
        if (mode === 'individual' && drawCalls < this.expectedDrawCalls.individual * 0.5) {
            console.warn(`⚠️ Individual mode using fewer draw calls than expected (${drawCalls} vs ${this.expectedDrawCalls.individual})`);
        }
    }

    generateReport() {
        const testDuration = (performance.now() - this.testStartTime) / 1000;
        
        // Calculate improvements
        const drawCallReduction = this.metrics.baseline.drawCalls > 0 ? 
            (1 - this.metrics.instanced.drawCalls / this.metrics.baseline.drawCalls) * 100 : 0;
        
        const updateTimeImprovement = this.metrics.baseline.averageUpdateTime > 0 ?
            (1 - this.metrics.instanced.averageUpdateTime / this.metrics.baseline.averageUpdateTime) * 100 : 0;
        
        this.metrics.comparison = {
            drawCallReduction,
            updateTimeImprovement,
            validated: drawCallReduction >= 80 && this.metrics.instanced.drawCalls <= 10
        };
        
        const report = {
            testDuration: Math.round(testDuration),
            expectedReduction: Math.round((1 - 3/this.expectedDrawCalls.individual) * 100),
            actualReduction: Math.round(drawCallReduction),
            baseline: {
                ...this.metrics.baseline,
                averageUpdateTime: Math.round(this.metrics.baseline.averageUpdateTime * 1000) / 1000
            },
            instanced: {
                ...this.metrics.instanced,
                averageUpdateTime: Math.round(this.metrics.instanced.averageUpdateTime * 1000) / 1000
            },
            validation: {
                drawCallTargetMet: this.metrics.instanced.drawCalls <= 3,
                reductionTargetMet: drawCallReduction >= 80,
                overallSuccess: this.metrics.comparison.validated,
                performance: updateTimeImprovement > 0 ? 'improved' : 'degraded'
            },
            recommendations: this.generateRecommendations()
        };
        
        this.logReport(report);
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.metrics.instanced.drawCalls > 3) {
            recommendations.push('⚠️ Draw calls exceed expected limit - verify InstancedMesh implementation');
        }
        
        if (this.metrics.comparison.drawCallReduction < 80) {
            recommendations.push('⚠️ Draw call reduction below target - check feature flag configuration');
        }
        
        if (this.metrics.instanced.averageUpdateTime > this.metrics.baseline.averageUpdateTime) {
            recommendations.push('⚠️ Update time increased - investigate instanced renderer overhead');
        }
        
        if (this.metrics.comparison.validated) {
            recommendations.push('✅ Phase 3 implementation validated - proceed with production deployment');
        }
        
        return recommendations;
    }

    logReport(report) {
        console.log('\n🎯 Phase 3 Performance Validation Report');
        console.log('=' .repeat(50));
        console.log(`Test Duration: ${report.testDuration}s`);
        console.log(`Expected Reduction: ${report.expectedReduction}%`);
        console.log(`Actual Reduction: ${report.actualReduction}%`);
        console.log('');
        
        console.log('📊 Baseline (Individual Meshes):');
        console.log(`  Draw Calls: ${report.baseline.drawCalls}`);
        console.log(`  Avg Update Time: ${report.baseline.averageUpdateTime}ms`);
        console.log(`  Peak Update Time: ${report.baseline.peakUpdateTime}ms`);
        console.log(`  Samples: ${report.baseline.samples}`);
        console.log('');
        
        console.log('🚀 Instanced Rendering:');
        console.log(`  Draw Calls: ${report.instanced.drawCalls}`);
        console.log(`  Avg Update Time: ${report.instanced.averageUpdateTime}ms`);
        console.log(`  Peak Update Time: ${report.instanced.peakUpdateTime}ms`);
        console.log(`  Samples: ${report.instanced.samples}`);
        console.log('');
        
        console.log('✅ Validation Results:');
        console.log(`  Draw Call Target Met: ${report.validation.drawCallTargetMet ? '✅' : '❌'}`);
        console.log(`  Reduction Target Met: ${report.validation.reductionTargetMet ? '✅' : '❌'}`);
        console.log(`  Overall Success: ${report.validation.overallSuccess ? '✅' : '❌'}`);
        console.log(`  Performance: ${report.validation.performance}`);
        console.log('');
        
        if (report.recommendations.length > 0) {
            console.log('📋 Recommendations:');
            report.recommendations.forEach(rec => console.log(`  ${rec}`));
        }
        
        console.log('=' .repeat(50));
    }

    // Static method for easy access from window
    static createValidator() {
        if (!window.phase3Validator) {
            window.phase3Validator = new Phase3PerformanceValidator();
        }
        return window.phase3Validator;
    }
}

// Export for use in App.svelte
if (typeof window !== 'undefined') {
    window.Phase3PerformanceValidator = Phase3PerformanceValidator;
}

export default Phase3PerformanceValidator;
