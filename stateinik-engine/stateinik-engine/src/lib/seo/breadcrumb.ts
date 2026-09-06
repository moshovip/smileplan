// Helper that builds BreadcrumbList JSON-LD. One for all "Workshop" page types.
// Spec: https://schema.org/BreadcrumbList

export interface BreadcrumbItem {
  name: string
  url: string
}

export interface BreadcrumbListJsonLd {
  '@type': 'BreadcrumbList'
  '@id': string
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }>
}

export function buildBreadcrumb(
  items: BreadcrumbItem[],
  pageUrl: string,
): BreadcrumbListJsonLd {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem' as const,
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
