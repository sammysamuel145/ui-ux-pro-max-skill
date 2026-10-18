import type { Metadata } from 'next'
import { ErrorNotice, PendingContent, UnconfiguredNotice } from '@/components/Notices'
import { PageHead } from '@/components/PageHead'
import { ReviewActions } from '@/components/ReviewActions'
import { getSettings, listTestimonials } from '@/lib/data/public'
import { paragraphs } from '@/lib/text'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Reviews',
  description: 'Ulasan Google dan testimoni pelanggan GeckoDan.',
  alternates: { canonical: '/reviews' },
}

export default async function ReviewsPage() {
  const [settings, res] = await Promise.all([getSettings(), listTestimonials()])
  return (
    <>
      <PageHead title="Reviews" tagline="Dari para pemilik gecko GeckoDan." />
      <section className="wrap" style={{ display: 'grid', gap: 64, paddingBottom: 'var(--section)' }}>
        <div>
          <h2 className="headline" style={{ fontSize: 'clamp(1.75rem, 1.2rem + 2vw, 2.75rem)' }}>
            Google Reviews
          </h2>
          <p className="soft measure" style={{ margin: '12px 0 24px' }}>
            Ulasan Google ditulis langsung oleh pelanggan di profil bisnis GeckoDan. Kami tidak menyalin atau meringkasnya di sini.
          </p>
          <ReviewActions business={settings.business} />
        </div>
        <div>
          <h2 className="headline" style={{ fontSize: 'clamp(1.75rem, 1.2rem + 2vw, 2.75rem)' }}>
            Testimoni pelanggan
          </h2>
          <p className="soft measure" style={{ margin: '12px 0 32px' }}>
            Testimoni ini dikirim langsung ke GeckoDan dan dipublikasikan dengan izin pengirimnya. Testimoni ini terpisah dari ulasan Google.
          </p>
          {res.state === 'unconfigured' ? (
            <UnconfiguredNotice />
          ) : res.state === 'error' ? (
            <ErrorNotice />
          ) : res.data.length === 0 ? (
            <PendingContent>Testimoni akan tampil setelah pelanggan memberi izin publikasi.</PendingContent>
          ) : (
            <div style={{ display: 'grid', gap: 56 }}>
              {res.data.map((t) => (
                <figure key={t.id} style={{ maxWidth: '40ch' }}>
                  <blockquote className="prose">
                    {paragraphs(t.body).map((p, i) => (
                      <p key={i} className={i === 0 ? 'quote-open' : undefined}>
                        {p}
                      </p>
                    ))}
                  </blockquote>
                  <figcaption style={{ marginTop: 20 }}>
                    <strong>{t.author_name}</strong>
                    {t.author_location ? <span className="soft">, {t.author_location}</span> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
