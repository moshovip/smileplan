'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/mdx/extract'

interface GuideShape {
  id: string
  title: string
  slug: string
  seriesId: string | null
  seriesOrder: number | null
  status: string
}

interface Props {
  mode: 'create' | 'edit'
  series?: { id: string; slug: string; title: string; description: string }
  seriesId?: string
  guides: GuideShape[]
}

const inputClass =
  'w-full bg-bg border border-border rounded-xl px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent'
const labelClass = 'block text-[12px] text-text-dim mb-1'

export function SeriesForm({ mode, series, seriesId, guides }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(series?.title ?? '')
  const [slug, setSlug] = useState(series?.slug ?? '')
  const [description, setDescription] = useState(series?.description ?? '')

  const inSeriesInitial = useMemo(() => {
    if (!seriesId) return []
    return guides
      .filter(g => g.seriesId === seriesId)
      .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0))
      .map(g => g.id)
  }, [guides, seriesId])

  const [order, setOrder] = useState<string[]>(inSeriesInitial)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableGuides = guides.filter(g => !order.includes(g.id))

  function move(idx: number, delta: number) {
    setOrder(prev => {
      const next = [...prev]
      const target = idx + delta
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title,
        slug: slug || slugify(title),
        description: description || null,
        guideIds: order,
      }
      const url = mode === 'create' ? '/api/admin/series' : `/api/admin/series/${series!.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error')
      }
      const data = await res.json()
      if (mode === 'create') {
        router.push(`/admin/series/${data.id}`)
      } else {
        router.refresh()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!series) return
    if (!confirm('Delete this series? The guides will remain, but their link to the series will be removed.')) return
    const res = await fetch(`/api/admin/series/${series.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin/series')
      router.refresh()
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <fieldset className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
        <legend className="text-text-dim text-[11px] uppercase tracking-[0.1em] px-2">General</legend>
        <div>
          <label className={labelClass}>Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Slug</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className={inputClass + ' font-mono'}
            />
            <button
              type="button"
              onClick={() => title.trim() && setSlug(slugify(title))}
              className="bg-white/5 hover:bg-white/10 text-text px-3 rounded-xl text-[12px]"
            >
              From title
            </button>
          </div>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      {mode === 'edit' && (
        <fieldset className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
          <legend className="text-text-dim text-[11px] uppercase tracking-[0.1em] px-2">
            Guides in series (order)
          </legend>
          {order.length === 0 ? (
            <p className="text-text-dim text-[12px]">This series is empty. Add guides below.</p>
          ) : (
            <div className="space-y-1.5">
              {order.map((gid, i) => {
                const g = guides.find(x => x.id === gid)
                if (!g) return null
                return (
                  <div
                    key={gid}
                    className="flex items-center gap-2 bg-white/5 border border-border rounded-xl px-3 py-2 text-[13px]"
                  >
                    <span className="text-text-dim w-6">{i + 1}.</span>
                    <span className="flex-1 text-text">{g.title}</span>
                    <span className="text-text-dim text-[11px] mr-2">{g.status}</span>
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="text-text-sub hover:text-text disabled:opacity-30 px-1"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === order.length - 1}
                      className="text-text-sub hover:text-text disabled:opacity-30 px-1"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrder(order.filter(x => x !== gid))}
                      className="text-red-400 hover:text-red-300 px-1"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {availableGuides.length > 0 && (
            <div>
              <label className={labelClass}>Add guide</label>
              <select
                onChange={e => {
                  if (e.target.value) {
                    setOrder([...order, e.target.value])
                    e.target.value = ''
                  }
                }}
                className={inputClass}
              >
                <option value="">— Select —</option>
                {availableGuides.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </fieldset>
      )}

      <div className="sticky bottom-2 z-30 bg-bg-card/95 backdrop-blur border border-border rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-[12px] text-text-dim">
          {error && (
            <span className="text-red-400 max-w-md truncate" title={error}>
              {error}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mode === 'edit' && series && (
            <button
              type="button"
              onClick={remove}
              className="text-red-400 hover:text-red-300 text-[13px]"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-xl text-[13px] font-medium disabled:opacity-40"
          >
            {saving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
