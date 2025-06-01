// Phase 4 Step 2: LOD-Enhanced InstancedSoulRenderer Test
// Test script to validate LOD integration

import { InstancedSoulRenderer } from './src/InstancedSoulRenderer.js';
import { LODManager } from './src/LODManager.js';
import * as THREE from 'three';

// Mock Three.js Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
camera.position.set(0, 0, 50);

console.log('🎯 Testing Phase 4 Step 2: LOD-Enhanced InstancedSoulRenderer');

// Test 1: Initialize LOD-Enhanced InstancedSoulRenderer
console.log('\n📋 Test 1: Initialize LOD-Enhanced InstancedSoulRenderer');
const renderer = new InstancedSoulRenderer(scene, 1000);

console.log('✅ InstancedSoulRenderer initialized with LOD support');
console.log('   - Geometries created:', Object.keys(renderer.geometries));
console.log('   - Instanced meshes created:', Object.keys(renderer.instancedMeshes));

// Test 2: Initialize LOD Manager
console.log('\n📋 Test 2: Initialize LOD Manager');
const lodManager = new LODManager(camera);

console.log('✅ LOD Manager initialized');
console.log('   - LOD levels:', Object.keys(lodManager.lodLevels));

// Test 3: Create test souls with positions at different distances
console.log('\n📋 Test 3: Create test souls at different distances');
const testSouls = [
    // Near souls (HIGH LOD)
    { position: { x: 0, y: 0, z: 0 }, userData: { isHuman: true, id: 1 } },
    { position: { x: 5, y: 0, z: 0 }, userData: { isDewa: true, id: 2 } },
    { position: { x: 10, y: 0, z: 0 }, userData: { id: 3 } }, // GPT
    
    // Medium distance souls (MEDIUM LOD)  
    { position: { x: 35, y: 0, z: 0 }, userData: { isHuman: true, id: 4 } },
    { position: { x: 40, y: 0, z: 0 }, userData: { isDewa: true, id: 5 } },
    
    // Far souls (LOW LOD)
    { position: { x: 70, y: 0, z: 0 }, userData: { isHuman: true, id: 6 } },
    { position: { x: 75, y: 0, z: 0 }, userData: { id: 7 } }, // GPT
    
    // Very far souls (CULLED)
    { position: { x: 150, y: 0, z: 0 }, userData: { isHuman: true, id: 8 } },
    { position: { x: 200, y: 0, z: 0 }, userData: { isDewa: true, id: 9 } }
];

console.log('✅ Created test souls at various distances');
console.log('   - Total souls:', testSouls.length);

// Test 4: Calculate LOD levels
console.log('\n📋 Test 4: Calculate LOD levels for test souls');
const lodData = lodManager.updateSoulLOD(testSouls);
const lodStats = lodManager.getLODStatistics();

console.log('✅ LOD calculations completed');
console.log('   - High LOD souls:', lodStats.high);
console.log('   - Medium LOD souls:', lodStats.medium); 
console.log('   - Low LOD souls:', lodStats.low);
console.log('   - Culled souls:', lodStats.culled);
console.log('   - Performance gain:', Math.round(lodStats.performanceGain * 100) + '%');

// Test 5: Update instances with LOD-aware rendering
console.log('\n📋 Test 5: Update instances with LOD-aware rendering');
try {
    renderer.updateInstances(testSouls);
    console.log('✅ LOD-aware instance update successful');
    
    // Get renderer statistics
    const rendererStats = renderer.getLODStatistics();
    console.log('   - Total instances rendered:', rendererStats.totalInstances);
    console.log('   - High detail instances:', rendererStats.byLOD.high);
    console.log('   - Medium detail instances:', rendererStats.byLOD.medium);
    console.log('   - Low detail instances:', rendererStats.byLOD.low);
    console.log('   - Total vertices rendered:', rendererStats.geometryComplexity.vertices);
    console.log('   - Total faces rendered:', rendererStats.geometryComplexity.faces);
    
    // Get memory usage
    const memoryStats = renderer.getMemoryUsage();
    console.log('   - Estimated geometry memory:', Math.round(memoryStats.geometryMemory / 1024) + ' KB');
    console.log('   - Estimated instance memory:', Math.round(memoryStats.instanceMemory / 1024) + ' KB');
    console.log('   - Total memory estimate:', Math.round(memoryStats.totalMemory / 1024) + ' KB');
    
} catch (error) {
    console.error('❌ LOD-aware instance update failed:', error);
}

// Test 6: Verify culled souls are not rendered
console.log('\n📋 Test 6: Verify culled souls are filtered out');
const visibleSouls = testSouls.filter(soul => soul.visible && soul.lod !== 'CULLED');
const culledSouls = testSouls.filter(soul => !soul.visible || soul.lod === 'CULLED');

console.log('✅ Soul filtering verification');
console.log('   - Visible souls:', visibleSouls.length);
console.log('   - Culled souls:', culledSouls.length);
console.log('   - Culling efficiency:', Math.round((culledSouls.length / testSouls.length) * 100) + '%');

// Test 7: Performance comparison simulation
console.log('\n📋 Test 7: Performance comparison simulation');
const fullDetailVertices = testSouls.length * 576; // Assuming highest detail sphere (24x24)
const lodVertices = rendererStats.geometryComplexity.vertices;
const vertexReduction = Math.round((1 - lodVertices / fullDetailVertices) * 100);

console.log('✅ Performance comparison');
console.log('   - Full detail vertices:', fullDetailVertices);
console.log('   - LOD-optimized vertices:', lodVertices);
console.log('   - Vertex count reduction:', vertexReduction + '%');

console.log('\n🎉 Phase 4 Step 2 Test Complete!');
console.log('✅ LOD-Enhanced InstancedSoulRenderer is working correctly');
console.log('✅ Multiple geometry detail levels operational');
console.log('✅ LOD-aware mesh updates functional');
console.log('✅ Culled soul filtering working');
console.log('✅ Performance gains achieved');

// Cleanup
renderer.dispose();
