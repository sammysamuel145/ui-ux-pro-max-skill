'use client'

import Image from 'next/image'
import { useState, type KeyboardEvent } from 'react'

export type GalleryImage = { src: string; alt: string }

export function Gallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [index, setIndex] = useState(0)
  const count = images.length
  const current = images[index]
  if (!current) return null
  const go = (next: number) => setIndex((next + count) % count)
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(index + 1)
    if (e.key === 'ArrowLeft') go(index - 1)
  }

  return (
    <section aria-roledescription="galeri" aria-label={`Foto ${name}`} onKeyDown={onKey}>
      <div className="gallery__main">
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          sizes="(max-width: 900px) 100vw, 60vw"
          preload={index === 0}
          style={{ objectFit: 'cover' }}
        />
        {count > 1 ? (
          <div className="gallery__nav">
            <button type="button" onClick={() => go(index - 1)} aria-label="Foto sebelumnya">
              <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
                <path d="M18 6H2M7 1L2 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Foto berikutnya">
              <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
                <path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
      {count > 1 ? (
        <>
          <p className="sr-only" aria-live="polite">
            Foto {index + 1} dari {count}
          </p>
          <div className="gallery__thumbs">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                aria-current={i === index}
                aria-label={`Lihat foto ${i + 1} dari ${count}`}
                onClick={() => setIndex(i)}
              >
                <Image src={img.src} alt="" width={84} height={84} />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
