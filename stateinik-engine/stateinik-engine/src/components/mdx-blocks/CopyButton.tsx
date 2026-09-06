'use client'

import { useState, useCallback } from 'react'
import { Check, Copy } from 'lucide-react'
import { useGuideContext } from '@/components/guides/GuideContext'
import { trackGuideEvent } from '@/lib/analytics/track-guide-event'

interface Props {
  text: string
  label?: string
  className?: string
  /** Block type — to refine the guide_copy_prompt event. */
  blockType?: 'prompt' | 'codeblock' | 'other'
  /** Additional data to include in the event details. */
  analyticsPayload?: Record<string, unknown>
}

export function CopyButton({ text, label = 'Copy', className = '', blockType = 'other', analyticsPayload }: Props) {
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const guide = useGuideContext()

  const onClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setToast(label === 'Copy' ? 'Copied' : `${label}: copied`)
      window.setTimeout(() => setCopied(false), 1800)
      window.setTimeout(() => setToast(null), 1800)
      if (guide) {
        trackGuideEvent({
          name: 'guide_copy_prompt',
          guideSlug: guide.slug,
          guideId: guide.id,
          details: { blockType, ...(analyticsPayload ?? {}) },
        })
      }
    } catch {
      setToast('Could not copy')
      window.setTimeout(() => setToast(null), 2000)
    }
  }, [text, label, blockType, analyticsPayload, guide])

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card-hover px-2.5 py-1.5 text-xs font-medium text-text hover:border-border-hover hover:bg-bg-card transition-all ${className}`}
        aria-label={label}
      >
        {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.5} />}
        <span>{copied ? 'Done' : label}</span>
      </button>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-bg-card border border-border-hover px-4 py-2 text-sm text-text shadow-[0_8px_30px_rgba(217,119,87,0.2)]"
        >
          {toast}
        </div>
      )}
    </>
  )
}
