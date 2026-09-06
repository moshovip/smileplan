import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGuideDetailStats } from '@/lib/analytics/guide-detail-stats'
import { GuideAnalyticsView } from './GuideAnalyticsView'

export const dynamic = 'force-dynamic'

export default async function GuideAnalyticsPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { days?: string }
}) {
  const daysRaw = parseInt(searchParams.days || '30', 10)
  const days = Math.min(Math.max(1, Number.isFinite(daysRaw) ? daysRaw : 30), 365)
  const stats = await getGuideDetailStats(params.id, days)
  if (!stats) notFound()

  return (
    <div className="p-6">
      <div className="mb-2 text-sm text-text-dim">
        <Link href="/admin/guides" className="hover:text-accent">
          ← Back
        </Link>
        {' / '}
        <Link href={`/admin/guides/${stats.guide.id}`} className="hover:text-accent">
          Guide editor
        </Link>
      </div>
      <h1 className="font-head text-3xl text-text">{stats.guide.title}</h1>
      <p className="mt-1 text-sm text-text-dim">
        <code className="text-accent">/{stats.guide.slug}</code> · status: {stats.guide.status}
        {stats.guide.publishedAt && (
          <>
            {' · published '}
            {new Date(stats.guide.publishedAt).toLocaleDateString('en-US')}
          </>
        )}
      </p>
      <GuideAnalyticsView stats={stats} guideId={stats.guide.id} initialDays={days} />
    </div>
  )
}
