export function getMaxScroll() {
  return Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
}

export function getScrollProgress() {
  return Math.min(window.scrollY / getMaxScroll(), 1)
}

export function scrollToProgress(progress) {
  const clamped = Math.max(0, Math.min(progress, 1))
  window.scrollTo({ top: clamped * getMaxScroll(), behavior: "smooth" })
}
