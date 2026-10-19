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

/** Largest single image the dashboard accepts. The bucket enforces the same limit. */
export const MAX_IMAGE_MB = 25
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024

/**
 * Every object name the app writes: <area>/<id>/<uuid>.<ext> for geckos, lines
 * and awards, and site/<hero|story|og>/<uuid>.<ext> for site-wide pictures.
 */
export const STORED_IMAGE_PATH =
  /^(?:(?:geckos|lines|awards)\/[0-9a-f-]{36}|site\/(?:hero|story|og))\/[0-9a-f-]{36}\.(?:jpg|png|webp|avif)$/
