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

const isMobile = () => window.innerWidth < 768;

let scrollRange = 1;
let currentProgress = 0;
let lastAppliedProgress = -1;
let currentStageIndex = 0;
let immersiveScene = null;
let immersiveModule = null;
let ticking = false;
const stageLeaveTimers = new Map();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const recalcScrollRange = () => {
  scrollRange = Math.max(1, scrollWrapper.offsetHeight - window.innerHeight);
};

const getProgressFromScroll = () => clamp(window.scrollY / scrollRange, 0, 1);

const getStageIndexFromProgress = (progress) => {
  const count = STAGE_IDS.length - 1;
  return clamp(Math.round(progress * count), 0, count);
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
  const previousIndex = currentStageIndex;

  if (previousIndex !== index) {
    const previousStage = stageElements[previousIndex];
    if (previousStage) {
      previousStage.classList.remove("is-active");
      previousStage.classList.add("is-leaving");

      const existingTimer = stageLeaveTimers.get(previousStage);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      const timerId = window.setTimeout(() => {
        previousStage.classList.remove("is-leaving");
        stageLeaveTimers.delete(previousStage);
      }, 320);
      stageLeaveTimers.set(previousStage, timerId);
    }
  }

  stageElements.forEach((stage, idx) => {
    if (idx === index) {
      stage.classList.remove("is-leaving");
      stage.classList.add("is-active");
    } else if (idx !== previousIndex) {
      stage.classList.remove("is-active");
    }
  });

  currentStageIndex = index;
  setActiveNav(STAGE_IDS[index]);
};

const updateIndicator = (progress) => {
  if (!heroIndicator) return;
  heroIndicator.classList.toggle("is-hidden", progress > 0.05);
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

  if (header) {
    header.classList.toggle("is-scrolled", progress > 0.02);
  }

  if (immersiveScene) {
    immersiveScene.updateProgress(progress);
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
  stageLeaveTimers.forEach((timerId) => {
    window.clearTimeout(timerId);
  });
  stageLeaveTimers.clear();

  if (immersiveScene && typeof immersiveScene.dispose === "function") {
    immersiveScene.dispose();
  }
  immersiveScene = null;
};

window.PortfolioApp = {
  version: "immersive-scroll-portfolio",
  features: {
    threeReady: false,
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
