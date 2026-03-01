# Project Context Memory

Last updated: 2026-03-01

## Goal
Create a personal software-engineer portfolio website with a 3D immersive scrolling experience and staged content sections.

## Repository Snapshot
- `index.html`: Single-page structure with fixed app container, header/nav, 7 full-screen stages (`hero` to `contact`), CTA links, and `js/main.js` entrypoint.
- `css/styles.css`: Full visual system and responsive behavior (desktop + mobile nav), stage transition styling, hero animations, hidden native scrollbar, and long scroll surrogate via `#scroll-wrapper`.
- `js/main.js`: Core app controller for scroll-to-progress mapping, active stage switching, nav synchronization, smooth anchor navigation, lazy import/boot of immersive scene, resize handling, and scene teardown.
- `js/immersiveScene.js`: Three.js immersive environment driven by scroll progress; includes grid layers, instanced pillars, stream guide lines/pulses, framed geometry, pointer-based parallax, camera keyframe interpolation, and cleanup.
- `js/heroScene.js`: Separate Three.js hero-only network scene module (nodes, edges, pulses, pointer parallax). Present in repo but not imported by current app flow.
- `README.md`: Currently contains only `Sample text` (placeholder).
- `assets/resume.pdf`: Empty file (`0` bytes) acting as a placeholder target for Resume links.

## Runtime Flow
1. Page renders fixed viewport app (`#app-container`) and a tall `#scroll-wrapper` (`700vh`) to capture native scroll.
2. `main.js` maps `window.scrollY` to normalized progress `[0,1]`.
3. Progress is quantized to 7 stages (`hero`, `about`, `tech-stack`, `experience`, `architecture-philosophy`, `projects`, `contact`).
4. Active stage class and nav `is-active` state are updated.
5. Progress is passed to immersive Three.js scene (`updateProgress`) to move camera through keyframed zones.
6. Header style changes after slight scroll; hero scroll-indicator hides after early progress.

## Visual / UX Direction
- Theme: dark blue-steel background with warm sand accent (`#d6c2a1`).
- Typography: Playfair Display for headings, Inter for body.
- Experience style: cinematic, architecture-focused, motion-led storytelling through stage transitions + 3D depth.

## Current Implementation Notes
- Scene import is runtime dynamic (`import('./immersiveScene.js')`), improving initial script cost.
- Scroll logic uses `requestAnimationFrame` throttling and small epsilon guard to avoid redundant updates.
- Mobile behavior lowers rendering load (reduced antialiasing/pixel ratio and fewer scene instances).
- Accessibility elements present: skip-link, semantic landmarks, aria labels/current state, reduced-motion media query support.

## Gaps / Risks
- `assets/resume.pdf` is empty, so Resume/Download links currently open a blank file.
- `README.md` is placeholder and does not document setup, architecture, or customization.
- `js/heroScene.js` is not wired into `main.js` (possible dead/experimental module unless intentionally reserved).
- External Three.js dependency is loaded from unpkg CDN (network/runtime dependency; no local fallback).

## Likely Next Tasks
- Replace placeholder resume PDF with real document.
- Expand `README.md` with project purpose, local run instructions, and architecture notes.
- Decide whether to remove or integrate `heroScene.js`.
- Populate each stage with concrete portfolio content (projects, impact, stack, contact channels).
- Add performance QA pass for lower-end mobile devices.
