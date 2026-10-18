import type { ReactNode } from 'react'

export function PageHead({ title, tagline, children }: { title: string; tagline?: string; children?: ReactNode }) {
  return (
    <header className="wrap page-head reveal">
      <h1 className="headline">{title}</h1>
      {tagline ? <p className="tagline">{tagline}</p> : null}
      {children}
    </header>
  )
}
