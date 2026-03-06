import { useEffect, useMemo, useRef, useState } from "react"
import useScrollProgress from "./useScrollProgress"

function getDirection(nextIndex, previousIndex) {
  if (nextIndex === previousIndex) return 0
  return nextIndex > previousIndex ? 1 : -1
}

export default function useActiveSection(sections) {
  const progress = useScrollProgress()
  const previousIndexRef = useRef(0)
  const [direction, setDirection] = useState(0)

  const activeIndex = useMemo(() => {
    if (!sections.length) return 0

    for (let i = 0; i < sections.length - 1; i += 1) {
      const currentT = sections[i].checkpointT
      const nextT = sections[i + 1].checkpointT
      const midpoint = (currentT + nextT) / 2

      if (progress < midpoint) return i
    }

    return sections.length - 1
  }, [progress, sections])

  useEffect(() => {
    const directionValue = getDirection(activeIndex, previousIndexRef.current)
    previousIndexRef.current = activeIndex
    setDirection(directionValue)
  }, [activeIndex])

  return {
    progress,
    activeIndex,
    activeSection: sections[activeIndex] ?? null,
    direction,
  }
}
