import type { ComponentType } from 'react'
import type { RenderContext } from '@/lib/mdx/render'

import { TldrSection } from './TldrSection'
import { Steps, Step } from './Steps'
import { Callout } from './Callout'
import { Mermaid } from './Mermaid'
import { FAQ, FAQItem } from './FAQ'
import { QA } from './QA'
import { CodeBlock } from './CodeBlock'
import { MdxPre } from './MdxPre'
import { MdxTable } from './MdxTable'
import { Quote } from './Quote'
import { Stat } from './Stat'
import { Compare } from './Compare'
import { Sources } from './Sources'
import { DefinitionLink } from './DefinitionLink'
import { MdxLink } from './MdxLink'

import { VideoEmbed } from './VideoEmbed'
import { TelegramEmbed } from './TelegramEmbed'
import { ImageWithAlt } from './ImageWithAlt'

import { HeroPromise } from './HeroPromise'
import { Prerequisites } from './Prerequisites'
import { RequiredTools } from './RequiredTools'
import { Changelog } from './Changelog'
import { AiDisclosure } from './AiDisclosure'
import { SeriesNavigation } from './SeriesNavigation'

import { CTA } from './CTA'
import { SocialProof } from './SocialProof'
import { GuideFeedback } from './GuideFeedback'
import { AttentionHook } from './AttentionHook'

import { RelatedGuides } from './RelatedGuides'
import { EmbedGuide } from './EmbedGuide'
import { RelatedConcepts } from './RelatedConcepts'

export const mdxComponents = {
  // Content
  TldrSection,
  Steps,
  Step,
  Callout,
  Mermaid,
  FAQ,
  FAQItem,
  QA,
  CodeBlock,
  Quote,
  Stat,
  Compare,
  Sources,
  DefinitionLink,
  // Media
  VideoEmbed,
  TelegramEmbed,
  ImageWithAlt,
  // Metadata
  HeroPromise,
  Prerequisites,
  RequiredTools,
  Changelog,
  AiDisclosure,
  SeriesNavigation,
  // Conversion / engagement
  CTA,
  SocialProof,
  GuideFeedback,
  AttentionHook,
  // Cross-linking
  RelatedGuides,
  EmbedGuide,
  RelatedConcepts,
  // HTML overrides: fenced ``` ``` blocks render via CodeBlock.
  pre: MdxPre,
  // Wrap GFM <table> in an overflow-x-auto container so wide tables don't blow
  // out the mobile layout.
  table: MdxTable,
  // External links open in a new tab (target=_blank + safe rel).
  a: MdxLink,
} as const

export type MdxComponents = typeof mdxComponents

// In context: 'concept' only the basic text blocks are allowed.
const CONCEPT_ALLOWED = new Set([
  'Quote',
  'CodeBlock',
  'Callout',
  'DefinitionLink',
  'Sources',
  'TldrSection',
  'ImageWithAlt',
  // `a` override — external links in a new tab are wanted in concepts too.
  'a',
])

export function componentsForContext(
  context: RenderContext,
  base: MdxComponents = mdxComponents
): Record<string, ComponentType<unknown>> {
  const out: Record<string, ComponentType<unknown>> = {}
  for (const [name, component] of Object.entries(base)) {
    if (context === 'concept' && !CONCEPT_ALLOWED.has(name)) continue
    out[name] = component as ComponentType<unknown>
  }
  return out
}
