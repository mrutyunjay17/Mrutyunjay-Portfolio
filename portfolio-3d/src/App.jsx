import { useMemo, useState } from "react"
import Scene from "./scene/Scene"
import SectionHUD from "./components/SectionHUD"
import { sections } from "./data/sections"
import useActiveSection from "./hooks/useActiveSection"

export default function App() {
  const { progress, activeIndex } = useActiveSection(sections)
  const [expandedState, setExpandedState] = useState(null)

  const expandedSectionId = useMemo(() => {
    if (!expandedState) return null

    const sameSection = expandedState.sectionId === sections[activeIndex]?.id
    const sameScroll = Math.abs(progress - expandedState.progressAtOpen) < 0.0001

    return sameSection && sameScroll ? expandedState.sectionId : null
  }, [activeIndex, expandedState, progress])

  const handleToggleExpand = (sectionId) => {
    const activeSectionId = sections[activeIndex]?.id
    if (sectionId !== activeSectionId) return

    setExpandedState((previous) => {
      if (previous?.sectionId === sectionId) return null
      return { sectionId, progressAtOpen: progress }
    })
  }

  return (
    <div style={{ height: `${sections.length * 100}vh` }}>
      <div className="app-stage">
        <Scene
          sections={sections}
          activeIndex={activeIndex}
          expandedSectionId={expandedSectionId}
          onToggleExpand={handleToggleExpand}
          qualityLevel="medium"
        />
        <SectionHUD
          sections={sections}
          progress={progress}
          activeIndex={activeIndex}
        />
      </div>
    </div>
  )
}
