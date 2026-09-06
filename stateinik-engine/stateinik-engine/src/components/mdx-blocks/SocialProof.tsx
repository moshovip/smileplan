import { Eye, CheckCircle2, Share2 } from 'lucide-react'

interface Props {
  views?: number
  applied?: number
  shares?: number
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return String(n)
}

export function SocialProof({ views, applied, shares }: Props) {
  const items: Array<{ icon: typeof Eye; label: string; value: number }> = []
  if (views && views > 0) items.push({ icon: Eye, label: 'views', value: views })
  if (applied && applied > 0) items.push({ icon: CheckCircle2, label: 'applied', value: applied })
  if (shares && shares > 0) items.push({ icon: Share2, label: 'shares', value: shares })
  if (items.length === 0) return null

  return (
    <div data-mdx-block="social-proof" className="flex flex-wrap gap-4 text-sm text-text-sub my-4">
      {items.map((item, i) => (
        <div key={i} className="inline-flex items-center gap-1.5">
          <item.icon size={14} strokeWidth={1.5} className="text-text-dim" />
          <span className="text-text">{formatCount(item.value)}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
