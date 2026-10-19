import Image from 'next/image'
import Link from 'next/link'
import { BusinessJsonLd } from '@/components/BusinessJsonLd'
import { GeckoImage } from '@/components/GeckoImage'
import { Hero } from '@/components/Hero'
import { ArrowIcon, BrandIcon } from '@/components/Icons'
import { Leaves } from '@/components/Leaves'
import { LineIndex } from '@/components/LineIndex'
import { ErrorNotice, UnconfiguredNotice } from '@/components/Notices'
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
    <div className="slot" role="img" aria-label={`${label}: photo coming soon`}>
      <Image src="/brand/geckodan-logo-256.png" alt="" width={96} height={91} />
      <span>{label}</span>
      <small>Photo coming soon</small>
    </div>
  )
}

export default async function HomePage() {
  const [settings, featured, lines, showcase, awards, testimonials, faqs] = await Promise.all([
    getSettings(),
    featuredGeckos(6),
    listLines(),
    showcaseGeckos(4),
    listAwards(),
    listTestimonials(),
    listFaqs(),
  ])
  const { business, story } = settings
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

      {/* One continuous page: the ground shifts tone slowly instead of switching between banded slides. */}
      <div className="flow">
        {/* Signature lines: one composition, three identities */}
        <section className="lines" aria-labelledby="lines-title">
          <div className="wrap">
            <header className="lines__head">
              <h2 id="lines-title" className="display-3">
                Signature Lines
              </h2>
              <p className="lines__title">Three distinct bloodlines, one standard.</p>
            </header>
            {lines.state === 'ok' ? (
              <LineIndex
                lines={lines.data.map((l) => ({
                  slug: l.slug,
                  name: l.name,
                  tagline: l.tagline,
                  summary: l.description ? excerpt(l.description, 200) : null,
                  coverSrc: mediaUrl(l.cover_photo_path),
                  coverAlt: l.cover_photo_alt || `${l.name} line`,
                }))}
              />
            ) : lines.state === 'unconfigured' ? (
              <UnconfiguredNotice />
            ) : (
              <ErrorNotice />
            )}
          </div>
        </section>

        {/* Featured geckos: a practical catalog grid */}
        <section className="catalog" aria-labelledby="featured-title">
          <Leaves side="left" />
          <div className="wrap">
            <header className="catalog__head">
              <h2 id="featured-title" className="display-2">
                Featured
                <br />
                Geckos
              </h2>
              <div className="catalog__aside">
                <p>Geckos available right now. Price and availability are confirmed directly on WhatsApp.</p>
                <Link className="text-arrow" href="/geckos">
                  View all geckos <ArrowIcon />
                </Link>
              </div>
            </header>

            {featured.state === 'unconfigured' ? (
              <UnconfiguredNotice />
            ) : featured.state === 'error' ? (
              <ErrorNotice />
            ) : featured.data.length === 0 ? (
              <div className="catalog__empty">
                <PhotoSlot label="Available gecko" />
                <p>
                  No geckos are published in the catalog yet. Ask about current stock on WhatsApp.
                  <a className="btn btn-primary btn-sm" href={whatsappLink(wa, generalInquiryMessage())} target="_blank" rel="noopener noreferrer">
                    Ask about stock <BrandIcon name="whatsapp" />
                  </a>
                </p>
              </div>
            ) : (
              <>
              <ul className="catalog__grid">
                {featured.data.map((g) => {
                  const href = `/geckos/${g.slug}`
                  const message = geckoInquiryMessage({ name: g.name, code: g.code, url: `${base}${href}` })
                  return (
                    <li key={g.id} className="gecko rv">
                      <Link href={href} className="gecko__photo" aria-label={`View ${g.name}`}>
                        <GeckoImage photo={g.photos[0]} name={g.name} sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 30vw" />
                      </Link>
                      <div className="gecko__body">
                        <h3 className="gecko__name">
                          <Link href={href}>{g.name}</Link>
                        </h3>
                        <Status status={g.status} />
                        <p className="gecko__meta">{[`ID ${g.code}`, g.morph, g.line?.name].filter(Boolean).join(' · ')}</p>
                        <p className="gecko__actions">
                          {g.status !== 'sold' ? (
                            <a href={whatsappLink(wa, message)} target="_blank" rel="noopener noreferrer" className="text-arrow">
                              <BrandIcon name="whatsapp" /> Ask on WhatsApp
                            </a>
                          ) : null}
                          <Link href={href} className="text-arrow text-arrow--quiet">
                            Details <ArrowIcon />
                          </Link>
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
                <div className="catalog__all">
                  <Link href="/geckos" className="arrow-cta" aria-label="See every gecko in the full catalog">
                    <span>See every gecko</span>
                    <span className="arrow-cta__circle" aria-hidden="true">
                      <ArrowIcon />
                    </span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Collection: photography first, tiles of different proportions */}
        <section className="collection" aria-labelledby="collection-title">
          <div className="wrap">
            <header className="collection__head">
              <h2 id="collection-title" className="display-2">
                The
                <br />
                Collection
              </h2>
              <div className="collection__aside">
                <p>Selected geckos from GeckoDan&rsquo;s own collection, beyond what is for sale.</p>
                <Link className="text-arrow" href="/showcase">
                  View the collection <ArrowIcon />
                </Link>
              </div>
            </header>
            {showcase.state === 'ok' ? (
              <ul className="gallery" data-count={showcase.data.length || 3}>
                {showcase.data.length
                  ? showcase.data.map((g) => (
                      <li key={g.id} className="shot rv">
                        <Link href={`/geckos/${g.slug}`} aria-label={`View ${g.name}`}>
                          <GeckoImage photo={g.photos[0]} name={g.name} sizes="(max-width: 700px) 92vw, 50vw" />
                          <span className="shot__cap">
                            <strong>{g.name}</strong>
                            <small>{[g.morph, g.line?.name].filter(Boolean).join(' · ') || `ID ${g.code}`}</small>
                          </span>
                        </Link>
                      </li>
                    ))
                  : ['GeckoDan collection', 'Breeding stock', 'Growing projects'].map((label) => (
                      <li key={label} className="shot">
                        <PhotoSlot label={label} />
                      </li>
                    ))}
              </ul>
            ) : showcase.state === 'unconfigured' ? (
              <UnconfiguredNotice />
            ) : (
              <ErrorNotice />
            )}
          </div>
        </section>

        {/* Story and achievements: narrative with one large photograph */}
        <section className="story" aria-labelledby="story-title">
          <Leaves side="right" />
          <div className="wrap story__grid">
            <div className="story__text">
              <h2 id="story-title" className="display-2">
                A Decade
                <br />
                of Passion
              </h2>
              {storyParas.length ? (
                <p className="story__lead">{excerpt(storyParas[0], 320)}</p>
              ) : (
                <p className="story__lead">
                  <span className="placeholder-tag">Content coming soon</span> GeckoDan&rsquo;s story will be written by the owner.
                </p>
              )}
              <Link className="text-arrow" href="/our-story">
                Read the full story <ArrowIcon />
              </Link>
              <dl className="story__facts">
                <div>
                  <dt>{business.experience_years ? `${business.experience_years}+` : 'Years'}</dt>
                  <dd>{business.experience_years ? 'years in the gecko world' : 'in the gecko world'}</dd>
                </div>
                <div>
                  <dt>Pamulang</dt>
                  <dd>South Tangerang, Indonesia</dd>
                </div>
              </dl>
            </div>
            <div className="story__side">
              <div className="story__photo rv">
                <PhotoSlot label="GeckoDan breeder" />
              </div>
              <div className="achv">
                <h3>Achievements</h3>
                {shownAwards.length ? (
                  <ol className="achv__list">
                    {shownAwards.map((a) => (
                      <li key={a.id}>
                        <span className="achv__year">{a.award_year ?? ''}</span>
                        <span>
                          <strong>{a.title}</strong>
                          <small>{[a.placement, a.event_name].filter(Boolean).join(' · ')}</small>
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>
                    <span className="placeholder-tag">Coming soon</span> Competition results appear here once they are verified.
                  </p>
                )}
                <Link className="text-arrow" href="/achievements">
                  All achievements <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews and questions: two columns that each suit their content */}
        <section className="info" aria-label="Reviews and questions">
          <Leaves side="left" />
          <div className="wrap info__grid">
            <div className="reviews" aria-labelledby="reviews-title">
              <h2 id="reviews-title" className="display-3">
                Trust From Our Community
              </h2>
              {firstTestimonial ? (
                <figure className="reviews__quote">
                  <blockquote>&ldquo;{excerpt(firstTestimonial.body, 240)}&rdquo;</blockquote>
                  <figcaption>
                    {firstTestimonial.author_name}
                    {firstTestimonial.author_location ? `, ${firstTestimonial.author_location}` : ''}
                  </figcaption>
                </figure>
              ) : (
                <p className="reviews__empty">Customer testimonials appear here once customers give permission to publish them.</p>
              )}
              <p className="reviews__links">
                {readUrl ? (
                  <a className="text-arrow" href={readUrl} target="_blank" rel="noopener noreferrer">
                    Read Google Reviews <ArrowIcon />
                  </a>
                ) : null}
                {writeUrl ? (
                  <a className="text-arrow" href={writeUrl} target="_blank" rel="noopener noreferrer">
                    Write a review <ArrowIcon />
                  </a>
                ) : null}
                {!readUrl && !writeUrl ? (
                  <span>
                    <span className="placeholder-tag">Link pending</span> GeckoDan&rsquo;s Google Reviews link has not been set yet.
                  </span>
                ) : null}
              </p>
              <Link className="text-arrow text-arrow--quiet" href="/reviews">
                All testimonials <ArrowIcon />
              </Link>
            </div>

            <div className="faq" aria-labelledby="faq-title">
              <h2 id="faq-title" className="display-3">
                Questions, answered
              </h2>
              {faqItems.length ? (
                <div className="faq__list">
                  {faqItems.map((f) => (
                    <details key={f.id} className="faq__item">
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
                  <span className="placeholder-tag">Content coming soon</span> FAQ answers are being prepared. Meanwhile, ask us on WhatsApp.
                </p>
              )}
              <p className="faq__more">
                <Link className="text-arrow" href="/faq">
                  All FAQs <ArrowIcon />
                </Link>
                <Link className="text-arrow text-arrow--quiet" href="/shipping">
                  Shipping information <ArrowIcon />
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
