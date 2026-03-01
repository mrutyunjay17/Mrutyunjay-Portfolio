# Project Context Memory

Last updated: 2026-03-01

## Goal (Current)
Build a software-engineer portfolio with an immersive full-screen scroll experience and section-based storytelling using a uniform zoom/fade transition model across all sections.

## Current State Summary
- The page currently uses a **minimal executive visual style** with controlled 3D transition elements only in the immersive background layer.
- Immersive architecture is preserved: fixed viewport, long scroll surrogate, progress mapping, stage activation, and active nav syncing.
- `immersiveScene.js` now renders a lightweight Three.js immersive transition scene centered on a wireframe globe (fiber stage removed).
- Stage enter/exit transitions are now more deliberate with separate active/leaving states.
- Theme has been updated to a **neutral Obsidian black system** (no blue/purple tint, no decorative overlays).
- Hero now includes a **macOS-style browser UI shell** overlay (opaque top bar + transparent content area) wrapped around existing hero content.
- All section transitions now follow one rule:
  - outgoing section scales `1 -> 1.6` and fades `1 -> 0`
  - incoming section starts only after outgoing reaches 70% fade (`opacity <= 0.3`)
  - incoming section settles `opacity 0 -> 1`, `scale 0.96 -> 1`.
- Reverse scroll is symmetric by the same interpolation model (no separate time-based animation path).
- Globe visuals remain tied to Section 2 lifecycle only and fade/scale with Section 2 transition state.

## Repository Snapshot
- `index.html`: Single-page structure with fixed app container, header/nav, 7 full-screen stages (`hero` to `contact`), hero wrapped in a browser-frame shell, CTA links, and `js/main.js` entrypoint.
- `css/styles.css`: Typography/theme, responsive nav, hero/browser-shell styling, neutral Obsidian background system, and stage perspective/depth transform settings for scroll-driven section interpolation.
- `js/main.js`: Scroll-to-progress mapping, stage/nav activation, smooth anchor navigation, dynamic scene module import, and a global section-blend engine (70% threshold, scale/opacity interpolation for all adjacent section pairs).
- `js/immersiveScene.js`: Three.js immersive scene with Section-2-exclusive globe; opacity/scale are now driven by Section 2 state from the global section-blend engine.
- `js/heroScene.js`: Legacy/experimental Three.js hero scene module still present but not used.
- `README.md`: Placeholder (`Sample text`).
- `assets/resume.pdf`: Empty file (`0` bytes).

## Runtime Flow
1. `#app-container` stays fixed to viewport.
2. `#scroll-wrapper` (`700vh`) provides native scrolling distance.
3. `main.js` maps `window.scrollY` to normalized progress `[0,1]`.
4. Progress snaps to 7 stage indices and updates active section/nav state.
5. Stage enter/exit classes (`is-active`, `is-leaving`) drive transition animation.
6. For each normalized section segment `[i -> i+1]`, transition interpolation is computed from segment progress `t`:
   - outgoing `opacity = 1 - t`, `scale = 1 + 0.6*t`
   - incoming begins at `t >= 0.7`:
     - `nextOpacity = (t - 0.7) / 0.3`
     - `nextScale = 0.96 + nextOpacity * 0.04`
7. The same interpolation applies in reverse scroll automatically by decreasing `t`, producing outward-exit symmetry.
8. Progress plus Section 2 opacity/scale are passed to `immersiveScene.updateProgress(progress, sectionState)` so globe lifecycle matches Section 2 exactly.
9. Header and hero indicator update based on progress thresholds.

## Visual / UX Direction (Current)
- Base background:
  - `linear-gradient(180deg, #0A0A0C 0%, #121214 100%)`
  - fixed attachment for depth continuity with immersive scroll.
- Section treatment:
  - all stages transparent by default
  - subtle separator `border-top: 1px solid rgba(255,255,255,0.05)`.
- Header on scroll:
  - `background: rgba(10, 10, 12, 0.85)`
  - `backdrop-filter: blur(10px)`
  - `border-bottom: 1px solid var(--border-subtle)`.
- Hero browser shell:
  - frame is transparent with subtle border/shadow
  - topbar is opaque (`#161618`) with macOS traffic lights and minimal nav/search UI
  - content area is transparent so hero retains the exact page background.
- Immersive internet transition:
  - direct globe fade-in after hero exit (no intermediate fiber visuals)
  - globe size reduced (~20%) for cleaner composition
  - softer base line visibility with restrained accent longitudes
  - globe rotates very slowly with subtle node presence and a faint link pulse
  - globe exists only during Section 2 dominance and exits with Section 2 via synchronized scale/fade.
- No radial highlights, no patterns, no texture noise, no glow/bloom.
- Tone: ultra-dark, minimal, premium, architect-grade.

## Transition System
- Enter (`.stage` -> `.is-active`):
  - Opacity `0 -> 1`
  - Transform `translateY(30px) -> translateY(0)`
  - `400ms` with easeOutCubic-like curve `cubic-bezier(0.215, 0.61, 0.355, 1)`
- Exit (`.is-leaving`):
  - Opacity `1 -> 0`
  - Transform `translateY(0) -> translateY(-20px)`
  - `300ms`

## Performance Notes
- Three.js render path is active only for immersive transition visuals and uses low-to-moderate geometry complexity.
- Globe is line-based with limited rings/segments; no bloom, HDR, shadows, or heavy post-processing.
- All fiber geometry/animation code has been removed to reduce scene complexity.
- Browser and content transitions use GPU-friendly CSS transforms/opacity driven by existing scroll progress updates.
- Existing scroll architecture remains intact (fixed viewport + surrogate scroll + normalized progress mapping).
- Stage transitions are scroll-driven (not timer-based) and use transform/opacity only for 60fps stability.

## Known Gaps / Risks
- `README.md` remains undocumented (setup/architecture missing).
- Resume link targets an empty PDF (`assets/resume.pdf`).
- `js/heroScene.js` is currently unused and may create confusion unless removed or reintegrated intentionally.
- `window.PortfolioApp.features.threeReady` is now `true`; naming may still be refined if feature flags expand.

## Practical Next Steps
- Add future 3D overlays only when ready, keeping this neutral background as the visual foundation.
- Document architecture and run instructions in `README.md`.
- Replace placeholder resume PDF.
- Either remove `js/heroScene.js` or explicitly mark it as archived/experimental.
