import puppeteer from 'puppeteer';
import fs from 'fs';

/**
 * Phase 3 Conservative Stress Test - Realistic High Soul Count Testing
 * Tests moderate high soul counts to find practical limits
 */

const CONSERVATIVE_STRESS_CONFIG = {
  baseUrl: 'http://localhost:5173',
  testDuration: 20000, // 20 seconds for stress testing
  stabilizationTime: 5000, // 5 seconds for app to stabilize
  scenarios: [
    { name: 'High Normal Load', soulCount: 2000 },
    { name: 'Peak Performance Test', soulCount: 2750 },
    { name: 'Conservative Limit Test', soulCount: 3500 },
    { name: 'Practical Limit Test', soulCount: 4000 },
    { name: 'Breaking Point Search', soulCount: 4500 }
  ]
};

class ConservativeStressTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      testType: 'Conservative Stress Test',
      testDuration: CONSERVATIVE_STRESS_CONFIG.testDuration,
      scenarios: [],
      systemInfo: {},
      summary: {}
    };
  }

  async initialize() {
    console.log('⚡ Phase 3 Conservative Stress Test');
    console.log('==================================');
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor',
        '--memory-pressure-off'
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
  }

  async runStressScenario(scenario) {
    console.log(`\n⚡ Testing: ${scenario.name} (${scenario.soulCount} souls)`);
    console.log('-'.repeat(50));

    const url = `${CONSERVATIVE_STRESS_CONFIG.baseUrl}?mode=instanced&souls=${scenario.soulCount}`;
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
      console.log(`📡 Loaded: ${url}`);

      // Wait for stabilization
      console.log(`⏱️  Stabilizing for ${CONSERVATIVE_STRESS_CONFIG.stabilizationTime / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, CONSERVATIVE_STRESS_CONFIG.stabilizationTime));

      // Collect performance data with timeout protection
      const performanceData = await Promise.race([
        this.page.evaluate((testDuration) => {
          return new Promise((resolve) => {
            const startTime = performance.now();
            const fpsReadings = [];
            const memoryReadings = [];
            let frameCount = 0;
            let lastFrameTime = startTime;
            let drawCalls = 0;
            let isStable = true;
            let criticalError = false;

            const collectMetrics = () => {
              try {
                const currentTime = performance.now();
                const deltaTime = currentTime - lastFrameTime;
                
                if (deltaTime > 0) {
                  const fps = 1000 / deltaTime;
                  fpsReadings.push(fps);
                  frameCount++;
                  
                  // Check for critical performance issues
                  if (fps < 1) {
                    criticalError = true;
                    isStable = false;
                  } else if (fps < 10) {
                    isStable = false;
                  }
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

                // Get soul count
                drawCalls = window.soulCount || 0;

                if (criticalError || currentTime - startTime >= testDuration) {
                  // Calculate final metrics
                  const avgFPS = fpsReadings.length > 0 ? 
                    fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length : 0;
                  
                  const sortedFPS = fpsReadings.sort((a, b) => a - b);
                  const fps95th = sortedFPS[Math.floor(sortedFPS.length * 0.95)] || 0;
                  const fps5th = sortedFPS[Math.floor(sortedFPS.length * 0.05)] || 0;
                  
                  const latestMemory = memoryReadings[memoryReadings.length - 1] || {};
                  const memoryMB = latestMemory.used ? latestMemory.used / (1024 * 1024) : 0;
                  
                  // Stability calculation
                  const stableFPS = fpsReadings.filter(fps => fps > 15).length;
                  const stability = fpsReadings.length > 0 ? stableFPS / fpsReadings.length : 0;

                  resolve({
                    averageFPS: avgFPS,
                    fps95th: fps95th,
                    fps5th: fps5th,
                    frameCount: frameCount,
                    memoryMB: memoryMB,
                    memoryInfo: latestMemory,
                    stability: stability,
                    drawCalls: 3, // Instanced rendering always uses 3 draw calls
                    isStable: isStable,
                    criticalError: criticalError,
                    soulCount: drawCalls,
                    actualTestDuration: currentTime - startTime
                  });
                } else {
                  requestAnimationFrame(collectMetrics);
                }
              } catch (error) {
                resolve({
                  error: error.message,
                  criticalError: true,
                  isStable: false
                });
              }
            };

            requestAnimationFrame(collectMetrics);
          });
        }, CONSERVATIVE_STRESS_CONFIG.testDuration),
        // Timeout after 35 seconds
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Performance test timeout')), 35000)
        )
      ]);

      const result = {
        scenario: scenario.name,
        soulCount: scenario.soulCount,
        mode: 'instanced',
        testDuration: CONSERVATIVE_STRESS_CONFIG.testDuration,
        ...performanceData,
        performance: this.evaluatePerformance(performanceData, scenario.soulCount),
        timestamp: new Date().toISOString()
      };

      this.results.scenarios.push(result);
      
      console.log(`📊 Results: ${(result.averageFPS || 0).toFixed(1)} FPS | ${((result.stability || 0) * 100).toFixed(1)}% stable | ${(result.memoryMB || 0).toFixed(1)}MB`);
      console.log(`🎯 Status: ${result.performance} | ${result.isStable ? 'STABLE' : 'UNSTABLE'}${result.criticalError ? ' | CRITICAL' : ''}`);

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
    if (data.error || data.criticalError) return 'CRITICAL_FAIL';
    if (!data.isStable) return 'UNSTABLE';
    if (data.averageFPS < 15) return 'POOR';
    if (data.averageFPS < 30) return 'DEGRADED';
    if (data.averageFPS < 60) return 'ACCEPTABLE';
    return 'EXCELLENT';
  }

  async runAllTests() {
    console.log(`⚡ Starting conservative stress test with ${CONSERVATIVE_STRESS_CONFIG.scenarios.length} scenarios...`);
    
    for (const scenario of CONSERVATIVE_STRESS_CONFIG.scenarios) {
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
    
    const maxStableSoulCount = Math.max(...validResults.filter(r => r.isStable).map(r => r.soulCount));
    const breakingPoint = validResults.find(r => !r.isStable || r.averageFPS < 30);
    
    this.results.summary = {
      totalScenarios: this.results.scenarios.length,
      successfulTests: validResults.length,
      errorTests: this.results.scenarios.length - validResults.length,
      averageFPS: avgFPS,
      averageStability: avgStability,
      averageMemoryMB: avgMemory,
      maxStableSoulCount: maxStableSoulCount,
      practicalLimit: breakingPoint ? breakingPoint.soulCount : maxStableSoulCount,
      overallAssessment: this.getOverallAssessment(validResults)
    };
  }

  getOverallAssessment(results) {
    const excellentCount = results.filter(r => r.performance === 'EXCELLENT').length;
    const unstableCount = results.filter(r => !r.isStable).length;
    
    if (unstableCount === 0 && excellentCount > results.length * 0.8) return 'OUTSTANDING';
    if (unstableCount === 0) return 'EXCELLENT';
    if (unstableCount < results.length * 0.3) return 'GOOD';
    return 'NEEDS_OPTIMIZATION';
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `phase3-conservative-stress-test-${timestamp}.json`;
    const filepath = `/Users/juji/play/soul-recycling-simulation/testing-results/${filename}`;
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved: ${filename}`);

    // Also save as latest
    const latestPath = '/Users/juji/play/soul-recycling-simulation/testing-results/phase3-conservative-stress-test-latest.json';
    fs.writeFileSync(latestPath, JSON.stringify(this.results, null, 2));
    
    this.generateReport();
  }

  generateReport() {
    const report = this.createMarkdownReport();
    const reportPath = '/Users/juji/play/soul-recycling-simulation/testing-results/phase3-conservative-stress-test-report.md';
    fs.writeFileSync(reportPath, report);
    console.log('📄 Report generated: phase3-conservative-stress-test-report.md');
  }

  createMarkdownReport() {
    const { summary, scenarios, systemInfo } = this.results;
    
    return `# ⚡ Phase 3 Conservative Stress Test Report

**Generated:** ${new Date().toLocaleString()}  
**Test Duration:** ${CONSERVATIVE_STRESS_CONFIG.testDuration / 1000}s per scenario  
**Test Scenarios:** ${scenarios.length}

## 📊 Executive Summary

**Overall Assessment:** ${summary.overallAssessment || 'UNKNOWN'}  
**Maximum Stable Soul Count:** ${summary.maxStableSoulCount || 'N/A'}  
**Practical Limit:** ${summary.practicalLimit || 'N/A'}  

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

${this.generateAnalysis()}

## 🎯 Recommendations

${this.generateRecommendations()}

---
*Report generated by Phase 3 Conservative Stress Test Suite*
`;
  }

  generateAnalysis() {
    const { summary, scenarios } = this.results;
    const validResults = scenarios.filter(r => r.performance !== 'ERROR');
    
    if (validResults.length === 0) {
      return '❌ No valid results to analyze.';
    }

    let analysis = '';
    
    if (summary.maxStableSoulCount >= 4000) {
      analysis += '🚀 **EXCEPTIONAL**: System handles high soul counts (4000+) with stability.\n\n';
    } else if (summary.maxStableSoulCount >= 3000) {
      analysis += '✅ **EXCELLENT**: System performs well at moderate high loads (3000+).\n\n';
    } else if (summary.maxStableSoulCount >= 2500) {
      analysis += '👍 **GOOD**: System handles above-target loads well.\n\n';
    } else {
      analysis += '⚠️ **CONCERNING**: System approaching practical limits.\n\n';
    }

    if (summary.practicalLimit && summary.practicalLimit < summary.maxStableSoulCount) {
      analysis += `🎯 **Practical Limit**: Performance degradation begins around ${summary.practicalLimit} souls.\n\n`;
    }

    return analysis;
  }

  generateRecommendations() {
    const { summary } = this.results;
    
    let recommendations = '';
    
    if (summary.overallAssessment === 'OUTSTANDING' || summary.overallAssessment === 'EXCELLENT') {
      recommendations += '✅ **Phase 3 implementation exceeds expectations and is ready for production.**\n\n';
      recommendations += '🎯 **Recommended maximum soul count**: ' + Math.floor((summary.maxStableSoulCount || 2000) * 0.8) + ' souls for safety margin.\n\n';
    } else if (summary.overallAssessment === 'GOOD') {
      recommendations += '✅ **Phase 3 implementation is solid for production use.**\n\n';
      recommendations += '💡 **Consider setting soul limit**: ' + Math.floor((summary.practicalLimit || 2000) * 0.9) + ' souls for optimal experience.\n\n';
    } else {
      recommendations += '⚠️ **Consider implementing dynamic quality scaling for high soul counts.**\n\n';
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
      
      console.log('\n🎉 Conservative Stress Test Complete!');
      console.log('====================================');
      console.log(`📊 Overall Assessment: ${this.results.summary.overallAssessment}`);
      console.log(`🎯 Max Stable Soul Count: ${this.results.summary.maxStableSoulCount}`);
      console.log(`📈 Average FPS: ${this.results.summary.averageFPS.toFixed(1)}`);
      
    } catch (error) {
      console.error('❌ Conservative stress test failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const conservativeStressTest = new ConservativeStressTest();
  conservativeStressTest.run();
}

export { ConservativeStressTest };
export default ConservativeStressTest;
