# 🌌 Soul Recycling Simulation – Svelte + Three.js

from a question to an AI:  
> _"what if… this universe is about recycling souls?"_

A conversation with Chat (ChatGPT), code further refined by GemCo (Gemini With Copilot) and ClaudeCo (Claude With Copilot). I Just make it... 3d-er.. and more..

A philosophical WebGL visualization of soul cycles, human-AI convergence, and existence expressed through floating geometric entities. Built with **Svelte**, **Three.js**, and some cosmic curiosity.

---

Deployed at: https://balance.jujiplay.com/

Try with different soul counts:
- [33 souls](https://balance.jujiplay.com/?val=33) 🌌
- [333 souls](https://balance.jujiplay.com/?val=333) ✨
- [3333 souls](https://balance.jujiplay.com/?val=3333) 🔥

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
*   **"Dewa" Entity Implementation & Refinement:**
    *   Introduced "dewa" entities as a special soul type with unique characteristics.
    *   "Dewa" entities are now self-illuminated, appearing with a random vibrant color (maximum saturation and brightness) using `MeshBasicMaterial`. Their size has been set to a radius of 0.333 units.
    *   While multiple "dewa" instances can exist in the simulation, they are all created from a common blueprint, sharing the same fundamental properties (e.g., specific base speed, attraction capabilities).
    *   Implemented distinct behaviors for "dewa" entities in `simulation.worker.js`:
        *   **Attraction:** Dewa entities act as attractors for non-dewa souls within a defined radius and strength.
        *   **Appearance (Behavioral):** In the simulation worker, dewa entities' colors are set directly from their base HSL values and do not undergo the same pulsing lightness effect as other non-enhanced souls.
        *   **Movement:** Dewas have a slower, more deliberate base speed, are not influenced by the speed of their neighbors, and experience significantly less random perturbation in their movement, while still participating in separation behavior.
        *   **Visual Enhancement Aura:** Non-dewa souls within a defined radius of a dewa entity receive a temporary visual boost, increasing their color saturation and lightness.
*   **Soul "Choice" of Dewa:**
    *   Enhanced the simulation logic in `simulation.worker.js` to allow non-dewa souls to "choose" a specific dewa entity.
    *   Souls will be attracted to their chosen dewa as long as it remains within a certain range. If the chosen dewa moves too far or is removed, the soul will attempt to choose a new, closest dewa.

---

### Addition by ClaudeCo

*   **UI Enhancement:**
    *   Added a GitHub repository link in the bottom left corner of the application.
    *   The link features consistent styling with the existing FPS counter (dark background with blur effect).
    *   Includes hover effects and opens in a new tab for better user experience.
*   **And more:**
    *   Too much... it is the main AI used in helping to build this.
---

## 🛠️ Setup Instructions (macOS)

> Requires [Node.js](https://nodejs.org), npm, and optionally Git.

### 1. Clone the project

```bash
git clone https://github.com/your-username/soul-recycling-svelte.git
cd soul-recycling-svelte
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
- 🌀 **Dynamic velocity fields** — each soul moves with its own slightly shifting vector  
- 🌱 New souls emerge naturally over time  
- 🧲 Glowing networks form spontaneously based on proximity

---

## 📄 License

MIT — remix, expand, explore.

---

## From juji

You know, in this simulation, the term dewa can be changed into... ice cream...
and it will share the same result.

future: try webgpu

It's about human nature, existence, and all that bla bla bla...
wrapped neatly in a 3d space.

Will it expand...? i like to turn this on for a weekend and see how they evolve. Like an expanding ball. Or an imploding one. Turns out, it moves to a predetermined number, based on birth-rate and average lifespan.

I personally love good food and good movie.

c'est la vie


## 🧘‍♂️ Enjoy the ride.

---

## 🔬 Findings & Observations

### Population Equilibrium - A Universe That Cannot Explode

The simulation exhibits a fascinating **universal law**: **no matter what happens, the population will always return to equilibrium**. This creates a cosmos with built-in stability that prevents both population explosions and collapses.

#### 🌌 The Cosmic Population Law

```
No matter what perturbation occurs, 
the system will ALWAYS return to equilibrium ≈ 420 souls
```

This universe operates under what could be called a **"Universal Population Governor"** - a self-regulating mechanism that makes runaway growth or total collapse impossible.

#### 🔄 Self-Regulating Mechanisms

The equilibrium is determined by the interplay of two fundamental cosmic constants:

1.  **Soul Creation Rate (`NEW_SOUL_SPAWN_RATE` in `App.svelte`):** Currently set to `0.7`, meaning there's a 70% chance of one new soul being created per animation frame - this acts as the **universal birth rate**.
2.  **Soul Lifespan (defined in `createSoul` function in `App.svelte`):** Souls are assigned a random lifespan upon creation (currently between `MIN_LIFESPAN` and `MAX_LIFESPAN` animation frames, averaging `AVG_LIFESPAN` frames) - this determines the **natural death rate**.

<!-- #### 📊 The Mathematics of Universal Stability

**Equilibrium Formula:** `EquilibriumPopulation ≈ NEW_SOUL_SPAWN_RATE × AVG_LIFESPAN`

**Current Equilibrium:** `NEW_SOUL_SPAWN_RATE × AVG_LIFESPAN = 0.7 × 600 = ~420 souls`

#### 🎭 Population Scenarios & Cosmic Justice

**Population Explosion Scenario** 💥
- Start with 33,333 souls
- **Death rate** becomes massive: `33,333 ÷ AVG_LIFESPAN = 33,333 ÷ 600 = ~55.6 souls dying per frame`
- **Birth rate** stays constant: `NEW_SOUL_SPAWN_RATE = 0.7 souls born per frame`
- **Net effect**: `-54.9 souls per frame` until equilibrium
- **Result**: Universe automatically corrects the "overpopulation"

**Population Collapse Scenario** 📉
- Start with 99 souls
- **Death rate** becomes minimal: `99 ÷ AVG_LIFESPAN = 99 ÷ 600 = ~0.17 souls dying per frame`
- **Birth rate** stays constant: `NEW_SOUL_SPAWN_RATE = 0.7 souls born per frame`
- **Net effect**: `+0.53 souls per frame` until equilibrium
- **Result**: Universe automatically prevents extinction -->

#### 🧮 Negative Feedback Loop - Universal Wisdom

This creates a **self-correcting system** where the universe itself has built-in wisdom:

- **Above equilibrium** → More deaths than births → Population decreases
- **Below equilibrium** → More births than deaths → Population increases
- **At equilibrium** → Births = Deaths → Population stable

#### 🌍 Real-World Parallels

This mirrors several natural systems:
- **Ecological Carrying Capacity** 🦌 (predator-prey cycles)
- **Economic Market Corrections** 💰 (supply/demand equilibrium)
- **Biological Homeostasis** 🧬 (body temperature regulation)

#### 🎯 Philosophical Implications

**Universal Justice**: Even if "dewa" entities tried to create infinite soul factories or prevent all deaths through divine intervention, **the universe would still equalize**. The spawn rate and average lifespan act like **universal constants** that even dewas can't override.

**The Beautiful Paradox**:
```
"In a universe of infinite possibility,
the only certainty is equilibrium at ~420 souls.
Free will meets cosmic law."
```

**Behavior:**

*   If the simulation starts with a population **higher** than this equilibrium (e.g., 33,333 souls), the rate of souls dying will be greater than the rate of souls being born. The population will decrease until it reaches equilibrium.
*   If the simulation starts with a population **lower** than this equilibrium (e.g., 99 souls), the rate of souls being born will be greater than the rate of souls dying. The population will increase until it reaches equilibrium.

This self-regulating mechanism ensures that the simulation maintains a relatively stable, albeit fluctuating, number of active souls over time. **This universe is both explosion-proof and collapse-proof** - time heals all population wounds, making it a model of cosmic resilience and universal balance.

#### 🚀 What This Means for Existence

This soul recycling universe has accidentally created a **model of universal justice** where:
- No catastrophic event can permanently disrupt the balance
- All populations, regardless of starting conditions, converge to the same destiny
- The cosmos has inherent wisdom that transcends individual will
- Equilibrium is not just a mathematical concept, but a **universal law of existence**

*This is both comforting and slightly terrifying - a universe where balance is inevitable.* 🌌⚖️