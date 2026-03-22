import { motion as Motion, AnimatePresence } from "framer-motion"

export default function ActiveSectionDetails({ sections, activeIndex }) {
  const activeSection = sections[activeIndex]
  if (!activeSection) return null
  
  const subSections = activeSection.subSections || []

  if (subSections.length === 0) return null

  return (
    <div className="fixed-subhud-layout">
      <AnimatePresence mode="popLayout">
        {subSections.map((item, index) => (
          <Motion.article
            key={`${activeSection.id}-${item.id}`}
            className="fixed-subhud-card"
            initial={{ x: 40, scale: 0.95 }}
            animate={{ x: 0, scale: 1 }}
            exit={{ x: 20, scale: 0.95 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: [0.2, 0.9, 0.3, 1] }}
          >
            <div className="subhud-scanline"></div>
            <h3>{item.heading}</h3>
            <p>{item.description}</p>
          </Motion.article>
        ))}
      </AnimatePresence>
    </div>
  )
}
