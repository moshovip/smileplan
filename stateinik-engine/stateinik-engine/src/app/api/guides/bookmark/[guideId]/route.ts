import { NextResponse } from 'next/server'

// Stub endpoint for a bookmark toggle: it accepts the request and no-ops by
// design. Wire it to the GuideBookmark model (and your own auth) to persist
// per-user bookmarks.
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ ok: true })
}
