/**
 * Per-guide aggregates for /admin/guides/[id]/analytics.
 *
 * Built from the engine's own tables: GuideStats counters, GuideH1Stats and
 * GuideFeedback. Timeseries / traffic-source / search-query / revenue sections
 * keep their shape but stay empty in the base install — wire an analytics or
 * Search-Console adapter to fill them.
 */

import { prisma } from '@/lib/prisma'

export interface GuideDetailStats {
  guide: {
    id: string
    slug: string
    title: string
    publishedAt: Date | null
    status: string
  }
  totals: {
    views: number
    uniqueVisitors: number
    sessions: number
    ctaClicks: number
    bookmarks: number
    shares: number
    copyPrompt: number
    helpful: number
    notHelpful: number
    timeDecayRevenue: number
    firstTouchRevenue: number
    purchases: number
  }
  sources: Array<{ trafficSource: string; views: number; ctaClicks: number }>
  daily: Array<{ date: string; views: number; uniques: number }>
  aiBots: Array<{ botName: string; hits: number; lastHit: Date | null }>
  topQueries: Array<{
    source: string
    query: string
    impressions: number
    clicks: number
    avgPosition: number | null
  }>
  h1Variants: Array<{ variantIndex: number; showns: number; converted: number; cr: number }>
  feedback: Array<{ helpful: boolean; comment: string | null; createdAt: Date }>
}

export async function getGuideDetailStats(
  guideId: string,
  days: number,
): Promise<GuideDetailStats | null> {
  const guide = await prisma.guide.findUnique({
    where: { id: guideId },
    select: { id: true, slug: true, title: true, publishedAt: true, status: true },
  })
  if (!guide) return null

  const to = new Date()
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)

  const [stats, h1Stats, feedback] = await Promise.all([
    prisma.guideStats.findUnique({ where: { guideId: guide.id } }),
    prisma.guideH1Stats.findMany({ where: { guideId: guide.id }, orderBy: { variantIndex: 'asc' } }),
    prisma.guideFeedback.findMany({
      where: { guideId: guide.id, createdAt: { gte: from, lt: to } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ])

  return {
    guide,
    totals: {
      views: stats?.viewsCount ?? 0,
      uniqueVisitors: 0,
      sessions: 0,
      ctaClicks: stats?.ctaClickCount ?? 0,
      bookmarks: stats?.bookmarksCount ?? 0,
      shares: stats?.shareCount ?? 0,
      copyPrompt: stats?.copyPromptCount ?? 0,
      helpful: feedback.filter((f) => f.helpful).length,
      notHelpful: feedback.filter((f) => !f.helpful).length,
      timeDecayRevenue: 0,
      firstTouchRevenue: 0,
      purchases: 0,
    },
    sources: [],
    daily: [],
    aiBots: [],
    topQueries: [],
    h1Variants: h1Stats.map((v) => ({
      variantIndex: v.variantIndex,
      showns: v.showns,
      converted: v.converted,
      cr: v.showns > 0 ? v.converted / v.showns : 0,
    })),
    feedback: feedback.map((f) => ({ helpful: f.helpful, comment: f.comment, createdAt: f.createdAt })),
  }
}
