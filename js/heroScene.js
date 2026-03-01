import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const MOBILE_BREAKPOINT = 768;
const MAX_NODES = 64;
const MAX_PULSES = 6;

function createRng(seed = 90317) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function createHeroScene(container) {
  if (!container) return null;
  if (window.innerWidth < MOBILE_BREAKPOINT) return null;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x1f2a35, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1f2a35, 15, 60);

  const camera = new THREE.PerspectiveCamera(48, container.clientWidth / container.clientHeight, 0.1, 120);
  camera.position.set(0, 3.6, 17.5);
  camera.rotation.x = -0.12;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  const keyLight = new THREE.DirectionalLight(0xd6c2a1, 0.24);
  keyLight.position.set(8, 12, 8);
  scene.add(ambientLight, keyLight);

  const grid = new THREE.GridHelper(48, 24, 0xffffff, 0xffffff);
  grid.material.opacity = 0.05;
  grid.material.transparent = true;
  grid.rotation.x = -0.24;
  grid.position.y = -5;
  scene.add(grid);

  const rng = createRng();
  const nodeMaterial = new THREE.MeshLambertMaterial({
    color: 0x2b3a4a,
  });
  const nodeGeometry = new THREE.SphereGeometry(0.24, 10, 10);
  const nodes = [];

  for (let i = 0; i < MAX_NODES; i += 1) {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    const x = lerp(-11.5, 11.5, rng());
    const y = lerp(-3.4, 3.8, rng());
    const z = lerp(-11, 10, rng());
    const scale = lerp(0.6, 1.2, rng());
    node.position.set(x, y, z);
    node.scale.set(scale, scale, scale);
    nodes.push(node);
    scene.add(node);
  }

  const linePositions = [];
  const edges = [];
  const maxDistance = 4.6;
  const maxConnectionsPerNode = 3;
  const connectionsPerNode = new Array(nodes.length).fill(0);

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      if (connectionsPerNode[i] >= maxConnectionsPerNode || connectionsPerNode[j] >= maxConnectionsPerNode) {
        continue;
      }

      const distance = nodes[i].position.distanceTo(nodes[j].position);
      if (distance < maxDistance && rng() > 0.42) {
        linePositions.push(
          nodes[i].position.x,
          nodes[i].position.y,
          nodes[i].position.z,
          nodes[j].position.x,
          nodes[j].position.y,
          nodes[j].position.z
        );
        edges.push([i, j]);
        connectionsPerNode[i] += 1;
        connectionsPerNode[j] += 1;
      }
    }
  }

  const connectionGeometry = new THREE.BufferGeometry();
  connectionGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const connectionMaterial = new THREE.LineBasicMaterial({
    color: 0xc8b38e,
    transparent: true,
    opacity: 0.15,
  });
  const connections = new THREE.LineSegments(connectionGeometry, connectionMaterial);
  scene.add(connections);

  const pulseMaterial = new THREE.MeshLambertMaterial({
    color: 0xd6c2a1,
    emissive: 0x6d614f,
    emissiveIntensity: 0.25,
  });
  const pulseGeometry = new THREE.SphereGeometry(0.12, 10, 10);
  const pulses = [];

  const edgeCount = edges.length;
  const pulseCount = Math.min(MAX_PULSES, Math.max(5, Math.floor(edgeCount / 14)));

  for (let i = 0; i < pulseCount; i += 1) {
    if (!edgeCount) break;
    const edgeIndex = Math.floor(rng() * edgeCount);
    const edge = edges[edgeIndex];
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.userData.edgeIndex = edgeIndex;
    pulse.userData.t = rng();
    pulse.userData.speed = lerp(0.06, 0.13, rng());
    pulse.userData.reverse = rng() > 0.5;
    pulse.userData.edge = edge;
    pulses.push(pulse);
    scene.add(pulse);
  }

  const pointerTarget = { x: 0, y: 0 };
  const pointerCurrent = { x: 0, y: 0 };
  let rafId = 0;
  const clock = new THREE.Clock();

  const updatePulsePosition = (pulse) => {
    if (!pulse.userData.edge) return;
    const [a, b] = pulse.userData.edge;
    const from = nodes[a].position;
    const to = nodes[b].position;
    const t = pulse.userData.reverse ? 1 - pulse.userData.t : pulse.userData.t;
    pulse.position.lerpVectors(from, to, t);
  };

  const assignNewEdge = (pulse) => {
    if (!edges.length) return;
    const nextEdgeIndex = Math.floor(rng() * edges.length);
    pulse.userData.edgeIndex = nextEdgeIndex;
    pulse.userData.edge = edges[nextEdgeIndex];
    pulse.userData.t = 0;
    pulse.userData.reverse = rng() > 0.5;
  };

  const onPointerMove = (event) => {
    const rect = container.getBoundingClientRect();
    pointerTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  const onResize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  const animate = () => {
    rafId = window.requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);

    pointerCurrent.x = lerp(pointerCurrent.x, pointerTarget.x, 0.06);
    pointerCurrent.y = lerp(pointerCurrent.y, pointerTarget.y, 0.06);

    camera.position.x = pointerCurrent.x * 0.6;
    camera.position.y = 3.6 + pointerCurrent.y * -0.25;
    camera.lookAt(0, 0, 0);

    for (let i = 0; i < pulses.length; i += 1) {
      const pulse = pulses[i];
      pulse.userData.t += pulse.userData.speed * delta;
      if (pulse.userData.t > 1) {
        assignNewEdge(pulse);
      }
      updatePulsePosition(pulse);
    }

    renderer.render(scene, camera);
  };

  container.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("resize", onResize);
  animate();

  const dispose = () => {
    window.cancelAnimationFrame(rafId);
    container.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("resize", onResize);

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
    if (renderer.domElement && renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return { dispose };
}
