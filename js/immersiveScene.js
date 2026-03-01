import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function buildGridLayer({ width, depth, spacing, y, z, tint }) {
  const vertices = [];
  const halfW = width / 2;
  const halfD = depth / 2;

  for (let x = -halfW; x <= halfW + 0.001; x += spacing) {
    vertices.push(x, y, z - halfD, x, y, z + halfD);
  }

  for (let dz = -halfD; dz <= halfD + 0.001; dz += spacing) {
    vertices.push(-halfW, y, z + dz, halfW, y, z + dz);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

  const material = new THREE.LineBasicMaterial({
    color: tint,
    transparent: true,
    opacity: 0.08,
  });

  return new THREE.LineSegments(geometry, material);
}

export function createImmersiveScene(container, options = {}) {
  if (!container || typeof window.WebGLRenderingContext === "undefined") {
    return null;
  }

  const isMobile = Boolean(options.isMobile);
  const rand = seededRandom(49031);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.3 : 1.8));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x1f2a35, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1f2a35, 15, 60);

  const camera = new THREE.PerspectiveCamera(48, container.clientWidth / container.clientHeight, 0.1, 220);
  camera.position.set(0, 2.8, 20);
  camera.rotation.set(-0.09, 0.02, 0);

  const ambient = new THREE.AmbientLight(0xffffff, isMobile ? 0.45 : 0.52);
  const directional = new THREE.DirectionalLight(0xd6c2a1, isMobile ? 0.18 : 0.24);
  directional.position.set(8, 10, 7);
  scene.add(ambient, directional);

  const zoneZ = [0, -18, -36, -54, -72, -90, -108];

  const layers = [];
  for (let i = 0; i < zoneZ.length; i += 1) {
    const baseZ = zoneZ[i];
    layers.push(
      buildGridLayer({ width: 26, depth: 16, spacing: 2, y: -2.8, z: baseZ - 2, tint: 0xffffff }),
      buildGridLayer({ width: 22, depth: 14, spacing: 2, y: -0.4, z: baseZ - 1, tint: 0xffffff }),
      buildGridLayer({ width: 18, depth: 12, spacing: 2, y: 1.8, z: baseZ, tint: 0xffffff })
    );
  }
  layers.forEach((layer) => scene.add(layer));

  const pillarGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
  const pillarMaterial = new THREE.MeshLambertMaterial({
    color: 0x2b3a4a,
    emissive: 0x2b3a4a,
    emissiveIntensity: 0.12,
  });

  const pillarsPerZone = isMobile ? 10 : 14;
  const pillarCount = zoneZ.length * pillarsPerZone;
  const pillars = new THREE.InstancedMesh(pillarGeometry, pillarMaterial, pillarCount);

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const scale = new THREE.Vector3();

  let pillarIndex = 0;

  for (let i = 0; i < zoneZ.length; i += 1) {
    const zBase = zoneZ[i];
    const clusterOffsets = [-4.6, 0, 4.6];

    for (let c = 0; c < clusterOffsets.length; c += 1) {
      const clusterX = clusterOffsets[c];
      const count = Math.floor(pillarsPerZone / clusterOffsets.length) + (c === 0 ? pillarsPerZone % 3 : 0);

      for (let n = 0; n < count; n += 1) {
        if (pillarIndex >= pillarCount) break;

        const col = n % 2;
        const row = Math.floor(n / 2);
        const x = clusterX + (col === 0 ? -0.8 : 0.8);
        const z = zBase + row * 1.7 - 2.4;
        const height = lerp(2.2, 5.1, rand());

        position.set(x, height * 0.5 - 2.8, z);
        rotation.set(0, 0, 0);
        scale.set(1, height, 1);
        matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
        pillars.setMatrixAt(pillarIndex, matrix);

        pillarIndex += 1;
      }
    }
  }

  pillars.count = pillarIndex;
  pillars.instanceMatrix.needsUpdate = true;
  scene.add(pillars);

  const streamPaths = [];
  const streamPathLines = [];
  const streamsPerZone = isMobile ? 1 : 1;

  for (let i = 0; i < zoneZ.length; i += 1) {
    const z = zoneZ[i] - 0.6;
    for (let s = 0; s < streamsPerZone; s += 1) {
      const y = lerp(-0.2, 1.8, rand());
      const x1 = -6.2;
      const x2 = 6.2;
      streamPaths.push({ x1, x2, y, z });
      streamPathLines.push(x1, y, z, x2, y, z);
    }
  }

  const streamLineGeometry = new THREE.BufferGeometry();
  streamLineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(streamPathLines, 3));
  const streamLineMaterial = new THREE.LineBasicMaterial({ color: 0xd6c2a1, transparent: true, opacity: 0.16 });
  const streamGuides = new THREE.LineSegments(streamLineGeometry, streamLineMaterial);
  scene.add(streamGuides);

  const streamPulseCount = clamp(streamPaths.length, 6, 8);
  const streamPulseGeometry = new THREE.BoxGeometry(0.42, 0.06, 0.06);
  const streamPulseMaterial = new THREE.MeshLambertMaterial({
    color: 0xd6c2a1,
    emissive: 0x5a4f3c,
    emissiveIntensity: 0.2,
  });

  const streamPulses = [];
  for (let i = 0; i < streamPulseCount; i += 1) {
    const pulse = new THREE.Mesh(streamPulseGeometry, streamPulseMaterial);
    pulse.userData.pathIndex = i % streamPaths.length;
    pulse.userData.offset = rand();
    pulse.userData.t = rand();
    pulse.userData.speed = lerp(0.08, 0.14, rand());
    streamPulses.push(pulse);
    scene.add(pulse);
  }

  const frameMaterial = new THREE.LineBasicMaterial({ color: 0x2b3a4a, transparent: true, opacity: 0.8 });
  const frames = [];
  for (let i = 0; i < (isMobile ? 8 : 12); i += 1) {
    const w = lerp(1.8, 2.6, rand());
    const h = lerp(1.1, 1.7, rand());
    const pts = [
      new THREE.Vector3(-w / 2, -h / 2, 0),
      new THREE.Vector3(w / 2, -h / 2, 0),
      new THREE.Vector3(w / 2, h / 2, 0),
      new THREE.Vector3(-w / 2, h / 2, 0),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const frame = new THREE.LineLoop(geo, frameMaterial);
    frame.position.set(lerp(-7.5, 7.5, rand()), lerp(-2.2, 2.4, rand()), zoneZ[5] + lerp(-4.8, 4.8, rand()));
    frames.push(frame);
    scene.add(frame);
  }

  const calmPlane = buildGridLayer({ width: 20, depth: 14, spacing: 2, y: -0.8, z: zoneZ[6] + 1.2, tint: 0xffffff });
  calmPlane.material.opacity = 0.05;
  scene.add(calmPlane);

  const pointerTarget = { x: 0, y: 0 };
  const pointerCurrent = { x: 0, y: 0 };

  const onPointerMove = (event) => {
    if (isMobile) return;
    pointerTarget.x = clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1);
    pointerTarget.y = clamp((event.clientY / window.innerHeight - 0.5) * 2, -1, 1);
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });

  const cameraKeyframes = [
    { x: 0.0, y: 2.8, z: 20, rx: -0.09, ry: 0.02 },
    { x: -0.7, y: 2.7, z: 2, rx: -0.09, ry: -0.01 },
    { x: 0.9, y: 2.6, z: -16, rx: -0.09, ry: 0.02 },
    { x: -0.5, y: 2.5, z: -34, rx: -0.08, ry: -0.01 },
    { x: 0.7, y: 2.4, z: -52, rx: -0.08, ry: 0.01 },
    { x: 0.4, y: 2.3, z: -70, rx: -0.07, ry: 0.01 },
    { x: 0.0, y: 2.2, z: -88, rx: -0.06, ry: 0.0 },
  ];

  const clock = new THREE.Clock();
  let rafId = 0;
  let targetProgress = 0;
  let visualProgress = 0;

  const updateStreamPulse = (pulse, delta) => {
    const path = streamPaths[pulse.userData.pathIndex];
    if (!path) return;

    pulse.userData.t += pulse.userData.speed * delta;
    if (pulse.userData.t > 1) {
      pulse.userData.t = 0;
    }

    const localT = (pulse.userData.t + pulse.userData.offset) % 1;
    const x = lerp(path.x1, path.x2, localT);
    pulse.position.set(x, path.y, path.z);
  };

  const updateScene = () => {
    rafId = window.requestAnimationFrame(updateScene);
    const delta = Math.min(clock.getDelta(), 0.04);

    visualProgress = lerp(visualProgress, targetProgress, isMobile ? 0.1 : 0.07);

    const segmentCount = cameraKeyframes.length - 1;
    const mapped = clamp(visualProgress, 0, 1) * segmentCount;
    const index = Math.min(segmentCount - 1, Math.floor(mapped));
    const t = smoothstep(mapped - index);

    const from = cameraKeyframes[index];
    const to = cameraKeyframes[index + 1];

    pointerCurrent.x = lerp(pointerCurrent.x, pointerTarget.x, 0.06);
    pointerCurrent.y = lerp(pointerCurrent.y, pointerTarget.y, 0.06);

    const parallaxX = isMobile ? 0 : pointerCurrent.x * 0.28;
    const parallaxY = isMobile ? 0 : pointerCurrent.y * -0.16;

    camera.position.x = lerp(from.x, to.x, t) + parallaxX;
    camera.position.y = lerp(from.y, to.y, t) + parallaxY;
    camera.position.z = lerp(from.z, to.z, t);
    camera.rotation.x = lerp(from.rx, to.rx, t);
    camera.rotation.y = lerp(from.ry, to.ry, t);

    for (let i = 0; i < streamPulses.length; i += 1) {
      updateStreamPulse(streamPulses[i], delta);
    }

    renderer.render(scene, camera);
  };

  const resize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.3 : 1.8));
    renderer.setSize(width, height);
  };

  const updateProgress = (progress) => {
    targetProgress = clamp(progress, 0, 1);
  };

  updateScene();

  const dispose = () => {
    window.cancelAnimationFrame(rafId);
    window.removeEventListener("pointermove", onPointerMove);

    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return {
    updateProgress,
    resize,
    dispose,
  };
}
