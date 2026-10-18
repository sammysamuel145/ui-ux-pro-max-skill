'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { errorState, okState, type ActionState } from '@/lib/action-state'
import { requireAdmin } from '@/lib/admin'
import { dbMessage, removeImages, revalidateSite, uploadImage } from '@/lib/admin-helpers'
import { filesFrom } from '@/lib/uploads'
import {
  awardSchema,
  businessSchema,
  faqSchema,
  firstError,
  formObject,
  heroSchema,
  lineSchema,
  seoSchema,
  shippingSchema,
  socialsSchema,
  storySchema,
  testimonialSchema,
} from '@/lib/validation'

const uuid = z.string().uuid()

// ---------------------------------------------------------------- lines

export async function saveLine(id: string, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const parsed = lineSchema.safeParse(formObject(formData))
  if (!parsed.success) return errorState(firstError(parsed.error))
  const { error } = await supabase.from('signature_lines').update(parsed.data).eq('id', uuid.parse(id))
  if (error) return errorState(dbMessage(error))
  revalidateSite()
  return okState('Line disimpan.')
}

export async function uploadLineCover(id: string, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  uuid.parse(id)
  const [file] = filesFrom(formData, 'cover')
  if (!file) return errorState('Pilih satu foto.')
  const { data: line } = await supabase.from('signature_lines').select('cover_photo_path, name').eq('id', id).maybeSingle()
  if (!line) return errorState('Line tidak ditemukan.')
  const result = await uploadImage(supabase, file, `lines/${id}`)
  if ('error' in result) return errorState(result.error)
  const alt = String(formData.get('alt') ?? '').trim().slice(0, 300)
  const { error } = await supabase
    .from('signature_lines')
    .update({ cover_photo_path: result.path, ...(alt ? { cover_photo_alt: alt } : {}) })
    .eq('id', id)
  if (error) {
    await removeImages(supabase, [result.path])
    return errorState(dbMessage(error))
  }
  await removeImages(supabase, [line.cover_photo_path as string | null])
  revalidateSite()
  return okState('Foto sampul line diganti.')
}

export async function removeLineCover(id: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  uuid.parse(id)
  const { data: line } = await supabase.from('signature_lines').select('cover_photo_path').eq('id', id).maybeSingle()
  const { error } = await supabase.from('signature_lines').update({ cover_photo_path: null }).eq('id', id)
  if (error) return errorState(dbMessage(error))
  await removeImages(supabase, [line?.cover_photo_path as string | null])
  revalidateSite()
  return okState('Foto sampul dihapus.')
}

// ---------------------------------------------------------------- awards

export async function saveAward(id: string | null, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const parsed = awardSchema.safeParse(formObject(formData))
  if (!parsed.success) return errorState(firstError(parsed.error))
  const award = parsed.data

  if (id) {
    uuid.parse(id)
    const { data: current } = await supabase.from('awards').select('evidence_path').eq('id', id).maybeSingle()
    if (award.published && !(award.verified && (award.evidence_url || current?.evidence_path)))
      return errorState('Prestasi hanya bisa dipublikasikan setelah diverifikasi dan diberi bukti (tautan atau gambar).')
    const { error } = await supabase.from('awards').update(award).eq('id', id)
    if (error) return errorState(dbMessage(error))
    revalidateSite()
    return okState('Prestasi disimpan.')
  }

  if (award.published && !(award.verified && award.evidence_url))
    return errorState('Simpan dulu sebagai draft, unggah bukti, lalu publikasikan setelah diverifikasi.')
  const { data, error } = await supabase.from('awards').insert(award).select('id').single()
  if (error) return errorState(dbMessage(error))
  revalidateSite()
  redirect(`/admin/dashboard/awards/${data.id}?created=1`)
}

export async function uploadAwardEvidence(id: string, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  uuid.parse(id)
  const [file] = filesFrom(formData, 'evidence')
  if (!file) return errorState('Pilih satu gambar bukti.')
  const { data: award } = await supabase.from('awards').select('evidence_path').eq('id', id).maybeSingle()
  if (!award) return errorState('Prestasi tidak ditemukan.')
  const result = await uploadImage(supabase, file, `awards/${id}`)
  if ('error' in result) return errorState(result.error)
  const { error } = await supabase.from('awards').update({ evidence_path: result.path }).eq('id', id)
  if (error) {
    await removeImages(supabase, [result.path])
    return errorState(dbMessage(error))
  }
  await removeImages(supabase, [award.evidence_path as string | null])
  revalidateSite()
  return okState('Bukti diunggah.')
}

export async function deleteAward(id: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  uuid.parse(id)
  const { data: award } = await supabase.from('awards').select('evidence_path').eq('id', id).maybeSingle()
  const { error } = await supabase.from('awards').delete().eq('id', id)
  if (error) return errorState(dbMessage(error))
  await removeImages(supabase, [award?.evidence_path as string | null])
  revalidateSite()
  redirect('/admin/dashboard/awards?deleted=1')
}

// ---------------------------------------------------------------- testimonials

export async function saveTestimonial(id: string | null, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const parsed = testimonialSchema.safeParse(formObject(formData))
  if (!parsed.success) return errorState(firstError(parsed.error))
  if (parsed.data.published && !parsed.data.permission_granted)
    return errorState('Testimoni hanya bisa dipublikasikan setelah ada izin dari pelanggan.')
  if (id) {
    const { error } = await supabase.from('testimonials').update(parsed.data).eq('id', uuid.parse(id))
    if (error) return errorState(dbMessage(error))
    revalidateSite()
    return okState('Testimoni disimpan.')
  }
  const { error } = await supabase.from('testimonials').insert(parsed.data)
  if (error) return errorState(dbMessage(error))
  revalidateSite()
  return okState('Testimoni ditambahkan.')
}

export async function deleteTestimonial(id: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('testimonials').delete().eq('id', uuid.parse(id))
  if (error) return errorState(dbMessage(error))
  revalidateSite()
  return okState('Testimoni dihapus.')
}

// ---------------------------------------------------------------- FAQs

export async function saveFaq(id: string | null, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const parsed = faqSchema.safeParse(formObject(formData))
  if (!parsed.success) return errorState(firstError(parsed.error))
  if (id) {
    const { error } = await supabase.from('faqs').update(parsed.data).eq('id', uuid.parse(id))
    if (error) return errorState(dbMessage(error))
    revalidateSite()
    return okState('FAQ disimpan.')
  }
  const { error } = await supabase.from('faqs').insert(parsed.data)
  if (error) return errorState(dbMessage(error))
  revalidateSite()
  return okState('FAQ ditambahkan.')
}

export async function deleteFaq(id: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('faqs').delete().eq('id', uuid.parse(id))
  if (error) return errorState(dbMessage(error))
  revalidateSite()
  return okState('FAQ dihapus.')
}

// ---------------------------------------------------------------- settings

const SETTING_SCHEMAS = {
  business: businessSchema,
  socials: socialsSchema,
  hero: heroSchema,
  story: storySchema,
  shipping: shippingSchema,
  seo: seoSchema,
} as const

export type SettingKey = keyof typeof SETTING_SCHEMAS

async function mergeSetting(
  supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'],
  key: SettingKey,
  patch: Record<string, unknown>,
): Promise<ActionState> {
  const { data: current, error: readError } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle()
  if (readError) return errorState(dbMessage(readError))
  const value = { ...((current?.value as Record<string, unknown> | undefined) ?? {}), ...patch }
  const { error } = await supabase.from('site_settings').upsert({ key, value, is_public: true })
  if (error) return errorState(dbMessage(error))
  revalidateSite()
  return okState('Pengaturan disimpan.')
}

export async function saveSetting(key: SettingKey, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  if (!Object.hasOwn(SETTING_SCHEMAS, key)) return errorState('Pengaturan tidak dikenal.')
  const schema = SETTING_SCHEMAS[key]
  const parsed = schema.safeParse(formObject(formData))
  if (!parsed.success) return errorState(firstError(parsed.error))
  return mergeSetting(supabase, key, parsed.data as Record<string, unknown>)
}

export async function uploadHeroImage(formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const [file] = filesFrom(formData, 'hero')
  if (!file) return errorState('Pilih satu gambar.')
  const { data: current } = await supabase.from('site_settings').select('value').eq('key', 'hero').maybeSingle()
  const oldPath = (current?.value as { image_path?: string } | undefined)?.image_path
  const result = await uploadImage(supabase, file, 'site/hero')
  if ('error' in result) return errorState(result.error)
  const alt = String(formData.get('alt') ?? '').trim().slice(0, 300)
  // A newly uploaded hero is the owner's own photo, not the concept illustration.
  const state = await mergeSetting(supabase, 'hero', { image_path: result.path, image_is_concept: false, ...(alt ? { image_alt: alt } : {}) })
  if (!state?.ok) {
    await removeImages(supabase, [result.path])
    return state
  }
  if (oldPath) await removeImages(supabase, [oldPath])
  return okState('Gambar hero diganti.')
}

export async function removeHeroImage(): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { data: current } = await supabase.from('site_settings').select('value').eq('key', 'hero').maybeSingle()
  const oldPath = (current?.value as { image_path?: string } | undefined)?.image_path
  const state = await mergeSetting(supabase, 'hero', { image_path: '', image_is_concept: true })
  if (state?.ok && oldPath) await removeImages(supabase, [oldPath])
  return state?.ok ? okState('Hero kembali memakai ilustrasi konsep.') : state
}
