'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { errorState, okState, type ActionState } from '@/lib/action-state'
import { requireAdmin } from '@/lib/admin'
import { dbMessage, removeImages, revalidateSite, uploadImage } from '@/lib/admin-helpers'
import { filesFrom } from '@/lib/uploads'
import { firstError, formObject, geckoSchema } from '@/lib/validation'

const uuid = z.string().uuid()
const MAX_FILES_PER_UPLOAD = 8

function assertId(id: unknown): string {
  return uuid.parse(id)
}

export async function saveGecko(id: string | null, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const parsed = geckoSchema.safeParse(formObject(formData))
  if (!parsed.success) return errorState(firstError(parsed.error))
  const gecko = parsed.data

  if (id) {
    assertId(id)
    if (gecko.sire_id === id || gecko.dam_id === id) return errorState('Gecko tidak bisa menjadi induknya sendiri.')
    const { error } = await supabase.from('geckos').update(gecko).eq('id', id)
    if (error) return errorState(dbMessage(error))
    revalidateSite()
    return okState('Perubahan disimpan.')
  }

  const { data, error } = await supabase.from('geckos').insert(gecko).select('id').single()
  if (error) return errorState(dbMessage(error))
  revalidateSite()
  redirect(`/admin/dashboard/geckos/${data.id}?created=1`)
}

export async function setArchived(id: string, archived: boolean): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('geckos').update({ archived }).eq('id', assertId(id))
  if (error) return errorState(dbMessage(error))
  revalidateSite()
  return okState(archived ? 'Gecko diarsipkan dan disembunyikan dari situs.' : 'Gecko dikembalikan dari arsip.')
}

export async function deleteGecko(id: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  assertId(id)
  const { data: photos } = await supabase.from('gecko_photos').select('storage_path').eq('gecko_id', id)
  const { error } = await supabase.from('geckos').delete().eq('id', id)
  if (error) return errorState(dbMessage(error))
  await removeImages(supabase, (photos ?? []).map((p) => p.storage_path as string))
  revalidateSite()
  redirect('/admin/dashboard/geckos?deleted=1')
}

export async function uploadPhotos(geckoId: string, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  assertId(geckoId)
  const files = filesFrom(formData, 'photos')
  if (!files.length) return errorState('Pilih minimal satu foto.')
  if (files.length > MAX_FILES_PER_UPLOAD) return errorState(`Maksimal ${MAX_FILES_PER_UPLOAD} foto sekali upload.`)
  const alt = String(formData.get('alt') ?? '').trim().slice(0, 300)

  const { data: gecko } = await supabase.from('geckos').select('name').eq('id', geckoId).maybeSingle()
  if (!gecko) return errorState('Gecko tidak ditemukan.')
  const { data: existing } = await supabase.from('gecko_photos').select('sort_order, is_cover').eq('gecko_id', geckoId)
  let nextOrder = Math.max(0, ...(existing ?? []).map((p) => (p.sort_order as number) + 1))
  let needsCover = !(existing ?? []).some((p) => p.is_cover)

  const problems: string[] = []
  let saved = 0
  for (const file of files) {
    const result = await uploadImage(supabase, file, `geckos/${geckoId}`)
    if ('error' in result) {
      problems.push(result.error)
      continue
    }
    const { error } = await supabase.from('gecko_photos').insert({
      gecko_id: geckoId,
      storage_path: result.path,
      alt: alt || `Foto ${gecko.name}`,
      sort_order: nextOrder++,
      is_cover: needsCover,
    })
    if (error) {
      await removeImages(supabase, [result.path])
      problems.push(dbMessage(error))
      continue
    }
    needsCover = false
    saved++
  }
  revalidateSite()
  if (problems.length) return errorState(`${saved} foto tersimpan. ${problems.join(' ')}`)
  return okState(`${saved} foto tersimpan.`)
}

export async function updatePhoto(photoId: string, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const parsed = z
    .object({
      alt: z.string().trim().max(300, 'Teks alternatif maksimal 300 karakter'),
      sort_order: z.coerce.number().int().min(0).max(9999),
    })
    .safeParse(formObject(formData))
  if (!parsed.success) return errorState(firstError(parsed.error))
  const { error } = await supabase.from('gecko_photos').update(parsed.data).eq('id', assertId(photoId))
  if (error) return errorState(dbMessage(error))
  revalidateSite()
  return okState('Foto diperbarui.')
}

export async function setCoverPhoto(geckoId: string, photoId: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  assertId(geckoId)
  assertId(photoId)
  // Clear the old cover first: the database allows only one cover per gecko.
  const clear = await supabase.from('gecko_photos').update({ is_cover: false }).eq('gecko_id', geckoId).eq('is_cover', true)
  if (clear.error) return errorState(dbMessage(clear.error))
  const { error } = await supabase.from('gecko_photos').update({ is_cover: true }).eq('id', photoId).eq('gecko_id', geckoId)
  if (error) return errorState(dbMessage(error))
  revalidateSite()
  return okState('Foto sampul diganti.')
}

export async function deletePhoto(photoId: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { data: photo, error: readError } = await supabase
    .from('gecko_photos')
    .select('storage_path')
    .eq('id', assertId(photoId))
    .maybeSingle()
  if (readError) return errorState(dbMessage(readError))
  if (!photo) return errorState('Foto tidak ditemukan.')
  const { error } = await supabase.from('gecko_photos').delete().eq('id', photoId)
  if (error) return errorState(dbMessage(error))
  await removeImages(supabase, [photo.storage_path as string])
  revalidateSite()
  return okState('Foto dihapus.')
}
