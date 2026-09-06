// Deterministic formatter (fixed locale + UTC) so the server and client render
// identical text and avoid a hydration mismatch.
const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return DATE_FMT.format(d)
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function difficultyLabel(d: string | null | undefined): string {
  if (!d) return ''
  return DIFFICULTY_LABEL[d] ?? d
}

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/25',
  intermediate: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/25',
  advanced: 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/25',
}

export function difficultyBadgeClasses(d: string | null | undefined): string {
  if (!d) return ''
  return DIFFICULTY_BADGE[d] ?? 'bg-accent-soft text-accent'
}

// Deterministic formatter (fixed locale + UTC) so the server and client agree.
const MONTH_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
})

/** «March 2026» — month and year of publication for the card. */
export function formatGuideMonth(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return MONTH_FMT.format(d)
}

const NEW_GUIDE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

/** A guide counts as new if it was published less than 14 days ago. */
export function isNewGuide(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return false
  return Date.now() - d.getTime() < NEW_GUIDE_WINDOW_MS
}

/** Threshold below which the reader count is hidden on the card (too early to brag). */
export const VIEWS_DISPLAY_THRESHOLD = 10

/** «1,010» — reader count with thousands separators. */
export function formatViews(n: number): string {
  return n.toLocaleString('en-US')
}
