import type { Metadata } from 'next'
import Link from 'next/link'
import { GeckoImage } from '@/components/GeckoImage'
import { ErrorNotice, PendingContent, UnconfiguredNotice } from '@/components/Notices'
import { PageHead } from '@/components/PageHead'
import { showcaseGeckos } from '@/lib/data/public'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Showcase',
  description: 'Koleksi gecko GeckoDan: indukan dan hewan pilihan yang menjadi dasar setiap signature line.',
  alternates: { canonical: '/showcase' },
}

export default async function ShowcasePage() {
  const res = await showcaseGeckos()
  return (
    <>
      <PageHead title="The Collection" tagline="A Legacy in Every Line.">
        <p className="lead">Indukan dan gecko pilihan GeckoDan. Tidak semua dijual: status tiap gecko tertulis di halamannya.</p>
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 'var(--section)' }} aria-label="Koleksi">
        {res.state === 'unconfigured' ? (
          <UnconfiguredNotice />
        ) : res.state === 'error' ? (
          <ErrorNotice />
        ) : res.data.length === 0 ? (
          <PendingContent>Foto koleksi akan tampil di sini setelah ditambahkan pemilik lewat dashboard.</PendingContent>
        ) : (
          <div className="showcase-grid">
            {res.data.map((g) => (
              <Link key={g.id} href={`/geckos/${g.slug}`} className="showcase-item">
                <span className="showcase-item__media">
                  <GeckoImage photo={g.photos[0]} name={g.name} sizes="(max-width: 760px) 100vw, 50vw" />
                </span>
                <span className="showcase-item__name">{g.name}</span>
                <span className="small soft">
                  ID {g.code}
                  {g.line ? ` · Line ${g.line.name}` : ''}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
