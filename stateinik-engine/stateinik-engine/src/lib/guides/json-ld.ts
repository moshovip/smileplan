// JSON-LD graph for a guide page: Article + (HowTo|FAQPage|VideoObject) + BreadcrumbList
// + Organization (inline so it can be parsed standalone). Person/Author is a separate node
// with knowsAbout + sameAs for the E-E-A-T signal.
// Citation is collected from <Sources>; dateModified is max(updatedAt, lastReviewedAt).

import type { MdxMeta } from '@/lib/mdx/extract'
import { ORGANIZATION_ID, buildOrganizationJsonLd } from '@/lib/organization/json-ld'
import { buildBreadcrumb } from '@/lib/seo/breadcrumb'
import { resolveVideo, videoEmbedUrl, videoContentUrl } from '@/lib/video'
import { siteConfig, routes } from '@/site.config'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface GuideJsonLdInput {
  slug: string
  title: string
  metaTitle?: string | null
  metaDescription: string
  excerpt: string
  publishedAt?: Date | null
  updatedAt: Date
  lastReviewedAt?: Date | null
  readingMinutes: number
  wordCount: number
  ogImage?: string | null
  heroImage?: string | null
  heroImageAlt?: string | null
  heroImageWidth?: number | null
  heroImageHeight?: number | null
  targetKeyword?: string | null
  authorSlug?: string | null
  authorName?: string | null
  authorJobTitle?: string | null
  authorKnowsAbout?: string[]
  authorSameAs?: string[]
  reviewerSlug?: string | null
  reviewerName?: string | null
  firstTopicTitle?: string | null
  firstTopicSlug?: string | null
  topicTitles?: string[]
  video?: {
    url?: string
    id?: string
    provider?: 'youtube' | 'vimeo' | 'kinescope'
    title?: string
    duration?: number
  } | null
}

function isoDuration(seconds: number | null | undefined): string | undefined {
  if (!seconds || seconds <= 0) return undefined
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s ? `${s}S` : '0S'}`
}

export function buildGuideJsonLd(input: GuideJsonLdInput, extracted: MdxMeta) {
  const url = `${APP_URL}/guides/${input.slug}`
  const ogImage =
    input.ogImage ?? `${APP_URL}/og/guide/${input.slug}`

  // Article.image[] — first the hero illustration (if any, with width/height/caption for Image Search),
  // then always ogImage as a fallback for social previews.
  const articleImages: Array<string | { '@type': 'ImageObject'; url: string; width?: number; height?: number; caption?: string }> = []
  if (input.heroImage) {
    articleImages.push({
      '@type': 'ImageObject',
      url: input.heroImage,
      ...(input.heroImageWidth ? { width: input.heroImageWidth } : {}),
      ...(input.heroImageHeight ? { height: input.heroImageHeight } : {}),
      ...(input.heroImageAlt ? { caption: input.heroImageAlt } : {}),
    })
  }
  articleImages.push(ogImage)

  const dateModified =
    input.lastReviewedAt && input.lastReviewedAt > input.updatedAt
      ? input.lastReviewedAt
      : input.updatedAt

  const authorRef =
    input.authorSlug && input.authorName
      ? {
          '@type': 'Person' as const,
          '@id': `${APP_URL}${routes.author(input.authorSlug)}#author`,
          name: input.authorName,
          url: `${APP_URL}${routes.author(input.authorSlug)}`,
        }
      : { '@id': ORGANIZATION_ID }

  const reviewerRef =
    input.reviewerSlug && input.reviewerName
      ? {
          '@type': 'Person' as const,
          '@id': `${APP_URL}${routes.author(input.reviewerSlug)}#author`,
          name: input.reviewerName,
        }
      : input.reviewerName
        ? { '@type': 'Person' as const, name: input.reviewerName }
        : null

  const article = {
    '@type': 'Article' as const,
    '@id': `${url}#article`,
    headline: input.metaTitle ?? input.title,
    description: input.metaDescription,
    image: articleImages,
    datePublished: (input.publishedAt ?? input.updatedAt).toISOString(),
    dateModified: dateModified.toISOString(),
    author: authorRef,
    ...(reviewerRef ? { reviewedBy: reviewerRef } : {}),
    publisher: { '@id': ORGANIZATION_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(input.firstTopicTitle ? { articleSection: input.firstTopicTitle } : {}),
    ...(input.targetKeyword || (input.topicTitles && input.topicTitles.length)
      ? {
          keywords: [
            ...(input.targetKeyword ? [input.targetKeyword] : []),
            ...(input.topicTitles ?? []),
          ].join(', '),
        }
      : {}),
    wordCount: input.wordCount,
    inLanguage: siteConfig.defaultLocale,
    isAccessibleForFree: true,
    ...(extracted.sources.length
      ? {
          citation: extracted.sources.map((s) => ({
            '@type': 'CreativeWork',
            name: s.text,
            url: s.url,
          })),
        }
      : {}),
  }

  const breadcrumbs = [
    { name: 'Guides', url: `${APP_URL}${routes.guides()}` },
    ...(input.firstTopicTitle && input.firstTopicSlug
      ? [
          {
            name: input.firstTopicTitle,
            url: `${APP_URL}${routes.topic(input.firstTopicSlug)}`,
          },
        ]
      : []),
    { name: input.title, url },
  ]

  // Full Person node for E-E-A-T (knowsAbout + sameAs is the primary authority signal in 2026).
  // Added as a separate node in @graph only when there's an author slug and extra fields.
  const authorPersonNode =
    input.authorSlug && input.authorName
      ? {
          '@type': 'Person' as const,
          '@id': `${APP_URL}${routes.author(input.authorSlug)}#author`,
          name: input.authorName,
          url: `${APP_URL}${routes.author(input.authorSlug)}`,
          ...(input.authorJobTitle ? { jobTitle: input.authorJobTitle } : {}),
          ...(input.authorKnowsAbout && input.authorKnowsAbout.length
            ? { knowsAbout: input.authorKnowsAbout }
            : {}),
          ...(input.authorSameAs && input.authorSameAs.length
            ? { sameAs: input.authorSameAs }
            : {}),
        }
      : null

  // The Organization node is added inline in @graph so a schema validator can resolve
  // publisher without crawling the home page (some validators don't follow @id).
  const graph: unknown[] = [
    article,
    buildBreadcrumb(breadcrumbs, url),
    buildOrganizationJsonLd(),
    ...(authorPersonNode ? [authorPersonNode] : []),
  ]

  if (extracted.steps.length > 0) {
    graph.push({
      '@type': 'HowTo',
      '@id': `${url}#howto`,
      name: input.title,
      description: input.metaDescription,
      ...(input.readingMinutes
        ? { totalTime: `PT${input.readingMinutes}M` }
        : {}),
      step: extracted.steps.map((step, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: step.title ?? `Step ${idx + 1}`,
        text: step.body,
      })),
    })
  }

  if (extracted.faq.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: extracted.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    })
  }

  const videoEntry = input.video ?? extracted.videos[0] ?? null
  const resolvedVideo = videoEntry ? resolveVideo(videoEntry) : null

  if (videoEntry && resolvedVideo) {
    graph.push({
      '@type': 'VideoObject',
      '@id': `${url}#video`,
      name: videoEntry.title ?? input.title,
      description: input.metaDescription,
      thumbnailUrl: [ogImage],
      uploadDate: (input.publishedAt ?? input.updatedAt).toISOString(),
      embedUrl: videoEmbedUrl(resolvedVideo.provider, resolvedVideo.id),
      contentUrl: videoEntry.url ?? videoContentUrl(resolvedVideo.provider, resolvedVideo.id),
      ...(videoEntry.duration ? { duration: isoDuration(videoEntry.duration) } : {}),
      inLanguage: siteConfig.defaultLocale,
      publisher: { '@id': ORGANIZATION_ID },
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
