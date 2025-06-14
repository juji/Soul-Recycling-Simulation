import * as THREE from 'three';

export class InstancedSoulRenderer {
    constructor(scene, maxSouls = 5000) {
        this.scene = scene;
        this.maxSouls = maxSouls;
        this.soulCounts = { human: 0, gpt: 0, dewa: 0 };
        this.instancedMeshes = {};
        
        // Pre-allocate objects to reduce garbage collection
        this.tempMatrix = new THREE.Matrix4();
        this.tempColor = new THREE.Color();
        
        this.initializeInstancedMeshes();
    }
    
    initializeInstancedMeshes() {
        // Human souls - spheres (reduced poly count for performance)
        this.instancedMeshes.human = new THREE.InstancedMesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshBasicMaterial({ 
                transparent: true
                // Note: vertexColors should NOT be used with instanceColor
            }),
            this.maxSouls
        );
        
        // GPT souls - cubes  
        this.instancedMeshes.gpt = new THREE.InstancedMesh(
            new THREE.BoxGeometry(0.2, 0.2, 0.2),
            new THREE.MeshBasicMaterial({ 
                transparent: true
            }),
            this.maxSouls
        );
        
        // Dewa souls - larger spheres (slightly reduced poly count)
        this.instancedMeshes.dewa = new THREE.InstancedMesh(
            new THREE.SphereGeometry(0.333, 12, 12),
            new THREE.MeshBasicMaterial({ 
                transparent: true
            }),
            this.maxSouls
        );
        
        // Add all instanced meshes to scene and start with no visible instances
        Object.values(this.instancedMeshes).forEach(mesh => {
            mesh.count = 0;
            // Initialize instanceColor attribute for each mesh
            mesh.instanceColor = new THREE.InstancedBufferAttribute(
                new Float32Array(this.maxSouls * 3), 3
            );
            this.scene.add(mesh);
        });
    }
    
    updateInstances(souls) {
        // Group souls by type for efficient processing
        const soulsByType = { human: [], gpt: [], dewa: [] };
        
        souls.forEach(soul => {
            const type = this.getSoulType(soul);
            soulsByType[type].push(soul);
        });
        
        // Update each soul type's instanced mesh
        Object.entries(soulsByType).forEach(([type, typeSouls]) => {
            this.updateInstancedMesh(type, typeSouls);
        });
    }
     updateInstancedMesh(type, souls) {
        const instancedMesh = this.instancedMeshes[type];
        const matrix = this.tempMatrix;
        const color = this.tempColor;
        
        if (souls.length === 0) {
            instancedMesh.count = 0;
            return;
        }
        
        // Safety check: prevent buffer overflow
        const soulCount = Math.min(souls.length, this.maxSouls);

        souls.slice(0, soulCount).forEach((soul, index) => {
            // Set transformation matrix (position only for now)
            matrix.setPosition(soul.position.x, soul.position.y, soul.position.z);
            instancedMesh.setMatrixAt(index, matrix);
            
            // Set per-instance color with better fallbacks
            if (soul.userData && soul.userData.finalRGB) {
                color.setRGB(
                    soul.userData.finalRGB[0], 
                    soul.userData.finalRGB[1], 
                    soul.userData.finalRGB[2]
                );
            } else if (soul.userData && soul.userData.baseHSL) {
                color.setHSL(
                    soul.userData.baseHSL.h, 
                    soul.userData.baseHSL.s, 
                    soul.userData.baseHSL.l
                );
            } else {
                // Fallback to white if no color data
                color.setRGB(1, 1, 1);
            }
            instancedMesh.setColorAt(index, color);
        });
        
        // Update instance count and mark for GPU update
        instancedMesh.count = soulCount;
        instancedMesh.instanceMatrix.needsUpdate = true;
        
        // Safety check for instanceColor attribute
        if (instancedMesh.instanceColor) {
            instancedMesh.instanceColor.needsUpdate = true;
        }
        
        // Update soul count for this type
        this.soulCounts[type] = soulCount;
    }
    
    getSoulType(soul) {
        if (soul.userData?.isDewa) return 'dewa';
        if (soul.userData?.isHuman) return 'human';
        return 'gpt';
    }
    
    dispose() {
        Object.values(this.instancedMeshes).forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
    }
}
