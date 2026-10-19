import Image from 'next/image'
import { mediaUrl } from '@/lib/media'
import type { GeckoPhoto } from '@/lib/types'

type Props = {
  photo: GeckoPhoto | undefined
  name: string
  sizes: string
  preload?: boolean
}

/**
 * The gecko's own photograph, or a clearly labelled plate when none exists yet.
 * Never a stock or generated animal.
 */
export function GeckoImage({ photo, name, sizes, preload }: Props) {
  const src = mediaUrl(photo?.storage_path)
  if (!photo || !src) {
    return (
      <div className="plate" role="img" aria-label={`Photo of ${name} not yet available`}>
        <img src="/brand/geckodan-logo-256.png" alt="" width={256} height={242} />
        <strong>{name}</strong>
        <span className="small">Photo coming soon</span>
      </div>
    )
  }
  return (
    <Image
      src={src}
      alt={photo.alt || `Photo of ${name}`}
      fill
      sizes={sizes}
      preload={preload}
      style={{ objectFit: 'cover' }}
    />
  )
}
