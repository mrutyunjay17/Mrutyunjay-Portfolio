import { Canvas, useFrame } from "@react-three/fiber"
import { Line } from "@react-three/drei"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import EnergyStreaks from "../components/EnergyStreaks"
import WorldSectionNode from "../components/WorldSectionNode"
import useScrollProgress from "../hooks/useScrollProgress"
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

    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments
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
  }, [curve])

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color="#181b24"
        emissive="#06080d"
        emissiveIntensity={0.16}
        metalness={0.16}
        roughness={0.66}
        transmission={0.01}
        clearcoat={0.34}
        clearcoatRoughness={0.22}
        reflectivity={0.5}
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

function LaneLines({ curve, endT }) {
  const offsets = [-4, 0, 4]

  return (
    <>
      {offsets.map((offset) => {
        const points = sampleOffsetCurveRange(curve, offset, 0, endT)
        return (
          <Line
            key={offset}
            points={points}
            color="#ff4268"
            lineWidth={1.35}
            transparent
            opacity={0.95}
          />
        )
      })}
    </>
  )
}

/*
CAMERA FOLLOW SYSTEM
Scroll-driven movement
*/
function CameraRig({ curve }) {
  const progress = useScrollProgress()

  const currentPos = useRef(new THREE.Vector3())
  const currentLook = useRef(new THREE.Vector3())

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
  })

  return null
}

function RoadRails({ curve, endT }) {
  const offsets = [-6, 6]

  return (
    <>
      {offsets.map((offset) => {
        const points = sampleOffsetCurveRange(curve, offset, 0, endT)
        return (
          <Line
            key={offset}
            points={points}
            color="#8efbff"
            lineWidth={2.6}
            transparent
            opacity={0.98}
          />
        )
      })}
    </>
  )
}

/*
SCENE
*/
function SceneContent({ sections, activeIndex, expandedSectionId, onToggleExpand, quality }) {
  const curve = useRoadCurve()
  const lineVisibilityEndT = useMemo(
    () => getLineVisibilityEndT(sections, activeIndex),
    [sections, activeIndex],
  )
  const visibleIndices = useMemo(() => {
    const indices = [activeIndex - 1, activeIndex, activeIndex + 1]
    return indices.filter((index) => index >= 0 && index < sections.length)
  }, [activeIndex, sections.length])

  return (
    <>
      <ambientLight intensity={0.6} />

      <directionalLight position={[10, 10, 5]} intensity={1} />

      <Road curve={curve} />

      <LaneLines curve={curve} endT={lineVisibilityEndT} />
      <EnergyStreaks curve={curve} particles={quality.particleCount} />

      <RoadRails curve={curve} endT={lineVisibilityEndT} />

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
            canExpand={isActive}
            isExpanded={isActive && expandedSectionId === section.id}
            onToggleExpand={() => onToggleExpand(section.id)}
          />
        )
      })}

      <CameraRig curve={curve} />
    </>
  )
}

export default function Scene({
  sections,
  activeIndex,
  expandedSectionId,
  onToggleExpand,
  qualityLevel = "medium",
}) {
  const quality = QUALITY_PRESETS[qualityLevel] ?? QUALITY_PRESETS.medium

  return (
    <Canvas camera={{ position: [0, 8, 25], fov: 60 }}>
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 60, 220]} />
      <SceneContent
        sections={sections}
        activeIndex={activeIndex}
        expandedSectionId={expandedSectionId}
        onToggleExpand={onToggleExpand}
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
