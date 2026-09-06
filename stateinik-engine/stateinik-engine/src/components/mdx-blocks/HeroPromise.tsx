import { Check, Clock, TrendingUp } from 'lucide-react'

type Difficulty = 'beginner' | 'intermediate' | 'advanced'

interface Props {
  whatYouLearn: string[]
  applyIn?: number
  saves?: number
  difficulty?: Difficulty
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function HeroPromise({ whatYouLearn, applyIn, saves, difficulty = 'intermediate' }: Props) {
  return (
    <div
      data-mdx-block="hero-promise"
      className="my-6 rounded-2xl border border-accent/30 bg-bg-card p-6 md:p-8"
    >
      <div className="text-accent text-[11px] font-semibold uppercase tracking-[0.15em] mb-4">What you'll learn</div>
      <ul className="space-y-3 mb-6">
        {whatYouLearn.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-text">
            <Check size={18} strokeWidth={1.5} className="text-accent mt-1 shrink-0" />
            <span className="text-[15px] leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
        {typeof applyIn === 'number' && (
          <div className="flex items-center gap-2 text-sm text-text-sub">
            <Clock size={16} strokeWidth={1.5} className="text-accent" />
            <span>Apply in <strong className="text-text">{applyIn} min</strong></span>
          </div>
        )}
        {typeof saves === 'number' && (
          <div className="flex items-center gap-2 text-sm text-text-sub">
            <TrendingUp size={16} strokeWidth={1.5} className="text-accent" />
            <span>Saves <strong className="text-text">{saves} h</strong></span>
          </div>
        )}
        <span className="ml-auto inline-flex items-center rounded-full bg-accent-soft text-accent px-3 py-1 text-xs font-medium">
          {DIFFICULTY_LABEL[difficulty]}
        </span>
      </div>
    </div>
  )
}
