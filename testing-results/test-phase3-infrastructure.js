#!/usr/bin/env node

/**
 * Phase 3 Benchmark Test - Quick Validation
 * Tests the benchmark infrastructure without running the full suite
 */

import puppeteer from 'puppeteer';

class Phase3BenchmarkTest {
    async runQuickTest() {
        console.log('🔬 Phase 3 Benchmark Infrastructure Test');
        console.log('=' .repeat(50));
        
        const browser = await puppeteer.launch({ 
            headless: false,
            args: ['--enable-webgl', '--enable-gpu-rasterization']
        });
        
        try {
            console.log('📡 Testing connection to localhost:5173...');
            
            const page = await browser.newPage();
            await page.setViewport({ width: 1200, height: 800 });
            
            // Test basic connectivity
            await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
            console.log('✅ Successfully connected to development server');
            
            // Wait longer for application to fully initialize
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Test basic functionality
            await page.evaluate(() => {
                window.testResults = {
                    webgl: !!document.createElement('canvas').getContext('webgl'),
                    threeJs: typeof THREE !== 'undefined',
                    soulCount: window.souls ? window.souls.length : 0,
                    timestamp: Date.now()
                };
            });
            
            const results = await page.evaluate(() => window.testResults);
            console.log('📊 Basic functionality test:', results);
            
            // Test with soul count parameter (using 'val' not 'souls')
            console.log('🔍 Testing with 100 souls...');
            await page.goto('http://localhost:5173/?val=100', { waitUntil: 'networkidle0' });
            
            // Wait longer for initialization
            await new Promise(resolve => setTimeout(resolve, 8000));
            
            const soulTest = await page.evaluate(() => {
                return {
                    soulCount: window.souls ? window.souls.length : 0,
                    hasFPS: typeof window.currentFPS !== 'undefined',
                    hasInstancedRenderer: typeof window.instancedRenderer !== 'undefined'
                };
            });
            
            console.log('🎯 Soul system test:', soulTest);
            
            // Test rendering mode switching
            console.log('🔄 Testing rendering mode detection...');
            const modeTest = await page.evaluate(() => {
                // Try to detect current rendering mode
                return {
                    hasFeatureFlags: typeof window.FEATURE_FLAGS !== 'undefined',
                    currentMode: typeof window.renderingMode !== 'undefined' ? window.renderingMode : 'unknown',
                    instancedEnabled: window.FEATURE_FLAGS ? window.FEATURE_FLAGS.USE_INSTANCED_RENDERING : false
                };
            });
            
            console.log('⚙️ Rendering mode test:', modeTest);
            
            console.log('\n✅ Infrastructure Test Results:');
            console.log('  📡 Server Connection: ✅ Working');
            console.log(`  🌐 WebGL Support: ${results.webgl ? '✅' : '❌'}`);
            console.log(`  📦 Three.js Loading: ${results.threeJs ? '✅' : '❌'}`);
            console.log(`  👻 Soul System: ${soulTest.soulCount > 0 ? '✅' : '❌'} (${soulTest.soulCount} souls)`);
            console.log(`  📊 FPS Monitoring: ${soulTest.hasFPS ? '✅' : '❌'}`);
            console.log(`  🚀 Instanced Renderer: ${soulTest.hasInstancedRenderer ? '✅' : '❌'}`);
            
            if (results.webgl && results.threeJs && soulTest.soulCount > 0) {
                console.log('\n🎉 All systems ready for Phase 3 benchmark!');
                console.log('Run the full benchmark with:');
                console.log('  ./testing-results/run-phase3-benchmark.sh');
                return true;
            } else {
                console.log('\n⚠️ Some systems need attention before running benchmark');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Infrastructure test failed:', error.message);
            return false;
        } finally {
            await browser.close();
        }
    }
}

// Run test if called directly
const test = new Phase3BenchmarkTest();
test.runQuickTest()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
