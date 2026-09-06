import Link from 'next/link'
import { BookOpen } from 'lucide-react'

interface PrereqGuide {
  slug: string
  title: string
}

interface Props {
  guides: PrereqGuide[]
}

export function Prerequisites({ guides }: Props) {
  if (!guides || guides.length === 0) return null
  return (
    <div data-mdx-block="prerequisites" className="my-6 rounded-2xl border border-border bg-bg-card p-5">
      <div className="flex items-center gap-2 text-text-sub text-[11px] font-semibold uppercase tracking-[0.15em] mb-3">
        <BookOpen size={14} strokeWidth={1.5} className="text-accent" />
        <span>Read first</span>
      </div>
      <ul className="space-y-2">
        {guides.map(g => (
          <li key={g.slug}>
            <Link
              href={`/guides/${g.slug}`}
              className="text-text hover:text-accent text-[15px] underline-offset-2 hover:underline"
            >
              {g.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
