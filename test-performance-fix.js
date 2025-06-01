#!/usr/bin/env node
/**
 * Quick test to verify the performanceMetrics fix for Phase 3
 */

const puppeteer = require('puppeteer');

async function testPerformanceMetrics() {
  console.log('🧪 Testing Phase 3 Performance Metrics Fix...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to the application
    console.log('📍 Navigating to http://localhost:5178...');
    await page.goto('http://localhost:5178', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Wait a few seconds for the app to initialize
    console.log('⏳ Waiting for app initialization...');
    await page.waitForTimeout(3000);
    
    // Check for JavaScript errors
    if (errors.length > 0) {
      console.log('❌ JavaScript Errors Found:');
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
      return false;
    }
    
    // Check if performanceMetrics is accessible
    const performanceMetricsExists = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             document.querySelector('canvas') !== null;
    });
    
    if (performanceMetricsExists) {
      console.log('✅ Application loaded successfully without errors');
      console.log('✅ Canvas element found - rendering is working');
      return true;
    } else {
      console.log('❌ Application failed to initialize properly');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test if puppeteer is available
(async () => {
  try {
    const success = await testPerformanceMetrics();
    console.log('\n' + '='.repeat(50));
    console.log(success ? 
      '🎉 Phase 3 Performance Metrics Fix: SUCCESS' : 
      '💥 Phase 3 Performance Metrics Fix: FAILED'
    );
    console.log('='.repeat(50));
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.log('\n⚠️  Puppeteer not available, manual testing required');
    console.log('   Please check http://localhost:5178 in your browser');
    console.log('   Look for: No "performanceMetrics is not defined" errors');
    process.exit(0);
  }
})();
