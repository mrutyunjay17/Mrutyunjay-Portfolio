import { useEffect, useState } from "react"

export default function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight =
        document.body.scrollHeight - window.innerHeight

      const scrollProgress = scrollTop / docHeight
      setProgress(scrollProgress)
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return progress
}