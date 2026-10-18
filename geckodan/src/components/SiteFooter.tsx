import Link from 'next/link'
import type { SiteSettings } from '@/lib/types'
import { generalInquiryMessage, whatsappLink } from '@/lib/whatsapp'
import { ArrowIcon, BrandIcon } from './Icons'
import { activePlatforms } from './SocialLinks'

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const { business, socials } = settings
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer on-night">
      <div className="wrap">
        <div className="site-footer__top">
          <div>
            <p className="site-footer__invite">Find your next gecko.</p>
            <a
              className="btn btn-primary"
              href={whatsappLink(business.whatsapp_number, generalInquiryMessage())}
              target="_blank"
              rel="noopener noreferrer"
            >
              Tanya via WhatsApp <ArrowIcon />
            </a>
          </div>
          <ul className="footer-links" aria-label="Kontak dan media sosial">
            <li>
              <a href={whatsappLink(business.whatsapp_number)} target="_blank" rel="noopener noreferrer">
                <BrandIcon name="whatsapp" /> WhatsApp {business.whatsapp_display}
              </a>
            </li>
            {business.maps_url ? (
              <li>
                <a href={business.maps_url} target="_blank" rel="noopener noreferrer">
                  <BrandIcon name="maps" /> Google Maps: {business.location}
                </a>
              </li>
            ) : null}
            {activePlatforms(socials).map((p) => (
              <li key={p.key}>
                <a href={socials[p.key]} target="_blank" rel="noopener noreferrer">
                  {p.icon ? <BrandIcon name={p.icon} /> : null} {p.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="site-footer__legal">
          <span>
            &copy; {year} {business.brand}. {business.location}.
          </span>
          <span>
            <Link href="/faq">FAQ</Link> · <Link href="/shipping">Shipping</Link> · <Link href="/reviews">Reviews</Link>
          </span>
        </div>
      </div>
      <p className="site-footer__name" aria-hidden="true">
        GECKODAN
      </p>
    </footer>
  )
}
