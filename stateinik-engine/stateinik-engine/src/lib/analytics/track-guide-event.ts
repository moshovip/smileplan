// Client-side analytics dispatch. The default "internal" driver POSTs events to
// the app's own endpoints (which upsert GuideStats). Wire a third-party tracker
// here if you want one — keep this the single choke-point so every component
// stays decoupled from the analytics backend.

export type GuideEventName =
  | 'guide_view'
  | 'guide_scroll_depth'
  | 'guide_copy_prompt'
  | 'guide_share'
  | 'guide_cta_click'
  | 'guide_sticky_dismiss'
  | 'guide_bookmark_toggle'
  | 'guide_feedback'
  | 'guide_apply_click'
  | 'guide_h1_variant_shown'
  | 'guide_h1_variant_converted'
  | 'came_from_search_bounce'

export interface GuideEventPayload {
  name: GuideEventName
  guideSlug: string
  guideId?: string
  details?: Record<string, unknown>
}

const ENABLED =
  (process.env.NEXT_PUBLIC_ANALYTICS_DRIVER || 'internal') !== 'none'

function getH1VariantIndex(slug: string): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(`guide-h1-variant-${slug}`)
    if (raw === null) return null
    const idx = parseInt(raw, 10)
    return Number.isNaN(idx) ? null : idx
  } catch {
    return null
  }
}

function postEvent(url: string, body: unknown) {
  try {
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // never break the UI for analytics
  }
}

export function trackGuideEvent(payload: GuideEventPayload): void {
  if (typeof window === 'undefined' || !ENABLED) return

  // Record in the app's own store (upserts GuideStats counters).
  postEvent('/api/analytics/guide-event', payload)

  // A/B headline conversion: a primary-CTA click converts the shown H1 variant.
  if (payload.name === 'guide_cta_click') {
    const variantIndex = getH1VariantIndex(payload.guideSlug)
    if (variantIndex !== null && payload.guideId) {
      postEvent('/api/analytics/h1-variant-converted', {
        guideId: payload.guideId,
        variantIndex,
      })
    }
  }
}
