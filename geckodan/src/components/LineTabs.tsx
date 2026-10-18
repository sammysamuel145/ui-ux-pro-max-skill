'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useId, useState, type KeyboardEvent } from 'react'

export type LineTab = {
  slug: string
  name: string
  summary: string | null
  coverSrc: string | null
  coverAlt: string
}

/**
 * Tabs for the three signature lines. Without JavaScript every panel renders
 * in turn; with it, one panel shows at a time.
 */
export function LineTabs({ lines }: { lines: LineTab[] }) {
  const [active, setActive] = useState(0)
  const base = useId()
  const line = lines[active]
  if (!line) return null

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = (active + (e.key === 'ArrowRight' ? 1 : -1) + lines.length) % lines.length
    setActive(next)
    document.getElementById(`${base}-tab-${next}`)?.focus()
  }

  return (
    <div className="lines-split">
      <div className="lines-split__plate">
        <div className="plate-art">
          {line.coverSrc ? (
            <Image src={line.coverSrc} alt={line.coverAlt} fill sizes="(max-width: 860px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
          ) : (
            <>
              <span className="line-mark-ring" aria-hidden="true" />
              <span className="line-mark" aria-hidden="true">
                {line.name}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="lines-split__copy">
        <div className="line-tabs" role="tablist" aria-label="Signature lines" onKeyDown={onKey}>
          {lines.map((l, i) => (
            <button
              key={l.slug}
              id={`${base}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls={`${base}-panel`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
            >
              {l.name}
            </button>
          ))}
        </div>
        <div className="line-panel" id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`}>
          <h3>{line.name}</h3>
          {line.summary ? (
            <p>{line.summary}</p>
          ) : (
            <p>
              <span className="placeholder-tag">Content coming soon</span>{' '}
              <span className="soft">The story of the {line.name} line is being prepared by GeckoDan.</span>
            </p>
          )}
        </div>
        <div className="line-panel__actions">
          <Link className="btn btn-dark" href={`/lines/${line.slug}`}>
            View the {line.name} line
          </Link>
          <Link className="btn btn-quiet" href={`/geckos?line=${line.slug}`}>
            {line.name} geckos
          </Link>
        </div>
      </div>
    </div>
  )
}
