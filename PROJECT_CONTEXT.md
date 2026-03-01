# Project Context Memory

Last updated: 2026-03-01

## Goal (Current)
Build a software-engineer portfolio with an immersive full-screen scroll experience and section-based storytelling, using a clean minimal background as a base for future per-section visual layering.

## Current State Summary
- The page currently uses a **minimal executive visual style** (no visible 3D objects).
- Immersive architecture is preserved: fixed viewport, long scroll surrogate, progress mapping, stage activation, and active nav syncing.
- `immersiveScene.js` is now a lightweight progress/camera-state module (no Three.js rendering).
- Stage enter/exit transitions are now more deliberate with separate active/leaving states.

## Repository Snapshot
- `index.html`: Single-page structure with fixed app container, header/nav, 7 full-screen stages (`hero` to `contact`), CTA links, and `js/main.js` entrypoint.
- `css/styles.css`: Typography/theme, responsive nav, stage transitions, hero styling, hidden native scrollbar, and minimal background treatment.
- `js/main.js`: Scroll-to-progress mapping, stage/nav activation, smooth anchor navigation, dynamic scene module import, resize handling, and teardown.
- `js/immersiveScene.js`: Minimal immersive engine with lerped progress and neutral camera-like state only; no geometry/material/lights/fog/rendering.
- `js/heroScene.js`: Legacy/experimental Three.js hero scene module still present but not used.
- `README.md`: Placeholder (`Sample text`).
- `assets/resume.pdf`: Empty file (`0` bytes).

## Runtime Flow
1. `#app-container` stays fixed to viewport.
2. `#scroll-wrapper` (`700vh`) provides native scrolling distance.
3. `main.js` maps `window.scrollY` to normalized progress `[0,1]`.
4. Progress snaps to 7 stage indices and updates active section/nav state.
5. Stage enter/exit classes (`is-active`, `is-leaving`) drive transition animation.
6. Progress is passed to `immersiveScene.updateProgress()` for smooth internal interpolation (future background hooks).
7. Header and hero indicator update based on progress thresholds.

## Visual / UX Direction (Current)
- Base background:
  - `linear-gradient(180deg, #1F2A35 0%, #1B2530 100%)`
  - plus subtle vignette `radial-gradient(circle at center, rgba(255,255,255,0.02), transparent 60%)`
- No patterns, no 3D shapes, no glow/bloom.
- Tone: minimal, professional, architectural.

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
- Previous 3D world rendering path has been removed.
- No Three.js render loop/geometry draw overhead in current background implementation.
- RAF is retained only for smooth progress interpolation in the minimal immersive module.

## Known Gaps / Risks
- `README.md` remains undocumented (setup/architecture missing).
- Resume link targets an empty PDF (`assets/resume.pdf`).
- `js/heroScene.js` is currently unused and may create confusion unless removed or reintegrated intentionally.
- `window.PortfolioApp.features.threeReady` is still `false` and could be renamed for clarity now that scene is non-Three.js.

## Practical Next Steps
- Decide the next background strategy per stage (subtle gradients, abstract motion layers, or section-specific visual tokens).
- Document architecture and run instructions in `README.md`.
- Replace placeholder resume PDF.
- Either remove `js/heroScene.js` or explicitly mark it as archived/experimental.
