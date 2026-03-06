import { useMemo } from "react"
import * as THREE from "three"
import { Line } from "@react-three/drei"

export default function RoadEdgeLights({ curve }) {

  const leftPoints = useMemo(() => {
    const pts = []
    const up = new THREE.Vector3(0,1,0)

    for (let i = 0; i <= 200; i++) {

      const t = i / 200
      const point = curve.getPointAt(t)
      const tangent = curve.getTangentAt(t)

      const normal = new THREE.Vector3()
        .crossVectors(up, tangent)
        .normalize()

      const offset = normal.clone().multiplyScalar(-5)

      pts.push(point.clone().add(offset))

    }

    return pts
  }, [curve])

  const rightPoints = useMemo(() => {
    const pts = []
    const up = new THREE.Vector3(0,1,0)

    for (let i = 0; i <= 200; i++) {

      const t = i / 200
      const point = curve.getPointAt(t)
      const tangent = curve.getTangentAt(t)

      const normal = new THREE.Vector3()
        .crossVectors(up, tangent)
        .normalize()

      const offset = normal.clone().multiplyScalar(5)

      pts.push(point.clone().add(offset))

    }

    return pts
  }, [curve])

  return (
    <>
      <Line
        points={leftPoints}
        color="#22d3ee"
        lineWidth={3}
      />

      <Line
        points={rightPoints}
        color="#22d3ee"
        lineWidth={3}
      />
    </>
  )
}