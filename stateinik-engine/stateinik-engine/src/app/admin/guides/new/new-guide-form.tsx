'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/mdx/extract'

interface Author {
  id: string
  publicName: string | null
  firstName: string | null
  lastName: string | null
  email: string
}

interface Topic {
  id: string
  slug: string
  title: string
}

interface Props {
  authors: Author[]
  topics: Topic[]
  defaultAuthorId?: string
}

const inputClass =
  'w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-[14px] text-text focus:outline-none focus:border-accent'

export function NewGuideForm({ authors, topics, defaultAuthorId }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [type, setType] = useState<'pillar' | 'tutorial' | 'playbook' | 'recipe'>('tutorial')
  const [authorId, setAuthorId] = useState(defaultAuthorId ?? authors[0]?.id ?? '')
  const [topicIds, setTopicIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function autoSlug() {
    if (title.trim()) setSlug(slugify(title))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title),
          type,
          authorId,
          topicIds,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create')
      }
      const data = await res.json()
      router.push(`/admin/guides/${data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      <div>
        <label className="block text-[13px] text-text-dim mb-1.5">Title (H1)</label>
        <input
          type="text"
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => !slug && autoSlug()}
          placeholder="How to receive webhooks from external services"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-[13px] text-text-dim mb-1.5">Slug</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="how-to-receive-webhooks"
            className={inputClass + ' font-mono text-[13px]'}
          />
          <button
            type="button"
            onClick={autoSlug}
            className="bg-white/5 hover:bg-white/10 text-text px-4 rounded-xl text-[13px] whitespace-nowrap"
          >
            From title
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] text-text-dim mb-1.5">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as typeof type)}
            className={inputClass}
          >
            <option value="pillar">Pillar (cornerstone)</option>
            <option value="tutorial">Tutorial (step-by-step)</option>
            <option value="playbook">Playbook (plan)</option>
            <option value="recipe">Recipe (recipe)</option>
          </select>
        </div>
        <div>
          <label className="block text-[13px] text-text-dim mb-1.5">Author</label>
          <select
            value={authorId}
            required
            onChange={e => setAuthorId(e.target.value)}
            className={inputClass}
          >
            {authors.length === 0 && <option value="">No public authors</option>}
            {authors.map(a => {
              const name =
                a.publicName ||
                [a.firstName, a.lastName].filter(Boolean).join(' ') ||
                a.email
              return (
                <option key={a.id} value={a.id}>
                  {name}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[13px] text-text-dim mb-1.5">Topics</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {topics.map(t => (
            <label
              key={t.id}
              className="flex items-center gap-2 bg-bg-card border border-border rounded-xl px-3 py-2 text-[13px] cursor-pointer hover:border-accent/50"
            >
              <input
                type="checkbox"
                checked={topicIds.includes(t.id)}
                onChange={e => {
                  setTopicIds(prev =>
                    e.target.checked ? [...prev, t.id] : prev.filter(x => x !== t.id)
                  )
                }}
              />
              {t.title}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-red-400 text-[13px]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || !title || !authorId}
          className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-xl text-[14px] font-medium disabled:opacity-40"
        >
          {submitting ? 'Creating…' : 'Create draft'}
        </button>
      </div>
    </form>
  )
}
