// Soul Recycling Simulation - Web Worker
// Handles physics simulation, color calculations, and connection rendering
// Optimized for performance with spatial partitioning and delta compression

// Worker state
let souls = [];
let pulseTime = 0;
let frameCount = 0; // For LOD physics update rate calculations

// Worker constants - configured from main thread
const WORKER_SETTINGS = {
    // Pulse and animation
    PULSE_INCREMENT: 0.02,
    PULSE_MULTIPLIER: 2,
    FLICKER_MULTIPLIER: 3,
    
    // Color change detection thresholds
    HSL_PRECISION: 0.01,  // 1% threshold for color changes
    OPACITY_PRECISION: 0.01,  // 1% threshold for opacity changes
    
    // Visual effects
    LIGHTNESS_PULSE_AMPLITUDE: 0.2,
    OPACITY_BASE: 0.5,
    OPACITY_RANGE: 0.5,
    
    // Movement perturbation
    REGULAR_SOUL_PERTURBATION: 0.2,
    DEWA_PERTURBATION: 0.01,
    DISTANCE_EPSILON: 0.0001,  // Small value to prevent division by zero
    
    // Connection calculation defaults
    DEFAULT_INTERACTION_DISTANCE: 6,
    DEFAULT_MAX_CONNECTIONS: 1000,
    DEFAULT_MAX_SOULS_TO_CHECK: 150,
    
    // Spatial grid
    SPATIAL_GRID_CELL_SIZE: 8.0,  // Cell size slightly larger than max interaction radius
    
    // Precision for data transmission
    POSITION_PRECISION: 100,  // Round to 2 decimal places
    RGB_PRECISION: 255,       // RGB color precision
    OPACITY_PRECISION_OUT: 255 // Opacity precision for output
};

// Physics constants (initialized from main thread)
let POINTER_INTERACTION_RADIUS, POINTER_INFLUENCE_STRENGTH;
let NEIGHBOR_SPEED_INFLUENCE_RADIUS, NEIGHBOR_SPEED_INFLUENCE_STRENGTH;
let SEPARATION_DISTANCE, SEPARATION_STRENGTH;
let DEWA_ATTRACTION_RADIUS, DEWA_ATTRACTION_STRENGTH;
let DEWA_ENHANCEMENT_RADIUS, ENHANCEMENT_SATURATION_BOOST, ENHANCEMENT_LIGHTNESS_BOOST;

// Pre-calculated squared distances for performance
let NEIGHBOR_SPEED_INFLUENCE_RADIUS_SQ, SEPARATION_DISTANCE_SQ, DEWA_ATTRACTION_RADIUS_SQ, DEWA_ENHANCEMENT_RADIUS_SQ, POINTER_INTERACTION_RADIUS_SQ;

// HSL to RGB conversion function to avoid main thread conversion overhead
function hslToRgb(h, s, l) {
    // Normalize inputs to valid ranges
    h = h % 1; // Ensure hue is in [0, 1] range
    if (h < 0) h += 1; // Handle negative hue values
    s = Math.max(0, Math.min(1, s)); // Clamp saturation to [0, 1]
    l = Math.max(0, Math.min(1, l)); // Clamp lightness to [0, 1]
    
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    // Ensure RGB values are in valid range [0, 1]
    return [
        Math.max(0, Math.min(1, r)),
        Math.max(0, Math.min(1, g)),
        Math.max(0, Math.min(1, b))
    ];
}

// Spatial partitioning system
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    clear() {
        this.grid.clear();
    }
    
    getKey(x, y, z) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        const cz = Math.floor(z / this.cellSize);
        return `${cx},${cy},${cz}`;
    }
    
    insert(soul) {
        const key = this.getKey(soul.position.x, soul.position.y, soul.position.z);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(soul);
    }
    
    getNearby(position, radius) {
        const nearby = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerX = Math.floor(position.x / this.cellSize);
        const centerY = Math.floor(position.y / this.cellSize);
        const centerZ = Math.floor(position.z / this.cellSize);
        
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                for (let dz = -cellRadius; dz <= cellRadius; dz++) {
                    const key = `${centerX + dx},${centerY + dy},${centerZ + dz}`;
                    const cells = this.grid.get(key);
                    if (cells) nearby.push(...cells);
                }
            }
        }
        return nearby;
    }
}

const spatialGrid = new SpatialGrid(WORKER_SETTINGS.SPATIAL_GRID_CELL_SIZE);

// Minimal THREE.Vector3-like operations for plain objects
const vec = {
    create: (x = 0, y = 0, z = 0) => ({ x, y, z }),
    copy: (v) => ({ ...v }),
    set: (target, x, y, z) => { target.x = x; target.y = y; target.z = z; return target; },
    add: (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z }),
    subVectors: (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z }),
    multiplyScalar: (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s }),
    lengthSq: (v) => v.x * v.x + v.y * v.y + v.z * v.z,
    length: (v) => Math.sqrt(vec.lengthSq(v)),
    normalize: (v) => {
        const l = vec.length(v);
        return l > 0 ? vec.multiplyScalar(v, 1 / l) : vec.create();
    },
    distanceTo: (v1, v2) => vec.length(vec.subVectors(v1, v2)),
    lerp: (v1, v2, alpha) => ({
        x: v1.x + (v2.x - v1.x) * alpha,
        y: v1.y + (v2.y - v1.y) * alpha,
        z: v1.z + (v2.z - v1.z) * alpha
    })
};

const mathUtils = {
    lerp: (a, b, t) => a + (b - a) * t
};

// LOD Physics Helper Functions
function shouldUpdatePhysicsForSoul(soul, lodData, frameCount) {
    const lodInfo = lodData[soul.id];
    if (!lodInfo) return true; // Default to full physics if no LOD data
    
    // Skip physics for culled souls entirely
    if (lodInfo.lod === 'CULLED') return false;
    
    // For other LOD levels, use physics update rate
    const updateRate = lodInfo.physicsUpdateRate;
    if (updateRate >= 1.0) return true; // HIGH LOD - always update
    if (updateRate <= 0) return false; // Should not happen, but safety check
    
    // Use frame count to distribute physics updates across frames
    const interval = Math.round(1 / updateRate);
    return (frameCount % interval) === 0;
}

self.onmessage = function(e) {
    const { type, data } = e.data;

    if (type === 'init') {
        souls = data.souls.map(s => ({
            ...s,
            position: vec.create(s.position.x, s.position.y, s.position.z),
            velocity: vec.create(s.velocity.x, s.velocity.y, s.velocity.z),
            chosenDewaId: null // Initialize chosenDewaId
        }));
        POINTER_INTERACTION_RADIUS = data.constants.POINTER_INTERACTION_RADIUS;
        POINTER_INFLUENCE_STRENGTH = data.constants.POINTER_INFLUENCE_STRENGTH;
        NEIGHBOR_SPEED_INFLUENCE_RADIUS = data.constants.NEIGHBOR_SPEED_INFLUENCE_RADIUS;
        NEIGHBOR_SPEED_INFLUENCE_STRENGTH = data.constants.NEIGHBOR_SPEED_INFLUENCE_STRENGTH;
        SEPARATION_DISTANCE = data.constants.SEPARATION_DISTANCE;
        SEPARATION_STRENGTH = data.constants.SEPARATION_STRENGTH;
        DEWA_ATTRACTION_RADIUS = data.constants.DEWA_ATTRACTION_RADIUS; // Store dewa constant
        DEWA_ATTRACTION_STRENGTH = data.constants.DEWA_ATTRACTION_STRENGTH; // Store dewa constant
        DEWA_ENHANCEMENT_RADIUS = data.constants.DEWA_ENHANCEMENT_RADIUS; // Added
        ENHANCEMENT_SATURATION_BOOST = data.constants.ENHANCEMENT_SATURATION_BOOST; // Added
        ENHANCEMENT_LIGHTNESS_BOOST = data.constants.ENHANCEMENT_LIGHTNESS_BOOST; // Added
        
        // Pre-calculate squared distances for performance
        NEIGHBOR_SPEED_INFLUENCE_RADIUS_SQ = NEIGHBOR_SPEED_INFLUENCE_RADIUS * NEIGHBOR_SPEED_INFLUENCE_RADIUS;
        SEPARATION_DISTANCE_SQ = SEPARATION_DISTANCE * SEPARATION_DISTANCE;
        DEWA_ATTRACTION_RADIUS_SQ = DEWA_ATTRACTION_RADIUS * DEWA_ATTRACTION_RADIUS;
        DEWA_ENHANCEMENT_RADIUS_SQ = DEWA_ENHANCEMENT_RADIUS * DEWA_ENHANCEMENT_RADIUS;
        POINTER_INTERACTION_RADIUS_SQ = POINTER_INTERACTION_RADIUS * POINTER_INTERACTION_RADIUS;
    } else if (type === 'update') {
        const pointerPosition3D = data.pointerPosition3D ? vec.create(data.pointerPosition3D.x, data.pointerPosition3D.y, data.pointerPosition3D.z) : null;
        const lodData = data.lodData || {}; // LOD data from main thread
        
        frameCount++; // Increment frame counter for LOD physics rate calculations
        pulseTime += WORKER_SETTINGS.PULSE_INCREMENT;
        const pulse = (Math.sin(pulseTime * WORKER_SETTINGS.PULSE_MULTIPLIER) + 1) / 2;

        // Clear and rebuild spatial grid for this frame
        spatialGrid.clear();
        souls.forEach(soul => spatialGrid.insert(soul));

        const dewaSouls = souls.filter(s => s.isDewa);

        const soulsToRemove = [];
        souls.forEach(soul => {
            // Check if physics should update for this soul based on LOD
            const shouldUpdatePhysics = shouldUpdatePhysicsForSoul(soul, lodData, frameCount);
            
            // Skip physics calculations for culled souls or souls that shouldn't update this frame
            if (!shouldUpdatePhysics) {
                // Still decrement life and check for removal
                soul.life--;
                if (soul.life <= 0) {
                    soulsToRemove.push(soul.id);
                    self.postMessage({ type: 'soulRemoved', data: { soulId: soul.id } });
                }
                return; // Skip physics for this soul this frame
            }
            
            // === Speed influence from neighbors using spatial partitioning ===
            if (!soul.isDewa) { // Dewas are not affected by neighbor speed influence
                let influencedSpeed = soul.speed;
                const nearbyNeighbors = spatialGrid.getNearby(soul.position, NEIGHBOR_SPEED_INFLUENCE_RADIUS);
                
                for (const otherSoul of nearbyNeighbors) {
                    if (soul.id === otherSoul.id || otherSoul.isDewa) continue;
                    
                    const distanceToNeighborSq = vec.lengthSq(vec.subVectors(soul.position, otherSoul.position));
                    if (distanceToNeighborSq < NEIGHBOR_SPEED_INFLUENCE_RADIUS_SQ) {
                        influencedSpeed = mathUtils.lerp(
                            influencedSpeed,
                            otherSoul.speed,
                            NEIGHBOR_SPEED_INFLUENCE_STRENGTH
                        );
                    }
                }
                soul.speed = influencedSpeed;
            }

            // === Separation from neighbors using spatial partitioning ===
            const separationForce = vec.create();
            const nearbySeparationSouls = spatialGrid.getNearby(soul.position, SEPARATION_DISTANCE);
            
            for (const otherSoul of nearbySeparationSouls) {
                if (soul.id === otherSoul.id) continue;
                
                const distanceToNeighborSq = vec.lengthSq(vec.subVectors(soul.position, otherSoul.position));
                if (distanceToNeighborSq > 0 && distanceToNeighborSq < SEPARATION_DISTANCE_SQ) {
                    const distanceToNeighbor = Math.sqrt(distanceToNeighborSq); // Only calculate sqrt when needed
                    let awayVector = vec.subVectors(soul.position, otherSoul.position);
                    awayVector = vec.normalize(awayVector);
                    awayVector = vec.multiplyScalar(awayVector, 1 / (distanceToNeighbor + WORKER_SETTINGS.DISTANCE_EPSILON));
                    separationForce.x += awayVector.x;
                    separationForce.y += awayVector.y;
                    separationForce.z += awayVector.z;
                }
            }
            if (vec.lengthSq(separationForce) > 0) {
                const scaledSeparationForce = vec.multiplyScalar(separationForce, SEPARATION_STRENGTH);
                soul.velocity = vec.add(soul.velocity, scaledSeparationForce);
            }

            // === Dewa Attraction (optimized) ===
            if (!soul.isDewa) {
                let targetDewa = null;
                if (soul.chosenDewaId !== null) {
                    const currentlyChosenDewa = dewaSouls.find(g => g.id === soul.chosenDewaId);
                    if (currentlyChosenDewa) {
                        const distanceToChosenDewaSq = vec.lengthSq(vec.subVectors(soul.position, currentlyChosenDewa.position));
                        if (distanceToChosenDewaSq < DEWA_ATTRACTION_RADIUS_SQ) {
                            targetDewa = currentlyChosenDewa;
                        } else {
                            soul.chosenDewaId = null; 
                        }
                    } else {
                        soul.chosenDewaId = null; 
                    }
                }
                if (targetDewa === null) { 
                    let closestDewa = null;
                    let minDistanceSq = DEWA_ATTRACTION_RADIUS_SQ;
                    for (const dewa of dewaSouls) {
                        const distanceToDewaSq = vec.lengthSq(vec.subVectors(dewa.position, soul.position));
                        if (distanceToDewaSq < minDistanceSq) {
                            minDistanceSq = distanceToDewaSq;
                            closestDewa = dewa;
                        }
                    }
                    if (closestDewa) {
                        soul.chosenDewaId = closestDewa.id;
                        targetDewa = closestDewa;
                    }
                }
                if (targetDewa) {
                    const distanceToTargetDewaSq = vec.lengthSq(vec.subVectors(soul.position, targetDewa.position));
                    if (distanceToTargetDewaSq > 0 && distanceToTargetDewaSq < DEWA_ATTRACTION_RADIUS_SQ) { 
                        const distanceToTargetDewa = Math.sqrt(distanceToTargetDewaSq); // Only calculate sqrt when needed
                        const directionToDewa = vec.normalize(vec.subVectors(targetDewa.position, soul.position));
                        const attractionForce = vec.multiplyScalar(directionToDewa, DEWA_ATTRACTION_STRENGTH * (1 - distanceToTargetDewa / DEWA_ATTRACTION_RADIUS));
                        soul.velocity = vec.add(soul.velocity, attractionForce);
                    }
                }
            }
            
            // Slightly perturb the velocity
            if (!soul.isDewa) {
                soul.velocity.x += (Math.random() - 0.5) * WORKER_SETTINGS.REGULAR_SOUL_PERTURBATION;
                soul.velocity.y += (Math.random() - 0.5) * WORKER_SETTINGS.REGULAR_SOUL_PERTURBATION;
                soul.velocity.z += (Math.random() - 0.5) * WORKER_SETTINGS.REGULAR_SOUL_PERTURBATION;
            } else {
                soul.velocity.x += (Math.random() - 0.5) * WORKER_SETTINGS.DEWA_PERTURBATION;
                soul.velocity.y += (Math.random() - 0.5) * WORKER_SETTINGS.DEWA_PERTURBATION;
                soul.velocity.z += (Math.random() - 0.5) * WORKER_SETTINGS.DEWA_PERTURBATION;
            }

            // Pointer interaction logic (optimized)
            if (pointerPosition3D && soul.isHuman && !soul.isDewa) {
                const distanceToPointSq = vec.lengthSq(vec.subVectors(soul.position, pointerPosition3D));
                if (distanceToPointSq < POINTER_INTERACTION_RADIUS_SQ) {
                    const directionToPoint = vec.normalize(vec.subVectors(pointerPosition3D, soul.position));
                    const targetVelocity = vec.multiplyScalar(directionToPoint, soul.speed);
                    soul.velocity = vec.lerp(soul.velocity, targetVelocity, POINTER_INFLUENCE_STRENGTH);
                }
            }

            // Normalize to maintain consistent speed and apply the soul's specific speed
            soul.velocity = vec.normalize(soul.velocity);
            soul.velocity = vec.multiplyScalar(soul.velocity, soul.speed);

            // Update position
            soul.position = vec.add(soul.position, soul.velocity);
            
            soul.life--; // Decrement life

            // Visual Enhancement by Dewas & HSL Calculation (optimized)
            let currentSaturation = soul.baseHSL.s;
            let currentLightness = soul.baseHSL.l;
            let isEnhanced = false; // Flag to see if enhancement happened

            if (!soul.isDewa) {
                for (const dewa of dewaSouls) {
                    const distanceToDewaSq = vec.lengthSq(vec.subVectors(soul.position, dewa.position));
                    if (distanceToDewaSq < DEWA_ENHANCEMENT_RADIUS_SQ) {
                        currentSaturation = Math.min(1, soul.baseHSL.s + ENHANCEMENT_SATURATION_BOOST);
                        currentLightness = Math.min(1, soul.baseHSL.l + ENHANCEMENT_LIGHTNESS_BOOST);
                        isEnhanced = true;
                        break; 
                    }
                }
            }

            // Flicker and color animation
            const flicker = WORKER_SETTINGS.OPACITY_BASE + WORKER_SETTINGS.OPACITY_RANGE * Math.sin(pulseTime * WORKER_SETTINGS.FLICKER_MULTIPLIER + soul.flickerPhase);
            const newOpacity = WORKER_SETTINGS.OPACITY_BASE + WORKER_SETTINGS.OPACITY_RANGE * flicker;

            // Use the potentially boosted lightness for pulsing, unless it's a dewa or already enhanced to max
            // Dewas retain their base lightness. Enhanced souls use their boosted lightness for pulsing.
            // Non-enhanced, non-dewa souls pulse their base lightness.
            let pulsedLightness;
            if (soul.isDewa) {
                pulsedLightness = soul.baseHSL.l;
            } else if (isEnhanced) {
                // If enhanced, pulse based on the boosted lightness
                pulsedLightness = Math.min(Math.max(currentLightness + WORKER_SETTINGS.LIGHTNESS_PULSE_AMPLITUDE * (pulse - 0.5), 0), 1);
            } else {
                // If not enhanced, pulse based on original base lightness
                pulsedLightness = Math.min(Math.max(soul.baseHSL.l + WORKER_SETTINGS.LIGHTNESS_PULSE_AMPLITUDE * (pulse - 0.5), 0), 1);
            }
            
            // Calculate new HSL values
            const newHSL = {
                h: soul.baseHSL.h,
                s: soul.isDewa ? soul.baseHSL.s : currentSaturation, 
                l: pulsedLightness
            };

            // Color change detection - only update if HSL or opacity actually changed
            const colorChanged = !soul.finalHSL || 
                Math.abs(soul.finalHSL.h - newHSL.h) > WORKER_SETTINGS.HSL_PRECISION ||
                Math.abs(soul.finalHSL.s - newHSL.s) > WORKER_SETTINGS.HSL_PRECISION ||
                Math.abs(soul.finalHSL.l - newHSL.l) > WORKER_SETTINGS.HSL_PRECISION;
                
            const opacityChanged = soul.finalOpacity === undefined || 
                Math.abs(soul.finalOpacity - newOpacity) > WORKER_SETTINGS.OPACITY_PRECISION;

            // Store color change flags for main thread optimization
            soul.colorChanged = colorChanged;
            soul.opacityChanged = opacityChanged;
            
            // Only update stored values if they actually changed
            if (colorChanged) {
                soul.finalHSL = newHSL;
                // Pre-calculate RGB to avoid HSL-to-RGB conversion on main thread
                const rgbResult = hslToRgb(newHSL.h, newHSL.s, newHSL.l);
                // Validate RGB result before storing
                if (rgbResult && rgbResult.length === 3 && 
                    rgbResult.every(val => typeof val === 'number' && !isNaN(val))) {
                    soul.finalRGB = rgbResult;
                } else {
                    // Fallback to white if RGB conversion fails
                    soul.finalRGB = [1, 1, 1];
                }
            }
            if (opacityChanged) {
                soul.finalOpacity = newOpacity;
            }

            // Soul recycling: if life is over, mark for removal
            if (soul.life <= 0) {
                soulsToRemove.push(soul.id);
                self.postMessage({ type: 'soulRemoved', data: { soulId: soul.id } });
            }
        }); // End of souls.forEach(soul => { ... })

        // Remove souls marked for removal from the worker's list
        if (soulsToRemove.length > 0) {
            souls = souls.filter(soul => !soulsToRemove.includes(soul.id));
        }

        const updatedSoulsData = souls.map(soul => {
            // Use delta compression - only send changed data
            const data = { id: soul.id };
            
            // Always send position (position changes are frequent and important)
            data.pos = [
                Math.round(soul.position.x * WORKER_SETTINGS.POSITION_PRECISION) / WORKER_SETTINGS.POSITION_PRECISION,
                Math.round(soul.position.y * WORKER_SETTINGS.POSITION_PRECISION) / WORKER_SETTINGS.POSITION_PRECISION,
                Math.round(soul.position.z * WORKER_SETTINGS.POSITION_PRECISION) / WORKER_SETTINGS.POSITION_PRECISION
            ];
            
            // Only send HSL if color actually changed
            if (soul.colorChanged && soul.finalRGB) {
                // Send pre-calculated RGB instead of HSL to avoid conversion overhead
                // Validate RGB values before sending
                if (soul.finalRGB.length === 3 && soul.finalRGB.every(val => typeof val === 'number' && !isNaN(val))) {
                    data.rgb = [
                        Math.round(soul.finalRGB[0] * WORKER_SETTINGS.RGB_PRECISION) / WORKER_SETTINGS.RGB_PRECISION,
                        Math.round(soul.finalRGB[1] * WORKER_SETTINGS.RGB_PRECISION) / WORKER_SETTINGS.RGB_PRECISION,
                        Math.round(soul.finalRGB[2] * WORKER_SETTINGS.RGB_PRECISION) / WORKER_SETTINGS.RGB_PRECISION
                    ];
                }
            }
            
            // Only send opacity if it actually changed
            if (soul.opacityChanged) {
                data.opacity = Math.round(soul.finalOpacity * WORKER_SETTINGS.OPACITY_PRECISION_OUT) / WORKER_SETTINGS.OPACITY_PRECISION_OUT;
            }
            
            return data;
        });
        
        // Reset change flags after processing to ensure clean state for next frame
        souls.forEach(soul => {
            soul.colorChanged = false;
            soul.opacityChanged = false;
        });
        
        // Calculate connections in worker to reduce main thread load
        const connections = calculateConnections(
            souls, 
            WORKER_SETTINGS.DEFAULT_INTERACTION_DISTANCE,
            WORKER_SETTINGS.DEFAULT_MAX_CONNECTIONS,
            WORKER_SETTINGS.DEFAULT_MAX_SOULS_TO_CHECK,
            lodData // Pass LOD data for connection optimization
        );

        self.postMessage({ type: 'soulsUpdated', data: updatedSoulsData });
        
        // Send connections separately to main thread
        if (connections.length > 0) {
            self.postMessage({ type: 'connectionsUpdated', data: connections });
        }
    } else if (type === 'addSoul') {
        const newSoul = {
            ...data.soul,
            position: vec.create(data.soul.position.x, data.soul.position.y, data.soul.position.z),
            velocity: vec.create(data.soul.velocity.x, data.soul.velocity.y, data.soul.velocity.z),
            chosenDewaId: null, // Initialize chosenDewaId for new souls
            finalHSL: null, // Initialize for color change detection
            finalRGB: null, // Initialize for RGB pre-calculation
            finalOpacity: undefined, // Initialize for opacity change detection
            colorChanged: true, // Force initial color update
            opacityChanged: true // Force initial opacity update
        };
        souls.push(newSoul);
    }
};

// Add connection calculation function after the existing functions
function calculateConnections(souls, interactionDistance, maxConnections, maxSoulsToCheck, lodData = {}) {
    const connections = [];
    const maxDistSq = interactionDistance * interactionDistance;
    
    // Use spatial grid for O(n) complexity instead of O(n²)
    const maxSouls = Math.min(souls.length, maxSoulsToCheck);
    const soulsToCheck = souls.slice(0, maxSouls);
    
    // To keep connection color stable, we need a deterministic color for each pair (id1, id2)
    function getStableColor(id1, id2) {
        // Always order ids the same way
        const a = Math.min(id1, id2);
        const b = Math.max(id1, id2);
        // Use a simple hash function for deterministic color
        const hash = ((a * 73856093) ^ (b * 19349663)) >>> 0;
        // Map hash to [0,1]
        const hue = (hash % 360) / 360;
        const saturation = 1;
        const lightness = 0.5; // 0.5-0.7
        return hslToRgb(hue, saturation, lightness);
    }

    for (let i = 0; i < soulsToCheck.length && connections.length < maxConnections; i++) {
        const soul = soulsToCheck[i];
        
        // LOD-aware connection filtering
        const soulLodInfo = lodData[soul.id];
        const soulConnectionMultiplier = soulLodInfo ? soulLodInfo.connectionMultiplier : 1.0;
        
        // Skip connections entirely for culled souls
        if (soulLodInfo && soulLodInfo.lod === 'CULLED') continue;
        
        const nearby = spatialGrid.getNearby(soul.position, interactionDistance);
        for (const other of nearby) {
            if (soul.id >= other.id) continue; // Avoid duplicates
            if (connections.length >= maxConnections) break;
            
            // Check LOD for the other soul too
            const otherLodInfo = lodData[other.id];
            const otherConnectionMultiplier = otherLodInfo ? otherLodInfo.connectionMultiplier : 1.0;
            
            // Skip connections for culled souls
            if (otherLodInfo && otherLodInfo.lod === 'CULLED') continue;
            
            // Use the minimum connection multiplier between the two souls
            const effectiveConnectionMultiplier = Math.min(soulConnectionMultiplier, otherConnectionMultiplier);
            
            // Probabilistic connection based on LOD multiplier
            if (Math.random() > effectiveConnectionMultiplier) continue;
            
            const distSq = vec.lengthSq(vec.subVectors(soul.position, other.position));
            if (distSq < maxDistSq) {
                const rgb = getStableColor(soul.id, other.id);
                connections.push({
                    start: [soul.position.x, soul.position.y, soul.position.z],
                    end: [other.position.x, other.position.y, other.position.z],
                    color: rgb
                });
            }
        }
    }
    
    return connections;
}
