import 'server-only'
import { cache } from 'react'
import { publicClient } from '../supabase/public'
import { DEFAULT_SETTINGS } from '../defaults'
import { statusesFor, type CatalogFilters } from '../catalog'
import type {
  Award,
  Faq,
  GeckoPhoto,
  GeckoWithRelations,
  ParentRef,
  SignatureLine,
  SiteSettings,
  Testimonial,
} from '../types'

/**
 * Every loader returns a result object instead of throwing, so each page can
 * show a deliberate "not configured", empty or error state.
 */
export type Loaded<T> =
  | { state: 'ok'; data: T }
  | { state: 'unconfigured' }
  | { state: 'error'; message: string }

function fail(message: string): Loaded<never> {
  console.error('[geckodan:data]', message)
  return { state: 'error', message }
}

const GECKO_SELECT =
  'id, code, slug, name, morph, line_id, description, sex, hatch_date, weight_grams, lineage, sire_id, dam_id, status, visibility, featured, published, archived, seo_title, seo_description, created_at, updated_at, line:signature_lines(id, slug, name), photos:gecko_photos(id, gecko_id, storage_path, alt, sort_order, is_cover, width, height)'

function sortPhotos<T extends { photos: GeckoPhoto[] }>(g: T): T {
  const photos = [...(g.photos ?? [])].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  )
  return { ...g, photos }
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const db = publicClient()
  if (!db) return DEFAULT_SETTINGS
  const { data, error } = await db.from('site_settings').select('key, value')
  if (error || !data) {
    if (error) console.error('[geckodan:data] settings', error.message)
    return DEFAULT_SETTINGS
  }
  const merged = structuredClone(DEFAULT_SETTINGS) as Record<string, Record<string, unknown>>
  for (const row of data as Array<{ key: string; value: Record<string, unknown> }>) {
    if (row.key in merged && row.value && typeof row.value === 'object') {
      merged[row.key] = { ...merged[row.key], ...row.value }
    }
  }
  return merged as unknown as SiteSettings
})

export type CatalogScope = 'for_sale' | 'showcase'

export async function listGeckos(
  scope: CatalogScope,
  filters: CatalogFilters,
): Promise<Loaded<GeckoWithRelations[]>> {
  const db = publicClient()
  if (!db) return { state: 'unconfigured' }

  let lineId: string | null = null
  if (filters.line) {
    const { data, error } = await db.from('signature_lines').select('id').eq('slug', filters.line).maybeSingle()
    if (error) return fail(error.message)
    if (!data) return { state: 'ok', data: [] }
    lineId = data.id as string
  }

  let query = db
    .from('geckos')
    .select(GECKO_SELECT)
    .in('visibility', scope === 'for_sale' ? ['for_sale', 'both'] : ['showcase', 'both'])

  if (scope === 'for_sale') query = query.in('status', statusesFor(filters.status))
  if (lineId) query = query.eq('line_id', lineId)
  if (filters.sex) query = query.eq('sex', filters.sex)
  if (filters.q) query = query.or(`name.ilike.%${filters.q}%,code.ilike.%${filters.q}%,morph.ilike.%${filters.q}%`)

  if (filters.sort === 'name') query = query.order('name', { ascending: true })
  else if (filters.sort === 'code') query = query.order('code', { ascending: true })
  else query = query.order('created_at', { ascending: false })

  const { data, error } = await query.limit(200)
  if (error) return fail(error.message)
  return { state: 'ok', data: (data as unknown as GeckoWithRelations[]).map(sortPhotos) }
}

export async function featuredGeckos(limit = 6): Promise<Loaded<GeckoWithRelations[]>> {
  const db = publicClient()
  if (!db) return { state: 'unconfigured' }
  const { data, error } = await db
    .from('geckos')
    .select(GECKO_SELECT)
    .in('visibility', ['for_sale', 'both'])
    .in('status', ['available', 'reserved'])
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return fail(error.message)
  return { state: 'ok', data: (data as unknown as GeckoWithRelations[]).map(sortPhotos) }
}

export async function showcaseGeckos(limit = 60): Promise<Loaded<GeckoWithRelations[]>> {
  const db = publicClient()
  if (!db) return { state: 'unconfigured' }
  const { data, error } = await db
    .from('geckos')
    .select(GECKO_SELECT)
    .in('visibility', ['showcase', 'both'])
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return fail(error.message)
  return { state: 'ok', data: (data as unknown as GeckoWithRelations[]).map(sortPhotos) }
}

export type GeckoDetail = GeckoWithRelations & { sire: ParentRef | null; dam: ParentRef | null }

export const getGeckoBySlug = cache(async (slug: string): Promise<Loaded<GeckoDetail | null>> => {
  const db = publicClient()
  if (!db) return { state: 'unconfigured' }
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return { state: 'ok', data: null }
  const { data, error } = await db.from('geckos').select(GECKO_SELECT).eq('slug', slug).maybeSingle()
  if (error) return fail(error.message)
  if (!data) return { state: 'ok', data: null }
  const gecko = sortPhotos(data as unknown as GeckoWithRelations)
  const parentIds = [gecko.sire_id, gecko.dam_id].filter((v): v is string => Boolean(v))
  let parents: ParentRef[] = []
  if (parentIds.length) {
    // RLS only returns parents that are themselves public.
    const res = await db.from('geckos').select('id, name, code, slug, published, archived').in('id', parentIds)
    if (res.error) return fail(res.error.message)
    parents = (res.data ?? []) as ParentRef[]
  }
  return {
    state: 'ok',
    data: {
      ...gecko,
      sire: parents.find((p) => p.id === gecko.sire_id) ?? null,
      dam: parents.find((p) => p.id === gecko.dam_id) ?? null,
    },
  }
})

export async function listPublicGeckoSlugs(): Promise<Array<{ slug: string; updated_at: string }>> {
  const db = publicClient()
  if (!db) return []
  const { data, error } = await db.from('geckos').select('slug, updated_at').limit(1000)
  if (error) {
    console.error('[geckodan:data] slugs', error.message)
    return []
  }
  return data as Array<{ slug: string; updated_at: string }>
}

export const listLines = cache(async (): Promise<Loaded<SignatureLine[]>> => {
  const db = publicClient()
  if (!db) return { state: 'unconfigured' }
  const { data, error } = await db
    .from('signature_lines')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) return fail(error.message)
  return { state: 'ok', data: data as SignatureLine[] }
})

export async function getLine(slug: string): Promise<Loaded<SignatureLine | null>> {
  const lines = await listLines()
  if (lines.state !== 'ok') return lines
  return { state: 'ok', data: lines.data.find((l) => l.slug === slug) ?? null }
}

export async function listAwards(): Promise<Loaded<Award[]>> {
  const db = publicClient()
  if (!db) return { state: 'unconfigured' }
  const { data, error } = await db
    .from('awards')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('award_year', { ascending: false })
  if (error) return fail(error.message)
  return { state: 'ok', data: data as Award[] }
}

export async function listTestimonials(): Promise<Loaded<Testimonial[]>> {
  const db = publicClient()
  if (!db) return { state: 'unconfigured' }
  const { data, error } = await db
    .from('testimonials')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) return fail(error.message)
  return { state: 'ok', data: data as Testimonial[] }
}

export async function listFaqs(category?: Faq['category']): Promise<Loaded<Faq[]>> {
  const db = publicClient()
  if (!db) return { state: 'unconfigured' }
  let query = db.from('faqs').select('*').order('sort_order', { ascending: true })
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) return fail(error.message)
  return { state: 'ok', data: data as Faq[] }
}
