'use client'

import { useState, useEffect } from 'react'
import { Link as LinkIcon, Send, Check } from 'lucide-react'
import { useGuideContext } from '@/components/guides/GuideContext'
import { trackGuideEvent } from '@/lib/analytics/track-guide-event'

interface Props {
  guideSlug: string
  title: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function buildShareUrl(slug: string, medium: string) {
  const url = new URL(`/guides/${slug}`, APP_URL)
  url.searchParams.set('utm_source', 'guide')
  url.searchParams.set('utm_medium', medium)
  url.searchParams.set('utm_campaign', slug)
  return url.toString()
}

export function GuideShareBar({ guideSlug, title }: Props) {
  const [copied, setCopied] = useState(false)
  const guide = useGuideContext()

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  async function onCopy() {
    const url = buildShareUrl(guideSlug, 'copy-link')
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      trackGuideEvent({
        name: 'guide_share',
        guideSlug,
        guideId: guide?.id,
        details: { channel: 'copy-link' },
      })
    } catch {
      setCopied(false)
    }
  }

  function onTgClick() {
    trackGuideEvent({
      name: 'guide_share',
      guideSlug,
      guideId: guide?.id,
      details: { channel: 'tg' },
    })
  }

  function tgHref() {
    const url = buildShareUrl(guideSlug, 'tg-share')
    return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  }

  return (
    <aside
      data-block="guide-share-bar"
      className="
        fixed bottom-4 left-4 z-30 flex flex-col gap-2
        md:bottom-auto md:left-4 md:top-[160px] md:flex-col
      "
      aria-label="Share guide"
    >
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-card border border-border hover:border-accent text-text-sub hover:text-accent transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
      >
        {copied ? <Check size={18} strokeWidth={1.5} /> : <LinkIcon size={18} strokeWidth={1.5} />}
      </button>
      <a
        href={tgHref()}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onTgClick}
        aria-label="Share on Telegram"
        className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-card border border-border hover:border-accent text-text-sub hover:text-accent transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
      >
        <Send size={18} strokeWidth={1.5} />
      </a>
    </aside>
  )
}
