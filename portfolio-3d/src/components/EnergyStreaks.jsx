import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { getCurveFrame } from "../scene/curveUtils"

export default function EnergyStreaks({ curve, particles = 60, endT = 1 }) {
  const meshRefs = useRef([])

  const offsets = useRef([])

  // lane offsets
  const laneOffsets = useRef([])

  useEffect(() => {
    offsets.current = Array.from({ length: particles }, () => Math.random())
    laneOffsets.current = Array.from({ length: particles }, () => THREE.MathUtils.randFloatSpread(8))
  }, [particles])

  useFrame((state, delta) => {
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      if (offsets.current[i] == null || laneOffsets.current[i] == null) return

      offsets.current[i] += delta * 0.06

      if (offsets.current[i] > 1) offsets.current[i] -= 1

      const t = offsets.current[i]
      const material = mesh.material

      if (t > endT) {
        mesh.visible = false
        return
      }

      mesh.visible = true

      // Soft fade near the visibility boundary to avoid abrupt popping.
      if (material) {
        const fadeStart = Math.max(endT - 0.06, 0)
        const alpha = THREE.MathUtils.clamp((endT - t) / Math.max(endT - fadeStart, 0.0001), 0, 1)
        material.opacity = alpha
      }

      const { point, normal } = getCurveFrame(curve, t)

      const pos = point
        .clone()
        .addScaledVector(normal, laneOffsets.current[i])

      mesh.position.set(
        pos.x,
        pos.y + 0.15,
        pos.z
      )

    })

  })

  return (
    <>
      {Array.from({ length: particles }).map((_, i) => (

        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el
          }}
        >
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={1} />
        </mesh>

      ))}
    </>
  )
}
