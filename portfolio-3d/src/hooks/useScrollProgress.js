import { useEffect, useState } from "react"
import { getScrollProgress } from "../utils/scroll"

export default function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setProgress(getScrollProgress())
    }

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("resize", handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [])

  return progress
}
