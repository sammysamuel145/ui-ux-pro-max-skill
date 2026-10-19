export type GeckoStatus = 'available' | 'reserved' | 'sold'
export type GeckoVisibility = 'for_sale' | 'showcase' | 'both'
export type GeckoSex = 'male' | 'female' | 'unknown'

export type SignatureLine = {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  cover_photo_path: string | null
  cover_photo_alt: string | null
  sort_order: number
  published: boolean
  seo_title: string | null
  seo_description: string | null
}

export type GeckoPhoto = {
  id: string
  gecko_id: string
  storage_path: string
  alt: string
  sort_order: number
  is_cover: boolean
  width: number | null
  height: number | null
}

export type Gecko = {
  id: string
  code: string
  slug: string
  name: string
  morph: string | null
  line_id: string | null
  description: string | null
  sex: GeckoSex
  hatch_date: string | null
  weight_grams: number | null
  lineage: string | null
  sire_id: string | null
  dam_id: string | null
  /** A parent typed by hand. Empty when the parent is linked through sire_id. */
  sire_name: string | null
  dam_name: string | null
  /** Price in rupiah, shown next to geckos that are not sold. */
  price_idr: number | null
  status: GeckoStatus
  visibility: GeckoVisibility
  featured: boolean
  published: boolean
  archived: boolean
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export type GeckoWithRelations = Gecko & {
  line: Pick<SignatureLine, 'id' | 'slug' | 'name'> | null
  photos: GeckoPhoto[]
}

export type ParentRef = Pick<Gecko, 'id' | 'name' | 'code' | 'slug' | 'published' | 'archived'>

export type Award = {
  id: string
  title: string
  event_name: string | null
  organizer: string | null
  award_year: number | null
  placement: string | null
  gecko_id: string | null
  description: string | null
  evidence_url: string | null
  evidence_path: string | null
  verified: boolean
  published: boolean
  sort_order: number
}

export type Testimonial = {
  id: string
  author_name: string
  author_location: string | null
  body: string
  source: string
  permission_granted: boolean
  permission_note: string | null
  published: boolean
  sort_order: number
}

export type Faq = {
  id: string
  question: string
  answer: string
  category: 'general' | 'purchase' | 'shipping' | 'care'
  sort_order: number
  published: boolean
}

export type BusinessSettings = {
  brand: string
  location: string
  whatsapp_number: string
  maps_url: string
  google_reviews_url: string
  google_write_review_url: string
  experience_years: number | null
  experience_text: string
}

export type SocialSettings = {
  facebook: string
  instagram: string
  tiktok: string
  youtube: string
  tokopedia: string
}

export type HeroSettings = {
  eyebrow: string
  headline: string
  tagline: string
  body: string
  cta_label: string
  cta_href: string
  image_path: string
  image_alt: string
}

export type StorySettings = { title: string; body: string; signature: string; image_path: string; image_alt: string }
export type ShippingSettings = { body: string }
export type SeoSettings = { site_title: string; default_description: string; og_image_path: string }

export type SiteSettings = {
  business: BusinessSettings
  socials: SocialSettings
  hero: HeroSettings
  story: StorySettings
  shipping: ShippingSettings
  seo: SeoSettings
}
