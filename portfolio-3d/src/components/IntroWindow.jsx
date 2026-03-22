import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

export default function IntroWindow({ position }) {
  const rootRef = useRef()
  const contentRef = useRef()

  useFrame(({ clock, camera }) => {
    if (!rootRef.current || !contentRef.current) return
    const floatY = position.y + Math.sin(clock.getElapsedTime() * 1.2) * 0.15
    rootRef.current.position.set(position.x, floatY, position.z)

    const dist = camera.position.z - position.z
    const opacity = THREE.MathUtils.clamp(dist / 3, 0, 1)
    contentRef.current.style.opacity = opacity
  })

  return (
    <group ref={rootRef} position={position}>
      <Html transform sprite distanceFactor={7} wrapperClass="intro-window-anchor">
        <div className="intro-mac-window" ref={contentRef}>
          <div className="mac-titlebar">
            <div className="mac-dots">
              <span className="dot close"></span>
              <span className="dot min"></span>
              <span className="dot max"></span>
            </div>
            <div className="mac-url-bar">
               <span className="lock-icon">🔒</span>
               <span className="url-text">https://mypage.com</span>
            </div>
          </div>
          <div className="mac-content">
            <h1 className="intro-name">Mrutyunjay Bahirat</h1>
            <h2 className="intro-role">Senior software development engineer</h2>
            <p className="intro-companies">Brillio | SSBA Innovations | BNY Mellon</p>
            
            <div className="scroll-indicator">
              <div className="mouse">
                 <div className="wheel"></div>
              </div>
              <span className="scroll-text">SCROLL TO ENTER</span>
            </div>
          </div>
          <div className="mobile-bottom-bar">
            <span className="icon">〈</span>
            <span className="icon">〉</span>
            <span className="icon">⍐</span>
            <span className="icon">⧉</span>
            <span className="icon">◰</span>
          </div>
        </div>
      </Html>
    </group>
  )
}
