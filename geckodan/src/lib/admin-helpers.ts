import 'server-only'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { checkImage } from './uploads'

type DbError = { code?: string; message: string; details?: string | null }

/** Turns a database error into a message the owner can act on. */
export function dbMessage(error: DbError): string {
  console.error('[geckodan:admin]', error.code, error.message)
  if (error.code === '23505') {
    if (/code/.test(error.message + (error.details ?? ''))) return 'ID gecko sudah dipakai. Gunakan ID lain.'
    if (/slug/.test(error.message + (error.details ?? ''))) return 'Slug sudah dipakai. Ubah slug atau nama.'
    return 'Data yang sama sudah ada.'
  }
  if (error.code === '23514') {
    if (/awards_publish_requires_evidence/.test(error.message))
      return 'Prestasi hanya bisa dipublikasikan setelah diverifikasi dan diberi bukti (tautan atau gambar).'
    if (/testimonials_publish_requires_permission/.test(error.message))
      return 'Testimoni hanya bisa dipublikasikan setelah ada izin dari pelanggan.'
    return 'Ada isian yang tidak memenuhi aturan data.'
  }
  if (error.code === '42501' || /row-level security/i.test(error.message)) return 'Akses ditolak. Masuk ulang sebagai admin.'
  return 'Gagal menyimpan. Coba lagi.'
}

/** Public pages are cached; refresh all of them after any content change. */
export function revalidateSite() {
  revalidatePath('/', 'layout')
}

/**
 * Uploads one image to the media bucket as the signed-in admin, so Storage
 * policies apply. Returns the stored path or an error message.
 */
export async function uploadImage(
  supabase: SupabaseClient,
  file: File,
  folder: string,
): Promise<{ path: string } | { error: string }> {
  const checked = await checkImage(file)
  if (typeof checked === 'string') return { error: checked }
  const path = `${folder}/${crypto.randomUUID()}.${checked.ext}`
  const { error } = await supabase.storage
    .from('media')
    .upload(path, checked.bytes, { contentType: checked.contentType, cacheControl: '31536000', upsert: false })
  if (error) {
    console.error('[geckodan:admin] upload', error.message)
    return { error: 'Upload gagal. Coba lagi.' }
  }
  return { path }
}

export async function removeImages(supabase: SupabaseClient, paths: Array<string | null | undefined>) {
  const list = paths.filter((p): p is string => Boolean(p))
  if (!list.length) return
  const { error } = await supabase.storage.from('media').remove(list)
  if (error) console.error('[geckodan:admin] remove', error.message)
}
