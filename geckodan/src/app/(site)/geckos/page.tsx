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
  description: 'Katalog leopard gecko GeckoDan yang tersedia. Cari berdasarkan nama atau ID, saring per line dan status, lalu tanyakan lewat WhatsApp.',
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
      <PageHead title="Our Geckos" tagline="A Legacy in Every Line.">
        <p className="lead">Gecko yang tersedia untuk dibeli. Harga tidak ditampilkan: tanyakan langsung lewat WhatsApp.</p>
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 'var(--section)' }} aria-label="Katalog">
        <form className="filters" method="get" action="/geckos" role="search">
          <div className="field field-search">
            <label htmlFor="q">Cari nama, ID, atau morph</label>
            <input id="q" name="q" type="search" defaultValue={filters.q} maxLength={60} placeholder="Contoh: GD-0007" />
          </div>
          <div className="field">
            <label htmlFor="line">Line</label>
            <select id="line" name="line" defaultValue={filters.line}>
              <option value="">Semua line</option>
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
              <option value="open">Available dan reserved</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
              <option value="all">Semua status</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sex">Jenis kelamin</label>
            <select id="sex" name="sex" defaultValue={filters.sex}>
              <option value="">Semua</option>
              <option value="male">Jantan</option>
              <option value="female">Betina</option>
              <option value="unknown">Belum diketahui</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sort">Urutkan</label>
            <select id="sort" name="sort" defaultValue={filters.sort}>
              <option value="newest">Terbaru</option>
              <option value="name">Nama A-Z</option>
              <option value="code">ID</option>
            </select>
          </div>
          <div className="filters__actions">
            <button type="submit" className="btn btn-dark">
              Terapkan
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
            title={active ? 'Tidak ada gecko yang cocok' : 'Katalog sedang disiapkan'}
            action={
              <a
                className="btn btn-primary"
                href={whatsappLink(settings.business.whatsapp_number, generalInquiryMessage())}
                target="_blank"
                rel="noopener noreferrer"
              >
                Tanya stok via WhatsApp
              </a>
            }
          >
            <p>
              {active
                ? 'Coba ubah pencarian atau saringan. Stok terbaru juga bisa ditanyakan langsung ke GeckoDan.'
                : 'Belum ada gecko yang dipublikasikan. Stok terbaru bisa ditanyakan langsung ke GeckoDan.'}
            </p>
          </EmptyNotice>
        ) : (
          <>
            <p className="results-line" role="status">
              <span>
                {result.data.length} gecko {active ? 'cocok dengan saringan' : 'di katalog'}
              </span>
              <span>Status selalu dikonfirmasi ulang lewat WhatsApp.</span>
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
