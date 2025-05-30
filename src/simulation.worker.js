let souls = [];
let POINTER_INTERACTION_RADIUS, POINTER_INFLUENCE_STRENGTH;
let NEIGHBOR_SPEED_INFLUENCE_RADIUS, NEIGHBOR_SPEED_INFLUENCE_STRENGTH;
let SEPARATION_DISTANCE, SEPARATION_STRENGTH;
let GOD_ATTRACTION_RADIUS, GOD_ATTRACTION_STRENGTH; // Added god constants
let GOD_ENHANCEMENT_RADIUS, ENHANCEMENT_SATURATION_BOOST, ENHANCEMENT_LIGHTNESS_BOOST; // Added
let pulseTime = 0;

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

self.onmessage = function(e) {
    const { type, data } = e.data;

    if (type === 'init') {
        souls = data.souls.map(s => ({
            ...s,
            position: vec.create(s.position.x, s.position.y, s.position.z),
            velocity: vec.create(s.velocity.x, s.velocity.y, s.velocity.z),
            chosenGodId: null // Initialize chosenGodId
        }));
        POINTER_INTERACTION_RADIUS = data.constants.POINTER_INTERACTION_RADIUS;
        POINTER_INFLUENCE_STRENGTH = data.constants.POINTER_INFLUENCE_STRENGTH;
        NEIGHBOR_SPEED_INFLUENCE_RADIUS = data.constants.NEIGHBOR_SPEED_INFLUENCE_RADIUS;
        NEIGHBOR_SPEED_INFLUENCE_STRENGTH = data.constants.NEIGHBOR_SPEED_INFLUENCE_STRENGTH;
        SEPARATION_DISTANCE = data.constants.SEPARATION_DISTANCE;
        SEPARATION_STRENGTH = data.constants.SEPARATION_STRENGTH;
        GOD_ATTRACTION_RADIUS = data.constants.GOD_ATTRACTION_RADIUS; // Store god constant
        GOD_ATTRACTION_STRENGTH = data.constants.GOD_ATTRACTION_STRENGTH; // Store god constant
        GOD_ENHANCEMENT_RADIUS = data.constants.GOD_ENHANCEMENT_RADIUS; // Added
        ENHANCEMENT_SATURATION_BOOST = data.constants.ENHANCEMENT_SATURATION_BOOST; // Added
        ENHANCEMENT_LIGHTNESS_BOOST = data.constants.ENHANCEMENT_LIGHTNESS_BOOST; // Added
    } else if (type === 'update') {
        const pointerPosition3D = data.pointerPosition3D ? vec.create(data.pointerPosition3D.x, data.pointerPosition3D.y, data.pointerPosition3D.z) : null;
        pulseTime += 0.02;
        const pulse = (Math.sin(pulseTime * 2) + 1) / 2;

        const godSouls = souls.filter(s => s.isGod);

        const soulsToRemove = [];
        souls.forEach(soul => {
            // === Speed influence from neighbors ===
            if (!soul.isGod) { // Gods are not affected by neighbor speed influence
                let influencedSpeed = soul.speed;
                souls.forEach(otherSoul => {
                    if (soul.id === otherSoul.id || otherSoul.isGod) return; // Also ignore gods for speed influence
                    const distanceToNeighbor = vec.distanceTo(soul.position, otherSoul.position);
                    if (distanceToNeighbor < NEIGHBOR_SPEED_INFLUENCE_RADIUS) {
                        influencedSpeed = mathUtils.lerp(
                            influencedSpeed,
                            otherSoul.speed,
                            NEIGHBOR_SPEED_INFLUENCE_STRENGTH
                        );
                    }
                });
                soul.speed = influencedSpeed;
            }

            // === Separation from neighbors ===
            const separationForce = vec.create();
            souls.forEach(otherSoul => {
                if (soul.id === otherSoul.id) return;
                const distanceToNeighbor = vec.distanceTo(soul.position, otherSoul.position);
                if (distanceToNeighbor > 0 && distanceToNeighbor < SEPARATION_DISTANCE) {
                    let awayVector = vec.subVectors(soul.position, otherSoul.position);
                    awayVector = vec.normalize(awayVector);
                    awayVector = vec.multiplyScalar(awayVector, 1 / (distanceToNeighbor + 0.0001));
                    separationForce.x += awayVector.x;
                    separationForce.y += awayVector.y;
                    separationForce.z += awayVector.z;
                }
            });
            if (vec.lengthSq(separationForce) > 0) {
                const scaledSeparationForce = vec.multiplyScalar(separationForce, SEPARATION_STRENGTH);
                soul.velocity = vec.add(soul.velocity, scaledSeparationForce);
            }

            // === God Attraction ===
            if (!soul.isGod) {
                let targetGod = null;
                if (soul.chosenGodId !== null) {
                    const currentlyChosenGod = godSouls.find(g => g.id === soul.chosenGodId);
                    if (currentlyChosenGod) {
                        const distanceToChosenGod = vec.distanceTo(soul.position, currentlyChosenGod.position);
                        if (distanceToChosenGod < GOD_ATTRACTION_RADIUS) {
                            targetGod = currentlyChosenGod;
                        } else {
                            soul.chosenGodId = null; 
                        }
                    } else {
                        soul.chosenGodId = null; 
                    }
                }
                if (targetGod === null) { 
                    let closestGod = null;
                    let minDistanceSq = GOD_ATTRACTION_RADIUS * GOD_ATTRACTION_RADIUS;
                    godSouls.forEach(god => {
                        const distanceToGodSq = vec.lengthSq(vec.subVectors(god.position, soul.position));
                        if (distanceToGodSq < minDistanceSq) {
                            minDistanceSq = distanceToGodSq;
                            closestGod = god;
                        }
                    });
                    if (closestGod) {
                        soul.chosenGodId = closestGod.id;
                        targetGod = closestGod;
                    }
                }
                if (targetGod) {
                    const distanceToTargetGod = vec.distanceTo(soul.position, targetGod.position);
                    if (distanceToTargetGod > 0 && distanceToTargetGod < GOD_ATTRACTION_RADIUS) { 
                        const directionToGod = vec.normalize(vec.subVectors(targetGod.position, soul.position));
                        const attractionForce = vec.multiplyScalar(directionToGod, GOD_ATTRACTION_STRENGTH * (1 - distanceToTargetGod / GOD_ATTRACTION_RADIUS));
                        soul.velocity = vec.add(soul.velocity, attractionForce);
                    }
                }
            }
            
            // Slightly perturb the velocity
            if (!soul.isGod) {
                soul.velocity.x += (Math.random() - 0.5) * 0.2;
                soul.velocity.y += (Math.random() - 0.5) * 0.2;
                soul.velocity.z += (Math.random() - 0.5) * 0.2;
            } else {
                soul.velocity.x += (Math.random() - 0.5) * 0.01;
                soul.velocity.y += (Math.random() - 0.5) * 0.01;
                soul.velocity.z += (Math.random() - 0.5) * 0.01;
            }

            // Pointer interaction logic
            if (pointerPosition3D && soul.isHuman && !soul.isGod) {
                const distanceToPoint = vec.distanceTo(soul.position, pointerPosition3D);
                if (distanceToPoint < POINTER_INTERACTION_RADIUS) {
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

            // Visual Enhancement by Gods & HSL Calculation
            let currentSaturation = soul.baseHSL.s;
            let currentLightness = soul.baseHSL.l;
            let isEnhanced = false; // Flag to see if enhancement happened

            if (!soul.isGod) {
                for (const god of godSouls) {
                    const distanceToGod = vec.distanceTo(soul.position, god.position);
                    if (distanceToGod < GOD_ENHANCEMENT_RADIUS) {
                        currentSaturation = Math.min(1, soul.baseHSL.s + ENHANCEMENT_SATURATION_BOOST);
                        currentLightness = Math.min(1, soul.baseHSL.l + ENHANCEMENT_LIGHTNESS_BOOST);
                        isEnhanced = true;
                        break; 
                    }
                }
            }

            // Flicker and color animation
            const flicker = 0.5 + 0.5 * Math.sin(pulseTime * 3 + soul.flickerPhase);
            soul.finalOpacity = 0.5 + 0.5 * flicker; // Store opacity directly on soul for mapping

            // Use the potentially boosted lightness for pulsing, unless it's a god or already enhanced to max
            // Gods retain their base lightness. Enhanced souls use their boosted lightness for pulsing.
            // Non-enhanced, non-god souls pulse their base lightness.
            let pulsedLightness;
            if (soul.isGod) {
                pulsedLightness = soul.baseHSL.l;
            } else if (isEnhanced) {
                // If enhanced, pulse based on the boosted lightness
                pulsedLightness = Math.min(Math.max(currentLightness + 0.2 * (pulse - 0.5), 0), 1);
            } else {
                // If not enhanced, pulse based on original base lightness
                pulsedLightness = Math.min(Math.max(soul.baseHSL.l + 0.2 * (pulse - 0.5), 0), 1);
            }
            
            soul.finalHSL = { // Store the HSL to be sent, directly on soul for mapping
                h: soul.baseHSL.h,
                s: soul.isGod ? soul.baseHSL.s : currentSaturation, 
                l: pulsedLightness
            };

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
            // Flicker and color animation (only for live souls) - MOVED INTO THE LOOP ABOVE
            // const flicker = 0.5 + 0.5 * Math.sin(pulseTime * 3 + soul.flickerPhase);
            // const newOpacity = 0.5 + 0.5 * flicker;
            // const newLightness = Math.min(Math.max(soul.baseHSL.l + 0.2 * (pulse - 0.5), 0), 1);
            
            return {
                id: soul.id,
                position: soul.position,
                newHSL: soul.finalHSL, // Use the pre-calculated finalHSL from the loop
                newOpacity: soul.finalOpacity // Use the pre-calculated finalOpacity from the loop
            };
        });
        self.postMessage({ type: 'soulsUpdated', data: updatedSoulsData });
    } else if (type === 'addSoul') {
        souls.push({
            ...data.soul,
            position: vec.create(data.soul.position.x, data.soul.position.y, data.soul.position.z),
            velocity: vec.create(data.soul.velocity.x, data.soul.velocity.y, data.soul.velocity.z),
            chosenGodId: null // Initialize chosenGodId for new souls
        });
    }
};
