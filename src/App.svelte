<script>

  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  let container;

  // Helper function to get entity count from URL parameter
  function getEntityCountFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const val = urlParams.get('val');
    
    console.log('URL parameter "val":', val);
    
    if (val === null || val === '') {
      console.log('No val parameter found, using default: 333');
      return 333; // Default value
    }
    
    const parsedVal = parseInt(val, 10);
    
    // Check if it's a valid number and clamp between 333 and 33333
    if (isNaN(parsedVal)) {
      console.log('Invalid val parameter, using default: 333');
      return 333; // Default for invalid values
    }
    
    const clampedVal = Math.max(333, Math.min(33333, parsedVal));
    console.log('Entity count set to:', clampedVal);
    return clampedVal;
  }

  onMount(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 30, 60);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enable damping
    controls.dampingFactor = 0.01;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Slightly reduced ambient for more contrast
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7); // Adjusted intensity
    directionalLight.position.set(-8, 10, 8); // Closer and different angle
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xffccaa, 0.65, 60); // Warmish light, closer, adjusted distance & intensity
    pointLight1.position.set(10, 4, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xaaccff, 0.55, 60); // Coolish light, closer, adjusted distance & intensity
    pointLight2.position.set(-4, -6, -10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 0.5, 25); // New white point light, much closer, adjusted intensity & distance
    pointLight3.position.set(0, 5, -2); // Positioned even closer from top-front
    scene.add(pointLight3);

    const recycledSoulCount = getEntityCountFromURL();
    const newSoulSpawnRate = 0.4; // Increased from 0.2
    const interactionDistance = 6;
    let souls = []; // This will now store only the THREE.Mesh objects
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);

    const humanGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const gptGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const godGeometry = new THREE.SphereGeometry(0.333, 32, 32); // Larger sphere for gods

    const humanBaseHue = Math.random();
    const gptBaseHue = (humanBaseHue + 0.5) % 1;

    // Pointer interaction variables
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerPosition3D = null;
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const POINTER_INTERACTION_RADIUS = 10;
    const POINTER_INFLUENCE_STRENGTH = 0.05;

    // Neighbor speed influence variables
    const NEIGHBOR_SPEED_INFLUENCE_RADIUS = 5;
    const NEIGHBOR_SPEED_INFLUENCE_STRENGTH = 0.1;

    // Boids-like separation variables
    const SEPARATION_DISTANCE = 1.5;
    const SEPARATION_STRENGTH = 0.05;

    // God entity properties
    const GOD_ATTRACTION_RADIUS = 15; 
    const GOD_ATTRACTION_STRENGTH = 0.005; 
    const GOD_SPAWN_CHANCE = 0.05; 
    const GOD_BASE_SPEED = 0.02; // Slower, consistent speed for gods
    const GOD_ENHANCEMENT_RADIUS = 10; // New: Radius within which gods enhance other souls
    const ENHANCEMENT_SATURATION_BOOST = 0.2; // New: How much to boost saturation (0 to 1)
    const ENHANCEMENT_LIGHTNESS_BOOST = 0.15; // New: How much to boost lightness (0 to 1)

    let simulationWorker;
    let nextSoulId = 0;

    function onMouseMove(event) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    container.addEventListener('mousemove', onMouseMove);

    function createSoul(isHuman, isGod = false, angle = 0, speed = 0) {
      let geometry;
      if (isGod) {
        geometry = godGeometry;
      } else {
        geometry = isHuman ? humanGeometry : gptGeometry;
      }
      // const geometry = (isHuman || isGod) ? humanGeometry : gptGeometry; // Old logic
      let material;
      let h_val, s_val, l_val; 

      if (isGod) {
        h_val = Math.random(); // Random hue
        s_val = 1;             // Max saturation
        l_val = 0.5;           // Max brightness (standard for HSL)
        material = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color().setHSL(h_val, s_val, l_val), // Set color using HSL
            transparent: false,
            opacity: 1.0
        });
        // For baseHSL, update with the new random color
        // h_val is already set above
        // s_val is already set above
        // l_val is already set above
      } else {
        material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8 });
        const baseHue = isHuman ? humanBaseHue : gptBaseHue;
        const hueOffset = Math.random() * 0.3 - 0.15;
        h_val = (baseHue + hueOffset + angle / (2 * Math.PI)) % 1;
        s_val = 1;
        l_val = 0.56;
        material.color.setHSL(h_val, s_val, l_val);
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.id = nextSoulId++; 

      const radius = 10 + Math.random() * 10;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      mesh.position.set(x, y, z);

      const currentSpeed = isGod ? GOD_BASE_SPEED : (speed === 0 ? (0.05 + (Math.random() * .03)) : speed);
      const initialVelocity = new THREE.Vector3(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5)
      ).normalize().multiplyScalar(currentSpeed);

      mesh.userData.speed = currentSpeed;
      mesh.userData.isHuman = isHuman;
      mesh.userData.isGod = isGod; 
      mesh.userData.flickerPhase = Math.random() * Math.PI * 2;
      // mesh.userData.life = 600; // Initialize life to 600 ticks - Old fixed value
      mesh.userData.life = 300 + Math.random() * 600; // Random lifespan between 300 and 900 ticks
      mesh.userData.baseHSL = { h: h_val, s: s_val, l: l_val }; 
      mesh.userData.velocity = { x: initialVelocity.x, y: initialVelocity.y, z: initialVelocity.z }; 

      const soulDataForWorker = {
        id: mesh.userData.id,
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        velocity: { x: initialVelocity.x, y: initialVelocity.y, z: initialVelocity.z },
        speed: currentSpeed,
        isHuman,
        isGod, 
        flickerPhase: mesh.userData.flickerPhase,
        life: mesh.userData.life, // Pass the initialized life
        baseHSL: mesh.userData.baseHSL, 
      };

      if (simulationWorker) {
        simulationWorker.postMessage({ type: 'addSoul', data: { soul: soulDataForWorker } });
      }

      scene.add(mesh);
      souls.push(mesh); 
      return mesh; 
    }

    // Initialize the Web Worker
    simulationWorker = new Worker(new URL('./simulation.worker.js', import.meta.url), { type: 'module' });

    // Create initial souls and collect their data for the worker's init message
    const initialSoulsForWorkerInit = [];
    for (let i = 0; i < recycledSoulCount; i++) {
      const angle = (i / recycledSoulCount) * Math.PI * 2;
      const isGod = Math.random() < GOD_SPAWN_CHANCE;
      const isHuman = isGod ? true : Math.random() < 0.6; 
      const speed = Math.random() < 0.1 ?  0.05 + Math.random() * 0.25 : 0.05 + Math.random() * 0.025;
      const mesh = createSoul(isHuman, isGod, angle, speed); 
      initialSoulsForWorkerInit.push({
        id: mesh.userData.id,
        position: {x: mesh.position.x, y: mesh.position.y, z: mesh.position.z},
        velocity: mesh.userData.velocity, 
        speed: mesh.userData.speed, 
        isHuman: mesh.userData.isHuman,
        isGod: mesh.userData.isGod, 
        flickerPhase: mesh.userData.flickerPhase,
        life: mesh.userData.life, // Ensure life is passed for initial souls too
        baseHSL: mesh.userData.baseHSL
      });
    }
    
    simulationWorker.postMessage({
        type: 'init',
        data: {
            souls: initialSoulsForWorkerInit, 
            constants: {
                POINTER_INTERACTION_RADIUS, 
                POINTER_INFLUENCE_STRENGTH, 
                NEIGHBOR_SPEED_INFLUENCE_RADIUS,
                NEIGHBOR_SPEED_INFLUENCE_STRENGTH,
                SEPARATION_DISTANCE,
                SEPARATION_STRENGTH,
                GOD_ATTRACTION_RADIUS, 
                GOD_ATTRACTION_STRENGTH,
                GOD_ENHANCEMENT_RADIUS, // Added
                ENHANCEMENT_SATURATION_BOOST, // Added
                ENHANCEMENT_LIGHTNESS_BOOST // Added
            }
        }
    });

    simulationWorker.onmessage = function(e) {
        const { type, data } = e.data;
        if (type === 'soulsUpdated') {
            data.forEach(updatedSoulData => {
                const soulMesh = souls.find(s => s.userData.id === updatedSoulData.id);
                if (soulMesh) {
                    soulMesh.position.set(updatedSoulData.position.x, updatedSoulData.position.y, updatedSoulData.position.z);
                    // Ensure material exists before trying to set properties
                    if (soulMesh.material) {
                        if (soulMesh.material.color && typeof soulMesh.material.color.setHSL === 'function') {
                            soulMesh.material.color.setHSL(updatedSoulData.newHSL.h, updatedSoulData.newHSL.s, updatedSoulData.newHSL.l);
                        }
                        soulMesh.material.opacity = updatedSoulData.newOpacity;
                        if (soulMesh.material.needsUpdate !== undefined) {
                            soulMesh.material.needsUpdate = true;
                        }
                    }
                }
            });
        } else if (type === 'soulRemoved') {
            const soulIdToRemove = data.soulId;
            const soulMeshToRemove = souls.find(s => s.userData.id === soulIdToRemove);
            if (soulMeshToRemove) {
                scene.remove(soulMeshToRemove);
                if (soulMeshToRemove.geometry) {
                    soulMeshToRemove.geometry.dispose();
                }
                if (soulMeshToRemove.material) {
                    // If material is an array (e.g. multi-material), dispose each
                    if (Array.isArray(soulMeshToRemove.material)) {
                        soulMeshToRemove.material.forEach(material => material.dispose());
                    } else {
                        soulMeshToRemove.material.dispose();
                    }
                }
                souls = souls.filter(s => s.userData.id !== soulIdToRemove);
            }
        }
    };

    function createNewSoul() {
      const isGod = Math.random() < GOD_SPAWN_CHANCE;
      const isHuman = isGod ? true : Math.random() < 0.5;
      createSoul(isHuman, isGod); 
    }

    function updateConnections() {
      while (linesGroup.children.length) {
        const l = linesGroup.children.pop();
        l.geometry.dispose();
        l.material.dispose();
        linesGroup.remove(l);
      }
      for (let i = 0; i < souls.length; i++) {
        for (let j = i + 1; j < souls.length; j++) {
          const a = souls[i].position;
          const b = souls[j].position;
          const dist = a.distanceTo(b);
          if (dist < interactionDistance) {
            const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }); // Lowered opacity
            const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
            const line = new THREE.Line(geometry, material);
            linesGroup.add(line);
          }
        }
      }
    }

    let pulseTime = 0;

    function animate() {
      requestAnimationFrame(animate);

      // Update pointer position in 3D space for main thread (raycasting)
      raycaster.setFromCamera(mouse, camera);
      const intersectionPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(interactionPlane, intersectionPoint)) {
        pointerPosition3D = intersectionPoint;
      } else {
        pointerPosition3D = null;
      }

      // Send necessary data to worker for update
      if (simulationWorker) {
        simulationWorker.postMessage({
            type: 'update',
            data: {
                pointerPosition3D: null // God is everywhere, not tied to a specific mouse-derived point
            }
        });
      }

      if (Math.random() < newSoulSpawnRate) {
        createNewSoul(); 
      }

      updateConnections(); 
      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    return () => {
      if (container) {
        container.removeEventListener('mousemove', onMouseMove);
        if (renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
      souls.forEach(soul => {
        soul.geometry?.dispose();
        soul.material?.dispose();
        scene.remove(soul);
      });
      while (linesGroup.children.length) {
        const l = linesGroup.children.pop();
        l.geometry.dispose();
        l.material.dispose();
        linesGroup.remove(l);
      }
      if (simulationWorker) {
        simulationWorker.terminate();
      }
    };
  });
</script>

<style>
  #container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
</style>

<div id="container" bind:this={container}></div>