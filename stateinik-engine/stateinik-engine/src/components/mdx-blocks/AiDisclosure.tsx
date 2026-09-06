import { Sparkles } from 'lucide-react'

export function AiDisclosure() {
  return (
    <div data-mdx-block="ai-disclosure" className="my-8 rounded-2xl border border-border bg-bg-card-hover p-5 flex gap-3 items-start">
      <Sparkles size={18} strokeWidth={1.5} className="text-accent mt-0.5 shrink-0" />
      <p className="text-text-sub text-[14px] leading-relaxed">
        This material is based on a live stream by Artemii Miller. AI helped
        structure the notes; the voice and wording are the author's own.
      </p>
    </div>
  )
}
