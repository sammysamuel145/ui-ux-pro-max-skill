import type { Metadata } from 'next'
import Link from 'next/link'
import { GeckoCard } from '@/components/GeckoCard'
import { EmptyNotice, ErrorNotice, UnconfiguredNotice } from '@/components/Notices'
import { PageHead } from '@/components/PageHead'
import { hasActiveFilters, parseCatalogFilters } from '@/lib/catalog'
import { getSettings, listGeckos, listLines } from '@/lib/data/public'
import { generalInquiryMessage, whatsappLink } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Geckos',
  description: 'The GeckoDan leopard gecko catalogue. Search by name or ID, filter by line and status, then inquire on WhatsApp.',
  alternates: { canonical: '/geckos' },
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function GeckosPage({ searchParams }: Props) {
  const filters = parseCatalogFilters(await searchParams)
  const [result, lines, settings] = await Promise.all([listGeckos('for_sale', filters), listLines(), getSettings()])
  const lineOptions = lines.state === 'ok' ? lines.data : []
  const active = hasActiveFilters(filters)

  return (
    <>
      <PageHead
        title="Our Geckos"
        tagline="A Legacy in Every Line."
        action={{ label: 'Ask about stock', href: whatsappLink(settings.business.whatsapp_number, generalInquiryMessage()), external: true }}
      >
        <p className="lead">Geckos available for purchase. Prices are not shown: ask directly on WhatsApp.</p>
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 'var(--section)' }} aria-label="Catalogue">
        <form className="filters" method="get" action="/geckos" role="search">
          <div className="field field-search">
            <label htmlFor="q">Search name, ID or morph</label>
            <input id="q" name="q" type="search" defaultValue={filters.q} maxLength={60} placeholder="e.g. GD-0007" />
          </div>
          <div className="field">
            <label htmlFor="line">Line</label>
            <select id="line" name="line" defaultValue={filters.line}>
              <option value="">All lines</option>
              {lineOptions.map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={filters.status}>
              <option value="open">Available and reserved</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
              <option value="all">All statuses</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sex">Sex</label>
            <select id="sex" name="sex" defaultValue={filters.sex}>
              <option value="">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sort">Sort by</label>
            <select id="sort" name="sort" defaultValue={filters.sort}>
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
              <option value="code">ID</option>
            </select>
          </div>
          <div className="filters__actions">
            <button type="submit" className="btn btn-dark">
              Apply
            </button>
            {active ? (
              <Link className="btn btn-quiet" href="/geckos">
                Reset
              </Link>
            ) : null}
          </div>
        </form>

        {result.state === 'unconfigured' ? (
          <UnconfiguredNotice />
        ) : result.state === 'error' ? (
          <ErrorNotice />
        ) : result.data.length === 0 ? (
          <EmptyNotice
            title={active ? 'No matching geckos' : 'Catalogue in preparation'}
            action={
              <a
                className="btn btn-primary"
                href={whatsappLink(settings.business.whatsapp_number, generalInquiryMessage())}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ask about stock on WhatsApp
              </a>
            }
          >
            <p>
              {active
                ? 'Try changing your search or filters. You can also ask GeckoDan directly about current stock.'
                : 'No geckos have been published yet. You can ask GeckoDan directly about current stock.'}
            </p>
          </EmptyNotice>
        ) : (
          <>
            <p className="results-line" role="status">
              <span>
                {result.data.length} {result.data.length === 1 ? 'gecko' : 'geckos'} {active ? 'match your filters' : 'in the catalogue'}
              </span>
              <span>Status is always reconfirmed on WhatsApp.</span>
            </p>
            <div className="gecko-grid">
              {result.data.map((g) => (
                <GeckoCard key={g.id} gecko={g} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}
