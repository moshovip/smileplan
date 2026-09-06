import { Wrench } from 'lucide-react'

interface Tool {
  name: string
  icon?: string
  url?: string
}

interface Props {
  tools: Tool[]
}

export function RequiredTools({ tools }: Props) {
  if (!tools || tools.length === 0) return null
  return (
    <div data-mdx-block="required-tools" className="my-6 rounded-2xl border border-border bg-bg-card p-5">
      <div className="flex items-center gap-2 text-text-sub text-[11px] font-semibold uppercase tracking-[0.15em] mb-3">
        <Wrench size={14} strokeWidth={1.5} className="text-accent" />
        <span>What you'll need</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tools.map(t => {
          const inner = (
            <span className="inline-flex items-center gap-2 rounded-full bg-bg-card-hover border border-border px-3 py-1.5 text-sm text-text hover:border-accent transition-colors">
              {t.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.icon} alt="" className="w-4 h-4" />
              )}
              <span>{t.name}</span>
            </span>
          )
          return t.url ? (
            <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          ) : (
            <span key={t.name}>{inner}</span>
          )
        })}
      </div>
    </div>
  )
}
