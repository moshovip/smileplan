import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import { prisma } from '@/lib/prisma'
import { jsonLdScript } from '@/lib/seo/json-ld-script'
import { siteConfig, routes } from '@/site.config'
import { renderMdx } from '@/lib/mdx/render'
import { formatDate, difficultyLabel, difficultyBadgeClasses } from '@/lib/guides/format'
import { findGuideRedirectSlug } from '@/lib/guides/queries'
import { buildGuideJsonLd } from '@/lib/guides/json-ld'
import { extractMdxMeta } from '@/lib/mdx/extract'
import { getRelatedGuides } from '@/lib/guides/related'

import { GuideReadingProgress } from '@/components/guides/GuideReadingProgress'
import { GuideShareBar } from '@/components/guides/GuideShareBar'
import { GuideAnalytics } from '@/components/guides/GuideAnalytics'
import { GuideTocFloating } from '@/components/guides/GuideTocFloating'
import { GuideContent } from '@/components/guides/GuideContent'
import { GuideAuthorCard } from '@/components/guides/GuideAuthorCard'
import { PillarContextBlock } from '@/components/guides/PillarContextSidebar'
import { GuideProvider } from '@/components/guides/GuideContext'
import { H1Variant, type H1VariantSpec } from '@/components/guides/H1Variant'

import { HeroPromise } from '@/components/mdx-blocks/HeroPromise'
import { SocialProof } from '@/components/mdx-blocks/SocialProof'
import { Changelog } from '@/components/mdx-blocks/Changelog'
import { Prerequisites } from '@/components/mdx-blocks/Prerequisites'
import { RequiredTools } from '@/components/mdx-blocks/RequiredTools'
import { PillarMap } from '@/components/mdx-blocks/PillarMap'
import { SeriesNavigation } from '@/components/mdx-blocks/SeriesNavigation'
import { GuideFeedback } from '@/components/mdx-blocks/GuideFeedback'
import { RelatedGuides } from '@/components/mdx-blocks/RelatedGuides'
import { RelatedConcepts } from '@/components/mdx-blocks/RelatedConcepts'

export const revalidate = 3600

const APP_URL = siteConfig.url

interface PageProps {
  params: Promise<{ slug: string }>
}

interface HeroPromiseShape {
  whatYouLearn?: string[]
  applyIn?: number
  saves?: number
}

interface RequiredTool {
  name: string
  icon?: string
  url?: string
}

interface ChangelogEntry {
  date: string
  summary: string
}

interface H1VariantList {
  variants?: Array<string | H1VariantSpec>
}

async function loadGuide(slug: string) {
  return prisma.guide.findUnique({
    where: { slug },
    include: {
      author: true,
      reviewedBy: true,
      topics: { include: { topic: true } },
      pillar: { select: { slug: true, title: true } },
      clusters: { where: { status: 'published' }, select: { slug: true, title: true, excerpt: true } },
      prerequisites: {
        include: { prerequisite: { select: { slug: true, title: true, status: true } } },
      },
      series: true,
      conceptMentions: {
        include: {
          concept: {
            select: { slug: true, term: true, shortDefinition: true, status: true },
          },
        },
      },
      stats: true,
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = await prisma.guide.findUnique({
    where: { slug },
    select: { title: true, metaTitle: true, metaDescription: true, excerpt: true, ogImage: true, heroImage: true, heroImageAlt: true, heroImageWidth: true, heroImageHeight: true, slug: true, status: true },
  })
  if (!guide || guide.status !== 'published') {
    return { title: `Guide not found — ${siteConfig.name}` }
  }
  const title = guide.metaTitle ?? `${guide.title} — ${siteConfig.name}`
  const description = guide.metaDescription || guide.excerpt || guide.title
  const canonical = routes.guide(guide.slug)
  const ogImageUrl = guide.ogImage ?? `${APP_URL}/og/guide/${guide.slug}`
  const ogImages: Array<{ url: string; width: number; height: number; alt?: string }> = []
  if (guide.heroImage) {
    ogImages.push({
      url: guide.heroImage,
      width: guide.heroImageWidth ?? 1600,
      height: guide.heroImageHeight ?? 900,
      ...(guide.heroImageAlt ? { alt: guide.heroImageAlt } : {}),
    })
  }
  ogImages.push({ url: ogImageUrl, width: 1200, height: 630 })

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `${APP_URL}${canonical}`,
      siteName: siteConfig.name,
      type: 'article',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [guide.heroImage ?? ogImageUrl],
    },
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params

  const guide = await loadGuide(slug)

  if (!guide || guide.status !== 'published' || guide.deletedAt) {
    const newSlug = await findGuideRedirectSlug(slug)
    if (newSlug && newSlug !== slug) {
      permanentRedirect(routes.guide(newSlug))
    }
    notFound()
  }

  const { content, meta } = await renderMdx(guide.content, { context: 'guide' })

  const heroPromise = (guide.heroPromise as HeroPromiseShape | null) ?? null
  const rawH1 = (guide.h1Variants as Array<string | H1VariantSpec> | H1VariantList | null) ?? null
  const h1List: Array<string | H1VariantSpec> | null = Array.isArray(rawH1)
    ? rawH1
    : Array.isArray(rawH1?.variants)
      ? rawH1.variants
      : null
  const normalizedH1: H1VariantSpec[] | null = h1List && h1List.length > 0
    ? h1List
        .map(v => (typeof v === 'string' ? { text: v, weight: 1 } : v))
        .filter(v => v && typeof v.text === 'string' && v.text.trim().length > 0)
    : null

  const requiredTools = (guide.requiredTools as RequiredTool[] | null) ?? []
  const changelogEntries = (guide.changelogEntries as ChangelogEntry[] | null) ?? []
  const primaryCta = (guide.primaryCta as { label?: string; href?: string } | null) ?? null

  const prereqGuides = guide.prerequisites
    .map((p) => p.prerequisite)
    .filter((g) => g.status === 'published')
    .map((g) => ({ slug: g.slug, title: g.title }))

  const relatedConcepts = guide.conceptMentions
    .map((m) => m.concept)
    .filter((c) => c.status === 'published')
    .map((c) => ({ slug: c.slug, term: c.term, shortDefinition: c.shortDefinition }))

  // Series: prev/next and totalCount
  let seriesNav: null | {
    current: number
    total: number
    prev?: { slug: string; title: string }
    next?: { slug: string; title: string }
  } = null
  if (guide.series && typeof guide.seriesOrder === 'number') {
    const allInSeries = await prisma.guide.findMany({
      where: { seriesId: guide.series.id, status: 'published', deletedAt: null },
      orderBy: { seriesOrder: 'asc' },
      select: { slug: true, title: true, seriesOrder: true },
    })
    const idx = allInSeries.findIndex((g) => g.slug === guide.slug)
    seriesNav = {
      current: guide.seriesOrder,
      total: allInSeries.length,
      prev: idx > 0 ? { slug: allInSeries[idx - 1].slug, title: allInSeries[idx - 1].title } : undefined,
      next: idx >= 0 && idx < allInSeries.length - 1
        ? { slug: allInSeries[idx + 1].slug, title: allInSeries[idx + 1].title }
        : undefined,
    }
  }

  const relatedGuides = await getRelatedGuides(guide.id, 4)

  // Cluster sidebar: shown when the guide has a pillar.
  let pillarSidebar: null | {
    pillar: { slug: string; title: string }
    siblings: Array<{ slug: string; title: string }>
  } = null
  if (guide.pillarId && guide.pillar) {
    const siblings = await prisma.guide.findMany({
      where: {
        pillarId: guide.pillarId,
        id: { not: guide.id },
        status: 'published',
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { slug: true, title: true },
    })
    pillarSidebar = {
      pillar: { slug: guide.pillar.slug, title: guide.pillar.title },
      siblings,
    }
  }

  const firstTopic = guide.topics[0]?.topic

  const mdxMeta = extractMdxMeta(guide.content)
  const jsonLdGraph = buildGuideJsonLd(
    {
      slug: guide.slug,
      title: guide.title,
      metaTitle: guide.metaTitle,
      metaDescription: guide.metaDescription,
      excerpt: guide.excerpt,
      publishedAt: guide.publishedAt,
      updatedAt: guide.updatedAt,
      lastReviewedAt: guide.lastReviewedAt,
      readingMinutes: guide.readingMinutes,
      wordCount: guide.wordCount,
      ogImage: guide.ogImage,
      heroImage: guide.heroImage,
      heroImageAlt: guide.heroImageAlt,
      heroImageWidth: guide.heroImageWidth,
      heroImageHeight: guide.heroImageHeight,
      targetKeyword: guide.targetKeyword,
      authorSlug: guide.author?.slug ?? null,
      authorName: guide.author?.name ?? null,
      authorJobTitle: guide.author?.title ?? null,
      authorKnowsAbout: guide.topics.map((t) => t.topic.title),
      authorSameAs: (() => {
        const links = (guide.author?.socialLinks ?? []) as Array<{ url?: string }> | Record<string, string>
        if (Array.isArray(links)) {
          return links.map((l) => l?.url).filter((u): u is string => typeof u === 'string' && u.startsWith('http'))
        }
        return Object.values(links).filter((u): u is string => typeof u === 'string' && u.startsWith('http'))
      })(),
      reviewerSlug: guide.reviewedBy?.slug ?? null,
      reviewerName: guide.reviewedBy?.name ?? null,
      firstTopicTitle: firstTopic?.title ?? null,
      firstTopicSlug: firstTopic?.slug ?? null,
      topicTitles: guide.topics.map((t) => t.topic.title),
      video: null,
    },
    mdxMeta,
  )

  return (
    <GuideProvider slug={guide.slug} id={guide.id}>
      {guide.heroImage && (
        <link rel="preload" as="image" href={guide.heroImage} fetchPriority="high" />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdGraph) }}
      />
      <GuideReadingProgress />
      <GuideAnalytics guideSlug={guide.slug} guideId={guide.id} />
      <GuideShareBar guideSlug={guide.slug} title={guide.title} />

      <div className="max-w-[920px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div>
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-text-dim mb-6 flex-wrap">
          <Link href={routes.guides()} className="hover:text-accent">Guides</Link>
          {firstTopic && (
            <>
              <ChevronRight size={12} strokeWidth={1.5} />
              <Link href={routes.topic(firstTopic.slug)} className="hover:text-accent">
                {firstTopic.title}
              </Link>
            </>
          )}
          <ChevronRight size={12} strokeWidth={1.5} />
          <span className="text-text-sub truncate max-w-[180px] sm:max-w-none">{guide.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <H1Variant
            variants={normalizedH1}
            defaultText={guide.title}
            guideSlug={guide.slug}
            guideId={guide.id}
            className="font-head text-[clamp(32px,4.5vw,48px)] text-text leading-[1.1] tracking-tight mb-5"
          />
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-sub">
            {guide.author && (
              <div className="inline-flex items-center gap-2">
                {guide.author.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={guide.author.avatar}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-bg-card-hover flex items-center justify-center text-text text-xs">
                    {(guide.author.name ?? '?').slice(0, 1)}
                  </div>
                )}
                {guide.author.slug ? (
                  <Link href={routes.author(guide.author.slug)} className="text-text hover:text-accent">
                    {guide.author.name}
                  </Link>
                ) : (
                  <span className="text-text">{guide.author.name}</span>
                )}
              </div>
            )}
            {guide.reviewedBy && (
              <span className="text-text-dim">
                Reviewed by <span className="text-text-sub">{guide.reviewedBy.name}</span>
              </span>
            )}
            {guide.publishedAt && (
              <span>Published {formatDate(guide.publishedAt)}</span>
            )}
            {guide.updatedAt && guide.publishedAt && guide.updatedAt.getTime() - guide.publishedAt.getTime() > 24 * 60 * 60 * 1000 && (
              <span>Updated {formatDate(guide.updatedAt)}</span>
            )}
            {guide.readingMinutes > 0 && <span>{guide.readingMinutes} min read</span>}
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyBadgeClasses(guide.difficulty)}`}>
              {difficultyLabel(guide.difficulty)}
            </span>
          </div>
        </header>

        {/* Hero illustration (optional, AI-generated) */}
        {guide.heroImage && (
          <figure className="mb-8 -mx-4 sm:mx-0 sm:rounded-2xl overflow-hidden">
            <picture>
              {guide.heroImage.endsWith('.webp') && (
                <source srcSet={guide.heroImage.replace('.webp', '.avif')} type="image/avif" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={guide.heroImage}
                alt={guide.heroImageAlt ?? guide.title}
                width={guide.heroImageWidth ?? 1600}
                height={guide.heroImageHeight ?? 900}
                className="w-full h-auto block"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
          </figure>
        )}

        {/* HeroPromise */}
        {heroPromise?.whatYouLearn && heroPromise.whatYouLearn.length > 0 && (
          <HeroPromise
            whatYouLearn={heroPromise.whatYouLearn}
            applyIn={heroPromise.applyIn}
            saves={heroPromise.saves}
            difficulty={guide.difficulty as 'beginner' | 'intermediate' | 'advanced'}
          />
        )}

        {/* SocialProof */}
        {guide.stats && (guide.stats.viewsCount > 0 || guide.stats.appliedCount > 0 || guide.stats.shareCount > 0) && (
          <SocialProof
            views={guide.stats.viewsCount}
            applied={guide.stats.appliedCount}
            shares={guide.stats.shareCount}
          />
        )}

        {/* Changelog (the component filters to recent entries itself). */}
        {changelogEntries.length > 0 && <Changelog entries={changelogEntries} />}

        {/* Prerequisites */}
        {prereqGuides.length > 0 && <Prerequisites guides={prereqGuides} />}

        {/* RequiredTools */}
        {requiredTools.length > 0 && <RequiredTools tools={requiredTools} />}

        {/* PillarMap (only for type=pillar with clusters) */}
        {guide.type === 'pillar' && guide.clusters.length > 0 && (
          <PillarMap clusters={guide.clusters} />
        )}

        {/* SeriesNavigation */}
        {seriesNav && (
          <SeriesNavigation
            current={{ order: seriesNav.current }}
            total={seriesNav.total}
            prev={seriesNav.prev}
            next={seriesNav.next}
          />
        )}

        {/* MDX content + optional footer CTA */}
        <GuideContent content={content} primaryCta={primaryCta} />

        {/* Feedback */}
        <GuideFeedback guideId={guide.id} guideSlug={guide.slug} />

        {/* Author card */}
        {guide.author && (
          <GuideAuthorCard
            author={{
              slug: guide.author.slug ?? null,
              name: guide.author.name ?? null,
              title: guide.author.title ?? null,
              bio: guide.author.bio ?? null,
              avatar: guide.author.avatar ?? null,
              socialLinks: (guide.author.socialLinks as unknown) ?? null,
            }}
          />
        )}

        {/* Topic map for cluster pages (link to pillar + sibling guides) */}
        {pillarSidebar && (
          <PillarContextBlock
            pillar={pillarSidebar.pillar}
            siblings={pillarSidebar.siblings}
            currentSlug={guide.slug}
          />
        )}

        {/* Related guides */}
        {relatedGuides.length > 0 && <RelatedGuides guides={relatedGuides} />}

        {/* Related concepts */}
        {relatedConcepts.length > 0 && <RelatedConcepts concepts={relatedConcepts} />}

        {/* TOC (floating button) */}
        <GuideTocFloating toc={meta.toc} />
        </div>
      </div>
    </GuideProvider>
  )
}
