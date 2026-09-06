'use client'

import { useEffect, useRef, useState } from 'react'
import { resolveVideo, videoEmbedUrl, type VideoProvider } from '@/lib/video'

interface Props {
  /** Provider video id (used with `provider`). */
  id?: string
  /** Full video URL — the provider is auto-detected (YouTube/Vimeo/Kinescope). */
  url?: string
  provider?: VideoProvider
  title?: string
  poster?: string
  duration?: number
}

// Generic, lazy-loaded video embed. Supports YouTube, Vimeo and Kinescope —
// pass either a full `url` (provider auto-detected) or `id` + `provider`.
export function VideoEmbed(props: Props) {
  const { title, poster, duration } = props
  const ref = useRef<HTMLDivElement | null>(null)
  const [load, setLoad] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || load) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            observer.disconnect()
            setLoad(true)
          }
        })
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [load])

  const resolved = resolveVideo(props)
  if (!resolved) return null
  const src = videoEmbedUrl(resolved.provider, resolved.id)

  return (
    <figure
      ref={ref}
      data-mdx-block="video-embed"
      className="my-6 rounded-2xl overflow-hidden border border-border bg-bg-card"
    >
      <div className="relative w-full aspect-video bg-black">
        {load ? (
          <iframe
            src={src}
            title={title ?? 'Video'}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={title ?? ''} className="absolute inset-0 w-full h-full object-cover opacity-80" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-dim text-sm">Video loads as you scroll</div>
        )}
      </div>
      {(title || duration) && (
        <figcaption className="px-5 py-3 text-sm text-text-sub flex items-center justify-between gap-3">
          {title && <span className="text-text">{title}</span>}
          {duration && <span className="text-text-dim text-xs">{Math.round(duration / 60)} min</span>}
        </figcaption>
      )}
    </figure>
  )
}
