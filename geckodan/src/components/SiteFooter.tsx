import Image from 'next/image'
import Link from 'next/link'
import type { SiteSettings } from '@/lib/types'
import { formatWhatsappDisplay } from '@/lib/phone'
import { generalInquiryMessage, whatsappLink } from '@/lib/whatsapp'
import { BrandIcon } from './Icons'
import { activePlatforms } from './SocialLinks'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/geckos', label: 'Geckos' },
  { href: '/showcase', label: 'Showcase' },
  { href: '/our-story', label: 'Our Story' },
  { href: '/contact', label: 'Contact' },
]

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const { business, socials, hero } = settings
  const phone = formatWhatsappDisplay(business.whatsapp_number)
  return (
    <footer className="site-footer on-night">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link href="/" className="site-footer__logo">
            <Image src="/brand/geckodan-logo-256.png" alt="" width={44} height={42} />
            <span>{business.brand.toUpperCase()}</span>
          </Link>
          <p className="site-footer__tag">{hero.eyebrow || 'Premium Gecko Breeder'}</p>
          <address>{business.location}</address>
          {business.maps_url ? (
            <a href={business.maps_url} target="_blank" rel="noopener noreferrer">
              <BrandIcon name="maps" /> Open in Google Maps
            </a>
          ) : null}
        </div>

        <nav aria-label="Footer">
          <h2>Explore</h2>
          <ul>
            {NAV.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2>Contact</h2>
          <ul>
            <li>
              <a
                href={whatsappLink(business.whatsapp_number, generalInquiryMessage())}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Chat with GeckoDan on WhatsApp, ${phone}`}
              >
                <BrandIcon name="whatsapp" /> {phone}
              </a>
            </li>
            <li>
              <Link href="/shipping">Shipping</Link>
            </li>
            <li>
              <Link href="/faq">FAQ</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2>Follow</h2>
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
      <div className="site-footer__legal">
        <span>
          &copy; {new Date().getFullYear()} {business.brand}. All rights reserved.
        </span>
        <span>
          <Link href="/achievements">Achievements</Link> · <Link href="/reviews">Reviews</Link>
        </span>
      </div>
    </footer>
  )
}
