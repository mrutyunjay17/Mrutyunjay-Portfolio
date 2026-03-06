import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

export default function Checkpoint({ position, index }) {
  const ring = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // floating animation
    ring.current.position.y = position.y + Math.sin(t) * 0.4

    // rotation
    ring.current.rotation.z += 0.01
  })

  useFrame(({ camera }) => {
    ring.current.lookAt(camera.position)
    })

  return (
    <group position={[position.x, position.y + 2, position.z]}>
      <mesh ref={ring}>
        <torusGeometry args={[1.4, 0.05, 16, 100]} />
        <meshStandardMaterial
            color="#f0abfc"
            emissive="#ec4899"
            emissiveIntensity={2}
            />
      </mesh>
    </group>
  )
}