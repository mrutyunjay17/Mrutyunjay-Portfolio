function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function createImmersiveScene(container) {
  if (!container) {
    return null;
  }

  let rafId = 0;
  let targetProgress = 0;
  let visualProgress = 0;

  // Keep a neutral camera-like state for future per-section background layers.
  const cameraState = {
    x: 0,
    y: 0,
    z: 20,
  };

  const animate = () => {
    rafId = window.requestAnimationFrame(animate);

    visualProgress = lerp(visualProgress, targetProgress, 0.08);

    cameraState.x = 0;
    cameraState.y = 0;
    cameraState.z = lerp(20, -120, visualProgress);
  };

  const updateProgress = (progress) => {
    targetProgress = clamp(progress, 0, 1);
  };

  const resize = () => {};

  const dispose = () => {
    window.cancelAnimationFrame(rafId);
  };

  animate();

  return {
    updateProgress,
    resize,
    dispose,
    getState: () => ({
      progress: visualProgress,
      camera: { ...cameraState },
    }),
  };
}
