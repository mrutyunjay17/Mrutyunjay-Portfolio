import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

export default function Checkpoint({ position, isActive = false, intensity = 1 }) {
  const ring = useRef()
  const glow = useRef()

  useFrame(({ clock, camera }, delta) => {
    const t = clock.getElapsedTime()
    const ringMesh = ring.current
    const glowMesh = glow.current

    if (!ringMesh || !glowMesh) return

    // floating animation
    ringMesh.position.y = position.y + Math.sin(t * 1.2) * 0.4

    // rotation
    ringMesh.rotation.z += 0.01

    ringMesh.lookAt(camera.position)

    const targetScale = isActive ? 1.22 : 1
    ringMesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 1 - Math.exp(-5 * delta))
    glowMesh.scale.lerp(new THREE.Vector3(targetScale * 1.1, targetScale * 1.1, targetScale * 1.1), 1 - Math.exp(-5 * delta))

    const material = ringMesh.material
    if (material) {
      const targetEmissive = (isActive ? 2.6 : 1.35) * intensity
      material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, targetEmissive, 1 - Math.exp(-6 * delta))
    }

    const glowMaterial = glowMesh.material
    if (glowMaterial) {
      const targetOpacity = isActive ? 0.42 : 0.18
      glowMaterial.opacity = THREE.MathUtils.lerp(glowMaterial.opacity, targetOpacity, 1 - Math.exp(-6 * delta))
    }
  })

  const baseY = position.y + 2

  return (
    <group position={[position.x, baseY, position.z]}>
      <mesh ref={glow}>
        <torusGeometry args={[1.5, 0.16, 16, 120]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.2} />
      </mesh>

      <mesh ref={ring}>
        <torusGeometry args={[1.4, 0.05, 16, 100]} />
        <meshStandardMaterial color="#f0abfc" emissive="#ec4899" emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}
