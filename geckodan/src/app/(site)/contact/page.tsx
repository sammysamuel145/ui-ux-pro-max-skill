import type { Metadata } from 'next'
import { Coupon } from '@/components/Coupon'
import { BrandIcon } from '@/components/Icons'
import { PageHead } from '@/components/PageHead'
import { activePlatforms } from '@/components/SocialLinks'
import { getSettings } from '@/lib/data/public'
import { formatWhatsappDisplay } from '@/lib/phone'
import { generalInquiryMessage, whatsappLink } from '@/lib/whatsapp'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact GeckoDan in Pamulang, South Tangerang via WhatsApp, Google Maps and social media.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const settings = await getSettings()
  const { business, socials } = settings
  return (
    <>
      <PageHead title="Contact" tagline={business.location}>
        <p className="lead">All questions and orders are handled through WhatsApp.</p>
      </PageHead>
      <section className="wrap" style={{ display: 'grid', gap: 56, paddingBottom: 'var(--section)' }}>
        <div className="inline-actions">
          <a className="btn btn-primary" href={whatsappLink(business.whatsapp_number, generalInquiryMessage())} target="_blank" rel="noopener noreferrer">
            <BrandIcon name="whatsapp" /> WhatsApp {formatWhatsappDisplay(business.whatsapp_number)}
          </a>
          {business.maps_url ? (
            <a className="btn btn-dark" href={business.maps_url} target="_blank" rel="noopener noreferrer">
              <BrandIcon name="maps" /> Open Google Maps
            </a>
          ) : null}
        </div>
        <div>
          <h2 className="headline" style={{ fontSize: 'clamp(1.75rem, 1.2rem + 2vw, 2.5rem)' }}>
            Social media
          </h2>
          <ul className="footer-links" style={{ marginTop: 16 }}>
            {activePlatforms(socials).map((p) => (
              <li key={p.key}>
                <a href={socials[p.key]} target="_blank" rel="noopener noreferrer" className="text-link">
                  {p.icon ? <BrandIcon name={p.icon} /> : null} GeckoDan on {p.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Coupon whatsappNumber={business.whatsapp_number} />
      </section>
    </>
  )
}
