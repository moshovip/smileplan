'use client'

import { useEffect, useState } from 'react'
import { trackGuideEvent } from '@/lib/analytics/track-guide-event'

export interface H1VariantSpec {
  text: string
  weight?: number
}

interface Props {
  variants?: H1VariantSpec[] | null
  defaultText: string
  guideSlug: string
  guideId: string
  className?: string
}

function pickWeighted(variants: H1VariantSpec[]): number {
  const weights = variants.map(v => (typeof v.weight === 'number' && v.weight > 0 ? v.weight : 1))
  const total = weights.reduce((s, w) => s + w, 0)
  if (total <= 0) return 0
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

export function H1Variant({ variants, defaultText, guideSlug, guideId, className }: Props) {
  const [text, setText] = useState<string>(defaultText)

  useEffect(() => {
    if (!variants || variants.length === 0) return

    const storageKey = `guide-h1-variant-${guideSlug}`
    let idx: number | null = null
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (stored !== null) {
        const parsed = parseInt(stored, 10)
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed < variants.length) {
          idx = parsed
        }
      }
    } catch {
      // ignore
    }

    if (idx === null) {
      idx = pickWeighted(variants)
      try {
        window.localStorage.setItem(storageKey, String(idx))
      } catch {
        // ignore
      }
    }

    const variant = variants[idx]
    if (!variant) return

    setText(variant.text)
    trackGuideEvent({
      name: 'guide_h1_variant_shown',
      guideSlug,
      guideId,
      details: { variantIndex: idx, text: variant.text },
    })

    try {
      void fetch('/api/analytics/h1-variant-shown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId, variantIndex: idx }),
        keepalive: true,
      }).catch(() => {})
    } catch {
      // ignore
    }
  }, [variants, guideSlug, guideId])

  return <h1 className={className}>{text}</h1>
}
