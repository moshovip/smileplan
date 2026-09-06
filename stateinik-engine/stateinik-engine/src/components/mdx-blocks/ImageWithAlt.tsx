import Image from 'next/image'

interface Props {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  caption?: string
}

const PLACEHOLDER_ALTS = new Set(['', 'image', 'картинка', 'photo', 'фото'])

export function ImageWithAlt({ src, alt, width = 1200, height = 700, priority = false, caption }: Props) {
  const altClean = (alt ?? '').trim()
  if (!altClean || PLACEHOLDER_ALTS.has(altClean.toLowerCase())) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`<ImageWithAlt src="${src}"> requires a meaningful alt. Got: "${altClean}"`)
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[ImageWithAlt] empty/default alt for ${src}`)
    }
  }

  return (
    <figure data-mdx-block="image" className="my-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-bg-card">
        <Image
          src={src}
          alt={altClean || 'Image'}
          width={width}
          height={height}
          priority={priority}
          className="w-full h-auto"
        />
      </div>
      {caption && <figcaption className="mt-2 text-sm text-text-sub text-center">{caption}</figcaption>}
    </figure>
  )
}
