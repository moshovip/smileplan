import type { ReactNode } from 'react'
import { Lightbulb, AlertTriangle, Info, AlertOctagon } from 'lucide-react'

type CalloutType = 'tip' | 'warning' | 'info' | 'danger'

interface Props {
  type?: CalloutType
  title?: string
  children: ReactNode
}

const STYLES: Record<CalloutType, { wrap: string; icon: string; label: string; Icon: typeof Lightbulb }> = {
  tip: {
    wrap: 'border-accent/40 bg-accent-soft',
    icon: 'text-accent',
    label: 'Tip',
    Icon: Lightbulb,
  },
  info: {
    wrap: 'border-border-hover bg-bg-card',
    icon: 'text-text-sub',
    label: 'Note',
    Icon: Info,
  },
  warning: {
    wrap: 'border-yellow-700/50 bg-yellow-950/30',
    icon: 'text-yellow-400',
    label: 'Warning',
    Icon: AlertTriangle,
  },
  danger: {
    wrap: 'border-red-800/60 bg-red-950/30',
    icon: 'text-red-400',
    label: 'Danger',
    Icon: AlertOctagon,
  },
}

export function Callout({ type = 'info', title, children }: Props) {
  const s = STYLES[type]
  return (
    <div
      data-mdx-block="callout"
      data-callout-type={type}
      role={type === 'danger' || type === 'warning' ? 'alert' : 'note'}
      className={`my-6 flex gap-4 rounded-2xl border p-5 ${s.wrap}`}
    >
      <s.Icon size={20} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${s.icon}`} />
      <div className="min-w-0">
        <div className={`text-[11px] font-semibold uppercase tracking-[0.15em] mb-1 ${s.icon}`}>{title ?? s.label}</div>
        <div className="text-[15px] leading-relaxed text-text">{children}</div>
      </div>
    </div>
  )
}
