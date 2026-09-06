/**
 * Demo seed for Stateinik. Idempotent (upserts by slug). Run with:
 *   npm run seed       (or)   npm run dev:seed
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function words(s: string): number {
  return s.split(/\s+/).filter(Boolean).length
}
function readingMinutes(s: string): number {
  return Math.max(1, Math.round(words(s) / 200))
}

const GUIDE_WELCOME = `## TL;DR

<TldrSection>
- Stateinik is an MDX article engine you can self-host.
- Write guides in MDX with ready-made blocks; publish with revisions, SEO and search built in.
- This page is itself a seeded guide — edit it in the admin to see how it works.
</TldrSection>

## What this is

Stateinik renders **rich MDX articles** with a library of content blocks. Below are a few of them in action.

<Callout type="tip" title="Try it">
Open this guide in the admin editor and change a heading — you'll get an autosaved revision you can roll back to.
</Callout>

## A short walkthrough

<Steps>
  <Step title="Write MDX">Author content with Markdown plus JSX blocks.</Step>
  <Step title="Preview">See it rendered live before publishing.</Step>
  <Step title="Publish">Slug history, sitemap and IndexNow handle the rest.</Step>
</Steps>

## Code highlighting

\`\`\`ts
// Fenced code blocks render with Shiki highlighting.
export function greet(name: string): string {
  return \`Hello, \${name}!\`
}
\`\`\`

## A comparison table

| Feature        | Stateinik | A plain markdown folder |
| -------------- | --------- | ----------------------- |
| Revisions      | Yes       | No                      |
| Full-text search | Yes     | No                      |
| Admin editor   | Yes       | No                      |

> Good documentation is a product, not a byproduct.

## FAQ

<FAQ>
  <FAQItem question="Is it really self-hostable?">Yes — clone the repo, point it at Postgres, and deploy anywhere Next.js runs.</FAQItem>
  <FAQItem question="Can I theme it?">Yes — edit the tokens in tailwind.config.ts and site.config.ts.</FAQItem>
</FAQ>
`

const GUIDE_MDX = `## TL;DR

<TldrSection>
- MDX = Markdown + JSX components.
- Stateinik ships ~25 vetted blocks behind a sanitizer whitelist.
- Add your own block by registering it once in the component registry.
</TldrSection>

## Why MDX

Plain Markdown is great for prose but can't express callouts, step lists or comparison tables. MDX lets you drop in **components** exactly where you need them.

<Callout type="info" title="Whitelist">
Only components on the sanitizer whitelist may appear in MDX. This keeps authored content safe to render.
</Callout>

## Adding a block

\`\`\`tsx
// 1. Create the component, 2. register it in components/mdx-blocks/index.ts,
// 3. add its name to the sanitizer whitelist.
export function Highlight({ children }: { children: React.ReactNode }) {
  return <mark className="bg-accent-soft">{children}</mark>
}
\`\`\`
`

const GUIDE_SEO = `## TL;DR

<TldrSection>
- Every page emits a JSON-LD @graph (Article / FAQ / Breadcrumb / Person / Organization).
- Dynamic OG images, sitemap, llms.txt and IndexNow ship in the box.
- Full-text search runs on Postgres tsvector with weighted ranking.
</TldrSection>

## Search is built in

Search uses a Postgres \`tsvector\` column kept fresh by a trigger, with title/excerpt/content weighted A/B/C.

<Callout type="tip" title="Language">
Set \`FTS_LANGUAGE\` to match your content language and re-run the search migration.
</Callout>
`

async function main() {
  console.log('Seeding…')

  const author = await prisma.author.upsert({
    where: { slug: 'ada-lovelace' },
    update: {},
    create: {
      slug: 'ada-lovelace',
      name: 'Ada Lovelace',
      title: 'Demo author',
      bio: 'A placeholder author for the Stateinik demo. Replace with your own in the admin.',
      socialLinks: [{ label: 'Website', url: 'https://example.com' }],
    },
  })

  const topicData = [
    { slug: 'getting-started', title: 'Getting started' },
    { slug: 'mdx', title: 'MDX' },
    { slug: 'seo', title: 'SEO' },
  ]
  const topics: Record<string, string> = {}
  for (const t of topicData) {
    const row = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { title: t.title },
      create: t,
    })
    topics[t.slug] = row.id
  }

  const series = await prisma.guideSeries.upsert({
    where: { slug: 'getting-started' },
    update: {},
    create: { slug: 'getting-started', title: 'Getting started', description: 'Start here.' },
  })

  const concepts = [
    {
      slug: 'mdx',
      term: 'MDX',
      shortDefinition: 'Markdown extended with JSX components, so you can embed interactive blocks inside prose.',
      longExplanation: 'MDX compiles Markdown and JSX together. Stateinik renders it server-side through a sanitizer whitelist.',
      topic: 'mdx',
    },
    {
      slug: 'full-text-search',
      term: 'Full-text search',
      shortDefinition: 'Database search that ranks documents by relevance to a query, not just exact matches.',
      longExplanation: 'Stateinik uses Postgres tsvector with a GIN index and weighted fields for fast, ranked search.',
      topic: 'seo',
    },
  ]
  const conceptIds: Record<string, string> = {}
  for (const c of concepts) {
    const row = await prisma.concept.upsert({
      where: { slug: c.slug },
      update: { term: c.term, shortDefinition: c.shortDefinition, longExplanation: c.longExplanation, status: 'published', publishedAt: new Date() },
      create: {
        slug: c.slug,
        term: c.term,
        shortDefinition: c.shortDefinition,
        longExplanation: c.longExplanation,
        status: 'published',
        publishedAt: new Date(),
        authorId: author.id,
        topics: { create: [{ topicId: topics[c.topic] }] },
      },
    })
    conceptIds[c.slug] = row.id
  }

  const guides = [
    {
      slug: 'welcome-to-stateinik', title: 'Welcome to Stateinik', type: 'pillar' as const,
      excerpt: 'A tour of the MDX article engine — blocks, revisions, search and SEO, all in one seeded guide.',
      metaDescription: 'Stateinik is an open-source MDX article engine. This guide tours its blocks and features.',
      content: GUIDE_WELCOME, topic: 'getting-started', pinned: true, seriesOrder: 1,
    },
    {
      slug: 'authoring-in-mdx', title: 'Authoring in MDX', type: 'tutorial' as const,
      excerpt: 'How to write content with Markdown plus components, and how to add a block of your own.',
      metaDescription: 'Write Stateinik content in MDX: Markdown plus a whitelist of safe components.',
      content: GUIDE_MDX, topic: 'mdx', pinned: false, seriesOrder: 2,
    },
    {
      slug: 'seo-that-ships', title: 'SEO that ships', type: 'playbook' as const,
      excerpt: 'JSON-LD, OG images, sitemap, llms.txt, IndexNow and Postgres full-text search — what you get for free.',
      metaDescription: 'The SEO and discovery features baked into Stateinik out of the box.',
      content: GUIDE_SEO, topic: 'seo', pinned: false, seriesOrder: 3,
    },
  ]

  let pillarId: string | null = null
  for (const g of guides) {
    const row = await prisma.guide.upsert({
      where: { slug: g.slug },
      update: {
        title: g.title, excerpt: g.excerpt, metaDescription: g.metaDescription,
        content: g.content, status: 'published', publishedAt: new Date(),
        readingMinutes: readingMinutes(g.content), wordCount: words(g.content),
      },
      create: {
        slug: g.slug, title: g.title, type: g.type, difficulty: 'beginner',
        excerpt: g.excerpt, metaDescription: g.metaDescription, content: g.content,
        status: 'published', publishedAt: new Date(), isPinned: g.pinned,
        readingMinutes: readingMinutes(g.content), wordCount: words(g.content),
        authorId: author.id,
        seriesId: series.id, seriesOrder: g.seriesOrder,
        topics: { create: [{ topicId: topics[g.topic] }] },
        stats: { create: { viewsCount: g.pinned ? 1200 : 300 } },
      },
    })
    if (g.type === 'pillar') pillarId = row.id

    // concept mentions for the pillar
    if (g.slug === 'welcome-to-stateinik') {
      for (const cid of Object.values(conceptIds)) {
        await prisma.guideConceptMention.upsert({
          where: { guideId_conceptId: { guideId: row.id, conceptId: cid } },
          update: {},
          create: { guideId: row.id, conceptId: cid },
        })
      }
    }
  }

  // make the tutorial + playbook cluster under the pillar
  if (pillarId) {
    await prisma.guide.updateMany({
      where: { slug: { in: ['authoring-in-mdx', 'seo-that-ships'] } },
      data: { pillarId },
    })
  }

  console.log('Seed complete: 1 author, 3 topics, 1 series, 3 guides, 2 concepts.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
