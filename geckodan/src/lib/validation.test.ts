import { describe, expect, it } from 'vitest'
import { awardSchema, businessSchema, geckoSchema, heroSchema, socialsSchema } from './validation'

const gecko = {
  name: 'Test Gecko',
  code: 'GD-0001',
  slug: '',
  morph: '',
  line_id: '',
  description: '',
  sex: 'unknown',
  hatch_date: '',
  weight_grams: '',
  lineage: '',
  sire_id: '',
  dam_id: '',
  status: 'available',
  visibility: 'for_sale',
  seo_title: '',
  seo_description: '',
}

describe('geckoSchema', () => {
  it('derives the slug from the name and turns blanks into null', () => {
    const r = geckoSchema.parse(gecko)
    expect(r.slug).toBe('test-gecko')
    expect(r.morph).toBeNull()
    expect(r.line_id).toBeNull()
    expect(r.published).toBe(false)
  })

  it('reads checkboxes and a decimal comma weight', () => {
    const r = geckoSchema.parse({ ...gecko, published: 'on', featured: 'on', weight_grams: '45,5' })
    expect(r.published).toBe(true)
    expect(r.featured).toBe(true)
    expect(r.weight_grams).toBe(45.5)
  })

  it('rejects an invalid code, status or parent id', () => {
    expect(geckoSchema.safeParse({ ...gecko, code: 'bad code!' }).success).toBe(false)
    expect(geckoSchema.safeParse({ ...gecko, status: 'cheap' }).success).toBe(false)
    expect(geckoSchema.safeParse({ ...gecko, sire_id: "x' or 1=1" }).success).toBe(false)
  })

  it('has no price field', () => {
    const r = geckoSchema.parse({ ...gecko, price: '1000000' })
    expect('price' in r).toBe(false)
  })
})

describe('settings schemas', () => {
  it('normalises a local WhatsApp number', () => {
    const r = businessSchema.parse({
      brand: 'GeckoDan',
      location: 'Pamulang',
      whatsapp_number: '0851-7441-3278',
      maps_url: '',
      google_reviews_url: '',
      google_write_review_url: '',
      experience_years: '10',
      experience_text: '',
    })
    expect(r.whatsapp_number).toBe('6285174413278')
    expect(r.experience_years).toBe(10)
  })

  it('only accepts https links', () => {
    const base = { facebook: '', instagram: '', tiktok: '', youtube: '', tokopedia: '' }
    expect(socialsSchema.safeParse({ ...base, instagram: 'javascript:alert(1)' }).success).toBe(false)
    expect(socialsSchema.safeParse({ ...base, instagram: 'http://instagram.com/x' }).success).toBe(false)
    expect(socialsSchema.safeParse({ ...base, instagram: 'https://instagram.com/x' }).success).toBe(true)
  })

  it('keeps the hero button on an internal link', () => {
    const hero = { eyebrow: '', headline: 'A', tagline: '', body: '', cta_label: 'Go', image_alt: '' }
    expect(heroSchema.safeParse({ ...hero, cta_href: '/geckos' }).success).toBe(true)
    expect(heroSchema.safeParse({ ...hero, cta_href: 'https://evil.example' }).success).toBe(false)
    expect(heroSchema.safeParse({ ...hero, cta_href: '//evil' }).success).toBe(false)
  })

  it('validates award evidence links', () => {
    const award = { title: 'Juara 1', event_name: '', organizer: '', award_year: '2024', placement: '', gecko_id: '', description: '' }
    expect(awardSchema.safeParse({ ...award, evidence_url: 'ftp://x' }).success).toBe(false)
    expect(awardSchema.parse({ ...award, evidence_url: '' }).evidence_url).toBeNull()
  })
})
