'use client'

import { useMemo } from 'react'
import { calculateSeoScore, type SeoCheckInput } from '@/lib/guides/seo-score'
import { siteConfig } from '@/site.config'

interface Props {
  input: SeoCheckInput
}

export function SeoHelper({ input }: Props) {
  const result = useMemo(() => calculateSeoScore(input), [input])

  const scoreColor =
    result.score >= 80 ? 'text-emerald-300' : result.score >= 50 ? 'text-amber-300' : 'text-red-400'

  return (
    <div className="space-y-4">
      <div className="bg-bg-card border border-border rounded-2xl p-4">
        <div className="text-text-dim text-[11px] uppercase tracking-[0.1em] mb-1">SEO score</div>
        <div className={`text-[40px] font-head leading-none ${scoreColor}`}>{result.score}<span className="text-[16px] text-text-dim ml-1">/100</span></div>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl p-4 space-y-2">
        <div className="text-text-dim text-[11px] uppercase tracking-[0.1em] mb-2">Text lengths</div>
        <CounterRow label="Meta title" value={result.metaTitleLength} target="50–60" ok={result.metaTitleLength >= 50 && result.metaTitleLength <= 60} />
        <CounterRow label="Meta description" value={result.metaDescriptionLength} target="140–160" ok={result.metaDescriptionLength >= 140 && result.metaDescriptionLength <= 160} />
        <CounterRow label="Excerpt" value={result.excerptLength} target="200–300" ok={result.excerptLength >= 200 && result.excerptLength <= 300} />
        <CounterRow label="Density" value={`${result.keywordDensity.toFixed(2)}%`} target="0.5–1.5%" ok={result.keywordDensity >= 0.5 && result.keywordDensity <= 1.5} />
      </div>

      <GoogleSnippetPreview
        title={input.metaTitle || input.title}
        description={input.metaDescription || input.excerpt}
        slug={input.title}
      />

      <div className="bg-bg-card border border-border rounded-2xl p-4 space-y-1.5">
        <div className="text-text-dim text-[11px] uppercase tracking-[0.1em] mb-2">Checks</div>
        {result.checks.map(c => (
          <div key={c.id} className="flex items-start gap-2 text-[12px]">
            <span
              className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                c.status === 'pass'
                  ? 'bg-emerald-400'
                  : c.status === 'warn'
                    ? 'bg-amber-400'
                    : 'bg-red-400'
              }`}
            />
            <div className="flex-1">
              <div className="text-text-sub leading-snug">{c.label}</div>
              {c.detail && <div className="text-text-dim text-[11px] mt-0.5">{c.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CounterRow({
  label,
  value,
  target,
  ok,
}: {
  label: string
  value: number | string
  target: string
  ok: boolean
}) {
  return (
    <div className="flex items-baseline justify-between text-[12px]">
      <span className="text-text-sub">{label}</span>
      <span className={ok ? 'text-emerald-300' : 'text-amber-300'}>
        {value} <span className="text-text-dim">/ {target}</span>
      </span>
    </div>
  )
}

function GoogleSnippetPreview({
  title,
  description,
  slug,
}: {
  title: string
  description: string
  slug: string
}) {
  const url =
    new URL(siteConfig.url).host + ' › guides › ' +
    (slug
      ? slug
          .toLowerCase()
          .slice(0, 40)
      : '...')
  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4">
      <div className="text-text-dim text-[11px] uppercase tracking-[0.1em] mb-2">Google snippet</div>
      <div className="bg-white/95 text-[#202124] rounded-lg p-3">
        <div className="text-[12px] text-[#202124]/60 truncate">{url}</div>
        <div className="text-[#1a0dab] text-[16px] leading-snug mt-0.5 truncate">
          {title || 'No title'}
        </div>
        <div className="text-[12px] text-[#4d5156] leading-snug mt-1 line-clamp-2">
          {description || 'No description'}
        </div>
      </div>
    </div>
  )
}
