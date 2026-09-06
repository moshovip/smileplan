'use client'

import { useEffect, useState } from 'react'
import { siteConfig } from '@/site.config'

interface Suggestion {
  type: 'guide' | 'concept' | 'prompt'
  title: string
  slug: string
  score: number
}

interface Props {
  content: string
  excludeId: string
  onInsert: (markdown: string) => void
}

const URL_PREFIX: Record<Suggestion['type'], string> = {
  guide: `${siteConfig.routePrefix.guides}/`,
  prompt: `${siteConfig.routePrefix.guides}/`,
  concept: `${siteConfig.routePrefix.concepts}/`,
}

export function LinkSuggestions({ content, excludeId, onInsert }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (content.length < 200) {
      setSuggestions([])
      return
    }
    const handle = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/guides/link-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, excludeId }),
        })
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.suggestions || [])
        }
      } catch {
        // silently
      } finally {
        setLoading(false)
      }
    }, 800)
    return () => clearTimeout(handle)
  }, [content, excludeId])

  if (!suggestions.length && !loading) return null

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-text-dim text-[11px] uppercase tracking-[0.1em]">
          You can link to
        </div>
        {loading && <span className="text-text-dim text-[11px]">…</span>}
      </div>
      <div className="space-y-1.5">
        {suggestions.map(s => (
          <div key={`${s.type}-${s.slug}`} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-text text-[13px] truncate">{s.title}</div>
              <div className="text-text-dim text-[11px] font-mono truncate">
                {URL_PREFIX[s.type]}{s.slug}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onInsert(
                  s.type === 'concept'
                    ? `<DefinitionLink term="${s.title}" slug="${s.slug}">${s.title}</DefinitionLink>`
                    : `[${s.title}](${URL_PREFIX[s.type]}${s.slug})`
                )
              }
              className="text-accent hover:text-accent-hover text-[12px] whitespace-nowrap"
            >
              Insert
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
