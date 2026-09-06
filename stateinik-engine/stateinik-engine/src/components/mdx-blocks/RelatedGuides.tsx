import Link from 'next/link'
import { Clock } from 'lucide-react'

interface RelatedGuide {
  slug: string
  title: string
  excerpt?: string
  readingMinutes?: number
}

interface Props {
  guides: RelatedGuide[]
  title?: string
}

export function RelatedGuides({ guides, title = 'Related guides' }: Props) {
  if (!guides || guides.length === 0) return null
  return (
    <section data-mdx-block="related-guides" className="my-8">
      <h3 className="font-head text-2xl text-text mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {guides.map(g => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="group rounded-2xl border border-border bg-bg-card hover:border-accent transition-colors p-5"
          >
            <h4 className="font-head text-lg text-text group-hover:text-accent leading-tight mb-2">{g.title}</h4>
            {g.excerpt && <p className="text-sm text-text-sub line-clamp-2 mb-3">{g.excerpt}</p>}
            {g.readingMinutes && (
              <div className="flex items-center gap-1.5 text-xs text-text-dim">
                <Clock size={12} strokeWidth={1.5} />
                <span>{g.readingMinutes} min</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
