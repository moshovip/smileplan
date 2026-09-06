import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminApi } from '@/lib/auth-helpers'
import { capabilities } from '@/lib/capabilities'

// Hero-illustration generation is an OPTIONAL, pluggable capability. The admin
// card (GuideIllustrationCard) posts here. By default no ImageProvider is wired,
// so we return a clear 501. To enable it: set IMAGE_PROVIDER + GEMINI_API_KEY (or
// your provider of choice), configure object storage, and implement the
// generation pipeline here behind `capabilities.illustration`.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth
  await params

  if (!capabilities.illustration) {
    return NextResponse.json(
      {
        error:
          'AI illustration is not configured. Set IMAGE_PROVIDER and GEMINI_API_KEY, then wire an ImageProvider in this route.',
      },
      { status: 501 },
    )
  }

  return NextResponse.json(
    { error: 'No ImageProvider implementation is wired in this build.' },
    { status: 501 },
  )
}
