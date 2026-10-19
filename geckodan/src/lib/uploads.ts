import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGE_MB, STORED_IMAGE_PATH } from './media'

export type CheckedImage = { ext: string; contentType: string }

/**
 * Detects the real image format from a file's first bytes. A declared type or
 * file extension is never trusted on its own.
 */
export function sniffImageType(bytes: Uint8Array): string | null {
  const b = bytes
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  )
    return 'image/png'
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (b.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  if (b.length >= 12 && ascii(4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(8, 12))) return 'image/avif'
  return null
}

/**
 * Quick check in the browser, before anything is uploaded: size and the real
 * format from the first bytes. The server checks again after the upload.
 */
export async function checkImageFile(file: File): Promise<CheckedImage | string> {
  if (file.size === 0) return `"${file.name}" kosong.`
  if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" lebih dari ${MAX_IMAGE_MB} MB.`
  const head = new Uint8Array(await file.slice(0, 32).arrayBuffer())
  const contentType = sniffImageType(head)
  const ext = contentType ? ALLOWED_IMAGE_TYPES[contentType] : undefined
  if (!contentType || !ext) return `"${file.name}" bukan gambar JPG, PNG, WebP, atau AVIF.`
  return { ext, contentType }
}

/**
 * The server's check of a file the browser has already stored: the object name
 * must be one the app writes, sit in the expected folder, be small enough, and
 * really be the image type its name says. Returns a message, or null when fine.
 */
export function validateStoredImage(input: {
  path: string
  expectedPrefix: string
  head: Uint8Array
  totalBytes: number | null
}): string | null {
  const { path, expectedPrefix, head, totalBytes } = input
  if (!STORED_IMAGE_PATH.test(path) || !path.startsWith(expectedPrefix)) return 'Nama file tidak valid.'
  if (totalBytes === null || !Number.isFinite(totalBytes)) return 'Ukuran file tidak bisa dipastikan.'
  if (totalBytes === 0) return 'File kosong.'
  if (totalBytes > MAX_IMAGE_BYTES) return `File lebih dari ${MAX_IMAGE_MB} MB.`
  const type = sniffImageType(head)
  const ext = type ? ALLOWED_IMAGE_TYPES[type] : undefined
  if (!ext) return 'Isi file bukan gambar JPG, PNG, WebP, atau AVIF.'
  if (!path.endsWith(`.${ext}`)) return 'Jenis file tidak cocok dengan nama file.'
  return null
}
