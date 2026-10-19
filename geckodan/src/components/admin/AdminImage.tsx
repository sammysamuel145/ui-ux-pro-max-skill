import Image from 'next/image'

/**
 * A preview in the dashboard. Originals can be up to 25 MB, so previews go
 * through the image optimizer instead of loading the full file.
 */
export function AdminImage({ src, alt, size = 360 }: { src: string; alt: string; size?: number }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      sizes={`${size}px`}
      style={{ width: '100%', height: 'auto', aspectRatio: '1', objectFit: 'cover' }}
    />
  )
}
