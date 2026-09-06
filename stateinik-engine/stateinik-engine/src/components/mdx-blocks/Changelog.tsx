import { RefreshCw } from 'lucide-react'

interface Entry {
  date: string
  summary: string
}

interface Props {
  entries: Entry[]
  /** If true - shows all entries, otherwise only the last 30 days */
  showAll?: boolean
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export function Changelog({ entries, showAll }: Props) {
  if (!entries || entries.length === 0) return null
  const now = Date.now()
  const visible = showAll
    ? entries
    : entries.filter(e => {
        const t = Date.parse(e.date)
        return !Number.isNaN(t) && now - t < THIRTY_DAYS_MS
      })
  if (visible.length === 0) return null

  return (
    <div data-mdx-block="changelog" className="my-6 rounded-2xl border border-accent/30 bg-accent-soft p-5">
      <div className="flex items-center gap-2 text-accent text-[11px] font-semibold uppercase tracking-[0.15em] mb-3">
        <RefreshCw size={14} strokeWidth={1.5} />
        <span>Updated</span>
      </div>
      <ul className="space-y-2 text-text text-[14px]">
        {visible.map((e, i) => (
          <li key={i} className="flex gap-3">
            <time dateTime={e.date} className="text-text-sub shrink-0 w-24 text-xs pt-0.5">{e.date}</time>
            <span>{e.summary}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
