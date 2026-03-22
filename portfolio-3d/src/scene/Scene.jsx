import { Canvas, useFrame } from "@react-three/fiber"
import { Line, Environment, Grid } from "@react-three/drei"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import EnergyStreaks from "../components/EnergyStreaks"
import RoadsideBuildings from "../components/RoadsideBuildings"
import WorldSectionNode from "../components/WorldSectionNode"
import { getCurveFrame, sampleOffsetCurveRange } from "./curveUtils"
import { QUALITY_PRESETS } from "./quality"

/*
ROAD CURVE
Creates zigzag path with vertical waves
*/
function useRoadCurve() {
  return useMemo(() => {
    const points = [
      // start
      new THREE.Vector3(0, 0, 0),

      // checkpoint 1
      new THREE.Vector3(0, 0, -20),

      // right turn
      new THREE.Vector3(10, 0, -40),

      // straight
      new THREE.Vector3(10, 0, -60),

      // checkpoint 2
      new THREE.Vector3(10, 0, -80),

      // straight
      new THREE.Vector3(10, 0, -100),

      // checkpoint 3
      new THREE.Vector3(10, 0, -120),

      // upward elevation
      new THREE.Vector3(10, 6, -150),

      // checkpoint 4
      new THREE.Vector3(10, 6, -170),

      // downward elevation
      new THREE.Vector3(10, 0, -200),

      // straight
      new THREE.Vector3(10, 0, -220),

      // checkpoint 5
      new THREE.Vector3(10, 0, -240),

      // left turn
      new THREE.Vector3(-10, 0, -260),

      // straight
      new THREE.Vector3(-10, 0, -280),

      // upward elevation
      new THREE.Vector3(-10, 5, -310),

      // downward elevation
      new THREE.Vector3(-10, 0, -340),

      // checkpoint 6
      new THREE.Vector3(-10, 0, -360),

      // straight
      new THREE.Vector3(-10, 0, -380),

      // checkpoint 7
      new THREE.Vector3(-10, 0, -400),
    ]

    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5)
  }, [])
}

function createAsphaltTextures() {
  const size = 512
  const colorCanvas = document.createElement("canvas")
  colorCanvas.width = size
  colorCanvas.height = size
  const colorCtx = colorCanvas.getContext("2d")
  const colorImage = colorCtx.createImageData(size, size)

  const roughCanvas = document.createElement("canvas")
  roughCanvas.width = size
  roughCanvas.height = size
  const roughCtx = roughCanvas.getContext("2d")
  const roughImage = roughCtx.createImageData(size, size)

  for (let y = 0; y < size; y += 1) {
    const v = y / size
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4
      const microNoise = (Math.random() - 0.5) * 14
      const grain = Math.sin(v * 170 + x * 0.035) * 5
      const longitudinal = Math.sin(v * 28) * 3.5

      const base = THREE.MathUtils.clamp(18 + microNoise + grain + longitudinal, 5, 36)

      colorImage.data[i] = base - 3
      colorImage.data[i + 1] = base - 1
      colorImage.data[i + 2] = base + 1
      colorImage.data[i + 3] = 255

      const roughness = THREE.MathUtils.clamp(
        40 + microNoise * 2 + Math.sin(v * 120 + x * 0.02) * 30,
        15,
        100,
      )
      roughImage.data[i] = roughness
      roughImage.data[i + 1] = roughness
      roughImage.data[i + 2] = roughness
      roughImage.data[i + 3] = 255
    }
  }

  colorCtx.putImageData(colorImage, 0, 0)
  roughCtx.putImageData(roughImage, 0, 0)

  const colorTexture = new THREE.CanvasTexture(colorCanvas)
  colorTexture.wrapS = THREE.RepeatWrapping
  colorTexture.wrapT = THREE.RepeatWrapping
  colorTexture.repeat.set(1.5, 14)
  colorTexture.anisotropy = 8

  const roughnessTexture = new THREE.CanvasTexture(roughCanvas)
  roughnessTexture.wrapS = THREE.RepeatWrapping
  roughnessTexture.wrapT = THREE.RepeatWrapping
  roughnessTexture.repeat.set(1.5, 14)
  roughnessTexture.anisotropy = 8

  return { colorTexture, roughnessTexture }
}

/*
ROAD MESH
*/
function Road({ curve, endT }) {
  const roadWidth = 12
  const totalSegments = 200
  const asphalt = useMemo(() => createAsphaltTextures(), [])

  const geometry = useMemo(() => {
    const positions = []
    const uvs = []
    const indices = []
    const clampedEnd = Math.max(0.03, Math.min(endT, 1))
    const segments = Math.max(8, Math.floor(totalSegments * clampedEnd))

    for (let i = 0; i <= segments; i += 1) {
      const t = (i / segments) * clampedEnd
      const { point, normal } = getCurveFrame(curve, t)

      const left = point.clone().addScaledVector(normal, roadWidth / 2)
      const right = point.clone().addScaledVector(normal, -roadWidth / 2)

      positions.push(left.x, left.y, left.z)
      positions.push(right.x, right.y, right.z)

      uvs.push(0, t)
      uvs.push(1, t)
    }

    for (let i = 0; i < segments; i += 1) {
      const a = i * 2
      const b = a + 1
      const c = a + 2
      const d = a + 3

      indices.push(a, b, c)
      indices.push(b, d, c)
    }

    const bufferGeometry = new THREE.BufferGeometry()

    bufferGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    bufferGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
    bufferGeometry.setIndex(indices)
    bufferGeometry.computeVertexNormals()

    return bufferGeometry
  }, [curve, endT])

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        map={asphalt.colorTexture}
        roughnessMap={asphalt.roughnessTexture}
        color="#04060b"
        emissive="#010204"
        emissiveIntensity={0.2}
        metalness={0.92}
        roughness={0.15}
        transmission={0}
        clearcoat={1.0}
        clearcoatRoughness={0.12}
        reflectivity={1.0}
      />
    </mesh>
  )
}

function getLineVisibilityEndT(sections, activeIndex) {
  const safeIndex = Math.max(0, Math.min(activeIndex, sections.length - 1))
  const tNext = sections[safeIndex + 1]?.checkpointT ?? 1
  const tAfter = sections[safeIndex + 2]?.checkpointT ?? 1
  const endT = tNext + 0.2 * (tAfter - tNext)
  return Math.max(0, Math.min(endT, 1))
}

function AnimatedNeonLine({ curve, offset, endT, color, lineWidth, baseOpacity, phase = 0 }) {
  const lineRef = useRef()
  const points = useMemo(() => sampleOffsetCurveRange(curve, offset, 0, endT), [curve, offset, endT])

  useFrame(({ clock }) => {
    const material = lineRef.current?.material
    if (!material) return

    const breath = 0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 1.7 + phase)
    material.opacity = baseOpacity * (0.84 + 0.16 * breath)
  })

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={baseOpacity}
    />
  )
}

function LaneLines({ curve, endT }) {
  return (
    <>
      <AnimatedNeonLine curve={curve} offset={-4} endT={endT} color="#ff3f6a" lineWidth={1.35} baseOpacity={0.92} phase={0} />
      <AnimatedNeonLine curve={curve} offset={0} endT={endT} color="#ff4f74" lineWidth={1.2} baseOpacity={0.88} phase={0.8} />
      <AnimatedNeonLine curve={curve} offset={4} endT={endT} color="#ff3f6a" lineWidth={1.35} baseOpacity={0.92} phase={1.6} />
    </>
  )
}

/*
CAMERA FOLLOW SYSTEM
Scroll-driven movement
*/
function CameraRig({ curve, progress }) {
  const currentPos = useRef(new THREE.Vector3())
  const currentLook = useRef(new THREE.Vector3())
  const rigRef = useRef()

  useFrame((state, delta) => {
    const camera = state.camera

    const point = curve.getPointAt(progress)
    const tangent = curve.getTangentAt(progress)

    const lookAhead = curve.getPointAt(Math.min(progress + 0.04, 1))

    const targetPos = point.clone().addScaledVector(tangent, -8)
    targetPos.y += 4

    currentPos.current.lerp(targetPos, 1 - Math.exp(-4 * delta))
    currentLook.current.lerp(lookAhead, 1 - Math.exp(-6 * delta))

    camera.position.copy(currentPos.current)
    camera.lookAt(currentLook.current)

    if (rigRef.current) {
      rigRef.current.position.copy(currentPos.current)
    }
  })

  return (
    <group ref={rigRef}>
      <pointLight color="#ff3f6a" intensity={25} distance={60} position={[0, 2, -15]} />
      <pointLight color="#22d3ee" intensity={20} distance={50} position={[0, 6, 5]} />
    </group>
  )
}

function RoadRails({ curve, endT }) {
  return (
    <>
      <AnimatedNeonLine curve={curve} offset={-6} endT={endT} color="#8efbff" lineWidth={2.6} baseOpacity={0.96} phase={0.3} />
      <AnimatedNeonLine curve={curve} offset={6} endT={endT} color="#8efbff" lineWidth={2.6} baseOpacity={0.96} phase={1.1} />
    </>
  )
}

/*
SCENE
*/
function SceneContent({ sections, progress, activeIndex, quality }) {
  const curve = useRoadCurve()
  const lineVisibilityEndT = useMemo(
    () => getLineVisibilityEndT(sections, activeIndex),
    [sections, activeIndex],
  )
  const visibleIndices = useMemo(() => {
    const endWithMargin = Math.min(1, lineVisibilityEndT + 0.02)
    return sections
      .map((section, index) => ({ section, index }))
      .filter(({ section }) => section.checkpointT <= endWithMargin)
      .map(({ index }) => index)
  }, [lineVisibilityEndT, sections])

  return (
    <>
      <ambientLight intensity={0.4} color="#0a0a2a" />
      <directionalLight position={[10, 15, -5]} intensity={1.5} color="#22d3ee" />
      <directionalLight position={[-10, 5, 10]} intensity={1} color="#ff3f6a" />
      <Environment preset="night" />

      <Road curve={curve} endT={lineVisibilityEndT} />

      <Grid
        position={[0, -4, 0]}
        args={[400, 400]}
        cellSize={15}
        cellThickness={1.2}
        cellColor="#0c1731"
        sectionSize={75}
        sectionThickness={1.5}
        sectionColor="#22d3ee"
        fadeDistance={250}
        fadeStrength={1}
        infiniteGrid
      />

      <LaneLines curve={curve} endT={lineVisibilityEndT} />
      <EnergyStreaks curve={curve} particles={quality.particleCount} endT={lineVisibilityEndT} />

      <RoadRails curve={curve} endT={lineVisibilityEndT} />
      <RoadsideBuildings curve={curve} sections={sections} endT={lineVisibilityEndT} />

      {visibleIndices.map((index) => {
        const section = sections[index]
        const position = curve.getPointAt(section.checkpointT)
        const isActive = index === activeIndex

        return (
          <WorldSectionNode
            key={section.id}
            section={section}
            position={position}
            isActive={isActive}
            isNeighbor={!isActive}
          />
        )
      })}

      <CameraRig curve={curve} progress={progress} />
    </>
  )
}

export default function Scene({
  sections,
  progress,
  activeIndex,
  qualityLevel = "medium",
}) {
  const quality = QUALITY_PRESETS[qualityLevel] ?? QUALITY_PRESETS.medium

  return (
    <Canvas camera={{ position: [0, 8, 25], fov: 60 }}>
      <color attach="background" args={["#05081c"]} />
      <fog attach="fog" args={["#05081c", 50, 240]} />
      <SceneContent
        sections={sections}
        progress={progress}
        activeIndex={activeIndex}
        quality={quality}
      />
      <EffectComposer>
        <Bloom
          intensity={quality.bloomIntensity}
          luminanceThreshold={quality.bloomThreshold}
          luminanceSmoothing={quality.bloomSmoothing}
        />
      </EffectComposer>
    </Canvas>
  )
}
