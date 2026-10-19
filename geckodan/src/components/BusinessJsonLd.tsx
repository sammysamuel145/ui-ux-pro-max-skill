import { activePlatforms } from './SocialLinks'
import { siteUrl } from '@/lib/env'
import type { SiteSettings } from '@/lib/types'

/**
 * Structured data built only from owner-supplied business details. It has no
 * rating, review count or price, because none of those are published here.
 */
export function BusinessJsonLd({ settings }: { settings: SiteSettings }) {
  const { business, socials } = settings
  const data = {
    '@context': 'https://schema.org',
    '@type': 'PetStore',
    name: business.brand,
    url: siteUrl(),
    logo: `${siteUrl()}/brand/geckodan-logo-640.png`,
    image: `${siteUrl()}/brand/geckodan-logo-640.png`,
    telephone: `+${business.whatsapp_number}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Pamulang',
      addressRegion: 'Banten',
      addressCountry: 'ID',
    },
    ...(business.maps_url ? { hasMap: business.maps_url } : {}),
    sameAs: activePlatforms(socials).map((p) => socials[p.key]),
  }
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped cannot close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
