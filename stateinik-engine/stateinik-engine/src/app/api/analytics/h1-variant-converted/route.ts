import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

interface IncomingPayload {
  guideId?: string
  variantIndex?: number
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req)
  const rl = await checkRateLimit(ip, 'analytics-h1-converted', 60, 60)
  if (!rl.allowed) return NextResponse.json({ ok: true, throttled: true })

  let body: IncomingPayload
  try {
    body = (await req.json()) as IncomingPayload
  } catch {
    return NextResponse.json({ ok: true })
  }

  if (!body || typeof body.guideId !== 'string' || typeof body.variantIndex !== 'number') {
    return NextResponse.json({ ok: true })
  }

  if (!Number.isInteger(body.variantIndex) || body.variantIndex < 0 || body.variantIndex > 100) {
    return NextResponse.json({ ok: true })
  }

  try {
    await prisma.guideH1Stats.upsert({
      where: { guideId_variantIndex: { guideId: body.guideId, variantIndex: body.variantIndex } },
      create: { guideId: body.guideId, variantIndex: body.variantIndex, converted: 1 },
      update: { converted: { increment: 1 } },
    })
  } catch {
    // Swallow: analytics writes must never surface an error to the client.
  }

  return NextResponse.json({ ok: true })
}
