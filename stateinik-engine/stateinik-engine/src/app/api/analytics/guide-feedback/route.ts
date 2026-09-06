import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { getCurrentUser } from '@/lib/auth-helpers'

interface IncomingPayload {
  guideId?: string
  guideSlug?: string
  helpful?: boolean
  comment?: string | null
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req)
  const rl = await checkRateLimit(ip, 'analytics-guide-feedback', 30, 60)
  if (!rl.allowed) {
    return NextResponse.json({ ok: true, throttled: true })
  }

  let body: IncomingPayload
  try {
    body = (await req.json()) as IncomingPayload
  } catch {
    return NextResponse.json({ ok: true })
  }

  if (!body || typeof body !== 'object' || typeof body.helpful !== 'boolean') {
    return NextResponse.json({ ok: true })
  }

  let guideId: string | null = body.guideId ?? null
  if (!guideId && typeof body.guideSlug === 'string') {
    const guide = await prisma.guide.findUnique({
      where: { slug: body.guideSlug },
      select: { id: true, deletedAt: true },
    })
    if (guide && !guide.deletedAt) guideId = guide.id
  }

  if (!guideId) return NextResponse.json({ ok: true })

  const me = await getCurrentUser().catch(() => null)
  const userId = me?.id ?? null

  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 2000) : null

  try {
    await prisma.guideFeedback.create({
      data: {
        guideId,
        helpful: body.helpful,
        comment: comment ? comment : null,
        userId,
      },
    })
  } catch {
    // Swallow: feedback writes must never surface an error to the client.
  }

  return NextResponse.json({ ok: true })
}
