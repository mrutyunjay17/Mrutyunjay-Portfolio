import Scene from "./scene/Scene"
import SectionHUD from "./components/SectionHUD"
import ActiveSectionDetails from "./components/ActiveSectionDetails"
import { sections } from "./data/sections"
import useActiveSection from "./hooks/useActiveSection"

export default function App() {
  const { progress, activeIndex } = useActiveSection(sections)

  return (
    <div style={{ height: `${sections.length * 100}vh` }}>
      <div className="app-stage">
        <Scene
          sections={sections}
          progress={progress}
          activeIndex={activeIndex}
          qualityLevel="medium"
        />
        <SectionHUD
          sections={sections}
          progress={progress}
          activeIndex={activeIndex}
        />
        <ActiveSectionDetails sections={sections} activeIndex={activeIndex} />
      </div>
    </div>
  )
}
