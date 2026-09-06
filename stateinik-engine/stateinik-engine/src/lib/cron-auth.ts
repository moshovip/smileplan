import { NextRequest, NextResponse } from 'next/server'

/**
 * Guard for /api/cron/* endpoints. Requires `Authorization: Bearer $CRON_SECRET`.
 * Returns a 401 NextResponse to short-circuit, or null when authorized.
 */
export function requireCron(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
