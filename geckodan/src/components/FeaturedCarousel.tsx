'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowIcon } from './Icons'

type Props = {
  label: string
  children: ReactNode
  /** The last slide: an arrow that opens the full catalog. */
  endHref: string
  endLabel: string
}

/**
 * A row of cards that scrolls sideways (swipe, trackpad, or the two buttons).
 * The next card peeks in at the edge, and the very last slide is an arrow to
 * the full catalog. The buttons sit under the row, and each one is disabled at
 * its end, so neither is ever a dead control.
 */
export function FeaturedCarousel({ label, children, endHref, endLabel }: Props) {
  const track = useRef<HTMLUListElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

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
    const first = el.querySelector('li')
    const step = first ? first.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || '0') : el.clientWidth * 0.8
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * step * 2, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <div className="fc" role="group" aria-roledescription="carousel" aria-label={label}>
      <ul ref={track} className="fc__track">
        {children}
        <li className="fc__end">
          <Link href={endHref} aria-label={endLabel}>
            <span className="fc__end-circle" aria-hidden="true">
              <ArrowIcon />
            </span>
            <span className="fc__end-text">{endLabel}</span>
          </Link>
        </li>
      </ul>
      <div className="fc__controls">
        <button type="button" className="fc__btn" onClick={() => go(-1)} disabled={!canPrev} aria-label="Previous geckos">
          <svg viewBox="0 0 18 12" aria-hidden="true">
            <path d="M18 6H2M7 1L2 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
        <button type="button" className="fc__btn" onClick={() => go(1)} disabled={!canNext} aria-label="Next geckos">
          <svg viewBox="0 0 18 12" aria-hidden="true">
            <path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
