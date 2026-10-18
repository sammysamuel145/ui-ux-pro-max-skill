import Image from 'next/image'
import Link from 'next/link'
import { BusinessJsonLd } from '@/components/BusinessJsonLd'
import { GeckoImage } from '@/components/GeckoImage'
import { Hero } from '@/components/Hero'
import { ArrowIcon, BrandIcon, LineIcon, PinIcon } from '@/components/Icons'
import { ErrorNotice, UnconfiguredNotice } from '@/components/Notices'
import { activePlatforms } from '@/components/SocialLinks'
import { Status } from '@/components/Status'
import {
  featuredGeckos,
  getSettings,
  listAwards,
  listFaqs,
  listLines,
  listTestimonials,
  showcaseGeckos,
} from '@/lib/data/public'
import { siteUrl } from '@/lib/env'
import { mediaUrl } from '@/lib/media'
import { excerpt, paragraphs } from '@/lib/text'
import { generalInquiryMessage, geckoInquiryMessage, whatsappLink } from '@/lib/whatsapp'
import './home.css'

export const revalidate = 60

/** A labelled stand-in for a picture the owner has not uploaded yet. Never a stock or generated animal. */
function PhotoSlot({ label }: { label: string }) {
  return (
    <div className="slot" role="img" aria-label={`${label}: foto menyusul`}>
      <Image src="/brand/geckodan-logo-256.png" alt="" width={96} height={91} />
      <span>{label}</span>
      <small>Foto menyusul</small>
    </div>
  )
}

export default async function HomePage() {
  const [settings, featured, lines, showcase, awards, testimonials, faqs] = await Promise.all([
    getSettings(),
    featuredGeckos(3),
    listLines(),
    showcaseGeckos(4),
    listAwards(),
    listTestimonials(),
    listFaqs(),
  ])
  const { business, socials, story } = settings
  const wa = business.whatsapp_number
  const base = siteUrl()
  const storyParas = paragraphs(story.body)
  const firstTestimonial = testimonials.state === 'ok' ? testimonials.data[0] : undefined
  const readUrl = /^https:\/\//.test(business.google_reviews_url) ? business.google_reviews_url : ''
  const writeUrl = /^https:\/\//.test(business.google_write_review_url) ? business.google_write_review_url : ''
  const faqItems = faqs.state === 'ok' ? faqs.data.slice(0, 6) : []
  const shownAwards = awards.state === 'ok' ? awards.data.slice(0, 4) : []

  return (
    <>
      <BusinessJsonLd settings={settings} />
      <Hero settings={settings} />

      {/* Featured geckos */}
      <section className="band band--cream" aria-labelledby="featured-title">
        <div className="band__inner">
          <div className="band__head">
            <div>
              <p className="band__kicker">Our selected</p>
              <h2 id="featured-title" className="band__title">
                Featured Geckos
              </h2>
            </div>
            <p className="band__lead">Pilihan gecko yang sedang tersedia. Harga dan ketersediaan dikonfirmasi langsung lewat WhatsApp.</p>
            <Link className="band__more" href="/geckos">
              Lihat semua geckos <ArrowIcon />
            </Link>
          </div>
          {featured.state === 'unconfigured' ? (
            <UnconfiguredNotice />
          ) : featured.state === 'error' ? (
            <ErrorNotice />
          ) : featured.data.length === 0 ? (
            <div className="featured-empty">
              <PhotoSlot label="Gecko tersedia" />
              <p>
                Belum ada gecko yang dipublikasikan di katalog. Tanyakan stok terbaru langsung lewat WhatsApp.
                <a className="btn btn-primary btn-sm" href={whatsappLink(wa, generalInquiryMessage())} target="_blank" rel="noopener noreferrer">
                  Tanya stok <BrandIcon name="whatsapp" />
                </a>
              </p>
            </div>
          ) : (
            <ul className="featured-grid">
              {featured.data.map((g) => {
                const href = `/geckos/${g.slug}`
                const message = geckoInquiryMessage({ name: g.name, code: g.code, url: `${base}${href}` })
                return (
                  <li key={g.id} className="featured-card">
                    <Link href={href} className="featured-card__media" aria-label={`Lihat ${g.name}`}>
                      <GeckoImage photo={g.photos[0]} name={g.name} sizes="(max-width: 760px) 100vw, 30vw" />
                      <span className="featured-card__badge">
                        <Status status={g.status} />
                      </span>
                    </Link>
                    <div className="featured-card__row">
                      <div>
                        <strong>ID {g.code}</strong>
                        <span>{[g.name, g.morph].filter(Boolean).join(' · ')}</span>
                      </div>
                      <Link href={href} className="featured-card__go" aria-label={`Detail ${g.name}`}>
                        <ArrowIcon />
                      </Link>
                    </div>
                    {g.status !== 'sold' ? (
                      <a className="btn btn-primary btn-sm" href={whatsappLink(wa, message)} target="_blank" rel="noopener noreferrer">
                        Ask via WhatsApp <BrandIcon name="whatsapp" />
                      </a>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Signature lines */}
      <section className="band band--forest" aria-labelledby="lines-title">
        <div className="band__inner lines-band">
          <div className="lines-band__copy">
            <p className="band__kicker">Signature lines</p>
            <h2 id="lines-title" className="band__title">
              Three distinct bloodlines
            </h2>
            <p>MANTRA, KAFKA, dan VALKRIE adalah tiga signature line GeckoDan.</p>
            <Link className="band__more" href="/lines/mantra">
              Pelajari lebih lanjut <ArrowIcon />
            </Link>
          </div>
          {lines.state === 'ok' ? (
            <ul className="lines-band__grid">
              {lines.data.map((l) => {
                const cover = mediaUrl(l.cover_photo_path)
                return (
                  <li key={l.slug}>
                    <Link href={`/lines/${l.slug}`} className="line-card">
                      {cover ? (
                        <Image src={cover} alt={l.cover_photo_alt || `Line ${l.name}`} fill sizes="(max-width: 760px) 100vw, 20vw" style={{ objectFit: 'cover' }} />
                      ) : (
                        <span className="line-card__plate" aria-hidden="true">
                          <Image src="/brand/geckodan-logo-256.png" alt="" width={96} height={91} />
                        </span>
                      )}
                      <span className="line-card__text">
                        <strong>{l.name}</strong>
                        {l.tagline ? <small>{l.tagline}</small> : null}
                        <em>
                          Lihat line {l.name} <ArrowIcon />
                        </em>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : lines.state === 'unconfigured' ? (
            <UnconfiguredNotice />
          ) : (
            <ErrorNotice />
          )}
        </div>
      </section>

      {/* Collection */}
      <section className="band band--cream" aria-labelledby="collection-title">
        <div className="band__inner collection-band">
          <div className="collection-band__copy">
            <p className="band__kicker">The collection</p>
            <h2 id="collection-title" className="band__title">
              Beyond for sale
            </h2>
            <p>Koleksi showcase GeckoDan: gecko pilihan yang menjadi bagian dari perjalanan kami.</p>
            <Link className="band__more" href="/showcase">
              Lihat koleksi <ArrowIcon />
            </Link>
          </div>
          {showcase.state === 'ok' && showcase.data.length ? (
            <ul className="collection-band__mosaic">
              {showcase.data.map((g) => (
                <li key={g.id}>
                  <Link href={`/geckos/${g.slug}`} className="mosaic-tile">
                    <GeckoImage photo={g.photos[0]} name={g.name} sizes="(max-width: 760px) 100vw, 25vw" />
                    <span className="mosaic-tile__cap">
                      <strong>{g.name}</strong>
                      <small>{[g.morph, g.line?.name].filter(Boolean).join(' · ') || `ID ${g.code}`}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : showcase.state === 'ok' ? (
            <div className="collection-band__mosaic collection-band__mosaic--empty">
              <PhotoSlot label="Koleksi GeckoDan" />
              <p>Foto koleksi tampil di sini setelah ditambahkan pemilik lewat dashboard.</p>
            </div>
          ) : showcase.state === 'unconfigured' ? (
            <UnconfiguredNotice />
          ) : (
            <ErrorNotice />
          )}
        </div>
      </section>

      {/* Story */}
      <section className="story-band" aria-labelledby="story-title">
        <div className="story-band__photo">
          <PhotoSlot label="Breeder GeckoDan" />
        </div>
        <div className="story-band__copy">
          <p className="band__kicker">Our story</p>
          <h2 id="story-title" className="band__title">
            A decade
            <br />
            of passion
          </h2>
          {storyParas.length ? (
            <p>{excerpt(storyParas[0], 260)}</p>
          ) : (
            <p>
              <span className="placeholder-tag">Konten menyusul</span> Cerita GeckoDan akan ditulis oleh pemilik.
            </p>
          )}
          <Link className="band__more" href="/our-story">
            Baca cerita lengkap <ArrowIcon />
          </Link>
        </div>
        <ul className="story-band__stats">
          <li>
            <LineIcon name="leaf" />
            <strong>{business.experience_years ? `${business.experience_years}+` : 'Pengalaman'}</strong>
            <span>{business.experience_years ? 'Tahun pengalaman' : 'Di dunia gecko'}</span>
          </li>
          <li>
            <LineIcon name="diamond" />
            <strong>Kualitas</strong>
            <span>Selalu diutamakan</span>
          </li>
          <li>
            <LineIcon name="people" />
            <strong>Komunitas</strong>
            <span>Bagian dari perjalanan</span>
          </li>
          <li>
            <LineIcon name="globe" />
            <strong>Pamulang</strong>
            <span>Tangerang Selatan</span>
          </li>
        </ul>
      </section>

      {/* Achievements: only verified entries with evidence ever appear */}
      <section className="band band--cream band--tight" aria-labelledby="awards-title">
        <div className="band__inner awards-band">
          <div className="awards-band__copy">
            <p className="band__kicker">In the show ring</p>
            <h2 id="awards-title" className="band__title">
              Achievements
            </h2>
            <p>Dokumentasi kontes dan pencapaian GeckoDan tampil di sini setelah diverifikasi.</p>
            <Link className="band__more" href="/achievements">
              Lihat semua prestasi <ArrowIcon />
            </Link>
          </div>
          <ul className="awards-band__tiles">
            {shownAwards.length
              ? shownAwards.map((a) => (
                  <li key={a.id} className="award-tile">
                    <LineIcon name="trophy" />
                    <strong>{a.title}</strong>
                    <small>{[a.placement, a.event_name, a.award_year].filter(Boolean).join(' · ')}</small>
                  </li>
                ))
              : [0, 1, 2, 3].map((i) => (
                  <li key={i} className="award-tile award-tile--empty">
                    <LineIcon name="trophy" />
                    <span>Prestasi menyusul</span>
                    <small>Belum ada prestasi terverifikasi</small>
                  </li>
                ))}
          </ul>
        </div>
      </section>

      {/* Reviews */}
      <section className="band band--forest band--tight" aria-labelledby="reviews-title">
        <div className="band__inner reviews-band">
          <div>
            <p className="band__kicker">Reviews &amp; testimonials</p>
            <h2 id="reviews-title" className="band__title">
              Trust from our community
            </h2>
            <p>Ulasan dari pelanggan dan komunitas.</p>
          </div>
          <div className="reviews-band__box">
            <h3>Google reviews</h3>
            {readUrl || writeUrl ? (
              <>
                <p>Baca atau tulis ulasan langsung di profil Google Business GeckoDan.</p>
                <div className="inline-actions">
                  {readUrl ? (
                    <a className="btn btn-primary btn-sm" href={readUrl} target="_blank" rel="noopener noreferrer">
                      Read Google reviews
                    </a>
                  ) : null}
                  {writeUrl ? (
                    <a className="btn btn-outline btn-sm" href={writeUrl} target="_blank" rel="noopener noreferrer">
                      Write a review
                    </a>
                  ) : null}
                </div>
              </>
            ) : (
              <p>
                <span className="placeholder-tag">Menunggu tautan</span> Tautan Google Reviews GeckoDan belum diatur.
              </p>
            )}
          </div>
          <div className="reviews-band__box">
            <h3>Customer testimonials</h3>
            {firstTestimonial ? (
              <figure>
                <blockquote>{excerpt(firstTestimonial.body, 200)}</blockquote>
                <figcaption>
                  {firstTestimonial.author_name}
                  {firstTestimonial.author_location ? `, ${firstTestimonial.author_location}` : ''}
                </figcaption>
              </figure>
            ) : (
              <p>Testimoni pelanggan tampil di sini setelah mendapat izin publikasi.</p>
            )}
            <Link className="band__more" href="/reviews">
              Lihat semua testimoni <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="band band--cream band--tight" aria-labelledby="faq-title">
        <div className="band__inner faq-band">
          <div>
            <p className="band__kicker">FAQ &amp; shipping</p>
            <h2 id="faq-title" className="band__title">
              Pertanyaan umum
            </h2>
            <p>Informasi seputar pemesanan, perawatan, dan pengiriman.</p>
            <Link className="band__more" href="/faq">
              Semua FAQ <ArrowIcon />
            </Link>
          </div>
          {faqItems.length ? (
            <div className="faq-band__list">
              {faqItems.map((f) => (
                <details key={f.id} className="faq-band__item">
                  <summary>{f.question}</summary>
                  <div>
                    {paragraphs(f.answer).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p>
              <span className="placeholder-tag">Konten menyusul</span> Jawaban pertanyaan umum sedang disiapkan. Sementara itu, tanyakan lewat WhatsApp.
            </p>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="band band--forest band--tight" aria-labelledby="contact-title">
        <div className="band__inner contact-band">
          <div>
            <p className="band__kicker">Get in touch</p>
            <h2 id="contact-title" className="band__title">
              Kontak kami
            </h2>
            <p>{business.location}</p>
          </div>
          <a className="contact-band__wa" href={whatsappLink(wa, generalInquiryMessage())} target="_blank" rel="noopener noreferrer">
            <BrandIcon name="whatsapp" />
            <span>
              <small>Tanya via WhatsApp</small>
              <strong>{business.whatsapp_display}</strong>
            </span>
            <ArrowIcon />
          </a>
          <div className="contact-band__place">
            <PinIcon />
            <span>
              <small>Lokasi kami</small>
              <strong>{business.location}</strong>
              {business.maps_url ? (
                <a href={business.maps_url} target="_blank" rel="noopener noreferrer">
                  Lihat di Google Maps
                </a>
              ) : null}
            </span>
          </div>
          <div className="contact-band__social">
            <small>Ikuti kami</small>
            <ul>
              {activePlatforms(socials).map((p) => (
                <li key={p.key}>
                  <a href={socials[p.key]} target="_blank" rel="noopener noreferrer">
                    {p.icon ? <BrandIcon name={p.icon} /> : null} {p.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
