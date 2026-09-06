'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  guideId: string
  revision: {
    id: string
    title: string
    createdAt: string
    authorName: string
    contentPreview: string
  }
}

export function RevisionRow({ guideId, revision }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function restore() {
    if (!confirm('Restore this revision? The current state will be saved as a new revision.')) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/guides/${guideId}/restore-revision/${revision.id}`, {
        method: 'POST',
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error')
      }
      router.push(`/admin/guides/${guideId}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      setBusy(false)
    }
  }

  return (
    <div className="px-5 py-3 flex items-start justify-between gap-4 hover:bg-bg-card-hover">
      <div className="min-w-0 flex-1">
        <div className="text-text text-[14px]">{revision.title}</div>
        <div className="text-text-dim text-[11px] mt-0.5">
          {new Date(revision.createdAt).toLocaleString('en-US')} · {revision.authorName}
        </div>
        <div className="text-text-sub text-[12px] mt-1 truncate font-mono">
          {revision.contentPreview}…
        </div>
      </div>
      <div className="flex items-center gap-3">
        {error && <span className="text-red-400 text-[11px]">{error}</span>}
        <button
          type="button"
          onClick={restore}
          disabled={busy}
          className="text-accent hover:text-accent-hover disabled:opacity-40 text-[12px]"
        >
          {busy ? 'Restoring…' : 'Restore'}
        </button>
      </div>
    </div>
  )
}
