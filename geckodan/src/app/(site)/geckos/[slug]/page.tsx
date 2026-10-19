import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Gallery } from '@/components/Gallery'
import { GeckoImage } from '@/components/GeckoImage'
import { ErrorNotice, UnconfiguredNotice } from '@/components/Notices'
import { Status } from '@/components/Status'
import { InquiryToggle } from '@/components/inquiry/InquiryToggle'
import { getGeckoBySlug, getSettings } from '@/lib/data/public'
import { siteUrl } from '@/lib/env'
import { SEX_LABEL, STATUS_HINT, VISIBILITY_LABEL } from '@/lib/labels'
import { mediaUrl } from '@/lib/media'
import { excerpt, formatDate, paragraphs } from '@/lib/text'
import { geckoInquiryMessage, similarInquiryMessage, whatsappLink } from '@/lib/whatsapp'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const res = await getGeckoBySlug(slug)
  if (res.state !== 'ok' || !res.data) return { title: 'Gecko not found', robots: { index: false } }
  const g = res.data
  const cover = mediaUrl(g.photos[0]?.storage_path)
  const description =
    g.seo_description ||
    excerpt(g.description, 155) ||
    `${g.name} (ID ${g.code})${g.morph ? `, ${g.morph}` : ''}. Leopard gecko from GeckoDan, Pamulang.`
  return {
    title: g.seo_title || `${g.name} (${g.code})`,
    description,
    alternates: { canonical: `/geckos/${g.slug}` },
    openGraph: {
      title: g.seo_title || g.name,
      description,
      url: `/geckos/${g.slug}`,
      images: cover ? [{ url: cover, alt: g.photos[0]?.alt || g.name }] : undefined,
    },
  }
}

export default async function GeckoPage({ params }: Props) {
  const { slug } = await params
  const [res, settings] = await Promise.all([getGeckoBySlug(slug), getSettings()])
  if (res.state === 'unconfigured')
    return (
      <div className="wrap section">
        <UnconfiguredNotice />
      </div>
    )
  if (res.state === 'error')
    return (
      <div className="wrap section">
        <ErrorNotice />
      </div>
    )
  const g = res.data
  if (!g) notFound()

  const detailUrl = `${siteUrl()}/geckos/${g.slug}`
  const forSale = g.visibility !== 'showcase'
  const message = geckoInquiryMessage({ name: g.name, code: g.code, url: detailUrl })
  const images = g.photos
    .map((p) => ({ src: mediaUrl(p.storage_path), alt: p.alt || `Photo of ${g.name}` }))
    .filter((i): i is { src: string; alt: string } => Boolean(i.src))
  const hatch = formatDate(g.hatch_date)
  const description = paragraphs(g.description)

  return (
    <article className="wrap section" style={{ paddingTop: 'clamp(32px, 5vw, 72px)' }}>
      <p className="small" style={{ marginBottom: 24 }}>
        <Link href={forSale ? '/geckos' : '/showcase'} className="text-link">
          {forSale ? 'Back to the catalogue' : 'Back to the showcase'}
        </Link>
      </p>
      <div className="detail">
        <div>
          {images.length ? (
            <Gallery images={images} name={g.name} />
          ) : (
            <div className="gallery__main">
              <GeckoImage photo={undefined} name={g.name} sizes="60vw" />
            </div>
          )}
          {description.length ? (
            <div className="prose measure" style={{ marginTop: 40 }}>
              {description.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="record" aria-label="Breeder record">
          <h1>{g.name}</h1>
          <p className="record__code">ID {g.code}</p>
          <div style={{ marginTop: 20 }}>
            {forSale ? (
              <>
                <Status status={g.status} />
                <p className="small soft" style={{ marginTop: 6 }}>
                  {STATUS_HINT[g.status]}
                </p>
              </>
            ) : (
              <p className="small soft">A GeckoDan showcase gecko, not for sale.</p>
            )}
          </div>
          <dl>
            {g.morph ? (
              <>
                <dt>Morph</dt>
                <dd>{g.morph}</dd>
              </>
            ) : null}
            {g.line ? (
              <>
                <dt>Line</dt>
                <dd>
                  <Link className="text-link" href={`/lines/${g.line.slug}`}>
                    {g.line.name}
                  </Link>
                </dd>
              </>
            ) : null}
            <dt>Sex</dt>
            <dd>{SEX_LABEL[g.sex]}</dd>
            {hatch ? (
              <>
                <dt>Hatch date</dt>
                <dd>{hatch}</dd>
              </>
            ) : null}
            {g.weight_grams ? (
              <>
                <dt>Weight</dt>
                <dd>{g.weight_grams} g</dd>
              </>
            ) : null}
            {g.sire ? (
              <>
                <dt>Sire</dt>
                <dd>
                  <Link className="text-link" href={`/geckos/${g.sire.slug}`}>
                    {g.sire.name} ({g.sire.code})
                  </Link>
                </dd>
              </>
            ) : null}
            {g.dam ? (
              <>
                <dt>Dam</dt>
                <dd>
                  <Link className="text-link" href={`/geckos/${g.dam.slug}`}>
                    {g.dam.name} ({g.dam.code})
                  </Link>
                </dd>
              </>
            ) : null}
            {g.lineage ? (
              <>
                <dt>Lineage</dt>
                <dd style={{ whiteSpace: 'pre-line' }}>{g.lineage}</dd>
              </>
            ) : null}
            <dt>Listing</dt>
            <dd>{VISIBILITY_LABEL[g.visibility]}</dd>
          </dl>
          <div className="record__actions">
            {forSale && g.status !== 'sold' ? (
              <>
                <a className="btn btn-primary" href={whatsappLink(settings.business.whatsapp_number, message)} target="_blank" rel="noopener noreferrer">
                  Ask on WhatsApp
                </a>
                <InquiryToggle gecko={{ id: g.id, name: g.name, code: g.code, slug: g.slug }} />
              </>
            ) : (
              <a
                className="btn btn-dark"
                href={whatsappLink(
                  settings.business.whatsapp_number,
                  similarInquiryMessage({ name: g.name, code: g.code, url: detailUrl }, forSale ? 'sold' : 'collection'),
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ask about similar geckos
              </a>
            )}
            <p className="small soft">Prices are not shown on this site. A WhatsApp message is not a purchase: GeckoDan will confirm availability.</p>
          </div>
        </aside>
      </div>
    </article>
  )
}
