import Link from 'next/link'
import { Clock, ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'

interface Props {
  slug: string
}

export async function EmbedGuide({ slug }: Props) {
  let guide: { slug: string; title: string; excerpt: string; readingMinutes: number } | null = null
  try {
    guide = await prisma.guide.findFirst({
      where: { slug, status: 'published', deletedAt: null },
      select: { slug: true, title: true, excerpt: true, readingMinutes: true },
    })
  } catch {
    guide = null
  }

  if (!guide) {
    return (
      <div className="my-6 rounded-2xl border border-border bg-bg-card-hover p-5 text-text-sub text-sm">
        Guide temporarily unavailable.
      </div>
    )
  }

  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="block my-6 rounded-2xl border border-border bg-bg-card hover:border-accent transition-colors p-5 group"
      data-mdx-block="embed-guide"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-accent text-[10px] font-semibold uppercase tracking-[0.15em] mb-2">Guide</div>
          <h4 className="font-head text-xl text-text group-hover:text-accent leading-tight mb-2">{guide.title}</h4>
          {guide.excerpt && <p className="text-sm text-text-sub line-clamp-2 mb-2">{guide.excerpt}</p>}
          {guide.readingMinutes > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-text-dim">
              <Clock size={12} strokeWidth={1.5} />
              <span>{guide.readingMinutes} min</span>
            </div>
          )}
        </div>
        <ArrowRight size={18} strokeWidth={1.5} className="text-text-sub group-hover:text-accent shrink-0 mt-1" />
      </div>
    </Link>
  )
}
