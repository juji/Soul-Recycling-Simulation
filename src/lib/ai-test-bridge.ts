// Real-time AI Performance Testing Bridge
// This script can be injected into the simulation for real-time testing

// Export to make this an external module
export {};

// TypeScript interfaces
interface AITestMessage {
  type: 'AI_PERFORMANCE_TEST';
  command: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any; // Dynamic command parameters that can be various types
}

interface StressTestParams {
  type: string;
  duration?: number;
}

interface StressTestResult {
  timestamp: number;
  fps: number;
  quality: string;
  memoryPressure: number;
  performanceScore: number;
}

interface StressTestSummary {
  status: string;
  avgFPS?: number;
  minFPS?: number;
  maxFPS?: number;
  fpsStability?: number;
  qualityChanges?: number;
  performanceScore?: number;
}

// Note: Window interface extensions are defined in src/types/index.ts

class AIPerformanceTestBridge {
  private isActive: boolean = false;
  private testCallbacks: Map<string, Function> = new Map();
  private monitoringInterval?: number;

  constructor() {
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event: MessageEvent<AITestMessage>) => {
      if (event.data.type === 'AI_PERFORMANCE_TEST') {
        this.handleTestCommand(event.data);
      }
    });
  }

  private handleTestCommand(data: AITestMessage): void {
    const { command, params } = data;

    switch (command) {
      case 'GET_PERFORMANCE_DATA':
        this.sendPerformanceData();
        break;
      case 'FORCE_QUALITY':
        this.forceQuality(params.quality);
        break;
      case 'SET_SOUL_COUNT':
        this.setSoulCount(params.count);
        break;
      case 'ENABLE_DEBUG':
        this.enableDebugMode();
        break;
      case 'GET_AI_INSIGHTS':
        this.sendAIInsights();
        break;
      case 'STRESS_TEST':
        this.runStressTest(params);
        break;
      default:
      // Unknown command
    }
  }

  private sendPerformanceData(): void {
    // This would need to access the actual simulation variables
    const performanceData = {
      type: 'PERFORMANCE_DATA_RESPONSE',
      data: {
        fps: window.currentFPS || 60,
        avgFPS: window.averageFPS || 60,
        currentQuality: window.currentQuality || 'medium',
        soulCount: window.soulCount || 888,
        memoryUsage: window.memoryUsage || 256,
        hardwareProfile: window.hardwareProfile || {},
        timestamp: Date.now(),
      },
    };

    window.parent.postMessage(performanceData, '*');
  }

  private sendAIInsights(): void {
    // Access the performance manager if available
    if (window.performanceManager) {
      const insights = window.performanceManager.getModelInsights?.() || null;
      const report = window.performanceManager.getPerformanceReport();

      window.parent.postMessage(
        {
          type: 'AI_INSIGHTS_RESPONSE',
          data: {
            insights: insights,
            report: report,
            timestamp: Date.now(),
          },
        },
        '*'
      );
    }
  }

  private forceQuality(quality: string): void {
    if (window.performanceManager) {
      const settings = window.performanceManager.forceQuality(quality);

      window.parent.postMessage(
        {
          type: 'QUALITY_CHANGED',
          data: { quality: quality, settings: settings },
        },
        '*'
      );
    }
  }

  private setSoulCount(count: number): void {
    // This would need to trigger a URL change or direct soul creation
    const newUrl = `${window.location.origin}${window.location.pathname}?val=${count}`;
    window.location.href = newUrl;
  }

  private enableDebugMode(): void {
    if (window.performanceManager) {
      window.performanceManager.enableDebugMode();
    }
  }

  private async runStressTest(params: StressTestParams): Promise<void> {
    const { type, duration = 10000 } = params;

    const startTime = Date.now();
    const results: StressTestResult[] = [];

    const monitor = setInterval(() => {
      if (window.performanceManager) {
        const report = window.performanceManager.getPerformanceReport();
        results.push({
          timestamp: Date.now() - startTime,
          fps: report.metrics.avgFPS,
          quality: report.currentQuality,
          memoryPressure: report.metrics.memoryPressure,
          performanceScore: report.metrics.performanceScore,
        });
      }

      if (Date.now() - startTime >= duration) {
        clearInterval(monitor);

        window.parent.postMessage(
          {
            type: 'STRESS_TEST_COMPLETE',
            data: {
              type: type,
              duration: duration,
              results: results,
              summary: this.analyzeStressTestResults(results),
            },
          },
          '*'
        );
      }
    }, 500);
  }

  private analyzeStressTestResults(results: StressTestResult[]): StressTestSummary {
    if (results.length === 0) {
      return { status: 'no_data' };
    }

    const avgFPS = results.reduce((sum, r) => sum + r.fps, 0) / results.length;
    const minFPS = Math.min(...results.map(r => r.fps));
    const maxFPS = Math.max(...results.map(r => r.fps));
    const qualityChanges = new Set(results.map(r => r.quality)).size;

    return {
      status: 'complete',
      avgFPS: Math.round(avgFPS),
      minFPS: minFPS,
      maxFPS: maxFPS,
      fpsStability: Math.round((1 - (maxFPS - minFPS) / avgFPS) * 100),
      qualityChanges: qualityChanges - 1, // -1 because initial quality counts as a change
      performanceScore: results[results.length - 1]?.performanceScore || 0,
    };
  }

  public startPerformanceMonitoring(): void {
    this.isActive = true;
    this.monitoringInterval = window.setInterval(() => {
      this.sendPerformanceData();
    }, 1000);
  }

  public stopPerformanceMonitoring(): void {
    this.isActive = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

// Initialize the bridge if we're in an iframe
if (window.parent !== window) {
  window.aiTestBridge = new AIPerformanceTestBridge();

  // Make performance manager and other variables globally accessible for testing
  window.addEventListener('DOMContentLoaded', () => {
    // These will be set by the main application
    window.currentFPS = 0;
    window.averageFPS = 0;
    window.currentQuality = 'medium';
    window.soulCount = 888;
    window.memoryUsage = 0;
    window.hardwareProfile = {};
    window.performanceManager = undefined;
  });
}
