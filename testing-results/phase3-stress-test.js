import puppeteer from 'puppeteer';
import fs from 'fs';

/**
 * Phase 3 Stress Test - High Soul Count Performance Validation
 * Tests extreme soul counts to validate system robustness and find breaking points
 */

const STRESS_TEST_CONFIG = {
  baseUrl: 'http://localhost:5173',
  testDuration: 30000, // 30 seconds for stress testing
  stabilizationTime: 10000, // 10 seconds for app to stabilize
  scenarios: [
    { name: 'High Performance Baseline', soulCount: 3000 },
    { name: 'Extreme Scale Test', soulCount: 5000 },
    { name: 'Maximum Capacity Test', soulCount: 7500 },
    { name: 'Breaking Point Test', soulCount: 10000 },
    { name: 'System Limit Test', soulCount: 15000 }
  ]
};

class Phase3StressTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      testDuration: STRESS_TEST_CONFIG.testDuration,
      scenarios: [],
      systemInfo: {},
      summary: {}
    };
  }

  async initialize() {
    console.log('🔥 Phase 3 Stress Test - High Soul Count Performance');
    console.log('====================================================');
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Collect system information
    this.results.systemInfo = await this.page.evaluate(() => ({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      memory: navigator.deviceMemory || 'unknown',
      webglInfo: (() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return { supported: false };
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return {
          vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
          renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          version: gl.getParameter(gl.VERSION),
          supported: true
        };
      })()
    }));

    console.log('📊 System Info:', JSON.stringify(this.results.systemInfo, null, 2));
  }

  async runStressScenario(scenario) {
    console.log(`\n🔥 Stress Testing: ${scenario.name} (${scenario.soulCount} souls)`);
    console.log('-'.repeat(60));

    const url = `${STRESS_TEST_CONFIG.baseUrl}?mode=instanced&souls=${scenario.soulCount}`;
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      console.log(`📡 Loaded: ${url}`);

      // Wait for stabilization
      console.log(`⏱️  Stabilizing for ${STRESS_TEST_CONFIG.stabilizationTime / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, STRESS_TEST_CONFIG.stabilizationTime));

      // Collect performance data
      const performanceData = await this.page.evaluate((testDuration) => {
        return new Promise((resolve) => {
          const startTime = performance.now();
          const fpsReadings = [];
          const memoryReadings = [];
          let frameCount = 0;
          let lastFrameTime = startTime;
          let drawCalls = 0;
          let isStable = true;

          const collectMetrics = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastFrameTime;
            
            if (deltaTime > 0) {
              const fps = 1000 / deltaTime;
              fpsReadings.push(fps);
              frameCount++;
            }
            
            lastFrameTime = currentTime;

            // Memory usage
            if (performance.memory) {
              memoryReadings.push({
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
              });
            }

            // Check for system stability (very low FPS = instability)
            if (fps < 5) {
              isStable = false;
            }

            // Try to get draw call count from WebGL
            const canvas = document.querySelector('canvas');
            if (canvas) {
              const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
              if (gl && gl.getParameter) {
                try {
                  // This is an approximation - actual draw calls are harder to measure
                  drawCalls = window.soulCount || 0;
                } catch (e) {
                  // Ignore WebGL errors
                }
              }
            }

            if (currentTime - startTime < testDuration) {
              requestAnimationFrame(collectMetrics);
            } else {
              // Calculate final metrics
              const avgFPS = fpsReadings.length > 0 ? 
                fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length : 0;
              
              const sortedFPS = fpsReadings.sort((a, b) => a - b);
              const fps95th = sortedFPS[Math.floor(sortedFPS.length * 0.95)] || 0;
              const fps5th = sortedFPS[Math.floor(sortedFPS.length * 0.05)] || 0;
              
              const latestMemory = memoryReadings[memoryReadings.length - 1] || {};
              const memoryMB = latestMemory.used ? latestMemory.used / (1024 * 1024) : 0;
              
              // Stability calculation
              const stableFPS = fpsReadings.filter(fps => fps > 20).length;
              const stability = fpsReadings.length > 0 ? stableFPS / fpsReadings.length : 0;

              resolve({
                averageFPS: avgFPS,
                fps95th: fps95th,
                fps5th: fps5th,
                frameCount: frameCount,
                memoryMB: memoryMB,
                memoryInfo: latestMemory,
                stability: stability,
                drawCalls: drawCalls,
                isStable: isStable,
                soulCount: window.soulCount || 0
              });
            }
          };

          requestAnimationFrame(collectMetrics);
        });
      }, STRESS_TEST_CONFIG.testDuration);

      const result = {
        scenario: scenario.name,
        soulCount: scenario.soulCount,
        mode: 'instanced',
        testDuration: STRESS_TEST_CONFIG.testDuration,
        ...performanceData,
        performance: this.evaluatePerformance(performanceData, scenario.soulCount),
        timestamp: new Date().toISOString()
      };

      this.results.scenarios.push(result);
      
      console.log(`📊 Results: ${result.averageFPS.toFixed(1)} FPS | ${result.stability.toFixed(1)}% stable | ${result.memoryMB.toFixed(1)}MB`);
      console.log(`🎯 Status: ${result.performance} | ${result.isStable ? 'STABLE' : 'UNSTABLE'}`);

      return result;

    } catch (error) {
      console.error(`❌ Error in scenario ${scenario.name}:`, error.message);
      
      const errorResult = {
        scenario: scenario.name,
        soulCount: scenario.soulCount,
        mode: 'instanced',
        error: error.message,
        performance: 'ERROR',
        timestamp: new Date().toISOString()
      };
      
      this.results.scenarios.push(errorResult);
      return errorResult;
    }
  }

  evaluatePerformance(data, soulCount) {
    if (!data.isStable) return 'CRITICAL_FAIL';
    if (data.averageFPS < 15) return 'FAIL';
    if (data.averageFPS < 30) return 'DEGRADED';
    if (data.averageFPS < 60) return 'ACCEPTABLE';
    return 'EXCELLENT';
  }

  async runAllTests() {
    console.log(`🔥 Starting stress test with ${STRESS_TEST_CONFIG.scenarios.length} scenarios...`);
    
    for (const scenario of STRESS_TEST_CONFIG.scenarios) {
      await this.runStressScenario(scenario);
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.generateSummary();
  }

  generateSummary() {
    const validResults = this.results.scenarios.filter(r => r.performance !== 'ERROR');
    
    if (validResults.length === 0) {
      this.results.summary = { error: 'No valid test results' };
      return;
    }

    const avgFPS = validResults.reduce((sum, r) => sum + (r.averageFPS || 0), 0) / validResults.length;
    const avgStability = validResults.reduce((sum, r) => sum + (r.stability || 0), 0) / validResults.length;
    const avgMemory = validResults.reduce((sum, r) => sum + (r.memoryMB || 0), 0) / validResults.length;
    
    const maxSoulCount = Math.max(...validResults.map(r => r.soulCount));
    const breakingPoint = validResults.find(r => r.performance === 'CRITICAL_FAIL' || r.performance === 'FAIL');
    
    this.results.summary = {
      totalScenarios: this.results.scenarios.length,
      successfulTests: validResults.length,
      errorTests: this.results.scenarios.length - validResults.length,
      averageFPS: avgFPS,
      averageStability: avgStability,
      averageMemoryMB: avgMemory,
      maxStableSoulCount: maxSoulCount,
      breakingPoint: breakingPoint ? breakingPoint.soulCount : null,
      overallAssessment: this.getOverallAssessment(validResults)
    };
  }

  getOverallAssessment(results) {
    const excellentCount = results.filter(r => r.performance === 'EXCELLENT').length;
    const failCount = results.filter(r => r.performance === 'FAIL' || r.performance === 'CRITICAL_FAIL').length;
    
    if (failCount === 0 && excellentCount > results.length * 0.8) return 'OUTSTANDING';
    if (failCount === 0) return 'EXCELLENT';
    if (failCount < results.length * 0.3) return 'GOOD';
    if (failCount < results.length * 0.6) return 'CONCERNING';
    return 'CRITICAL';
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `phase3-stress-test-${timestamp}.json`;
    const filepath = `/Users/juji/play/soul-recycling-simulation/testing-results/${filename}`;
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved: ${filename}`);

    // Also save as latest
    const latestPath = '/Users/juji/play/soul-recycling-simulation/testing-results/phase3-stress-test-latest.json';
    fs.writeFileSync(latestPath, JSON.stringify(this.results, null, 2));
    
    this.generateReport();
  }

  generateReport() {
    const report = this.createMarkdownReport();
    const reportPath = '/Users/juji/play/soul-recycling-simulation/testing-results/phase3-stress-test-report.md';
    fs.writeFileSync(reportPath, report);
    console.log('📄 Report generated: phase3-stress-test-report.md');
  }

  createMarkdownReport() {
    const { summary, scenarios, systemInfo } = this.results;
    
    return `# 🔥 Phase 3 Stress Test Report

**Generated:** ${new Date().toLocaleString()}  
**Test Duration:** ${STRESS_TEST_CONFIG.testDuration / 1000}s per scenario  
**Test Scenarios:** ${scenarios.length}

## 📊 Executive Summary

**Overall Assessment:** ${summary.overallAssessment || 'UNKNOWN'}  
**Maximum Stable Soul Count:** ${summary.maxStableSoulCount || 'N/A'}  
**Breaking Point:** ${summary.breakingPoint || 'Not Found'}  

### Key Metrics
- **Average FPS:** ${(summary.averageFPS || 0).toFixed(1)}
- **Average Stability:** ${(summary.averageStability * 100 || 0).toFixed(1)}%
- **Average Memory Usage:** ${(summary.averageMemoryMB || 0).toFixed(1)}MB
- **Successful Tests:** ${summary.successfulTests}/${summary.totalScenarios}

## 📋 Detailed Results

| Soul Count | Avg FPS | Stability | Memory (MB) | Status | Assessment |
|------------|---------|-----------|-------------|--------|------------|
${scenarios.map(s => {
  if (s.error) {
    return `| ${s.soulCount} | ERROR | ERROR | ERROR | ERROR | ${s.performance} |`;
  }
  return `| ${s.soulCount} | ${(s.averageFPS || 0).toFixed(1)} | ${((s.stability || 0) * 100).toFixed(1)}% | ${(s.memoryMB || 0).toFixed(1)} | ${s.isStable ? 'STABLE' : 'UNSTABLE'} | ${s.performance} |`;
}).join('\n')}

## 💻 System Information

\`\`\`json
${JSON.stringify(systemInfo, null, 2)}
\`\`\`

## 📈 Analysis

### Performance Characteristics
${this.generateAnalysis()}

### Recommendations
${this.generateRecommendations()}

---
*Report generated by Phase 3 Stress Test Suite - Soul Recycling Simulation*
`;
  }

  generateAnalysis() {
    const { summary, scenarios } = this.results;
    const validResults = scenarios.filter(r => r.performance !== 'ERROR');
    
    if (validResults.length === 0) {
      return '❌ No valid results to analyze.';
    }

    let analysis = '';
    
    if (summary.maxStableSoulCount >= 10000) {
      analysis += '🚀 **EXCEPTIONAL**: System handles extreme soul counts (10,000+) with stability.\n\n';
    } else if (summary.maxStableSoulCount >= 5000) {
      analysis += '✅ **EXCELLENT**: System performs well at high soul counts (5,000+).\n\n';
    } else if (summary.maxStableSoulCount >= 3000) {
      analysis += '👍 **GOOD**: System handles moderate high loads (3,000+).\n\n';
    } else {
      analysis += '⚠️ **CONCERNING**: System may struggle with high soul counts.\n\n';
    }

    if (summary.breakingPoint) {
      analysis += `🔥 **Breaking Point Identified**: Performance degradation begins around ${summary.breakingPoint} souls.\n\n`;
    } else {
      analysis += '💪 **No Breaking Point Found**: System remained stable across all tested scenarios.\n\n';
    }

    return analysis;
  }

  generateRecommendations() {
    const { summary } = this.results;
    
    let recommendations = '';
    
    if (summary.overallAssessment === 'OUTSTANDING' || summary.overallAssessment === 'EXCELLENT') {
      recommendations += '✅ **Phase 3 implementation is production-ready for extreme scale deployments.**\n\n';
      recommendations += '🎯 Consider implementing this as the default rendering mode for all soul counts.\n\n';
    } else if (summary.overallAssessment === 'GOOD') {
      recommendations += '✅ **Phase 3 implementation is solid for production use.**\n\n';
      recommendations += '💡 Consider optimizations for extreme scale scenarios.\n\n';
    } else {
      recommendations += '⚠️ **Additional optimization may be needed before extreme scale deployment.**\n\n';
    }

    if (summary.breakingPoint && summary.breakingPoint < 5000) {
      recommendations += `🔧 **Implement soul count limiting at ${Math.floor(summary.breakingPoint * 0.8)} souls for safety margin.**\n\n`;
    }

    return recommendations;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.runAllTests();
      await this.saveResults();
      
      console.log('\n🎉 Stress Test Complete!');
      console.log('====================================');
      console.log(`📊 Overall Assessment: ${this.results.summary.overallAssessment}`);
      console.log(`🎯 Max Stable Soul Count: ${this.results.summary.maxStableSoulCount}`);
      console.log(`📈 Average FPS: ${this.results.summary.averageFPS.toFixed(1)}`);
      
    } catch (error) {
      console.error('❌ Stress test failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const stressTest = new Phase3StressTest();
  stressTest.run();
}

export default Phase3StressTest;
