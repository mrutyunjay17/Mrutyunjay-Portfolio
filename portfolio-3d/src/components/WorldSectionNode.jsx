import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

export default function WorldSectionNode({
  section,
  position,
  isActive,
  isNeighbor,
}) {
  const rootRef = useRef()
  const scaleRef = useRef(1)

  const activeClassName = isActive ? "is-active" : "is-neighbor"

  useFrame(({ clock }, delta) => {
    const root = rootRef.current
    if (!root) return

    const floatY = position.y + 2 + Math.sin(clock.getElapsedTime() * 1.2) * 0.4
    root.position.set(position.x, floatY, position.z)

    const targetScale = isActive ? 1 : isNeighbor ? 0.8 : 0.72
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 1 - Math.exp(-5 * delta))
    root.scale.setScalar(scaleRef.current)
  })

  return (
    <group ref={rootRef}>
      <Html transform sprite distanceFactor={12} wrapperClass="world-hud-anchor">
        <div className={`world-hud-node ${activeClassName}`}>
          <div className="world-hud-main">
            <div className="hud-scanline"></div>
            <p className="world-kicker">Checkpoint</p>
            <h2 className="world-title">{section.title}</h2>
            <p className="world-subtitle">{section.subtitle}</p>
            <p className="world-body">{section.body}</p>
          </div>
        </div>
      </Html>
    </group>
  )
}
