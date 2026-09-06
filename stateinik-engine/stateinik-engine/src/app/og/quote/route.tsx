import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { loadOgFonts } from '@/lib/og/fonts'
import { siteConfig, routes } from '@/site.config'

export const runtime = 'nodejs'

const APP_HOST = new URL(siteConfig.url).host

// Strip control chars (incl. CR/LF) from values rendered into the PNG so a user
// can't break the layout or inject a suspicious escape.
const CONTROL_CHARS_RE = /[\x00-\x1f\x7f]/g

function sanitize(value: string, max: number): string {
  return value.replace(CONTROL_CHARS_RE, ' ').slice(0, max)
}

// Slug must be kebab-case (ASCII or Cyrillic): no "..", "/" or spaces.
const SLUG_RE = /^[a-z0-9а-яё][a-z0-9а-яё-]{0,199}$/

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const text = sanitize(searchParams.get('text') || '', 280)
  const author = sanitize(searchParams.get('author') || '', 80)
  const rawSlug = sanitize(searchParams.get('guideSlug') || '', 120)
  const guideSlug = SLUG_RE.test(rawSlug) ? rawSlug : ''

  if (!text) {
    return new Response('text is required', { status: 400 })
  }

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
        {/* radial accent */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(217,119,87,0.18) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: 72,
            lineHeight: 1.15,
            color: '#ede9e3',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            zIndex: 1,
          }}
        >
          «{text}»
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {author && (
              <span style={{ fontSize: 28, color: '#a8a29e' }}>— {author}</span>
            )}
            {guideSlug && (
              <span style={{ fontSize: 20, color: '#6b6560', marginTop: 8 }}>
                {APP_HOST}{routes.guide(guideSlug)}
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontSize: 40,
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
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    }
  )
}
