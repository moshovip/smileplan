'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/mdx/extract'

interface SocialLink {
  label: string
  url: string
}

interface AuthorShape {
  id: string
  email: string | null
  name: string
  title: string | null
  bio: string | null
  avatar: string | null
  slug: string | null
  socialLinks: unknown
}

interface Props {
  author: AuthorShape
}

const inputClass =
  'w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-[14px] text-text focus:outline-none focus:border-accent'

function parseSocialLinks(raw: unknown): SocialLink[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((l): l is Record<string, unknown> => !!l && typeof l === 'object')
    .map(l => ({
      label: typeof l.label === 'string' ? l.label : '',
      url: typeof l.url === 'string' ? l.url : '',
    }))
    .filter(l => l.label || l.url)
}

function serializeSocialLinks(links: SocialLink[]): string {
  return links.map(l => `${l.label} | ${l.url}`).join('\n')
}

function deserializeSocialLinks(text: string): SocialLink[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const idx = line.indexOf('|')
      if (idx === -1) return { label: line.trim(), url: '' }
      return {
        label: line.slice(0, idx).trim(),
        url: line.slice(idx + 1).trim(),
      }
    })
    .filter(l => l.label || l.url)
}

export function AuthorForm({ author }: Props) {
  const router = useRouter()

  const [name, setName] = useState(author.name ?? '')
  const [title, setTitle] = useState(author.title ?? '')
  const [bio, setBio] = useState(author.bio ?? '')
  const [avatar, setAvatar] = useState(author.avatar ?? '')
  const [slug, setSlug] = useState(author.slug ?? '')
  const [socialText, setSocialText] = useState(
    serializeSocialLinks(parseSocialLinks(author.socialLinks))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  function genSlug() {
    if (name.trim()) setSlug(slugify(name))
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/authors/${author.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          title,
          bio,
          avatar,
          slug,
          socialLinks: deserializeSocialLinks(socialText),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save')
      }
      setSavedAt(new Date().toLocaleTimeString('en-US'))
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function deactivate() {
    if (!confirm('Delete this author? Existing guides stay, but you cannot publish new ones under this profile.')) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/authors/${author.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error')
      }
      router.push('/admin/authors')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] text-text-dim mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Doe"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-[13px] text-text-dim mb-1.5">Title / role</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Founder, builder"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-[13px] text-text-dim mb-1.5">
          Author slug <span className="text-text-dim/60">(used in the author URL)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="jane-doe"
            className={inputClass + ' font-mono text-[13px]'}
          />
          <button
            type="button"
            onClick={genSlug}
            className="bg-white/5 hover:bg-white/10 text-text px-4 rounded-xl text-[13px] whitespace-nowrap"
          >
            Generate
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[13px] text-text-dim mb-1.5">
          Bio <span className="text-text-dim/60">(markdown supported)</span>
        </label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={6}
          placeholder="Short first-person bio: what you do, what you've built."
          className={inputClass + ' font-mono text-[13px] leading-6'}
        />
      </div>

      <div>
        <label className="block text-[13px] text-text-dim mb-1.5">Avatar (URL)</label>
        <input
          type="text"
          value={avatar}
          onChange={e => setAvatar(e.target.value)}
          placeholder="https://..."
          className={inputClass + ' font-mono text-[12px]'}
        />
      </div>

      <fieldset className="border border-border rounded-2xl p-5">
        <legend className="text-text-sub text-[13px] px-2">Social links</legend>
        <p className="text-text-dim text-[12px] mt-2 mb-2">
          One link per line, formatted as <span className="font-mono">Label | https://url</span>
        </p>
        <textarea
          value={socialText}
          onChange={e => setSocialText(e.target.value)}
          rows={5}
          placeholder={'Twitter | https://twitter.com/handle\nGitHub | https://github.com/handle'}
          className={inputClass + ' font-mono text-[13px] leading-6'}
        />
      </fieldset>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-red-400 text-[13px]">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 sticky bottom-4 bg-bg-card/80 backdrop-blur border border-border rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-xl text-[14px] font-medium disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {savedAt && <span className="text-text-dim text-[12px]">Saved at {savedAt}</span>}
        </div>
        <button
          type="button"
          onClick={deactivate}
          disabled={saving}
          className="text-red-400 hover:text-red-300 text-[13px]"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
