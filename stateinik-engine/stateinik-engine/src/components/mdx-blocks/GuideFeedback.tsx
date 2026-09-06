'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { trackGuideEvent } from '@/lib/analytics/track-guide-event'

interface Props {
  guideId?: string
  guideSlug: string
}

type Vote = 'helpful' | 'unhelpful' | null

export function GuideFeedback({ guideId, guideSlug }: Props) {
  const storageKey = `guide-feedback-${guideSlug}`
  const [vote, setVote] = useState<Vote>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [alreadyAnswered, setAlreadyAnswered] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(storageKey)) setAlreadyAnswered(true)
  }, [storageKey])

  const pick = (v: Exclude<Vote, null>) => {
    setVote(v)
  }

  const submit = async () => {
    if (!vote) return
    const trimmedComment = comment.trim()
    try {
      await fetch('/api/analytics/guide-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId, guideSlug, helpful: vote === 'helpful', comment: trimmedComment || null }),
        keepalive: true,
      })
    } catch {
      // silently ignore
    }
    trackGuideEvent({
      name: 'guide_feedback',
      guideSlug,
      guideId,
      details: { helpful: vote === 'helpful', hasComment: trimmedComment.length > 0 },
    })
    localStorage.setItem(storageKey, vote)
    setSubmitted(true)
  }

  if (alreadyAnswered || submitted) {
    return (
      <div data-mdx-block="guide-feedback" className="my-8 rounded-2xl border border-border bg-bg-card-hover p-5 text-center text-text-sub text-sm">
        Thanks for your feedback.
      </div>
    )
  }

  return (
    <div data-mdx-block="guide-feedback" className="my-8 rounded-2xl border border-border bg-bg-card p-6">
      <div className="font-head text-xl text-text mb-3">Was this guide helpful?</div>
      <div className="flex gap-3 mb-3">
        <button
          type="button"
          onClick={() => pick('helpful')}
          aria-pressed={vote === 'helpful'}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
            vote === 'helpful'
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-border bg-bg-card-hover text-text hover:border-border-hover'
          }`}
        >
          <ThumbsUp size={16} strokeWidth={1.5} />
          <span>Yes</span>
        </button>
        <button
          type="button"
          onClick={() => pick('unhelpful')}
          aria-pressed={vote === 'unhelpful'}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
            vote === 'unhelpful'
              ? 'border-red-700 bg-red-950/30 text-red-300'
              : 'border-border bg-bg-card-hover text-text hover:border-border-hover'
          }`}
        >
          <ThumbsDown size={16} strokeWidth={1.5} />
          <span>No</span>
        </button>
      </div>
      {vote && (
        <>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="What could be better? (optional)"
            className="w-full rounded-lg border border-border bg-bg-card-hover px-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-accent transition-colors"
          />
          <button
            type="button"
            onClick={submit}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent text-bg font-bold px-4 py-2 hover:bg-accent-hover transition-colors"
          >
            Submit
          </button>
        </>
      )}
    </div>
  )
}
