import Link from 'next/link'
import { Map } from 'lucide-react'

interface SiblingGuide {
  slug: string
  title: string
}

interface Props {
  pillar: { slug: string; title: string }
  siblings: SiblingGuide[]
  currentSlug: string
}

/**
 * Topic map for a cluster page: a link to the pillar plus neighboring clusters.
 * Renders only if there is at least one neighboring guide (otherwise a lone link to the pillar = noise).
 */
export function PillarContextBlock({ pillar, siblings, currentSlug }: Props) {
  const list = siblings.filter((s) => s.slug !== currentSlug).slice(0, 5)
  if (list.length === 0) return null
  return (
    <section
      data-mdx-block="pillar-context"
      className="my-8 rounded-2xl border border-accent/30 bg-bg-card p-6 md:p-8"
    >
      <div className="flex items-center gap-2 text-accent text-[11px] font-semibold uppercase tracking-[0.15em] mb-4">
        <Map size={14} strokeWidth={1.5} />
        <span>Topic</span>
      </div>
      <Link href={`/guides/${pillar.slug}`} className="block mb-5 group">
        <div className="text-base font-semibold tracking-tight text-text group-hover:text-accent leading-snug">
          {pillar.title}
        </div>
        <div className="text-xs text-text-dim mt-1">Main article of the topic</div>
      </Link>
      <div className="text-text-dim text-[11px] uppercase tracking-[0.1em] mb-3">Related articles</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.map((s) => (
          <Link
            key={s.slug}
            href={`/guides/${s.slug}`}
            className="group rounded-xl border border-border bg-bg-card-hover hover:border-accent transition-colors p-3 block"
          >
            <span className="font-head text-sm text-text group-hover:text-accent leading-tight">
              {s.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
