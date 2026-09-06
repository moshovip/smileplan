'use client'

import { useEffect, useState } from 'react'

export function GuideReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function update() {
      const h = document.documentElement
      const scrollable = h.scrollHeight - window.innerHeight
      if (scrollable <= 0) {
        setProgress(0)
        return
      }
      const p = Math.min(1, Math.max(0, h.scrollTop / scrollable))
      setProgress(p)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div
      data-block="guide-reading-progress"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-transparent"
    >
      <div
        className="h-full bg-accent origin-left will-change-transform"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}
