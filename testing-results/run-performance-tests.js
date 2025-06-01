#!/usr/bin/env node

/**
 * Automated Performance Testing Script for Soul Recycling Simulation
 * Collects comprehensive performance metrics across different soul counts
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PerformanceTestRunner {
    constructor() {
        this.baseUrl = 'http://localhost:5173';
        this.testCases = [99, 333, 666, 888, 1200, 1500];
        this.testDuration = 15000; // 15 seconds per test
        this.results = [];
    }

    async runAllTests() {
        console.log('🚀 Starting Soul Recycling Performance Test Suite...');
        
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        
        // Set viewport for consistent testing
        await page.setViewport({ width: 1200, height: 800 });
        
        try {
            for (const soulCount of this.testCases) {
                console.log(`\n🔍 Testing ${soulCount} souls...`);
                const result = await this.runSingleTest(page, soulCount);
                this.results.push(result);
                console.log(`✅ Completed: ${result.avgFPS} FPS average`);
            }
            
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        } finally {
            await browser.close();
        }
    }

    async runSingleTest(page, soulCount) {
        const testUrl = `${this.baseUrl}/?val=${soulCount}`;
        
        await page.goto(testUrl, { waitUntil: 'networkidle0' });
        
        // Wait for simulation to fully load
        await page.waitForTimeout(3000);
        
        const fpsReadings = [];
        const memoryReadings = [];
        let currentQuality = 'unknown';
        
        const startTime = Date.now();
        
        // Collect metrics every 500ms
        const interval = setInterval(async () => {
            try {
                const metrics = await page.evaluate(() => {
                    return {
                        fps: window.currentFPS || 0,
                        avgFPS: window.averageFPS || 0,
                        quality: window.currentQuality || 'unknown',
                        memory: window.memoryUsage || 0,
                        soulCount: window.soulCount || 0
                    };
                });
                
                fpsReadings.push(metrics.fps);
                memoryReadings.push(metrics.memory);
                currentQuality = metrics.quality;
                
            } catch (e) {
                console.log('Could not collect metrics:', e.message);
            }
        }, 500);
        
        // Wait for test duration
        await page.waitForTimeout(this.testDuration);
        clearInterval(interval);
        
        // Calculate results
        const avgFPS = fpsReadings.length > 0 ? 
            fpsReadings.reduce((a, b) => a + b) / fpsReadings.length : 0;
        const minFPS = fpsReadings.length > 0 ? Math.min(...fpsReadings) : 0;
        const maxFPS = fpsReadings.length > 0 ? Math.max(...fpsReadings) : 0;
        const avgMemory = memoryReadings.length > 0 ? 
            memoryReadings.reduce((a, b) => a + b) / memoryReadings.length : 0;
        
        // Determine performance rating
        let performance = 'poor';
        if (avgFPS >= 55) performance = 'excellent';
        else if (avgFPS >= 45) performance = 'good';
        else if (avgFPS >= 30) performance = 'acceptable';
        
        return {
            soulCount,
            avgFPS: Math.round(avgFPS),
            minFPS: Math.round(minFPS),
            maxFPS: Math.round(maxFPS),
            quality: currentQuality,
            memory: Math.round(avgMemory),
            performance,
            sampleCount: fpsReadings.length,
            timestamp: new Date().toISOString()
        };
    }

    async generateReport() {
        const report = {
            testRun: {
                timestamp: new Date().toISOString(),
                duration: this.testDuration,
                testCases: this.testCases.length
            },
            hardwareInfo: {
                // This would be detected in the browser
                cpuCores: 'TBD',
                memory: 'TBD',
                deviceType: 'TBD'
            },
            results: this.results,
            summary: this.generateSummary()
        };
        
        // Save to file
        const reportPath = path.join(__dirname, 'performance-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 Performance Test Summary:');
        console.log('============================');
        
        this.results.forEach(result => {
            console.log(`${result.soulCount} souls: ${result.avgFPS} FPS (${result.performance}) - ${result.quality} quality`);
        });
        
        console.log(`\n📁 Detailed report saved to: ${reportPath}`);
        
        return report;
    }

    generateSummary() {
        return {
            totalTests: this.results.length,
            excellentTests: this.results.filter(r => r.performance === 'excellent').length,
            goodTests: this.results.filter(r => r.performance === 'good').length,
            acceptableTests: this.results.filter(r => r.performance === 'acceptable').length,
            poorTests: this.results.filter(r => r.performance === 'poor').length,
            averagePerformanceScore: Math.round(
                this.results.reduce((sum, r) => sum + r.avgFPS, 0) / this.results.length
            ),
            peakSoulCount: Math.max(...this.results.filter(r => r.avgFPS >= 30).map(r => r.soulCount)),
            recommendation: this.generateRecommendation()
        };
    }

    generateRecommendation() {
        const excellentTests = this.results.filter(r => r.performance === 'excellent');
        const poorTests = this.results.filter(r => r.performance === 'poor');
        
        if (excellentTests.length >= 4) {
            return 'Hardware performs excellently. Ready for Phase 3 GPU optimizations.';
        } else if (poorTests.length > 2) {
            return 'Hardware requires optimization. Consider quality settings adjustments.';
        } else {
            return 'Hardware performs adequately. Current optimizations are effective.';
        }
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new PerformanceTestRunner();
    runner.runAllTests().catch(console.error);
}

module.exports = PerformanceTestRunner;
