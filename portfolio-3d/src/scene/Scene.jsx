import { Canvas, useFrame } from "@react-three/fiber"
import { useRef, useMemo } from "react"
import * as THREE from "three"
import useScrollProgress from "../hooks/useScrollProgress"

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

/*
ROAD MESH
*/
function Road({ curve }) {
  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(
      curve,
      200,
      3, // width
      32,
      false
    )
  }, [curve])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#8b5cf6"
        emissive="#4c1d95"
        emissiveIntensity={1.5}
        metalness={0.2}
        roughness={0.1}
        />
    </mesh>
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
    const camZ = point.z + 15

    camera.position.lerp(
      new THREE.Vector3(camX, camY, camZ),
      0.08
    )

    camera.lookAt(ahead)
  })

  return null
}

/*
SCENE
*/
function SceneContent() {
  const curve = useRoadCurve()

  return (
    <>
      <ambientLight intensity={0.6} />

      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
      />

      <Road curve={curve} />

      <CameraRig curve={curve} />
    </>
  )
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 8, 25], fov: 60 }}>
      <SceneContent />
    </Canvas>
  )
}