import * as THREE from "three"

const WORLD_UP = new THREE.Vector3(0, 1, 0)

export function getCurveFrame(curve, t) {
  const point = curve.getPointAt(t)
  const tangent = curve.getTangentAt(t)
  const normal = new THREE.Vector3().crossVectors(WORLD_UP, tangent).normalize()

  return { point, tangent, normal }
}

export function sampleOffsetCurve(curve, offset, segments = 200) {
  return sampleOffsetCurveRange(curve, offset, 0, 1, segments)
}

export function sampleOffsetCurveRange(curve, offset, startT = 0, endT = 1, segments = 200) {
  const points = []
  const clampedStart = Math.max(0, Math.min(startT, 1))
  const clampedEnd = Math.max(0, Math.min(endT, 1))
  const span = Math.max(clampedEnd - clampedStart, 0.0001)
  const stepCount = Math.max(Math.floor(segments * span), 2)

  for (let i = 0; i <= stepCount; i += 1) {
    const t = clampedStart + (i / stepCount) * span
    const { point, normal } = getCurveFrame(curve, t)
    points.push(point.clone().addScaledVector(normal, offset))
  }

  return points
}
