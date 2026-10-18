import Link from 'next/link'
import { SEX_LABEL } from '@/lib/labels'
import type { GeckoWithRelations } from '@/lib/types'
import { GeckoImage } from './GeckoImage'
import { Status } from './Status'
import { InquiryToggle } from './inquiry/InquiryToggle'

export function GeckoCard({ gecko, showStatus = true }: { gecko: GeckoWithRelations; showStatus?: boolean }) {
  const href = `/geckos/${gecko.slug}`
  const forSale = gecko.visibility !== 'showcase'
  return (
    <article className="gecko-card">
      <Link href={href} className="gecko-card__media" tabIndex={-1} aria-hidden="true">
        <GeckoImage photo={gecko.photos[0]} name={gecko.name} sizes="(max-width: 700px) 100vw, (max-width: 1200px) 50vw, 33vw" />
      </Link>
      <div>
        <h2 className="gecko-card__name">
          <Link href={href}>{gecko.name}</Link>
        </h2>
        <p className="gecko-card__meta">
          <span>ID {gecko.code}</span>
          {gecko.morph ? <span>{gecko.morph}</span> : null}
          {gecko.line ? <span>Line {gecko.line.name}</span> : null}
          {gecko.sex !== 'unknown' ? <span>{SEX_LABEL[gecko.sex]}</span> : null}
        </p>
      </div>
      <div className="gecko-card__actions">
        {showStatus && forSale ? <Status status={gecko.status} /> : <span className="small soft">Koleksi</span>}
        {forSale && gecko.status !== 'sold' ? (
          <InquiryToggle gecko={{ id: gecko.id, name: gecko.name, code: gecko.code, slug: gecko.slug }} />
        ) : null}
      </div>
    </article>
  )
}
