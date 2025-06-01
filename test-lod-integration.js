// Phase 4: LOD Manager Integration Test
// Quick verification that Step 1 is properly implemented

console.log('🧪 Testing LOD Manager Integration...');

// Test 1: Check if LOD Manager imports correctly
try {
  const { LODManager } = await import('./src/LODManager.js');
  console.log('✅ LOD Manager import successful');
} catch (error) {
  console.error('❌ LOD Manager import failed:', error);
}

// Test 2: Check if Adaptive Performance Manager imports correctly
try {
  const { AdaptivePerformanceManager } = await import('./src/adaptive-performance.js');
  console.log('✅ Adaptive Performance Manager import successful');
} catch (error) {
  console.error('❌ Adaptive Performance Manager import failed:', error);
}

// Test 3: Mock camera and test LOD Manager instantiation
try {
  const { LODManager } = await import('./src/LODManager.js');
  const { AdaptivePerformanceManager } = await import('./src/adaptive-performance.js');
  
  // Mock Three.js camera
  const mockCamera = {
    position: { x: 0, y: 30, z: 60 }
  };
  
  const performanceManager = new AdaptivePerformanceManager();
  const lodManager = new LODManager(mockCamera, performanceManager);
  
  console.log('✅ LOD Manager instantiation successful');
  console.log('📊 Initial LOD levels:', lodManager.lodLevels);
  console.log('🎯 Current quality:', performanceManager.getCurrentQuality());
  
} catch (error) {
  console.error('❌ LOD Manager instantiation failed:', error);
}

console.log('🧪 LOD Integration test complete!');
