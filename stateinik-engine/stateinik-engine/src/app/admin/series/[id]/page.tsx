import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SeriesForm } from './series-form'

export const metadata = {
  title: 'Edit series — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditSeriesPage({ params }: Props) {
  const { id } = await params
  const series = await prisma.guideSeries.findUnique({
    where: { id },
    include: {
      guides: {
        select: { id: true, title: true, slug: true, seriesOrder: true, status: true },
        orderBy: { seriesOrder: 'asc' },
      },
    },
  })
  if (!series) notFound()

  // Also all guides (not part of this series) available to add
  const allGuides = await prisma.guide.findMany({
    where: { deletedAt: null, OR: [{ seriesId: null }, { seriesId: id }] },
    select: { id: true, title: true, slug: true, seriesOrder: true, seriesId: true, status: true },
    orderBy: { title: 'asc' },
  })

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/series" className="text-text-dim hover:text-text text-[13px]">
          ← Back to list
        </Link>
        <h1 className="font-head text-[24px] text-text mt-2">{series.title}</h1>
        <p className="text-text-dim text-[13px] mt-1">/{series.slug}</p>
      </div>

      <SeriesForm
        mode="edit"
        series={{
          id: series.id,
          slug: series.slug,
          title: series.title,
          description: series.description ?? '',
        }}
        guides={allGuides.map(g => ({
          id: g.id,
          title: g.title,
          slug: g.slug,
          seriesId: g.seriesId,
          seriesOrder: g.seriesOrder,
          status: g.status,
        }))}
        seriesId={series.id}
      />
    </>
  )
}
