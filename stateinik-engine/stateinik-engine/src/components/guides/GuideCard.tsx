import Link from 'next/link'
import Image from 'next/image'
import { Clock, Pin, Eye } from 'lucide-react'
import {
  formatGuideMonth,
  formatViews,
  isNewGuide,
  VIEWS_DISPLAY_THRESHOLD,
} from '@/lib/guides/format'

export interface GuideCardData {
  slug: string
  title: string
  excerpt: string
  heroImage?: string | null
  ogImage: string | null
  readingMinutes: number
  viewsCount?: number
  publishedAt?: Date | string | null
  isPinned?: boolean
}

export function GuideCard({ guide }: { guide: GuideCardData }) {
  // Primary: heroImage (same one shown at the top of the article). Fallback: ogImage (for social networks).
  const cover = guide.heroImage ?? guide.ogImage
  const views = guide.viewsCount ?? 0
  // Third chip: reader count takes priority → "New" for fresh guides with few reads → otherwise the month.
  const showViews = views >= VIEWS_DISPLAY_THRESHOLD
  const isNew = !showViews && isNewGuide(guide.publishedAt)
  const month = !showViews && !isNew ? formatGuideMonth(guide.publishedAt) : ''
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group rounded-2xl border border-border bg-bg-card hover:border-accent hover:shadow-[0_0_30px_rgba(217,119,87,0.05)] transition-all overflow-hidden flex flex-col"
    >
      <div className="relative w-full aspect-[16/9] bg-bg-section overflow-hidden">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse, rgba(217,119,87,0.12) 0%, transparent 70%)' }}
            aria-hidden="true"
          />
        )}
        {guide.isPinned && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-accent text-bg px-2 py-1 text-[11px] font-semibold">
            <Pin size={10} strokeWidth={2} />
            <span>Featured</span>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-[17px] font-semibold tracking-tight text-text group-hover:text-accent leading-snug mb-2">
          {guide.title}
        </h3>
        <p className="text-sm text-text-sub line-clamp-2 mb-4 leading-relaxed">{guide.excerpt}</p>
        <div className="mt-auto flex items-center gap-3 text-xs text-text-dim">
          {guide.readingMinutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} strokeWidth={1.5} />
              {guide.readingMinutes} min
            </span>
          )}
          {isNew && (
            <span className="rounded-full px-2 py-0.5 font-medium bg-accent-soft text-accent">
              New
            </span>
          )}
          {showViews && (
            <span className="inline-flex items-center gap-1">
              <Eye size={12} strokeWidth={1.5} />
              {formatViews(views)}
            </span>
          )}
          {month && <span>{month}</span>}
        </div>
      </div>
    </Link>
  )
}
