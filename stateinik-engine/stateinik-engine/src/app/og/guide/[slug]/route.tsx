import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loadOgFonts } from '@/lib/og/fonts'
import { siteConfig } from '@/site.config'

export const runtime = 'nodejs'

const APP_URL = siteConfig.url

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  const guide = await prisma.guide.findUnique({
    where: { slug },
    select: {
      title: true,
      status: true,
      type: true,
      readingMinutes: true,
      author: { select: { name: true } },
    },
  })

  if (!guide || guide.status !== 'published') {
    return new Response('Not found', { status: 404 })
  }

  const title = guide.title.length > 110 ? `${guide.title.slice(0, 107)}…` : guide.title
  const authorName = guide.author?.name ?? siteConfig.name
  const typeLabel =
    guide.type === 'pillar'
      ? 'Guide'
      : guide.type === 'tutorial'
        ? 'Tutorial'
        : guide.type === 'playbook'
          ? 'Playbook'
          : 'Recipe'

  const fonts = await loadOgFonts()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '72px',
          background: '#141413',
          color: '#ede9e3',
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 80% 0%, rgba(217,119,87,0.22) 0%, transparent 60%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            color: '#d97757',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            zIndex: 1,
            display: 'flex',
          }}
        >
          {typeLabel}
        </div>
        <div
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: title.length > 60 ? 64 : 80,
            lineHeight: 1.05,
            color: '#ede9e3',
            marginTop: 28,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: 32,
            borderTop: '1px solid #282624',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              color: '#a8a29e',
              fontSize: 26,
            }}
          >
            <span>{authorName}</span>
            {guide.readingMinutes > 0 && (
              <span style={{ color: '#6b6560', fontSize: 20, marginTop: 6 }}>
                {guide.readingMinutes} min read
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontSize: 42,
              color: '#ede9e3',
              display: 'flex',
            }}
          >
            {siteConfig.name}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      ...(fonts.length > 0 ? { fonts } : {}),
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  )
}

void APP_URL
