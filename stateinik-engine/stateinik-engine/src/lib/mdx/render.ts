import { compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { type ReactNode } from 'react'
import { mdxComponents, componentsForContext } from '@/components/mdx-blocks'
import { extractMdxMeta, type MdxMeta } from './extract'
import { validateMdxSource } from './sanitize'

export type RenderContext = 'guide' | 'concept'

export interface RenderOptions {
  context: RenderContext
  /**
   * If true (default) run the source through the sanitizer and throw on failure.
   * Pass false only for content already validated at save time.
   */
  validate?: boolean
}

export interface RenderResult {
  content: ReactNode
  meta: MdxMeta
}

const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n/

export async function renderMdx(source: string, options: RenderOptions): Promise<RenderResult> {
  const stripped = source.replace(FRONTMATTER_RE, '')

  if (options.validate !== false) {
    const validation = validateMdxSource(stripped)
    if (!validation.ok) {
      throw new Error(`MDX validation failed:\n${validation.errors.join('\n')}`)
    }
  }

  const components = componentsForContext(options.context, mdxComponents)

  const { content } = await compileMDX({
    source: stripped,
    components,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append',
              properties: { className: ['heading-anchor'], 'aria-label': 'Anchor' },
            },
          ],
        ],
        format: 'mdx',
      },
      parseFrontmatter: false,
    },
  })

  return {
    content,
    meta: extractMdxMeta(source),
  }
}
