import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { checkOrigin } from '@/lib/csrf'
import { checkEditorAccess } from '@/lib/guides/authz'
import { renderMdx } from '@/lib/mdx/render'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const csrf = checkOrigin(req)
  if (csrf) return csrf
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await checkEditorAccess(me.id, me.isAdmin)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { content?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const { content } = await renderMdx(body.content ?? '', { context: 'guide' })
    // Lazy-import react-dom/server so Next.js doesn't throw a Server Component error
    const reactDomServer = await import('react-dom/server')
    const html = reactDomServer.renderToString(content as React.ReactElement)
    return NextResponse.json({ html })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Render error' },
      { status: 400 }
    )
  }
}
