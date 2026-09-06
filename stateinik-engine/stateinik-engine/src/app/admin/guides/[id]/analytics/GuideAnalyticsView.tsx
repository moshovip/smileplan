'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { GuideDetailStats } from '@/lib/analytics/guide-detail-stats'

const PERIODS = [7, 30, 90, 180] as const

function num(n: number): string {
  return n.toLocaleString('en-US')
}
function pct(n: number): string {
  return (n * 100).toFixed(1) + '%'
}
function money(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n)
}

export function GuideAnalyticsView({
  stats,
  guideId,
  initialDays,
}: {
  stats: GuideDetailStats
  guideId: string
  initialDays: number
}) {
  const router = useRouter()
  const params = useSearchParams()

  const setDays = (d: number) => {
    const next = new URLSearchParams(params.toString())
    next.set('days', d.toString())
    router.push(`/admin/guides/${guideId}/analytics?${next.toString()}`)
  }

  const t = stats.totals
  const maxDaily = stats.daily.length > 0 ? Math.max(...stats.daily.map((d) => d.views)) : 1

  return (
    <div className="mt-6 space-y-6">
      <div className="flex justify-end gap-1 rounded-full border border-border p-1 w-fit ml-auto">
        {PERIODS.map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-full px-3 py-1 text-xs ${
              d === initialDays ? 'bg-accent text-bg' : 'text-text-dim hover:text-text'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <Kpi label="Views" value={num(t.views)} />
        <Kpi label="Unique" value={num(t.uniqueVisitors)} />
        <Kpi label="Sessions" value={num(t.sessions)} />
        <Kpi label="CTA clicks" value={num(t.ctaClicks)} />
        <Kpi label="Bookmarks" value={num(t.bookmarks)} />
        <Kpi label="Shares" value={num(t.shares)} />
        <Kpi label="Helpful/not" value={`${t.helpful}/${t.notHelpful}`} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi label="Revenue (Time-Decay)" value={money(t.timeDecayRevenue)} accent />
        <Kpi label="Revenue (First-Touch)" value={money(t.firstTouchRevenue)} accent />
        <Kpi label="Attributed purchases" value={num(t.purchases)} accent />
      </div>

      <Card title="Views by day">
        {stats.daily.length === 0 ? (
          <p className="text-text-dim">No data for this period</p>
        ) : (
          <div className="flex items-end gap-1" style={{ minHeight: 140 }}>
            {stats.daily.map((d) => (
              <div
                key={d.date}
                className="flex flex-1 flex-col items-center gap-1"
                title={`${d.date}: ${d.views} views, ${d.uniques} unique`}
              >
                <div
                  className="w-full rounded-t bg-accent/60 hover:bg-accent"
                  style={{ height: `${(d.views / maxDaily) * 120}px` }}
                />
                <div className="text-[10px] text-text-dim">{d.date.slice(5)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Traffic sources">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-text-dim">
              <tr>
                <th className="pb-2">Channel</th>
                <th className="pb-2 text-right">Views</th>
                <th className="pb-2 text-right">CTA</th>
                <th className="pb-2 text-right">CR</th>
              </tr>
            </thead>
            <tbody>
              {stats.sources.map((s) => (
                <tr key={s.trafficSource} className="border-t border-border/40">
                  <td className="py-2">{s.trafficSource}</td>
                  <td className="py-2 text-right">{num(s.views)}</td>
                  <td className="py-2 text-right">{num(s.ctaClicks)}</td>
                  <td className="py-2 text-right">
                    {s.views > 0 ? pct(s.ctaClicks / s.views) : '—'}
                  </td>
                </tr>
              ))}
              {stats.sources.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-text-dim">
                    No data for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card title="AI bots that visited the guide">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-text-dim">
              <tr>
                <th className="pb-2">Bot</th>
                <th className="pb-2 text-right">Visits</th>
                <th className="pb-2">Last</th>
              </tr>
            </thead>
            <tbody>
              {stats.aiBots.map((b) => (
                <tr key={b.botName} className="border-t border-border/40">
                  <td className="py-2 font-mono text-xs">{b.botName}</td>
                  <td className="py-2 text-right">{num(b.hits)}</td>
                  <td className="py-2 text-xs">
                    {b.lastHit ? new Date(b.lastHit).toLocaleString('en-US') : '—'}
                  </td>
                </tr>
              ))}
              {stats.aiBots.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-text-dim">
                    No AI bot visits
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Card title="Search queries (Google Search Console + Yandex)">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-text-dim">
            <tr>
              <th className="pb-2">Source</th>
              <th className="pb-2">Query</th>
              <th className="pb-2 text-right">Impressions</th>
              <th className="pb-2 text-right">Clicks</th>
              <th className="pb-2 text-right">Position</th>
            </tr>
          </thead>
          <tbody>
            {stats.topQueries.map((q, i) => (
              <tr key={i} className="border-t border-border/40">
                <td className="py-2 text-xs">{q.source}</td>
                <td className="py-2">{q.query}</td>
                <td className="py-2 text-right">{num(q.impressions)}</td>
                <td className="py-2 text-right">{num(q.clicks)}</td>
                <td className="py-2 text-right">{q.avgPosition?.toFixed(1) ?? '—'}</td>
              </tr>
            ))}
            {stats.topQueries.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-text-dim">
                  No data. The sync cron has not run yet or the guide is not indexed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {stats.h1Variants.length > 0 && (
        <Card title="H1 variants (A/B test)">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-text-dim">
              <tr>
                <th className="pb-2">Variant</th>
                <th className="pb-2 text-right">Impressions</th>
                <th className="pb-2 text-right">Conversions</th>
                <th className="pb-2 text-right">CR</th>
              </tr>
            </thead>
            <tbody>
              {stats.h1Variants.map((v) => (
                <tr key={v.variantIndex} className="border-t border-border/40">
                  <td className="py-2">#{v.variantIndex}</td>
                  <td className="py-2 text-right">{num(v.showns)}</td>
                  <td className="py-2 text-right">{num(v.converted)}</td>
                  <td className="py-2 text-right">{pct(v.cr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {stats.feedback.length > 0 && (
        <Card title="Latest feedback">
          <ul className="space-y-2 text-sm">
            {stats.feedback.map((f, i) => (
              <li key={i} className="border-l-2 pl-3" style={{ borderColor: f.helpful ? '#10b981' : '#ef4444' }}>
                <span className="text-xs text-text-dim">
                  {new Date(f.createdAt).toLocaleString('en-US')} · {f.helpful ? '👍' : '👎'}
                </span>
                {f.comment && <div className="text-text-sub">{f.comment}</div>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent ? 'border-accent/40 bg-accent/5' : 'border-border bg-bg-card/40'
      }`}
    >
      <div className="text-xs uppercase tracking-wider text-text-dim">{label}</div>
      <div className="mt-1 font-head text-xl text-text">{value}</div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-bg-card/40 p-5">
      <h2 className="mb-3 font-head text-lg text-text">{title}</h2>
      {children}
    </section>
  )
}
