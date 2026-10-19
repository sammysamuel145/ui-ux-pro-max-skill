'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowIcon } from './Icons'

export type LineEntry = {
  slug: string
  name: string
  tagline: string | null
  /** Short story written by the owner, or null while it has not been written. */
  summary: string | null
  coverSrc: string | null
  coverAlt: string
}

// One accent per line, all from the existing palette: gecko orange, gold, and a leaf green.
const ACCENTS = ['#f07a00', '#c99d3e', '#8cc79a']

/**
 * The three signature lines as a typographic index with a full preview.
 *
 * Each name is a tab. A mouse hover, a keyboard focus (Tab or the arrow keys),
 * or a tap selects it, and the preview beside the list (below it on small
 * screens) shows that line's name, photograph, story and a link to its page.
 * All previews sit in one grid cell, so swapping them never changes the
 * layout, and the hidden ones are inert so they cannot take focus.
 */
export function LineIndex({ lines }: { lines: LineEntry[] }) {
  const [active, setActive] = useState(0)
  const base = useId()
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  if (!lines.length) return null

  const select = (i: number, focus = false) => {
    setActive(i)
    if (focus) tabs.current[i]?.focus()
  }

  const onKey = (e: KeyboardEvent, i: number) => {
    const last = lines.length - 1
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      select(i === last ? 0 : i + 1, true)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      select(i === 0 ? last : i - 1, true)
    } else if (e.key === 'Home') {
      e.preventDefault()
      select(0, true)
    } else if (e.key === 'End') {
      e.preventDefault()
      select(last, true)
    }
  }

  return (
    <div className="line-index">
      <div className="line-index__list" role="tablist" aria-label="Signature lines" aria-orientation="vertical">
        {lines.map((line, i) => (
          <div
            key={line.slug}
            className="line-index__row"
            data-active={i === active}
            style={{ ['--accent' as string]: ACCENTS[i % ACCENTS.length] }}
          >
            <button
              ref={(el) => {
                tabs.current[i] = el
              }}
              id={`${base}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls={`${base}-panel-${i}`}
              tabIndex={i === active ? 0 : -1}
              className="line-index__name"
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') setActive(i)
              }}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              {line.name}
            </button>
            {line.tagline ? <p className="line-index__tagline">{line.tagline}</p> : null}
          </div>
        ))}
      </div>

      <div className="line-index__panel">
        {lines.map((line, i) => {
          const on = i === active
          const accent = ACCENTS[i % ACCENTS.length]
          return (
            <div
              key={line.slug}
              id={`${base}-panel-${i}`}
              role="tabpanel"
              aria-labelledby={`${base}-tab-${i}`}
              className="line-preview"
              data-active={on}
              inert={!on}
              style={{ ['--accent' as string]: accent }}
            >
              <div className="line-preview__pic">
                {line.coverSrc ? (
                  <Image src={line.coverSrc} alt={line.coverAlt} fill sizes="(max-width: 900px) 92vw, 36vw" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="line-preview__mark" role="img" aria-label={`${line.name} line: photo coming soon`}>
                    <Image src="/brand/geckodan-logo-256.png" alt="" width={96} height={91} />
                    <small>Photo coming soon</small>
                  </div>
                )}
              </div>
              <div className="line-preview__body">
                <h3>{line.name}</h3>
                {line.summary ? (
                  <p>{line.summary}</p>
                ) : (
                  <p>
                    <span className="placeholder-tag">Story coming soon</span> The story of the {line.name} line will be added by the owner.
                  </p>
                )}
                <Link href={`/lines/${line.slug}`} className="text-arrow">
                  View the {line.name} line <ArrowIcon />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
