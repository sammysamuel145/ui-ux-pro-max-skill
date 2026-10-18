import Image from 'next/image'
import Link from 'next/link'
import { BusinessJsonLd } from '@/components/BusinessJsonLd'
import { Coupon } from '@/components/Coupon'
import { GeckoImage } from '@/components/GeckoImage'
import { Hero } from '@/components/Hero'
import { ArrowIcon } from '@/components/Icons'
import { LineTabs } from '@/components/LineTabs'
import { ErrorNotice, PendingContent, UnconfiguredNotice } from '@/components/Notices'
import { Status } from '@/components/Status'
import { ReviewActions } from '@/components/ReviewActions'
import {
  featuredGeckos,
  getSettings,
  listAwards,
  listFaqs,
  listLines,
  listTestimonials,
  showcaseGeckos,
} from '@/lib/data/public'
import { mediaUrl } from '@/lib/media'
import { excerpt, paragraphs } from '@/lib/text'
import { generalInquiryMessage, whatsappLink } from '@/lib/whatsapp'

export const revalidate = 60

export default async function HomePage() {
  const [settings, featured, lines, showcase, awards, testimonials, faqs] = await Promise.all([
    getSettings(),
    featuredGeckos(8),
    listLines(),
    showcaseGeckos(5),
    listAwards(),
    listTestimonials(),
    listFaqs(),
  ])
  const wa = settings.business.whatsapp_number
  const story = paragraphs(settings.story.body)
  const firstTestimonial = testimonials.state === 'ok' ? testimonials.data[0] : undefined

  return (
    <>
      <BusinessJsonLd settings={settings} />
      <Hero settings={settings} />

      {/* Featured available geckos, set as the breeder's printed availability sheet */}
      <section className="sheet-band" aria-labelledby="available-title">
        <div className="sheet reveal">
          <div className="sheet__head">
            <h2 id="available-title">Available Now</h2>
            <p>Gecko yang sedang tersedia. Harga dan ketersediaan dikonfirmasi langsung lewat WhatsApp.</p>
          </div>
          {featured.state === 'unconfigured' ? (
            <div style={{ marginTop: 32 }}>
              <UnconfiguredNotice />
            </div>
          ) : featured.state === 'error' ? (
            <div style={{ marginTop: 32 }}>
              <ErrorNotice />
            </div>
          ) : featured.data.length === 0 ? (
            <p style={{ marginTop: 40, textAlign: 'center' }}>
              Belum ada gecko yang dipublikasikan di katalog. Tanyakan stok terbaru langsung ke GeckoDan.
            </p>
          ) : (
            <ul className="sheet__list">
              {featured.data.map((g) => (
                <li key={g.id} className="sheet__row">
                  <Link href={`/geckos/${g.slug}`}>
                    <span className="sheet__name">{g.name}</span>
                    <Status status={g.status} />
                    <span className="sheet__detail">
                      ID {g.code}
                      {g.morph ? ` · ${g.morph}` : ''}
                      {g.line ? ` · Line ${g.line.name}` : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="sheet__foot">
            <Link className="btn btn-dark" href="/geckos">
              Lihat katalog <ArrowIcon />
            </Link>
            <a className="btn btn-quiet" href={whatsappLink(wa, generalInquiryMessage())} target="_blank" rel="noopener noreferrer">
              Tanya stok
            </a>
          </div>
        </div>
      </section>

      {/* Signature lines */}
      <section aria-labelledby="lines-title">
        <h2 id="lines-title" className="sr-only">
          Signature lines
        </h2>
        {lines.state === 'ok' && lines.data.length ? (
          <LineTabs
            lines={lines.data.map((l) => ({
              slug: l.slug,
              name: l.name,
              summary: l.tagline || (l.description ? excerpt(l.description, 220) : null),
              coverSrc: mediaUrl(l.cover_photo_path),
              coverAlt: l.cover_photo_alt || `Line ${l.name}`,
            }))}
          />
        ) : (
          <div className="wrap section">{lines.state === 'unconfigured' ? <UnconfiguredNotice /> : <ErrorNotice />}</div>
        )}
      </section>

      {/* Collection showcase */}
      <section className="section" aria-labelledby="showcase-title">
        <div className="wrap reveal">
          <h2 id="showcase-title" className="headline" style={{ textTransform: 'uppercase' }}>
            The Collection
          </h2>
          <p className="lead soft" style={{ marginTop: 16 }}>
            Gecko koleksi GeckoDan: indukan dan hewan pilihan yang menjadi dasar setiap line.
          </p>
          <div style={{ marginTop: 48 }}>
            {showcase.state === 'ok' && showcase.data.length ? (
              <div className="showcase-grid">
                {showcase.data.map((g) => (
                  <Link key={g.id} href={`/geckos/${g.slug}`} className="showcase-item">
                    <span className="showcase-item__media">
                      <GeckoImage photo={g.photos[0]} name={g.name} sizes="(max-width: 760px) 100vw, 50vw" />
                    </span>
                    <span className="showcase-item__name">{g.name}</span>
                  </Link>
                ))}
              </div>
            ) : showcase.state === 'ok' ? (
              <PendingContent>Foto koleksi akan tampil di sini setelah ditambahkan pemilik lewat dashboard.</PendingContent>
            ) : showcase.state === 'unconfigured' ? (
              <UnconfiguredNotice />
            ) : (
              <ErrorNotice />
            )}
          </div>
          <p style={{ marginTop: 40 }}>
            <Link className="text-link" href="/showcase">
              Lihat seluruh koleksi
            </Link>
          </p>
        </div>
      </section>

      {/* Breeder story */}
      <section className="letter-band" aria-labelledby="story-title">
        <article className="letter reveal">
          <Image className="letter__logo" src="/brand/geckodan-logo-256.png" alt="" width={256} height={242} />
          <h2 id="story-title" className="headline" style={{ marginTop: 24, textTransform: 'uppercase' }}>
            A decade in the gecko world
          </h2>
          <div className="prose">
            {story.length ? (
              story.slice(0, 2).map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <PendingContent>Cerita perjalanan GeckoDan selama sekitar sepuluh tahun akan ditulis oleh pemilik.</PendingContent>
            )}
          </div>
          <p style={{ marginTop: 28 }}>
            <Link className="text-link" href="/our-story">
              Baca cerita lengkap
            </Link>
          </p>
        </article>
      </section>

      {/* Verified achievements */}
      <section className="proof-band" aria-labelledby="awards-title">
        <div className="proof-card reveal">
          <h2 id="awards-title">Achievements</h2>
          {awards.state === 'ok' && awards.data.length ? (
            <ul className="award-list">
              {awards.data.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <strong>{a.title}</strong>
                  <span className="soft">
                    {[a.placement, a.event_name, a.award_year].filter(Boolean).join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          ) : awards.state === 'ok' ? (
            <div style={{ marginTop: 28 }}>
              <PendingContent>Prestasi kompetisi tampil di sini setelah diverifikasi dan dilengkapi bukti.</PendingContent>
            </div>
          ) : (
            <div style={{ marginTop: 28 }}>{awards.state === 'unconfigured' ? <UnconfiguredNotice /> : <ErrorNotice />}</div>
          )}
          <p style={{ marginTop: 32 }}>
            <Link className="text-link" href="/achievements">
              Semua prestasi
            </Link>
          </p>
        </div>
      </section>

      {/* Testimonials and Google Reviews */}
      <section className="section" aria-labelledby="reviews-title">
        <div className="wrap reveal" style={{ display: 'grid', gap: 40 }}>
          <h2 id="reviews-title" className="headline" style={{ textTransform: 'uppercase' }}>
            Kata mereka
          </h2>
          {firstTestimonial ? (
            <figure style={{ maxWidth: '38ch' }}>
              <blockquote>
                <p className="quote-open">{excerpt(firstTestimonial.body, 220)}</p>
              </blockquote>
              <figcaption style={{ marginTop: 24 }}>
                <strong>{firstTestimonial.author_name}</strong>
                {firstTestimonial.author_location ? <span className="soft">, {firstTestimonial.author_location}</span> : null}
              </figcaption>
            </figure>
          ) : (
            <PendingContent>Testimoni pelanggan tampil di sini hanya setelah ada izin dari pelanggan.</PendingContent>
          )}
          <ReviewActions business={settings.business} />
          <p>
            <Link className="text-link" href="/reviews">
              Semua ulasan dan testimoni
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ preview */}
      <section className="section field-paper-2" aria-labelledby="faq-title">
        <div className="wrap faq-split">
          <div className="reveal">
            <h2 id="faq-title" className="headline" style={{ textTransform: 'uppercase' }}>
              Questions
            </h2>
            {faqs.state === 'ok' && faqs.data.length ? (
              <div className="faq-list">
                {faqs.data.slice(0, 5).map((f) => (
                  <details key={f.id} className="faq-item">
                    <summary>{f.question}</summary>
                    <div className="prose">
                      {paragraphs(f.answer).map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 24 }}>
                <PendingContent>Jawaban pertanyaan umum sedang disiapkan. Sementara itu, tanyakan langsung lewat WhatsApp.</PendingContent>
              </div>
            )}
            <div className="inline-actions" style={{ marginTop: 32 }}>
              <Link className="btn btn-dark" href="/faq">
                Semua FAQ
              </Link>
              <Link className="text-link" href="/shipping">
                Pengiriman
              </Link>
            </div>
          </div>
          <div className="faq-art" aria-hidden="true">
            <Image src="/brand/geckodan-logo-640.png" alt="" width={640} height={606} sizes="(max-width: 860px) 70vw, 40vw" />
          </div>
        </div>
      </section>

      {/* Contact, location and shipping */}
      <section className="section" aria-labelledby="contact-title">
        <div className="wrap" style={{ display: 'grid', gap: 40 }}>
          <div className="reveal">
            <h2 id="contact-title" className="headline" style={{ textTransform: 'uppercase' }}>
              Visit &amp; Contact
            </h2>
            <p className="lead" style={{ marginTop: 16 }}>
              {settings.business.location}. WhatsApp {settings.business.whatsapp_display}.
            </p>
            <p style={{ marginTop: 12 }} className="inline-actions">
              {settings.business.maps_url ? (
                <a className="text-link" href={settings.business.maps_url} target="_blank" rel="noopener noreferrer">
                  Buka di Google Maps
                </a>
              ) : null}
              <Link className="text-link" href="/shipping">
                Informasi pengiriman
              </Link>
            </p>
          </div>
          <Coupon whatsappNumber={wa} />
        </div>
      </section>
    </>
  )
}
