'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/mdx/extract'
import { routes } from '@/site.config'

interface Author {
  id: string
  name: string
  slug: string
}

interface Topic {
  id: string
  slug: string
  title: string
}

interface ConceptOpt {
  id: string
  term: string
  slug: string
}

interface ConceptShape {
  id: string
  slug: string
  term: string
  shortDefinition: string
  longExplanation: string
  metaTitle: string
  metaDescription: string
  ogImage: string
  authorId: string | null
  status: string
  topicIds: string[]
  relatedConceptIds: string[]
}

interface Props {
  mode: 'create' | 'edit'
  authors: Author[]
  topics: Topic[]
  allConcepts: ConceptOpt[]
  concept?: ConceptShape
  defaultAuthorId?: string
}

const inputClass =
  'w-full bg-bg border border-border rounded-xl px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent'
const labelClass = 'block text-[12px] text-text-dim mb-1'

export function ConceptForm({ mode, authors, topics, allConcepts, concept, defaultAuthorId }: Props) {
  const router = useRouter()
  const [term, setTerm] = useState(concept?.term ?? '')
  const [slug, setSlug] = useState(concept?.slug ?? '')
  const [shortDefinition, setShortDefinition] = useState(concept?.shortDefinition ?? '')
  const [longExplanation, setLongExplanation] = useState(concept?.longExplanation ?? '')
  const [metaTitle, setMetaTitle] = useState(concept?.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(concept?.metaDescription ?? '')
  const [ogImage, setOgImage] = useState(concept?.ogImage ?? '')
  const [authorId, setAuthorId] = useState(
    concept?.authorId ?? defaultAuthorId ?? ''
  )
  const [topicIds, setTopicIds] = useState<string[]>(concept?.topicIds ?? [])
  const [relatedIds, setRelatedIds] = useState<string[]>(concept?.relatedConceptIds ?? [])

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function buildPayload() {
    return {
      term,
      slug: slug || slugify(term),
      shortDefinition,
      longExplanation: longExplanation || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      ogImage: ogImage || null,
      authorId: authorId || null,
      topicIds,
      relatedConceptIds: relatedIds,
    }
  }

  async function save(): Promise<string | null> {
    if (mode === 'edit' && concept && slug !== concept.slug) {
      const ok = window.confirm(
        `The old URL ${routes.concept(concept.slug)} will become a 301 redirect to ${routes.concept(slug)}. Confirm?`
      )
      if (!ok) return null
    }
    setSaving(true)
    setError(null)
    try {
      const url = mode === 'create' ? '/api/admin/concepts' : `/api/admin/concepts/${concept!.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error')
      }
      const data = await res.json()
      if (mode === 'create') {
        router.push(`/admin/concepts/${data.id}`)
      } else {
        router.refresh()
      }
      return data.id || concept?.id || null
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function publish() {
    if (mode !== 'edit' || !concept) return
    setPublishing(true)
    try {
      const id = await save()
      if (!id) return
      const res = await fetch(`/api/admin/concepts/${id}/publish`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error')
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <fieldset className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
        <legend className="text-text-dim text-[11px] uppercase tracking-[0.1em] px-2">Term</legend>
        <div>
          <label className={labelClass}>Term</label>
          <input
            type="text"
            value={term}
            onChange={e => setTerm(e.target.value)}
            onBlur={() => !slug && setSlug(slugify(term))}
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
              onClick={() => term.trim() && setSlug(slugify(term))}
              className="bg-white/5 hover:bg-white/10 text-text px-3 rounded-xl text-[12px]"
            >
              From term
            </button>
          </div>
          {mode === 'edit' && concept && slug !== concept.slug && (
            <p className="text-amber-300 text-[11px] mt-1">The old slug will become a 301 redirect</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Short definition (1-2 sentences)</label>
          <textarea
            rows={3}
            value={shortDefinition}
            onChange={e => setShortDefinition(e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
        <legend className="text-text-dim text-[11px] uppercase tracking-[0.1em] px-2">
          Long explanation (MDX)
        </legend>
        <textarea
          rows={14}
          value={longExplanation}
          onChange={e => setLongExplanation(e.target.value)}
          className={inputClass + ' font-mono leading-relaxed'}
          placeholder="Detailed explanation. Available blocks: Quote, CodeBlock, Callout, DefinitionLink, Sources, TldrSection, ImageWithAlt."
        />
      </fieldset>

      <fieldset className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
        <legend className="text-text-dim text-[11px] uppercase tracking-[0.1em] px-2">SEO</legend>
        <div>
          <label className={labelClass}>Meta title</label>
          <input
            type="text"
            value={metaTitle}
            onChange={e => setMetaTitle(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Meta description</label>
          <textarea
            rows={3}
            value={metaDescription}
            onChange={e => setMetaDescription(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>OG image URL</label>
          <input
            type="text"
            value={ogImage}
            onChange={e => setOgImage(e.target.value)}
            className={inputClass + ' font-mono text-[11px]'}
          />
        </div>
      </fieldset>

      <fieldset className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
        <legend className="text-text-dim text-[11px] uppercase tracking-[0.1em] px-2">Relations</legend>
        <div>
          <label className={labelClass}>Topics</label>
          <div className="grid grid-cols-2 gap-1.5">
            {topics.map(t => (
              <label key={t.id} className="flex items-center gap-2 text-[12px] text-text-sub">
                <input
                  type="checkbox"
                  checked={topicIds.includes(t.id)}
                  onChange={e =>
                    setTopicIds(prev =>
                      e.target.checked ? [...prev, t.id] : prev.filter(x => x !== t.id)
                    )
                  }
                />
                {t.title}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>Related concepts</label>
          <select
            multiple
            value={relatedIds}
            onChange={e =>
              setRelatedIds(Array.from(e.target.selectedOptions).map(o => o.value))
            }
            className={inputClass + ' min-h-[100px]'}
          >
            {allConcepts.map(c => (
              <option key={c.id} value={c.id}>
                {c.term}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Author</label>
          <select
            value={authorId}
            onChange={e => setAuthorId(e.target.value)}
            className={inputClass}
          >
            <option value="">— None —</option>
            {authors.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <div className="sticky bottom-2 z-30 bg-bg-card/95 backdrop-blur border border-border rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-[12px] text-text-dim">
          {error && (
            <span className="text-red-400 max-w-md truncate" title={error}>
              {error}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="bg-white/10 hover:bg-white/15 text-text px-4 py-2 rounded-xl text-[13px] disabled:opacity-40"
          >
            {saving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </button>
          {mode === 'edit' && concept && (
            <button
              type="button"
              onClick={publish}
              disabled={publishing || concept.status === 'published'}
              className="bg-accent hover:bg-accent-hover disabled:opacity-40 text-white px-5 py-2 rounded-xl text-[13px] font-medium"
            >
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
