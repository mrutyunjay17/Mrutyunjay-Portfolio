# 3D Portfolio — Project Context

## Project Goal
Build an immersive **3D interactive portfolio website** where users scroll through a futuristic highway.
The camera travels along a **zigzag spline road** and explores 7 section checkpoints:

- About
- Experience
- Projects
- Skills
- Architecture
- Achievements
- Contact

The project targets smooth modern-browser performance and Netlify-friendly deployment.

---

## Tech Stack
### Core Framework
- React (Vite)
- React Three Fiber

### 3D + Rendering
- three
- @react-three/fiber
- @react-three/drei
- @react-three/postprocessing (Bloom)

### Animation + UI
- framer-motion
- gsap (installed)

### Styling
- CSS (project styles in `src/index.css`)
- Tailwind is installed but not actively driving current visuals

---

## New Summary (Current State)
The experience is now a **scroll-driven cyberpunk road journey** with:

- a dark wet-asphalt road (procedural texture)
- neon lane/edge lines with subtle breathing glow
- section-aware fade cutoff so road elements disappear into black fog at distance
- world-space floating HUD cards for sections
- always-visible subHUD cards (within current fade region)
- procedural roadside buildings on both sides with floor-wise window lights
- digital banner windows on many buildings (currently high frequency)

Camera motion remains spline-based with smooth interpolation.

---

## Updated Summary of What Changed
### Removed / Replaced from Earlier Concept
- Removed floating torus portal-ring checkpoints as the primary section marker.
- Removed click-to-expand subsection workflow (button-triggered behavior).
- Removed the older glass/fresnel violet-road direction as the main road style.

### Added / Changed in Current Build
- Added **WorldSectionNode** cards as checkpoint UI in 3D space.
- Subsections are now shown without button interaction.
- Added **section-aware visibility cutoff** for road depth behavior.
- Added procedural **RoadsideBuildings** with:
  - clustered + standalone placement rhythm
  - wave-based height variation across route
  - small window lights
  - large digital banners on a subset of buildings
- Added neon border lines for non-banner buildings.

---

## Scene Systems (Current)
### Road
- CatmullRom spline road path with subtle elevation changes.
- Road mesh generated from spline frames (`point`, `tangent`, `normal`).
- Material tuned toward darker cyberpunk asphalt (less glass, more realistic shading).

### Lines + Fog Cutoff
- Neon lane and edge lines sampled along spline.
- Visibility cutoff:

```txt
endT = t(x+1) + 0.2 * (t(x+2) - t(x+1))
```

where `x` is current active section index.

- Road, lines, and particles are clipped/faded based on this range so distant content falls into black fog.

### Section HUD
- Main section card rendered in world space (HTML in 3D).
- SubHUD cards are corner-attached and animated.
- Section cards in fade region remain visible.

### Buildings
- Generated procedurally on both road sides (non-mirrored randomness).
- Natural cadence: connected runs + standalone gaps.
- Dynamic heights with wave tendency across sections.
- Window cubes and digital banners provide skyline lighting language.

### Camera
- Scroll progress drives camera progression along spline.
- Position and look-at smoothing for cinematic glide.

---

## Current Visual Composition
```txt
dark black cyberpunk highway
neon red lane lines
neon cyan edge rails
black fog depth fade
floating world HUD section cards
procedural roadside city blocks
window + banner lighting accents
```

---

## Known Notes
- Tailwind content configuration warning exists in build output.
- Bundle size warning exists in build output (chunk-size threshold).

---

## Next Planned Areas
1. Replace placeholder section/subsection copy with real portfolio content.
2. Add richer material/lighting polish for buildings (facade variation, light flicker zones).
3. Improve performance budget via further instancing/LOD strategies.
4. Add mobile-specific readability tuning for world HUD clusters.
5. Final deployment hardening and optimization for Netlify.
