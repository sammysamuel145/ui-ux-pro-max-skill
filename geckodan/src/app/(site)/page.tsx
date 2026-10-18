import Image from 'next/image'
import Link from 'next/link'
import { BusinessJsonLd } from '@/components/BusinessJsonLd'
import { Carousel } from '@/components/Carousel'
import { GeckoImage } from '@/components/GeckoImage'
import { Hero } from '@/components/Hero'
import { ArrowIcon, BrandIcon, LineIcon, PinIcon } from '@/components/Icons'
import { Leaves } from '@/components/Leaves'
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
import { formatWhatsappDisplay } from '@/lib/phone'
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
    featuredGeckos(9),
    listLines(),
    showcaseGeckos(4),
    listAwards(),
    listTestimonials(),
    listFaqs(),
  ])
  const { business, socials, story } = settings
  const wa = business.whatsapp_number
  const phone = formatWhatsappDisplay(wa)
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

      {/* Signature lines */}
      <section className="band band--a" aria-labelledby="lines-title">
        <Leaves side="left" />
        <Leaves side="right" />
        <div className="band__inner lines-band">
          <div className="lines-band__copy">
            <p className="band__kicker">Signature Lines</p>
            <h2 id="lines-title" className="band__title band__title--gold">
              Three Distinct Bloodlines
            </h2>
            <p>MANTRA, KAFKA and VALKRIE are GeckoDan&rsquo;s three signature lines.</p>
            <Link className="band__more" href="/lines/mantra">
              Learn more <ArrowIcon />
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
                        <Image src={cover} alt={l.cover_photo_alt || `${l.name} line`} fill sizes="(max-width: 760px) 100vw, 20vw" style={{ objectFit: 'cover' }} />
                      ) : (
                        <span className="line-card__plate" aria-hidden="true">
                          <Image src="/brand/geckodan-logo-256.png" alt="" width={96} height={91} />
                        </span>
                      )}
                      <span className="line-card__text">
                        <strong>{l.name}</strong>
                        {l.tagline ? <small>{l.tagline}</small> : null}
                        <em>
                          View line {l.name} <ArrowIcon />
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

      {/* Featured geckos */}
      <section className="band band--b" aria-labelledby="featured-title">
        <Leaves side="left" />
        <Leaves side="right" />
        <div className="band__inner">
          <div className="band__head">
            <div>
              <p className="band__kicker">Our Selected</p>
              <h2 id="featured-title" className="band__title">
                Featured Geckos
              </h2>
            </div>
            <p className="band__lead">Geckos available right now. Price and availability are confirmed directly on WhatsApp.</p>
            <Link className="band__more" href="/geckos">
              View all geckos <ArrowIcon />
            </Link>
          </div>
          {featured.state === 'unconfigured' ? (
            <UnconfiguredNotice />
          ) : featured.state === 'error' ? (
            <ErrorNotice />
          ) : featured.data.length === 0 ? (
            <div className="featured-empty">
              <PhotoSlot label="Available gecko" />
              <p>
                No geckos are published in the catalog yet. Ask about current stock on WhatsApp.
                <a className="btn btn-primary btn-sm" href={whatsappLink(wa, generalInquiryMessage())} target="_blank" rel="noopener noreferrer">
                  Ask about stock <BrandIcon name="whatsapp" />
                </a>
              </p>
            </div>
          ) : (
            <Carousel label="Featured geckos">
              {featured.data.map((g) => {
                const href = `/geckos/${g.slug}`
                const message = geckoInquiryMessage({ name: g.name, code: g.code, url: `${base}${href}` })
                return (
                  <li key={g.id} className="featured-card">
                    <Link href={href} className="featured-card__media" aria-label={`View ${g.name}`}>
                      <GeckoImage photo={g.photos[0]} name={g.name} sizes="(max-width: 760px) 90vw, 30vw" />
                      <span className="featured-card__badge">
                        <Status status={g.status} />
                      </span>
                    </Link>
                    <div className="featured-card__row">
                      <div>
                        <strong>ID {g.code}</strong>
                        <span>{[g.name, g.morph].filter(Boolean).join(' · ')}</span>
                      </div>
                      <Link href={href} className="featured-card__go" aria-label={`Details for ${g.name}`}>
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
            </Carousel>
          )}
        </div>
      </section>

      {/* Collection */}
      <section className="band band--a" aria-labelledby="collection-title">
        <Leaves side="left" />
        <Leaves side="right" />
        <div className="band__inner collection-band">
          <div className="collection-band__copy">
            <p className="band__kicker">The Collection</p>
            <h2 id="collection-title" className="band__title">
              Beyond For Sale
            </h2>
            <p>GeckoDan&rsquo;s showcase collection: selected geckos that are part of our journey.</p>
            <Link className="band__more" href="/showcase">
              View collection <ArrowIcon />
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
              <PhotoSlot label="GeckoDan collection" />
              <p>Collection photos appear here once the owner adds them in the dashboard.</p>
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
          <PhotoSlot label="GeckoDan breeder" />
        </div>
        <div className="story-band__copy">
          <p className="band__kicker">Our Story</p>
          <h2 id="story-title" className="band__title">
            A Decade
            <br />
            of Passion
          </h2>
          {storyParas.length ? (
            <p>{excerpt(storyParas[0], 260)}</p>
          ) : (
            <p>
              <span className="placeholder-tag">Content coming soon</span> GeckoDan&rsquo;s story will be written by the owner.
            </p>
          )}
          <Link className="band__more" href="/our-story">
            Read the full story <ArrowIcon />
          </Link>
        </div>
        <ul className="story-band__stats">
          <li>
            <LineIcon name="leaf" />
            <strong>{business.experience_years ? `${business.experience_years}+` : 'Experience'}</strong>
            <span>{business.experience_years ? 'Years of Experience' : 'In the gecko world'}</span>
          </li>
          <li>
            <LineIcon name="diamond" />
            <strong>Quality</strong>
            <span>Always Prioritized</span>
          </li>
          <li>
            <LineIcon name="people" />
            <strong>Community</strong>
            <span>Part of the Journey</span>
          </li>
          <li>
            <LineIcon name="globe" />
            <strong>Pamulang</strong>
            <span>South Tangerang</span>
          </li>
        </ul>
      </section>

      {/* Achievements: only verified entries with evidence ever appear */}
      <section className="band band--b band--tight" aria-labelledby="awards-title">
        <Leaves side="left" />
        <Leaves side="right" />
        <div className="band__inner awards-band">
          <div className="awards-band__copy">
            <p className="band__kicker">In the Show Ring</p>
            <h2 id="awards-title" className="band__title">
              Achievements
            </h2>
            <p>Competition results and milestones appear here once they are verified.</p>
            <Link className="band__more" href="/achievements">
              View all achievements <ArrowIcon />
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
                    <span>Achievement coming soon</span>
                    <small>No verified achievements yet</small>
                  </li>
                ))}
          </ul>
        </div>
      </section>

      {/* Reviews */}
      <section className="band band--a band--tight" aria-labelledby="reviews-title">
        <Leaves side="left" />
        <Leaves side="right" />
        <div className="band__inner reviews-band">
          <div>
            <p className="band__kicker">Reviews &amp; Testimonials</p>
            <h2 id="reviews-title" className="band__title">
              Trust From Our Community
            </h2>
            <p>Words from customers and the gecko community.</p>
          </div>
          <div className="reviews-band__box">
            <h3>Google Reviews</h3>
            {readUrl || writeUrl ? (
              <>
                <p>Read or write a review on GeckoDan&rsquo;s Google Business profile.</p>
                <div className="inline-actions">
                  {readUrl ? (
                    <a className="btn btn-primary btn-sm" href={readUrl} target="_blank" rel="noopener noreferrer">
                      Read Google Reviews
                    </a>
                  ) : null}
                  {writeUrl ? (
                    <a className="btn btn-outline btn-sm" href={writeUrl} target="_blank" rel="noopener noreferrer">
                      Write a Review
                    </a>
                  ) : null}
                </div>
              </>
            ) : (
              <p>
                <span className="placeholder-tag">Link pending</span> GeckoDan&rsquo;s Google Reviews link has not been set yet.
              </p>
            )}
          </div>
          <div className="reviews-band__box">
            <h3>Customer Testimonials</h3>
            {firstTestimonial ? (
              <figure>
                <blockquote>{excerpt(firstTestimonial.body, 200)}</blockquote>
                <figcaption>
                  {firstTestimonial.author_name}
                  {firstTestimonial.author_location ? `, ${firstTestimonial.author_location}` : ''}
                </figcaption>
              </figure>
            ) : (
              <p>Customer testimonials appear here once customers give permission to publish them.</p>
            )}
            <Link className="band__more" href="/reviews">
              View all testimonials <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="band band--b band--tight" aria-labelledby="faq-title">
        <Leaves side="left" />
        <Leaves side="right" />
        <div className="band__inner faq-band">
          <div>
            <p className="band__kicker">FAQ &amp; Shipping</p>
            <h2 id="faq-title" className="band__title">
              Frequently Asked Questions
            </h2>
            <p>Information about ordering, care and shipping.</p>
            <Link className="band__more" href="/faq">
              All FAQs <ArrowIcon />
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
              <span className="placeholder-tag">Content coming soon</span> FAQ answers are being prepared. Meanwhile, ask us on WhatsApp.
            </p>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="band band--a band--tight" aria-labelledby="contact-title">
        <Leaves side="right" />
        <div className="band__inner contact-band">
          <div>
            <p className="band__kicker">Get in Touch</p>
            <h2 id="contact-title" className="band__title">
              Contact Us
            </h2>
            <p>{business.location}</p>
          </div>
          <a className="contact-band__wa" href={whatsappLink(wa, generalInquiryMessage())} target="_blank" rel="noopener noreferrer" aria-label={`Chat with GeckoDan on WhatsApp, ${phone}`}>
            <BrandIcon name="whatsapp" />
            <span>
              <small>Chat on WhatsApp</small>
              <strong>{phone}</strong>
            </span>
            <ArrowIcon />
          </a>
          <div className="contact-band__place">
            <PinIcon />
            <span>
              <small>Our Location</small>
              <strong>{business.location}</strong>
              {business.maps_url ? (
                <a href={business.maps_url} target="_blank" rel="noopener noreferrer">
                  View on Google Maps
                </a>
              ) : null}
            </span>
          </div>
          <div className="contact-band__social">
            <small>Follow Us</small>
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
