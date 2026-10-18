'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * A horizontal scroll-snap row with previous and next arrows. The arrows only
 * exist while there is something to scroll to, so none are ever inert.
 */
export function Carousel({ children, label }: { children: ReactNode; label: string }) {
  const track = useRef<HTMLUListElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const update = useCallback(() => {
    const el = track.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update])

  const go = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <div className="carousel" role="group" aria-roledescription="carousel" aria-label={label}>
      {canPrev ? (
        <button type="button" className="carousel__btn carousel__btn--prev" onClick={() => go(-1)} aria-label="Previous">
          <svg viewBox="0 0 18 12" aria-hidden="true">
            <path d="M18 6H2M7 1L2 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      ) : null}
      <ul ref={track} className="carousel__track">
        {children}
      </ul>
      {canNext ? (
        <button type="button" className="carousel__btn carousel__btn--next" onClick={() => go(1)} aria-label="Next">
          <svg viewBox="0 0 18 12" aria-hidden="true">
            <path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      ) : null}
    </div>
  )
}
