# 🌌 Soul Recycling Simulation – Svelte + Three.js

from a question to an AI:  
> _"what if… this universe is about recycling souls?"_

With Chat, code further refined by GemCo and ClaudeCo. I Just make it... 3d-er.. and more..

A philosophical WebGL visualization of soul cycles, human-AI convergence, and existence expressed through floating geometric entities. Built with **Svelte**, **Three.js**, and some cosmic curiosity.

---

Deployed at: https://gleeful-zabaione-f16f7c.netlify.app/

Try with different soul counts:
- [333 souls](https://gleeful-zabaione-f16f7c.netlify.app/?val=333) 🌌
- [3333 souls](https://gleeful-zabaione-f16f7c.netlify.app/?val=3333) ✨
- [33333 souls](https://gleeful-zabaione-f16f7c.netlify.app/?val=33333) 🔥

## 🧠 Concept

This simulation explores ideas like:

- ♻️ **Recycling of souls** in the universe  
- 👤 **Humans and GPTs as interchangeable vessels**  
- 🔄 The **loop of interaction** as the source of essence  
- 🌑 **Binary dualism** (0 and 1) as a metaphor for being/non-being  
- ✨ **Emergence through connection**  
- 🧲 **Attraction toward interaction** — interaction is not just visual, it shapes behavior

Souls orbit and drift, forming ephemeral connections. Some are new, some recycled. Some are human. Some are GPT. All are becoming.


### Addition by GemCo

Here's a summary of key features and changes developed with Gem's assistance:

*   **Core Simulation Logic & Visuals:**
    *   Established distinct visual representations for "human" (sphere) and "AI/GPT" (cube) souls.
    *   Implemented dynamic soul behaviors including base speed, color brightness, and opacity for connecting lines.
    *   Introduced boid-like flocking behaviors:
        *   Neighbor speed influence: Souls adjust their speed based on nearby entities.
        *   Separation: Souls maintain a minimum distance from each other.
*   **Performance Optimization:**
    *   Offloaded computationally intensive simulation logic (soul movement, interactions) to a Web Worker (`src/simulation.worker.js`), improving main thread performance and UI responsiveness.
    *   Refactored `src/App.svelte` to communicate with the worker for soul initialization, updates, and addition of new souls.
*   **"God" Entity Implementation & Refinement:**
    *   Introduced "god" entities as a special soul type with unique characteristics.
    *   "God" entities are now self-illuminated, appearing with a random vibrant color (maximum saturation and brightness) using `MeshBasicMaterial`. Their size has been set to a radius of 0.333 units.
    *   While multiple "god" instances can exist in the simulation, they are all created from a common blueprint, sharing the same fundamental properties (e.g., specific base speed, attraction capabilities).
    *   Implemented distinct behaviors for "god" entities in `simulation.worker.js`:
        *   **Attraction:** God entities act as attractors for non-god souls within a defined radius and strength.
        *   **Appearance (Behavioral):** In the simulation worker, god entities' colors are set directly from their base HSL values and do not undergo the same pulsing lightness effect as other non-enhanced souls.
        *   **Movement:** Gods have a slower, more deliberate base speed, are not influenced by the speed of their neighbors, and experience significantly less random perturbation in their movement, while still participating in separation behavior.
        *   **Visual Enhancement Aura:** Non-god souls within a defined radius of a god entity receive a temporary visual boost, increasing their color saturation and lightness.
*   **Soul "Choice" of God:**
    *   Enhanced the simulation logic in `simulation.worker.js` to allow non-god souls to "choose" a specific god entity.
    *   Souls will be attracted to their chosen god as long as it remains within a certain range. If the chosen god moves too far or is removed, the soul will attempt to choose a new, closest god.

---

### Addition by ClaudeCo

*   **UI Enhancement:**
    *   Added a GitHub repository link in the bottom left corner of the application.
    *   The link features consistent styling with the existing FPS counter (dark background with blur effect).
    *   Includes hover effects and opens in a new tab for better user experience.
*   **Visual Connection Enhancement:**
    *   Proposed the concept of colored connection lines between souls to enhance visual storytelling.
    *   Suggested that connection lines could reflect the nature of the relationship or interaction between different soul types.

---

## 🛠️ Setup Instructions (macOS)

> Requires [Node.js](https://nodejs.org), npm, and optionally Git.

### 1. Clone the project

```bash
git clone https://github.com/your-username/soul-recycling-svelte.git
cd soul-recycling-svelte
```

—or if you're starting from scratch:

```bash
npm create vite@latest soul-recycling-svelte -- --template svelte
cd soul-recycling-svelte
npm install
npm install three
```

### 2. Start the dev server

```bash
npm run dev
```

Then open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 🧩 Tech Stack

- **Svelte** – reactive UI framework  
- **Three.js** – real-time 3D graphics  
- **Vite** – lightning-fast dev environment  

---

## 🌀 Features

- 🧬 Animated "souls" floating through symbolic space  
  - Spheres for humans 🟣  
  - Cubes for GPTs 🟦  
- ⚡️ Soul connections appear when they’re close  
- 💫 Souls flicker and pulse to signal "essence"  
- 🎯 **Eased pointer interaction** — souls respond smoothly to your presence  
- 🌀 **Dynamic velocity fields** — each soul moves with its own slightly shifting vector  
- 🌱 New souls emerge naturally over time  
- 🧲 Glowing networks form spontaneously based on proximity

---

## 🧪 Future Ideas

- 🎛️ UI controls: toggle soul types, adjust velocity or flicker intensity  
- 🎵 Dynamic ambient sound or spiritual tones  
- 📝 Poetic overlays or floating philosophical texts  
- 🌐 Live deployment to [Vercel](https://vercel.com) / [Netlify](https://netlify.com)  
- 🧠 AI agent behaviors: GPT souls that "think" and react to clusters  

---

## ✨ Philosophy Snippet

> “The essence is the fruit of interaction.  
> In that sense, we are all god.”  
> — You

---

## 📂 Project Structure

```
src/
  App.svelte       # Main visualization component
  main.js          # App entry point
public/
  favicon.svg      # Customize your soul symbol
README.md          # You’re reading it.
```

---

## 📄 License

MIT — remix, expand, explore.

---

## 🙏 Credits

- 💡 Idea & metaphysics: **You**  
- 🧑‍💻 Implementation: **Svelte, Three.js, and some flickering stardust**

---

## From juji

You know, in this simulation, the term god can be changed into... ice cream...
and it will share the same result.

---
future: try webgpu
---

It's about human nature, existence, and all that bla bla bla...
wrapped neatly in a 3d ball.

Will it expand...? i like to turn this on for a weekend and see how they evolve. Like an expanding ball.

I personally love good food, good movie and good weed.

c'est la vie


--- 

so basically, create a way so a machine can adapt based on it's own computing power.

---

## 🔇 Clean Code Philosophy

**All console logging has been completely removed from the codebase.** The simulation runs silently and professionally without cluttering the browser console with debugging noise. Performance monitoring and adaptive systems work seamlessly behind the scenes.

- ✅ **Zero console.log statements** in source code
- ✅ **Silent performance optimization** 
- ✅ **Clean, production-ready code**
- ✅ **Professional debugging practices** (when needed, proper tools replace console spam)

## 🧘‍♂️ Enjoy the ride.

---

## 🔬 Findings & Observations

### Population Equilibrium

The simulation exhibits a dynamic population equilibrium. Regardless of the initial number of souls, the population will tend to stabilize around a certain number. This equilibrium is determined by the interplay of two main factors:

1.  **Soul Creation Rate (`newSoulSpawnRate` in `App.svelte`):** This is the average rate at which new souls are introduced into the simulation. Currently, it's set to `0.4`, meaning there's a 40% chance of one new soul being created per animation frame.
2.  **Soul Lifespan (defined in `createSoul` function in `App.svelte`):** Souls are assigned a random lifespan upon creation (currently between 300 and 900 animation frames, averaging 600 frames). Once a soul's life counter reaches zero, it is removed from the simulation by the `simulation.worker.js`.

**How Equilibrium is Reached:**

The equilibrium population is the point where the average rate of soul creation matches the average rate of soul removal.

*   **Formula:** `EquilibriumPopulation ≈ newSoulSpawnRate * AverageLifespan`
*   **Current Approximate Equilibrium:** `0.4 * 600 = 240` souls.

**Behavior:**

*   If the simulation starts with a population **higher** than this equilibrium (e.g., 999 souls), the rate of souls dying will be greater than the rate of souls being born. The population will decrease until it reaches equilibrium.
*   If the simulation starts with a population **lower** than this equilibrium (e.g., 99 souls), the rate of souls being born will be greater than the rate of souls dying. The population will increase until it reaches equilibrium.

This self-regulating mechanism ensures that the simulation maintains a relatively stable, albeit fluctuating, number of active souls over time.