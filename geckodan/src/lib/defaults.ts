import type { SiteSettings } from './types'

// Fallbacks used only for keys that are missing from site_settings. They hold
// the business details the owner supplied; nothing here is invented content.
export const DEFAULT_SETTINGS: SiteSettings = {
  business: {
    brand: 'GeckoDan',
    location: 'Pamulang, Tangerang Selatan, Indonesia',
    whatsapp_display: '0851 7441 3278',
    whatsapp_number: '6285174413278',
    maps_url: 'https://share.google/djs93Utk6ol35s2kV',
    google_reviews_url: '',
    google_write_review_url: '',
    experience_years: 10,
    experience_text: '',
  },
  socials: {
    facebook: 'https://www.facebook.com/share/1C2cfuuTPd/?mibextid=wwXIfr',
    instagram: 'https://www.instagram.com/geck_dan?vrfl=M24zYnlqMXZhMDFv',
    tiktok: 'https://www.tiktok.com/@geckodan_?_r=1&_t=ZS-9AeXmIbtv5Z',
    youtube: 'https://youtube.com/@joreptile?si=hS67ZZWEuqj8zZTC',
    tokopedia: 'https://tk.tokopedia.com/ZSg6qxxMf/',
  },
  hero: {
    eyebrow: 'Premium Gecko Breeder',
    headline: 'A Decade of Passion.',
    tagline: 'A Legacy in Every Line.',
    body: 'Lebih dari 10 tahun berkecimpung di dunia gecko, menghadirkan kualitas, karakter, dan dedikasi di setiap generasi.',
    cta_label: 'Explore Our Geckos',
    cta_href: '/geckos',
    image_path: '',
    image_alt: '',
    image_is_concept: true,
  },
  story: { title: 'Our Story', body: '', signature: '' },
  shipping: { body: '' },
  seo: {
    site_title: 'GeckoDan',
    default_description:
      'GeckoDan, breeder leopard gecko premium di Pamulang, Tangerang Selatan. Lihat gecko yang tersedia dan tanyakan langsung lewat WhatsApp.',
    og_image_path: '',
  },
}
