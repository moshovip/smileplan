'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/mdx/extract'
import { SeoHelper } from './SeoHelper'
import { LinkSuggestions } from './LinkSuggestions'
import { AntiAiModal } from './AntiAiModal'
import { MdxEditor, type MdxEditorHandle } from './MdxEditor'

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

interface OtherGuide {
  id: string
  title: string
  slug: string
  type: string
  status: string
}

interface SeriesOpt {
  id: string
  slug: string
  title: string
}

interface LessonOpt {
  id: string
  title: string
  context: string
}

interface RequiredTool {
  name?: string
  icon?: string
  url?: string
}

interface ChangelogEntry {
  date?: string
  summary?: string
}

interface HeroPromiseShape {
  whatYouLearn?: string[]
  applyIn?: number
  saves?: number
}

interface H1Variant {
  text: string
  weight: number
}


interface GuideShape {
  id: string
  title: string
  slug: string
  metaTitle: string
  metaDescription: string
  excerpt: string
  targetKeyword: string
  type: 'pillar' | 'tutorial' | 'playbook' | 'recipe'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  content: string
  pillarId: string | null
  seriesId: string | null
  seriesOrder: number | null
  authorId: string
  reviewedById: string | null
  sourceLessonId: string | null
  isPinned: boolean
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  ogImage: string | null
  scheduledPublishAt: string | null
  heroPromise: unknown
  h1Variants: unknown
  requiredTools: unknown
  primaryCta: unknown
  changelogEntries: unknown
  topicIds: string[]
  prerequisiteIds: string[]
}

interface Props {
  guide: GuideShape
  authors: Author[]
  topics: Topic[]
  otherGuides: OtherGuide[]
  pillarOptions: OtherGuide[]
  series: SeriesOpt[]
  lessons: LessonOpt[]
}

const inputClass =
  'w-full bg-bg border border-border rounded-xl px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent'
const labelClass = 'block text-[12px] text-text-dim mb-1'

export function GuideEditor({
  guide,
  authors,
  topics,
  otherGuides,
  pillarOptions,
  series,
  lessons,
}: Props) {
  const router = useRouter()
  const editorRef = useRef<MdxEditorHandle | null>(null)

  // Form fields
  const [title, setTitle] = useState(guide.title)
  const [slug, setSlug] = useState(guide.slug)
  const [metaTitle, setMetaTitle] = useState(guide.metaTitle)
  const [metaDescription, setMetaDescription] = useState(guide.metaDescription)
  const [excerpt, setExcerpt] = useState(guide.excerpt)
  const [targetKeyword, setTargetKeyword] = useState(guide.targetKeyword)
  const [type, setType] = useState(guide.type)
  const [difficulty, setDifficulty] = useState(guide.difficulty)
  const [content, setContent] = useState(guide.content)
  const [pillarId, setPillarId] = useState(guide.pillarId ?? '')
  const [seriesId, setSeriesId] = useState(guide.seriesId ?? '')
  const [seriesOrder, setSeriesOrder] = useState<string>(
    guide.seriesOrder !== null ? String(guide.seriesOrder) : ''
  )
  const [authorId, setAuthorId] = useState(guide.authorId)
  const [reviewedById, setReviewedById] = useState(guide.reviewedById ?? '')
  const [sourceLessonId, setSourceLessonId] = useState(guide.sourceLessonId ?? '')
  const [topicIds, setTopicIds] = useState<string[]>(guide.topicIds)
  const [prerequisiteIds, setPrerequisiteIds] = useState<string[]>(guide.prerequisiteIds)
  const [isPinned, setIsPinned] = useState(guide.isPinned)
  const [ogImage, setOgImage] = useState(guide.ogImage ?? '')
  const [scheduledPublishAt, setScheduledPublishAt] = useState(guide.scheduledPublishAt ?? '')
  const initialCta = (guide.primaryCta as { label?: string; href?: string } | null) ?? null
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState(initialCta?.label ?? '')
  const [primaryCtaHref, setPrimaryCtaHref] = useState(initialCta?.href ?? '')

  // Hero promise
  const initHp = (guide.heroPromise as HeroPromiseShape | null) ?? {}
  const [whatYouLearn, setWhatYouLearn] = useState<string>(
    (initHp.whatYouLearn ?? []).join('\n')
  )
  const [applyIn, setApplyIn] = useState<string>(initHp.applyIn ? String(initHp.applyIn) : '')
  const [saves, setSaves] = useState<string>(initHp.saves ? String(initHp.saves) : '')

  // h1Variants (JSON textarea)
  const [h1VariantsText, setH1VariantsText] = useState<string>(
    Array.isArray(guide.h1Variants) ? JSON.stringify(guide.h1Variants, null, 2) : ''
  )

  // requiredTools / changelog
  const [requiredTools, setRequiredTools] = useState<RequiredTool[]>(
    Array.isArray(guide.requiredTools) ? (guide.requiredTools as RequiredTool[]) : []
  )
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>(
    Array.isArray(guide.changelogEntries) ? (guide.changelogEntries as ChangelogEntry[]) : []
  )

  // UI state
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [showAntiAi, setShowAntiAi] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null)

  // Parse h1Variants JSON
  const parsedH1Variants = useMemo(() => {
    if (!h1VariantsText.trim()) return null
    try {
      const parsed = JSON.parse(h1VariantsText)
      if (!Array.isArray(parsed)) return null
      return parsed as H1Variant[]
    } catch {
      return null
    }
  }, [h1VariantsText])

  const heroPromise = useMemo(
    () => ({
      whatYouLearn: whatYouLearn.split('\n').map(s => s.trim()).filter(Boolean),
      applyIn: applyIn ? Number(applyIn) : undefined,
      saves: saves ? Number(saves) : undefined,
      difficulty,
    }),
    [whatYouLearn, applyIn, saves, difficulty]
  )

  // Debounced live preview
  useEffect(() => {
    if (!showPreview) return
    const handle = setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/guides/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })
        if (res.ok) {
          const data = await res.json()
          setPreviewHtml(data.html)
          setPreviewError(null)
        } else {
          const data = await res.json().catch(() => ({}))
          setPreviewError(data.error ?? 'Render error')
        }
      } catch (e) {
        setPreviewError(e instanceof Error ? e.message : 'Error')
      }
    }, 500)
    return () => clearTimeout(handle)
  }, [content, showPreview])

  // Autosave revisions (every 30 sec, only if something changed)
  const lastSavedContent = useRef({ content: guide.content, title: guide.title })
  useEffect(() => {
    const handle = setInterval(async () => {
      if (
        content === lastSavedContent.current.content &&
        title === lastSavedContent.current.title
      ) {
        return
      }
      try {
        const res = await fetch(`/api/admin/guides/${guide.id}/revisions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, title }),
        })
        if (res.ok) {
          lastSavedContent.current = { content, title }
          setAutoSavedAt(new Date().toLocaleTimeString('en-US'))
        }
      } catch {
        // silently
      }
    }, 30_000)
    return () => clearInterval(handle)
  }, [content, title, guide.id])

  function buildPayload() {
    return {
      title,
      slug,
      metaTitle: metaTitle || null,
      metaDescription,
      excerpt,
      targetKeyword: targetKeyword || null,
      type,
      difficulty,
      content,
      pillarId: pillarId || null,
      seriesId: seriesId || null,
      seriesOrder: seriesOrder ? Number(seriesOrder) : null,
      authorId,
      reviewedById: reviewedById || null,
      sourceLessonId: sourceLessonId || null,
      topicIds,
      prerequisiteIds,
      requiredTools: requiredTools.filter(t => t.name?.trim()),
      heroPromise,
      h1Variants: parsedH1Variants,
      primaryCta: primaryCtaHref.trim() ? { label: primaryCtaLabel.trim(), href: primaryCtaHref.trim() } : null,
      changelogEntries: changelogEntries.filter(c => c.date?.trim() || c.summary?.trim()),
      ogImage: ogImage || null,
      scheduledPublishAt: scheduledPublishAt || null,
      isPinned,
    }
  }

  async function save(): Promise<boolean> {
    if (slug !== guide.slug) {
      const ok = window.confirm(
        `The old URL /guides/${guide.slug} will become a 301 redirect to /guides/${slug}. Backlinks will be preserved. Confirm?`
      )
      if (!ok) return false
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/guides/${guide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          [data.error, ...(data.details ?? [])].filter(Boolean).join('\n') || 'Error'
        )
      }
      setSavedAt(new Date().toLocaleTimeString('en-US'))
      router.refresh()
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function publish() {
    setPublishing(true)
    setError(null)
    try {
      const ok = await save()
      if (!ok) {
        setPublishing(false)
        return
      }
      const res = await fetch(`/api/admin/guides/${guide.id}/publish`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Publishing error')
      }
      setShowAntiAi(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setPublishing(false)
    }
  }

  async function duplicate() {
    if (!confirm('Create a copy of the guide?')) return
    try {
      const res = await fetch(`/api/admin/guides/${guide.id}/duplicate`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error')
      }
      const data = await res.json()
      router.push(`/admin/guides/${data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  async function archive() {
    if (!confirm('Archive the guide? It will disappear from the public list.')) return
    try {
      const res = await fetch(`/api/admin/guides/${guide.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error')
      }
      router.push('/admin/guides')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  function regenSlug() {
    if (title.trim()) setSlug(slugify(title))
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr_360px] gap-4">
      {/* Left column — fields */}
      <div className="space-y-4">
        <Section title="Basics">
          <div>
            <label className={labelClass}>Title (H1)</label>
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
                onClick={regenSlug}
                className="bg-white/5 hover:bg-white/10 text-text px-3 rounded-xl text-[12px]"
              >
                From title
              </button>
            </div>
            {slug !== guide.slug && (
              <p className="text-amber-300 text-[11px] mt-1">
                Slug changed. On save, the old URL will become a 301 redirect.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Meta title <CharCount value={metaTitle.length} min={50} max={60} />
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={e => setMetaTitle(e.target.value)}
              className={inputClass}
              maxLength={120}
            />
          </div>

          <div>
            <label className={labelClass}>
              Meta description <CharCount value={metaDescription.length} min={140} max={160} />
            </label>
            <textarea
              value={metaDescription}
              onChange={e => setMetaDescription(e.target.value)}
              rows={3}
              className={inputClass}
              maxLength={300}
            />
          </div>

          <div>
            <label className={labelClass}>
              Excerpt <CharCount value={excerpt.length} min={200} max={300} />
            </label>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              rows={4}
              className={inputClass}
              maxLength={500}
            />
          </div>

          <div>
            <label className={labelClass}>Target keyword</label>
            <input
              type="text"
              value={targetKeyword}
              onChange={e => setTargetKeyword(e.target.value)}
              className={inputClass}
            />
          </div>
        </Section>

        <Section title="Type and difficulty">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as typeof type)}
                className={inputClass}
              >
                <option value="pillar">Pillar</option>
                <option value="tutorial">Tutorial</option>
                <option value="playbook">Playbook</option>
                <option value="recipe">Recipe</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as typeof difficulty)}
                className={inputClass}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Pillar (optional)</label>
            <select
              value={pillarId}
              onChange={e => setPillarId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Not part of a pillar —</option>
              {pillarOptions.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Series</label>
              <select
                value={seriesId}
                onChange={e => setSeriesId(e.target.value)}
                className={inputClass}
              >
                <option value="">— No series —</option>
                {series.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>No. in series</label>
              <input
                type="number"
                value={seriesOrder}
                onChange={e => setSeriesOrder(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </Section>

        <Section title="Topics and prerequisites">
          <div>
            <label className={labelClass}>Topics</label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {topics.map(t => (
                <label
                  key={t.id}
                  className="flex items-center gap-2 text-[12px] text-text-sub"
                >
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
            <label className={labelClass}>Prerequisites (other guides)</label>
            <select
              multiple
              value={prerequisiteIds}
              onChange={e =>
                setPrerequisiteIds(
                  Array.from(e.target.selectedOptions).map(o => o.value)
                )
              }
              className={inputClass + ' min-h-[80px]'}
            >
              {otherGuides.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            <p className="text-text-dim text-[11px] mt-1">Cmd/Ctrl + click for multiple selection</p>
          </div>
        </Section>

        <Section title="Hero Promise">
          <div>
            <label className={labelClass}>What you&apos;ll learn (one item per line)</label>
            <textarea
              value={whatYouLearn}
              onChange={e => setWhatYouLearn(e.target.value)}
              rows={4}
              className={inputClass + ' font-mono'}
              placeholder={'How to break a product into agents\nA ready-made prompt for the database schema\nA setup for deployment'}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Apply in (minutes)</label>
              <input
                type="number"
                value={applyIn}
                onChange={e => setApplyIn(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Saves (hours)</label>
              <input
                type="number"
                value={saves}
                onChange={e => setSaves(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </Section>

        <Section title="Tools, CTA, A/B">
          <RequiredToolsBuilder tools={requiredTools} onChange={setRequiredTools} />

          <div>
            <label className={labelClass}>Primary CTA (optional)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={primaryCtaLabel}
                onChange={e => setPrimaryCtaLabel(e.target.value)}
                placeholder="Button label"
                className={inputClass}
              />
              <input
                value={primaryCtaHref}
                onChange={e => setPrimaryCtaHref(e.target.value)}
                placeholder="https://…"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass + ' mb-0'}>
                H1 Variants (JSON: [{'{ "text": "...", "weight": 0.5 }'}])
              </label>
              <a
                href={`/admin/guides/${guide.id}/h1-test`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-hover text-[11px]"
              >
                Open A/B stats →
              </a>
            </div>
            <textarea
              value={h1VariantsText}
              onChange={e => setH1VariantsText(e.target.value)}
              rows={5}
              className={inputClass + ' font-mono text-[11px]'}
              placeholder='[{"text":"Variant 1","weight":0.5},{"text":"Variant 2","weight":0.5}]'
            />
            {h1VariantsText.trim() && !parsedH1Variants && (
              <p className="text-red-400 text-[11px] mt-1">Invalid JSON</p>
            )}
          </div>
        </Section>

        <Section title="Changelog">
          <ChangelogBuilder entries={changelogEntries} onChange={setChangelogEntries} />
        </Section>

        <Section title="Authorship and publishing">
          <div>
            <label className={labelClass}>Author</label>
            <select
              value={authorId}
              onChange={e => setAuthorId(e.target.value)}
              className={inputClass}
            >
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

          <div>
            <label className={labelClass}>Reviewed by (optional)</label>
            <select
              value={reviewedById}
              onChange={e => setReviewedById(e.target.value)}
              className={inputClass}
            >
              <option value="">— Not set —</option>
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

          <div>
            <label className={labelClass}>Source lesson (for the transcript pipeline)</label>
            <select
              value={sourceLessonId}
              onChange={e => setSourceLessonId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Not linked to a stream —</option>
              {lessons.map(l => (
                <option key={l.id} value={l.id}>
                  {l.title} ({l.context})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>OG image (URL)</label>
            <input
              type="text"
              value={ogImage}
              onChange={e => setOgImage(e.target.value)}
              placeholder="https://… or /og/..."
              className={inputClass + ' font-mono text-[11px]'}
            />
            <p className="text-text-dim text-[11px] mt-1">
              If empty, the auto-generated /api/og/guide?slug=… is used
            </p>
          </div>

          <div>
            <label className={labelClass}>Schedule publishing</label>
            <input
              type="datetime-local"
              value={scheduledPublishAt}
              onChange={e => setScheduledPublishAt(e.target.value)}
              className={inputClass}
            />
          </div>

          <label className="flex items-center gap-2 text-[13px] text-text-sub">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={e => setIsPinned(e.target.checked)}
            />
            Pin on the /guides homepage
          </label>
        </Section>
      </div>

      {/* Center column — MDX editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-text-sub text-[13px] uppercase tracking-[0.1em]">Content (MDX)</h2>
          <label className="flex items-center gap-2 text-[12px] text-text-sub">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={e => setShowPreview(e.target.checked)}
            />
            Live preview
          </label>
        </div>
        <MdxEditor
          ref={editorRef}
          value={content}
          onChange={setContent}
          showPreview={showPreview}
          previewHtml={previewHtml}
          previewError={previewError}
        />

        <div className="text-text-dim text-[11px] mt-2">
          {autoSavedAt
            ? `Revision autosaved at ${autoSavedAt}`
            : 'Revision autosave every 30 seconds'}
        </div>
      </div>

      {/* Right column — SEO Helper + Suggestions */}
      <div className="space-y-3">
        <SeoHelper
          input={{ title, metaTitle, metaDescription, excerpt, targetKeyword, content }}
        />
        <LinkSuggestions
          content={content}
          excludeId={guide.id}
          onInsert={text => editorRef.current?.insertAtCursor(text)}
        />
      </div>

      {/* Bottom buttons — sticky */}
      <div className="xl:col-span-3 sticky bottom-2 z-30 bg-bg-card/95 backdrop-blur border border-border rounded-2xl px-4 py-3 mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[12px] text-text-dim">
          {error && (
            <span className="text-red-400 max-w-md truncate" title={error}>
              {error}
            </span>
          )}
          {savedAt && <span>Saved at {savedAt}</span>}
          <span>Status: {guide.status}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="bg-white/10 hover:bg-white/15 text-text px-4 py-2 rounded-xl text-[13px] disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/admin/guides/${guide.id}/preview`)}
            className="bg-white/5 hover:bg-white/10 text-text px-4 py-2 rounded-xl text-[13px]"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => router.push(`/admin/guides/${guide.id}/revisions`)}
            className="bg-white/5 hover:bg-white/10 text-text px-4 py-2 rounded-xl text-[13px]"
          >
            Revisions
          </button>
          <button
            type="button"
            onClick={duplicate}
            className="bg-white/5 hover:bg-white/10 text-text px-4 py-2 rounded-xl text-[13px]"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={archive}
            className="text-red-400 hover:text-red-300 px-3 py-2 rounded-xl text-[13px]"
          >
            Archive
          </button>
          <button
            type="button"
            onClick={() => setShowAntiAi(true)}
            disabled={guide.status === 'published'}
            className="bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent text-white px-5 py-2 rounded-xl text-[13px] font-medium"
          >
            {scheduledPublishAt && new Date(scheduledPublishAt) > new Date()
              ? 'Schedule publishing'
              : 'Publish'}
          </button>
        </div>
      </div>

      <AntiAiModal
        open={showAntiAi}
        onClose={() => setShowAntiAi(false)}
        onConfirm={publish}
        publishing={publishing}
        input={{
          title,
          content,
          metaTitle,
          metaDescription,
          excerpt,
          heroPromise,
          primaryCta: primaryCtaHref.trim() ? { label: primaryCtaLabel.trim(), href: primaryCtaHref.trim() } : null,
          authorId,
        }}
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
      <legend className="text-text-dim text-[11px] uppercase tracking-[0.1em] px-2">{title}</legend>
      {children}
    </fieldset>
  )
}

function CharCount({ value, min, max }: { value: number; min: number; max: number }) {
  const inRange = value >= min && value <= max
  const close = value >= min - 10 && value <= max + 10
  const color = inRange ? 'text-emerald-300' : close ? 'text-amber-300' : 'text-red-400'
  return (
    <span className={`text-[10px] ${color}`}>
      ({value}/{min}-{max})
    </span>
  )
}

function RequiredToolsBuilder({
  tools,
  onChange,
}: {
  tools: RequiredTool[]
  onChange: (next: RequiredTool[]) => void
}) {
  return (
    <div className="space-y-2">
      <label className={labelClass}>Required tools</label>
      {tools.map((t, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <input
            type="text"
            placeholder="name"
            value={t.name ?? ''}
            onChange={e => onChange(tools.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="icon URL"
            value={t.icon ?? ''}
            onChange={e => onChange(tools.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))}
            className={inputClass + ' font-mono text-[11px]'}
          />
          <input
            type="text"
            placeholder="link URL"
            value={t.url ?? ''}
            onChange={e => onChange(tools.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
            className={inputClass + ' font-mono text-[11px]'}
          />
          <button
            type="button"
            onClick={() => onChange(tools.filter((_, j) => j !== i))}
            className="text-red-400 hover:text-red-300 text-[12px] px-2"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...tools, {}])}
        className="text-accent hover:text-accent-hover text-[12px]"
      >
        + Add tool
      </button>
    </div>
  )
}

function ChangelogBuilder({
  entries,
  onChange,
}: {
  entries: ChangelogEntry[]
  onChange: (next: ChangelogEntry[]) => void
}) {
  return (
    <div className="space-y-2">
      {entries.map((c, i) => (
        <div key={i} className="grid grid-cols-[140px_1fr_auto] gap-2">
          <input
            type="date"
            value={c.date ?? ''}
            onChange={e => onChange(entries.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="What was updated"
            value={c.summary ?? ''}
            onChange={e => onChange(entries.map((x, j) => (j === i ? { ...x, summary: e.target.value } : x)))}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onChange(entries.filter((_, j) => j !== i))}
            className="text-red-400 hover:text-red-300 text-[12px] px-2"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...entries, { date: new Date().toISOString().slice(0, 10) }])}
        className="text-accent hover:text-accent-hover text-[12px]"
      >
        + Add entry
      </button>
    </div>
  )
}
