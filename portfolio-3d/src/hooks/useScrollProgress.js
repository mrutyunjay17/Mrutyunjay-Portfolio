import { useEffect, useState } from "react"

export default function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY

      // 7 sections = 700vh
      const maxScroll = window.innerHeight * 6

      const value = Math.min(scrollTop / maxScroll, 1)

      setProgress(value)
    }

    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return progress
}