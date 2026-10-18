'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowIcon } from './Icons'

export type LineEntry = {
  slug: string
  name: string
  tagline: string | null
  coverSrc: string | null
  coverAlt: string
}

// One accent per line, all from the existing palette: gecko orange, gold, and a leaf green.
const ACCENTS = ['#f07a00', '#c99d3e', '#8cc79a']

/**
 * The three signature lines as a typographic index. Each name is a link to its
 * own page; hovering or focusing one swaps the picture beside the list. With no
 * JavaScript the first line's picture simply stays in place.
 */
export function LineIndex({ lines }: { lines: LineEntry[] }) {
  const [active, setActive] = useState(0)
  const current = lines[active] ?? lines[0]
  if (!current) return null

  return (
    <div className="line-index">
      <ul className="line-index__list">
        {lines.map((line, i) => (
          <li
            key={line.slug}
            className="line-index__row"
            data-active={i === active}
            style={{ ['--accent' as string]: ACCENTS[i % ACCENTS.length] }}
            onMouseEnter={() => setActive(i)}
          >
            <Link href={`/lines/${line.slug}`} onFocus={() => setActive(i)} className="line-index__link">
              <span className="line-index__name">{line.name}</span>
              <span className="line-index__meta">
                {line.tagline ? <span>{line.tagline}</span> : null}
                <span className="line-index__go">
                  View line <ArrowIcon />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="line-index__panel" aria-hidden="true">
        {lines.map((line, i) => (
          <div key={line.slug} className="line-index__pic" data-active={i === active}>
            {line.coverSrc ? (
              <Image src={line.coverSrc} alt="" fill sizes="(max-width: 900px) 0px, 36vw" style={{ objectFit: 'cover' }} />
            ) : (
              <span className="line-index__mark" style={{ ['--accent' as string]: ACCENTS[i % ACCENTS.length] }}>
                <Image src="/brand/geckodan-logo-256.png" alt="" width={96} height={91} />
                <small>{line.name}</small>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
