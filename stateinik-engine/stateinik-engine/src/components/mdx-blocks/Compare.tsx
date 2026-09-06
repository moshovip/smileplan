import type { ReactNode } from 'react'

interface Props {
  before: ReactNode
  after: ReactNode
  beforeLabel?: string
  afterLabel?: string
}

export function Compare({ before, after, beforeLabel = 'Before', afterLabel = 'After' }: Props) {
  return (
    <div data-mdx-block="compare" className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-border bg-bg-card p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-sub mb-2">{beforeLabel}</div>
        <div className="text-[15px] leading-relaxed text-text">{before}</div>
      </div>
      <div className="rounded-2xl border border-accent/40 bg-accent-soft p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent mb-2">{afterLabel}</div>
        <div className="text-[15px] leading-relaxed text-text">{after}</div>
      </div>
    </div>
  )
}
