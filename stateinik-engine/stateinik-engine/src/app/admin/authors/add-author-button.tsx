'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddAuthorButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setName('')
    setSlug('')
    setError(null)
  }

  async function create() {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error')
      }
      setOpen(false)
      reset()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-accent text-white px-5 py-2.5 rounded-xl text-[14px] font-medium hover:bg-accent-hover transition-colors"
      >
        New author
      </button>
    )
  }

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4 w-full max-w-md">
      <h2 className="font-head text-[16px] text-text mb-3">New author</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-[12px] text-text-dim mb-1">Name (required)</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Doe"
            autoFocus
            className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-[14px] text-text focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-[12px] text-text-dim mb-1">
            Slug (optional)
          </label>
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="jane-doe (auto-generated if empty)"
            className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-[14px] font-mono text-text focus:outline-none focus:border-accent"
          />
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-red-400 text-[13px]">
            {error}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={create}
            disabled={submitting}
            className="bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-xl text-[14px] font-medium disabled:opacity-40 transition-colors"
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              reset()
            }}
            className="text-text-sub hover:text-text px-4 py-2 rounded-xl text-[14px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
