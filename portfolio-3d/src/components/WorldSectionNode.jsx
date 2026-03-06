import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { AnimatePresence, motion as Motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

const CORNER_SIGNS = [
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: 1, y: 1 },
]

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function deriveLayout(mainWidth, mainHeight, subWidth, subHeight, gapRatio, minGap, maxGap) {
  const mainHalfW = mainWidth / 2
  const mainHalfH = mainHeight / 2
  const subHalfW = subWidth / 2
  const subHalfH = subHeight / 2

  const gap = clamp(Math.min(mainWidth, mainHeight) * gapRatio, minGap, maxGap)
  const insetX = Math.min(24, mainHalfW * 0.26)
  const insetY = Math.min(20, mainHalfH * 0.26)

  const corners = CORNER_SIGNS.map((sign) => ({
    x: sign.x * (mainHalfW + subHalfW + gap),
    y: sign.y * (mainHalfH + subHalfH + gap),
  }))

  const mini = CORNER_SIGNS.map((sign) => ({
    x: sign.x * (mainHalfW - insetX),
    y: sign.y * (mainHalfH - insetY),
  }))

  const launch = corners.map((corner, index) => ({
    x: corner.x + CORNER_SIGNS[index].x * (subHalfW * 0.75 + gap * 0.45),
    y: corner.y + CORNER_SIGNS[index].y * (subHalfH * 0.75 + gap * 0.45),
  }))

  const minX = Math.min(
    -mainHalfW,
    ...corners.map((corner) => corner.x - subHalfW),
  )
  const maxX = Math.max(
    mainHalfW,
    ...corners.map((corner) => corner.x + subHalfW),
  )
  const minY = Math.min(
    -mainHalfH,
    ...corners.map((corner) => corner.y - subHalfH),
  )
  const maxY = Math.max(
    mainHalfH,
    ...corners.map((corner) => corner.y + subHalfH),
  )

  return { corners, mini, launch, bounds: { minX, maxX, minY, maxY } }
}

export default function WorldSectionNode({
  section,
  position,
  isActive,
  isNeighbor,
}) {
  const rootRef = useRef()
  const scaleRef = useRef(1)
  const mainRef = useRef(null)
  const subRefs = useRef([])

  const [layout, setLayout] = useState(() => ({
    ...deriveLayout(360, 210, 164, 96, 0.16, 20, 42),
    viewportShift: { x: 0, y: 0 },
  }))

  const activeClassName = isActive ? "is-active" : "is-neighbor"
  const subSections = useMemo(() => section.subSections ?? [], [section.subSections])
  const isSubVisible = true

  const computeLayout = useCallback(() => {
    const main = mainRef.current
    if (!main) return

    const mainRect = main.getBoundingClientRect()
    if (!mainRect.width || !mainRect.height) return

    const css = getComputedStyle(main)
    const gapRatio = Number.parseFloat(css.getPropertyValue("--subhud-gap-ratio")) || 0.16
    const minGap = Number.parseFloat(css.getPropertyValue("--subhud-min-gap")) || 20
    const maxGap = Number.parseFloat(css.getPropertyValue("--subhud-max-gap")) || 42
    const safeMargin = Number.parseFloat(css.getPropertyValue("--subhud-safe-margin")) || 16

    const subRects = subRefs.current
      .filter(Boolean)
      .map((node) => node.getBoundingClientRect())
      .filter((rect) => rect.width && rect.height)

    const subWidth = subRects.length
      ? Math.max(...subRects.map((rect) => rect.width))
      : Number.parseFloat(css.getPropertyValue("--subhud-width")) || 164

    const subHeight = subRects.length
      ? Math.max(...subRects.map((rect) => rect.height))
      : Number.parseFloat(css.getPropertyValue("--subhud-height")) || 96

    const symmetric = deriveLayout(mainRect.width, mainRect.height, subWidth, subHeight, gapRatio, minGap, maxGap)
    const centerX = mainRect.left + mainRect.width / 2
    const centerY = mainRect.top + mainRect.height / 2
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const projectedMinX = centerX + symmetric.bounds.minX
    const projectedMaxX = centerX + symmetric.bounds.maxX
    const projectedMinY = centerY + symmetric.bounds.minY
    const projectedMaxY = centerY + symmetric.bounds.maxY

    let shiftX = 0
    let shiftY = 0

    if (projectedMinX < safeMargin) shiftX += safeMargin - projectedMinX
    if (projectedMaxX > viewportWidth - safeMargin) shiftX -= projectedMaxX - (viewportWidth - safeMargin)
    if (projectedMinY < safeMargin) shiftY += safeMargin - projectedMinY
    if (projectedMaxY > viewportHeight - safeMargin) shiftY -= projectedMaxY - (viewportHeight - safeMargin)

    setLayout({
      ...symmetric,
      viewportShift: { x: shiftX, y: shiftY },
    })
  }, [])

  useEffect(() => {
    computeLayout()

    const main = mainRef.current
    if (!main) return undefined

    let rafId = requestAnimationFrame(computeLayout)
    const observer = new ResizeObserver(() => computeLayout())

    observer.observe(main)
    subRefs.current.forEach((node) => node && observer.observe(node))
    window.addEventListener("resize", computeLayout)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
      window.removeEventListener("resize", computeLayout)
    }
  }, [computeLayout, isSubVisible, section.id])

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
        <div
          className={`world-hud-node ${activeClassName}`}
          data-expanded={isSubVisible ? "true" : "false"}
          style={{
            transform: `translate(${layout.viewportShift.x}px, ${layout.viewportShift.y}px)`,
          }}
        >
          <div ref={mainRef} className="world-hud-main">
            <p className="world-kicker">Checkpoint</p>
            <h2 className="world-title">{section.title}</h2>
            <p className="world-subtitle">{section.subtitle}</p>
            <p className="world-body">{section.body}</p>
          </div>

          <AnimatePresence>
            {isSubVisible &&
              subSections.slice(0, 4).map((item, index) => {
                const corner = layout.corners[index] ?? layout.corners[0]
                const mini = layout.mini[index] ?? layout.mini[0]
                const launch = layout.launch[index] ?? layout.launch[0]

                return (
                  <Motion.article
                    key={item.id}
                    className={`world-subhud corner-${index + 1}`}
                    ref={(node) => {
                      subRefs.current[index] = node
                      if (node) requestAnimationFrame(computeLayout)
                    }}
                    initial={{
                      x: launch.x,
                      y: launch.y,
                      opacity: 0,
                      scale: 0.42,
                    }}
                    animate={{
                      x: corner.x,
                      y: corner.y,
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      x: mini.x,
                      y: mini.y,
                      opacity: 0,
                      scale: 0.2,
                    }}
                    transition={{ duration: 0.38, ease: [0.2, 0.9, 0.3, 1] }}
                  >
                    <h3>{item.heading}</h3>
                    <p>{item.description}</p>
                  </Motion.article>
                )
              })}
          </AnimatePresence>
        </div>
      </Html>
    </group>
  )
}
