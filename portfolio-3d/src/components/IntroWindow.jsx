import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef, useState, useEffect } from "react"
import * as THREE from "three"

export default function IntroWindow({ position }) {
  const rootRef = useRef()
  const contentRef = useRef()
  const [distFactor, setDistFactor] = useState(7)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // With a 340px CSS width, a distance factor of ~5.5 renders exactly at 90% width on standard mobile viewports
        setDistFactor(5.5)
      } else {
        setDistFactor(7)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
      <Html transform sprite distanceFactor={distFactor} wrapperClass="intro-window-anchor">
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
            <button className="cyberpunk-icon-btn">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </button>
            <button className="cyberpunk-icon-btn">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </button>
            <button className="cyberpunk-icon-btn">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            </button>
            <button className="cyberpunk-icon-btn">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><line x1="9" y1="14" x2="15" y2="10" /><line x1="9" y1="10" x2="15" y2="14" /></svg>
            </button>
          </div>
        </div>
      </Html>
    </group>
  )
}
