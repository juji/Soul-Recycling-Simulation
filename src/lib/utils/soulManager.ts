// src/lib/utils/soulManager.ts
// Soul creation and management utilities
import * as THREE from 'three';
import type { SoulWorkerData, ConnectionData, WorkerSoulUpdate } from '../../types';
import { DEWA_SPAWN_CHANCE, DEWA_BASE_SPEED } from '../constants/config';
import { GEOMETRY_SETTINGS, LINE_SETTINGS } from '../constants/rendering';
import { addSoul, removeSoulById, soulLookupMap } from '../stores/simulationState.svelte';

// Shared geometries for better memory efficiency
let humanGeometry: THREE.SphereGeometry | null = null;
let gptGeometry: THREE.BoxGeometry | null = null;
let dewaGeometry: THREE.SphereGeometry | null = null;

// Shared materials for better memory efficiency
let sharedHumanMaterial: THREE.MeshBasicMaterial | null = null;
let sharedGptMaterial: THREE.MeshBasicMaterial | null = null;
let sharedDewaMaterial: THREE.MeshLambertMaterial | null = null;

// Soul ID counter (will be initialized by initializeSoulManager)
let nextSoulId: number = 0;

// Base hue values (will be set by initializeSoulManager)
let humanBaseHue: number = 0;
let gptBaseHue: number = 0;

/**
 * Initialize the soul manager with geometries, materials, and base values
 * This should be called once when the simulation starts
 */
export function initializeSoulManager(): void {
  // Create shared geometries for different soul types
  humanGeometry = new THREE.SphereGeometry(
    GEOMETRY_SETTINGS.HUMAN_RADIUS,
    GEOMETRY_SETTINGS.HUMAN_SEGMENTS.width,
    GEOMETRY_SETTINGS.HUMAN_SEGMENTS.height
  );

  gptGeometry = new THREE.BoxGeometry(
    GEOMETRY_SETTINGS.GPT_SIZE,
    GEOMETRY_SETTINGS.GPT_SIZE,
    GEOMETRY_SETTINGS.GPT_SIZE
  );

  dewaGeometry = new THREE.SphereGeometry(
    GEOMETRY_SETTINGS.DEWA_RADIUS,
    GEOMETRY_SETTINGS.DEWA_SEGMENTS.width,
    GEOMETRY_SETTINGS.DEWA_SEGMENTS.height
  );

  // Create shared materials for better memory efficiency
  sharedHumanMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: GEOMETRY_SETTINGS.MATERIAL_OPACITY.DEFAULT,
  });

  sharedGptMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: GEOMETRY_SETTINGS.MATERIAL_OPACITY.DEFAULT,
  });

  sharedDewaMaterial = new THREE.MeshLambertMaterial({
    transparent: true,
    opacity: GEOMETRY_SETTINGS.MATERIAL_OPACITY.DEWA,
  });

  // Initialize base hue values
  humanBaseHue = Math.random();
  gptBaseHue = (humanBaseHue + 0.5) % 1;

  // Reset soul ID counter
  nextSoulId = 0;
}

/**
 * Create a soul mesh with specified properties
 */
export function createSoul(
  isHuman: boolean,
  isDewa: boolean = false,
  angle: number = 0,
  speed: number = 0,
  scene: THREE.Scene,
  renderingMode: 'instanced' | 'individual',
  MIN_LIFESPAN: number,
  MAX_LIFESPAN: number,
  simulationWorker?: Worker | null
): THREE.Mesh {
  // Select geometry based on soul type
  let geometry: THREE.BufferGeometry;
  if (isDewa) {
    geometry = dewaGeometry!;
  } else {
    geometry = isHuman ? humanGeometry! : gptGeometry!;
  }

  // Create material and HSL color values
  let material: THREE.Material;
  let h_val: number, s_val: number, l_val: number;

  if (isDewa) {
    // Dewa entities: random vibrant color
    h_val = Math.random(); // Random hue
    s_val = 1; // Max saturation
    l_val = 0.5; // Max brightness (standard for HSL)
    material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(h_val, s_val, l_val), // Set color using HSL
      transparent: false,
      opacity: 1.0,
    });
  } else {
    // Regular souls: use shared material and set color
    material = (isHuman ? sharedHumanMaterial! : sharedGptMaterial!).clone();
    material.transparent = true;
    material.opacity = 0.8;

    const baseHue = isHuman ? humanBaseHue : gptBaseHue;
    const hueOffset = Math.random() * 0.3 - 0.15;
    h_val = (baseHue + hueOffset + angle / (2 * Math.PI)) % 1;
    s_val = 1;
    l_val = 0.56;
    (material as THREE.MeshBasicMaterial).color.setHSL(h_val, s_val, l_val);
  }

  // Create the mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.id = nextSoulId++;

  // Set random position in spherical distribution
  const radius = 10 + Math.random() * 10;
  const theta = Math.random() * 2 * Math.PI;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  mesh.position.set(x, y, z);

  // Calculate speed and initial velocity
  const currentSpeed = isDewa ? DEWA_BASE_SPEED : speed === 0 ? 0.05 + Math.random() * 0.03 : speed;
  const initialVelocity = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  )
    .normalize()
    .multiplyScalar(currentSpeed);

  // Set soul properties
  mesh.userData.speed = currentSpeed;
  mesh.userData.isHuman = isHuman;
  mesh.userData.isDewa = isDewa;
  mesh.userData.flickerPhase = Math.random() * Math.PI * 2;
  mesh.userData.life = MIN_LIFESPAN + Math.random() * (MAX_LIFESPAN - MIN_LIFESPAN);
  mesh.userData.baseHSL = { h: h_val, s: s_val, l: l_val };
  mesh.userData.velocity = { x: initialVelocity.x, y: initialVelocity.y, z: initialVelocity.z };

  // Prepare data for worker
  const soulDataForWorker: SoulWorkerData = {
    id: mesh.userData.id!,
    position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
    velocity: { x: initialVelocity.x, y: initialVelocity.y, z: initialVelocity.z },
    speed: currentSpeed,
    isHuman,
    isDewa,
    flickerPhase: mesh.userData.flickerPhase!,
    life: mesh.userData.life!,
    baseHSL: mesh.userData.baseHSL!,
  };

  // Send to worker if available
  if (simulationWorker) {
    simulationWorker.postMessage({ type: 'addSoul', data: { soul: soulDataForWorker } });
  }

  // Only add individual meshes to scene when not using instanced rendering
  if (renderingMode !== 'instanced') {
    scene.add(mesh);
  }

  // Add to state management
  addSoul(mesh);

  return mesh;
}

/**
 * Create a new soul with random properties
 */
export function createNewSoul(
  scene: THREE.Scene,
  renderingMode: 'instanced' | 'individual',
  MIN_LIFESPAN: number,
  MAX_LIFESPAN: number,
  simulationWorker?: Worker | null
): THREE.Mesh {
  const isDewa = Math.random() < DEWA_SPAWN_CHANCE;
  const isHuman = isDewa ? true : Math.random() < 0.5;
  return createSoul(
    isHuman,
    isDewa,
    0,
    0,
    scene,
    renderingMode,
    MIN_LIFESPAN,
    MAX_LIFESPAN,
    simulationWorker
  );
}

/**
 * Create initial souls for simulation startup
 */
export function createInitialSouls(
  count: number,
  scene: THREE.Scene,
  renderingMode: 'instanced' | 'individual',
  MIN_LIFESPAN: number,
  MAX_LIFESPAN: number,
  simulationWorker?: Worker | null
): SoulWorkerData[] {
  const initialSoulsForWorkerInit: SoulWorkerData[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const isDewa = Math.random() < DEWA_SPAWN_CHANCE;
    const isHuman = isDewa ? true : Math.random() < 0.6;
    const speed = Math.random() < 0.1 ? 0.05 + Math.random() * 0.25 : 0.05 + Math.random() * 0.025;

    const mesh = createSoul(
      isHuman,
      isDewa,
      angle,
      speed,
      scene,
      renderingMode,
      MIN_LIFESPAN,
      MAX_LIFESPAN,
      simulationWorker
    );

    initialSoulsForWorkerInit.push({
      id: mesh.userData.id!,
      position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      velocity: mesh.userData.velocity!,
      speed: mesh.userData.speed!,
      isHuman: mesh.userData.isHuman!,
      isDewa: mesh.userData.isDewa!,
      flickerPhase: mesh.userData.flickerPhase!,
      life: mesh.userData.life!,
      baseHSL: mesh.userData.baseHSL!,
    });
  }

  return initialSoulsForWorkerInit;
}

/**
 * Get the current soul ID counter value
 */
export function getCurrentSoulId(): number {
  return nextSoulId;
}

/**
 * Reset the soul ID counter (useful for testing)
 */
export function resetSoulIdCounter(): void {
  nextSoulId = 0;
}

/**
 * Dispose of shared geometries and materials (cleanup)
 */
export function disposeSoulManager(): void {
  if (humanGeometry) {
    humanGeometry.dispose();
    humanGeometry = null;
  }
  if (gptGeometry) {
    gptGeometry.dispose();
    gptGeometry = null;
  }
  if (dewaGeometry) {
    dewaGeometry.dispose();
    dewaGeometry = null;
  }
  if (sharedHumanMaterial) {
    sharedHumanMaterial.dispose();
    sharedHumanMaterial = null;
  }
  if (sharedGptMaterial) {
    sharedGptMaterial.dispose();
    sharedGptMaterial = null;
  }
  if (sharedDewaMaterial) {
    sharedDewaMaterial.dispose();
    sharedDewaMaterial = null;
  }
}

// ===== SOUL LIFECYCLE MANAGEMENT =====

/**
 * Handle soul removal with proper cleanup for different rendering modes
 */
export function handleSoulRemoval(
  soulId: number,
  scene: THREE.Scene,
  renderingMode: 'instanced' | 'individual'
): boolean {
  const soulMesh = soulLookupMap().get(soulId);
  if (!soulMesh) {
    return false;
  }

  // Handle soul removal for both rendering modes
  if (renderingMode === 'instanced') {
    // In instanced mode, remove from scene but don't dispose shared resources
    scene.remove(soulMesh);
    // Instanced renderer will handle the update in next frame
  } else {
    // Individual mesh mode: dispose resources as before
    scene.remove(soulMesh);
    const mesh = soulMesh as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      // If material is an array (e.g. multi-material), dispose each
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material: THREE.Material) => material.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  }

  // Remove from state management
  removeSoulById(soulId);
  return true;
}

/**
 * Update soul mesh properties from worker data
 */
export function updateSoulFromWorker(
  soulData: WorkerSoulUpdate,
  renderingMode: 'instanced' | 'individual'
): boolean {
  const soulMesh = soulLookupMap().get(soulData.id);
  if (!soulMesh) {
    return false;
  }

  // Update position if provided
  if (soulData.pos && Array.isArray(soulData.pos) && soulData.pos.length === 3) {
    soulMesh.position.set(soulData.pos[0], soulData.pos[1], soulData.pos[2]);
  }

  // Update userData for instanced renderer access
  if (soulData.rgb) {
    soulMesh.userData.finalRGB = soulData.rgb;
  }
  if (soulData.opacity !== undefined) {
    soulMesh.userData.finalOpacity = soulData.opacity;
  }

  // For individual mesh rendering, also update material properties
  if (renderingMode === 'individual') {
    const mesh = soulMesh as THREE.Mesh;
    const material = mesh.material as THREE.MeshBasicMaterial;

    if (material) {
      let materialNeedsUpdate = false;

      // Only update color if it actually changed (delta optimization)
      if (soulData.rgb && Array.isArray(soulData.rgb) && soulData.rgb.length === 3) {
        if (material.color) {
          material.color.setRGB(soulData.rgb[0], soulData.rgb[1], soulData.rgb[2]);
          materialNeedsUpdate = true;
        }
      }

      // Only update opacity if it actually changed (delta optimization)
      if (
        soulData.opacity !== undefined &&
        typeof soulData.opacity === 'number' &&
        !isNaN(soulData.opacity) &&
        material.opacity !== undefined
      ) {
        material.opacity = Math.max(0, Math.min(1, soulData.opacity));
        materialNeedsUpdate = true;
      }

      // Only mark material for update if we actually changed something
      if (materialNeedsUpdate) {
        material.needsUpdate = true;
      }
    }
  }

  return true;
}

// ===== CONNECTION LINE MANAGEMENT =====

/**
 * Initialize line segments for soul connections
 */
export function initializeConnectionLines(
  scene: THREE.Scene,
  maxLines: number
): THREE.LineSegments {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(
    maxLines * LINE_SETTINGS.VERTICES_PER_LINE * LINE_SETTINGS.VERTEX_COORDS
  );
  const colors = new Float32Array(
    maxLines * LINE_SETTINGS.VERTICES_PER_LINE * LINE_SETTINGS.VERTEX_COORDS
  );

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, LINE_SETTINGS.VERTEX_COORDS)
  );
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, LINE_SETTINGS.VERTEX_COORDS));

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: LINE_SETTINGS.OPACITY,
  });

  const lineSegments = new THREE.LineSegments(geometry, material);
  scene.add(lineSegments);

  return lineSegments;
}

/**
 * Update connection lines from worker-calculated connection data
 */
export function updateConnectionLines(
  lineSegments: THREE.LineSegments,
  connections: ConnectionData[],
  maxLines: number
): void {
  if (!lineSegments || !connections || connections.length === 0) {
    if (lineSegments) {
      lineSegments.geometry.setDrawRange(0, 0);
    }
    return;
  }

  const positions = lineSegments.geometry.attributes.position.array as Float32Array;
  const colors = lineSegments.geometry.attributes.color.array as Float32Array;

  let lineIdx = 0;
  const maxLineCount = Math.min(connections.length, maxLines);

  // Apply pre-calculated connection data from worker
  for (let i = 0; i < maxLineCount; i++) {
    const connection = connections[i];

    // Vertex 1 (start)
    positions[lineIdx * 6 + 0] = connection.start[0];
    positions[lineIdx * 6 + 1] = connection.start[1];
    positions[lineIdx * 6 + 2] = connection.start[2];
    colors[lineIdx * 6 + 0] = connection.color[0];
    colors[lineIdx * 6 + 1] = connection.color[1];
    colors[lineIdx * 6 + 2] = connection.color[2];

    // Vertex 2 (end)
    positions[lineIdx * 6 + 3] = connection.end[0];
    positions[lineIdx * 6 + 4] = connection.end[1];
    positions[lineIdx * 6 + 5] = connection.end[2];
    colors[lineIdx * 6 + 3] = connection.color[0];
    colors[lineIdx * 6 + 4] = connection.color[1];
    colors[lineIdx * 6 + 5] = connection.color[2];

    lineIdx++;
  }

  // Hide unused lines by setting them to zero
  for (let i = lineIdx; i < maxLines; i++) {
    positions[i * 6 + 0] = 0;
    positions[i * 6 + 1] = 0;
    positions[i * 6 + 2] = 0;
    positions[i * 6 + 3] = 0;
    positions[i * 6 + 4] = 0;
    positions[i * 6 + 5] = 0;
  }

  // Update the geometry
  lineSegments.geometry.setDrawRange(0, lineIdx * 2);
  lineSegments.geometry.attributes.position.needsUpdate = true;
  lineSegments.geometry.attributes.color.needsUpdate = true;
}

/**
 * Dispose of connection line resources
 */
export function disposeConnectionLines(lineSegments: THREE.LineSegments, scene: THREE.Scene): void {
  if (lineSegments) {
    scene.remove(lineSegments);
    if (lineSegments.geometry) {
      lineSegments.geometry.dispose();
    }
    if (lineSegments.material) {
      lineSegments.material.dispose();
    }
  }
}
