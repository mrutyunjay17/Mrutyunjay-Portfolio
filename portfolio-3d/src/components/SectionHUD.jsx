import { scrollToProgress } from "../utils/scroll"

export default function SectionHUD({ sections, progress, activeIndex }) {
  return (
    <div className="hud-nav">
      <div className="hud-nav-track" />
      <div className="hud-nav-progress" style={{ width: `${progress * 100}%` }} />
      {sections.map((section, index) => {
        const isActive = index === activeIndex
        return (
          <button
            key={section.id}
            type="button"
            className={`hud-nav-dot ${isActive ? "is-active" : ""}`}
            onClick={() => scrollToProgress(section.checkpointT)}
            aria-label={`Go to ${section.title}`}
            aria-current={isActive ? "true" : "false"}
          >
            <span>{index + 1}</span>
          </button>
        )
      })}
    </div>
  )
}
