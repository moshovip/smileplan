'use client'

import Link from 'next/link'
import { routes } from '@/site.config'
import { useEffect, useState, useId, useRef, type ReactNode } from 'react'

interface Props {
  term: string
  slug?: string
  children?: ReactNode
}

const definitionCache = new Map<string, string | null>()
const inflight = new Map<string, Promise<string | null>>()

function transliterate(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  }
  return input.toLowerCase().split('').map(ch => (ch in map ? map[ch] : ch)).join('')
}

function slugify(s: string): string {
  return transliterate(s.toLowerCase().trim())
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function fetchDefinition(slug: string): Promise<string | null> {
  if (definitionCache.has(slug)) return definitionCache.get(slug)!
  const existing = inflight.get(slug)
  if (existing) return existing
  const p = fetch(`/api/concepts/${encodeURIComponent(slug)}/definition`, { method: 'GET' })
    .then(async r => {
      if (!r.ok) return null
      const data = (await r.json()) as { shortDefinition?: string }
      return data.shortDefinition ?? null
    })
    .catch(() => null)
    .then(value => {
      definitionCache.set(slug, value)
      inflight.delete(slug)
      return value
    })
  inflight.set(slug, p)
  return p
}

export function DefinitionLink({ term, slug, children }: Props) {
  const finalSlug = slug || slugify(term)
  const tooltipId = useId()
  const [definition, setDefinition] = useState<string | null>(null)
  const [shown, setShown] = useState(false)
  const containerRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (!shown) return
    if (definition !== null) return
    let cancelled = false
    void fetchDefinition(finalSlug).then(value => {
      if (!cancelled) setDefinition(value)
    })
    return () => {
      cancelled = true
    }
  }, [shown, finalSlug, definition])

  const onShow = () => setShown(true)
  const onHide = () => setShown(false)

  return (
    <span
      ref={containerRef}
      className="relative inline"
      onMouseEnter={onShow}
      onMouseLeave={onHide}
      onFocus={onShow}
      onBlur={onHide}
      data-mdx-block="definition-link"
    >
      <Link
        href={routes.concept(finalSlug)}
        className="text-text underline decoration-dotted decoration-accent/60 underline-offset-4 hover:decoration-accent hover:text-accent transition-colors"
        aria-describedby={shown && definition ? tooltipId : undefined}
      >
        {children ?? term}
      </Link>
      {shown && definition && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 w-72 rounded-2xl border border-border-hover bg-bg-card px-4 py-3 text-[13px] leading-snug text-text shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        >
          <span className="block text-accent text-[10px] font-semibold uppercase tracking-[0.15em] mb-1">{term}</span>
          {definition}
        </span>
      )}
    </span>
  )
}
