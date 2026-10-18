import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from './media'

export type CheckedImage = { ext: string; contentType: string; bytes: Uint8Array }

/**
 * Detects the real image format from the file's first bytes. The browser's
 * declared type is not trusted on its own.
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

/** Validates one uploaded file. Returns an error message or the checked image. */
export async function checkImage(file: File): Promise<CheckedImage | string> {
  if (file.size === 0) return 'File kosong.'
  if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" lebih dari ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`
  const bytes = new Uint8Array(await file.arrayBuffer())
  const contentType = sniffImageType(bytes)
  const ext = contentType ? ALLOWED_IMAGE_TYPES[contentType] : undefined
  if (!contentType || !ext) return `"${file.name}" bukan gambar JPG, PNG, WebP, atau AVIF.`
  return { ext, contentType, bytes }
}

/** Non-empty files from a multi-file input. */
export function filesFrom(formData: FormData, name: string): File[] {
  return formData.getAll(name).filter((v): v is File => typeof v === 'object' && v !== null && 'size' in v && v.size > 0)
}
