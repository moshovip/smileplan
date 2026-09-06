import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loadOgFonts } from '@/lib/og/fonts'
import { siteConfig } from '@/site.config'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  const concept = await prisma.concept.findUnique({
    where: { slug },
    select: { term: true, shortDefinition: true, status: true },
  })

  if (!concept || concept.status !== 'published') {
    return new Response('Not found', { status: 404 })
  }

  const term = concept.term.length > 60 ? `${concept.term.slice(0, 57)}…` : concept.term
  const definition =
    concept.shortDefinition.length > 200
      ? `${concept.shortDefinition.slice(0, 197)}…`
      : concept.shortDefinition

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
              'radial-gradient(ellipse at 50% 0%, rgba(217,119,87,0.20) 0%, transparent 60%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: 'rgba(217,119,87,0.14)',
              color: '#d97757',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid rgba(217,119,87,0.32)',
              display: 'flex',
            }}
          >
            Concept
          </div>
        </div>
        <div
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: 100,
            lineHeight: 1.0,
            color: '#ede9e3',
            marginTop: 32,
            display: 'flex',
            zIndex: 1,
          }}
        >
          {term}
        </div>
        <div
          style={{
            color: '#a8a29e',
            fontSize: 30,
            lineHeight: 1.35,
            marginTop: 24,
            display: 'flex',
            zIndex: 1,
            flex: 1,
          }}
        >
          {definition}
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
          <div style={{ color: '#6b6560', fontSize: 22, display: 'flex' }}>
            Glossary
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
