const STAGE_IDS = [
  "hero",
  "about",
  "tech-stack",
  "experience",
  "architecture-philosophy",
  "projects",
  "contact",
];

const appContainer = document.getElementById("app-container");
const scrollWrapper = document.getElementById("scroll-wrapper");
const sceneRoot = document.getElementById("scene-root");
const header = document.querySelector(".site-header");
const stageElements = Array.from(document.querySelectorAll(".stage"));
const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
const heroIndicator = document.getElementById("hero-indicator");
const heroBrowserFrame = document.getElementById("hero-browser-frame");
const heroStage = document.getElementById("hero");

const isMobile = () => window.innerWidth < 768;
const TRANSITION_THRESHOLD = 0.7;
const CURRENT_SCALE_MAX = 1.6;
const NEXT_SCALE_MIN = 0.96;

let scrollRange = 1;
let currentProgress = 0;
let lastAppliedProgress = -1;
let currentStageIndex = 0;
let immersiveScene = null;
let immersiveModule = null;
let ticking = false;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const recalcScrollRange = () => {
  scrollRange = Math.max(1, scrollWrapper.offsetHeight - window.innerHeight);
};

const getProgressFromScroll = () => clamp(window.scrollY / scrollRange, 0, 1);

const getStageIndexFromProgress = (progress) => {
  const count = STAGE_IDS.length - 1;
  if (progress <= 0) return 0;
  if (progress >= 1) return count;

  const scaled = progress * count;
  const from = clamp(Math.floor(scaled), 0, count - 1);
  const t = scaled - from;
  return t >= TRANSITION_THRESHOLD ? from + 1 : from;
};

const stageIndexToScrollTop = (index) => {
  const count = STAGE_IDS.length - 1;
  const stageProgress = count === 0 ? 0 : index / count;
  return Math.round(stageProgress * scrollRange);
};

const setActiveNav = (stageId) => {
  navLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${stageId}`;
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const setActiveStage = (index) => {
  stageElements.forEach((stage, idx) => {
    stage.classList.toggle("is-active", idx === index);
    stage.classList.remove("is-leaving");
  });
  currentStageIndex = index;
  setActiveNav(STAGE_IDS[index]);
};

const updateIndicator = (progress) => {
  if (!heroIndicator) return;
  heroIndicator.classList.toggle("is-hidden", progress > 0.05);
};

const applySectionFlow = (progress) => {
  const segmentCount = STAGE_IDS.length - 1;
  const opacities = new Array(STAGE_IDS.length).fill(0);
  const scales = new Array(STAGE_IDS.length).fill(1);

  if (progress <= 0) {
    opacities[0] = 1;
  } else if (progress >= 1) {
    opacities[segmentCount] = 1;
  } else {
    const scaled = progress * segmentCount;
    const from = clamp(Math.floor(scaled), 0, segmentCount - 1);
    const to = from + 1;
    const t = clamp(scaled - from, 0, 1);

    opacities[from] = 1 - t;
    scales[from] = 1 + t * (CURRENT_SCALE_MAX - 1);

    if (t >= TRANSITION_THRESHOLD) {
      const nextT = (t - TRANSITION_THRESHOLD) / (1 - TRANSITION_THRESHOLD);
      opacities[to] = nextT;
      scales[to] = NEXT_SCALE_MIN + nextT * (1 - NEXT_SCALE_MIN);
    } else {
      opacities[to] = 0;
      scales[to] = NEXT_SCALE_MIN;
    }
  }

  stageElements.forEach((stage, idx) => {
    const opacity = clamp(opacities[idx], 0, 1);
    const scale = scales[idx];
    stage.style.opacity = opacity.toFixed(4);
    stage.style.transform = `translate3d(0, 0, 0) scale(${scale.toFixed(4)})`;
    stage.style.zIndex = `${100 + idx}`;
    stage.style.pointerEvents = opacity > 0.65 ? "auto" : "none";
  });

  if (heroStage && heroBrowserFrame) {
    const heroOpacity = opacities[0];
    const heroScale = scales[0];
    heroStage.style.setProperty("--hero-browser-scale", heroScale.toFixed(4));
    heroStage.style.setProperty("--hero-browser-opacity", heroOpacity.toFixed(4));
    heroStage.style.setProperty("--hero-content-opacity", heroOpacity.toFixed(4));
    heroStage.style.setProperty("--hero-content-shift", `${(-20 * (1 - heroOpacity)).toFixed(2)}px`);
  }

  return { opacities, scales };
};

const applyProgress = (progress) => {
  if (Math.abs(progress - lastAppliedProgress) < 0.0005) return;

  currentProgress = progress;
  lastAppliedProgress = progress;

  const stageIndex = getStageIndexFromProgress(progress);
  if (stageIndex !== currentStageIndex) {
    setActiveStage(stageIndex);
  }

  updateIndicator(progress);
  const sectionFlow = applySectionFlow(progress);

  if (header) {
    header.classList.toggle("is-scrolled", progress > 0.02);
  }

  if (immersiveScene) {
    immersiveScene.updateProgress(progress, {
      section2Opacity: sectionFlow.opacities[1],
      section2Scale: sectionFlow.scales[1],
    });
  }
};

const onScroll = () => {
  if (!ticking) {
    ticking = true;
    window.requestAnimationFrame(() => {
      applyProgress(getProgressFromScroll());
      ticking = false;
    });
  }
};

const navigateToStageId = (stageId) => {
  const index = STAGE_IDS.indexOf(stageId);
  if (index < 0) return;

  window.scrollTo({
    top: stageIndexToScrollTop(index),
    behavior: "smooth",
  });
};

const bindStageNavigation = () => {
  const anchors = Array.from(document.querySelectorAll('a[href^="#"]'));

  anchors.forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const targetId = href.slice(1);
      if (!STAGE_IDS.includes(targetId)) return;

      event.preventDefault();
      navigateToStageId(targetId);

      const toggle = document.getElementById("nav-toggle");
      if (toggle && toggle.checked) {
        toggle.checked = false;
      }
    });
  });
};

const createScene = async () => {
  if (!sceneRoot || immersiveScene) return;

  try {
    if (!immersiveModule) {
      immersiveModule = await import("./immersiveScene.js");
    }

    immersiveScene = immersiveModule.createImmersiveScene(sceneRoot, { isMobile: isMobile() });
    if (immersiveScene) {
      immersiveScene.updateProgress(currentProgress);
    }
  } catch (error) {
    console.error("Immersive scene initialization failed:", error);
  }
};

const onResize = () => {
  recalcScrollRange();

  if (immersiveScene && typeof immersiveScene.resize === "function") {
    immersiveScene.resize();
  }

  applyProgress(getProgressFromScroll());
};

const teardown = () => {
  if (immersiveScene && typeof immersiveScene.dispose === "function") {
    immersiveScene.dispose();
  }
  immersiveScene = null;
};

window.PortfolioApp = {
  version: "immersive-scroll-portfolio",
  features: {
    threeReady: true,
  },
  mounts: {
    appContainer,
    sceneRoot,
  },
};

recalcScrollRange();
setActiveStage(0);
updateIndicator(0);
bindStageNavigation();
createScene();
applyProgress(getProgressFromScroll());

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onResize, { passive: true });
window.addEventListener("beforeunload", teardown);
