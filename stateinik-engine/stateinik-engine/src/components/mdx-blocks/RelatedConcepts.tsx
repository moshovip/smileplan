import Link from 'next/link'
import { routes } from '@/site.config'

interface RelatedConcept {
  slug: string
  term: string
  shortDefinition?: string
}

interface Props {
  concepts: RelatedConcept[]
  title?: string
}

export function RelatedConcepts({ concepts, title = 'Related concepts' }: Props) {
  if (!concepts || concepts.length === 0) return null
  return (
    <section data-mdx-block="related-concepts" className="my-8">
      <h3 className="font-head text-2xl text-text mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {concepts.map(c => (
          <Link
            key={c.slug}
            href={routes.concept(c.slug)}
            className="group rounded-2xl border border-border bg-bg-card hover:border-accent transition-colors p-5"
          >
            <div className="text-accent text-[10px] font-semibold uppercase tracking-[0.15em] mb-1">Concept</div>
            <h4 className="font-head text-lg text-text group-hover:text-accent leading-tight mb-2">{c.term}</h4>
            {c.shortDefinition && <p className="text-sm text-text-sub line-clamp-3">{c.shortDefinition}</p>}
          </Link>
        ))}
      </div>
    </section>
  )
}
