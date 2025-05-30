<script>

  // Add gentle interaction between pointer and nearby souls:
  // - Use raycaster to find a 3D point under the mouse
  // - For each human soul near that point, ease its velocity toward the pointer
  // - Keep the soul's original velocity logic but blend (lerp) toward the new direction
  // - Only affect souls within a certain distance threshold (e.g., 10 units)

  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  let container;

  onMount(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 30, 60);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enable damping
    controls.dampingFactor = 0.01; // Adjusted damping factor (was 0.01)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    scene.add(new THREE.DirectionalLight(0xffffff, 1));

    // Center red sphere - Commented out for debugging
    /*
    const centerSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 32, 32), // Reverted size
      new THREE.MeshBasicMaterial({ color: 0xff0000 }) // Reverted material
    );
    scene.add(centerSphere);
    */

    const recycledSoulCount = 333;       // Increased number
    const newSoulSpawnRate = 0.05;       // higher spawn rate
    const interactionDistance = 6;
    const souls = [];
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);

    const soulCycleRadius = 20;

    const humanGeometry = new THREE.SphereGeometry(0.15, 16, 16);  // made smaller
    const gptGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);     // made smaller

    const humanBaseHue = Math.random();
    const gptBaseHue = (humanBaseHue + 0.5) % 1;

    // Pointer interaction variables
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerPosition3D = null; // Will hold the 3D intersection point
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Interact on XZ plane at y=0
    const POINTER_INTERACTION_RADIUS = 10;
    const POINTER_INFLUENCE_STRENGTH = 0.05; // How strongly pointer pulls souls

    // Neighbor speed influence variables
    const NEIGHBOR_SPEED_INFLUENCE_RADIUS = 5; // How close for speed to be influenced
    const NEIGHBOR_SPEED_INFLUENCE_STRENGTH = 0.1; // How much neighbors\' speed influences current soul

    // Boids-like separation variables
    const SEPARATION_DISTANCE = 1.5; // How close another soul needs to be to trigger separation
    const SEPARATION_STRENGTH = 0.05; // How strongly souls will push away

    function onMouseMove(event) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    container.addEventListener('mousemove', onMouseMove);


    function createSoul(isHuman, angle = 0, speed = 0) { // Removed 'recycled' parameter
      const geometry = isHuman ? humanGeometry : gptGeometry;
      const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8 });

      const baseHue = isHuman ? humanBaseHue : gptBaseHue;
      const hueOffset = Math.random() * 0.3 - 0.15;
      const h = (baseHue + hueOffset + angle / (2 * Math.PI)) % 1;
      const s = 1;
      const l = 0.56; // Increased lightness from 0.6 to 0.75 // changed again to 0.56
      material.color.setHSL(h, s, l);

      const mesh = new THREE.Mesh(geometry, material);

      // All souls created with the same initial positioning logic
      const radius = 10 + Math.random() * 10;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      mesh.position.set(x, y, z);

      const currentSpeed = speed === 0 ? (0.05 + (Math.random() * .03)) : speed; // Increased speed
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5)
      ).normalize().multiplyScalar(currentSpeed);

      mesh.userData = {
        angle,
        speed: currentSpeed, // Store the actual speed being used
        isHuman,
        flickerPhase: Math.random() * Math.PI * 2,
        life: 0,
        baseHSL: { h, s, l },
        velocity: velocity // Store the velocity vector
      };
      scene.add(mesh);
      souls.push(mesh);
    }

    for (let i = 0; i < recycledSoulCount; i++) {
      const angle = (i / recycledSoulCount) * Math.PI * 2;
      const isHuman = Math.random() < 0.6;

      // give some of them speed super power
      const speed = Math.random() < 0.1 ?  0.05 + Math.random() * 0.25 : 0.05 + Math.random() * 0.025; // Increased speed
      
      createSoul(isHuman, angle, speed); // Removed 'true' for recycled
    }

    function createNewSoul() {
      const isHuman = Math.random() < 0.5;
      createSoul(isHuman);
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
      requestAnimationFrame(animate); // Moved to the top as per common practice

      // Update pointer position in 3D space
      raycaster.setFromCamera(mouse, camera);
      const intersectionPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(interactionPlane, intersectionPoint)) {
        pointerPosition3D = intersectionPoint;
      } else {
        pointerPosition3D = null; // No intersection
      }

      pulseTime += 0.02;
      const pulse = (Math.sin(pulseTime * 2) + 1) / 2;

      souls.forEach(soul => {
        // === Start: Speed influence from neighbors ===
        let influencedSpeed = soul.userData.speed; // Start with its own speed

        souls.forEach(otherSoul => {
            if (soul === otherSoul) return; // Don\'t interact with self

            const distanceToNeighbor = soul.position.distanceTo(otherSoul.position);
            if (distanceToNeighbor < NEIGHBOR_SPEED_INFLUENCE_RADIUS) {
                influencedSpeed = THREE.MathUtils.lerp(
                    influencedSpeed,
                    otherSoul.userData.speed, // Speed of the *other* soul
                    NEIGHBOR_SPEED_INFLUENCE_STRENGTH
                );
            }
        });
        soul.userData.speed = influencedSpeed; // Update the soul\'s speed with the influenced value
        // === End: Speed influence from neighbors ===

        const { velocity, speed: soulSpeed, isHuman } = soul.userData; // soulSpeed is now the influenced speed
        
        // === Start: Separation from neighbors ===
        const separationForce = new THREE.Vector3();
        souls.forEach(otherSoul => {
            if (soul === otherSoul) return;

            const distanceToNeighbor = soul.position.distanceTo(otherSoul.position);
            if (distanceToNeighbor > 0 && distanceToNeighbor < SEPARATION_DISTANCE) {
                // Calculate force vector away from neighbor
                const awayVector = new THREE.Vector3().subVectors(soul.position, otherSoul.position);
                awayVector.normalize(); // Get direction
                // Inverse proportion to distance: closer means stronger repulsion
                // Add a small epsilon to distanceToNeighbor to avoid division by zero if they are exactly at the same spot (though unlikely with floats)
                awayVector.divideScalar(distanceToNeighbor + 0.0001); 
                separationForce.add(awayVector);
            }
        });
        if (separationForce.lengthSq() > 0) { 
            velocity.add(separationForce.multiplyScalar(SEPARATION_STRENGTH));
        }
        // === End: Separation from neighbors ===

        // Slightly perturb the velocity to change direction smoothly
        velocity.x += (Math.random() - 0.5) * 0.2; // Adjust this factor for more/less rapid changes
        velocity.y += (Math.random() - 0.5) * 0.2;
        velocity.z += (Math.random() - 0.5) * 0.2;

        // Pointer interaction logic
        if (pointerPosition3D && isHuman) {
          const distanceToPoint = soul.position.distanceTo(pointerPosition3D);
          if (distanceToPoint < POINTER_INTERACTION_RADIUS) {
            const directionToPoint = new THREE.Vector3().subVectors(pointerPosition3D, soul.position).normalize();
            const targetVelocity = directionToPoint.multiplyScalar(soulSpeed);
            velocity.lerp(targetVelocity, POINTER_INFLUENCE_STRENGTH);
          }
        }

        // Normalize to maintain consistent speed and apply the soul's specific speed
        velocity.normalize().multiplyScalar(soulSpeed);

        soul.position.add(velocity);

        // Keep existing flicker and color animation
        const flicker = 0.5 + 0.5 * Math.sin(pulseTime * 3 + soul.userData.flickerPhase);
        soul.material.opacity = 0.5 + 0.5 * flicker;

        const base = soul.userData.baseHSL;
        const newLightness = Math.min(Math.max(base.l + 0.2 * (pulse - 0.5), 0), 1);
        soul.material.color.setHSL(base.h, base.s, newLightness);

        soul.userData.life++; // Still incrementing life, can be used for other purposes
      });

      if (Math.random() < newSoulSpawnRate) {
        createNewSoul();
      }

      updateConnections();
      controls.update();
      renderer.render(scene, camera);
      // requestAnimationFrame(animate); // Moved to the top
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
      container.removeChild(renderer.domElement);
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