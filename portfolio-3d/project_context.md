# 3D Portfolio — Project Context

## Project Goal

Build an immersive **3D interactive portfolio website** where users scroll through a futuristic highway.
The camera travels along a **zigzag spline road**, visiting **7 checkpoints** representing sections of the portfolio.

Each checkpoint will later display:

* About
* Experience
* Projects
* Skills
* Architecture
* Achievements
* Contact

The project is designed to be **deployable on Netlify** and optimized for **smooth performance on modern browsers**.

---

# Tech Stack

### Core Framework

* React (Vite project)
* React Three Fiber (Three.js React renderer)

### 3D Libraries

* three
* @react-three/fiber
* @react-three/drei

### Animation

* gsap
* framer-motion

### Styling

* TailwindCSS v3

### Tooling

* Node v22
* VSCode
* Chrome + Three.js DevTools

---

# Scene Concept

The UI represents a **futuristic cyberpunk highway floating in a dark void**.

User scrolling drives the **camera forward along the road**.

```
scroll down → camera moves forward
scroll up → camera moves backward
```

---

# Visual Design

### Environment

* Background: pure black (#000000)
* Fog: black cinematic fog for distance fading

```
near road → visible
far road → fades into darkness
```

---

# Road Design

### Style

Glass holographic cyberpunk road.

### Layout

Highway style.

* multiple lanes
* solid neon lane dividers
* cyan edge rails

### Road Material

Custom **Fresnel glass shader**

Properties:

```
center → semi transparent violet
edges → glowing violet
```

Shader includes:

* fresnel glow
* fog support
* depth gradient

---

# Road Path

The road follows a **CatmullRom spline**.

Instead of random curves, the path is intentionally designed.

Structure:

```
Checkpoint 1
→ right turn
→ straight
Checkpoint 2
→ straight
Checkpoint 3
→ upward elevation
Checkpoint 4
→ downward elevation
→ straight
Checkpoint 5
→ left turn
→ straight
→ upward elevation
→ downward elevation
Checkpoint 6
→ straight
Checkpoint 7
```

Elevation is **subtle**, not roller-coaster style.

---

# Camera System

Camera follows the **center of the spline**.

Implementation uses:

```
curve.getPointAt(t)
curve.getTangentAt(t)
```

Camera position:

```
camera = point - tangent * offset
```

Look target:

```
curve.getPointAt(t + lookAhead)
```

Motion smoothing uses interpolation for cinematic movement.

Result:

```
camera glides smoothly along road
```

---

# Checkpoints

Checkpoints are **floating portal rings**.

Design:

```
vertical rings
pink glow
slightly above road
```

Position calculated from spline:

```
curve.getPointAt(t)
```

Then elevated slightly:

```
y + 1
```

---

# Energy Streaks

Small particles moving along the road to reinforce motion.

Characteristics:

* distributed across all lanes
* follow road spline
* move continuously forward

Implementation:

```
curve.getPointAt(t)
curve.getTangentAt(t)
cross product → lane offset
```

---

# Lane Lines

Lane dividers are:

* solid
* subtle blue
* non-animated
* minimal glow

Purpose: visual guidance without clutter.

---

# Edge Rails

Road edges use **thicker cyan neon strips**.

Purpose:

* define road boundary
* add cyberpunk aesthetic
* work with bloom effect

---

# Fog System

Black fog used to fade distant geometry.

Parameters:

```
fog near ≈ 60–80
fog far ≈ 220–260
```

Custom shaders updated to support fog blending.

---

# Current Visual Composition

```
floating violet glass highway
cyan neon rails
subtle blue lane dividers
energy streak particles
pink checkpoint rings
black void background
cinematic fog fade
```

---

# Next Planned Features

1. Portfolio UI panels appearing at checkpoints
2. Scroll-driven section activation
3. Project cards (3D interactive)
4. Skill visualization
5. mobile performance optimizations
6. Netlify deployment configuration

---

# Long-Term Vision

Final experience should feel like:

```
navigating through a futuristic digital highway
exploring career milestones along the road
```

Goal: a **memorable developer portfolio experience** rather than a static webpage.
