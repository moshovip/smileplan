// Shared video-provider helpers used by the VideoEmbed block (render) and the
// JSON-LD VideoObject (SEO). Supports YouTube, Vimeo and Kinescope.

export type VideoProvider = 'youtube' | 'vimeo' | 'kinescope'

export function videoEmbedUrl(provider: VideoProvider, id: string): string {
  switch (provider) {
    case 'vimeo':
      return `https://player.vimeo.com/video/${encodeURIComponent(id)}`
    case 'kinescope':
      return `https://kinescope.io/embed/${encodeURIComponent(id)}`
    case 'youtube':
    default:
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
  }
}

export function videoContentUrl(provider: VideoProvider, id: string): string {
  switch (provider) {
    case 'vimeo':
      return `https://vimeo.com/${encodeURIComponent(id)}`
    case 'kinescope':
      return `https://kinescope.io/${encodeURIComponent(id)}`
    case 'youtube':
    default:
      return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`
  }
}

/** Resolve `{ url }` or `{ id, provider }` to a concrete `{ provider, id }`. */
export function resolveVideo(input: {
  url?: string
  id?: string
  provider?: VideoProvider
}): { provider: VideoProvider; id: string } | null {
  if (input.url) {
    try {
      const u = new URL(input.url)
      const h = u.hostname.replace(/^www\./, '')
      if (h.endsWith('youtube.com')) return { provider: 'youtube', id: u.searchParams.get('v') || u.pathname.split('/').pop() || '' }
      if (h === 'youtu.be') return { provider: 'youtube', id: u.pathname.slice(1) }
      if (h.endsWith('vimeo.com')) return { provider: 'vimeo', id: u.pathname.split('/').filter(Boolean).pop() || '' }
      if (h.endsWith('kinescope.io')) return { provider: 'kinescope', id: u.pathname.split('/').filter(Boolean).pop() || '' }
    } catch {
      /* fall through */
    }
  }
  if (input.id) return { provider: input.provider ?? 'youtube', id: input.id }
  return null
}
