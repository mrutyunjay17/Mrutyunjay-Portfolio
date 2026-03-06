import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

export default function EnergyStreaks({ curve }) {

  const particles = 60
  const meshRefs = useRef([])

  const offsets = useRef(
    Array.from({ length: particles }, () => Math.random())
  )

  // lane offsets
  const laneOffsets = useRef(
    Array.from({ length: particles }, () =>
      THREE.MathUtils.randFloatSpread(8)
    )
  )

  const up = new THREE.Vector3(0,1,0)

  useFrame((state, delta) => {

    meshRefs.current.forEach((mesh, i) => {

      offsets.current[i] += delta * 0.06

      if (offsets.current[i] > 1)
        offsets.current[i] -= 1

      const t = offsets.current[i]

      const point = curve.getPointAt(t)
      const tangent = curve.getTangentAt(t)

      const normal = new THREE.Vector3()
        .crossVectors(up, tangent)
        .normalize()

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
          ref={el => meshRefs.current[i] = el}
        >
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>

      ))}
    </>
  )
}