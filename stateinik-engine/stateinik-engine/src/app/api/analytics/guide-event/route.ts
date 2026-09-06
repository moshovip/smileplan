import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

type GuideStatsField =
  | 'viewsCount'
  | 'bookmarksCount'
  | 'appliedCount'
  | 'shareCount'
  | 'copyPromptCount'
  | 'ctaClickCount'
  | 'pogoStickCount'

const STATS_FIELD: Record<string, GuideStatsField | undefined> = {
  guide_view: 'viewsCount',
  guide_copy_prompt: 'copyPromptCount',
  guide_share: 'shareCount',
  guide_cta_click: 'ctaClickCount',
  guide_apply_click: 'appliedCount',
  came_from_search_bounce: 'pogoStickCount',
}

interface IncomingPayload {
  name?: string
  guideSlug?: string
  guideId?: string
  details?: Record<string, unknown>
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req)
  const rl = await checkRateLimit(ip, 'analytics-guide-event', 100, 60)
  if (!rl.allowed) return NextResponse.json({ ok: true, throttled: true })

  let body: IncomingPayload
  try {
    body = (await req.json()) as IncomingPayload
  } catch {
    return NextResponse.json({ ok: true })
  }

  if (!body || typeof body.name !== 'string' || typeof body.guideSlug !== 'string') {
    return NextResponse.json({ ok: true })
  }

  const guide = await prisma.guide.findUnique({
    where: { slug: body.guideSlug },
    select: { id: true, deletedAt: true },
  })
  if (!guide || guide.deletedAt) return NextResponse.json({ ok: true })

  let field: GuideStatsField | undefined = STATS_FIELD[body.name]
  if (body.name === 'guide_bookmark_toggle') {
    const added = (body.details as { added?: boolean } | undefined)?.added
    if (added === true) field = 'bookmarksCount'
  }

  if (field) {
    try {
      await prisma.guideStats.upsert({
        where: { guideId: guide.id },
        create: { guideId: guide.id, [field]: 1 } as Prisma.GuideStatsUncheckedCreateInput,
        update: { [field]: { increment: 1 } } as Prisma.GuideStatsUpdateInput,
      })
    } catch {
      // analytics must never 500
    }
  }

  return NextResponse.json({ ok: true })
}
