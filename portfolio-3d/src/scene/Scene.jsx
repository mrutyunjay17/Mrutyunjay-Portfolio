import { Canvas, useFrame } from "@react-three/fiber"
import { useRef, useMemo } from "react"
import * as THREE from "three"
import useScrollProgress from "../hooks/useScrollProgress"
import Checkpoint from "../components/Checkpoint"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import EnergyStreaks from "../components/EnergyStreaks"
import RoadEdgeLights from "../components/RoadEdgeLights"

/*
ROAD CURVE
Creates zigzag path with vertical waves
*/
function useRoadCurve() {
  return useMemo(() => {
    const points = [

    // start
    new THREE.Vector3(0,0,0),

    // checkpoint 1
    new THREE.Vector3(0,0,-20),

    // right turn
    new THREE.Vector3(10,0,-40),

    // straight
    new THREE.Vector3(10,0,-60),

    // checkpoint 2
    new THREE.Vector3(10,0,-80),

    // straight
    new THREE.Vector3(10,0,-100),

    // checkpoint 3
    new THREE.Vector3(10,0,-120),

    // upward elevation
    new THREE.Vector3(10,6,-150),

    // checkpoint 4
    new THREE.Vector3(10,6,-170),

    // downward elevation
    new THREE.Vector3(10,0,-200),

    // straight
    new THREE.Vector3(10,0,-220),

    // checkpoint 5
    new THREE.Vector3(10,0,-240),

    // left turn
    new THREE.Vector3(-10,0,-260),

    // straight
    new THREE.Vector3(-10,0,-280),

    // upward elevation
    new THREE.Vector3(-10,5,-310),

    // downward elevation
    new THREE.Vector3(-10,0,-340),

    // checkpoint 6
    new THREE.Vector3(-10,0,-360),

    // straight
    new THREE.Vector3(-10,0,-380),

    // checkpoint 7
    new THREE.Vector3(-10,0,-400)

  ]

  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5)
  }, [])
}

function createGradientTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 1

  const ctx = canvas.getContext("2d")

  const gradient = ctx.createLinearGradient(0, 0, 512, 0)

  gradient.addColorStop(0, "#22d3ee")  // cyan
  gradient.addColorStop(0.5, "#6d28d9") // purple
  gradient.addColorStop(1, "#ec4899")  // pink

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 1)

  const texture = new THREE.CanvasTexture(canvas)

  texture.wrapS = THREE.RepeatWrapping
  texture.repeat.set(20, 1)

  return texture
}

function createRoadGradient() {

  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 8

  const ctx = canvas.getContext("2d")

  const gradient = ctx.createLinearGradient(0, 0, 1024, 0)

  gradient.addColorStop(0, "#22d3ee") // cyan
  gradient.addColorStop(0.5, "#6d28d9") // purple
  gradient.addColorStop(1, "#ec4899") // pink

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1024, 8)

  const texture = new THREE.CanvasTexture(canvas)

  texture.wrapS = THREE.RepeatWrapping
  texture.repeat.set(30, 1)

  return texture
}


/*
ROAD MESH
*/
function Road({ curve }) {

  const roadWidth = 12
  const segments = 200

  const geometry = useMemo(() => {

    const positions = []
    const uvs = []
    const indices = []

    const up = new THREE.Vector3(0,1,0)

    for (let i = 0; i <= segments; i++) {

      const t = i / segments

      const point = curve.getPointAt(t)
      const tangent = curve.getTangentAt(t)

      const normal = new THREE.Vector3()
        .crossVectors(up, tangent)
        .normalize()

      const left = point.clone().addScaledVector(normal, roadWidth / 2)
      const right = point.clone().addScaledVector(normal, -roadWidth / 2)

      positions.push(left.x, left.y, left.z)
      positions.push(right.x, right.y, right.z)

      uvs.push(0, t)
      uvs.push(1, t)
    }

    for (let i = 0; i < segments; i++) {

      const a = i * 2
      const b = a + 1
      const c = a + 2
      const d = a + 3

      indices.push(a, b, c)
      indices.push(b, d, c)
    }

    const geometry = new THREE.BufferGeometry()

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    )

    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(uvs, 2)
    )

    geometry.setIndex(indices)

    geometry.computeVertexNormals()

    return geometry

  }, [curve])

  const roadMaterial = useMemo(() => {

    return new THREE.ShaderMaterial({

        transparent: true,

        uniforms: {
            color: { value: new THREE.Color("#6d28d9") },
            fogColor: { value: new THREE.Color("#000000") },
            fogNear: { value: 60 },
            fogFar: { value: 220 }
            },

        vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;

        void main() {

            vNormal = normalize(normalMatrix * normal);

            vec4 worldPosition = modelViewMatrix * vec4(position,1.0);
            vView = normalize(-worldPosition.xyz);

            gl_Position = projectionMatrix * worldPosition;

        }
        `,

        fragmentShader: `

            uniform vec3 color;
            uniform vec3 fogColor;
            uniform float fogNear;
            uniform float fogFar;

            varying vec3 vNormal;
            varying vec3 vView;

            void main() {

            float fresnel = pow(1.0 - dot(vNormal, vView), 3.0);

            vec3 finalColor = color * (0.4 + fresnel * 2.5);
            float gradient = clamp(vView.y * 0.5 + 0.5, 0.0, 1.0);
finalColor *= mix(0.7, 1.2, gradient);

            float alpha = 0.35 + fresnel * 0.6;

            vec4 baseColor = vec4(finalColor, alpha);

            float depth = gl_FragCoord.z / gl_FragCoord.w;
            float fogFactor = smoothstep(fogNear, fogFar, depth);

            gl_FragColor = mix(baseColor, vec4(fogColor, alpha), fogFactor);

            }
            `
    })

    }, [])

  return (
    <mesh geometry={geometry} material={roadMaterial}>
      <meshPhysicalMaterial
        color="#4c1d95"
        metalness={0}
        roughness={0.05}
        transmission={1}
        thickness={2}
        clearcoat={1}
        clearcoatRoughness={0}
        transparent
        opacity={0.85}
        />
    </mesh>
  )
}

function LaneLines({ curve }) {

  const segments = 200
  const offsets = [-4, 0, 4] // 3 lane separators

  return (
    <>
      {offsets.map((offset, i) => {

        const points = []

        for (let j = 0; j <= segments; j++) {

          const t = j / segments

          const point = curve.getPointAt(t)
          const tangent = curve.getTangentAt(t)

          const normal = new THREE.Vector3()
            .crossVectors(new THREE.Vector3(0,1,0), tangent)
            .normalize()

          const pos = point.clone().addScaledVector(normal, offset)

          points.push(pos)
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points)

        
        return (
          <line key={i} geometry={geometry}>
            <lineBasicMaterial
                color="#38bdf8"
                />
          </line>
        )

      })}
    </>
  )
}

/*
CAMERA FOLLOW SYSTEM
Temporary auto movement to preview path
*/
function CameraRig({ curve }) {

  const progress = useScrollProgress()

  const currentPos = useRef(new THREE.Vector3())
  const currentLook = useRef(new THREE.Vector3())

  useFrame((state, delta) => {

    const camera = state.camera

    const point = curve.getPointAt(progress)
    const tangent = curve.getTangentAt(progress)

    const lookAhead = curve.getPointAt(
      Math.min(progress + 0.04, 1)
    )

    const targetPos = point.clone()
      .addScaledVector(tangent, -8)

    targetPos.y += 4

    // smooth camera position
    currentPos.current.lerp(targetPos, 1 - Math.exp(-4 * delta))

    // smooth look direction
    currentLook.current.lerp(lookAhead, 1 - Math.exp(-6 * delta))

    camera.position.copy(currentPos.current)
    camera.lookAt(currentLook.current)

  })

  return null
}

function RoadRails({ curve }) {

  const segments = 200
  const offsets = [-6, 6] // edges

  return (
    <>
      {offsets.map((offset, i) => {

        const points = []

        for (let j = 0; j <= segments; j++) {

          const t = j / segments

          const point = curve.getPointAt(t)
          const tangent = curve.getTangentAt(t)

          const normal = new THREE.Vector3()
            .crossVectors(new THREE.Vector3(0,1,0), tangent)
            .normalize()

          const pos = point.clone().addScaledVector(normal, offset)

          points.push(pos)
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points)

        return (
          <line key={i} geometry={geometry}>
            <lineBasicMaterial color="#ec4899" />
          </line>
        )

      })}
    </>
  )
}

/*
SCENE
*/
function SceneContent() {
  const curve = useRoadCurve()
  const checkpoints = [
  0.05,
  0.18,
  0.32,
  0.45,
  0.60,
  0.80,
  0.95
]

  return (
    <>
      <ambientLight intensity={0.6} />

      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
      />

      <Road curve={curve} />

      <LaneLines curve={curve} />
      <EnergyStreaks curve={curve} />

      <RoadRails curve={curve} />
      

      {
        checkpoints.map((t, i) => {
            const position = curve.getPointAt(t)

            return (
            <Checkpoint
                key={i}
                index={i}
                position={position}
            />
            )
        })
        }

      <CameraRig curve={curve} />
    </>
  )
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 8, 25], fov: 60 }}>
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 60, 220]} />
      <SceneContent />
      <EffectComposer>
        <Bloom
            intensity={0.4}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
        />
        </EffectComposer>
    </Canvas>
  )
}