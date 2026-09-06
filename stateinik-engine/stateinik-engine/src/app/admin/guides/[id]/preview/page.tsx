import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { renderMdx } from '@/lib/mdx/render'

export const metadata = {
  title: 'Guide preview — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GuidePreviewPage({ params }: Props) {
  const { id } = await params
  const guide = await prisma.guide.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  })
  if (!guide) notFound()

  let rendered: React.ReactNode = null
  let renderError: string | null = null
  try {
    const r = await renderMdx(guide.content, { context: 'guide' })
    rendered = r.content
  } catch (e) {
    renderError = e instanceof Error ? e.message : 'Render error'
  }

  return (
    <>
      <div className="mb-4 sticky top-0 bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2 text-amber-200 text-[13px] flex items-center justify-between">
        <span>
          PREVIEW ({guide.status.toUpperCase()}) — visible only to admins and the author
        </span>
        <Link
          href={`/admin/guides/${id}`}
          className="text-amber-200 hover:text-amber-100"
        >
          ← Back to editor
        </Link>
      </div>

      <div className="max-w-3xl mx-auto py-6">
        <h1 className="font-head text-[40px] text-text leading-tight">{guide.title}</h1>
        <p className="text-text-sub text-[14px] mt-2">
          {guide.author.name ?? '—'} · {guide.readingMinutes} min read
        </p>
        <p className="text-text-dim text-[14px] mt-3 italic">{guide.excerpt}</p>

        <div className="border-t border-border my-6" />

        {renderError ? (
          <pre className="text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-[12px] whitespace-pre-wrap">
            {renderError}
          </pre>
        ) : (
          <article className="prose prose-invert max-w-none">{rendered}</article>
        )}
      </div>
    </>
  )
}
