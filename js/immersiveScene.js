import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(min, max, value) {
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}

function applyOpacity(object, opacity) {
  object.traverse((child) => {
    if (!child.material) return;
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => {
        if ("opacity" in material) material.opacity = opacity;
      });
    } else if ("opacity" in child.material) {
      child.material.opacity = opacity;
    }
  });
}

function createGlobeGroup(radius) {
  const globe = new THREE.Group();
  const baseColor = new THREE.Color(0xffffff);
  const accentColor = new THREE.Color(0xe7d4a8);

  const longitudeSegments = 10;
  const latitudeSegments = 7;
  const circleSegments = 96;

  for (let i = 0; i < longitudeSegments; i += 1) {
    const theta = (i / longitudeSegments) * Math.PI;
    const points = [];
    for (let s = 0; s <= circleSegments; s += 1) {
      const t = (s / circleSegments) * Math.PI * 2;
      const x = Math.sin(theta) * Math.cos(t) * radius;
      const y = Math.sin(t) * radius;
      const z = Math.cos(theta) * Math.cos(t) * radius;
      points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const isAccent = i === 2 || i === 7;
    const material = new THREE.LineBasicMaterial({
      color: isAccent ? accentColor : baseColor,
      transparent: true,
      opacity: isAccent ? 0.35 : 0.18,
    });
    globe.add(new THREE.Line(geometry, material));
  }

  for (let i = 1; i < latitudeSegments; i += 1) {
    const phi = -Math.PI / 2 + (i / latitudeSegments) * Math.PI;
    const ringRadius = Math.cos(phi) * radius;
    const y = Math.sin(phi) * radius;
    const points = [];
    for (let s = 0; s <= circleSegments; s += 1) {
      const t = (s / circleSegments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(t) * ringRadius, y, Math.sin(t) * ringRadius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.16,
    });
    globe.add(new THREE.Line(geometry, material));
  }

  return globe;
}

export function createImmersiveScene(container) {
  if (!container) return null;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.pointerEvents = "none";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    42,
    (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
    0.1,
    100
  );
  camera.position.set(0, 0, 14);

  const ambient = new THREE.AmbientLight(0xffffff, 0.42);
  const key = new THREE.DirectionalLight(0xe7d4a8, 0.2);
  key.position.set(4, 6, 5);
  scene.add(ambient, key);

  const immersiveRoot = new THREE.Group();
  scene.add(immersiveRoot);

  const globeGroup = new THREE.Group();
  immersiveRoot.add(globeGroup);
  const globeRadius = 4.64;
  const globe = createGlobeGroup(globeRadius);
  globeGroup.add(globe);

  const nodeGroup = new THREE.Group();
  globeGroup.add(nodeGroup);
  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: 0xe7d4a8,
    transparent: true,
    opacity: 0.8,
  });
  const nodeGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const nodePositions = [
    [0.15, 1.1],
    [1.3, 0.4],
    [2.1, -0.2],
    [2.8, 0.95],
    [3.6, -0.75],
    [4.4, 0.2],
    [5.05, -0.35],
  ];

  const globeNodes = nodePositions.map(([theta, phi]) => {
    const x = globeRadius * Math.cos(phi) * Math.cos(theta);
    const y = globeRadius * Math.sin(phi);
    const z = globeRadius * Math.cos(phi) * Math.sin(theta);
    const node = new THREE.Mesh(nodeGeo, nodeMaterial.clone());
    node.position.set(x, y, z);
    nodeGroup.add(node);
    return node;
  });

  const pulseArcPoints = [];
  if (globeNodes.length >= 2) {
    const from = globeNodes[1].position.clone();
    const to = globeNodes[5].position.clone();
    for (let i = 0; i <= 40; i += 1) {
      const t = i / 40;
      const point = from.clone().lerp(to, t);
      const arcHeight = Math.sin(t * Math.PI) * 0.7;
      point.normalize().multiplyScalar(globeRadius + arcHeight);
      pulseArcPoints.push(point);
    }
  }

  const linkGeometry = new THREE.BufferGeometry().setFromPoints(pulseArcPoints);
  const linkMaterial = new THREE.LineBasicMaterial({
    color: 0xe7d4a8,
    transparent: true,
    opacity: 0.15,
  });
  const nodeLink = new THREE.Line(linkGeometry, linkMaterial);
  globeGroup.add(nodeLink);

  let rafId = 0;
  let targetProgress = 0;
  let visualProgress = 0;
  let targetSection2Opacity = 0;
  let visualSection2Opacity = 0;
  let targetSection2Scale = 1;
  let visualSection2Scale = 1;
  const clock = new THREE.Clock();

  const resize = () => {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  const animate = () => {
    rafId = window.requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.033);
    visualProgress = lerp(visualProgress, targetProgress, 0.08);
    visualSection2Opacity = lerp(visualSection2Opacity, targetSection2Opacity, 0.1);
    visualSection2Scale = lerp(visualSection2Scale, targetSection2Scale, 0.1);

    const globeOpacity = clamp(visualSection2Opacity, 0, 1);
    const globeScale = visualSection2Scale;

    globeGroup.visible = globeOpacity > 0.001;
    globeGroup.scale.setScalar(globeScale);
    globeGroup.rotation.y += delta * 0.12;
    applyOpacity(globeGroup, globeOpacity * 0.9);

    const nodePulse = 0.72 + Math.sin(clock.elapsedTime * 1.2) * 0.08;
    globeNodes.forEach((node, idx) => {
      const factor = idx === 1 || idx === 5 ? nodePulse : 0.74;
      node.material.opacity = globeOpacity * factor;
    });
    linkMaterial.opacity = globeOpacity * (0.08 + Math.sin(clock.elapsedTime * 1.1) * 0.04 + 0.04);

    const forwardDuringGlobeIn = smoothstep(0.2, 0.4, visualProgress);
    const settleBack = smoothstep(0.4, 0.7, visualProgress);
    camera.position.z = lerp(14, 12.8, forwardDuringGlobeIn);
    camera.position.z = lerp(camera.position.z, 13.4, settleBack);
    camera.position.y = lerp(0, -0.12, globeOpacity * 0.4);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };

  const updateProgress = (progress, sectionState = {}) => {
    targetProgress = clamp(progress, 0, 1);
    targetSection2Opacity = clamp(sectionState.section2Opacity ?? targetSection2Opacity, 0, 1);
    targetSection2Scale = clamp(sectionState.section2Scale ?? targetSection2Scale, 0.9, 1.8);
  };

  const dispose = () => {
    window.cancelAnimationFrame(rafId);

    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  };

  resize();
  animate();

  return {
    updateProgress,
    resize,
    dispose,
    getState: () => ({
      progress: visualProgress,
      camera: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      },
    }),
  };
}
