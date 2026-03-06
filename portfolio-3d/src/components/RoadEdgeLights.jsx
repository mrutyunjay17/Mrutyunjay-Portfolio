import { useMemo } from "react"
import { Line } from "@react-three/drei"
import { sampleOffsetCurve } from "../scene/curveUtils"

export default function RoadEdgeLights({ curve }) {
  const leftPoints = useMemo(() => sampleOffsetCurve(curve, -5), [curve])
  const rightPoints = useMemo(() => sampleOffsetCurve(curve, 5), [curve])

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
