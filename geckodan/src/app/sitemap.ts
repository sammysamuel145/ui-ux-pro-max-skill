import type { MetadataRoute } from 'next'
import { listLines, listPublicGeckoSlugs } from '@/lib/data/public'
import { siteUrl } from '@/lib/env'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const pages = ['', '/geckos', '/showcase', '/our-story', '/achievements', '/reviews', '/faq', '/shipping', '/contact']
  const [geckos, lines] = await Promise.all([listPublicGeckoSlugs(), listLines()])
  const linePages = lines.state === 'ok' ? lines.data.map((l) => `/lines/${l.slug}`) : []
  return [
    ...[...pages.slice(0, 3), ...linePages, ...pages.slice(3)].map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...geckos.map((g) => ({ url: `${base}/geckos/${g.slug}`, lastModified: g.updated_at, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
}
