import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'Series — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

export default async function AdminSeriesPage() {
  const series = await prisma.guideSeries.findMany({
    include: { _count: { select: { guides: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-head text-[28px] text-text">Series</h1>
          <p className="text-text-dim text-[13px] mt-1">{series.length} series</p>
        </div>
        <Link
          href="/admin/series/new"
          className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl text-[14px] font-medium"
        >
          Create series
        </Link>
      </div>

      {series.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-8 text-text-dim text-center">
          No series yet.
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-text-dim text-[11px] uppercase tracking-[0.1em]">
                <th className="px-4 py-3">Title</th>
                <th className="px-3 py-3">Slug</th>
                <th className="px-3 py-3 text-right">Guides</th>
                <th className="px-3 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {series.map(s => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-bg-card-hover">
                  <td className="px-4 py-3">
                    <Link href={`/admin/series/${s.id}`} className="text-text hover:text-accent">
                      {s.title}
                    </Link>
                    {s.description && (
                      <div className="text-text-dim text-[11px] mt-0.5 line-clamp-1">{s.description}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-text-dim font-mono text-[12px]">{s.slug}</td>
                  <td className="px-3 py-3 text-right text-text-sub">{s._count.guides}</td>
                  <td className="px-3 py-3 text-text-dim text-[12px]">
                    {s.updatedAt.toLocaleDateString('en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
