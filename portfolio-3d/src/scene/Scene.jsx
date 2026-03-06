import { Canvas, useFrame } from "@react-three/fiber"
import { useRef, useMemo } from "react"
import * as THREE from "three"
import useScrollProgress from "../hooks/useScrollProgress"
import Checkpoint from "../components/Checkpoint"
import { EffectComposer, Bloom } from "@react-three/postprocessing"

/*
ROAD CURVE
Creates zigzag path with vertical waves
*/
function useRoadCurve() {
  return useMemo(() => {
    const points = [
      new THREE.Vector3(0, 1, 0),

      new THREE.Vector3(8, 2, -20),
      new THREE.Vector3(-8, 3, -40),

      new THREE.Vector3(10, 1, -60),
      new THREE.Vector3(-10, 4, -80),

      new THREE.Vector3(9, 2, -100),
      new THREE.Vector3(-9, 3, -120),

      new THREE.Vector3(0, 2, -140),
    ]

    return new THREE.CatmullRomCurve3(points)
  }, [])
}

function createGradientTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 1

  const ctx = canvas.getContext("2d")

  const gradient = ctx.createLinearGradient(0, 0, 512, 0)

  gradient.addColorStop(0, "#22d3ee")  // cyan
  gradient.addColorStop(0.5, "#7c3aed") // purple
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
  gradient.addColorStop(0.5, "#7c3aed") // purple
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

  return (
    <mesh geometry={geometry}>
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

  useFrame(({ camera }) => {
    const point = curve.getPointAt(progress)
    const ahead = curve.getPointAt(
      Math.min(progress + 0.02, 1)
    )

    const camX = point.x
    const camY = point.y + 6
    const camZ = point.z + 20

    camera.position.lerp(
      new THREE.Vector3(camX, camY, camZ),
      0.08
    )

    camera.lookAt(ahead)
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
    0.2,
    0.35,
    0.5,
    0.65,
    0.8,
    0.95,
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