'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AlternativeImage {
  url: string
  width?: number
  height?: number
  score?: number
  reasons?: string[]
}

interface IllustrationMeta {
  model?: string
  stylePreset?: string
  generatedAt?: string
  costCents?: number
  lowConfidence?: boolean
  attempts?: number
  topScore?: number
}

interface Props {
  guideId: string
  heroImage: string | null
  heroImageAlt: string | null
  alternativeImages: AlternativeImage[] | null
  illustrationMeta: IllustrationMeta | null
}

export function GuideIllustrationCard({
  guideId,
  heroImage,
  heroImageAlt,
  alternativeImages,
  illustrationMeta,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<null | 'generate' | 'swap' | 'delete'>(null)
  const [error, setError] = useState<string | null>(null)

  const callApi = async (method: 'POST' | 'PATCH' | 'DELETE', body?: object) => {
    const res = await fetch(`/api/admin/guides/${guideId}/illustration`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      throw new Error(data.error || `HTTP ${res.status}`)
    }
    return res.json()
  }

  const generate = async (force: boolean) => {
    if (force && !confirm('Regenerate the illustration? The current one will be replaced and the old WebP files in S3 will be overwritten (~$0.20).')) return
    setBusy('generate'); setError(null)
    try {
      await callApi('POST', { forceRegenerate: force })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const swapToAlt = async (alternativeIndex: number) => {
    setBusy('swap'); setError(null)
    try {
      await callApi('PATCH', { alternativeIndex })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    if (!confirm('Delete the illustration? All 4 variants will be wiped from S3.')) return
    setBusy('delete'); setError(null)
    try {
      await callApi('DELETE')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-bg-card p-6 mb-6">
      <header className="flex items-baseline justify-between mb-4">
        <h2 className="font-head text-[18px] text-text">Hero illustration</h2>
        <span className="text-[11px] text-text-dim">Nano Banana · Gemini 2.5 Flash Image</span>
      </header>

      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-900/60 text-red-200 text-[13px] px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {heroImage ? (
        <div className="space-y-4">
          <figure className="rounded-xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt={heroImageAlt ?? ''} className="w-full h-auto block" />
          </figure>

          <div className="text-[12px] text-text-dim space-y-1">
            {heroImageAlt && <div>Alt: <span className="text-text-sub">{heroImageAlt}</span></div>}
            {illustrationMeta?.stylePreset && (
              <div>Style: <code className="text-accent">{illustrationMeta.stylePreset}</code></div>
            )}
            {typeof illustrationMeta?.topScore === 'number' && (
              <div>Ranker score: <span className="text-text">{illustrationMeta.topScore}/100</span>{illustrationMeta.attempts && illustrationMeta.attempts > 1 ? ` (attempts: ${illustrationMeta.attempts})` : ''}</div>
            )}
            {typeof illustrationMeta?.costCents === 'number' && illustrationMeta.costCents > 0 && (
              <div>Generation cost: ${(illustrationMeta.costCents / 100).toFixed(2)}</div>
            )}
            {illustrationMeta?.lowConfidence && (
              <div className="text-red-400 font-medium">⚠ Low ranker confidence — check it visually and regenerate or swap if needed.</div>
            )}
          </div>

          {alternativeImages && alternativeImages.length > 0 && (
            <div>
              <div className="text-[12px] text-text-dim mb-2">Alternatives (you can make one active):</div>
              <div className="grid grid-cols-3 gap-3">
                {alternativeImages.slice(0, 3).map((alt, i) => (
                  <div key={alt.url} className="space-y-2">
                    <figure className="rounded-lg overflow-hidden border border-border aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={alt.url} alt="" className="w-full h-full object-cover block" />
                    </figure>
                    <button
                      type="button"
                      onClick={() => swapToAlt(i)}
                      disabled={busy !== null}
                      className="w-full text-[11px] px-2 py-1.5 rounded-md border border-border hover:border-accent hover:text-accent disabled:opacity-50"
                    >
                      {typeof alt.score === 'number' ? `${alt.score}/100 · use` : 'Use'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => generate(true)}
              disabled={busy !== null}
              className="text-[13px] px-4 py-2 rounded-lg bg-accent text-bg hover:bg-accent-hover disabled:opacity-50"
            >
              {busy === 'generate' ? 'Generating (20-40s)…' : 'Regenerate (~$0.20)'}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={busy !== null}
              className="text-[13px] px-4 py-2 rounded-lg border border-border text-text-sub hover:text-red-400 hover:border-red-900 disabled:opacity-50"
            >
              {busy === 'delete' ? 'Deleting…' : 'Delete illustration'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-text-dim text-[13px]">
            No illustration yet. The pipeline will generate 4 variants (~30 seconds), the Gemini ranker will pick the best one, and the rest become alternatives.
          </div>
          <button
            type="button"
            onClick={() => generate(false)}
            disabled={busy !== null}
            className="text-[13px] px-4 py-2 rounded-lg bg-accent text-bg hover:bg-accent-hover disabled:opacity-50"
          >
            {busy === 'generate' ? 'Generating (20-40s)…' : 'Generate illustration (~$0.20)'}
          </button>
        </div>
      )}
    </section>
  )
}
