import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface SeriesItem {
  slug: string
  title: string
}

interface Props {
  current: { order: number }
  total: number
  prev?: SeriesItem
  next?: SeriesItem
}

export function SeriesNavigation({ current, total, prev, next }: Props) {
  return (
    <nav
      data-mdx-block="series-navigation"
      className="my-6 rounded-2xl border border-border bg-bg-card p-5"
      aria-label="Series navigation"
    >
      <div className="text-accent text-[11px] font-semibold uppercase tracking-[0.15em] mb-3">
        Step {current.order} of {total}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {prev ? (
          <Link
            href={`/guides/${prev.slug}`}
            className="flex-1 group rounded-lg border border-border bg-bg-card-hover hover:border-accent transition-colors p-3"
          >
            <div className="flex items-center gap-2 text-xs text-text-sub mb-1">
              <ArrowLeft size={12} strokeWidth={1.5} />
              <span>Back</span>
            </div>
            <div className="text-text text-sm font-medium group-hover:text-accent">{prev.title}</div>
          </Link>
        ) : <div className="flex-1" aria-hidden="true" />}
        {next ? (
          <Link
            href={`/guides/${next.slug}`}
            className="flex-1 group rounded-lg border border-border bg-bg-card-hover hover:border-accent transition-colors p-3 sm:text-right"
          >
            <div className="flex items-center gap-2 text-xs text-text-sub mb-1 sm:justify-end">
              <span>Next</span>
              <ArrowRight size={12} strokeWidth={1.5} />
            </div>
            <div className="text-text text-sm font-medium group-hover:text-accent">{next.title}</div>
          </Link>
        ) : <div className="flex-1" aria-hidden="true" />}
      </div>
    </nav>
  )
}
