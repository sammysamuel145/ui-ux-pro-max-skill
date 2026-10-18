import { supabaseConfig } from './env'

/** Public URL of an object in the media bucket, or null when unavailable. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const config = supabaseConfig()
  if (!config) return null
  const safe = path.split('/').map(encodeURIComponent).join('/')
  return `${config.url}/storage/v1/object/public/media/${safe}`
}

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
