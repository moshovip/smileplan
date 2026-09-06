import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import type { GuideStatus } from '@prisma/client'

export const metadata = {
  title: 'Concepts — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<GuideStatus, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-white/5 text-text-sub' },
  scheduled: { label: 'Scheduled', cls: 'bg-amber-500/15 text-amber-300' },
  published: { label: 'Published', cls: 'bg-emerald-500/15 text-emerald-300' },
  archived: { label: 'Archived', cls: 'bg-white/5 text-text-dim' },
}

export default async function AdminConceptsPage() {
  const concepts = await prisma.concept.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    take: 300,
  })

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-head text-[28px] text-text">Concepts</h1>
          <p className="text-text-dim text-[13px] mt-1">{concepts.length} terms</p>
        </div>
        <Link
          href="/admin/concepts/new"
          className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl text-[14px] font-medium"
        >
          New concept
        </Link>
      </div>

      {concepts.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-8 text-text-dim text-center">
          No concepts yet.
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-text-dim text-[11px] uppercase tracking-[0.1em]">
                <th className="px-4 py-3">Term</th>
                <th className="px-3 py-3">Short definition</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {concepts.map(c => {
                const st = STATUS_LABELS[c.status]
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg-card-hover">
                    <td className="px-4 py-3">
                      <Link href={`/admin/concepts/${c.id}`} className="text-text hover:text-accent">
                        {c.term}
                      </Link>
                      <div className="text-text-dim text-[11px] font-mono mt-0.5">/{c.slug}</div>
                    </td>
                    <td className="px-3 py-3 text-text-sub line-clamp-2">{c.shortDefinition}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-[11px] ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-text-dim text-[12px]">
                      {c.updatedAt.toLocaleDateString('en-US')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
