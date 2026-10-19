import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowIcon } from './Icons'

type Action = { label: string; href: string; external?: boolean }

/**
 * The header of an inner page, shown as a rounded highlight card: a large
 * title and tagline, with an optional pill button at the top right.
 */
export function PageHead({
  title,
  tagline,
  action,
  children,
}: {
  title: string
  tagline?: string
  action?: Action
  children?: ReactNode
}) {
  return (
    <header className="wrap page-head reveal">
      <div className="page-head__card">
        <div className="page-head__text">
          <h1 className="headline">{title}</h1>
          {tagline ? <p className="tagline">{tagline}</p> : null}
          {children}
        </div>
        {action ? (
          action.external ? (
            <a className="pill page-head__action" href={action.href} target="_blank" rel="noopener noreferrer">
              {action.label}
            </a>
          ) : (
            <Link className="pill page-head__action" href={action.href}>
              {action.label} <ArrowIcon />
            </Link>
          )
        ) : null}
      </div>
    </header>
  )
}
