import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdminApi } from '@/lib/auth-helpers'
import { pingIndexNow } from '@/lib/seo/indexnow'
import { routes, siteConfig } from '@/site.config'

interface Params {
  params: Promise<{ id: string }>
}

const APP_URL = siteConfig.url

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const c = await prisma.concept.findUnique({
    where: { id },
    select: { slug: true, status: true, publishedAt: true },
  })
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (c.status === 'published') {
    return NextResponse.json({ error: 'Already published' }, { status: 400 })
  }

  await prisma.concept.update({
    where: { id },
    data: { status: 'published', publishedAt: c.publishedAt ?? new Date() },
  })

  revalidatePath(routes.concept(c.slug))
  revalidatePath(routes.concepts())
  revalidatePath('/sitemap.xml')
  revalidatePath('/llms.txt')
  revalidatePath('/llms-full.txt')
  void pingIndexNow([`${APP_URL}${routes.concept(c.slug)}`]).catch(err => {
    console.error('[concepts/publish] IndexNow failed:', err)
  })

  return NextResponse.json({ ok: true })
}
