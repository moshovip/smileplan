'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Topic {
  id: string
  slug: string
  title: string
  description: string | null
  guides: number
  concepts: number
}

const inputClass =
  'w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-[14px] text-text focus:outline-none focus:border-accent'

export function TopicsManager({ initialTopics }: { initialTopics: Topic[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug: slug || undefined }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to create topic')
      }
      setTitle('')
      setSlug('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  async function rename(topic: Topic) {
    const next = window.prompt('Topic title', topic.title)
    if (next == null || !next.trim() || next.trim() === topic.title) return
    const res = await fetch(`/api/admin/topics/${topic.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: next.trim() }),
    })
    if (res.ok) router.refresh()
    else window.alert('Rename failed')
  }

  async function remove(topic: Topic) {
    if (
      !window.confirm(
        `Delete topic "${topic.title}"? Guides and concepts keep existing but lose this tag.`,
      )
    )
      return
    const res = await fetch(`/api/admin/topics/${topic.id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
    else window.alert('Delete failed')
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="flex flex-wrap items-end gap-3 max-w-2xl">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[13px] text-text-dim mb-1.5">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Getting started"
            className={inputClass}
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[13px] text-text-dim mb-1.5">Slug (optional)</label>
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="getting-started"
            className={inputClass + ' font-mono text-[13px]'}
          />
        </div>
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-xl text-[14px] font-medium disabled:opacity-40"
        >
          {busy ? 'Adding…' : 'Add topic'}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-red-400 text-[13px] max-w-2xl">
          {error}
        </div>
      )}

      {initialTopics.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-8 text-text-dim text-center">
          No topics yet.
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-text-dim text-[11px] uppercase tracking-[0.1em]">
                <th className="px-4 py-3">Title</th>
                <th className="px-3 py-3">Slug</th>
                <th className="px-3 py-3 text-right">Guides</th>
                <th className="px-3 py-3 text-right">Concepts</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialTopics.map(t => (
                <tr
                  key={t.id}
                  className="border-b border-border last:border-0 hover:bg-bg-card-hover"
                >
                  <td className="px-4 py-3 text-text">{t.title}</td>
                  <td className="px-3 py-3 text-text-dim font-mono text-[12px]">{t.slug}</td>
                  <td className="px-3 py-3 text-right text-text-sub">{t.guides}</td>
                  <td className="px-3 py-3 text-right text-text-sub">{t.concepts}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <button onClick={() => rename(t)} className="text-text-dim hover:text-accent">
                      Rename
                    </button>
                    <span className="text-border mx-2">·</span>
                    <button onClick={() => remove(t)} className="text-text-dim hover:text-red-400">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
