import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'H1 A/B test — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

interface VariantSpec {
  text: string
  weight?: number
}

const MIN_SHOWNS_FOR_WINNER = 100
const MIN_DELTA_PERCENT = 20

function normalize(raw: unknown): VariantSpec[] {
  if (!Array.isArray(raw)) {
    if (raw && typeof raw === 'object' && 'variants' in raw) {
      return normalize((raw as { variants: unknown }).variants)
    }
    return []
  }
  const out: VariantSpec[] = []
  for (const v of raw) {
    if (typeof v === 'string') {
      if (v.trim().length > 0) out.push({ text: v, weight: 1 })
    } else if (v && typeof v === 'object' && typeof (v as VariantSpec).text === 'string') {
      const text = (v as VariantSpec).text
      if (text.trim().length > 0) {
        out.push({ text, weight: (v as VariantSpec).weight ?? 1 })
      }
    }
  }
  return out
}

function convRate(showns: number, converted: number): number {
  if (showns <= 0) return 0
  return (converted / showns) * 100
}

export default async function AdminGuideH1TestPage({ params }: Props) {
  const { id } = await params

  const guide = await prisma.guide.findUnique({
    where: { id },
    select: { id: true, slug: true, title: true, h1Variants: true },
  })

  if (!guide) notFound()

  const variants = normalize(guide.h1Variants)

  const stats = await prisma.guideH1Stats.findMany({
    where: { guideId: id },
    orderBy: { variantIndex: 'asc' },
  })

  type Row = {
    index: number
    text: string
    weight: number
    showns: number
    converted: number
    rate: number
  }

  const rows: Row[] = variants.map((v, idx) => {
    const s = stats.find(s => s.variantIndex === idx)
    const showns = s?.showns ?? 0
    const converted = s?.converted ?? 0
    return {
      index: idx,
      text: v.text,
      weight: v.weight ?? 1,
      showns,
      converted,
      rate: convRate(showns, converted),
    }
  })

  // Variants not described in h1Variants but with accumulated stats — show them just in case.
  for (const s of stats) {
    if (!rows.find(r => r.index === s.variantIndex)) {
      rows.push({
        index: s.variantIndex,
        text: '(variant removed from h1Variants)',
        weight: 0,
        showns: s.showns,
        converted: s.converted,
        rate: convRate(s.showns, s.converted),
      })
    }
  }
  rows.sort((a, b) => a.index - b.index)

  const eligible = rows.filter(r => r.showns >= MIN_SHOWNS_FOR_WINNER)
  let winner: Row | null = null
  let loser: Row | null = null
  if (eligible.length >= 2) {
    const sortedByRate = [...eligible].sort((a, b) => b.rate - a.rate)
    const best = sortedByRate[0]
    const worst = sortedByRate[sortedByRate.length - 1]
    if (best.rate - worst.rate >= MIN_DELTA_PERCENT) {
      winner = best
      loser = worst
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-head text-[28px] text-text">H1 A/B test: {guide.title}</h1>
          <p className="text-text-dim text-[13px] mt-1 font-mono">/{guide.slug}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/guides/${guide.id}`}
            className="bg-white/5 hover:bg-white/10 text-text px-4 py-2.5 rounded-xl text-[14px]"
          >
            ← Editor
          </Link>
          <Link
            href={`/guides/${guide.slug}`}
            target="_blank"
            className="bg-white/5 hover:bg-white/10 text-text px-4 py-2.5 rounded-xl text-[14px]"
          >
            Open guide
          </Link>
        </div>
      </div>

      {variants.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-8 text-text-dim">
          This guide has no h1Variants. Open the editor, add 2-5 H1 variants (a JSON array
          {' '}<code className="font-mono text-[12px]">{'[{ "text": "...", "weight": 0.5 }]'}</code>) and
          publish — after that, impression and conversion stats will appear here.
        </div>
      ) : (
        <>
          {winner && loser && (
            <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
              <div className="font-head text-[18px] text-emerald-200 mb-1">
                Winner: variant #{winner.index + 1} ({winner.rate.toFixed(1)}% conversion)
              </div>
              <div className="text-text-sub text-[13px]">
                The best variant beats the worst (#{loser.index + 1}, {loser.rate.toFixed(1)}%) by {(winner.rate - loser.rate).toFixed(1)} percentage points at ≥ {MIN_SHOWNS_FOR_WINNER} impressions.
              </div>
              <div className="text-text-sub text-[13px] mt-2">
                Recommendation: replace the guide's <code className="font-mono">title</code> with the winner's text and clear the <code className="font-mono">h1Variants</code> field.
              </div>
              <div className="mt-3 rounded-lg bg-bg-card border border-border p-3 text-text text-[14px]">
                «{winner.text}»
              </div>
            </div>
          )}

          {!winner && eligible.length > 0 && (
            <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-text-sub text-[13px]">
              No winner yet: either the conv-rate gap is below {MIN_DELTA_PERCENT}%, or not every variant has reached ≥ {MIN_SHOWNS_FOR_WINNER} impressions.
            </div>
          )}

          <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-text-dim text-[11px] uppercase tracking-[0.1em]">
                    <th className="px-4 py-3">#</th>
                    <th className="px-3 py-3">Text</th>
                    <th className="px-3 py-3 text-right">Weight</th>
                    <th className="px-3 py-3 text-right">Impressions</th>
                    <th className="px-3 py-3 text-right">Conversions</th>
                    <th className="px-3 py-3 text-right">Conv-rate</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const isWinner = winner && r.index === winner.index
                    return (
                      <tr
                        key={r.index}
                        className={`border-b border-border last:border-0 hover:bg-bg-card-hover ${
                          isWinner ? 'bg-emerald-500/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-text-sub">{r.index + 1}</td>
                        <td className="px-3 py-3 text-text">{r.text}</td>
                        <td className="px-3 py-3 text-right text-text-sub">{r.weight}</td>
                        <td className="px-3 py-3 text-right text-text">{r.showns}</td>
                        <td className="px-3 py-3 text-right text-text">{r.converted}</td>
                        <td className="px-3 py-3 text-right text-text font-semibold">
                          {r.rate.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-text-dim text-[12px]">
            Conversion = a click on the primary CTA while a variant was shown.
            A winner is assigned at ≥ {MIN_SHOWNS_FOR_WINNER} impressions and a gap of ≥ {MIN_DELTA_PERCENT} percentage points.
          </p>
        </>
      )}
    </>
  )
}
