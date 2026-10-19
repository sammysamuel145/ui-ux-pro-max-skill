import 'server-only'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { mediaUrl, STORED_IMAGE_PATH } from './media'
import { validateStoredImage } from './uploads'

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
 * Checks an image the admin's browser has just stored in the media bucket. It
 * reads only the first bytes (a Range request) to learn the real format, and
 * takes the size from the response, so a 25 MB photo is never downloaded to
 * the server. A file that fails is removed from the bucket. Returns a message
 * when the file is not acceptable, or null when it is fine.
 */
export async function verifyStoredImage(
  supabase: SupabaseClient,
  path: string,
  expectedPrefix: string,
): Promise<string | null> {
  const fail = async (message: string) => {
    if (STORED_IMAGE_PATH.test(path) && path.startsWith(expectedPrefix)) await removeImages(supabase, [path])
    return message
  }
  if (!STORED_IMAGE_PATH.test(path) || !path.startsWith(expectedPrefix)) return 'Nama file tidak valid.'
  const url = mediaUrl(path)
  if (!url) return 'Penyimpanan belum dikonfigurasi.'

  let res: Response
  try {
    res = await fetch(url, { headers: { Range: 'bytes=0-63' }, cache: 'no-store' })
  } catch (error) {
    console.error('[geckodan:admin] verify fetch', error)
    return 'File tidak bisa diperiksa. Coba lagi.'
  }
  if (res.status !== 200 && res.status !== 206) return fail('File tidak ditemukan di penyimpanan.')

  // A server that ignores Range answers 200 with the whole body: read only the start of it.
  const reader = res.body?.getReader()
  const chunks: Uint8Array[] = []
  let got = 0
  while (reader && got < 64) {
    const { done, value } = await reader.read()
    if (done || !value) break
    chunks.push(value)
    got += value.length
  }
  // Not awaited: inside Next's patched fetch a cancel can wait on the rest of the body.
  reader?.cancel().catch(() => undefined)
  const head = new Uint8Array(Math.min(got, 64))
  let offset = 0
  for (const chunk of chunks) {
    const take = Math.min(chunk.length, head.length - offset)
    head.set(chunk.subarray(0, take), offset)
    offset += take
    if (offset >= head.length) break
  }

  const range = res.headers.get('content-range')
  const total = range?.includes('/') ? Number(range.split('/')[1]) : Number(res.headers.get('content-length'))
  const problem = validateStoredImage({ path, expectedPrefix, head, totalBytes: Number.isFinite(total) ? total : null })
  return problem ? fail(problem) : null
}

export async function removeImages(supabase: SupabaseClient, paths: Array<string | null | undefined>) {
  const list = paths.filter((p): p is string => Boolean(p))
  if (!list.length) return
  const { error } = await supabase.storage.from('media').remove(list)
  if (error) console.error('[geckodan:admin] remove', error.message)
}
