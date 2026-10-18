import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { GeckoCard } from '@/components/GeckoCard'
import { ErrorNotice, PendingContent, UnconfiguredNotice } from '@/components/Notices'
import { PageHead } from '@/components/PageHead'
import { getLine, listGeckos } from '@/lib/data/public'
import { parseCatalogFilters } from '@/lib/catalog'
import { mediaUrl } from '@/lib/media'
import { excerpt, paragraphs } from '@/lib/text'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return [{ slug: 'mantra' }, { slug: 'kafka' }, { slug: 'valkrie' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const res = await getLine(slug)
  const line = res.state === 'ok' ? res.data : null
  const name = line?.name ?? slug.toUpperCase()
  return {
    title: line?.seo_title || `Line ${name}`,
    description:
      line?.seo_description ||
      excerpt(line?.description, 155) ||
      `${name}, salah satu signature line leopard gecko GeckoDan di Pamulang, Tangerang Selatan.`,
    alternates: { canonical: `/lines/${slug}` },
  }
}

export default async function LinePage({ params }: Props) {
  const { slug } = await params
  const res = await getLine(slug)
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
  const line = res.data
  if (!line) notFound()

  const cover = mediaUrl(line.cover_photo_path)
  const body = paragraphs(line.description)
  const filters = { ...parseCatalogFilters({}), line: line.slug, status: 'all' as const }
  const [forSale, showcase] = await Promise.all([listGeckos('for_sale', filters), listGeckos('showcase', filters)])
  const geckos = [
    ...(forSale.state === 'ok' ? forSale.data : []),
    ...(showcase.state === 'ok' ? showcase.data.filter((s) => s.visibility === 'showcase') : []),
  ]

  return (
    <>
      <PageHead title={line.name} tagline={line.tagline ?? 'Signature line GeckoDan'} />
      <section className="wrap" style={{ display: 'grid', gap: 48, paddingBottom: 'var(--section)' }}>
        {cover ? (
          <div style={{ position: 'relative', aspectRatio: '16 / 9', background: 'var(--paper-3)' }}>
            <Image src={cover} alt={line.cover_photo_alt || `Line ${line.name}`} fill sizes="100vw" style={{ objectFit: 'cover' }} />
          </div>
        ) : null}
        <div className="prose measure">
          {body.length ? (
            body.map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <PendingContent>Cerita dan karakter line {line.name} sedang ditulis oleh GeckoDan.</PendingContent>
          )}
        </div>
        <div>
          <h2 className="headline" style={{ textTransform: 'uppercase' }}>
            Gecko {line.name}
          </h2>
          <div style={{ marginTop: 32 }}>
            {geckos.length ? (
              <div className="gecko-grid">
                {geckos.map((g) => (
                  <GeckoCard key={g.id} gecko={g} />
                ))}
              </div>
            ) : (
              <PendingContent>Belum ada gecko line {line.name} yang dipublikasikan.</PendingContent>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
