// Organization JSON-LD for the home page. Every other page references it by @id
// to avoid duplicating org data. Values come from site.config.ts (env-driven).

import { siteConfig } from '@/site.config'

const APP_URL = siteConfig.url

export const ORGANIZATION_ID = `${APP_URL}/#organization`
export const FOUNDER_ID = `${APP_URL}/#founder`

export function buildOrganizationJsonLd() {
  const org = siteConfig.organization
  return {
    '@type': 'Organization' as const,
    '@id': ORGANIZATION_ID,
    name: org.name,
    ...(org.legalName ? { legalName: org.legalName } : {}),
    description: siteConfig.description,
    url: org.url,
    ...(org.logo ? { logo: org.logo, image: org.logo } : {}),
    ...(org.sameAs.length ? { sameAs: org.sameAs } : {}),
  }
}
