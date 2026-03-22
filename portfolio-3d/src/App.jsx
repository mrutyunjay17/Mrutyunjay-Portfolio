import Scene from "./scene/Scene"
import SectionHUD from "./components/SectionHUD"
import ActiveSectionDetails from "./components/ActiveSectionDetails"
import { useEffect, useState } from "react"
import { sections } from "./data/sections"
import useActiveSection from "./hooks/useActiveSection"

export default function App() {
  const { progress, activeIndex } = useActiveSection(sections)
  const [hudOpacity, setHudOpacity] = useState(0)
  const [hudPointerEvents, setHudPointerEvents] = useState("none")

  useEffect(() => {
    // Fade in over the first 3% of scroll
    const opacity = progress < 0.03 ? progress / 0.03 : 1
    setHudOpacity(opacity)
    setHudPointerEvents(progress < 0.03 ? "none" : "auto")
  }, [progress])

  return (
    <div style={{ height: `${sections.length * 100}vh` }}>
      <div className="app-stage">
        <Scene
          sections={sections}
          progress={progress}
          activeIndex={activeIndex}
          qualityLevel="medium"
        />

        <div
          className="hud-root"
          style={{ opacity: hudOpacity, pointerEvents: hudPointerEvents }}
        >
          <SectionHUD
            sections={sections}
            progress={progress}
            activeIndex={activeIndex}
          />
          <ActiveSectionDetails sections={sections} activeIndex={activeIndex} />
        </div>
      </div>
    </div>
  )
}
