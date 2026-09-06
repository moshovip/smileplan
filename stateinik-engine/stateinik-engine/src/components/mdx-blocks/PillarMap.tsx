import Link from 'next/link'
import { Map } from 'lucide-react'

interface ClusterGuide {
  slug: string
  title: string
  excerpt?: string
}

interface Props {
  clusters: ClusterGuide[]
  title?: string
}

export function PillarMap({ clusters, title = 'Topic map' }: Props) {
  if (!clusters || clusters.length < 2) return null
  return (
    <section data-mdx-block="pillar-map" className="my-8 rounded-2xl border border-accent/30 bg-bg-card p-6 md:p-8">
      <div className="flex items-center gap-2 text-accent text-[11px] font-semibold uppercase tracking-[0.15em] mb-4">
        <Map size={14} strokeWidth={1.5} />
        <span>{title}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {clusters.map((c) => (
          <Link
            key={c.slug}
            href={`/guides/${c.slug}`}
            className="group rounded-xl border border-border bg-bg-card-hover hover:border-accent transition-colors p-4"
          >
            <h4 className="font-head text-base text-text group-hover:text-accent leading-tight mb-1">{c.title}</h4>
            {c.excerpt && <p className="text-xs text-text-sub line-clamp-2">{c.excerpt}</p>}
          </Link>
        ))}
      </div>
    </section>
  )
}
