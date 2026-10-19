import { z } from 'zod'
import { slugify } from './text'

// Server-side validation for every admin form. The database repeats the most
// important checks, so a bypassed form still cannot store invalid data.

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .transform((v) => (v === '' ? null : v))

const requiredText = (max: number, label: string) =>
  z.string().trim().min(1, `${label} wajib diisi`).max(max, `Maksimal ${max} karakter`)

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https:\/\/[^\s]+$/.test(v), 'Gunakan tautan https:// yang lengkap')

const optionalUuid = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .refine((v) => v === null || /^[0-9a-f-]{36}$/.test(v), 'Pilihan tidak valid')

const checkbox = z
  .union([z.literal('on'), z.literal('true'), z.literal('')])
  .optional()
  .transform((v) => v === 'on' || v === 'true')

export function formObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') out[key] = value
  }
  return out
}

export const geckoSchema = z
  .object({
    name: requiredText(120, 'Nama'),
    code: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,31}$/, 'ID hanya huruf, angka, dan tanda hubung (maks. 32)'),
    slug: z.string().trim().max(80).optional().default(''),
    morph: optionalText(200),
    line_id: optionalUuid,
    description: optionalText(8000),
    sex: z.enum(['male', 'female', 'unknown']),
    hatch_date: z
      .string()
      .trim()
      .transform((v) => (v === '' ? null : v))
      .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Tanggal tidak valid'),
    weight_grams: z
      .string()
      .trim()
      .transform((v) => (v === '' ? null : Number(v.replace(',', '.'))))
      .refine((v) => v === null || (Number.isFinite(v) && v > 0 && v < 1000), 'Berat harus angka antara 0 dan 1000 gram'),
    lineage: optionalText(4000),
    sire_id: optionalUuid,
    dam_id: optionalUuid,
    status: z.enum(['available', 'reserved', 'sold']),
    visibility: z.enum(['for_sale', 'showcase', 'both']),
    featured: checkbox,
    published: checkbox,
    seo_title: optionalText(120),
    seo_description: optionalText(300),
  })
  .transform((g) => ({ ...g, slug: slugify(g.slug || g.name) || slugify(g.code) }))
  .refine((g) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.slug), { message: 'Slug tidak valid', path: ['slug'] })

export const lineSchema = z.object({
  tagline: optionalText(200),
  description: optionalText(8000),
  cover_photo_alt: optionalText(300),
  published: checkbox,
  seo_title: optionalText(120),
  seo_description: optionalText(300),
})

export const awardSchema = z
  .object({
    title: requiredText(200, 'Judul'),
    event_name: optionalText(200),
    organizer: optionalText(200),
    award_year: z
      .string()
      .trim()
      .transform((v) => (v === '' ? null : Number(v)))
      .refine((v) => v === null || (Number.isInteger(v) && v >= 1990 && v <= 2100), 'Tahun tidak valid'),
    placement: optionalText(120),
    gecko_id: optionalUuid,
    description: optionalText(4000),
    evidence_url: httpsUrl.transform((v) => (v === '' ? null : v)),
    verified: checkbox,
    published: checkbox,
    sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  })

export const testimonialSchema = z.object({
  author_name: requiredText(120, 'Nama'),
  author_location: optionalText(120),
  body: requiredText(4000, 'Isi testimoni'),
  source: z.enum(['direct', 'whatsapp', 'instagram', 'facebook', 'tiktok', 'tokopedia', 'other']),
  permission_granted: checkbox,
  permission_note: optionalText(500),
  published: checkbox,
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
})

export const faqSchema = z.object({
  question: requiredText(300, 'Pertanyaan'),
  answer: requiredText(4000, 'Jawaban'),
  category: z.enum(['general', 'purchase', 'shipping', 'care']),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  published: checkbox,
})

export const businessSchema = z.object({
  brand: requiredText(80, 'Nama brand'),
  location: requiredText(200, 'Lokasi'),
  whatsapp_number: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, '').replace(/^0/, '62'))
    .refine((v) => /^62\d{8,13}$/.test(v), 'Nomor WhatsApp harus nomor Indonesia, contoh 085174413278'),
  maps_url: httpsUrl,
  google_reviews_url: httpsUrl,
  google_write_review_url: httpsUrl,
  experience_years: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 80), 'Angka tahun tidak valid'),
  experience_text: z.string().trim().max(300),
})

export const socialsSchema = z.object({
  facebook: httpsUrl,
  instagram: httpsUrl,
  tiktok: httpsUrl,
  youtube: httpsUrl,
  tokopedia: httpsUrl,
})

export const heroSchema = z.object({
  eyebrow: z.string().trim().max(60),
  headline: requiredText(60, 'Judul'),
  tagline: z.string().trim().max(80),
  body: z.string().trim().max(300),
  cta_label: requiredText(40, 'Label tombol'),
  cta_href: z
    .string()
    .trim()
    .max(200)
    .refine((v) => /^\/(?!\/)[a-z0-9\-/?=&]*$/i.test(v), 'Gunakan tautan internal, contoh /geckos'),
  image_alt: z.string().trim().max(300),
  image_is_concept: checkbox,
})

export const storySchema = z.object({
  title: requiredText(80, 'Judul'),
  body: z.string().trim().max(12000),
  signature: z.string().trim().max(120),
  image_alt: z.string().trim().max(300).optional(),
})

export const shippingSchema = z.object({ body: z.string().trim().max(12000) })

export const seoSchema = z.object({
  site_title: requiredText(80, 'Judul situs'),
  default_description: requiredText(300, 'Deskripsi'),
})

export function firstError(error: z.ZodError): string {
  const issue = error.issues[0]
  return issue ? issue.message : 'Data tidak valid'
}
