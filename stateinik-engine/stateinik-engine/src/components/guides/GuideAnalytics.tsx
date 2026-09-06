'use client'

import { useEffect, useRef } from 'react'
import { trackGuideEvent } from '@/lib/analytics/track-guide-event'

interface Props {
  guideSlug: string
  guideId: string
}

const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const
const SEARCH_REFERRER_RE = /(yandex\.[a-z.]+\/search|google\.[a-z.]+\/search|duckduckgo\.com|bing\.com\/search)/i
const POGO_TIME_MS = 30_000
const POGO_SCROLL_MAX = 25

export function GuideAnalytics({ guideSlug, guideId }: Props) {
  const firedThresholds = useRef<Set<number>>(new Set())
  const mountedAtRef = useRef<number>(Date.now())
  const maxScrollRef = useRef<number>(0)
  const pogoFiredRef = useRef<boolean>(false)

  useEffect(() => {
    mountedAtRef.current = Date.now()
    firedThresholds.current = new Set()
    maxScrollRef.current = 0
    pogoFiredRef.current = false
    trackGuideEvent({ name: 'guide_view', guideSlug, guideId })

    const computeScrollPercent = (): number => {
      const docEl = document.documentElement
      const total = docEl.scrollHeight
      if (!total) return 0
      const seen = window.scrollY + window.innerHeight
      return Math.min(100, Math.max(0, (seen / total) * 100))
    }

    const onScroll = () => {
      const percent = computeScrollPercent()
      if (percent > maxScrollRef.current) {
        maxScrollRef.current = percent
      }
      for (const t of SCROLL_THRESHOLDS) {
        if (percent >= t && !firedThresholds.current.has(t)) {
          firedThresholds.current.add(t)
          trackGuideEvent({
            name: 'guide_scroll_depth',
            guideSlug,
            guideId,
            details: { depth: t },
          })
        }
      }
    }

    const maybeFirePogoStick = () => {
      if (pogoFiredRef.current) return
      const referrer = typeof document !== 'undefined' ? document.referrer : ''
      if (!referrer || !SEARCH_REFERRER_RE.test(referrer)) return
      const elapsed = Date.now() - mountedAtRef.current
      if (elapsed >= POGO_TIME_MS) return
      if (maxScrollRef.current >= POGO_SCROLL_MAX) return
      pogoFiredRef.current = true
      trackGuideEvent({
        name: 'came_from_search_bounce',
        guideSlug,
        guideId,
        details: {
          elapsedMs: elapsed,
          maxScrollPercent: Math.round(maxScrollRef.current),
        },
      })
    }

    const onBeforeUnload = () => {
      maybeFirePogoStick()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        maybeFirePogoStick()
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [guideSlug, guideId])

  return null
}
