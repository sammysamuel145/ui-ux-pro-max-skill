import type { MetadataRoute } from 'next'
import { listPublicGeckoSlugs } from '@/lib/data/public'
import { siteUrl } from '@/lib/env'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const pages = ['', '/geckos', '/showcase', '/lines/mantra', '/lines/kafka', '/lines/valkrie', '/our-story', '/achievements', '/reviews', '/faq', '/shipping', '/contact']
  const geckos = await listPublicGeckoSlugs()
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...geckos.map((g) => ({ url: `${base}/geckos/${g.slug}`, lastModified: g.updated_at, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
}
