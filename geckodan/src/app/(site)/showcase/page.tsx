import type { Metadata } from 'next'
import Link from 'next/link'
import { GeckoImage } from '@/components/GeckoImage'
import { ErrorNotice, PendingContent, UnconfiguredNotice } from '@/components/Notices'
import { PageHead } from '@/components/PageHead'
import { showcaseGeckos } from '@/lib/data/public'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Showcase',
  description: 'The GeckoDan collection: breeders and select animals that form the foundation of every signature line.',
  alternates: { canonical: '/showcase' },
}

export default async function ShowcasePage() {
  const res = await showcaseGeckos()
  return (
    <>
      <PageHead title="The Collection" tagline="A Legacy in Every Line." action={{ label: 'Geckos for sale', href: '/geckos' }}>
        <p className="lead">GeckoDan&rsquo;s breeders and select geckos. Not all are for sale: each gecko&rsquo;s status is shown on its page.</p>
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 'var(--section)' }} aria-label="Collection">
        {res.state === 'unconfigured' ? (
          <UnconfiguredNotice />
        ) : res.state === 'error' ? (
          <ErrorNotice />
        ) : res.data.length === 0 ? (
          <PendingContent>Collection photos will appear here once the owner adds them through the dashboard.</PendingContent>
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
                  {g.line ? ` · ${g.line.name} line` : ''}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
